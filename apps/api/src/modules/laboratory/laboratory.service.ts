import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class LaboratoryService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Laboratory service methods
}
