import { Resolver } from '@nestjs/graphql';
import { PrescriptionService } from './prescription.service';

@Resolver()
export class PrescriptionResolver {
  constructor(private readonly Service: PrescriptionService) {}
  // TODO: implement Prescription GraphQL operations
}
