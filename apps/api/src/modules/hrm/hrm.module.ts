import { Module } from '@nestjs/common';
import { HrmResolver, LeaveBalanceResolver, LeaveRequestResolver } from './hrm.resolver';
import { HrmService } from './hrm.service';

@Module({
  providers: [HrmResolver, LeaveBalanceResolver, LeaveRequestResolver, HrmService],
  exports: [HrmService],
})
export class HrmModule {}
