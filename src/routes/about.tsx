import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Eye, HeartHandshake, ShieldCheck, Users, Lightbulb, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import aboutImage from "@/assets/about-community.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — The Ulu We Want SHG" },
      { name: "description", content: "Learn about The Ulu We Want Self-Help Group — our mission, vision, values, and story of community-driven change in Ulu, Kenya." },
      { property: "og:title", content: "About Us — The Ulu We Want SHG" },
      { property: "og:description", content: "Our mission, vision, values, and story of community-driven change in Ulu, Kenya." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: ShieldCheck, title: "Transparency", text: "Open records, honest reporting, and accountable leadership in everything we do." },
  { icon: HeartHandshake, title: "Unity", text: "We move together — every member's voice counts in our decisions." },
  { icon: Users, title: "Community First", text: "Our projects exist to serve the people of Ulu and keep value within our community." },
  { icon: Lightbulb, title: "Innovation", text: "We embrace technology — from satellite internet to digital finance — to leapfrog barriers." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-80">About Us</p>
            <h1 className="max-w-2xl text-4xl font-bold md:text-5xl">A community building its own future.</h1>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2">
          <img
            src={aboutImage}
            alt="Community members of The Ulu We Want SHG working together"
            className="rounded-2xl shadow-card"
            width={1024}
            height={768}
            loading="lazy"
          />
          <div>
            <h2 className="text-3xl font-bold text-secondary">Our Story</h2>
            <p className="mt-4 text-muted-foreground">
              The Ulu We Want Self-Help Group was founded by residents of Ulu, Makueni County, who believed that
              lasting change begins from within the community. What started as a small table-banking circle has
              grown into a registered self-help group running technology, income-generation, and youth empowerment
              projects.
            </p>
            <p className="mt-4 text-muted-foreground">
              Today our members save together, lend to one another at fair rates, run community-owned enterprises
              like our PA system rental and Starlink internet hub, and reinvest every shilling of profit back into
              the Ulu we want to see.
            </p>
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
            <div className="rounded-2xl bg-card p-8 shadow-card">
              <Target className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-2xl font-bold text-secondary">Our Mission</h3>
              <p className="mt-3 text-muted-foreground">
                To empower the people of Ulu through collective savings, affordable credit, technology access, and
                community-owned enterprises that create opportunity for every member.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-8 shadow-card">
              <Eye className="h-8 w-8 text-accent" />
              <h3 className="mt-4 text-2xl font-bold text-secondary">Our Vision</h3>
              <p className="mt-3 text-muted-foreground">
                A thriving, connected, financially independent Ulu where young people find opportunity at home and
                the community drives its own development.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-secondary">Our Values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 text-center">
                <v.icon className="mx-auto h-7 w-7 text-primary" />
                <h3 className="mt-3 font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              Meet Our Members <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
