import { Module } from '@nestjs/common';
import { AdmissionResolver } from './admission.resolver';
import { AdmissionService } from './admission.service';

@Module({
  providers: [AdmissionResolver, AdmissionService],
  exports: [AdmissionService],
})
export class AdmissionModule {}
