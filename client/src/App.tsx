import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/header";
import Dashboard from "@/pages/dashboard";
import PaymentsPage from "@/pages/payments";
import ExpensesPage from "@/pages/expenses";
import IncomePage from "@/pages/income";
import PaymentForm from "@/pages/payment-form";
import ReportsPage from "@/pages/reports";
import PrintReceipt from "@/pages/print-receipt";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/payments" component={PaymentsPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/income" component={IncomePage} />
      <Route path="/payments/new" component={PaymentForm} />
      <Route path="/payments/:id" component={PaymentForm} />
      <Route path="/payments/:id/print" component={PrintReceipt} />
      <Route path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
