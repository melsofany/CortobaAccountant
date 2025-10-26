import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Payment schema - الدفعات
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierName: text("supplier_name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  description: text("description"),
  quotationNumber: text("quotation_number"),
  purchaseOrderNumber: text("purchase_order_number"),
  includesVAT: boolean("includes_vat").default(false).notNull(),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  isSettled: boolean("is_settled").default(false).notNull(),
  settlementAmount: decimal("settlement_amount", { precision: 12, scale: 2 }),
  settlementDate: timestamp("settlement_date"),
  settlementNotes: text("settlement_notes"),
  paymentType: text("payment_type").notNull().default("expense"), // expense or income
  expenseCategory: text("expense_category"), // supplier, transport, shipping, salaries, rent, office_supplies, miscellaneous
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments, {
  amount: z.string().min(1, "المبلغ مطلوب"),
  supplierName: z.string().min(1, "اسم المورد/الجهة مطلوب"),
  paymentDate: z.coerce.date(),
  description: z.string().optional(),
  quotationNumber: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  includesVAT: z.boolean().default(false),
  paymentType: z.enum(["expense", "income"]).default("expense"),
  expenseCategory: z.enum(["supplier", "transport", "shipping", "salaries", "rent", "office_supplies", "miscellaneous"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  vatAmount: true,
  totalAmount: true,
});

export const updatePaymentSchema = insertPaymentSchema.partial();

export const settlementSchema = z.object({
  settlementAmount: z.string().min(1, "مبلغ التسوية مطلوب"),
  settlementDate: z.coerce.date(),
  settlementNotes: z.string().optional(),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type Settlement = z.infer<typeof settlementSchema>;

// Treasury Statistics Type
export type TreasuryStats = {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalVAT: number;
  paymentsCount: number;
  settledCount: number;
  pendingCount: number;
};
