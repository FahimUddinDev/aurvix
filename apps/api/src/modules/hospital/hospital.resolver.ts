import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, InputType, ID, Int } from '@nestjs/graphql';
import { HospitalService } from './hospital.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType('Branch')
class BranchType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) phone?: string;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('Hospital')
class HospitalType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) addressBn?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field() timezone!: string;
  @Field() currency!: string;
  @Field() uhidPrefix!: string;
  @Field(() => Int) fiscalYearStart!: number;
  @Field() isActive!: boolean;
  @Field(() => [BranchType], { defaultValue: [] }) branches!: BranchType[];
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
class UpdateHospitalInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) addressBn?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) timezone?: string;
  @Field({ nullable: true }) currency?: string;
  @Field({ nullable: true }) uhidPrefix?: string;
}

@InputType()
class CreateBranchInput {
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) phone?: string;
}

@InputType()
class UpdateBranchInput {
  @Field({ nullable: true }) name?: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) isActive?: boolean;
}

@Resolver(() => HospitalType)
export class HospitalResolver {
  constructor(private readonly hospitalService: HospitalService) {}

  @Query(() => HospitalType, { description: 'Get details of the current hospital' })
  async hospital(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID, nullable: true }) id?: string,
  ): Promise<HospitalType> {
    const targetId = id || currentUser.hospitalId;
    return this.hospitalService.findHospitalById(targetId) as any;
  }

  @Query(() => [BranchType], { description: 'Get all branches of the current hospital' })
  async branches(@CurrentUser() currentUser: any): Promise<BranchType[]> {
    return this.hospitalService.listBranches(currentUser.hospitalId) as any;
  }

  @Roles('SUPER_ADMIN')
  @Mutation(() => HospitalType, { description: 'Update hospital core configurations' })
  async updateHospital(
    @CurrentUser() currentUser: any,
    @Args('input') input: UpdateHospitalInput,
    @Args('id', { type: () => ID, nullable: true }) id?: string,
  ): Promise<HospitalType> {
    const targetId = id || currentUser.hospitalId;
    return this.hospitalService.updateHospital(targetId, input) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => BranchType, { description: 'Create a new hospital branch' })
  async createBranch(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateBranchInput,
  ): Promise<BranchType> {
    return this.hospitalService.createBranch(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => BranchType, { description: 'Update details of an existing branch' })
  async updateBranch(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateBranchInput,
  ): Promise<BranchType> {
    return this.hospitalService.updateBranch(id, input, currentUser.sub) as any;
  }
}
