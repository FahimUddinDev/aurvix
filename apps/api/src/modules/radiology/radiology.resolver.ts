import { Resolver } from '@nestjs/graphql';
import { RadiologyService } from './radiology.service';

@Resolver()
export class RadiologyResolver {
  constructor(private readonly Service: RadiologyService) {}
  // TODO: implement Radiology GraphQL operations
}
