import { Resolver } from '@nestjs/graphql';
import { AuditService } from './audit.service';

@Resolver()
export class AuditResolver {
  constructor(private readonly Service: AuditService) {}
  // TODO: implement Audit GraphQL operations
}
