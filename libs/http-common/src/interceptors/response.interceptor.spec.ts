import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  const run = (statusCode: number, value: unknown) => {
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(value) };
    return lastValueFrom(interceptor.intercept(context, next));
  };

  it('wraps the handler result with the HTTP status code', async () => {
    await expect(run(201, { id: '1' })).resolves.toEqual({
      code: 201,
      message: 'success',
      data: { id: '1' },
    });
  });

  it('uses null data when the handler returns nothing', async () => {
    await expect(run(200, undefined)).resolves.toEqual({
      code: 200,
      message: 'success',
      data: null,
    });
  });

  it('keeps 204 responses empty', async () => {
    await expect(run(204, undefined)).resolves.toBeUndefined();
  });
});
