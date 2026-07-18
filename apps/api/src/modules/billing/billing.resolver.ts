import { Resolver } from '@nestjs/graphql';
import { BillingService } from './billing.service';

@Resolver()
export class BillingResolver {
  constructor(private readonly Service: BillingService) {}
  // TODO: implement Billing GraphQL operations
}
