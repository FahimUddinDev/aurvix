import { Resolver, Query, Mutation, Args, ID, InputType, Field, Float, Int } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { VisitService } from './visit.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';

@ObjectType('VitalSign')
export class VitalSignType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID, { nullable: true }) visitId?: string;
  @Field(() => Int, { nullable: true }) systolicBp?: number;
  @Field(() => Int, { nullable: true }) diastolicBp?: number;
  @Field(() => Int, { nullable: true }) heartRate?: number;
  @Field(() => Float, { nullable: true }) temperature?: number;
  @Field(() => Int, { nullable: true }) spo2?: number;
  @Field(() => Int, { nullable: true }) respiratoryRate?: number;
  @Field(() => Float, { nullable: true }) weightKg?: number;
  @Field(() => Float, { nullable: true }) heightCm?: number;
  @Field() recordedAt!: Date;
}

@ObjectType('ClinicalNote')
export class ClinicalNoteType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) visitId!: string;
  @Field() noteType!: string;
  @Field() content!: string;
  @Field() createdAt!: Date;
}

@ObjectType('Diagnosis')
export class DiagnosisType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) visitId!: string;
  @Field({ nullable: true }) icd10Code?: string;
  @Field({ nullable: true }) icd10Desc?: string;
  @Field({ nullable: true }) description?: string;
  @Field() isPrimary!: boolean;
}

@ObjectType('ICD10Code')
export class ICD10CodeType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() description!: string;
  @Field({ nullable: true }) descriptionBn?: string | null;
  @Field({ nullable: true }) category?: string | null;
}

@ObjectType('Visit')
export class VisitType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field(() => ID) patientId!: string;
  @Field(() => ID, { nullable: true }) appointmentId?: string;
  @Field(() => ID) doctorId!: string;
  @Field(() => ID) departmentId!: string;
  @Field() visitDate!: Date;
  @Field({ nullable: true }) chiefComplaint?: string;
  @Field() isCompleted!: boolean;
  @Field({ nullable: true }) completedAt?: Date;
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => [VitalSignType], { defaultValue: [] }) vitals!: VitalSignType[];
  @Field(() => [DiagnosisType], { defaultValue: [] }) diagnoses!: DiagnosisType[];
  @Field(() => [ClinicalNoteType], { defaultValue: [] }) notes!: ClinicalNoteType[];
}

@ObjectType('PatientEMR')
export class PatientEMRType {
  @Field(() => PatientType) patient!: PatientType;
  @Field(() => [VisitType], { defaultValue: [] }) visits!: VisitType[];
}

@InputType()
export class VitalsInput {
  @Field(() => Int, { nullable: true }) systolicBp?: number;
  @Field(() => Int, { nullable: true }) diastolicBp?: number;
  @Field(() => Int, { nullable: true }) heartRate?: number;
  @Field(() => Float, { nullable: true }) temperature?: number;
  @Field(() => Int, { nullable: true }) spo2?: number;
  @Field(() => Int, { nullable: true }) respiratoryRate?: number;
  @Field(() => Float, { nullable: true }) weightKg?: number;
  @Field(() => Float, { nullable: true }) heightCm?: number;
}

@InputType()
export class DiagnosisInput {
  @Field({ nullable: true }) icd10Code?: string;
  @Field({ nullable: true }) icd10Desc?: string;
  @Field({ nullable: true }) description?: string;
  @Field({ defaultValue: false }) isPrimary!: boolean;
}

@InputType()
export class ClinicalNoteInput {
  @Field({ defaultValue: 'SOAP' }) noteType!: string;
  @Field() content!: string;
}

@Resolver(() => VisitType)
export class VisitResolver {
  constructor(private readonly visitService: VisitService) {}

  @Query(() => PatientEMRType, { description: 'Get the full EMR details for a patient' })
  async patientEmr(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID }) patientId: string,
  ): Promise<PatientEMRType> {
    return this.visitService.getPatientEMR(currentUser.hospitalId, patientId) as any;
  }

  @Query(() => [ICD10CodeType], { description: 'Search ICD-10 codes' })
  async searchICD10(
    @Args('query') query: string,
  ): Promise<ICD10CodeType[]> {
    return this.visitService.searchICD10Codes(query);
  }

  @Query(() => [VisitType], { description: 'List historical visits for a patient' })
  async visitHistory(
    @CurrentUser() currentUser: any,
    @Args('patientId', { type: () => ID }) patientId: string,
  ): Promise<VisitType[]> {
    return this.visitService.getVisitHistory(currentUser.hospitalId, patientId) as any;
  }

  @Mutation(() => VisitType, { description: 'Start a patient consultation from an appointment' })
  async startConsultation(
    @CurrentUser() currentUser: any,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
  ): Promise<VisitType> {
    return this.visitService.startConsultation(currentUser.hospitalId, appointmentId, currentUser.sub) as any;
  }

  @Mutation(() => VitalSignType, { description: 'Record patient vitals for a consultation visit' })
  async addVitals(
    @CurrentUser() currentUser: any,
    @Args('visitId', { type: () => ID }) visitId: string,
    @Args('input') input: VitalsInput,
  ): Promise<VitalSignType> {
    return this.visitService.addVitals(currentUser.hospitalId, visitId, input, currentUser.sub) as any;
  }

  @Mutation(() => DiagnosisType, { description: 'Record a diagnosis for a consultation visit' })
  async addDiagnosis(
    @CurrentUser() currentUser: any,
    @Args('visitId', { type: () => ID }) visitId: string,
    @Args('input') input: DiagnosisInput,
  ): Promise<DiagnosisType> {
    return this.visitService.addDiagnosis(currentUser.hospitalId, visitId, input, currentUser.sub) as any;
  }

  @Mutation(() => ClinicalNoteType, { description: 'Record clinical notes (e.g. SOAP) for a visit' })
  async addClinicalNote(
    @CurrentUser() currentUser: any,
    @Args('visitId', { type: () => ID }) visitId: string,
    @Args('input') input: ClinicalNoteInput,
  ): Promise<ClinicalNoteType> {
    return this.visitService.addClinicalNote(currentUser.hospitalId, visitId, input, currentUser.sub) as any;
  }

  @Mutation(() => VisitType, { description: 'Finalize and complete a clinical consultation' })
  async completeConsultation(
    @CurrentUser() currentUser: any,
    @Args('visitId', { type: () => ID }) visitId: string,
  ): Promise<VisitType> {
    return this.visitService.completeConsultation(visitId, currentUser.sub) as any;
  }
}
