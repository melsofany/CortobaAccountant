import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
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

export default function PaymentsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSettlement, setFilterSettlement] = useState<string>("all");
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
        description: "تم حذف الدفعة بنجاح",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الدفعة",
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

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || payment.paymentType === filterType;
    const matchesSettlement =
      filterSettlement === "all" ||
      (filterSettlement === "settled" && payment.isSettled) ||
      (filterSettlement === "pending" && !payment.isSettled);

    return matchesSearch && matchesType && matchesSettlement;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 text-foreground mb-2">إدارة الدفعات</h1>
            <p className="text-muted-foreground">تتبع جميع الدفعات والمعاملات المالية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/reports">
              <Button variant="outline" className="gap-2" data-testid="button-view-reports">
                <FileText className="w-4 h-4" />
                التقارير
              </Button>
            </Link>
            <Link href="/payments/new">
              <Button className="gap-2" data-testid="button-add-payment">
                <Plus className="w-4 h-4" />
                إضافة دفعة
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مورد أو رقم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                  <SelectItem value="income">إضافات</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSettlement} onValueChange={setFilterSettlement}>
                <SelectTrigger data-testid="select-filter-settlement">
                  <SelectValue placeholder="حالة التسوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="settled">مسوى</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2" data-testid="button-export">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">
              قائمة الدفعات ({filteredPayments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredPayments && filteredPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">التاريخ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المورد</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">رقم التسعير</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">رقم الشراء</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">المبلغ</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الضريبة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجمالي</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الحالة</th>
                      <th className="pb-3 pr-4 text-small font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b hover-elevate"
                        data-testid={`row-payment-${payment.id}`}
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
                          {payment.quotationNumber ? (
                            <span className="text-small">{payment.quotationNumber}</span>
                          ) : (
                            <span className="text-tiny text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {payment.purchaseOrderNumber ? (
                            <span className="text-small">{payment.purchaseOrderNumber}</span>
                          ) : (
                            <span className="text-tiny text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`font-medium tabular-nums ${
                            payment.paymentType === 'income' ? 'text-chart-2' : 'text-foreground'
                          }`}>
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
                          <span className={`font-bold tabular-nums ${
                            payment.paymentType === 'income' ? 'text-chart-2' : 'text-destructive'
                          }`}>
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
                              data-testid={`button-edit-${payment.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/payments/${payment.id}/print`)}
                              data-testid={`button-print-${payment.id}`}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(payment.id)}
                              data-testid={`button-delete-${payment.id}`}
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
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType !== "all" || filterSettlement !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد دفعات بعد"}
                </p>
                <Link href="/payments/new">
                  <Button data-testid="button-add-first-payment">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول دفعة
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
                سيتم حذف هذه الدفعة نهائياً. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
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
