import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'nid', 'nidEncrypted'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const req = ctx.getContext().req;

    const operation = info.operation?.operation ?? 'unknown';
    const field = info.fieldName;
    const userId = req.user?.sub ?? 'anonymous';
    const start = Date.now();

    // Sanitize variables — never log sensitive fields
    const variables = this.sanitize(ctx.getArgs());

    this.logger.log(
      `→ ${operation.toUpperCase()} ${field} | user=${userId} | vars=${JSON.stringify(variables)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`← ${field} | ${Date.now() - start}ms`);
        },
        error: (err: Error) => {
          this.logger.error(`✗ ${field} | ${err.message} | ${Date.now() - start}ms`);
        },
      }),
    );
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
        result[k] = '[REDACTED]';
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        result[k] = this.sanitize(v as Record<string, unknown>);
      } else {
        result[k] = v;
      }
    }
    return result;
  }
}
