import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Printer,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Payment } from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function IncomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/recent"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الإضافة بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الإضافة",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const income = payments?.filter(p => p.paymentType === 'income');

  const filteredIncome = income?.filter((payment) => {
    const matchesSearch =
      payment.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const totalIncome = filteredIncome?.reduce((sum, p) => sum + Number(p.totalAmount), 0) || 0;
  const totalVAT = filteredIncome?.reduce((sum, p) => sum + Number(p.vatAmount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 text-foreground mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-chart-2" />
              الوارد
            </h1>
            <p className="text-muted-foreground">إدارة جميع الإضافات والمبالغ الواردة للخزينة</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/reports">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                التقارير
              </Button>
            </Link>
            <Link href="/payments/new">
              <Button className="gap-2 bg-chart-2 hover:bg-chart-2/90">
                <Plus className="w-4 h-4" />
                إضافة للخزينة
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-chart-2/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">إجمالي الوارد</p>
                  <p className="text-h2 font-bold text-chart-2 tabular-nums">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-chart-3/10 rounded-lg">
                  <FileText className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">الضريبة المضافة</p>
                  <p className="text-h2 font-bold text-chart-3 tabular-nums">
                    {formatCurrency(totalVAT)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">عدد الإضافات</p>
                  <p className="text-h2 font-bold tabular-nums">
                    {filteredIncome?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن جهة أو رقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Income Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">
              قائمة الوارد ({filteredIncome?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredIncome && filteredIncome.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">التاريخ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الجهة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">البيان</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">رقم التسعير</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المبلغ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الضريبة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجمالي</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncome.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b hover-elevate"
                      >
                        <td className="py-4 pr-4">
                          <span className="text-small tabular-nums">
                            {format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: ar })}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-medium">{payment.supplierName}</span>
                        </td>
                        <td className="py-4 pr-4">
                          {payment.description ? (
                            <span className="text-small">{payment.description}</span>
                          ) : (
                            <span className="text-tiny text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {payment.quotationNumber ? (
                            <span className="text-small">{payment.quotationNumber}</span>
                          ) : (
                            <span className="text-tiny text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-medium tabular-nums text-chart-2">
                            {formatCurrency(Number(payment.amount))}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          {payment.includesVAT ? (
                            <span className="text-small tabular-nums">
                              {formatCurrency(Number(payment.vatAmount || 0))}
                            </span>
                          ) : (
                            <span className="text-tiny text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-bold tabular-nums text-chart-2">
                            {formatCurrency(Number(payment.totalAmount))}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/payments/${payment.id}`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/payments/${payment.id}/print`)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(payment.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد إضافات بعد"}
                </p>
                <Link href="/payments/new">
                  <Button className="bg-chart-2 hover:bg-chart-2/90">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة للخزينة
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف هذه الإضافة نهائياً. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
