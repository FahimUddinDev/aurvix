import { Resolver } from '@nestjs/graphql';
import { ReportService } from './report.service';

@Resolver()
export class ReportResolver {
  constructor(private readonly Service: ReportService) {}
  // TODO: implement Report GraphQL operations
}
