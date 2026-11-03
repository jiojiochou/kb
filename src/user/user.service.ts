import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SnowflakeIdService } from '@street-devs/nest-snowflake-id';
import * as bcrypt from 'bcrypt';
import { Profile } from 'passport-github2';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { type GoogleInfo } from 'src/login/google.strategy';
import { CreateUserDto } from './dto/create.dto';
import {
  IdentityProvider,
  UserIdentity,
} from './entities/user-identity.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly snowflakeIdService: SnowflakeIdService,
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserIdentity)
    private readonly identityRepository: Repository<UserIdentity>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const account = this.normalizeAccount(createUserDto.account);
    const email = this.normalizeEmail(createUserDto.email);
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            id: this.generateId(),
            email,
            emailVerifiedAt: null,
            displayName: createUserDto.displayName ?? null,
            firstName: createUserDto.firstName ?? null,
            lastName: createUserDto.lastName ?? null,
            avatar: createUserDto.avatar ?? null,
            lastLoginTime: null,
          }),
        );

        await manager.save(
          manager.create(UserIdentity, {
            userId: user.id,
            provider: IdentityProvider.password,
            providerUserId: account,
            passwordHash,
          }),
        );
        return user;
      });
    } catch (error) {
      this.throwConflictForUniqueViolation(error, '账号或邮箱已存在');
      throw error;
    }
  }

  async findPasswordIdentity(account: string) {
    return this.identityRepository
      .createQueryBuilder('identity')
      .addSelect('identity.passwordHash')
      .leftJoinAndSelect('identity.user', 'user')
      .where('identity.provider = :provider', {
        provider: IdentityProvider.password,
      })
      .andWhere('identity.providerUserId = :account', {
        account: this.normalizeAccount(account),
      })
      .getOne();
  }

  async recordPasswordLogin(user: User) {
    return this.recordLogin(user);
  }

  async loginOrRegisterByGoogle(info: GoogleInfo) {
    const existing = await this.findIdentity(IdentityProvider.google, info.id);
    if (existing) return this.recordLogin(existing.user);

    const verifiedEmail =
      info.email && info.emailVerified ? this.normalizeEmail(info.email) : null;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const identity = await this.findIdentityWithManager(
          manager,
          IdentityProvider.google,
          info.id,
        );
        if (identity)
          return this.recordLoginWithManager(manager, identity.user);

        // Google 仅在返回已验证邮箱时，才绑定到已有用户。
        let user = verifiedEmail
          ? await manager.findOneBy(User, { email: verifiedEmail })
          : null;

        if (user && !user.emailVerifiedAt) {
          throw new ConflictException(
            '该邮箱已被未验证账号使用，请先完成原账号邮箱验证后再绑定 Google',
          );
        }

        if (!user) {
          user = await manager.save(
            manager.create(User, {
              id: this.generateId(),
              email: verifiedEmail,
              emailVerifiedAt: verifiedEmail ? new Date() : null,
              displayName: info.displayName ?? null,
              firstName: info.firstName ?? null,
              lastName: info.lastName ?? null,
              avatar: info.picture ?? null,
              lastLoginTime: new Date(),
            }),
          );
        } else {
          user = await this.recordLoginWithManager(manager, user);
        }

        await this.createOAuthIdentity(
          manager,
          user.id,
          IdentityProvider.google,
          info.id,
        );
        return user;
      });
    } catch (error) {
      return this.resolveConcurrentOAuthLogin(
        error,
        IdentityProvider.google,
        info.id,
      );
    }
  }

  async loginOrRegisterByGithub(info: Profile) {
    const existing = await this.findIdentity(IdentityProvider.github, info.id);
    if (existing) return this.recordLogin(existing.user);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const identity = await this.findIdentityWithManager(
          manager,
          IdentityProvider.github,
          info.id,
        );
        if (identity)
          return this.recordLoginWithManager(manager, identity.user);

        // GitHub 首次登录始终创建独立用户，不通过邮箱自动合并。
        const user = await manager.save(
          manager.create(User, {
            id: this.generateId(),
            email: null,
            emailVerifiedAt: null,
            displayName: info.displayName ?? info.username ?? null,
            firstName: null,
            lastName: null,
            avatar: info.photos?.[0]?.value ?? null,
            lastLoginTime: new Date(),
          }),
        );

        await this.createOAuthIdentity(
          manager,
          user.id,
          IdentityProvider.github,
          info.id,
        );
        return user;
      });
    } catch (error) {
      return this.resolveConcurrentOAuthLogin(
        error,
        IdentityProvider.github,
        info.id,
      );
    }
  }

  private findIdentity(provider: IdentityProvider, providerUserId: string) {
    return this.identityRepository.findOne({
      where: { provider, providerUserId },
      relations: { user: true },
    });
  }

  private findIdentityWithManager(
    manager: EntityManager,
    provider: IdentityProvider,
    providerUserId: string,
  ) {
    return manager.findOne(UserIdentity, {
      where: { provider, providerUserId },
      relations: { user: true },
    });
  }

  private async createOAuthIdentity(
    manager: EntityManager,
    userId: string,
    provider: IdentityProvider,
    providerUserId: string,
  ) {
    await manager.save(
      manager.create(UserIdentity, {
        userId,
        provider,
        providerUserId,
        passwordHash: null,
      }),
    );
  }

  private async recordLogin(user: User) {
    user.lastLoginTime = new Date();
    return this.userRepository.save(user);
  }

  private async recordLoginWithManager(manager: EntityManager, user: User) {
    user.lastLoginTime = new Date();
    return manager.save(user);
  }

  private async resolveConcurrentOAuthLogin(
    error: unknown,
    provider: IdentityProvider,
    providerUserId: string,
  ) {
    if (!this.isUniqueViolation(error)) throw error;

    const identity = await this.findIdentity(provider, providerUserId);
    if (!identity) throw error;
    return this.recordLogin(identity.user);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeAccount(account: string) {
    return account.trim().toLowerCase();
  }

  private generateId() {
    return this.snowflakeIdService.generate().toString();
  }

  private isUniqueViolation(error: unknown): error is QueryFailedError {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError: { code?: string } })
        .driverError?.code === '23505'
    );
  }

  private throwConflictForUniqueViolation(error: unknown, message: string) {
    if (this.isUniqueViolation(error)) throw new ConflictException(message);
  }
}
