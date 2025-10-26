import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, FileText, Receipt, BarChart3 } from "lucide-react";
import logoUrl from "@assets/unnamed_1761496137747.png";

export default function Header() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
        {/* Logo and Title */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-lg px-3 py-2 -mr-3">
            <img
              src={logoUrl}
              alt="شركة قرطبة للتوريدات"
              className="h-10"
              data-testid="img-logo"
            />
            <div className="hidden sm:block">
              <h1 className="text-h3 font-bold leading-none">قرطبة للتوريدات</h1>
              <p className="text-tiny text-muted-foreground">نظام الحسابات</p>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={isActive("/") && location === "/" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="link-dashboard"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>
          </Link>
          <Link href="/payments">
            <Button
              variant={isActive("/payments") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="link-payments"
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">الدفعات</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button
              variant={isActive("/reports") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              data-testid="link-reports"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">التقارير</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
