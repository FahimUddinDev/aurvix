import { Module } from '@nestjs/common';
import { LaboratoryResolver, LabResultResolver } from './laboratory.resolver';
import { LaboratoryService } from './laboratory.service';

@Module({
  providers: [LaboratoryResolver, LabResultResolver, LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
