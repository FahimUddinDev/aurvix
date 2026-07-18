import { Resolver } from '@nestjs/graphql';
import { AppointmentService } from './appointment.service';

@Resolver()
export class AppointmentResolver {
  constructor(private readonly Service: AppointmentService) {}
  // TODO: implement Appointment GraphQL operations
}
