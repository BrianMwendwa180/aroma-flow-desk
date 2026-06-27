import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/menu")({
  component: MenuAdmin,
});

type Cat = { id: string; name: string; sort_order: number };
type Item = { id: string; category_id: string | null; name: string; description: string | null; price: number; available: boolean };

function MenuAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["staff-menu"],
    queryFn: async () => {
      const [c, i] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("name"),
      ]);
      if (c.error) throw c.error; if (i.error) throw i.error;
      return { cats: c.data as Cat[], items: i.data as Item[] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["staff-menu"] });

  async function toggleAvail(it: Item) {
    const { error } = await supabase.from("menu_items").update({ available: !it.available }).eq("id", it.id);
    if (error) toast.error(error.message); else refresh();
  }
  async function del(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <ItemDialog cats={data?.cats ?? []} onSaved={refresh}>
          <Button><Plus className="mr-2 h-4 w-4" /> Add item</Button>
        </ItemDialog>
      </div>

      <div className="space-y-10">
        {data?.cats.map(cat => {
          const items = data.items.filter(i => i.category_id === cat.id);
          return (
            <section key={cat.id}>
              <h2 className="mb-3 font-display text-2xl">{cat.name}</h2>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr><th className="p-3">Item</th><th className="p-3">Price</th><th className="p-3">Available</th><th className="p-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map(it => (
                      <tr key={it.id}>
                        <td className="p-3">
                          <div className="font-medium">{it.name}</div>
                          {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                        </td>
                        <td className="p-3 font-mono">${Number(it.price).toFixed(2)}</td>
                        <td className="p-3"><Switch checked={it.available} onCheckedChange={() => toggleAvail(it)} /></td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <ItemDialog cats={data.cats} item={it} onSaved={refresh}>
                              <Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" /></Button>
                            </ItemDialog>
                            <Button size="sm" variant="outline" onClick={() => del(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No items.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ItemDialog({ children, cats, item, onSaved }: { children: React.ReactNode; cats: Cat[]; item?: Item; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ?? cats[0]?.id ?? "");
  const [available, setAvailable] = useState(item?.available ?? true);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || null,
      price: Number(fd.get("price") ?? 0),
      category_id: categoryId || null,
      available,
    };
    if (!payload.name) { toast.error("Name required"); return; }
    const q = item ? supabase.from("menu_items").update(payload).eq("id", item.id) : supabase.from("menu_items").insert(payload);
    const { error } = await q;
    if (error) toast.error(error.message); else { toast.success("Saved"); onSaved(); setOpen(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div><Label>Name</Label><Input name="name" defaultValue={item?.name} required /></div>
          <div><Label>Description</Label><Textarea name="description" defaultValue={item?.description ?? ""} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Price</Label><Input name="price" type="number" step="0.01" min="0" defaultValue={item?.price ?? 0} required /></div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3"><Switch checked={available} onCheckedChange={setAvailable} /><Label>Available now</Label></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
