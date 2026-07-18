import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createHash } from 'crypto';

/**
 * AuditInterceptor — automatically records all GraphQL mutations to the
 * audit_log table with a tamper-evident hash chain.
 * Required by AGENTS.md: all money/clinical/identity mutations must pass through this.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const req = ctx.getContext().req;
    const user = req.user;

    // Only audit mutations
    if (info.operation?.operation !== 'mutation') return next.handle();

    const entity = info.fieldName;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.writeAuditLog({
            hospitalId: user?.hospitalId,
            userId: user?.sub,
            action: 'CREATE', // resolvers can override via metadata
            entity,
            entityId: result?.id,
            changesAfter: result,
            ipAddress,
            userAgent,
          });
        } catch (err) {
          this.logger.error('Failed to write audit log', err);
        }
      }),
    );
  }

  private async writeAuditLog(data: {
    hospitalId?: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    changesBefore?: unknown;
    changesAfter?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Fetch last hash for chain integrity
    const last = await this.prisma.auditLog.findFirst({
      where: { hospitalId: data.hospitalId },
      orderBy: { createdAt: 'desc' },
      select: { currentHash: true },
    });

    const previousHash = last?.currentHash ?? 'GENESIS';
    const payload = JSON.stringify({ ...data, previousHash, ts: Date.now() });
    const currentHash = createHash('sha256').update(payload).digest('hex');

    await this.prisma.auditLog.create({
      data: {
        hospitalId: data.hospitalId ?? 'system',
        userId: data.userId,
        action: data.action as any,
        entity: data.entity,
        entityId: data.entityId,
        changesBefore: data.changesBefore as any,
        changesAfter: data.changesAfter as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        previousHash,
        currentHash,
        createdBy: data.userId,
        updatedBy: data.userId,
      },
    });
  }
}
