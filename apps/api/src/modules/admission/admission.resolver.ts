import { Resolver } from '@nestjs/graphql';
import { AdmissionService } from './admission.service';

@Resolver()
export class AdmissionResolver {
  constructor(private readonly Service: AdmissionService) {}
  // TODO: implement Admission GraphQL operations
}
