import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: implement Consent service methods
}
