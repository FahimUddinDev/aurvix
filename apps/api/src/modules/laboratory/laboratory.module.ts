import { Module } from '@nestjs/common';
import { LaboratoryResolver } from './laboratory.resolver';
import { LaboratoryService } from './laboratory.service';

@Module({
  providers: [LaboratoryResolver, LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
