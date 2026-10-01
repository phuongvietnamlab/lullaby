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
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
  { label: "Rooms", href: "/admin/rooms", icon: <BedDouble size={20} /> },
  { label: "Content", href: "/admin/content", icon: <PanelTop size={20} /> },
  { label: "Bookings", href: "/admin/bookings", icon: <CalendarDays size={20} /> },
  { label: "Guests", href: "/admin/guests", icon: <Users size={20} /> },
  { label: "Blog", href: "/admin/blog", icon: <FileText size={20} /> },
  { label: "Promotions", href: "/admin/promotions", icon: <Tag size={20} /> },
  { label: "Gallery", href: "/admin/gallery", icon: <ImageIcon size={20} /> },
  { label: "Reviews", href: "/admin/reviews", icon: <Star size={20} /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
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
        className={`admin-sidebar fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-72 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950 shadow-lg shadow-black/15">
              H
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] uppercase text-white">Hasana</span>
              <span className="block text-xs text-slate-400">Hotel console</span>
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
        <nav className="mt-5 px-3 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive(item.href) ? "bg-slate-950 text-white" : "bg-white/8 text-slate-300 group-hover:bg-white/12"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-950 flex items-center justify-center text-sm font-bold uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 capitalize">{displayRole.replace("_", " ").toLowerCase()}</p>
            </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="admin-topbar h-20 flex items-center justify-between gap-4 px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:block min-w-48">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Workspace</p>
            <h2 className="text-lg font-semibold text-gray-950">
              {navItems.find((item) => isActive(item.href))?.label || "Admin"}
            </h2>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-2.5 shadow-sm shadow-slate-950/5">
            <Search size={17} className="text-gray-400" />
            <span className="text-sm text-gray-400">Search bookings, guests, rooms...</span>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/85 px-2.5 py-2 text-sm text-gray-700 shadow-sm shadow-slate-950/5 hover:text-gray-950"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center text-xs font-bold uppercase">
                {displayName.charAt(0)}
              </div>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={16} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-950/10 border border-gray-200/80 py-2 z-50">
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
          <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
