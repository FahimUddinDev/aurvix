import { Resolver } from '@nestjs/graphql';
import { PharmacyService } from './pharmacy.service';

@Resolver()
export class PharmacyResolver {
  constructor(private readonly Service: PharmacyService) {}
  // TODO: implement Pharmacy GraphQL operations
}
