import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { CalendarIcon, ArrowRight, Printer, Download } from "lucide-react";
import { Link } from "wouter";
import type { Payment, TreasuryStats } from "@shared/schema";
import logoUrl from "@assets/unnamed_1761496137747.png";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: stats } = useQuery<TreasuryStats>({
    queryKey: ["/api/treasury/stats"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredPayments = payments?.filter((payment) => {
    const paymentDate = new Date(payment.paymentDate);
    return paymentDate >= startDate && paymentDate <= endDate;
  });

  const getExpenseCategoryName = (category: string | null) => {
    const categories: Record<string, string> = {
      supplier: "دفعات للموردين",
      transport: "نقل",
      shipping: "شحن",
      salaries: "مرتبات",
      rent: "إيجارات",
      office_supplies: "مستلزمات المكتب",
      miscellaneous: "مصروفات نثرية",
    };
    return category ? categories[category] || category : "غير محدد";
  };

  const expensesByCategory = filteredPayments?.filter(p => p.paymentType === 'expense').reduce((acc, payment) => {
    const category = payment.expenseCategory || 'uncategorized';
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0, vat: 0 };
    }
    acc[category].count++;
    acc[category].total += Number(payment.totalAmount);
    acc[category].vat += Number(payment.vatAmount || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number; vat: number }>);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header - Hide on Print */}
        <div className="mb-8 print:hidden">
          <Link href="/payments">
            <Button variant="ghost" className="mb-4 gap-2" data-testid="button-back">
              <ArrowRight className="w-4 h-4" />
              رجوع
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-h1 text-foreground mb-2">التقارير المالية</h1>
              <p className="text-muted-foreground">عرض وطباعة التقارير الشاملة</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" data-testid="button-export">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
              <Button onClick={handlePrint} className="gap-2" data-testid="button-print-report">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
            </div>
          </div>
        </div>

        {/* Date Range Filter - Hide on Print */}
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle className="text-h3">تحديد الفترة الزمنية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-small font-medium">من تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {format(startDate, "PPP", { locale: ar })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-small font-medium">إلى تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {format(endDate, "PPP", { locale: ar })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Layout */}
        <div className="print:p-8">
          {/* Report Header */}
          <div className="text-center mb-8">
            <img
              src={logoUrl}
              alt="شركة قرطبة للتوريدات"
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-h1 font-bold mb-2">شركة قرطبة للتوريدات</h1>
            <h2 className="text-h2 mb-4">التقرير المالي الشامل</h2>
            <p className="text-small text-muted-foreground">
              الفترة من {format(startDate, "dd/MM/yyyy", { locale: ar })} إلى{" "}
              {format(endDate, "dd/MM/yyyy", { locale: ar })}
            </p>
          </div>

          {/* Summary Section */}
          <Card className="mb-6 print:shadow-none">
            <CardHeader>
              <CardTitle className="text-h2">ملخص الخزينة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-small text-muted-foreground mb-2">الرصيد الإجمالي</p>
                  <p className="text-h1 font-bold tabular-nums" data-testid="text-report-balance">
                    {formatCurrency(stats?.totalBalance || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-chart-2/10 rounded-lg">
                  <p className="text-small text-muted-foreground mb-2">إجمالي الإضافات</p>
                  <p className="text-h1 font-bold text-chart-2 tabular-nums" data-testid="text-report-income">
                    {formatCurrency(stats?.totalIncome || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <p className="text-small text-muted-foreground mb-2">إجمالي المصروفات</p>
                  <p className="text-h1 font-bold text-destructive tabular-nums" data-testid="text-report-expenses">
                    {formatCurrency(stats?.totalExpenses || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-body-lg font-medium">إجمالي ضريبة القيمة المضافة (14%):</span>
                  <span className="text-h2 font-bold text-chart-3 tabular-nums" data-testid="text-report-vat">
                    {formatCurrency(stats?.totalVAT || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          {expensesByCategory && Object.keys(expensesByCategory).length > 0 && (
            <Card className="mb-6 print:shadow-none">
              <CardHeader>
                <CardTitle className="text-h2">المصروفات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-small">
                    <thead>
                      <tr className="border-b-2 text-right">
                        <th className="pb-3 pr-2 font-semibold">نوع المصروف</th>
                        <th className="pb-3 pr-2 font-semibold">عدد الدفعات</th>
                        <th className="pb-3 pr-2 font-semibold">الإجمالي</th>
                        <th className="pb-3 pr-2 font-semibold">الضريبة</th>
                        <th className="pb-3 pr-2 font-semibold">النسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(expensesByCategory).map(([category, data]) => {
                        const percentage = stats?.totalExpenses ? (data.total / stats.totalExpenses * 100) : 0;
                        return (
                          <tr key={category} className="border-b">
                            <td className="py-3 pr-2 font-medium">{getExpenseCategoryName(category)}</td>
                            <td className="py-3 pr-2 tabular-nums">{data.count}</td>
                            <td className="py-3 pr-2 font-bold tabular-nums text-destructive">
                              {formatCurrency(data.total)}
                            </td>
                            <td className="py-3 pr-2 tabular-nums">
                              {formatCurrency(data.vat)}
                            </td>
                            <td className="py-3 pr-2 tabular-nums">{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Payments Table */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="text-h2">تفاصيل الدفعات</CardTitle>
              <p className="text-small text-muted-foreground">
                عدد الدفعات: {filteredPayments?.length || 0}
              </p>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : filteredPayments && filteredPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-small">
                    <thead>
                      <tr className="border-b-2 text-right">
                        <th className="pb-3 pr-2 font-semibold">#</th>
                        <th className="pb-3 pr-2 font-semibold">التاريخ</th>
                        <th className="pb-3 pr-2 font-semibold">الجهة</th>
                        <th className="pb-3 pr-2 font-semibold">نوع المصروف</th>
                        <th className="pb-3 pr-2 font-semibold">رقم التسعير</th>
                        <th className="pb-3 pr-2 font-semibold">المبلغ</th>
                        <th className="pb-3 pr-2 font-semibold">الضريبة</th>
                        <th className="pb-3 pr-2 font-semibold">الإجمالي</th>
                        <th className="pb-3 pr-2 font-semibold">النوع</th>
                        <th className="pb-3 pr-2 font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment, index) => (
                        <tr key={payment.id} className="border-b" data-testid={`row-report-payment-${index}`}>
                          <td className="py-3 pr-2">{index + 1}</td>
                          <td className="py-3 pr-2 tabular-nums">
                            {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                          </td>
                          <td className="py-3 pr-2">{payment.supplierName}</td>
                          <td className="py-3 pr-2 text-tiny">
                            {payment.paymentType === "expense" && payment.expenseCategory
                              ? getExpenseCategoryName(payment.expenseCategory)
                              : "-"}
                          </td>
                          <td className="py-3 pr-2">{payment.quotationNumber || "-"}</td>
                          <td className="py-3 pr-2 tabular-nums">
                            {formatCurrency(Number(payment.amount))}
                          </td>
                          <td className="py-3 pr-2 tabular-nums">
                            {payment.includesVAT
                              ? formatCurrency(Number(payment.vatAmount || 0))
                              : "-"}
                          </td>
                          <td className="py-3 pr-2 font-bold tabular-nums">
                            {formatCurrency(Number(payment.totalAmount))}
                          </td>
                          <td className="py-3 pr-2">
                            {payment.paymentType === "income" ? "إضافة" : "مصروف"}
                          </td>
                          <td className="py-3 pr-2">
                            {payment.isSettled ? "مسوى" : "معلق"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold bg-muted">
                        <td colSpan={5} className="py-4 pr-2 text-left">
                          الإجمالي
                        </td>
                        <td className="py-4 pr-2 tabular-nums">
                          {formatCurrency(
                            filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)
                          )}
                        </td>
                        <td className="py-4 pr-2 tabular-nums">
                          {formatCurrency(
                            filteredPayments.reduce(
                              (sum, p) => sum + (p.includesVAT ? Number(p.vatAmount || 0) : 0),
                              0
                            )
                          )}
                        </td>
                        <td className="py-4 pr-2 tabular-nums">
                          {formatCurrency(
                            filteredPayments.reduce((sum, p) => sum + Number(p.totalAmount), 0)
                          )}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد دفعات في هذه الفترة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Footer */}
          <div className="mt-8 text-center text-small text-muted-foreground print:block hidden">
            <p>شركة قرطبة للتوريدات - نظام إدارة الحسابات</p>
            <p className="mt-1">
              تاريخ الطباعة: {format(new Date(), "PPP", { locale: ar })}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
