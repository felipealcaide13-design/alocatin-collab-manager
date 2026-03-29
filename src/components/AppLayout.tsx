import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Menu, X, Layers, FileText, Building2, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Building2, label: "Business Units", to: "/business-units" },
  { icon: FileText, label: "Contratos", to: "/contratos" },
  { icon: Users, label: "Colaboradores", to: "/colaboradores" },
  { icon: Layers, label: "Diretorias", to: "/areas" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 mt-4">
      {navItems.map(({ icon: Icon, label, to }) => {
        const active = location.pathname === to;
        const isCollapsed = !sidebarOpen && !mobileOpen;
        
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-nav-item mb-1",
              active
                ? "bg-[var(--primary-800)]/80 text-white shadow-sm"
                : "text-white/60 hover:bg-[var(--primary-800)]/40 hover:text-white",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? label : undefined}
          >
            <Icon size={18} className={cn("shrink-0 transition-all duration-300", active && "text-[var(--primary-600)]")} />
            {!isCollapsed && <span className="font-medium tracking-wide">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
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
          "hidden md:flex flex-col bg-[var(--primary-900)] border-r border-[var(--primary-800)] transition-all duration-300 z-20",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--primary-800)]">
          {sidebarOpen && (
            <span className="font-extrabold text-xl tracking-tighter">
              <span className="text-[var(--primary-600)]">Aloca</span><span className="text-white">tin</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/70 hover:text-white hover:bg-[var(--primary-800)]/60 p-1 rounded-md transition-colors ml-auto"
          >
            <Menu size={18} />
          </button>
        </div>
        <div className="flex-1 px-3 py-2 overflow-y-auto">
          <NavLinks />
        </div>
        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-[var(--primary-800)] shrink-0">
            <p className="text-xs text-white/40">Alocatin v1.0</p>
          </div>
        )}
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-[var(--primary-900)] border-r border-[var(--primary-800)] z-40 flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--primary-800)]">
          <span className="font-extrabold text-xl tracking-tighter">
            <span className="text-[var(--primary-600)]">Aloca</span><span className="text-white">tin</span>
          </span>
          <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white hover:bg-[var(--primary-800)]/60 p-1 rounded-md transition-colors">
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
        <header className="h-16 flex items-center gap-4 px-4 md:px-6 bg-card border-b border-border shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-[var(--primary-600)] flex items-center justify-center text-white text-sm font-semibold shrink-0 hover:bg-[var(--primary-700)] transition-colors">
                {userInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Minha Conta</span>
                <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-in overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
