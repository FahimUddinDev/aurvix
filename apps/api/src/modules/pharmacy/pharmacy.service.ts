import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PharmacyShiftStatus,
  LabOrderStatus,
  PrescriptionStatus,
  StockTransactionType,
  PaymentMethod,
} from '@prisma/client';

@Injectable()
export class PharmacyService {
  private heldSales = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPendingPrescriptions(hospitalId: string) {
    return this.prisma.prescription.findMany({
      where: { hospitalId, status: PrescriptionStatus.ACTIVE },
      include: {
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInventory(hospitalId: string, search?: string, category?: string) {
    const where: any = {
      hospitalId,
      qty: { gt: 0 },
    };

    if (category) {
      where.medicine = { category };
    }

    if (search) {
      where.medicine = {
        ...where.medicine,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brandName: { contains: search, mode: 'insensitive' } },
          { genericName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.stockBatch.findMany({
      where,
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' }, // Sort by expiry to facilitate FEFO audits
    });
  }

  async getExpiring(hospitalId: string, withinDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + withinDays);

    return this.prisma.stockBatch.findMany({
      where: {
        hospitalId,
        qty: { gt: 0 },
        expiryDate: {
          lte: cutoffDate,
          gte: new Date(),
        },
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async findSaleByInvoice(hospitalId: string, invoiceNo: string) {
    return this.prisma.pharmacySale.findUnique({
      where: { invoiceNo },
      include: {
        items: { include: { batch: { include: { medicine: true } } } },
        payments: true,
      },
    });
  }

  async getActiveShift(hospitalId: string, openedBy: string) {
    return this.prisma.pharmacyShift.findFirst({
      where: {
        hospitalId,
        openedBy,
        status: PharmacyShiftStatus.OPEN,
      },
    });
  }

  async openShift(hospitalId: string, openingBalance: number, openedBy: string) {
    // Check if shift is already open
    const active = await this.getActiveShift(hospitalId, openedBy);
    if (active) return active;

    return this.prisma.pharmacyShift.create({
      data: {
        hospitalId,
        openedBy,
        status: PharmacyShiftStatus.OPEN,
        openingBalance,
        openedAt: new Date(),
        createdBy: openedBy,
        updatedBy: openedBy,
      },
    });
  }

  async getShiftCloseReport(shiftId: string) {
    const sales = await this.prisma.pharmacySale.findMany({
      where: { shiftId, isVoided: false },
      include: { payments: true },
    });

    const shift = await this.prisma.pharmacyShift.findUnique({
      where: { id: shiftId },
    });
    if (!shift) throw new Error('Shift not found.');

    let expectedCash = 0;
    let expectedBkash = 0;
    let expectedSslcommerz = 0;

    sales.forEach((s) => {
      s.payments.forEach((p) => {
        if (p.method === 'CASH') expectedCash += Number(p.amount);
        else if (p.method === 'BKASH') expectedBkash += Number(p.amount);
        else if (p.method === 'SSLCOMMERZ') expectedSslcommerz += Number(p.amount);
      });
    });

    const totalExpected = Number(shift.openingBalance) + expectedCash + expectedBkash + expectedSslcommerz;

    return {
      openingBalance: Number(shift.openingBalance),
      expectedCash,
      expectedBkash,
      expectedSslcommerz,
      totalExpected,
    };
  }

  async closeShift(shiftId: string, actualCash: number, notes: string | undefined, closedBy: string) {
    const report = await this.getShiftCloseReport(shiftId);

    const variance = actualCash - report.totalExpected;

    return this.prisma.pharmacyShift.update({
      where: { id: shiftId },
      data: {
        status: PharmacyShiftStatus.CLOSED,
        closedBy,
        closedAt: new Date(),
        expectedCash: report.expectedCash,
        expectedBkash: report.expectedBkash,
        expectedSslcommerz: report.expectedSslcommerz,
        actualCash,
        variance,
        notes,
        updatedBy: closedBy,
      },
    });
  }

  async createSale(hospitalId: string, input: any, cashierId: string) {
    const { patientId, items, payments, discount } = input;

    // Check shift
    const shift = await this.getActiveShift(hospitalId, cashierId);
    if (!shift) throw new Error('No active cashier shift drawer open.');

    const subtotal = items.reduce((acc: number, item: any) => acc + item.qty * item.unitPrice, 0);
    const total = subtotal - discount;

    const invoiceNo = `INV-POS-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sale Header
      const sale = await tx.pharmacySale.create({
        data: {
          hospitalId,
          shiftId: shift.id,
          invoiceNo,
          patientId,
          subtotal,
          discount,
          total,
          isVoided: false,
          createdBy: cashierId,
          updatedBy: cashierId,
        },
      });

      // 2. Create Sale Items & deduct stock
      for (const item of items) {
        const batch = await tx.stockBatch.findUnique({
          where: { id: item.batchId },
        });
        if (!batch || batch.qty < item.qty) {
          throw new Error(`Insufficient stock in batch ${batch?.batchNumber || item.batchId}.`);
        }

        // Deduct stock
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: { qty: batch.qty - item.qty },
        });

        // Log stock transaction
        await tx.stockTransaction.create({
          data: {
            hospitalId,
            itemId: batch.itemId || item.batchId, // Fallback if inventory item ID differs
            type: StockTransactionType.OUT,
            qty: item.qty,
            reference: invoiceNo,
            notes: `POS sale checkout`,
            createdBy: cashierId,
            updatedBy: cashierId,
          },
        });

        await tx.pharmacySaleItem.create({
          data: {
            hospitalId,
            saleId: sale.id,
            medicineId: item.medicineId,
            batchId: item.batchId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.qty * item.unitPrice - item.discount,
            createdBy: cashierId,
            updatedBy: cashierId,
          },
        });
      }

      // 3. Create payments
      for (const pay of payments) {
        await tx.pharmacySplitPayment.create({
          data: {
            hospitalId,
            saleId: sale.id,
            method: pay.method as PaymentMethod,
            amount: pay.amount,
            reference: pay.reference,
            createdBy: cashierId,
            updatedBy: cashierId,
          },
        });
      }

      this.eventEmitter.emit('pos.sale_completed', { saleId: sale.id, invoiceNo });

      return sale;
    });
  }

  async holdSale(patientId: string | undefined, itemsJson: string) {
    const id = `hold-${Math.random().toString(36).substr(2, 9)}`;
    const held = {
      id,
      patientId,
      itemsJson,
      createdAt: new Date(),
    };
    this.heldSales.set(id, held);
    return held;
  }

  async resumeSale(holdId: string) {
    const held = this.heldSales.get(holdId);
    if (!held) return null;
    this.heldSales.delete(holdId); // Remove once resumed
    return held;
  }

  async processReturn(
    hospitalId: string,
    saleId: string,
    items: any[],
    reason: string | undefined,
    isWasted: boolean,
    cashierId: string,
  ) {
    const refundAmt = items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Return Header
      const ret = await tx.pharmacyReturn.create({
        data: {
          hospitalId,
          saleId,
          reason,
          refundAmt,
          isWasted,
          createdBy: cashierId,
          updatedBy: cashierId,
        },
      });

      // 2. Return items to stock & log transaction
      for (const item of items) {
        await tx.pharmacyReturnItem.create({
          data: {
            hospitalId,
            returnId: ret.id,
            medicineId: item.medicineId,
            batchId: item.batchId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            createdBy: cashierId,
            updatedBy: cashierId,
          },
        });

        const batch = await tx.stockBatch.findUnique({
          where: { id: item.batchId },
        });

        if (!isWasted && batch) {
          // Restore stock
          await tx.stockBatch.update({
            where: { id: item.batchId },
            data: { qty: batch.qty + item.qty },
          });

          // Log transaction
          await tx.stockTransaction.create({
            data: {
              hospitalId,
              itemId: batch.itemId || item.batchId,
              type: StockTransactionType.IN,
              qty: item.qty,
              reference: `RET-${ret.id.slice(-6)}`,
              notes: 'POS Sale Return (restored to shelf)',
              createdBy: cashierId,
              updatedBy: cashierId,
            },
          });
        } else if (batch) {
          // Log waste/adjustment
          await tx.stockTransaction.create({
            data: {
              hospitalId,
              itemId: batch.itemId || item.batchId,
              type: StockTransactionType.ADJUSTMENT,
              qty: item.qty,
              reference: `RET-${ret.id.slice(-6)}`,
              notes: 'POS Sale Return (damaged/wasted)',
              createdBy: cashierId,
              updatedBy: cashierId,
            },
          });
        }
      }

      this.eventEmitter.emit('pos.return_processed', { returnId: ret.id });

      return ret;
    });
  }

  async dispensePrescription(
    hospitalId: string,
    prescriptionId: string,
    items: any[],
    notes: string | undefined,
    dispenserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Dispense Header
      const dispense = await tx.pharmacyDispense.create({
        data: {
          hospitalId,
          prescriptionId,
          isPartial: false, // Defaulting false, calculated if partial matching done
          notes,
          dispensedBy: dispenserId,
          createdBy: dispenserId,
          updatedBy: dispenserId,
        },
      });

      // 2. Save items & deduct stock
      for (const item of items) {
        const batch = await tx.stockBatch.findUnique({
          where: { id: item.batchId },
        });
        if (!batch || batch.qty < item.qty) {
          throw new Error('Insufficient stock for dispensing.');
        }

        // Deduct stock
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: { qty: batch.qty - item.qty },
        });

        // Stock transaction log
        await tx.stockTransaction.create({
          data: {
            hospitalId,
            itemId: batch.itemId || item.batchId,
            type: StockTransactionType.OUT,
            qty: item.qty,
            reference: `DISP-${dispense.id.slice(-6)}`,
            notes: 'Prescription dispensing checkout',
            createdBy: dispenserId,
            updatedBy: dispenserId,
          },
        });

        await tx.pharmacyDispenseItem.create({
          data: {
            hospitalId,
            dispenseId: dispense.id,
            medicineId: item.medicineId,
            batchId: item.batchId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            createdBy: dispenserId,
            updatedBy: dispenserId,
          },
        });
      }

      // Update prescription status
      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: PrescriptionStatus.DISPENSED,
          updatedBy: dispenserId,
        },
      });

      this.eventEmitter.emit('prescription.dispensed', { dispenseId: dispense.id, prescriptionId });

      return dispense;
    });
  }
}
