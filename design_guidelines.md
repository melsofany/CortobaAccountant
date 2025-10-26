# Design Guidelines: Qurtubah Supplies Accounting System

## Design Approach

**Selected System:** Material Design adapted for Arabic RTL interface
**Justification:** Material Design provides excellent support for data-dense applications with clear hierarchy, robust form patterns, and established RTL guidelines. Its elevation system and structured layouts work well for financial applications requiring clarity and trustworthiness.

## Core Design Principles

1. **RTL-First Architecture:** All layouts flow right-to-left with Arabic typography
2. **Data Clarity:** Financial information must be immediately scannable and unambiguous
3. **Print Optimization:** Reports and receipts must translate perfectly to print
4. **Hierarchical Information:** Clear visual distinction between primary data and supporting details

## Typography System

**Primary Font:** Cairo (Google Fonts) - Modern Arabic typeface with excellent readability
**Secondary Font:** Tajawal for interface elements

**Type Scale:**
- Display (Dashboard headers): 2.5rem, weight 700
- H1 (Section titles): 2rem, weight 600
- H2 (Card headers): 1.5rem, weight 600
- H3 (Subsections): 1.25rem, weight 500
- Body Large (Financial figures): 1.125rem, weight 500
- Body (Standard text): 1rem, weight 400
- Small (Labels, captions): 0.875rem, weight 400
- Tiny (Metadata): 0.75rem, weight 400

**Number Display:** Use tabular-nums for all financial figures to ensure alignment

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24 (p-2, m-4, gap-6, etc.)

**Grid Structure:**
- Container: max-w-7xl mx-auto px-6
- Dashboard: 3-column grid on desktop (grid-cols-3), 1-column mobile
- Forms: 2-column on desktop (grid-cols-2), 1-column mobile
- Data tables: Full-width with horizontal scroll on mobile

**Vertical Rhythm:**
- Section spacing: py-8 to py-12
- Card padding: p-6
- Form field spacing: gap-4
- List item spacing: gap-2

## Component Library

### Navigation
**Top App Bar:**
- Fixed position with elevation shadow
- Company logo (right side for RTL)
- Primary navigation links (Dashboard, Payments, Suppliers, Reports, Treasury)
- User profile/settings (left side)
- Height: h-16
- Padding: px-6

### Dashboard Cards
**Statistics Cards:**
- Elevation: shadow-md with hover:shadow-lg transition
- Rounded corners: rounded-xl
- Padding: p-6
- Structure: Icon/label at top, large number display, subtitle with change indicator
- Grid: 3 cards per row (Treasury Total, Total Additions, Total Expenses)

**Recent Transactions Card:**
- Full-width table card
- Header with "Recent Payments" title and "View All" link
- Compact table rows with: Date, Supplier, Amount, VAT Status, Quick Actions

### Forms
**Payment Entry Form:**
- Two-column layout on desktop
- Fields in order (RTL):
  - Row 1: Supplier Name (dropdown), Payment Date (datepicker)
  - Row 2: Quotation Number, Purchase Order Number
  - Row 3: Amount (number input), VAT Included (toggle switch)
  - Row 4: Description (textarea, full-width colspan-2)
  - Row 5: Settlement Status (if applicable)
- Action buttons at bottom: Primary "Save Payment", Secondary "Cancel"
- All inputs: h-12, rounded-lg, border with focus state

**Form Field Structure:**
- Label above input: text-sm font-medium mb-2
- Input spacing: gap-4 between fields
- Error states: red border with error message text-sm below
- Required indicators: asterisk after label

### Data Tables
**Payment List Table:**
- Sticky header row with sorting indicators
- Columns (RTL order): Actions, Settlement, VAT, Amount, Date, PO#, Quote#, Supplier
- Alternating row backgrounds for readability
- Row height: h-14 for comfortable scanning
- Hover state on rows
- Action column: Edit, Print Receipt, Delete icons

**Table Pagination:**
- Bottom-aligned, centered
- Shows "Rows X-Y of Z"
- Previous/Next buttons with page number indicators

### Buttons
**Primary Actions:** Larger buttons (h-12), rounded-lg, font-medium
**Secondary Actions:** Same size but ghost/outline variant
**Icon Buttons:** Square (h-10 w-10), rounded-lg for table actions
**Button Groups:** gap-3 for spacing between multiple buttons

### Print Components
**Receipt Template:**
- A4 paper size optimization
- Header: Company logo (centered), company name, receipt number
- Recipient section: Supplier details box
- Payment details table: Label/value pairs
- Amount breakdown: Subtotal, VAT (if applicable), Total in separate box
- Signature area: Two columns (Received by, Approved by) at bottom
- Footer: Company contact information

**Report Template:**
- Header: Company logo, report title, date range
- Summary section: Key metrics in grid layout
- Detailed table: All payment records
- Totals row: Bold typography, distinguished background
- Page numbers in footer

### Treasury Dashboard
**Layout Structure:**
- Top section: 3 metric cards (Total Treasury, Additions, Expenses)
- Middle section: Visual chart placeholder (bar or line chart showing trends)
- Bottom section: Quick filters and recent transactions table

### Modal Dialogs
**Confirmation Dialogs:** Centered, max-w-md, rounded-2xl, shadow-2xl
**Settlement Modal:** 
- Larger size (max-w-2xl)
- Two-column comparison: Original Payment vs Final Invoice
- Difference calculation highlighted
- Action buttons at bottom

### Status Indicators
**VAT Status:** Small badge (rounded-full, px-3, py-1, text-xs)
**Settlement Status:** Badge with distinct variants (Settled/Pending/Partial)
**Payment Status:** Colored dot indicator with text label

## Accessibility & Interactions

- All interactive elements: min-height h-11 for comfortable touch targets
- Focus states: Prominent ring with offset for keyboard navigation
- Form labels: Always associated with inputs, never placeholder-only
- Error messages: Announced to screen readers
- Tables: Proper thead/tbody structure with scope attributes
- Skip to content link for keyboard users

## Print Optimization

- Print-specific styles using @media print
- Hide navigation and interactive elements when printing
- Ensure proper page breaks between sections
- Use print-safe fonts and high-contrast layouts
- Receipt and report components use exact dimensions for A4

## Arabic-Specific Considerations

- All text alignment: text-right
- Flexbox/Grid direction: dir="rtl" on root element
- Number formatting: Arabic-Indic numerals as option, Western numerals for financial clarity
- Date formatting: Arabic locale (dd/mm/yyyy)
- Icon positions: Mirrored for RTL (chevrons, arrows)

## Images

**Company Logo Placement:**
- Navigation bar: Top-right corner, max height h-10
- Print headers: Centered, larger size h-16
- Login/splash screen (if any): Centered, h-24

The logo should maintain aspect ratio and have proper padding around it. No additional hero images needed - this is a business application focused on functionality.