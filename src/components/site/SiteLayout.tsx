import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, LayoutDashboard, MessageCircle, Facebook, Mail, Phone, MapPin, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicSiteSettings } from "@/lib/public.functions";

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

  const { data } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => getPublicSiteSettings(),
    staleTime: 5 * 60 * 1000,
  });
  const settings = data?.settings;
  const socials = (settings?.socials ?? {}) as { facebook?: string; whatsapp?: string };
  const whatsappNumber = socials.whatsapp ?? "254727343713";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I'd like to know more about The Ulu We Want SHG.")}`;
  const facebookUrl = socials.facebook ?? "https://facebook.com/TheUluWeWant";
  const phone = settings?.contact_phone ?? "0727 343 713";
  const email = settings?.contact_email ?? "maxmedia017@gmail.com";
  const location = settings?.location ?? "Ulu, Makueni County, Kenya";

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
              to="/donate"
              className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <Heart className="h-4 w-4" /> Donate
            </Link>
            <Link
              to="/join"
              className="ml-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
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
              to="/donate"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full border border-accent px-5 py-2.5 text-center text-sm font-semibold text-accent"
            >
              Donate
            </Link>
            <Link
              to="/join"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-accent px-5 py-2.5 text-center text-sm font-semibold text-accent-foreground"
            >
              Join Us
            </Link>
            <Link
              to={signedIn ? "/admin" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              {signedIn ? "Dashboard" : "Login"}
            </Link>
          </nav>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-lg font-bold">The Ulu We Want SHG</p>
            <p className="mt-3 max-w-md text-sm opacity-80">
              {settings?.footer_text ?? "A registered community self-help group in Ulu, Makueni County, Kenya — empowering communities and transforming lives."}
            </p>
            <div className="mt-5 flex gap-3">
              <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-foreground/10 transition-colors hover:bg-secondary-foreground/20">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-foreground/10 transition-colors hover:bg-secondary-foreground/20">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href={`mailto:${email}`} aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-foreground/10 transition-colors hover:bg-secondary-foreground/20">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="font-semibold">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:underline">{l.label}</Link>
                </li>
              ))}
              <li><Link to="/donate" className="hover:underline">Donate</Link></li>
              <li><Link to="/join" className="hover:underline">Join Us</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Get in Touch</p>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {location}</li>
              <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /> <a href={`mailto:${email}`} className="hover:underline">{email}</a></li>
              <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /> <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:underline">{phone}</a></li>
              <li className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp: {phone}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/15 py-4 text-center text-xs opacity-70">
          © {new Date().getFullYear()} The Ulu We Want Self-Help Group. Empowering Communities, Transforming Lives.
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
