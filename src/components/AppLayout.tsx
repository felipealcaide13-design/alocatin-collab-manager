import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Menu, X, Layers, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: FileText, label: "Contratos", to: "/contratos" },
  { icon: Users, label: "Colaboradores", to: "/colaboradores" },
  { icon: Layers, label: "Áreas", to: "/areas" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 mt-4">
      {navItems.map(({ icon: Icon, label, to }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-nav-item",
              active ? "sidebar-nav-active" : "sidebar-nav-inactive"
            )}
          >
            <Icon size={18} />
            {(sidebarOpen || mobileOpen) && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-20",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <span className="text-sidebar-primary-foreground font-bold text-lg tracking-tight">
              <span className="text-primary">Aloca</span>tin
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:text-sidebar-accent-foreground p-1 rounded-md hover:bg-sidebar-accent/50 transition-colors ml-auto"
          >
            <Menu size={18} />
          </button>
        </div>
        <div className="flex-1 px-3 py-2">
          <NavLinks />
        </div>
        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60">Alocatin v1.0</p>
          </div>
        )}
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <span className="text-sidebar-primary-foreground font-bold text-lg tracking-tight">
            <span className="text-primary">Aloca</span>tin
          </span>
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground p-1 rounded-md hover:bg-sidebar-accent/50">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 px-3 py-2">
          <NavLinks />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-xl tracking-tight">
              <span className="text-primary">Aloca</span>tin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-in overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
