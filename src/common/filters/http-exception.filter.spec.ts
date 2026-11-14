import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const run = (exception: unknown) => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    filter.catch(exception, host);
    return { status, body: json.mock.calls[0][0] };
  };

  it('uses the message of a built-in HTTP exception', () => {
    const { status, body } = run(new ConflictException('账号已被注册'));

    expect(status).toHaveBeenCalledWith(409);
    expect(body).toEqual({ code: 409, message: '账号已被注册', data: null });
  });

  it('joins validation error messages into one string', () => {
    const { body } = run(
      new BadRequestException(['email must be an email', 'password too short']),
    );

    expect(body).toEqual({
      code: 400,
      message: 'email must be an email; password too short',
      data: null,
    });
  });

  it('handles an HttpException created with a plain string', () => {
    const { status, body } = run(
      new HttpException('发送次数已达上限', HttpStatus.TOO_MANY_REQUESTS),
    );

    expect(status).toHaveBeenCalledWith(429);
    expect(body).toEqual({ code: 429, message: '发送次数已达上限', data: null });
  });

  it('hides unexpected error details behind a generic 500', () => {
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const { status, body } = run(new Error('connection refused'));

    expect(status).toHaveBeenCalledWith(500);
    expect(body).toEqual({ code: 500, message: '服务器内部错误', data: null });
    expect(logError).toHaveBeenCalledWith(
      'connection refused',
      expect.any(String),
    );
    logError.mockRestore();
  });
});
