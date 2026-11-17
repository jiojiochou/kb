import { constants, publicEncrypt } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RsaService } from './rsa.service.js';

const encrypt = (publicKey: string, password: string) =>
  publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(password),
  ).toString('base64');

describe('RsaService', () => {
  const folders: string[] = [];
  const createService = () => {
    const folder = mkdtempSync(join(tmpdir(), 'rsa-'));
    folders.push(folder);
    const service = new RsaService();
    service.initializeSecretKey(folder);
    return { service, folder };
  };

  afterAll(() => {
    for (const folder of folders) {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('decrypts a password encrypted with its public key', () => {
    const { service } = createService();
    const { publicKey } = service.getPublicKey();

    expect(service.decryptPassword(encrypt(publicKey, '密码password'))).toBe(
      '密码password',
    );
  });

  it('keeps the key version stable when reloading the same key pair', () => {
    const { service, folder } = createService();
    const reloaded = new RsaService();
    reloaded.initializeSecretKey(folder);

    expect(reloaded.getPublicKey().keyVersion).toBe(
      service.getPublicKey().keyVersion,
    );
  });

  it('changes the key version and rejects old ciphertext after regeneration', () => {
    const { service: oldService } = createService();
    const { service: newService } = createService();
    const oldCiphertext = encrypt(
      oldService.getPublicKey().publicKey,
      'password123',
    );

    expect(newService.getPublicKey().keyVersion).not.toBe(
      oldService.getPublicKey().keyVersion,
    );
    expect(() => newService.decryptPassword(oldCiphertext)).toThrow(
      '账号或密码错误',
    );
  });
});
