import { Module } from '@nestjs/common';
import { HospitalResolver } from './hospital.resolver';
import { HospitalService } from './hospital.service';

@Module({
  providers: [HospitalResolver, HospitalService],
  exports: [HospitalService],
})
export class HospitalModule {}
