import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Crm service methods
}
