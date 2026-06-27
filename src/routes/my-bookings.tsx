import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const Route = createFileRoute("/my-bookings")({
  head: () => ({ meta: [{ title: "My bookings — Maison Café" }] }),
  component: MyBookings,
});

function MyBookings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("reservations").select("*").order("reservation_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 pt-14 pb-20 sm:px-6">
        <h1 className="font-display text-5xl">Your bookings</h1>
        <p className="mt-3 text-muted-foreground">Past and upcoming reservations.</p>

        <div className="mt-10 space-y-3">
          {data?.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">No bookings yet.</p>
              <Button asChild className="mt-4"><Link to="/book">Reserve a table</Link></Button>
            </div>
          )}
          {data?.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
              <div>
                <div className="font-display text-xl">{format(new Date(r.reservation_time), "EEE, MMM d · h:mm a")}</div>
                <div className="text-sm text-muted-foreground">Party of {r.party_size}{r.table_number ? ` · Table ${r.table_number}` : ""}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    confirmed: "bg-accent/20 text-accent-foreground border border-accent/40",
    seated: "bg-primary text-primary-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${styles[status] ?? styles.pending}`}>{status}</span>;
}
