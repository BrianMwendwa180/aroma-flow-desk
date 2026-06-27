import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Check, X, Coffee } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: ReservationsPage,
});

function ReservationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "seated">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["staff-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reservations").select("*").order("reservation_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("reservations").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["staff-reservations"] }); }
  }

  const rows = (data ?? []).filter(r => filter === "all" || r.status === filter);
  const counts = (data ?? []).reduce((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["pending","confirmed","seated","all"] as const).map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s} {s !== "all" && <span className="ml-2 rounded-full bg-background/30 px-2 text-xs">{counts[s] ?? 0}</span>}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-3">When</th><th className="p-3">Guest</th><th className="p-3">Party</th><th className="p-3">Table</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="p-3 font-mono">{format(new Date(r.reservation_time), "MMM d · h:mm a")}</td>
                <td className="p-3">
                  <div className="font-medium">{r.guest_name}</div>
                  <div className="text-xs text-muted-foreground">{r.guest_phone}{r.guest_email ? ` · ${r.guest_email}` : ""}</div>
                  {r.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{r.notes}"</div>}
                </td>
                <td className="p-3">{r.party_size}</td>
                <td className="p-3">
                  <Input className="h-8 w-16" type="number" defaultValue={r.table_number ?? ""} onBlur={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    if (v !== r.table_number) update(r.id, { table_number: v });
                  }} />
                </td>
                <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-widest">{r.status}</span></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {r.status !== "confirmed" && <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "confirmed" })}><Check className="h-3.5 w-3.5" /></Button>}
                    {r.status !== "seated" && <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "seated" })}><Coffee className="h-3.5 w-3.5" /></Button>}
                    {r.status !== "cancelled" && <Button size="sm" variant="outline" onClick={() => update(r.id, { status: "cancelled" })}><X className="h-3.5 w-3.5" /></Button>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No reservations.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
