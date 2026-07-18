import { Resolver } from '@nestjs/graphql';
import { CrmService } from './crm.service';

@Resolver()
export class CrmResolver {
  constructor(private readonly Service: CrmService) {}
  // TODO: implement Crm GraphQL operations
}
