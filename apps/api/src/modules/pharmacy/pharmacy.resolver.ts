import { Resolver, Query, Mutation, Args, ID, InputType, Field, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { PharmacyService } from './pharmacy.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MedicineType } from '../prescription/prescription.resolver';
import { PatientType } from '../patient/patient.resolver';
import { PrescriptionType } from '../prescription/prescription.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('StockBatch')
export class StockBatchType {
  @Field(() => ID) id!: string;
  @Field(() => ID, { nullable: true }) itemId?: string;
  @Field(() => ID, { nullable: true }) medicineId?: string;
  @Field() batchNumber!: string;
  @Field({ nullable: true }) expiryDate?: Date;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitCost!: number;

  @Field(() => MedicineType, { nullable: true }) medicine?: MedicineType;
}

import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('PharmacyShift')
export class PharmacyShiftType {
  @Field(() => ID) id!: string;
  @Field(() => ID) openedBy!: string;
  @Field(() => ID, { nullable: true }) closedBy?: string;
  @Field() status!: string; // OPEN, CLOSED
  @Field(() => FloatScalar) openingBalance!: number;
  @Field(() => FloatScalar, { nullable: true }) expectedCash?: number;
  @Field(() => FloatScalar, { nullable: true }) actualCash?: number;
  @Field(() => FloatScalar, { nullable: true }) expectedBkash?: number;
  @Field(() => FloatScalar, { nullable: true }) expectedSslcommerz?: number;
  @Field(() => FloatScalar, { nullable: true }) variance?: number;
  @Field({ nullable: true }) notes?: string;
  @Field() openedAt!: Date;
  @Field({ nullable: true }) closedAt?: Date;
}

@ObjectType('PharmacySaleItem')
export class PharmacySaleItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
  @Field(() => FloatScalar) discount!: number;
  @Field(() => FloatScalar) total!: number;

  @Field(() => StockBatchType, { nullable: true }) batch?: StockBatchType;
  @Field(() => MedicineType, { nullable: true }) medicine?: MedicineType;
}

@ObjectType('PharmacySplitPayment')
export class PharmacySplitPaymentType {
  @Field(() => ID) id!: string;
  @Field() method!: string; // CASH, CARD, MOBILE_BANKING, etc.
  @Field(() => FloatScalar) amount!: number;
  @Field({ nullable: true }) reference?: string;
}

@ObjectType('PharmacySale')
export class PharmacySaleType {
  @Field(() => ID) id!: string;
  @Field() invoiceNo!: string;
  @Field(() => ID, { nullable: true }) patientId?: string;
  @Field(() => FloatScalar) subtotal!: number;
  @Field(() => FloatScalar) discount!: number;
  @Field(() => FloatScalar) total!: number;
  @Field() isVoided!: boolean;
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => [PharmacySaleItemType]) items!: PharmacySaleItemType[];
  @Field(() => [PharmacySplitPaymentType]) payments!: PharmacySplitPaymentType[];
}

@ObjectType('PharmacyReturnItem')
export class PharmacyReturnItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;

  @Field(() => MedicineType, { nullable: true }) medicine?: MedicineType;
}

@ObjectType('PharmacyReturn')
export class PharmacyReturnType {
  @Field(() => ID) id!: string;
  @Field(() => ID) saleId!: string;
  @Field({ nullable: true }) reason?: string;
  @Field(() => FloatScalar) refundAmt!: number;
  @Field() isWasted!: boolean;
  @Field() createdAt!: Date;

  @Field(() => [PharmacyReturnItemType]) items!: PharmacyReturnItemType[];
}

@ObjectType('PharmacyDispenseItem')
export class PharmacyDispenseItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;

  @Field(() => MedicineType, { nullable: true }) medicine?: MedicineType;
}

@ObjectType('PharmacyDispense')
export class PharmacyDispenseType {
  @Field(() => ID) id!: string;
  @Field(() => ID) prescriptionId!: string;
  @Field() isPartial!: boolean;
  @Field({ nullable: true }) notes?: string;
  @Field() createdAt!: Date;

