"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Users,
  FileText,
  Tag,
  Image as ImageIcon,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  PanelTop,
  Search,
  Bell,
  Sun,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={17} /> },
  { label: "Rooms", href: "/admin/rooms", icon: <BedDouble size={17} /> },
  { label: "Content", href: "/admin/content", icon: <PanelTop size={17} /> },
  { label: "Bookings", href: "/admin/bookings", icon: <CalendarDays size={17} /> },
  { label: "Guests", href: "/admin/guests", icon: <Users size={17} /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText size={17} /> },
  { label: "Promotions", href: "/admin/promotions", icon: <Tag size={17} /> },
  { label: "Gallery", href: "/admin/gallery", icon: <ImageIcon size={17} /> },
  { label: "Reviews", href: "/admin/reviews", icon: <Star size={17} /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings size={17} /> },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  // Redirect to login once the session has actually resolved. Doing this during
  // render would fire before the session store hydrates and bounce a freshly
  // signed-in user back to the login page.
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/admin/login");
    }
  }, [isPending, session, router]);

  async function handleLogout() {
    await authClient.signOut();
    router.replace("/admin/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  if (isPending || !session) {
    return (
      <div className="admin-console min-h-screen flex items-center justify-center">
        <div className="admin-loader">Loading...</div>
      </div>
    );
  }

  const user = session.user;
  const displayName = user.name || user.email;
  const displayRole = (user.role as string) || "RECEPTIONIST";

  return (
    <div className="admin-console min-h-screen flex bg-[var(--admin-bg)] text-[var(--admin-ink)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="admin-brand h-[76px] flex items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-3" aria-label="Hasana hotel dashboard">
            <span className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-[var(--admin-green)] text-xl font-semibold text-white shadow-[0_10px_20px_rgb(48_120_58_/_0.22)]">
              H
            </span>
            <span>
              <span className="block font-[family-name:var(--font-heading)] text-[22px] font-semibold leading-none tracking-[0.02em] text-[var(--admin-ink)]">Hasana</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--admin-muted)]">Hotel operations</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-navigation mt-6 px-3 space-y-1" aria-label="Admin navigation">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--admin-muted)]">Workspace</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive(item.href)
                  ? "bg-[var(--admin-green-soft)] text-[var(--admin-green-deep)]"
                  : "text-[var(--admin-ink-soft)] hover:bg-[var(--admin-green-soft)]/65 hover:text-[var(--admin-green-deep)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isActive(item.href) ? "bg-[var(--admin-green)] text-white" : "text-[var(--admin-muted)] group-hover:text-[var(--admin-green)]"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="admin-profile p-3">
            <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--admin-green-soft)] text-[var(--admin-green-deep)] flex items-center justify-center text-xs font-bold uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--admin-ink)] truncate">{displayName}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)] capitalize">{displayRole.replace("_", " ").toLowerCase()}</p>
            </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="admin-topbar h-[76px] flex items-center justify-between gap-4 px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:block min-w-44">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-muted)]">Hotel workspace</p>
            <h2 className="mt-0.5 text-lg font-semibold text-[var(--admin-ink)]">
              {navItems.find((item) => isActive(item.href))?.label || "Admin"}
            </h2>
          </div>

          <div className="admin-search hidden md:flex flex-1 max-w-[37rem] items-center gap-2.5 px-4 py-2.5">
            <Search size={16} className="text-[var(--admin-muted)]" />
            <span className="flex-1 text-[13px] text-[var(--admin-muted)]">Search bookings, guests, rooms...</span>
            <kbd className="hidden xl:inline-flex rounded-md bg-[var(--admin-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-muted)]">Ctrl K</kbd>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button className="admin-icon-button" aria-label="Display settings"><Sun size={17} /></button>
            <button className="admin-icon-button relative" aria-label="Notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--admin-green)]" /></button>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="admin-user-menu flex items-center gap-2 px-2 py-1.5 text-[13px] text-[var(--admin-ink)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--admin-green)] text-white flex items-center justify-center text-[11px] font-bold uppercase">
                {displayName.charAt(0)}
              </div>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={16} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 admin-menu-popover py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
