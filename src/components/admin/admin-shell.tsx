"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AdminLoading } from "@/components/admin/admin-loading";
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
  Moon,
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [dimMode, setDimMode] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  // Redirect to login once the session has actually resolved. Doing this during
  // render would fire before the session store hydrates and bounce a freshly
  // signed-in user back to the login page.
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/admin/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    await authClient.signOut();
    router.replace("/admin/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function navigateTo(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  function openNotification(href: string) {
    setNotificationsRead(true);
    setNotificationsOpen(false);
    router.push(href);
  }

  if (isPending || !session) {
    return (
      <div className="admin-console min-h-screen flex items-center justify-center">
        <AdminLoading label="Đang mở không gian làm việc" />
      </div>
    );
  }

  const user = session.user;
  const displayName = user.name || user.email;
  const displayRole = (user.role as string) || "RECEPTIONIST";
  const matchingPages = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Keep the current CMS palette independent from the historical global admin
  // themes. Inline custom properties outrank those legacy tokens regardless of
  // stylesheet load order in a production build.
  const cmsTheme = {
    "--admin-bg": dimMode ? "#17201a" : "#f6f6f1",
    "--admin-panel": dimMode ? "#1f2b22" : "#ffffff",
    "--admin-ink": dimMode ? "#edf5ec" : "#17201a",
    "--admin-ink-soft": dimMode ? "#c0d1c0" : "#405046",
    "--admin-muted": dimMode ? "#9db19d" : "#778279",
    "--admin-line": dimMode ? "#35463a" : "#e4e8e0",
    "--admin-green": "#3b9238",
    "--admin-green-deep": dimMode ? "#b9e8b4" : "#28732d",
    "--admin-green-soft": dimMode ? "#2b4630" : "#eaf5e7",
  } as React.CSSProperties;

  return (
    <div style={cmsTheme} className={`admin-console admin-design-v2 min-h-screen flex bg-[var(--admin-bg)] text-[var(--admin-ink)] ${dimMode ? "cms-dim-mode" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`hasana-sidebar-v2 fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="hasana-brand-v2 h-[76px] flex items-center justify-between px-5">
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
        <nav className="hasana-navigation-v2 mt-6 px-3 space-y-1" aria-label="Admin navigation">
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
          <div className="hasana-profile-v2 p-3">
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
        <header className="hasana-topbar-v2 h-[76px] flex items-center justify-between gap-4 px-4 lg:px-8 sticky top-0 z-30">
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

          <button type="button" onClick={() => setSearchOpen(true)} className="hasana-search-v2 hidden md:flex flex-1 max-w-[37rem] items-center gap-2.5 px-4 py-2.5 text-left" aria-label="Search the admin workspace">
            <Search size={16} className="text-[var(--admin-muted)]" />
            <span className="flex-1 text-[13px] text-[var(--admin-muted)]">Search bookings, guests, rooms...</span>
            <kbd className="hidden xl:inline-flex rounded-md bg-[var(--admin-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-muted)]">Ctrl K</kbd>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              className="hasana-icon-button-v2"
              aria-label="Toggle display mode"
              aria-pressed={dimMode}
              onClick={() => setDimMode((current) => !current)}
            >
              {dimMode ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen((current) => !current)} className="hasana-icon-button-v2 relative" aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={17} />{!notificationsRead && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--admin-green)]" />}</button>
              {notificationsOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} />
                  <div className="cms-popover absolute right-0 top-full z-50 mt-3 w-80" role="dialog" aria-label="Notifications">
                    <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-4 py-3"><strong>Notifications</strong><button type="button" onClick={() => setNotificationsRead(true)} className="cms-popover-action text-xs font-semibold text-[var(--admin-green-deep)]">{notificationsRead ? "All caught up" : "Mark all read"}</button></div>
                    <div className="space-y-1 p-2">
                      <button type="button" onClick={() => openNotification("/admin/reviews")} className="cms-notification w-full text-left">{!notificationsRead && <span className="cms-notification-dot" />}<span><strong>2 reviews are waiting</strong><p>Review recent guest feedback.</p></span></button>
                      <button type="button" onClick={() => openNotification("/admin/rooms")} className="cms-notification w-full text-left">{!notificationsRead && <span className="cms-notification-dot" />}<span><strong>15 rooms are ready</strong><p>All available rooms are up to date.</p></span></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="hasana-user-menu-v2 flex items-center gap-2 px-2 py-1.5 text-[13px] text-[var(--admin-ink)]"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--admin-green)] text-white flex items-center justify-center text-[11px] font-bold uppercase">
                {displayName.charAt(0)}
              </div>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={16} />
            </button>

            {userMenuOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close account menu" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 hasana-menu-popover-v2 py-2 z-50">
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
              </>
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

      {searchOpen && (
        <div className="cms-command-backdrop fixed inset-0 z-[70] flex items-start justify-center bg-[#17201a]/30 px-4 pt-[12vh] backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="cms-command-dialog w-full max-w-xl" role="dialog" aria-modal="true" aria-label="Search workspace" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[var(--admin-line)] px-4 py-3"><Search size={18} className="text-[var(--admin-muted)]" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && matchingPages[0]) navigateTo(matchingPages[0].href); }} placeholder="Search a screen…" className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none" /><kbd className="rounded bg-[var(--admin-bg)] px-2 py-1 text-[10px] font-bold text-[var(--admin-muted)]">ESC</kbd></div>
            <div className="p-2"><p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--admin-muted)]">Navigate to</p>{matchingPages.length ? matchingPages.map((item) => <button type="button" key={item.href} onClick={() => navigateTo(item.href)} className="cms-command-result"><span>{item.icon}</span><span>{item.label}</span></button>) : <p className="px-2 py-6 text-center text-sm text-[var(--admin-muted)]">No matching screen</p>}</div>
          </div>
        </div>
      )}
    </div>
  );
}
