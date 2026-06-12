import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users, FolderKanban, Sparkles, Banknote, Heart, HandHeart, Building2, Quote } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getImpactStats, getSuccessStories } from "@/lib/public.functions";
import heroImage from "@/assets/hero-community.jpg";
import starlinkImage from "@/assets/project-starlink.jpg";
import paSystemImage from "@/assets/project-pa-system.jpg";
import tableBankingImage from "@/assets/project-table-banking.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Ulu We Want SHG — Empowering Communities, Transforming Lives" },
      { name: "description", content: "A Kenyan community self-help group driving youth empowerment, financial inclusion, and technology access in Ulu through table banking, connectivity, and community projects." },
      { property: "og:title", content: "The Ulu We Want SHG" },
      { property: "og:description", content: "Empowering Communities, Transforming Lives — community projects, table banking, and youth opportunity in Ulu, Kenya." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const featuredProjects = [
  { title: "Starlink Internet Connectivity", image: starlinkImage, category: "Technology Access", description: "High-speed satellite internet bringing digital learning and online work opportunities to Ulu youth." },
  { title: "PA System Rental", image: paSystemImage, category: "Income Generation", description: "A community-owned sound system serving local events while creating jobs and group revenue." },
  { title: "Table Banking Initiative", image: tableBankingImage, category: "Financial Inclusion", description: "Member savings and affordable loans keeping money circulating within our own community." },
];

const partners = [
  { name: "Makueni County Government", category: "Government" },
  { name: "KCB Bank", category: "Financial Partner" },
  { name: "Starlink Kenya", category: "Technology Partner" },
  { name: "Local NGO Network", category: "Community Partner" },
];

function HomePage() {
  const stats = useQuery({ queryKey: ["impact-stats"], queryFn: () => getImpactStats() });
  const stories = useQuery({ queryKey: ["success-stories"], queryFn: () => getSuccessStories() });

  const s = stats.data;
  const impactCards = [
    { icon: Users, value: s ? `${s.members}+` : "—", label: "Members empowered" },
    { icon: Sparkles, value: s ? `${s.youth}+` : "—", label: "Youth empowered" },
    { icon: FolderKanban, value: s?.activeProjects ?? "—", label: "Active projects" },
    { icon: Banknote, value: s ? `KSh ${s.loansIssued.toLocaleString()}` : "—", label: "Loans issued" },
    { icon: Banknote, value: s ? `KSh ${s.totalSaved.toLocaleString()}` : "—", label: "Saved via table banking" },
    { icon: HandHeart, value: s ? `${s.projects}` : "—", label: "Communities reached" },
  ];

  return (
    <SiteLayout>
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <img src={heroImage} alt="Members of The Ulu We Want SHG meeting" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
            <p className="mb-4 inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1 text-sm font-medium">The Ulu We Want Self-Help Group · Kenya</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Empowering Communities, Transforming Lives.</h1>
            <p className="mt-6 max-w-2xl text-lg opacity-90">
              We are a registered community self-help group in Ulu, Kenya — uniting members to build financial strength, open technology access, and create real opportunity for our youth.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/join" className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-7 py-3 font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105">
                Join Us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/donate" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-7 py-3 font-semibold transition-colors hover:bg-primary-foreground/10">
                <Heart className="h-4 w-4" /> Donate
              </Link>
              <Link to="/projects" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-7 py-3 font-semibold transition-colors hover:bg-primary-foreground/10">
                View Projects
              </Link>
            </div>
          </div>
        </section>

        {/* Impact stats */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-secondary">Our Impact, In Numbers</h2>
            <p className="mt-2 text-muted-foreground">Live statistics from our community work.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {impactCards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-card p-5 text-center shadow-card">
                <c.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-2xl font-bold text-secondary">{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured projects */}
        <section className="bg-muted py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-secondary">Our Projects</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">Practical initiatives delivering technology, income, and financial inclusion for the Ulu community.</p>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {featuredProjects.map((p) => (
                <article key={p.title} className="overflow-hidden rounded-2xl bg-card shadow-card transition-transform hover:-translate-y-1">
                  <img src={p.image} alt={p.title} loading="lazy" width={1024} height={768} className="h-48 w-full object-cover" />
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{p.category}</p>
                    <h3 className="mt-2 text-xl font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link to="/projects" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                View all projects <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-secondary">Success Stories</h2>
            <p className="mt-2 text-muted-foreground">Real stories from members, youth, and the communities we serve.</p>
          </div>
          {stories.isLoading ? (
            <p className="text-muted-foreground">Loading stories…</p>
          ) : !stories.data?.stories.length ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <Quote className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Stories are being prepared. Check back soon.</p>
              <Link to="/media" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Visit our Media Desk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {stories.data.stories.map((st) => (
                <article key={st.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
                  {st.cover_image_url && <img src={st.cover_image_url} alt={st.title} className="h-44 w-full object-cover" />}
                  <div className="p-6">
                    <h3 className="text-lg font-bold">{st.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{st.excerpt}</p>
                    <Link to="/media" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Read more <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Partners */}
        <section className="bg-muted py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-secondary">Partners & Sponsors</h2>
              <p className="mt-2 text-muted-foreground">Organizations supporting our work in Ulu.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((p) => (
                <div key={p.name} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center shadow-card">
                  <Building2 className="h-8 w-8 text-primary" />
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Interested in partnering? <Link to="/contact" className="font-semibold text-primary hover:underline">Get in touch →</Link>
            </p>
          </div>
        </section>

        {/* Donate CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground md:p-14">
            <Heart className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Support our work</h2>
            <p className="mx-auto mt-3 max-w-2xl opacity-90">
              Your contribution helps fund Starlink connectivity, youth empowerment, and community development across Ulu.
            </p>
            <Link to="/donate" className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105">
              Donate Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Join CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 text-center">
          <h2 className="text-3xl font-bold text-secondary md:text-4xl">Be part of the Ulu we want.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join a community that saves together, builds together, and grows together.</p>
          <Link to="/join" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105">
            Become a Member <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </SiteLayout>
  );
}
