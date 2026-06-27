import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

export function SiteNav() {
  const { user, isStaff, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl">
          <Coffee className="h-5 w-5 text-accent" />
          <span>Omnireach Café</span>
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/menu" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Menu</Link>
          <Link to="/book" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Book</Link>
          <Link to="/order" className="text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Order at table</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isStaff && (
                <Button asChild variant="outline" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
              )}
              <Button asChild variant="ghost" size="sm"><Link to="/my-bookings">My bookings</Link></Button>
              <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/book">Reserve</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2 font-display text-base text-foreground">
          <Coffee className="h-4 w-4 text-accent" /> Omnireach Café
        </div>
        <div>112 Linden Street · Open daily 7am–7pm</div>
        <div>© {new Date().getFullYear()} Omnireach Café</div>
      </div>
    </footer>
  );
}
