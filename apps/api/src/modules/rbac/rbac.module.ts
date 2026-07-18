import { Module } from '@nestjs/common';
import { RbacResolver } from './rbac.resolver';
import { RbacService } from './rbac.service';

@Module({
  providers: [RbacResolver, RbacService],
  exports: [RbacService],
})
export class RbacModule {}
