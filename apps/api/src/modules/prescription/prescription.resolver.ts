import { Resolver, Query, Mutation, Args, ID, InputType, Field, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { PrescriptionService } from './prescription.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';
import { DoctorProfileType } from '../doctor/doctor.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('Medicine')
export class MedicineType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field() genericName!: string;
  @Field({ nullable: true }) brandName?: string;
  @Field() category!: string;
  @Field() dosageForm!: string;
  @Field({ nullable: true }) strength?: string;
  @Field({ nullable: true }) manufacturer?: string;
  @Field(() => FloatScalar) unitPrice!: number;
}

// Custom FloatScalar representation since unitPrice is Decimal in schema
import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('PrescriptionItem')
export class PrescriptionItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) prescriptionId!: string;
  @Field(() => ID) medicineId!: string;
  @Field() dosage!: string;
  @Field() frequency!: string;
  @Field() duration!: string;
  @Field() route!: string;
  @Field({ nullable: true }) instructions?: string;
  @Field(() => Int) qty!: number;

  @Field(() => MedicineType, { nullable: true }) medicine?: MedicineType;
}

@ObjectType('Prescription')
export class PrescriptionType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) visitId!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID) doctorId!: string;
  @Field() status!: string;
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) validUntil?: Date;
  @Field() createdAt!: Date;

  @Field(() => [PrescriptionItemType], { defaultValue: [] }) items!: PrescriptionItemType[];
  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => DoctorProfileType, { nullable: true }) doctor?: DoctorProfileType;
}

@ObjectType('DrugInteractionWarning')
export class DrugInteractionWarningType {
  @Field(() => ID) medicineAId!: string;
  @Field(() => ID) medicineBId!: string;
  @Field() severity!: string;
  @Field() description!: string;
}

@InputType()
export class PrescriptionItemInput {
  @Field(() => ID) medicineId!: string;
  @Field() dosage!: string;
  @Field() frequency!: string;
  @Field() duration!: string;
  @Field({ defaultValue: 'ORAL' }) route!: string;
  @Field({ nullable: true }) instructions?: string;
  @Field(() => Int, { defaultValue: 1 }) qty!: number;
}

@InputType()
export class CreatePrescriptionInput {
  @Field(() => ID) visitId!: string;
  @Field(() => [PrescriptionItemInput]) items!: PrescriptionItemInput[];
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) validUntil?: Date;
}

@Resolver(() => PrescriptionType)
export class PrescriptionResolver {
  constructor(
    private readonly prescriptionService: PrescriptionService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => [MedicineType], { description: 'Search medicines by brand or generic name' })
  async searchMedicine(
    @CurrentUser() currentUser: any,
    @Args('query') query: string,
  ): Promise<MedicineType[]> {
    return this.prescriptionService.searchMedicine(currentUser.hospitalId, query) as any;
  }

  @Query(() => [DrugInteractionWarningType], { description: 'Check potential drug-drug interactions for selected medicines' })
  async checkDrugInteractions(
    @Args('medicineIds', { type: () => [ID] }) medicineIds: string[],
  ): Promise<DrugInteractionWarningType[]> {
    return this.prescriptionService.checkDrugInteractions(medicineIds);
  }

  @Query(() => [PrescriptionType], { description: 'Get prescription history for a patient' })
  async prescriptionHistory(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID }) patientId: string,
  ): Promise<PrescriptionType[]> {
    return this.prescriptionService.getHistory(currentUser.hospitalId, patientId) as any;
  }

  @Mutation(() => PrescriptionType, { description: 'Create a new electronic prescription' })
  async createPrescription(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreatePrescriptionInput,
  ): Promise<PrescriptionType> {
    return this.prescriptionService.createPrescription(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Mutation(() => PrescriptionType, { description: 'Suspend an active prescription' })
  async suspendPrescription(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
  ): Promise<PrescriptionType> {
    return this.prescriptionService.suspendPrescription(id, reason, currentUser.sub) as any;
  }
  @ResolveField(() => PatientType, { nullable: true })
  async patient(@Parent() parent: any) {
    return this.prisma.patient.findUnique({
      where: { id: parent.patientId },
    });
  }

  @ResolveField(() => DoctorProfileType, { nullable: true })
  async doctor(@Parent() parent: any) {
    return this.prisma.doctorProfile.findUnique({
      where: { id: parent.doctorId },
      include: { user: true },
    });
  }
}
