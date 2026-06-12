import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Smartphone, ArrowRight, Copy, CheckCircle2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicSiteSettings } from "@/lib/public.functions";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — The Ulu We Want SHG" },
      { name: "description", content: "Support The Ulu We Want SHG. Your donation funds Starlink connectivity, youth empowerment, and community development in Ulu, Kenya." },
      { property: "og:title", content: "Donate — The Ulu We Want SHG" },
      { property: "og:description", content: "Help fund Starlink connectivity, youth empowerment, and community development in Ulu." },
    ],
  }),
  component: DonatePage,
});

const causes = [
  { title: "Starlink Connectivity", description: "Bring high-speed internet to youth and small businesses in Ulu.", icon: "🛰️" },
  { title: "Youth Empowerment", description: "Fund training, mentorship, and digital skills programs.", icon: "🎓" },
  { title: "Table Banking", description: "Grow the savings pool that powers member loans and projects.", icon: "💰" },
  { title: "Community Development", description: "Support water, sanitation, and local infrastructure work.", icon: "🤝" },
];

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copied`);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy");
        }
      }}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
      {copied ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
    </button>
  );
}

function DonatePage() {
  const { data } = useQuery({ queryKey: ["public-site-settings"], queryFn: () => getPublicSiteSettings() });
  const s = data?.settings;
  const paybill = s?.mpesa_paybill ?? "522533";
  const account = s?.mpesa_account ?? "8003761";
  const phone = s?.contact_phone ?? "0727 343 713";
  const socials = (s?.socials ?? {}) as { whatsapp?: string };
  const waNumber = socials.whatsapp ?? "254727343713";

  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <Heart className="h-10 w-10" />
            <h1 className="mt-4 max-w-2xl text-4xl font-bold md:text-5xl">Donate & Support Our Work</h1>
            <p className="mt-4 max-w-2xl opacity-90">
              Every shilling helps fund connectivity, youth empowerment, and community development across Ulu.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Donate via KCB Paybill</h2>
            <p className="mt-2 text-muted-foreground">
              Use your M-Pesa or KCB app. Any amount is welcome — Ksh 100, 500, 1,000 or more.
            </p>
            <div className="mt-6 space-y-3">
              <CopyValue label="Paybill Number" value={paybill} />
              <CopyValue label="Account Number" value={account} />
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <p className="flex items-center gap-2 text-sm font-semibold"><Smartphone className="h-4 w-4 text-primary" /> How to pay via M-Pesa</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Go to M-Pesa → Lipa na M-Pesa → Paybill</li>
                <li>Business no: <span className="font-semibold text-foreground">{paybill}</span></li>
                <li>Account no: <span className="font-semibold text-foreground">{account}</span></li>
                <li>Enter the amount you want to donate</li>
                <li>Enter your M-Pesa PIN and confirm</li>
                <li>Keep the confirmation SMS for your records</li>
              </ol>
            </div>

            <div className="mt-6 rounded-2xl bg-muted p-6">
              <p className="text-sm font-semibold">After donating</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please share your transaction code so we can acknowledge and thank you personally.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hello, I have made a donation to The Ulu We Want SHG. Transaction code: ")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp us
                </a>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  Send a message <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-secondary">What your donation funds</h2>
            <p className="mt-2 text-muted-foreground">Choose any of these causes when sending your gift, or let us allocate where it is needed most.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {causes.map((c) => (
                <div key={c.title} className="rounded-2xl bg-card p-5 shadow-card">
                  <div className="text-3xl">{c.icon}</div>
                  <p className="mt-2 font-bold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-border p-6">
              <p className="font-semibold">Partner with us</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Are you a company, NGO, or government partner? We welcome long-term collaborations and project sponsorships.
              </p>
              <p className="mt-3 text-sm">
                📞 {phone} · ✉️ {s?.contact_email ?? "maxmedia017@gmail.com"}
              </p>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
