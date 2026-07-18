import { Resolver } from '@nestjs/graphql';
import { HrmService } from './hrm.service';

@Resolver()
export class HrmResolver {
  constructor(private readonly Service: HrmService) {}
  // TODO: implement Hrm GraphQL operations
}
