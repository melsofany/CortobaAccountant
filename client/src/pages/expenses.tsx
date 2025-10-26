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
  CheckCircle2,
  Clock,
  Printer,
  TrendingDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExpensesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSettlement, setFilterSettlement] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
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
        description: "تم حذف المصروف بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المصروف",
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

  const expenses = payments?.filter(p => p.paymentType === 'expense');

  const filteredExpenses = expenses?.filter((payment) => {
    const matchesSearch =
      payment.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSettlement =
      filterSettlement === "all" ||
      (filterSettlement === "settled" && payment.isSettled) ||
      (filterSettlement === "pending" && !payment.isSettled);
    const matchesCategory = filterCategory === "all" || payment.expenseCategory === filterCategory;

    return matchesSearch && matchesSettlement && matchesCategory;
  });

  const totalExpenses = filteredExpenses?.reduce((sum, p) => sum + Number(p.totalAmount), 0) || 0;
  const totalVAT = filteredExpenses?.reduce((sum, p) => sum + Number(p.vatAmount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 text-foreground mb-2 flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-destructive" />
              المصروفات
            </h1>
            <p className="text-muted-foreground">إدارة جميع المصروفات والدفعات للموردين</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/reports">
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                التقارير
              </Button>
            </Link>
            <Link href="/payments/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة مصروف
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-small text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-h2 font-bold text-destructive tabular-nums">
                    {formatCurrency(totalExpenses)}
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
                  <p className="text-small text-muted-foreground">عدد المصروفات</p>
                  <p className="text-h2 font-bold tabular-nums">
                    {filteredExpenses?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مورد أو رقم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع المصروف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="supplier">دفعات للموردين</SelectItem>
                  <SelectItem value="transport">نقل</SelectItem>
                  <SelectItem value="shipping">شحن</SelectItem>
                  <SelectItem value="salaries">مرتبات</SelectItem>
                  <SelectItem value="rent">إيجارات</SelectItem>
                  <SelectItem value="office_supplies">مستلزمات المكتب</SelectItem>
                  <SelectItem value="miscellaneous">مصروفات نثرية</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSettlement} onValueChange={setFilterSettlement}>
                <SelectTrigger>
                  <SelectValue placeholder="حالة التسوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="settled">مسوى</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">
              قائمة المصروفات ({filteredExpenses?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredExpenses && filteredExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">التاريخ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الجهة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">نوع المصروف</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">رقم التسعير</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المبلغ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الضريبة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجمالي</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الحالة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((payment) => (
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
                          <div>
                            <span className="font-medium block">{payment.supplierName}</span>
                            {payment.description && (
                              <span className="text-tiny text-muted-foreground">
                                {payment.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          {payment.expenseCategory ? (
                            <Badge variant="outline" className="text-tiny">
                              {getExpenseCategoryName(payment.expenseCategory)}
                            </Badge>
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
                          <span className="font-medium tabular-nums">
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
                          <span className="font-bold tabular-nums text-destructive">
                            {formatCurrency(Number(payment.totalAmount))}
                          </span>
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
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterSettlement !== "all" || filterCategory !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد مصروفات بعد"}
                </p>
                <Link href="/payments/new">
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول مصروف
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
                سيتم حذف هذا المصروف نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
