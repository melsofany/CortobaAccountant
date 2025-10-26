import { type Payment, type InsertPayment, type TreasuryStats, type Settlement } from "@shared/schema";
import { randomUUID } from "crypto";
import { getAllRows, appendRow, updateRow, deleteRow } from "./google-sheets";

export interface IStorage {
  // Payments
  getAllPayments(): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  getRecentPayments(limit: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
  settlePayment(id: string, settlement: Settlement): Promise<Payment>;
  
  // Treasury Stats
  getTreasuryStats(): Promise<TreasuryStats>;
}

function rowToPayment(row: any[], rowIndex: number): Payment {
  return {
    id: row[0] || '',
    supplierName: row[1] || '',
    amount: row[2] || '0',
    paymentDate: new Date(row[3] || new Date()),
    description: row[4] || null,
    quotationNumber: row[5] || null,
    purchaseOrderNumber: row[6] || null,
    includesVAT: row[7] === 'TRUE' || row[7] === true,
    vatAmount: row[8] || null,
    totalAmount: row[9] || '0',
    isSettled: row[10] === 'TRUE' || row[10] === true,
    settlementAmount: row[11] || null,
    settlementDate: row[12] ? new Date(row[12]) : null,
    settlementNotes: row[13] || null,
    paymentType: (row[14] || 'expense') as 'expense' | 'income',
    expenseCategory: row[15] || null,
    paymentMethod: row[16] || null,
    lineItems: row[17] || null,
    createdAt: new Date(row[18] || new Date()),
    updatedAt: new Date(),
  };
}

function paymentToRow(payment: Payment): any[] {
  return [
    payment.id,
    payment.supplierName,
    payment.amount,
    payment.paymentDate.toISOString(),
    payment.description || '',
    payment.quotationNumber || '',
    payment.purchaseOrderNumber || '',
    payment.includesVAT ? 'TRUE' : 'FALSE',
    payment.vatAmount || '',
    payment.totalAmount,
    payment.isSettled ? 'TRUE' : 'FALSE',
    payment.settlementAmount || '',
    payment.settlementDate ? payment.settlementDate.toISOString() : '',
    payment.settlementNotes || '',
    payment.paymentType,
    payment.expenseCategory || '',
    payment.paymentMethod || '',
    payment.lineItems || '',
    payment.createdAt.toISOString(),
  ];
}

function calculateVAT(amount: number, includesVAT: boolean): { baseAmount: number; vatAmount: number; totalAmount: number } {
  if (includesVAT) {
    // If amount includes VAT, we need to extract it
    // Total = Base + VAT
    // Total = Base + (Base * 0.14)
    // Total = Base * 1.14
    // Therefore: Base = Total / 1.14
    const totalAmount = amount;
    const baseAmount = totalAmount / 1.14;
    const vatAmount = totalAmount - baseAmount;
    
    return {
      baseAmount,
      vatAmount,
      totalAmount,
    };
  }
  
  // If amount doesn't include VAT, we need to add it
  const baseAmount = amount;
  const vatAmount = baseAmount * 0.14;
  const totalAmount = baseAmount + vatAmount;
  
  return {
    baseAmount,
    vatAmount,
    totalAmount,
  };
}

export class GoogleSheetsStorage implements IStorage {
  async getAllPayments(): Promise<Payment[]> {
    const rows = await getAllRows();
    return rows.map((row, index) => rowToPayment(row, index + 2));
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const rows = await getAllRows();
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return undefined;
    }

    return rowToPayment(rows[rowIndex], rowIndex + 2);
  }

