import { Resolver } from '@nestjs/graphql';
import { InventoryService } from './inventory.service';

@Resolver()
export class InventoryResolver {
  constructor(private readonly Service: InventoryService) {}
  // TODO: implement Inventory GraphQL operations
}
