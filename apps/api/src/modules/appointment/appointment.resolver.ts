import { Resolver, Query, Mutation, Subscription, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentService } from './appointment.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PatientType } from '../patient/patient.resolver';
import { DoctorProfileType } from '../doctor/doctor.resolver';

const pubSub = new PubSub();

@ObjectType('QueueToken')
export class QueueTokenType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) appointmentId!: string;
  @Field() tokenNumber!: string;
  @Field() displayLabel!: string;
  @Field(() => Int, { nullable: true }) estimatedWait?: number;
  @Field({ nullable: true }) calledAt?: Date;
  @Field({ nullable: true }) completedAt?: Date;
  @Field() createdAt!: Date;
}

@ObjectType('Appointment')
export class AppointmentType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) departmentId!: string;
  @Field() type!: string;
  @Field() status!: string;
  @Field() scheduledDate!: Date;
  @Field({ nullable: true }) slotStartTime?: string;
  @Field({ nullable: true }) slotEndTime?: string;
  @Field({ nullable: true }) tokenNumber?: string;
  @Field({ nullable: true }) chiefComplaint?: string;
  @Field({ nullable: true }) cancelReason?: string;
  @Field({ nullable: true }) checkedInAt?: Date;
  @Field({ nullable: true }) completedAt?: Date;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => DoctorProfileType, { nullable: true }) doctor?: DoctorProfileType;
  @Field(() => QueueTokenType, { nullable: true }) queueToken?: QueueTokenType;
}

@ObjectType('PaginatedAppointments')
class PaginatedAppointmentsType {
  @Field(() => [AppointmentType]) items!: AppointmentType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

@ObjectType('AvailableSlot')
export class AvailableSlotType {
  @Field() startTime!: string;
  @Field() endTime!: string;
  @Field() isAvailable!: boolean;
}

@ObjectType('AvailableDoctor')
export class AvailableDoctorType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) specialization?: string;
  @Field(() => [AvailableSlotType]) slots!: AvailableSlotType[];
}

@ObjectType('QueueDisplayData')
export class QueueDisplayDataType {
  @Field(() => ID) departmentId!: string;
  @Field(() => [QueueTokenType], { defaultValue: [] }) activeTokens!: QueueTokenType[];
  @Field(() => [QueueTokenType], { defaultValue: [] }) nextTokens!: QueueTokenType[];
}

@InputType()
export class CreateAppointmentInput {
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) departmentId!: string;
  @Field({ defaultValue: 'SCHEDULED' }) type!: string;
  @Field() scheduledDate!: Date;
  @Field({ nullable: true }) slotStartTime?: string;
  @Field({ nullable: true }) slotEndTime?: string;
  @Field({ nullable: true }) chiefComplaint?: string;
}

@InputType()
export class RescheduleInput {
  @Field(() => ID) appointmentId!: string;
  @Field() scheduledDate!: Date;
  @Field({ nullable: true }) slotStartTime?: string;
}

@InputType()
export class CancelInput {
  @Field(() => ID) appointmentId!: string;
  @Field() reason!: string;
}

@Resolver(() => AppointmentType)
export class AppointmentResolver {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Query(() => [AvailableSlotType], { description: 'Get open time slots for a doctor on a specific date' })
  async availableSlots(
    @Args('doctorId', { type: () => ID }) doctorId: string,
    @Args('date') date: string,
  ): Promise<AvailableSlotType[]> {
    return this.appointmentService.getAvailableSlots(doctorId, date);
  }

  @Query(() => [AvailableDoctorType], { description: 'Get active doctors with available slots for a department' })
  async availableDoctors(
    @CurrentUser() currentUser: any,
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('date') date: string,
  ): Promise<AvailableDoctorType[]> {
    return this.appointmentService.getAvailableDoctors(currentUser.hospitalId, departmentId, date);
  }

