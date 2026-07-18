import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class AdmissionService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Admission service methods
}
