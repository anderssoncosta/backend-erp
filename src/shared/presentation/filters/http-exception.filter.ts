import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const requestId =
      (request.headers['x-correlation-id'] as string) ?? randomUUID();

    const error =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as Record<string, unknown>)
        : { message: exceptionResponse };

    const body = {
      success: false,
      statusCode: status,
      error: HttpStatus[status] ?? 'UNKNOWN_ERROR',
      message: error.message ?? exception.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        JSON.stringify(body),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status}: ${body.message}`);
    }

    response.status(status).json(body);
  }
}