  @Query(() => PaginatedAppointmentsType, { description: 'Get paginated appointments list for patients or staff' })
  async myAppointments(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID, nullable: true }) patientId?: string,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<PaginatedAppointmentsType> {
    return this.appointmentService.listAppointments(
      currentUser.hospitalId,
      { patientId, status },
      page ?? 1,
      limit ?? 10,
    ) as any;
  }

  @Query(() => AppointmentType, { description: 'Get details of a specific appointment' })
  async appointmentDetails(@Args('id', { type: () => ID }) id: string): Promise<AppointmentType> {
    return this.appointmentService.findAppointmentById(id) as any;
  }

  @Query(() => [AppointmentType], { description: 'Get today\'s ordered queue for a doctor' })
  async todayQueue(
    @CurrentUser() currentUser: any,
    @Args('doctorId', { type: () => ID }) doctorId: string,
  ): Promise<AppointmentType[]> {
    return this.appointmentService.getTodayQueue(currentUser.hospitalId, doctorId) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Book a new appointment' })
  async createAppointment(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateAppointmentInput,
  ): Promise<AppointmentType> {
    return this.appointmentService.createAppointment(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Reschedule an existing appointment' })
  async rescheduleAppointment(
    @CurrentUser() currentUser: any,
    @Args('input') input: RescheduleInput,
  ): Promise<AppointmentType> {
    return this.appointmentService.rescheduleAppointment(input, currentUser.sub) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Cancel an appointment' })
  async cancelAppointment(
    @CurrentUser() currentUser: any,
    @Args('input') input: CancelInput,
  ): Promise<AppointmentType> {
    return this.appointmentService.cancelAppointment(input, currentUser.sub) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Mark patient arrived at reception' })
  async checkInPatient(
    @CurrentUser() currentUser: any,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
  ): Promise<AppointmentType> {
    return this.appointmentService.checkInPatient(appointmentId, currentUser.sub) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Advance doctor queue by calling next patient' })
  async callNextPatient(
    @CurrentUser() currentUser: any,
    @Args('doctorId', { type: () => ID }) doctorId: string,
  ): Promise<AppointmentType> {
    return this.appointmentService.callNextPatient(currentUser.hospitalId, doctorId, currentUser.sub) as any;
  }

  @Mutation(() => AppointmentType, { description: 'Skip patient for no-show' })
  async skipPatient(
    @CurrentUser() currentUser: any,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
    @Args('reason') reason: string,
  ): Promise<AppointmentType> {
    return this.appointmentService.skipPatient(appointmentId, reason, currentUser.sub) as any;
  }

  // ─── WebSocket / GraphQL Subscriptions ──────────────────────────────
  @Subscription(() => QueueTokenType, {
    resolve: (payload) => payload.queueToken,
    filter: (payload, variables) => payload.doctorId === variables.doctorId,
    description: 'Subscribe to real-time token/queue position updates'
  })
  queueStatus(@Args('doctorId', { type: () => ID }) doctorId: string) {
    return pubSub.asyncIterator('queueStatus');
  }

  @Subscription(() => QueueDisplayDataType, {
    resolve: (payload) => payload.displayData,
    filter: (payload, variables) => payload.departmentId === variables.departmentId,
    description: 'Subscribe to active called/next tokens for lounge TV display'
  })
  queueDisplay(@Args('departmentId', { type: () => ID }) departmentId: string) {
    return pubSub.asyncIterator('queueDisplay');
  }

  // ─── Local EventEmitter Event Handlers ──────────────────────────────
  @OnEvent('queue.status')
  handleQueueStatus(payload: { doctorId: string; queueToken: any }) {
    pubSub.publish('queueStatus', { doctorId: payload.doctorId, queueToken: payload.queueToken });
  }

  @OnEvent('queue.display')
  handleQueueDisplay(payload: { departmentId: string; displayData: any }) {
    pubSub.publish('queueDisplay', { departmentId: payload.departmentId, displayData: payload.displayData });
  }
}
