import { Resolver } from '@nestjs/graphql';
import { DischargeService } from './discharge.service';

@Resolver()
export class DischargeResolver {
  constructor(private readonly Service: DischargeService) {}
  // TODO: implement Discharge GraphQL operations
}
