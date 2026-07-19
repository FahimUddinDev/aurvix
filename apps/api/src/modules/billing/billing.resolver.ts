import { Resolver, Query, Mutation, Args, ID, InputType, Field, Int, ResolveField, Parent } from '@nestjs/graphql';
import { ObjectType } from '@nestjs/graphql';
import { BillingService } from './billing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientType } from '../patient/patient.resolver';
import { PrismaService } from '../../database/prisma/prisma.service';

@ObjectType('BillLineItem')
export class BillLineItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID, { nullable: true }) servicePriceId?: string;
  @Field() description!: string;
  @Field(() => Int) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
  @Field(() => FloatScalar) taxPercent!: number;
  @Field(() => FloatScalar) total!: number;
}

import { GraphQLScalarType } from 'graphql';
const FloatScalar = new GraphQLScalarType({
  name: 'FloatScalar',
  serialize: (val: any) => Number(val),
  parseValue: (val: any) => val,
  parseLiteral: (ast: any) => ast.value,
});

@ObjectType('Payment')
export class PaymentType {
  @Field(() => ID) id!: string;
  @Field() method!: string; // CASH, SSLCOMMERZ, BKASH, BANK_TRANSFER
  @Field() status!: string; // PENDING, COMPLETED, FAILED, REFUNDED
  @Field(() => FloatScalar) amount!: number;
  @Field({ nullable: true }) reference?: string;
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) paidAt?: Date;
  @Field() createdAt!: Date;
}

@ObjectType('Bill')
export class BillType {
  @Field(() => ID) id!: string;
  @Field(() => ID, { nullable: true }) visitId?: string;
  @Field(() => ID, { nullable: true }) admissionId?: string;
  @Field() billNo!: string;
  @Field() status!: string; // DRAFT, ISSUED, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED
  @Field(() => FloatScalar) subtotal!: number;
  @Field(() => FloatScalar) taxAmount!: number;
  @Field(() => FloatScalar) discount!: number;
  @Field(() => FloatScalar) totalAmount!: number;
  @Field(() => FloatScalar) paidAmount!: number;
  @Field(() => FloatScalar) dueAmount!: number;
  @Field({ nullable: true }) notes?: string;
  @Field() createdAt!: Date;

  @Field(() => PatientType, { nullable: true }) patient?: PatientType;
  @Field(() => [BillLineItemType], { defaultValue: [] }) lineItems!: BillLineItemType[];
  @Field(() => [PaymentType], { defaultValue: [] }) payments!: PaymentType[];
}

@ObjectType('SSLCommerzRedirect')
export class SSLCommerzRedirectType {
  @Field() redirectUrl!: string;
  @Field() gatewayStatus!: string;
}

@InputType()
export class CreateBillInput {
  @Field(() => ID) patientId!: string;
  @Field(() => ID, { nullable: true }) visitId?: string;
  @Field(() => ID, { nullable: true }) admissionId?: string;
  @Field({ nullable: true }) notes?: string;
}

@InputType()
export class AddLineItemInput {
  @Field(() => ID, { nullable: true }) servicePriceId?: string;
  @Field() description!: string;
  @Field(() => Int, { defaultValue: 1 }) qty!: number;
  @Field(() => FloatScalar) unitPrice!: number;
  @Field(() => FloatScalar, { defaultValue: 0 }) taxPercent!: number;
}

@InputType()
export class ProcessPaymentInput {
  @Field() method!: string; // CASH, SSLCOMMERZ, BKASH, BANK_TRANSFER
  @Field(() => FloatScalar) amount!: number;
  @Field({ nullable: true }) reference?: string;
  @Field({ nullable: true }) notes?: string;
}

@Resolver(() => BillType)
export class BillingResolver {
  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  @ResolveField(() => PatientType, { nullable: true })
  async patient(@Parent() parent: any) {
    if (!parent.patientId) return null;
    return this.prisma.patient.findUnique({
      where: { id: parent.patientId },
    });
  }

  @ResolveField(() => [BillLineItemType])
  async lineItems(@Parent() parent: any) {
    return this.prisma.billLineItem.findMany({
      where: { billId: parent.id },
    });
  }

  @ResolveField(() => [PaymentType])
  async payments(@Parent() parent: any) {
    return this.prisma.payment.findMany({
      where: { billId: parent.id },
    });
  }

  @Query(() => [BillType], { description: 'Get invoices list' })
  async bills(
    @CurrentUser() currentUser: any,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<BillType[]> {
    return this.billingService.getBills(currentUser.hospitalId, status, search) as any;
  }

  @Query(() => BillType, { description: 'Get specific invoice details' })
  async bill(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BillType> {
    return this.billingService.getBillById(id) as any;
  }

  @Mutation(() => BillType, { description: 'Create draft bill invoice' })
  async createBill(
    @CurrentUser() currentUser: any,
    @Args('input') input: CreateBillInput,
  ): Promise<BillType> {
    return this.billingService.createDraftBill(currentUser.hospitalId, input, currentUser.sub) as any;
  }

  @Mutation(() => BillType, { description: 'Add line item to bill invoice' })
  async addLineItem(
    @CurrentUser() currentUser: any,
    @Args('billId', { type: () => ID }) billId: string,
    @Args('input') input: AddLineItemInput,
  ): Promise<BillType> {
    return this.billingService.addLineItem(billId, input, currentUser.sub) as any;
  }

  @Mutation(() => BillType, { description: 'Remove line item from bill invoice' })
  async removeLineItem(
    @CurrentUser() currentUser: any,
    @Args('billId', { type: () => ID }) billId: string,
    @Args('itemId', { type: () => ID }) itemId: string,
  ): Promise<BillType> {
    return this.billingService.removeLineItem(billId, itemId, currentUser.sub) as any;
  }

  @Mutation(() => BillType, { description: 'Process payment checkout' })
  async processPayment(
    @CurrentUser() currentUser: any,
    @Args('billId', { type: () => ID }) billId: string,
    @Args('input') input: ProcessPaymentInput,
  ): Promise<BillType> {
    return this.billingService.checkoutPayment(billId, input, currentUser.sub) as any;
  }

  @Mutation(() => SSLCommerzRedirectType, { description: 'Initialize digital payment checkout link' })
  async initSSLCommerzPayment(
    @CurrentUser() currentUser: any,
    @Args('billId', { type: () => ID }) billId: string,
  ): Promise<SSLCommerzRedirectType> {
    return this.billingService.initSSLCommerz(billId, currentUser.sub) as any;
  }
}
