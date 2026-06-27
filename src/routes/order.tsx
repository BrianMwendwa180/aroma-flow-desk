import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order at your table — Maison Café" },
      { name: "description", content: "Send your order straight to the bar from your seat." },
    ],
  }),
  component: OrderPage,
});

type Item = { id: string; name: string; price: number; category_id: string | null };

function OrderPage() {
  const { user } = useAuth();
  const [table, setTable] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["order-menu"],
    queryFn: async () => {
      const [c, i] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").eq("available", true).order("name"),
      ]);
      if (c.error) throw c.error;
      if (i.error) throw i.error;
      return { cats: c.data, items: i.data as Item[] };
    },
  });

  const total = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((sum, it) => sum + (cart[it.id] ?? 0) * Number(it.price), 0);
  }, [cart, data]);

  function bump(id: string, delta: number) {
    setCart((c) => {
      const next = (c[id] ?? 0) + delta;
      const copy = { ...c };
      if (next <= 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  }

  async function submit() {
    if (!table || Number(table) < 1) { toast.error("Enter your table number"); return; }
    const lines = data?.items.filter(i => cart[i.id]).map(i => ({
      id: i.id, name: i.name, qty: cart[i.id], price: Number(i.price),
    })) ?? [];
    if (!lines.length) { toast.error("Add at least one item"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("menu_requests").insert({
      user_id: user?.id ?? null,
      table_number: Number(table),
      items: lines,
      total: Number(total.toFixed(2)),
      notes: notes || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sent to the bar! Hang tight.");
    setCart({});
    setNotes("");
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <SiteNav />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <section>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Order at table</span>
          <h1 className="mt-3 font-display text-5xl">Tap to add.</h1>
          <p className="mt-3 text-muted-foreground">Pick your items, set your table number, and we'll bring it over.</p>

          <div className="mt-10 space-y-10">
            {data?.cats.map((cat) => {
              const items = data.items.filter(i => i.category_id === cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id}>
                  <h2 className="mb-4 border-b border-border pb-2 font-display text-2xl">{cat.name}</h2>
                  <ul className="divide-y divide-border/60">
                    {items.map(it => {
                      const qty = cart[it.id] ?? 0;
                      return (
                        <li key={it.id} className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-sm text-muted-foreground">${Number(it.price).toFixed(2)}</div>
                          </div>
                          {qty === 0 ? (
                            <Button variant="outline" size="sm" onClick={() => bump(it.id, 1)}>Add</Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => bump(it.id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                              <span className="w-6 text-center font-mono text-sm">{qty}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => bump(it.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-2xl">Your order</h3>
            <div className="mt-4 space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Table number</Label>
              <Input type="number" min={1} value={table} onChange={(e) => setTable(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 7" />
            </div>
            <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto">
              {Object.entries(cart).length === 0 && (
                <li className="text-sm text-muted-foreground">No items yet.</li>
              )}
              {data?.items.filter(i => cart[i.id]).map(i => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <span><span className="font-mono text-muted-foreground">{cart[i.id]}×</span> {i.name}</span>
                  <span className="flex items-center gap-2 font-mono">${(cart[i.id] * Number(i.price)).toFixed(2)}
                    <button onClick={() => { setCart(c => { const x = {...c}; delete x[i.id]; return x; }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, extras…" />
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl">${total.toFixed(2)}</span>
            </div>
            <Button onClick={submit} disabled={submitting} size="lg" className="mt-4 w-full">
              {submitting ? "Sending…" : "Send order"}
            </Button>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
