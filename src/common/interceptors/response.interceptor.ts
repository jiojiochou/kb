import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

/** 所有接口统一的响应结构；code 与 HTTP 状态码一致。 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/** 将 controller 的返回值包装为 { code, message, data }。 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        // 204 按 HTTP 规范不能携带响应体。
        if (response.statusCode === HttpStatus.NO_CONTENT) {
          return undefined;
        }
        return {
          code: response.statusCode,
          message: 'success',
          data: data ?? null,
        };
      }),
    );
  }
}
