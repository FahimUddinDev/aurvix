import { Resolver, Query, Mutation, Args, ID, InputType, Field, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { HrmService } from './hrm.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('EmployeeProfile')
export class EmployeeProfileType {
  @Field(() => ID) id!: string;
  @Field() employeeCode!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
}

@ObjectType('AttendanceLog')
export class AttendanceLogType {
  @Field(() => ID) id!: string;
  @Field() type!: string; // CHECK_IN, CHECK_OUT
  @Field() timestamp!: Date;
  @Field() method!: string; // MANUAL, BIOMETRIC
  @Field({ nullable: true }) ipAddress?: string;

  @Field(() => EmployeeProfileType, { nullable: true }) employee?: EmployeeProfileType;
}

@ObjectType('LeaveTypeDetail')
export class LeaveTypeDetailType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field(() => Int) daysPerYear!: number;
  @Field() isPaid!: boolean;
}

@ObjectType('LeaveBalance')
export class LeaveBalanceType {
  @Field(() => ID) id!: string;
  @Field(() => Int) year!: number;
  @Field(() => Int) allocated!: number;
  @Field(() => Int) used!: number;
  @Field(() => Int) remaining!: number;

  @Field(() => LeaveTypeDetailType, { nullable: true }) leaveType?: LeaveTypeDetailType;
}

@ObjectType('LeaveRequest')
export class LeaveRequestType {
  @Field(() => ID) id!: string;
  @Field() startDate!: Date;
  @Field() endDate!: Date;
  @Field(() => Int) days!: number;
  @Field({ nullable: true }) reason?: string;
  @Field() status!: string; // PENDING, APPROVED, REJECTED, CANCELLED
  @Field({ nullable: true }) rejectionNote?: string;
  @Field() createdAt!: Date;

  @Field(() => EmployeeProfileType, { nullable: true }) employee?: EmployeeProfileType;
  @Field(() => LeaveTypeDetailType, { nullable: true }) leaveType?: LeaveTypeDetailType;
}

@Resolver(() => AttendanceLogType)
export class HrmResolver {
  constructor(
    private readonly hrmService: HrmService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField(() => EmployeeProfileType, { name: 'employee', nullable: true })
  async resolveEmployee(@Parent() parent: any) {
    if (!parent.employeeId) return null;
    return this.prisma.employee.findUnique({
      where: { id: parent.employeeId },
    });
  }

  @Query(() => [AttendanceLogType], { description: 'Get timecard logs' })
  async attendanceLogs(
    @CurrentUser() currentUser: any,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<AttendanceLogType[]> {
    return this.hrmService.getAttendanceLogs(currentUser.hospitalId, search) as any;
  }

  @Query(() => [LeaveBalanceType], { description: 'Get employee leave balance sheets' })
  async leaveBalances(
    @CurrentUser() currentUser: any,
  ): Promise<LeaveBalanceType[]> {
    return this.hrmService.getLeaveBalances(currentUser.hospitalId, currentUser.sub) as any;
  }

  @Query(() => [LeaveRequestType], { description: 'Get employee leave requests history' })
  async leaveRequests(
    @CurrentUser() currentUser: any,
    @Args('status', { type: () => String, nullable: true }) status?: string,
  ): Promise<LeaveRequestType[]> {
    return this.hrmService.getLeaveRequests(currentUser.hospitalId, currentUser.sub, status) as any;
  }

  @Mutation(() => AttendanceLogType, { description: 'Clock in employee attendance log' })
  async clockIn(
    @CurrentUser() currentUser: any,
    @Args('ipAddress', { type: () => String, nullable: true }) ipAddress?: string,
    @Args('method', { type: () => String, defaultValue: 'MANUAL' }) method?: string,
  ): Promise<AttendanceLogType> {
    return this.hrmService.registerClockIn(currentUser.hospitalId, currentUser.sub, ipAddress, method) as any;
  }

  @Mutation(() => AttendanceLogType, { description: 'Clock out employee attendance log' })
  async clockOut(
    @CurrentUser() currentUser: any,
    @Args('ipAddress', { type: () => String, nullable: true }) ipAddress?: string,
    @Args('method', { type: () => String, defaultValue: 'MANUAL' }) method?: string,
  ): Promise<AttendanceLogType> {
    return this.hrmService.registerClockOut(currentUser.hospitalId, currentUser.sub, ipAddress, method) as any;
  }

  @Mutation(() => LeaveRequestType, { description: 'Submit employee leave request form' })
  async applyLeave(
    @CurrentUser() currentUser: any,
    @Args('leaveTypeId', { type: () => ID }) leaveTypeId: string,
    @Args('startDate') startDate: Date,
    @Args('endDate') endDate: Date,
    @Args('reason', { type: () => String, nullable: true }) reason?: string,
  ): Promise<LeaveRequestType> {
    return this.hrmService.submitLeave(currentUser.hospitalId, currentUser.sub, leaveTypeId, startDate, endDate, reason) as any;
  }

  @Mutation(() => LeaveRequestType, { description: 'Review and approve/reject leave requests' })
  async approveLeave(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('approve', { type: () => Boolean }) approve: boolean,
    @Args('rejectionNote', { type: () => String, nullable: true }) rejectionNote?: string,
  ): Promise<LeaveRequestType> {
    return this.hrmService.reviewLeave(id, approve, rejectionNote, currentUser.sub) as any;
  }
}

@Resolver(() => LeaveBalanceType)
export class LeaveBalanceResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveField(() => LeaveTypeDetailType, { name: 'leaveType', nullable: true })
  async resolveLeaveType(@Parent() parent: any) {
    if (!parent.leaveTypeId) return null;
    return this.prisma.leaveType.findUnique({
      where: { id: parent.leaveTypeId },
    });
  }
}

@Resolver(() => LeaveRequestType)
export class LeaveRequestResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveField(() => EmployeeProfileType, { name: 'employee', nullable: true })
  async resolveEmployee(@Parent() parent: any) {
    if (!parent.employeeId) return null;
    return this.prisma.employee.findUnique({
      where: { id: parent.employeeId },
    });
  }

  @ResolveField(() => LeaveTypeDetailType, { name: 'leaveType', nullable: true })
  async resolveLeaveType(@Parent() parent: any) {
    if (!parent.leaveTypeId) return null;
    return this.prisma.leaveType.findUnique({
      where: { id: parent.leaveTypeId },
    });
  }
}
