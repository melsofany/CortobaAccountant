# شركة قرطبة للتوريدات - نظام إدارة الحسابات

## نظرة عامة
نظام محاسبي متكامل لشركة قرطبة للتوريدات، مصمم لتتبع الدفعات والموردين مع حساب ضريبة القيمة المضافة، إدارة الخزينة، والتقارير المالية. جميع البيانات تُخزن في Google Sheets.

## المميزات الرئيسية

### 1. تتبع الدفعات
- إدارة الدفعات المقدمة للموردين
- تسجيل الإضافات للخزينة
- حقول كاملة: اسم المورد، المبلغ، التاريخ، رقم طلب التسعير، رقم أمر الشراء، الوصف
- حساب تلقائي لضريبة القيمة المضافة (14%)
- إمكانية تحديد إذا كانت الدفعة تشمل الضريبة

### 2. نظام التسوية
- تسوية الدفعات المقدمة مع الفواتير النهائية
- حساب الفرق بين الدفعة المقدمة والمبلغ النهائي
- تسجيل تاريخ وملاحظات التسوية

### 3. إدارة الخزينة
- حساب تلقائي للرصيد الإجمالي
- تتبع الإضافات والمصروفات
- إحصائيات مفصلة عن ضريبة القيمة المضافة
- عرض الدفعات المسواة والمعلقة

### 4. التقارير والطباعة
- تقارير شاملة قابلة للطباعة
- إيصالات دفع رسمية مع شعار الشركة
- تصفية التقارير حسب الفترة الزمنية
- تصدير البيانات

## البنية التقنية

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS + Shadcn UI
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query
- **Date Handling**: date-fns with Arabic locale
- **Language**: Arabic (RTL layout)
- **Fonts**: Cairo (primary), Tajawal (secondary)

### Backend
- **Framework**: Express.js
- **Storage**: Google Sheets API (via Replit Integration)
- **Validation**: Zod schemas
- **API**: RESTful endpoints

### Design System
- RTL-first architecture for Arabic
- Material Design inspired
- Custom color palette
- Professional invoice/receipt templates
- Print-optimized layouts

## هيكل البيانات

### Payment Schema
```typescript
{
  id: string (UUID)
  supplierName: string
  amount: decimal
  paymentDate: timestamp
  description?: string
  quotationNumber?: string
  purchaseOrderNumber?: string
  includesVAT: boolean
  vatAmount?: decimal (14% if applicable)
  totalAmount: decimal
  isSettled: boolean
  settlementAmount?: decimal
  settlementDate?: timestamp
  settlementNotes?: string
  paymentType: "expense" | "income"
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Treasury Statistics
- Total Balance (Additions - Expenses)
- Total Income
- Total Expenses
- Total VAT
- Payments Count
- Settled Count
- Pending Count

## الصفحات والمسارات

- `/` - لوحة التحكم الرئيسية
- `/payments` - قائمة جميع الدفعات
- `/payments/new` - إضافة دفعة جديدة
- `/payments/:id` - تعديل دفعة موجودة
- `/payments/:id/print` - طباعة إيصال دفع
- `/reports` - التقارير المالية

## VAT Calculation
نسبة ضريبة القيمة المضافة: 14%
- إذا كانت الدفعة تشمل الضريبة:
  - VAT = Amount × 0.14
  - Total = Amount + VAT
- إذا كانت الدفعة لا تشمل الضريبة:
  - Total = Amount

## Google Sheets Integration
- يتم حفظ جميع البيانات في Google Sheets
- المزامنة التلقائية مع كل عملية
- لا توجد قاعدة بيانات محلية
- يتطلب اتصال Google Sheets عبر Replit Integration

## الطباعة
- تصميمات محسّنة للطباعة على ورق A4
- شعار الشركة على جميع المستندات
- إيصالات قابلة للتوقيع للمصروفات بدون فاتورة
- تقارير شاملة مع كافة التفاصيل

## معلومات التطوير

### تشغيل المشروع
```bash
npm run dev
```

### البيئة المطلوبة
- Node.js 20
- Google Sheets API access (via Replit Integration)

### الحزم الرئيسية
- React + TypeScript
- Express.js
- Tailwind CSS + Shadcn UI
- TanStack Query
- React Hook Form + Zod
- date-fns
- Wouter
- Google APIs (googleapis)

## الملاحظات
- الواجهة بالكامل باللغة العربية مع دعم RTL
- التصميم مستوحى من Material Design
- جميع الأرقام بتنسيق الجنيه المصري
- التواريخ بصيغة DD/MM/YYYY
- شعار الشركة: attached_assets/unnamed_1761496137747.png
