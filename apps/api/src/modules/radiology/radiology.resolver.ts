import { Resolver, Query, Mutation, Args, ID, InputType, Field, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { RadiologyService } from './radiology.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';
import { DoctorProfileType } from '../doctor/doctor.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('RadiologyModality')
export class RadiologyModalityType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) code?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => FloatScalar) price!: number;
  @Field() isActive!: boolean;
}

import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('RadiologyReport')
export class RadiologyReportType {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) findings?: string;
  @Field({ nullable: true }) impression?: string;
  @Field({ nullable: true }) reportUrl?: string;
  @Field({ nullable: true }) approvedAt?: Date;
}

@ObjectType('RadiologyOrder')
export class RadiologyOrderType {
  @Field(() => ID) id!: string;
  @Field(() => ID) visitId!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) modalityId!: string;
  @Field({ nullable: true }) clinicalInfo?: string;
  @Field() status!: string; // PENDING, IN_PROGRESS, REPORT_UPLOADED, APPROVED, CANCELLED
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => DoctorProfileType, { nullable: true }) doctor?: DoctorProfileType;
  @Field(() => RadiologyModalityType, { nullable: true }) modality?: RadiologyModalityType;
  @Field(() => RadiologyReportType, { nullable: true }) report?: RadiologyReportType;
}

@InputType()
export class CreateRadiologyOrderInput {
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) modalityId!: string;
  @Field({ nullable: true }) clinicalInfo?: string;
}

@InputType()
export class UploadRadiologyReportInput {
  @Field() findings!: string;
  @Field() impression!: string;
  @Field({ nullable: true }) reportUrl?: string;
}

@Resolver(() => RadiologyOrderType)
export class RadiologyResolver {
  constructor(
    private readonly radiologyService: RadiologyService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField(() => PatientType, { nullable: true })
  async patient(@Parent() parent: any) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: parent.visitId },
      include: { patient: true },
    });
    return visit?.patient;
  }

  @ResolveField(() => DoctorProfileType, { nullable: true })
  async doctor(@Parent() parent: any) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: parent.visitId },
    });
    if (!visit) return null;
    return this.prisma.doctorProfile.findUnique({
      where: { id: visit.doctorId },
      include: { user: true },
    });
  }

  @ResolveField(() => RadiologyModalityType, { nullable: true })
  async modality(@Parent() parent: any) {
    return this.prisma.radiologyModality.findUnique({
      where: { id: parent.modalityId },
    });
  }

  @ResolveField(() => RadiologyReportType, { nullable: true })
  async report(@Parent() parent: any) {
    return this.prisma.radiologyReport.findUnique({
      where: { orderId: parent.id },
    });
  }

  @Query(() => [RadiologyOrderType], { description: 'Get radiographer worklist' })
  async radiologyWorklist(
    @CurrentUser() currentUser: any,
    @Args('status', { type: () => String, nullable: true }) status?: string,
  ): Promise<RadiologyOrderType[]> {
    return this.radiologyService.getWorklist(currentUser.hospitalId, status) as any;
  }

  @Query(() => RadiologyOrderType, { description: 'Get specific radiology order details' })
  async radiologyOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RadiologyOrderType> {
    return this.radiologyService.getOrderById(id) as any;
  }

  @Query(() => [RadiologyModalityType], { description: 'Get active radiology modalities' })
  async radiologyModalities(
    @CurrentUser() currentUser: any,
  ): Promise<RadiologyModalityType[]> {
    return this.radiologyService.getModalities(currentUser.hospitalId) as any;
  }

  @Query(() => [RadiologyOrderType], { description: 'Get patient imaging history' })
  async patientRadiologyHistory(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID }) patientId: string,
  ): Promise<RadiologyOrderType[]> {
    return this.radiologyService.getPatientHistory(currentUser.hospitalId, patientId) as any;
  }

  @Mutation(() => RadiologyOrderType, { description: 'Order a scan from consultation' })
  async createRadiologyOrder(
    @CurrentUser() currentUser: any,
    @Args('visitId', { type: () => ID }) visitId: string,
    @Args('input') input: CreateRadiologyOrderInput,
  ): Promise<RadiologyOrderType> {
    return this.radiologyService.createOrder(currentUser.hospitalId, visitId, input, currentUser.sub) as any;
  }

  @Mutation(() => RadiologyReportType, { description: 'Upload radiology findings' })
  async uploadRadiologyReport(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('input') input: UploadRadiologyReportInput,
  ): Promise<RadiologyReportType> {
    return this.radiologyService.uploadReport(currentUser.hospitalId, orderId, input, currentUser.sub) as any;
  }

  @Mutation(() => RadiologyOrderType, { description: 'Approve radiology report' })
  async approveRadiologyReport(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<RadiologyOrderType> {
    return this.radiologyService.approveReport(orderId, currentUser.sub) as any;
  }
}