  async getRecentPayments(limit: number = 10): Promise<Payment[]> {
    const payments = await this.getAllPayments();
    return payments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const inputAmount = Number(insertPayment.amount);
    const { baseAmount, vatAmount, totalAmount } = calculateVAT(inputAmount, insertPayment.includesVAT);

    const payment: Payment = {
      id,
      supplierName: insertPayment.supplierName,
      amount: baseAmount.toFixed(2),
      paymentDate: insertPayment.paymentDate,
      description: insertPayment.description || null,
      quotationNumber: insertPayment.quotationNumber || null,
      purchaseOrderNumber: insertPayment.purchaseOrderNumber || null,
      includesVAT: insertPayment.includesVAT,
      vatAmount: vatAmount > 0 ? vatAmount.toFixed(2) : null,
      totalAmount: totalAmount.toFixed(2),
      isSettled: false,
      settlementAmount: null,
      settlementDate: null,
      settlementNotes: null,
      paymentType: insertPayment.paymentType || 'expense',
      expenseCategory: insertPayment.expenseCategory || null,
      paymentMethod: insertPayment.paymentMethod || null,
      lineItems: insertPayment.lineItems || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await appendRow(paymentToRow(payment));
    return payment;
  }

  async updatePayment(id: string, updateData: Partial<InsertPayment>): Promise<Payment> {
    const rows = await getAllRows();
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Payment not found');
    }

    const currentPayment = rowToPayment(rows[rowIndex], rowIndex + 2);

    // Recalculate VAT only if amount or includesVAT changed
    let baseAmount = Number(currentPayment.amount);
    let vatAmount = Number(currentPayment.vatAmount || 0);
    let totalAmount = Number(currentPayment.totalAmount);

    if (updateData.amount !== undefined || updateData.includesVAT !== undefined) {
      // Determine the input amount based on includesVAT
      let inputAmount: number;
      const includesVAT = updateData.includesVAT !== undefined ? updateData.includesVAT : currentPayment.includesVAT;
      
      if (updateData.amount !== undefined) {
        inputAmount = Number(updateData.amount);
      } else {
        // If amount not provided, use appropriate current value based on includesVAT
        inputAmount = includesVAT ? Number(currentPayment.totalAmount) : Number(currentPayment.amount);
      }
      
      const calculated = calculateVAT(inputAmount, includesVAT);
      baseAmount = calculated.baseAmount;
      vatAmount = calculated.vatAmount;
      totalAmount = calculated.totalAmount;
    }

    const updatedPayment: Payment = {
      ...currentPayment,
      ...updateData,
      amount: baseAmount.toFixed(2),
      vatAmount: vatAmount > 0 ? vatAmount.toFixed(2) : null,
      totalAmount: totalAmount.toFixed(2),
      updatedAt: new Date(),
    };

    await updateRow(rowIndex + 2, paymentToRow(updatedPayment));
    return updatedPayment;
  }

  async deletePayment(id: string): Promise<void> {
    const rows = await getAllRows();
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Payment not found');
    }

    await deleteRow(rowIndex + 2);
  }

  async settlePayment(id: string, settlement: Settlement): Promise<Payment> {
    const rows = await getAllRows();
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      throw new Error('Payment not found');
    }

    const currentPayment = rowToPayment(rows[rowIndex], rowIndex + 2);

    const settledPayment: Payment = {
      ...currentPayment,
      isSettled: true,
      settlementAmount: settlement.settlementAmount,
      settlementDate: settlement.settlementDate,
      settlementNotes: settlement.settlementNotes || null,
      updatedAt: new Date(),
    };

    await updateRow(rowIndex + 2, paymentToRow(settledPayment));
    return settledPayment;
  }

  async getTreasuryStats(): Promise<TreasuryStats> {
    const payments = await this.getAllPayments();

    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalVAT = 0;
    let settledCount = 0;
    let pendingCount = 0;

    for (const payment of payments) {
      const amount = Number(payment.totalAmount);
      const vat = Number(payment.vatAmount || 0);

      if (payment.paymentType === 'income') {
        totalIncome += amount;
        totalBalance += amount;
      } else {
        totalExpenses += amount;
        totalBalance -= amount;
      }

      totalVAT += vat;

      if (payment.isSettled) {
        settledCount++;
      } else {
        pendingCount++;
      }
    }

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      totalVAT,
      paymentsCount: payments.length,
      settledCount,
      pendingCount,
    };
  }
}

export const storage = new GoogleSheetsStorage();
