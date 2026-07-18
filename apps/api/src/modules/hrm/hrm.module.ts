import { Module } from '@nestjs/common';
import { HrmResolver } from './hrm.resolver';
import { HrmService } from './hrm.service';

@Module({
  providers: [HrmResolver, HrmService],
  exports: [HrmService],
})
export class HrmModule {}
