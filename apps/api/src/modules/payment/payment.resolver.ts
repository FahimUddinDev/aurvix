import { Resolver } from '@nestjs/graphql';
import { PaymentService } from './payment.service';

@Resolver()
export class PaymentResolver {
  constructor(private readonly Service: PaymentService) {}
  // TODO: implement Payment GraphQL operations
}
