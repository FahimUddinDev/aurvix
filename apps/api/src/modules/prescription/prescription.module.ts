import { Module } from '@nestjs/common';
import { PrescriptionResolver } from './prescription.resolver';
import { PrescriptionService } from './prescription.service';

@Module({
  providers: [PrescriptionResolver, PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
