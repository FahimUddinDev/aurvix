import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Prescription service methods
}
