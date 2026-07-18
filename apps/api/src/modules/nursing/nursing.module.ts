import { Module } from '@nestjs/common';
import { NursingResolver } from './nursing.resolver';
import { NursingService } from './nursing.service';

@Module({
  providers: [NursingResolver, NursingService],
  exports: [NursingService],
})
export class NursingModule {}
