import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, InputType, ID } from '@nestjs/graphql';
import { DepartmentService } from './department.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType('Department')
class DepartmentType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) code?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => ID, { nullable: true }) headUserId?: string;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
class CreateDepartmentInput {
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field() code!: string;
  @Field({ nullable: true }) description?: string;
}

@InputType()
class UpdateDepartmentInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) code?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) isActive?: boolean;
}

@Resolver(() => DepartmentType)
export class DepartmentResolver {
  constructor(private readonly departmentService: DepartmentService) {}

  @Query(() => [DepartmentType], { description: 'Get all departments for current hospital' })
  async departments(@CurrentUser() currentUser: any): Promise<DepartmentType[]> {
    return this.departmentService.listDepartments(currentUser.hospitalId) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => DepartmentType, { description: 'Create a new department' })
  async createDepartment(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateDepartmentInput,
  ): Promise<DepartmentType> {
    return this.departmentService.createDepartment(
      currentUser.hospitalId,
      input,
      currentUser.sub,
    ) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => DepartmentType, { description: 'Update an existing department' })
  async updateDepartment(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDepartmentInput,
  ): Promise<DepartmentType> {
    return this.departmentService.updateDepartment(id, input, currentUser.sub) as any;
  }
}
