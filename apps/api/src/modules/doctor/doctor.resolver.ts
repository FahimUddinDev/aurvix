import { Resolver, Query, Mutation, Args, ID, Float, Int } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { DoctorService } from './doctor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../user/user.resolver';
import { DepartmentType } from '../department/department.resolver';

@ObjectType('DoctorSchedule')
export class DoctorScheduleType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => Int) dayOfWeek!: number; // 0=Sunday ... 6=Saturday
  @Field() startTime!: string;
  @Field() endTime!: string;
  @Field(() => Int) slotDurationMin!: number;
  @Field(() => Int) maxPatients!: number;
  @Field() isActive!: boolean;
}

@ObjectType('DoctorFee')
export class DoctorFeeType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) departmentId!: string;
  @Field() feeType!: string;
  @Field(() => Float) amount!: number;
  @Field() isActive!: boolean;
}

@ObjectType('DoctorProfile')
export class DoctorProfileType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) userId!: string;
  @Field(() => ID) departmentId!: string;
  @Field({ nullable: true }) bmdcNumber?: string;
  @Field({ nullable: true }) specialization?: string;
  @Field({ nullable: true }) qualification?: string;
  @Field(() => Int, { nullable: true }) experience?: number;
  @Field({ nullable: true }) bio?: string;
  @Field({ nullable: true }) bioBn?: string;
  @Field(() => Float) consultationFee!: number;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;

  @Field(() => UserType, { nullable: true }) user?: UserType;
  @Field(() => DepartmentType, { nullable: true }) department?: DepartmentType;
  @Field(() => [DoctorScheduleType], { defaultValue: [] }) schedules!: DoctorScheduleType[];
  @Field(() => [DoctorFeeType], { defaultValue: [] }) fees!: DoctorFeeType[];
}

@ObjectType('PaginatedDoctors')
class PaginatedDoctorsType {
  @Field(() => [DoctorProfileType]) items!: DoctorProfileType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

@InputType()
export class ScheduleSlotInput {
  @Field(() => Int) dayOfWeek!: number;
  @Field() startTime!: string;
  @Field() endTime!: string;
  @Field(() => Int, { defaultValue: 15 }) slotDurationMin!: number;
  @Field(() => Int, { defaultValue: 20 }) maxPatients!: number;
}

@InputType()
export class CreateDoctorInput {
  @Field(() => ID) userId!: string;
  @Field(() => ID) departmentId!: string;
  @Field({ nullable: true }) bmdcNumber?: string;
  @Field({ nullable: true }) specialization?: string;
  @Field({ nullable: true }) qualification?: string;
  @Field(() => Int, { nullable: true }) experience?: number;
  @Field({ nullable: true }) bio?: string;
  @Field({ nullable: true }) bioBn?: string;
  @Field(() => Float, { defaultValue: 0 }) consultationFee!: number;
  @Field(() => [ScheduleSlotInput], { nullable: true }) schedules?: ScheduleSlotInput[];
}

@InputType()
export class UpdateDoctorInput {
  @Field(() => ID, { nullable: true }) departmentId?: string;
  @Field({ nullable: true }) bmdcNumber?: string;
  @Field({ nullable: true }) specialization?: string;
  @Field({ nullable: true }) qualification?: string;
  @Field(() => Int, { nullable: true }) experience?: number;
  @Field({ nullable: true }) bio?: string;
  @Field({ nullable: true }) bioBn?: string;
  @Field(() => Float, { nullable: true }) consultationFee?: number;
  @Field({ nullable: true }) isActive?: boolean;
}

@InputType()
class DoctorFiltersInput {
  @Field(() => ID, { nullable: true }) departmentId?: string;
  @Field({ nullable: true }) search?: string;
}

@Resolver(() => DoctorProfileType)
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Query(() => PaginatedDoctorsType, { description: 'Get paginated list of doctors' })
  async doctors(
    @CurrentUser() currentUser: any,
    @Args('filters', { nullable: true }) filters?: DoctorFiltersInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<PaginatedDoctorsType> {
    return this.doctorService.listDoctors(currentUser.hospitalId, filters, page ?? 1, limit ?? 10) as any;
  }

  @Query(() => DoctorProfileType, { description: 'Get a single doctor profile' })
  async doctor(@Args('id', { type: () => ID }) id: string): Promise<DoctorProfileType> {
    return this.doctorService.findDoctorById(id) as any;
  }

  @Query(() => [DoctorScheduleType], { description: 'Get schedule slots for a doctor' })
  async doctorSchedule(@Args('id', { type: () => ID }) id: string): Promise<DoctorScheduleType[]> {
    return this.doctorService.getDoctorSchedule(id) as any;
  }

  @Query(() => [DoctorFeeType], { description: 'Get fees for a doctor' })
  async doctorFees(@Args('id', { type: () => ID }) id: string): Promise<DoctorFeeType[]> {
    return this.doctorService.getDoctorFees(id) as any;
  }

  @Query(() => Boolean, { description: 'Check real-time slot availability for a doctor' })
  async doctorAvailability(
    @Args('id', { type: () => ID }) id: string,
    @Args('date') date: string,
  ): Promise<boolean> {
    return this.doctorService.checkAvailability(id, date);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => DoctorProfileType, { description: 'Create a new doctor profile' })
  async createDoctor(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateDoctorInput,
  ): Promise<DoctorProfileType> {
    return this.doctorService.createDoctor(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => DoctorProfileType, { description: 'Update a doctor profile' })
  async updateDoctor(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDoctorInput,
  ): Promise<DoctorProfileType> {
    return this.doctorService.updateDoctor(id, input, currentUser.sub) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Mutation(() => [DoctorScheduleType], { description: 'Update schedule slots for a doctor' })
  async updateSchedule(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('slots', { type: () => [ScheduleSlotInput] }) slots: ScheduleSlotInput[],
  ): Promise<DoctorScheduleType[]> {
    return this.doctorService.updateSchedule(id, slots, currentUser.hospitalId, currentUser.sub) as any;
  }
}
