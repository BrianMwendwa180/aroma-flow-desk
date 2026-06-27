import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & prices — Maison Café" },
      { name: "description", content: "Espresso, brew bar, pastries, and brunch — see every item and price." },
    ],
  }),
  component: MenuPage,
});

async function fetchMenu() {
  const [cats, items] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("name"),
  ]);
  if (cats.error) throw cats.error;
  if (items.error) throw items.error;
  return { categories: cats.data, items: items.data };
}

function MenuPage() {
  const { data, isLoading } = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 pt-14 pb-20 sm:px-6">
        <header className="mb-12 max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">The menu</span>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">What we're serving today.</h1>
          <p className="mt-4 text-muted-foreground">Prices in USD. Availability changes through the day — staff confirm at the counter.</p>
        </header>

        {isLoading && (
          <div className="space-y-8">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        )}

        {data?.categories.map((cat) => {
          const catItems = data.items.filter(i => i.category_id === cat.id);
          if (!catItems.length) return null;
          return (
            <section key={cat.id} className="mb-14">
              <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
                <h2 className="font-display text-3xl">{cat.name}</h2>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{catItems.length} items</span>
              </div>
              <ul className="divide-y divide-border/60">
                {catItems.map(item => (
                  <li key={item.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {!item.available && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">86'd</span>}
                    </div>
                    <div className="text-right font-mono text-sm tabular-nums">${Number(item.price).toFixed(2)}</div>
                    {item.description && <p className="col-span-2 max-w-xl text-sm text-muted-foreground">{item.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </div>
  );
}
