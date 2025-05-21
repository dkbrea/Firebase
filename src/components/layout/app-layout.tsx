
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Icons from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";
import { useAuth } from "@/contexts/auth-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { href: "/transactions", label: "Transactions", icon: Icons.Transactions },
  { href: "/categories", label: "Categories", icon: Icons.Categories },
  { href: "/accounts", label: "Accounts", icon: Icons.Accounts },
  { href: "/debts", label: "Debt Plan", icon: Icons.Debts },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>Loading...</p> {/* Or a proper spinner/loader component */}
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
          <Icons.Wallet className="h-6 w-6" />
          <span>Pocket Ledger</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === item.href ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : ""
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-sidebar w-[280px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            {/* Optional: Page Title or Breadcrumbs can go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 flex-col gap-4 p-4 md:p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
