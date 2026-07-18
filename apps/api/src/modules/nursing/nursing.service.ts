import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class NursingService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Nursing service methods
}
