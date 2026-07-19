import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, InputType, ID, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserStatus } from '@prisma/client';

@ObjectType('UserRole')
export class UserRoleType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() displayName!: string;
}

@ObjectType('User')
export class UserType {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => String) status!: UserStatus;
  @Field(() => ID) roleId!: string;
  @Field(() => UserRoleType, { nullable: true }) role?: UserRoleType;
  @Field(() => ID) hospitalId!: string;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
class PaginatedUsers {
  @Field(() => [UserType]) items!: UserType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
  @Field(() => Int) totalPages!: number;
  @Field() hasNextPage!: boolean;
  @Field() hasPrevPage!: boolean;
}

@InputType()
class UserFilters {
  @Field({ nullable: true }) roleId?: string;
  @Field({ nullable: true }) status?: string;
  @Field({ nullable: true }) query?: string;
}

@InputType()
class PaginationInput {
  @Field(() => Int, { defaultValue: 1 }) page!: number;
  @Field(() => Int, { defaultValue: 10 }) limit!: number;
}

@InputType()
class CreateUserInput {
  @Field() email!: string;
  @Field() password!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => ID) roleId!: string;
}

@InputType()
class UpdateUserInput {
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => ID, { nullable: true }) roleId?: string;
  @Field({ nullable: true }) status?: string;
}

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Query(() => PaginatedUsers, { description: 'Get paginated list of users' })
  async users(
    @CurrentUser() currentUser: any,
    @Args('filters', { nullable: true }) filters: UserFilters,
    @Args('pagination', { nullable: true }) pagination: PaginationInput,
  ): Promise<PaginatedUsers> {
    const activeFilters = filters || {};
    const activePagination = pagination || { page: 1, limit: 10 };

    const statusFilter = activeFilters.status ? (activeFilters.status as UserStatus) : undefined;

    return this.userService.listUsers(
      currentUser.hospitalId,
      { ...activeFilters, status: statusFilter },
      activePagination,
    ) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => UserType, { description: 'Create a new user' })
  async createUser(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateUserInput,
  ): Promise<UserType> {
    return this.userService.createUser({
      email: input.email,
      passwordHash: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId,
      hospitalId: currentUser.hospitalId,
    }) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => UserType, { description: 'Update an existing user' })
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserType> {
    const statusFilter = input.status ? (input.status as UserStatus) : undefined;
    return this.userService.updateUser(id, {
      ...input,
      status: statusFilter,
    }) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => UserType, { description: 'Deactivate a user' })
  async deactivateUser(@Args('id', { type: () => ID }) id: string): Promise<UserType> {
    return this.userService.deactivateUser(id) as any;
  }
}
