import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class RsaService {
  private publicKey: string;
  private privateKey: string;

  initializeSecretKey(folder = join(process.cwd(), 'secrets')) {
    const publicKeyPath = join(folder, 'rsa-public.pem');
    const privateKeyPath = join(folder, 'rsa-private.pem');
    const publicKeyExists = existsSync(publicKeyPath);
    const privateKeyExists = existsSync(privateKeyPath);

    if (!publicKeyExists && !privateKeyExists) {
      this.generateSecretKey(folder);
      return;
    }

    if (!publicKeyExists || !privateKeyExists) {
      throw new Error('RSA key pair is incomplete');
    }

    this.loadSecretKey(publicKeyPath, privateKeyPath);
  }

  generateSecretKey(folder = join(process.cwd(), 'secrets')) {
    mkdirSync(folder, { recursive: true });

    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 3072,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const publicKeyPath = join(folder, 'rsa-public.pem');
    const privateKeyPath = join(folder, 'rsa-private.pem');

    writeFileSync(publicKeyPath, publicKey);
    writeFileSync(privateKeyPath, privateKey, {
      mode: 0o600,
    });

    console.log('RSA keys generated');

    this.loadSecretKey(publicKeyPath, privateKeyPath);
  }

  private loadSecretKey(publicKeyPath: string, privateKeyPath: string) {
    this.publicKey = readFileSync(publicKeyPath, 'utf8');
    this.privateKey = readFileSync(privateKeyPath, 'utf8');
  }

  getPublicKey() {
    /**
     * TODO:
     * 设置响应头Cache-Control: no-store, 避免浏览器缓存旧公钥带来的密钥轮换问题
     */
    return {
      publicKey: this.publicKey,
      algorithm: 'RSA-OAEP-256',
      keyVersion: 'v1',
    };
  }

  decryptPassword(encryptedPassword: string): string {
    if (
      typeof encryptedPassword !== 'string' ||
      encryptedPassword.length === 0 ||
      encryptedPassword.length > 2048 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(encryptedPassword)
    ) {
      throw new BadRequestException('无效的加密密码');
    }

    try {
      const encryptedBuffer = Buffer.from(encryptedPassword, 'base64');

      // RSA-3072 密文固定为 384 字节
      if (
        encryptedBuffer.length !== 384 ||
        encryptedBuffer.toString('base64') !== encryptedPassword
      ) {
        throw new Error('Invalid ciphertext');
      }

      const decrypted = privateDecrypt(
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedBuffer,
      );

      const password = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(decrypted);

      if (password.length === 0 || Buffer.byteLength(password) > 1024) {
        throw new Error('Invalid password');
      }

      return password;
    } catch {
      // 不向客户端暴露解密错误、密钥信息等内部细节
      throw new UnauthorizedException('账号或密码错误');
    }
  }
}
