import { Resolver, Query, Mutation, Args, ID, InputType, Field, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { AdmissionService } from './admission.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('Ward')
export class WardType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field({ nullable: true }) nameBn?: string;
  @Field() type!: string; // GENERAL, SEMI_PRIVATE, PRIVATE, ICU
  @Field({ nullable: true }) floor?: string;
  @Field(() => FloatScalar) dailyRate!: number;
  @Field() isActive!: boolean;

  @Field(() => [BedType], { defaultValue: [] }) beds!: BedType[];
}

import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('Bed')
export class BedType {
  @Field(() => ID) id!: string;
  @Field(() => ID) wardId!: string;
  @Field() bedNumber!: string;
  @Field() status!: string; // AVAILABLE, OCCUPIED, RESERVED, UNDER_CLEANING, OUT_OF_SERVICE

  @Field(() => WardType, { nullable: true }) ward?: WardType;
}

@ObjectType('Admission')
export class AdmissionType {
  @Field(() => ID) id!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID) bedId!: string;
  @Field() status!: string; // ACTIVE, DISCHARGED, TRANSFERRED, ABSCONDED
  @Field() admissionDate!: Date;
  @Field({ nullable: true }) dischargeDate?: Date;
  @Field({ nullable: true }) admissionNotes?: string;
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => BedType, { nullable: true }) bed?: BedType;
}

@InputType()
export class AdmitPatientInput {
  @Field(() => ID) patientId!: string;
  @Field(() => ID) bedId!: string;
  @Field({ nullable: true }) admissionNotes?: string;
}

@Resolver(() => AdmissionType)
export class AdmissionResolver {
  constructor(
    private readonly admissionService: AdmissionService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField(() => PatientType, { nullable: true })
  async patient(@Parent() parent: any) {
    if (!parent.patientId) return null;
    return this.prisma.patient.findUnique({
      where: { id: parent.patientId },
    });
  }

  @ResolveField(() => BedType, { nullable: true })
  async bed(@Parent() parent: any) {
    if (!parent.bedId) return null;
    return this.prisma.bed.findUnique({
      where: { id: parent.bedId },
      include: { ward: true },
    });
  }

  @Query(() => [WardType], { description: 'Get all active inpatient wards' })
  async wards(
    @CurrentUser() currentUser: any,
  ): Promise<WardType[]> {
    return this.admissionService.getWards(currentUser.hospitalId) as any;
  }

  @Query(() => [BedType], { description: 'Get beds in ward' })
  async beds(
    @CurrentUser() currentUser: any,
    @Args('wardId', { type: () => ID, nullable: true }) wardId?: string,
    @Args('status', { type: () => String, nullable: true }) status?: string,
  ): Promise<BedType[]> {
    return this.admissionService.getBeds(currentUser.hospitalId, wardId, status) as any;
  }

  @Query(() => [AdmissionType], { description: 'Get inpatient admissions list' })
  async admissions(
    @CurrentUser() currentUser: any,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<AdmissionType[]> {
    return this.admissionService.getAdmissions(currentUser.hospitalId, status, search) as any;
  }

  @Mutation(() => AdmissionType, { description: 'Admit patient to bed' })
  async admitPatient(
    @CurrentUser() currentUser: any,
    @Args('input') input: AdmitPatientInput,
  ): Promise<AdmissionType> {
    return this.admissionService.admitPatient(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Mutation(() => AdmissionType, { description: 'Transfer patient to different bed' })
  async transferPatient(
    @CurrentUser() currentUser: any,
    @Args('admissionId', { type: () => ID }) admissionId: string,
    @Args('bedId', { type: () => ID }) bedId: string,
  ): Promise<AdmissionType> {
    return this.admissionService.transferPatient(admissionId, bedId, currentUser.sub) as any;
  }

  @Mutation(() => AdmissionType, { description: 'Discharge patient from hospital' })
  async dischargePatient(
    @CurrentUser() currentUser: any,
    @Args('admissionId', { type: () => ID }) admissionId: string,
    @Args('notes', { type: () => String, nullable: true }) notes?: string,
  ): Promise<AdmissionType> {
    return this.admissionService.dischargePatient(admissionId, notes, currentUser.sub) as any;
  }

  @Mutation(() => BedType, { description: 'Mark bed clean and available' })
  async markBedAvailable(
    @CurrentUser() currentUser: any,
    @Args('bedId', { type: () => ID }) bedId: string,
  ): Promise<BedType> {
    return this.admissionService.markBedCleaned(bedId, currentUser.sub) as any;
  }
}