  @Field(() => [PharmacyDispenseItemType]) items!: PharmacyDispenseItemType[];
}

@ObjectType('HeldSale')
export class HeldSaleType {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) patientId?: string;
  @Field() itemsJson!: string; // Serialized items cart array
  @Field() createdAt!: Date;
}

@ObjectType('ExpiringMedicine')
export class ExpiringMedicineType {
  @Field(() => ID) id!: string;
  @Field() batchNumber!: string;
  @Field() expiryDate!: Date;
  @Field(() => Int) qty!: number;
  @Field(() => MedicineType) medicine!: MedicineType;
}

@ObjectType('ShiftCloseReport')
export class ShiftCloseReportType {
  @Field(() => FloatScalar) openingBalance!: number;
  @Field(() => FloatScalar) expectedCash!: number;
  @Field(() => FloatScalar) expectedBkash!: number;
  @Field(() => FloatScalar) expectedSslcommerz!: number;
  @Field(() => FloatScalar) totalExpected!: number;
}

@InputType()
export class CreatePosSaleItemInput {
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
  @Field(() => FloatScalar, { defaultValue: 0 }) discount!: number;
}

@InputType()
export class SplitPaymentInput {
  @Field() method!: string;
  @Field(() => FloatScalar) amount!: number;
  @Field({ nullable: true }) reference?: string;
}

@InputType()
export class CreatePosSaleInput {
  @Field(() => ID, { nullable: true }) patientId?: string;
  @Field(() => [CreatePosSaleItemInput]) items!: CreatePosSaleItemInput[];
  @Field(() => [SplitPaymentInput]) payments!: SplitPaymentInput[];
  @Field(() => FloatScalar, { defaultValue: 0 }) discount!: number;
}

@InputType()
export class DispenseItemInput {
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
}

@InputType()
export class PosReturnItemInput {
  @Field(() => ID) medicineId!: string;
  @Field(() => ID) batchId!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
}

@Resolver(() => PharmacySaleType)
export class PharmacyResolver {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField(() => PatientType, { nullable: true })
  async patient(@Parent() parent: any) {
    if (!parent.patientId) return null;
    return this.prisma.patient.findUnique({
      where: { id: parent.patientId },
    });
  }

  @ResolveField(() => [PharmacySaleItemType])
  async items(@Parent() parent: any) {
    return this.prisma.pharmacySaleItem.findMany({
      where: { saleId: parent.id },
      include: { batch: { include: { medicine: true } } },
    });
  }

  @ResolveField(() => [PharmacySplitPaymentType])
  async payments(@Parent() parent: any) {
    return this.prisma.pharmacySplitPayment.findMany({
      where: { saleId: parent.id },
    });
  }

  @Query(() => [PrescriptionType], { description: 'Get prescriptions ready for dispensing' })
  async pendingPrescriptions(
    @CurrentUser() currentUser: any,
  ): Promise<PrescriptionType[]> {
    return this.pharmacyService.getPendingPrescriptions(currentUser.hospitalId) as any;
  }

  @Query(() => [StockBatchType], { description: 'Get medicine stock level by brand or generic' })
  async pharmacyInventory(
    @CurrentUser() currentUser: any,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('category', { type: () => String, nullable: true }) category?: string,
  ): Promise<StockBatchType[]> {
    return this.pharmacyService.getInventory(currentUser.hospitalId, search, category) as any;
  }

  @Query(() => [ExpiringMedicineType], { description: 'Get stock batches expiring soon' })
  async expiringMedicines(
    @CurrentUser() currentUser: any,
    @Args('withinDays', { type: () => Int, defaultValue: 90 }) withinDays: number,
  ): Promise<ExpiringMedicineType[]> {
    return this.pharmacyService.getExpiring(currentUser.hospitalId, withinDays) as any;
  }

  @Query(() => ShiftCloseReportType, { description: 'Reconcile shift drawer statistics' })
  async shiftCloseReport(
    @Args('shiftId', { type: () => ID }) shiftId: string,
  ): Promise<ShiftCloseReportType> {
    return this.pharmacyService.getShiftCloseReport(shiftId) as any;
  }

