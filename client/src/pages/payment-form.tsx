import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { CalendarIcon, ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { insertPaymentSchema, settlementSchema, type InsertPayment, type Payment, type Settlement } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function PaymentForm() {
  const [, params] = useRoute("/payments/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = params?.id && params.id !== "new";
  const [includesVAT, setIncludesVAT] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [calculatedVAT, setCalculatedVAT] = useState(0);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  const { data: payment } = useQuery<Payment>({
    queryKey: ["/api/payments", params?.id],
    enabled: !!isEdit,
  });

  const form = useForm<InsertPayment>({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      supplierName: "",
      amount: "",
      paymentDate: new Date(),
      description: "",
      quotationNumber: "",
      purchaseOrderNumber: "",
      includesVAT: false,
      paymentType: "expense",
    },
  });

  const settlementForm = useForm<Settlement>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      settlementAmount: "",
      settlementDate: new Date(),
      settlementNotes: "",
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        supplierName: payment.supplierName,
        amount: payment.amount,
        paymentDate: new Date(payment.paymentDate),
        description: payment.description || "",
        quotationNumber: payment.quotationNumber || "",
        purchaseOrderNumber: payment.purchaseOrderNumber || "",
        includesVAT: payment.includesVAT,
        paymentType: payment.paymentType,
      });
      setIncludesVAT(payment.includesVAT);
    }
  }, [payment, form]);

  const watchAmount = form.watch("amount");
  const watchIncludesVAT = form.watch("includesVAT");

  useEffect(() => {
    setIncludesVAT(watchIncludesVAT);
  }, [watchIncludesVAT]);

  useEffect(() => {
    const amount = Number(watchAmount) || 0;
    if (includesVAT && amount > 0) {
      const vat = amount * 0.14;
      const total = amount + vat;
      setCalculatedVAT(vat);
      setCalculatedTotal(total);
    } else {
      setCalculatedVAT(0);
      setCalculatedTotal(amount);
    }
  }, [watchAmount, includesVAT]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      if (isEdit) {
        return apiRequest("PATCH", `/api/payments/${params.id}`, data);
      }
      return apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/recent"] });
      toast({
        title: isEdit ? "تم التحديث بنجاح" : "تم الإضافة بنجاح",
        description: isEdit ? "تم تحديث الدفعة بنجاح" : "تم إضافة الدفعة بنجاح",
      });
      setLocation("/payments");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الدفعة",
        variant: "destructive",
      });
    },
  });

  const settlementMutation = useMutation({
    mutationFn: async (data: Settlement) => {
      return apiRequest("POST", `/api/payments/${params?.id}/settle`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/stats"] });
      toast({
        title: "تم التسوية بنجاح",
        description: "تمت تسوية الدفعة بنجاح",
      });
      setShowSettlement(false);
      setLocation("/payments");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التسوية",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPayment) => {
    saveMutation.mutate(data);
  };

  const onSettlementSubmit = (data: Settlement) => {
    settlementMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/payments")}
            className="mb-4 gap-2"
            data-testid="button-back"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Button>
          <h1 className="text-h1 text-foreground mb-2">
            {isEdit ? "تعديل الدفعة" : "إضافة دفعة جديدة"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "تحديث بيانات الدفعة" : "إضافة دفعة جديدة للموردين أو الخزينة"}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h2">بيانات الدفعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Type */}
              <div className="space-y-2">
                <Label htmlFor="paymentType">نوع العملية *</Label>
                <Select
                  value={form.watch("paymentType")}
                  onValueChange={(value: "expense" | "income") => form.setValue("paymentType", value)}
                >
                  <SelectTrigger id="paymentType" data-testid="select-payment-type">
                    <SelectValue placeholder="اختر نوع العملية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">مصروف (دفعة لمورد)</SelectItem>
                    <SelectItem value="income">إضافة للخزينة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 1: Supplier Name and Payment Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">
                    {form.watch("paymentType") === "income" ? "اسم الجهة" : "اسم المورد"} *
                  </Label>
                  <Input
                    id="supplierName"
                    {...form.register("supplierName")}
                    placeholder="أدخل الاسم"
                    data-testid="input-supplier-name"
                  />
                  {form.formState.errors.supplierName && (
                    <p className="text-small text-destructive">
                      {form.formState.errors.supplierName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الدفعة *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-right font-normal"
                        data-testid="button-payment-date"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {form.watch("paymentDate")
                          ? format(form.watch("paymentDate"), "PPP", { locale: ar })
                          : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("paymentDate")}
                        onSelect={(date) => date && form.setValue("paymentDate", date)}
                        locale={ar}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row 2: Quotation Number and Purchase Order Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quotationNumber">رقم طلب التسعير</Label>
                  <Input
                    id="quotationNumber"
                    {...form.register("quotationNumber")}
                    placeholder="اختياري"
                    data-testid="input-quotation-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderNumber">رقم أمر الشراء</Label>
                  <Input
                    id="purchaseOrderNumber"
                    {...form.register("purchaseOrderNumber")}
                    placeholder="اختياري"
                    data-testid="input-purchase-order-number"
                  />
                </div>
              </div>

              {/* Row 3: Amount and VAT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ (جنيه مصري) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...form.register("amount")}
                    placeholder="0.00"
                    className="tabular-nums"
                    data-testid="input-amount"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-small text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="includesVAT" className="flex items-center justify-between">
                    <span>يشمل ضريبة القيمة المضافة (14%)</span>
                  </Label>
                  <div className="flex items-center space-x-2 space-x-reverse h-10 px-3 py-2 bg-muted rounded-lg">
                    <Switch
                      id="includesVAT"
                      checked={form.watch("includesVAT")}
                      onCheckedChange={(checked) => form.setValue("includesVAT", checked)}
                      data-testid="switch-includes-vat"
                    />
                    <Label htmlFor="includesVAT" className="cursor-pointer">
                      {form.watch("includesVAT") ? "نعم، يشمل الضريبة" : "لا، بدون ضريبة"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* VAT Calculation Display */}
              {includesVAT && Number(watchAmount) > 0 && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-small text-muted-foreground">المبلغ الأساسي:</span>
                        <span className="font-medium tabular-nums">{formatCurrency(Number(watchAmount))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-small text-muted-foreground">ضريبة القيمة المضافة (14%):</span>
                        <span className="font-medium tabular-nums text-chart-3">
                          {formatCurrency(calculatedVAT)}
                        </span>
                      </div>
                      <div className="pt-3 border-t flex justify-between items-center">
                        <span className="font-semibold">الإجمالي النهائي:</span>
                        <span className="font-bold text-h3 tabular-nums text-primary">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Row 4: Description */}
              <div className="space-y-2">
                <Label htmlFor="description">الوصف / البيان</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="تفاصيل إضافية عن الدفعة (اختياري)"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {isEdit && payment && !payment.isSettled && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettlement(true)}
                className="gap-2"
                data-testid="button-settle"
              >
                <CheckCircle2 className="w-4 h-4" />
                تسوية الدفعة
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/payments")}
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "جاري الحفظ..." : isEdit ? "تحديث" : "حفظ"}
            </Button>
          </div>
        </form>

        {/* Settlement Dialog */}
        <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسوية الدفعة</DialogTitle>
              <DialogDescription>
                تسجيل المبلغ النهائي للتسوية بعد استلام الفاتورة النهائية
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={settlementForm.handleSubmit(onSettlementSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settlementAmount">المبلغ النهائي *</Label>
                <Input
                  id="settlementAmount"
                  type="number"
                  step="0.01"
                  {...settlementForm.register("settlementAmount")}
                  placeholder="0.00"
                  className="tabular-nums"
                  data-testid="input-settlement-amount"
                />
              </div>

              <div className="space-y-2">
                <Label>تاريخ التسوية *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right font-normal"
                      data-testid="button-settlement-date"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {settlementForm.watch("settlementDate")
                        ? format(settlementForm.watch("settlementDate"), "PPP", { locale: ar })
                        : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={settlementForm.watch("settlementDate")}
                      onSelect={(date) => date && settlementForm.setValue("settlementDate", date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlementNotes">ملاحظات</Label>
                <Textarea
                  id="settlementNotes"
                  {...settlementForm.register("settlementNotes")}
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows={3}
                  data-testid="textarea-settlement-notes"
                />
              </div>

              {payment && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex justify-between text-small">
                      <span className="text-muted-foreground">الدفعة المقدمة:</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(payment.totalAmount))}
                      </span>
                    </div>
                    {settlementForm.watch("settlementAmount") && (
                      <>
                        <div className="flex justify-between text-small">
                          <span className="text-muted-foreground">المبلغ النهائي:</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(Number(settlementForm.watch("settlementAmount")))}
                          </span>
                        </div>
                        <div className="flex justify-between text-small pt-2 border-t">
                          <span className="font-semibold">الفرق:</span>
                          <span className={`font-bold tabular-nums ${
                            Number(settlementForm.watch("settlementAmount")) - Number(payment.totalAmount) > 0
                              ? "text-destructive"
                              : "text-chart-2"
                          }`}>
                            {formatCurrency(
                              Number(settlementForm.watch("settlementAmount")) - Number(payment.totalAmount)
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettlement(false)}
                  data-testid="button-cancel-settlement"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={settlementMutation.isPending}
                  data-testid="button-confirm-settlement"
                >
                  {settlementMutation.isPending ? "جاري التسوية..." : "تأكيد التسوية"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
