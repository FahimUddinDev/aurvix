import { Resolver } from '@nestjs/graphql';
import { BloodBankService } from './blood-bank.service';

@Resolver()
export class BloodBankResolver {
  constructor(private readonly Service: BloodBankService) {}
  // TODO: implement BloodBank GraphQL operations
}
