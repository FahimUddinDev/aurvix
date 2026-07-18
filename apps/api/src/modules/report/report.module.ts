import { Module } from '@nestjs/common';
import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';

@Module({
  providers: [ReportResolver, ReportService],
  exports: [ReportService],
})
export class ReportModule {}
