import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiResponse } from '../interceptors/response.interceptor.js';

/** 将所有异常转换为 { code, message, data: null }，与成功响应结构一致。 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number;
    let message: string;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = this.getHttpExceptionMessage(exception);
    } else {
      // 非预期异常的细节只写入日志，不暴露给调用方。
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiResponse<null> = { code: status, message, data: null };
    response.status(status).json(body);
  }

  private getHttpExceptionMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') {
      return res;
    }
    const { message } = res as { message?: unknown };
    // ValidationPipe 的校验错误 message 为数组，合并为单个字符串。
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
    return exception.message;
  }
}
