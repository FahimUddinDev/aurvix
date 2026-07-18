import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Pharmacy service methods
}
