import { Resolver } from '@nestjs/graphql';
import { NursingService } from './nursing.service';

@Resolver()
export class NursingResolver {
  constructor(private readonly Service: NursingService) {}
  // TODO: implement Nursing GraphQL operations
}
