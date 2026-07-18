import { Module } from '@nestjs/common';
import { RadiologyResolver } from './radiology.resolver';
import { RadiologyService } from './radiology.service';

@Module({
  providers: [RadiologyResolver, RadiologyService],
  exports: [RadiologyService],
})
export class RadiologyModule {}