  @Query(() => PharmacySaleType, { nullable: true, description: 'Find a pharmacy sale by invoice number' })
  async findPharmacySale(
    @CurrentUser() currentUser: any,
    @Args('invoiceNo') invoiceNo: string,
  ): Promise<PharmacySaleType | null> {
    return this.pharmacyService.findSaleByInvoice(currentUser.hospitalId, invoiceNo) as any;
  }

  @Query(() => PharmacyShiftType, { nullable: true, description: 'Get currently active cashier shift' })
  async activePharmacyShift(
    @CurrentUser() currentUser: any,
  ): Promise<PharmacyShiftType | null> {
    return this.pharmacyService.getActiveShift(currentUser.hospitalId, currentUser.sub) as any;
  }

  @Query(() => HeldSaleType, { nullable: true, description: 'Resume a parked sale' })
  async resumePosSale(
    @Args('holdId', { type: () => ID }) holdId: string,
  ): Promise<HeldSaleType | null> {
    return this.pharmacyService.resumeSale(holdId) as any;
  }

  @Mutation(() => PharmacyDispenseType, { description: 'Dispense medication for prescription' })
  async dispenseMedication(
    @CurrentUser() currentUser: any,
    @Args('prescriptionId', { type: () => ID }) prescriptionId: string,
    @Args('items', { type: () => [DispenseItemInput] }) items: DispenseItemInput[],
    @Args('notes', { type: () => String, nullable: true }) notes?: string,
  ): Promise<PharmacyDispenseType> {
    return this.pharmacyService.dispensePrescription(currentUser.hospitalId, prescriptionId, items, notes, currentUser.sub) as any;
  }

  @Mutation(() => PharmacyShiftType, { description: 'Open cashier shift drawer' })
  async openPosShift(
    @CurrentUser() currentUser: any,
    @Args('openingBalance', { type: () => FloatScalar }) openingBalance: number,
  ): Promise<PharmacyShiftType> {
    return this.pharmacyService.openShift(currentUser.hospitalId, openingBalance, currentUser.sub) as any;
  }

  @Mutation(() => PharmacyShiftType, { description: 'Close cashier shift drawer' })
  async closePosShift(
    @CurrentUser() currentUser: any,
    @Args('shiftId', { type: () => ID }) shiftId: string,
    @Args('actualCash', { type: () => FloatScalar }) actualCash: number,
    @Args('notes', { type: () => String, nullable: true }) notes?: string,
  ): Promise<PharmacyShiftType> {
    return this.pharmacyService.closeShift(shiftId, actualCash, notes, currentUser.sub) as any;
  }

  @Mutation(() => PharmacySaleType, { description: 'Process point of sale transaction' })
  async createPosSale(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreatePosSaleInput,
  ): Promise<PharmacySaleType> {
    return this.pharmacyService.createSale(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Mutation(() => HeldSaleType, { description: 'Park current POS cart' })
  async holdPosSale(
    @Args('patientId', { type: () => ID, nullable: true }) patientId: string,
    @Args('itemsJson') itemsJson: string,
  ): Promise<HeldSaleType> {
    return this.pharmacyService.holdSale(patientId, itemsJson) as any;
  }

  @Mutation(() => PharmacyReturnType, { description: 'Record return and reverse stock' })
  async posReturn(
    @CurrentUser() currentUser: any,
    @Args('saleId', { type: () => ID }) saleId: string,
    @Args('items', { type: () => [PosReturnItemInput] }) items: PosReturnItemInput[],
    @Args('isWasted', { type: () => Boolean, defaultValue: false }) isWasted: boolean,
    @Args('reason', { type: () => String, nullable: true }) reason?: string,
  ): Promise<PharmacyReturnType> {
    return this.pharmacyService.processReturn(currentUser.hospitalId, saleId, items, reason, isWasted, currentUser.sub) as any;
  }
}

@Resolver(() => StockBatchType)
export class StockBatchResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveField(() => MedicineType, { nullable: true })
  async medicine(@Parent() parent: any) {
    if (!parent.medicineId) return null;
    return this.prisma.medicine.findUnique({
      where: { id: parent.medicineId },
    });
  }
}
