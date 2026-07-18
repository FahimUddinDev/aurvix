import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class HrmService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Hrm service methods
}
