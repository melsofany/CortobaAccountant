import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Wallet, FileText, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import type { TreasuryStats, Payment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<TreasuryStats>({
    queryKey: ["/api/treasury/stats"],
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/recent"],
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 text-foreground mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">نظرة عامة على حسابات شركة قرطبة للتوريدات</p>
          </div>
          <Link href="/payments/new">
            <Button size="lg" className="gap-2" data-testid="button-add-payment">
              <Plus className="w-5 h-5" />
              إضافة دفعة جديدة
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-small font-medium text-muted-foreground">
                الرصيد الإجمالي
              </CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-h1 font-bold tabular-nums" data-testid="text-total-balance">
                    {formatCurrency(stats?.totalBalance || 0)}
                  </div>
                  <p className="text-tiny text-muted-foreground mt-1">
                    الخزينة الحالية
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-small font-medium text-muted-foreground">
                إجمالي الإضافات
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-h1 font-bold text-chart-2 tabular-nums" data-testid="text-total-income">
                    {formatCurrency(stats?.totalIncome || 0)}
                  </div>
                  <p className="text-tiny text-muted-foreground mt-1">
                    المبالغ الواردة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-small font-medium text-muted-foreground">
                إجمالي المصروفات
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-h1 font-bold text-destructive tabular-nums" data-testid="text-total-expenses">
                    {formatCurrency(stats?.totalExpenses || 0)}
                  </div>
                  <p className="text-tiny text-muted-foreground mt-1">
                    الدفعات للموردين
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-small font-medium text-muted-foreground">
                ضريبة القيمة المضافة
              </CardTitle>
              <FileText className="h-5 w-5 text-chart-3" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-h1 font-bold text-chart-3 tabular-nums" data-testid="text-total-vat">
                    {formatCurrency(stats?.totalVAT || 0)}
                  </div>
                  <p className="text-tiny text-muted-foreground mt-1">
                    إجمالي الضريبة 14%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">إجمالي الدفعات</p>
                  <p className="text-h2 font-bold tabular-nums" data-testid="text-payments-count">
                    {stats?.paymentsCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-chart-2/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">تم تسويتها</p>
                  <p className="text-h2 font-bold tabular-nums" data-testid="text-settled-count">
                    {stats?.settledCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-chart-3/10 rounded-lg">
                  <Clock className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">قيد الانتظار</p>
                  <p className="text-h2 font-bold tabular-nums" data-testid="text-pending-count">
                    {stats?.pendingCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Categories Summary */}
        {recentPayments && recentPayments.filter(p => p.paymentType === 'expense' && p.expenseCategory).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-h2">المصروفات حسب النوع</CardTitle>
              <p className="text-small text-muted-foreground mt-1">ملخص سريع لتوزيع المصروفات</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const expensesByCategory = recentPayments
                    .filter(p => p.paymentType === 'expense' && p.expenseCategory)
                    .reduce((acc, payment) => {
                      const category = payment.expenseCategory!;
                      if (!acc[category]) {
                        acc[category] = 0;
                      }
                      acc[category] += Number(payment.totalAmount);
                      return acc;
                    }, {} as Record<string, number>);

                  return Object.entries(expensesByCategory).map(([category, total]) => (
                    <div key={category} className="p-4 border rounded-lg">
                      <p className="text-tiny text-muted-foreground mb-1">
                        {getExpenseCategoryName(category)}
                      </p>
                      <p className="text-h3 font-bold text-destructive tabular-nums">
                        {formatCurrency(total)}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-h2">الدفعات الأخيرة</CardTitle>
              <p className="text-small text-muted-foreground mt-1">آخر 10 عمليات دفع</p>
            </div>
            <Link href="/payments">
              <Button variant="outline" size="sm" data-testid="button-view-all-payments">
                عرض الكل
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">التاريخ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المورد</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المبلغ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">النوع</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الحالة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الضريبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover-elevate" data-testid={`row-payment-${payment.id}`}>
                        <td className="py-4 pr-4">
                          <span className="text-small tabular-nums">
                            {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ar })}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-medium">{payment.supplierName}</span>
                          {payment.quotationNumber && (
                            <span className="text-tiny text-muted-foreground mr-2">
                              #{payment.quotationNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`font-bold tabular-nums ${
                            payment.paymentType === 'income' ? 'text-chart-2' : 'text-destructive'
                          }`}>
                            {formatCurrency(Number(payment.totalAmount))}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          {payment.paymentType === 'income' ? (
                            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                              إضافة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              مصروف
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {payment.isSettled ? (
                            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              مسوى
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                              <Clock className="w-3 h-3 ml-1" />
                              معلق
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {payment.includesVAT ? (
                            <Badge variant="secondary" className="text-tiny">
                              {formatCurrency(Number(payment.vatAmount || 0))}
                            </Badge>
                          ) : (
                            <span className="text-tiny text-muted-foreground">لا يشمل</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد دفعات بعد</p>
                <Link href="/payments/new">
                  <Button className="mt-4" data-testid="button-add-first-payment">
                    إضافة أول دفعة
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
