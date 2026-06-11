import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/members", label: "Members" },
  { to: "/media", label: "Media Desk" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">U</span>
            <span className="font-bold leading-tight text-secondary">
              The Ulu We Want <span className="block text-xs font-medium text-muted-foreground">Self-Help Group</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                inactiveProps={{ className: "text-foreground/70 hover:text-foreground" }}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/join"
              className="ml-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Join Us
            </Link>
            {signedIn ? (
              <Link
                to="/admin"
                className="ml-1 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                className="ml-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Login
              </Link>
            )}
          </nav>

          <button
            className="rounded-md p-2 text-foreground lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-border bg-background px-4 pb-4 lg:hidden">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-primary font-semibold" }}
                className="block border-b border-border/50 py-3 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to={signedIn ? "/admin" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              {signedIn ? "Dashboard" : "Login"}
            </Link>
          </nav>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">The Ulu We Want SHG</p>
            <p className="mt-3 text-sm opacity-80">
              A registered community self-help group in Ulu, Makueni County, Kenya — empowering communities and transforming lives.
            </p>
          </div>
          <div>
            <p className="font-semibold">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Get in Touch</p>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              <li>Ulu Market, Makueni County, Kenya</li>
              <li>info@uluwewant.org</li>
              <li><Link to="/contact" className="hover:underline">Send us a message →</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/15 py-4 text-center text-xs opacity-70">
          © {new Date().getFullYear()} The Ulu We Want Self-Help Group. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
