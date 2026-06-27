import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/requests")({
  component: RequestsPage,
});

type LineItem = { id: string; name: string; qty: number; price: number };

function RequestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["staff-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_requests").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel("menu_requests_staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["staff-requests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("menu_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["staff-requests"] });
  }

  return (
    <div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map(r => {
          const items = (r.items as unknown as LineItem[]) ?? [];
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-2xl">Table {r.table_number}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d · h:mm a")}</div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-widest">{r.status}</span>
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {items.map(it => (
                  <li key={it.id} className="flex justify-between">
                    <span><span className="font-mono text-muted-foreground">{it.qty}×</span> {it.name}</span>
                    <span className="font-mono">${(it.qty * it.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              {r.notes && <p className="mt-3 rounded bg-muted/50 p-2 text-xs italic">"{r.notes}"</p>}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="font-mono">${Number(r.total).toFixed(2)}</span>
                <div className="flex gap-1">
                  {r.status === "pending" && <Button size="sm" onClick={() => setStatus(r.id, "preparing")}>Start</Button>}
                  {r.status === "preparing" && <Button size="sm" onClick={() => setStatus(r.id, "served")}>Served</Button>}
                  {r.status !== "cancelled" && r.status !== "served" && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "cancelled")}>Cancel</Button>}
                </div>
              </div>
            </div>
          );
        })}
        {data?.length === 0 && !isLoading && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No table orders yet.</div>
        )}
      </div>
    </div>
  );
}
