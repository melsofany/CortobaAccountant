import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Printer } from "lucide-react";
import type { Payment } from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import logoUrl from "@assets/unnamed_1761496137747.png";

export default function PrintReceipt() {
  const [, params] = useRoute("/payments/:id/print");
  const [, setLocation] = useLocation();

  const { data: payment, isLoading } = useQuery<Payment>({
    queryKey: ["/api/payments", params?.id],
    enabled: !!params?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getExpenseCategoryName = (category: string | null) => {
    const categories: Record<string, string> = {
      supplier: "دفعة لمورد",
      transport: "نقل",
      shipping: "شحن",
      salaries: "مرتبات",
      rent: "إيجارات",
      office_supplies: "مستلزمات المكتب",
      miscellaneous: "مصروفات نثرية",
    };
    return category ? categories[category] || category : "غير محدد";
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">لم يتم العثور على الدفعة</p>
          <Button onClick={() => setLocation("/payments")}>العودة للقائمة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header - Hide on Print */}
        <div className="mb-8 print:hidden">
          <Button
            variant="ghost"
            onClick={() => setLocation("/payments")}
            className="mb-4 gap-2"
            data-testid="button-back"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h1 text-foreground mb-2">إيصال الدفع</h1>
              <p className="text-muted-foreground">جاهز للطباعة والتوقيع</p>
            </div>
            <Button onClick={handlePrint} className="gap-2" data-testid="button-print">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </div>

        {/* Receipt Layout */}
        <Card className="print:shadow-none print:border-2 print:border-foreground">
          <CardContent className="p-12">
            {/* Company Header */}
            <div className="text-center mb-8 pb-6 border-b-2">
              <img
                src={logoUrl}
                alt="شركة قرطبة للتوريدات"
                className="h-20 mx-auto mb-4"
              />
              <h1 className="text-h1 font-bold mb-2">شركة قرطبة للتوريدات</h1>
              <p className="text-body text-muted-foreground">نظام إدارة الحسابات المالية</p>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-8">
              <h2 className="text-h1 font-bold mb-2">
                {payment.paymentType === "income" ? "إيصال قبض" : "إيصال دفع"}
              </h2>
              <p className="text-small text-muted-foreground">
                رقم الإيصال: {payment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-6 mb-8">
              {/* Date and Supplier */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-muted-foreground mb-1">التاريخ</p>
                  <p className="font-medium" data-testid="text-receipt-date">
                    {format(new Date(payment.paymentDate), "PPP", { locale: ar })}
                  </p>
                </div>
                <div>
                  <p className="text-small text-muted-foreground mb-1">
                    {payment.paymentType === "income" ? "المستلم من" : "المدفوع إلى"}
                  </p>
                  <p className="font-medium" data-testid="text-receipt-supplier">
                    {payment.supplierName}
                  </p>
                </div>
              </div>

              {/* Expense Category */}
              {payment.paymentType === "expense" && payment.expenseCategory && (
                <div>
                  <p className="text-small text-muted-foreground mb-1">نوع المصروف</p>
                  <p className="font-medium">{getExpenseCategoryName(payment.expenseCategory)}</p>
                </div>
              )}

              {/* Reference Numbers */}
              {(payment.quotationNumber || payment.purchaseOrderNumber) && (
                <div className="grid grid-cols-2 gap-6">
                  {payment.quotationNumber && (
                    <div>
                      <p className="text-small text-muted-foreground mb-1">رقم طلب التسعير</p>
                      <p className="font-medium">{payment.quotationNumber}</p>
                    </div>
                  )}
                  {payment.purchaseOrderNumber && (
                    <div>
                      <p className="text-small text-muted-foreground mb-1">رقم أمر الشراء</p>
                      <p className="font-medium">{payment.purchaseOrderNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {payment.description && (
                <div>
                  <p className="text-small text-muted-foreground mb-1">البيان</p>
                  <p className="font-medium">{payment.description}</p>
                </div>
              )}
            </div>

            {/* Amount Breakdown */}
            <div className="bg-muted p-6 rounded-lg mb-8">
              <table className="w-full">
                <tbody className="space-y-3">
                  <tr>
                    <td className="py-2 text-body">المبلغ الأساسي:</td>
                    <td className="py-2 text-left font-bold text-body-lg tabular-nums" data-testid="text-receipt-amount">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                  </tr>
                  {payment.includesVAT && (
                    <tr>
                      <td className="py-2 text-body">ضريبة القيمة المضافة (14%):</td>
                      <td className="py-2 text-left font-bold text-body-lg tabular-nums text-chart-3" data-testid="text-receipt-vat">
                        {formatCurrency(Number(payment.vatAmount || 0))}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-foreground">
                    <td className="py-3 text-h3 font-bold">
                      {payment.paymentType === "income" ? "إجمالي المبلغ المستلم:" : "إجمالي المبلغ المدفوع:"}
                    </td>
                    <td className="py-3 text-left font-bold text-h2 tabular-nums text-primary" data-testid="text-receipt-total">
                      {formatCurrency(Number(payment.totalAmount))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Settlement Info */}
            {payment.isSettled && payment.settlementAmount && (
              <div className="bg-chart-2/10 p-6 rounded-lg mb-8 border border-chart-2/20">
                <h3 className="font-bold mb-4 text-h3">معلومات التسوية</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-muted-foreground mb-1">المبلغ النهائي</p>
                    <p className="font-bold text-body-lg tabular-nums">
                      {formatCurrency(Number(payment.settlementAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-muted-foreground mb-1">تاريخ التسوية</p>
                    <p className="font-medium">
                      {payment.settlementDate
                        ? format(new Date(payment.settlementDate), "PPP", { locale: ar })
                        : "-"}
                    </p>
                  </div>
                  {payment.settlementNotes && (
                    <div className="col-span-2">
                      <p className="text-small text-muted-foreground mb-1">ملاحظات</p>
                      <p className="font-medium">{payment.settlementNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t">
              <div className="text-center">
                <div className="border-b-2 border-foreground mb-2 pb-12"></div>
                <p className="font-medium">
                  {payment.paymentType === "income" ? "المستلم" : "المدفوع له"}
                </p>
                <p className="text-small text-muted-foreground mt-1">الاسم والتوقيع</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-foreground mb-2 pb-12"></div>
                <p className="font-medium">المعتمد</p>
                <p className="text-small text-muted-foreground mt-1">الاسم والتوقيع</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-tiny text-muted-foreground">
              <p>شركة قرطبة للتوريدات</p>
              <p className="mt-1">
                طُبع في: {format(new Date(), "PPP - p", { locale: ar })}
              </p>
            </div>
          </CardContent>
        </Card>
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
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-2 {
            border-width: 2px !important;
          }
          .print\\:border-foreground {
            border-color: hsl(var(--foreground)) !important;
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
