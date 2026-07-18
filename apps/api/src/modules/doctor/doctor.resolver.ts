import { Resolver } from '@nestjs/graphql';
import { DoctorService } from './doctor.service';

@Resolver()
export class DoctorResolver {
  constructor(private readonly Service: DoctorService) {}
  // TODO: implement Doctor GraphQL operations
}
