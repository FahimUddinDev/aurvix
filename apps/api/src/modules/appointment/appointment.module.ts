import { Module } from '@nestjs/common';
import { AppointmentResolver } from './appointment.resolver';
import { AppointmentService } from './appointment.service';

@Module({
  providers: [AppointmentResolver, AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
