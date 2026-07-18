import { Resolver } from '@nestjs/graphql';
import { VisitService } from './visit.service';

@Resolver()
export class VisitResolver {
  constructor(private readonly Service: VisitService) {}
  // TODO: implement Visit GraphQL operations
}
