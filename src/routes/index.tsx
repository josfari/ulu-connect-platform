import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Users, FolderKanban, Sparkles, Banknote } from "lucide-react";
import heroImage from "@/assets/hero-community.jpg";
import starlinkImage from "@/assets/project-starlink.jpg";
import paSystemImage from "@/assets/project-pa-system.jpg";
import tableBankingImage from "@/assets/project-table-banking.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Ulu We Want SHG — Empowering Communities, Transforming Lives" },
      {
        name: "description",
        content:
          "A Kenyan community self-help group driving youth empowerment, financial inclusion, and technology access in Ulu through table banking, connectivity, and community projects.",
      },
      { property: "og:title", content: "The Ulu We Want SHG" },
      {
        property: "og:description",
        content: "Empowering Communities, Transforming Lives — community projects, table banking, and youth opportunity in Ulu, Kenya.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const stats = [
  { icon: Users, value: "120+", label: "Members empowered" },
  { icon: FolderKanban, value: "4", label: "Projects launched" },
  { icon: Sparkles, value: "200+", label: "Youth reached" },
  { icon: Banknote, value: "KSh 480K", label: "Funds mobilized" },
];

const featuredProjects = [
  {
    title: "Starlink Internet Connectivity",
    image: starlinkImage,
    category: "Technology Access",
    description: "High-speed satellite internet bringing digital learning and online work opportunities to Ulu youth.",
  },
  {
    title: "PA System Rental",
    image: paSystemImage,
    category: "Income Generation",
    description: "A community-owned sound system serving local events while creating jobs and group revenue.",
  },
  {
    title: "Table Banking Initiative",
    image: tableBankingImage,
    category: "Financial Inclusion",
    description: "Member savings and affordable loans keeping money circulating within our own community.",
  },
];

function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <img
          src={heroImage}
          alt="Members of The Ulu We Want SHG meeting under acacia trees in Kenya"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
          <p className="mb-4 inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1 text-sm font-medium">
            The Ulu We Want Self-Help Group · Kenya
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Empowering Communities, Transforming Lives.
          </h1>
          <p className="mt-6 max-w-2xl text-lg opacity-90">
            We are a registered community self-help group in Ulu, Kenya — uniting members to build
            financial strength, open technology access, and create real opportunity for our youth.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-7 py-3 font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105"
            >
              Join Us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-7 py-3 font-semibold transition-colors hover:bg-primary-foreground/10"
            >
              View Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-6 text-center shadow-card">
              <s.icon className="mx-auto mb-3 h-7 w-7 text-primary" />
              <p className="text-3xl font-bold text-secondary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured projects */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-secondary">Our Projects</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Practical initiatives delivering technology, income, and financial inclusion for the Ulu community.
          </p>
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-secondary md:text-4xl">Be part of the Ulu we want.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join a community that saves together, builds together, and grows together.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
        >
          Become a Member <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
