import { Module } from '@nestjs/common';
import { DischargeResolver } from './discharge.resolver';
import { DischargeService } from './discharge.service';

@Module({
  providers: [DischargeResolver, DischargeService],
  exports: [DischargeService],
})
export class DischargeModule {}
