import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BillStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getBills(hospitalId: string, status?: string, search?: string) {
    const where: any = { hospitalId };
    if (status) {
      where.status = status as BillStatus;
    }
    if (search) {
      where.OR = [
        { billNo: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { uhid: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.bill.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBillById(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        patient: true,
        lineItems: true,
        payments: true,
      },
    });

    if (!bill) {
      throw new Error(`Invoice with ID ${id} not found.`);
    }

    return bill;
  }

  async createDraftBill(hospitalId: string, input: any, createdBy: string) {
    const { patientId, visitId, admissionId, notes } = input;
    const billNo = `BL-INV-${Date.now()}`;

    return this.prisma.bill.create({
      data: {
        hospitalId,
        patientId,
        visitId,
        admissionId,
        billNo,
        status: BillStatus.DRAFT,
        subtotal: 0,
        taxAmount: 0,
        discount: 0,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        notes,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async addLineItem(billId: string, input: any, updatedBy: string) {
    const { servicePriceId, description, qty, unitPrice, taxPercent } = input;

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error('Invoice not found.');

      const itemSubtotal = qty * unitPrice;
      const itemTax = itemSubtotal * (taxPercent / 100);
      const itemTotal = itemSubtotal + itemTax;

      // Create item
      await tx.billLineItem.create({
        data: {
          hospitalId: bill.hospitalId,
          billId,
          servicePriceId,
          description,
          qty,
          unitPrice,
          taxPercent,
          total: itemTotal,
          createdBy: updatedBy,
          updatedBy,
        },
      });

      // Recalculate Bill sums
      const allItems = await tx.billLineItem.findMany({ where: { billId } });
      const subtotal = allItems.reduce((acc, i) => acc + Number(i.unitPrice) * i.qty, 0);
      const taxAmount = allItems.reduce((acc, i) => acc + Number(i.unitPrice) * i.qty * (Number(i.taxPercent) / 100), 0);
      const totalAmount = subtotal + taxAmount - Number(bill.discount);
      const dueAmount = totalAmount - Number(bill.paidAmount);

      return tx.bill.update({
        where: { id: billId },
        data: {
          status: BillStatus.ISSUED, // Change from DRAFT to ISSUED
          subtotal,
          taxAmount,
          totalAmount,
          dueAmount,
          updatedBy,
        },
        include: { patient: true, lineItems: true, payments: true },
      });
    });
  }

  async removeLineItem(billId: string, itemId: string, updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error('Invoice not found.');

      await tx.billLineItem.delete({ where: { id: itemId } });

      // Recalculate Bill sums
      const allItems = await tx.billLineItem.findMany({ where: { billId } });
      const subtotal = allItems.reduce((acc, i) => acc + Number(i.unitPrice) * i.qty, 0);
      const taxAmount = allItems.reduce((acc, i) => acc + Number(i.unitPrice) * i.qty * (Number(i.taxPercent) / 100), 0);
      const totalAmount = subtotal + taxAmount - Number(bill.discount);
      const dueAmount = totalAmount - Number(bill.paidAmount);

      return tx.bill.update({
        where: { id: billId },
        data: {
          subtotal,
          taxAmount,
          totalAmount,
          dueAmount,
          updatedBy,
        },
        include: { patient: true, lineItems: true, payments: true },
      });
    });
  }

  async checkoutPayment(billId: string, input: any, cashierId: string) {
    const { method, amount, reference, notes } = input;

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new Error('Invoice not found.');

      // Create Payment log
      await tx.payment.create({
        data: {
          hospitalId: bill.hospitalId,
          billId,
          method: method as PaymentMethod,
          status: PaymentStatus.COMPLETED,
          amount,
          reference,
          notes,
          paidAt: new Date(),
          createdBy: cashierId,
          updatedBy: cashierId,
        },
      });

      const paidAmount = Number(bill.paidAmount) + amount;
      const dueAmount = Number(bill.totalAmount) - paidAmount;
      const status = dueAmount <= 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID;

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          status,
          paidAmount,
          dueAmount,
          updatedBy: cashierId,
        },
        include: { patient: true, lineItems: true, payments: true },
      });

      this.eventEmitter.emit('billing.payment_received', { billId, amount, invoiceNo: bill.billNo });

      return updatedBill;
    });
  }

  async initSSLCommerz(billId: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new Error('Invoice not found.');

    return {
      redirectUrl: `https://sandbox.sslcommerz.com/gwprocess/mockup-checkout-url?billId=${billId}`,
      gatewayStatus: 'SUCCESS',
    };
  }

  // Automated compiler listener when doctor consultation completes
  @OnEvent('consultation.completed')
  async handleConsultationCompleted(payload: {
    visitId: string;
    patientId: string;
    doctorId: string;
    hospitalId: string;
  }) {
    const { visitId, patientId, doctorId, hospitalId } = payload;

    try {
      // Find doctor fee
      const fee = await this.prisma.doctorFee.findFirst({
        where: { doctorId },
      });

      const docProfile = await this.prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: true },
      });

      const docName = docProfile ? `${docProfile.user.firstName} ${docProfile.user.lastName}` : 'Consultant';

      // Create draft bill
      const bill = await this.createDraftBill(
        hospitalId,
        { patientId, visitId },
        'system-billing-trigger',
      );

      // Add doctor consultation fee item
      await this.addLineItem(
        bill.id,
        {
          description: `Outpatient Consultation Fee — Dr. ${docName}`,
          qty: 1,
          unitPrice: fee ? Number(fee.amount) : 800.0,
          taxPercent: 5.0, // 5% standard BD health tax
        },
        'system-billing-trigger',
      );
    } catch (err) {
      console.error('Failed to compile consultation bill automatically:', err);
    }
  }

  @OnEvent('admission.discharged')
  async handleAdmissionDischarged(payload: {
    admissionId: string;
    patientId: string;
    hospitalId: string;
    wardId: string;
    admissionDate: Date;
    dischargeDate: Date;
  }) {
    const { admissionId, patientId, hospitalId, wardId, admissionDate, dischargeDate } = payload;

    try {
      const ward = await this.prisma.ward.findUnique({
        where: { id: wardId },
      });
      if (!ward) return;

      const admission = await this.prisma.admission.findUnique({
        where: { id: admissionId },
        include: { bed: true },
      });
      if (!admission) return;

      // Calculate days spent
      const diffTime = Math.abs(new Date(dischargeDate).getTime() - new Date(admissionDate).getTime());
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Find or create bill for this admission
      let bill = await this.prisma.bill.findFirst({
        where: { admissionId, status: { in: [BillStatus.DRAFT, BillStatus.ISSUED] } },
      });

      if (!bill) {
        bill = await this.createDraftBill(
          hospitalId,
          { patientId, admissionId },
          'system-billing-trigger',
        );
      }

      // Add room charge item
      await this.addLineItem(
        bill.id,
        {
          description: `Daily Room Charge — Ward: ${ward.name} | Bed: ${admission.bed.bedNumber}`,
          qty: days,
          unitPrice: Number(ward.dailyRate),
          taxPercent: 5.0,
        },
        'system-billing-trigger',
      );
    } catch (err) {
      console.error('Failed to compile inpatient room bill automatically:', err);
    }
  }
}
