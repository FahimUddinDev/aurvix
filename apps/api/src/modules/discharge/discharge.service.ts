import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DischargeService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Discharge service methods
}
