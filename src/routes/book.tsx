import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Calendar, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Reserve a table — Omnireach Café" },
      { name: "description", content: "Book a table at Omnireach Café in seconds. Confirmation by our team." },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  guest_name: z.string().trim().min(2, "Your name").max(80),
  guest_email: z.string().trim().email("Valid email").max(160).optional().or(z.literal("")),
  guest_phone: z.string().trim().min(5).max(40),
  party_size: z.number().int().min(1).max(20),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().max(400).optional().or(z.literal("")),
});

function BookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      guest_name: String(fd.get("guest_name") ?? ""),
      guest_email: String(fd.get("guest_email") ?? ""),
      guest_phone: String(fd.get("guest_phone") ?? ""),
      party_size: Number(fd.get("party_size") ?? 2),
      date: String(fd.get("date") ?? ""),
      time: String(fd.get("time") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const when = new Date(`${parsed.data.date}T${parsed.data.time}`);
    const { error } = await supabase.from("reservations").insert({
      user_id: user?.id ?? null,
      guest_name: parsed.data.guest_name,
      guest_email: parsed.data.guest_email || null,
      guest_phone: parsed.data.guest_phone,
      party_size: parsed.data.party_size,
      reservation_time: when.toISOString(),
      notes: parsed.data.notes || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Reservation requested! We'll confirm shortly.");
    if (user) navigate({ to: "/my-bookings" });
    else (e.target as HTMLFormElement).reset();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto grid max-w-5xl gap-10 px-4 pt-14 pb-20 sm:px-6 md:grid-cols-[1fr_1.3fr]">
        <aside>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Reserve</span>
          <h1 className="mt-3 font-display text-5xl">Book a table.</h1>
          <p className="mt-4 text-muted-foreground">Tell us when, who and how many — we'll have your seat ready.</p>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 text-accent" /> Mon – Sun, 7am to 7pm</li>
            <li className="flex items-start gap-3"><Users className="mt-0.5 h-4 w-4 text-accent" /> Groups of 8+ — call us at (555) 010-2233</li>
            <li className="flex items-start gap-3"><Calendar className="mt-0.5 h-4 w-4 text-accent" /> 15-min grace period</li>
          </ul>
        </aside>
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input name="guest_name" defaultValue={user?.user_metadata?.full_name ?? ""} required /></Field>
            <Field label="Phone"><Input name="guest_phone" type="tel" required /></Field>
          </div>
          <Field label="Email (optional)"><Input name="guest_email" type="email" defaultValue={user?.email ?? ""} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date"><Input name="date" type="date" min={today} required /></Field>
            <Field label="Time"><Input name="time" type="time" defaultValue="19:00" required /></Field>
            <Field label="Party size"><Input name="party_size" type="number" min={1} max={20} defaultValue={2} required /></Field>
          </div>
          <Field label="Notes (optional)"><Textarea name="notes" rows={3} placeholder="High chair, allergies, occasion…" /></Field>
          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? "Sending…" : "Request reservation"}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
