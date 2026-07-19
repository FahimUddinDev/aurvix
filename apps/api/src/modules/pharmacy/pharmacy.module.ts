import { Module } from '@nestjs/common';
import { PharmacyResolver, StockBatchResolver } from './pharmacy.resolver';
import { PharmacyService } from './pharmacy.service';

@Module({
  providers: [PharmacyResolver, StockBatchResolver, PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
