import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Coffee, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Staff dashboard — Omnireach Café" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

const tabs: Array<{ to: string; label: string; icon: typeof Calendar; exact?: boolean }> = [
  { to: "/dashboard", label: "Reservations", icon: Calendar, exact: true },
  { to: "/dashboard/requests", label: "Table orders", icon: ClipboardList },
  { to: "/dashboard/menu", label: "Menu", icon: Coffee },
];

function DashboardLayout() {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background"><SiteNav /><main className="mx-auto max-w-2xl p-10 text-center text-muted-foreground">Loading…</main></div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-4xl">Staff only</h1>
          <p className="mt-3 text-muted-foreground">Your account doesn't have staff access. Ask a manager to grant you the staff role.</p>
          <p className="mt-6 text-xs text-muted-foreground">Signed in as {user.email}</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Staff</span>
            <h1 className="mt-1 font-display text-4xl">Dashboard</h1>
          </div>
          <nav className="flex gap-1 rounded-full border border-border bg-card p-1">
            {tabs.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link key={t.to} to={t.to as "/dashboard"} className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="py-8"><Outlet /></div>
      </div>
    </div>
  );
}
