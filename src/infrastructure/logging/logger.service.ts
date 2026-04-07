import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger, format, transports, Logger } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly winstonLogger: Logger;

  constructor(private readonly config: ConfigService) {
    this.winstonLogger = createLogger({
      level: config.get('LOG_LEVEL', 'info'),
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: {
        service: config.get('APP_NAME', 'erp-api'),
        environment: config.get('NODE_ENV', 'development'),
        version: process.env.npm_package_version ?? '1.0.0',
      },
      transports: [
        new transports.Console({
          format:
            config.get('NODE_ENV') === 'production'
              ? format.json()
              : format.combine(
                  format.colorize(),
                  format.printf(({ timestamp, level, message, context, ...meta }) => {
                    const ctx = context ? `[${context}]` : '';
                    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                  }),
                ),
        }),
        new DailyRotateFile({
          dirname: config.get('LOG_DIR', './logs'),
          filename: 'erp-api-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: config.get('LOG_MAX_SIZE', '20m'),
          maxFiles: config.get('LOG_MAX_FILES', '14d'),
          format: format.json(),
        }),
        new DailyRotateFile({
          dirname: config.get('LOG_DIR', './logs'),
          filename: 'erp-api-error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          format: format.json(),
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.winstonLogger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string): void {
    this.winstonLogger.error(message, { context, trace });
  }

  warn(message: string, context?: string): void {
    this.winstonLogger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.winstonLogger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.winstonLogger.verbose(message, { context });
  }
}
