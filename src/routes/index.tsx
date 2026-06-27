import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, MapPin, Utensils } from "lucide-react";
import hero from "@/assets/cafe-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Café — Neighborhood coffee & brunch" },
      { name: "description", content: "Book a table, explore our menu and prices, and order from your seat at Maison Café." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-20 md:pb-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Open today · 7am – 7pm
            </span>
            <h1 className="text-balance font-display text-5xl leading-[1.05] md:text-7xl">
              Slow coffee.<br/>
              <span className="italic text-muted-foreground">Quiet mornings.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground md:text-lg">
              A small neighborhood café for thoughtful coffee, fresh pastries, and unhurried brunch. Reserve a table or order from your seat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/book">Reserve a table <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/menu">View menu & prices</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
              <img src={hero} alt="Maison Café interior with morning light" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-4 shadow-sm md:block">
              <div className="font-display text-2xl">112</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Linden Street</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="border-y border-border/60 bg-secondary/40">
          <div className="mx-auto grid max-w-6xl gap-px bg-border md:grid-cols-3">
            {[
              { icon: Utensils, t: "Curated menu", d: "Single-origin espresso, sourdough, brunch." },
              { icon: Clock, t: "Instant booking", d: "Reserve in seconds — confirmed by our team." },
              { icon: MapPin, t: "Order at table", d: "Scan, pick items, send to the bar." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-4 bg-background p-8">
                <f.icon className="mt-1 h-5 w-5 text-accent" />
                <div>
                  <div className="font-medium">{f.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-10 md:p-16">
            <h2 className="font-display text-4xl md:text-5xl">A table is waiting.</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">Pick a time, party size, and we'll have your spot ready when you walk in.</p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg"><Link to="/book">Book now</Link></Button>
              <Button asChild size="lg" variant="ghost"><Link to="/menu">See menu</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
