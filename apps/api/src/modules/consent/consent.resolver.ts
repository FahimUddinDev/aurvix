import { Resolver } from '@nestjs/graphql';
import { ConsentService } from './consent.service';

@Resolver()
export class ConsentResolver {
  constructor(private readonly Service: ConsentService) {}
  // TODO: implement Consent GraphQL operations
}
