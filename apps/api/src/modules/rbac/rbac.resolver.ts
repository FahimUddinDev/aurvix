import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, InputType, ID } from '@nestjs/graphql';
import { RbacService } from './rbac.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType('Permission')
class PermissionType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() displayName!: string;
  @Field() module!: string;
  @Field() action!: string;
  @Field({ nullable: true }) description?: string;
}

@ObjectType('RolePermission')
class RolePermissionType {
  @Field(() => ID) id!: string;
  @Field(() => ID) roleId!: string;
  @Field(() => ID) permissionId!: string;
  @Field(() => PermissionType, { nullable: true }) permission?: PermissionType;
}

@ObjectType('Role')
class RoleType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() displayName!: string;
  @Field({ nullable: true }) description?: string;
  @Field() isSystem!: boolean;
  @Field(() => [RolePermissionType], { defaultValue: [] }) rolePermissions!: RolePermissionType[];
}

@InputType()
class CreateRoleInput {
  @Field() name!: string;
  @Field() displayName!: string;
  @Field({ nullable: true }) description?: string;
}

@InputType()
class UpdateRoleInput {
  @Field({ nullable: true }) displayName?: string;
  @Field({ nullable: true }) description?: string;
}

@Resolver(() => RoleType)
export class RbacResolver {
  constructor(private readonly rbacService: RbacService) {}

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Query(() => [RoleType], { description: 'Get all roles' })
  async roles(): Promise<RoleType[]> {
    return this.rbacService.listRoles() as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Query(() => [PermissionType], { description: 'Get all system permissions' })
  async permissions(): Promise<PermissionType[]> {
    return this.rbacService.listPermissions() as any;
  }

  @Roles('SUPER_ADMIN')
  @Mutation(() => RoleType, { description: 'Create a new user role' })
  async createRole(@Args('input') input: CreateRoleInput): Promise<RoleType> {
    return this.rbacService.createRole(input) as any;
  }

  @Roles('SUPER_ADMIN')
  @Mutation(() => RoleType, { description: 'Update an existing user role' })
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoleInput,
  ): Promise<RoleType> {
    return this.rbacService.updateRole(id, input) as any;
  }

  @Roles('SUPER_ADMIN')
  @Mutation(() => Boolean, { description: 'Delete an existing user role' })
  async deleteRole(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.rbacService.deleteRole(id);
    return true;
  }

  @Roles('SUPER_ADMIN')
  @Mutation(() => RoleType, { description: 'Assign permissions to a user role' })
  async assignPermissionsToRole(
    @Args('roleId', { type: () => ID }) roleId: string,
    @Args('permissionIds', { type: () => [ID] }) permissionIds: string[],
  ): Promise<RoleType> {
    return this.rbacService.assignPermissionsToRole(roleId, permissionIds) as any;
  }
}
