import { Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
  constructor(private readonly Service: NotificationService) {}
  // TODO: implement Notification GraphQL operations
}
