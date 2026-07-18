import { Module } from '@nestjs/common';
import { PharmacyResolver } from './pharmacy.resolver';
import { PharmacyService } from './pharmacy.service';

@Module({
  providers: [PharmacyResolver, PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
