import { Resolver } from '@nestjs/graphql';
import { LaboratoryService } from './laboratory.service';

@Resolver()
export class LaboratoryResolver {
  constructor(private readonly Service: LaboratoryService) {}
  // TODO: implement Laboratory GraphQL operations
}
