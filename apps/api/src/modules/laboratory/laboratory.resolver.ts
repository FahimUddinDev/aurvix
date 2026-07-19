import { Resolver, Query, Mutation, Args, ID, InputType, Field, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { LaboratoryService } from './laboratory.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';
import { DoctorProfileType } from '../doctor/doctor.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('LabTestCatalog')
export class LabTestCatalogType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field({ nullable: true }) code?: string;
  @Field() category!: string;
  @Field() sampleType!: string;
  @Field({ nullable: true }) normalRangeMale?: string;
  @Field({ nullable: true }) normalRangeFemale?: string;
  @Field({ nullable: true }) unit?: string;
  @Field(() => FloatScalar) price!: number;
  @Field(() => Int) turnaroundHrs!: number;
}

import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('LabSample')
export class LabSampleType {
  @Field(() => ID) id!: string;
  @Field() barcode!: string;
  @Field() sampleType!: string;
  @Field({ nullable: true }) collectedAt?: Date;
}

@ObjectType('LabResult')
export class LabResultType {
  @Field(() => ID) id!: string;
  @Field(() => ID) testId!: string;
  @Field() value!: string;
  @Field({ nullable: true }) unit?: string;
  @Field() flag!: string; // NORMAL, ABNORMAL, CRITICAL_HIGH, CRITICAL_LOW
  @Field({ nullable: true }) normalRange?: string;
  @Field({ nullable: true }) remarks?: string;
  @Field({ nullable: true }) approvedAt?: Date;

  @Field(() => LabTestCatalogType, { nullable: true }) test?: LabTestCatalogType;
}

@ObjectType('LabOrder')
export class LabOrderType {
  @Field(() => ID) id!: string;
  @Field(() => ID) visitId!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field() status!: string; // PENDING, SAMPLE_COLLECTED, IN_PROGRESS, RESULTED, APPROVED, REJECTED
  @Field() priority!: string;
  @Field({ nullable: true }) notes?: string;
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => DoctorProfileType, { nullable: true }) doctor?: DoctorProfileType;
  @Field(() => [LabSampleType], { defaultValue: [] }) samples!: LabSampleType[];
  @Field(() => [LabResultType], { defaultValue: [] }) results!: LabResultType[];
}

@InputType()
export class CollectSampleInput {
  @Field() sampleType!: string;
  @Field() barcode!: string;
}

@InputType()
export class LabResultValueInput {
  @Field(() => ID) testId!: string;
  @Field() value!: string;
  @Field({ nullable: true }) remarks?: string;
}

@Resolver(() => LabResultType)
export class LabResultResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveField(() => LabTestCatalogType, { nullable: true })
  async test(@Parent() parent: any) {
    return this.prisma.labTest.findUnique({
      where: { id: parent.testId },
    });
  }
}

@Resolver(() => LabOrderType)
export class LaboratoryResolver {
  constructor(
    private readonly laboratoryService: LaboratoryService,
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

  @Query(() => [LabOrderType], { description: 'Get technician lab worklist' })
  async labWorklist(
    @CurrentUser() currentUser: any,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('priority', { type: () => String, nullable: true }) priority?: string,
  ): Promise<LabOrderType[]> {
    return this.laboratoryService.getWorklist(currentUser.hospitalId, status, priority) as any;
  }

  @Query(() => LabOrderType, { description: 'Get specific lab order details' })
  async labOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LabOrderType> {
    return this.laboratoryService.getOrderById(id) as any;
  }

  @Query(() => [LabTestCatalogType], { description: 'Get the test catalog' })
  async labTestCatalog(
    @CurrentUser() currentUser: any,
    @Args('category', { type: () => String, nullable: true }) category?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<LabTestCatalogType[]> {
    return this.laboratoryService.getCatalog(currentUser.hospitalId, category, search) as any;
  }

  @Query(() => [LabOrderType], { description: 'Get lab testing history for a patient' })
  async patientLabHistory(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID }) patientId: string,
  ): Promise<LabOrderType[]> {
    return this.laboratoryService.getPatientHistory(currentUser.hospitalId, patientId) as any;
  }

  @Mutation(() => LabSampleType, { description: 'Mark specimen sample collected' })
  async collectSample(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('input') input: CollectSampleInput,
  ): Promise<LabSampleType> {
    return this.laboratoryService.collectSample(currentUser.hospitalId, orderId, input, currentUser.sub) as any;
  }

  @Mutation(() => [LabResultType], { description: 'Record lab results' })
  async enterLabResult(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('results', { type: () => [LabResultValueInput] }) results: LabResultValueInput[],
  ): Promise<LabResultType[]> {
    return this.laboratoryService.enterResults(currentUser.hospitalId, orderId, results, currentUser.sub) as any;
  }

  @Mutation(() => LabOrderType, { description: 'Approve lab results' })
  async approveLabResult(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<LabOrderType> {
    return this.laboratoryService.approveResults(orderId, currentUser.sub) as any;
  }

  @Mutation(() => LabOrderType, { description: 'Reject lab results and request re-run' })
  async rejectLabResult(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('reason') reason: string,
  ): Promise<LabOrderType> {
    return this.laboratoryService.rejectResults(orderId, reason, currentUser.sub) as any;
  }

  @Mutation(() => LabOrderType, { description: 'Manually flag critical values' })
  async flagCriticalValue(
    @CurrentUser() currentUser: any,
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<LabOrderType> {
    return this.laboratoryService.flagCritical(orderId, currentUser.sub) as any;
  }
}
