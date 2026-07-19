import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { PatientService } from './patient.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ObjectType('PatientAllergy')
class PatientAllergyType {
  @Field(() => ID) id!: string;
  @Field() allergen!: string;
  @Field({ nullable: true }) reaction?: string;
  @Field() severity!: string;
  @Field() isActive!: boolean;
}

@ObjectType('EmergencyContact')
class EmergencyContactType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() relationship!: string;
  @Field() phone!: string;
}

@ObjectType('PatientDocument')
class PatientDocumentType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field() fileUrl!: string;
  @Field() fileType!: string;
  @Field(() => Int, { nullable: true }) fileSizeKb?: number;
  @Field({ nullable: true }) description?: string;
  @Field() createdAt!: Date;
}

@ObjectType('Patient')
export class PatientType {
  @Field(() => ID) id!: string;
  @Field(() => ID) hospitalId!: string;
  @Field() uhid!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) firstNameBn?: string;
  @Field({ nullable: true }) lastNameBn?: string;
  @Field() dateOfBirth!: Date;
  @Field() gender!: string;
  @Field({ nullable: true }) bloodGroup?: string;
  @Field() phone!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) addressBn?: string;
  @Field({ nullable: true }) nidDecrypted?: string;
  @Field({ nullable: true }) photoUrl?: string;
  @Field() isActive!: boolean;
  @Field(() => [PatientAllergyType], { defaultValue: [] }) allergies!: PatientAllergyType[];
  @Field(() => [EmergencyContactType], { defaultValue: [] })
  emergencyContacts!: EmergencyContactType[];
  @Field(() => [PatientDocumentType], { defaultValue: [] }) documents!: PatientDocumentType[];
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('PaginatedPatients')
class PaginatedPatientsType {
  @Field(() => [PatientType]) items!: PatientType[];
  @Field(() => Int) total!: number;
  @Field(() => Int) page!: number;
  @Field(() => Int) limit!: number;
}

@ObjectType('TimelineItem')
class TimelineItemType {
  @Field(() => ID) id!: string;
  @Field() type!: string;
  @Field() title!: string;
  @Field({ nullable: true }) description?: string;
  @Field() date!: Date;
}

@InputType()
class EmergencyContactInput {
  @Field() name!: string;
  @Field() relationship!: string;
  @Field() phone!: string;
}

@InputType()
class AllergyInput {
  @Field() allergen!: string;
  @Field({ nullable: true }) reaction?: string;
  @Field({ defaultValue: 'MODERATE' }) severity!: string;
}

@InputType()
class CreatePatientInput {
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field({ nullable: true }) firstNameBn?: string;
  @Field({ nullable: true }) lastNameBn?: string;
  @Field() dateOfBirth!: Date;
  @Field() gender!: string;
  @Field({ nullable: true }) bloodGroup?: string;
  @Field() phone!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) addressBn?: string;
  @Field({ nullable: true }) nid?: string;
  @Field(() => [EmergencyContactInput], { nullable: true })
  emergencyContacts?: EmergencyContactInput[];
  @Field(() => [AllergyInput], { nullable: true }) allergies?: AllergyInput[];
}

@InputType()
class UpdatePatientInput {
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) firstNameBn?: string;
  @Field({ nullable: true }) lastNameBn?: string;
  @Field({ nullable: true }) dateOfBirth?: Date;
  @Field({ nullable: true }) gender?: string;
  @Field({ nullable: true }) bloodGroup?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) address?: string;
  @Field({ nullable: true }) addressBn?: string;
  @Field({ nullable: true }) nid?: string;
  @Field(() => [EmergencyContactInput], { nullable: true })
  emergencyContacts?: EmergencyContactInput[];
  @Field(() => [AllergyInput], { nullable: true }) allergies?: AllergyInput[];
}

@Resolver(() => PatientType)
export class PatientResolver {
  constructor(private readonly patientService: PatientService) {}

  @Query(() => PaginatedPatientsType, { description: 'Search and paginate patient listings' })
  async patients(
    @CurrentUser() currentUser: any,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
  ): Promise<PaginatedPatientsType> {
    return this.patientService.listPatients(currentUser.hospitalId, search, page, limit) as any;
  }

  @Query(() => PatientType, { description: 'Get detailed patient profile' })
  async patient(@Args('id', { type: () => ID }) id: string): Promise<PatientType> {
    return this.patientService.findPatientById(id) as any;
  }

  @Query(() => [TimelineItemType], { description: 'Fetch clinical timeline for a patient' })
  async patientTimeline(@Args('id', { type: () => ID }) id: string): Promise<TimelineItemType[]> {
    return this.patientService.getPatientTimeline(id);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST')
  @Mutation(() => PatientType, { description: 'Register a new patient record' })
  async createPatient(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreatePatientInput,
  ): Promise<PatientType> {
    return this.patientService.createPatient(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')
  @Mutation(() => PatientType, {
    description: 'Update demographics and clinical markers of a patient',
  })
  async updatePatient(
    @CurrentUser() currentUser: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePatientInput,
  ): Promise<PatientType> {
    return this.patientService.updatePatient(id, input, currentUser.sub) as any;
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST')
  @Mutation(() => Boolean, { description: 'Merge clinical profiles to resolve deduplication' })
  async mergePatients(
    @CurrentUser() currentUser: any,
    @Args('sourceId', { type: () => ID }) sourceId: string,
    @Args('targetId', { type: () => ID }) targetId: string,
  ): Promise<boolean> {
    return this.patientService.mergePatients(sourceId, targetId, currentUser.sub);
  }
}
