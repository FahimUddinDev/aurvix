import { Module } from '@nestjs/common';
import { BloodBankResolver } from './blood-bank.resolver';
import { BloodBankService } from './blood-bank.service';

@Module({
  providers: [BloodBankResolver, BloodBankService],
  exports: [BloodBankService],
})
export class BloodBankModule {}
