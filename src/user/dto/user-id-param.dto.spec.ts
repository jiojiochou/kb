import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UserIdParamDto } from './user-id-param.dto.js';

const isValid = (id: unknown) =>
  validateSync(plainToInstance(UserIdParamDto, { id })).length === 0;

describe('UserIdParamDto', () => {
  it.each(['1', '123456789012345678', '9223372036854775807'])(
    'accepts %s',
    (id) => {
      expect(isValid(id)).toBe(true);
    },
  );

  it.each(['', '0', '012', '-1', '1.5', 'abc', '9223372036854775808', ' 1'])(
    'rejects %j',
    (id) => {
      expect(isValid(id)).toBe(false);
    },
  );
});
