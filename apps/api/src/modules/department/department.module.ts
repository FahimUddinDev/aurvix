import { Module } from '@nestjs/common';
import { DepartmentResolver } from './department.resolver';
import { DepartmentService } from './department.service';

@Module({
  providers: [DepartmentResolver, DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
