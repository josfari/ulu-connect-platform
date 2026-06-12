import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Mail, MapPin, Phone, MessageCircle, Facebook } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicSiteSettings, submitContactMessage, subscribeNewsletter } from "@/lib/public.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — The Ulu We Want SHG" },
      { name: "description", content: "Get in touch with The Ulu We Want Self-Help Group — partnerships, membership, volunteering, and general enquiries." },
      { property: "og:title", content: "Contact Us — The Ulu We Want SHG" },
      { property: "og:description", content: "Reach out about partnerships, membership, or volunteering." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const sendMessage = useServerFn(submitContactMessage);
  const subscribe = useServerFn(subscribeNewsletter);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { data } = useQuery({ queryKey: ["public-site-settings"], queryFn: () => getPublicSiteSettings() });
  const s = data?.settings;
  const phone = s?.contact_phone ?? "0727 343 713";
  const email = s?.contact_email ?? "maxmedia017@gmail.com";
  const location = s?.location ?? "Ulu, Makueni County, Kenya";
  const socials = (s?.socials ?? {}) as { facebook?: string; whatsapp?: string };
  const waNumber = socials.whatsapp ?? "254727343713";
  const facebookUrl = socials.facebook ?? "https://facebook.com/TheUluWeWant";
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello, I'd like to know more about The Ulu We Want SHG.")}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

  const messageMutation = useMutation({
    mutationFn: () => sendMessage({ data: { name: form.name, email: form.email, subject: form.subject || undefined, message: form.message } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else toast.error(res.error ?? "Something went wrong.");
    },
    onError: () => toast.error("Could not send your message. Please check your details and try again."),
  });

  const newsletterMutation = useMutation({
    mutationFn: () => subscribe({ data: { email: newsletterEmail } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Subscribed! Karibu to our newsletter.");
        setNewsletterEmail("");
      } else toast.error(res.error ?? "Could not subscribe.");
    },
    onError: () => toast.error("Could not subscribe. Please enter a valid email."),
  });

  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-80">Contact</p>
            <h1 className="max-w-2xl text-4xl font-bold md:text-5xl">Let's build the Ulu we want — together.</h1>
            <p className="mt-4 max-w-2xl opacity-90">
              We welcome inquiries, partnerships, membership applications, and community support opportunities.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-secondary">Get in touch</h2>
            <p className="mt-3 text-muted-foreground">
              Whether you want to join, partner on a project, or volunteer — we'd love to hear from you.
            </p>
            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-primary" /> <span>{location}</span></li>
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-primary" /> <a href={`mailto:${email}`} className="hover:underline">{email}</a></li>
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-primary" /> <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:underline">{phone}</a></li>
              <li className="flex items-start gap-3"><MessageCircle className="mt-0.5 h-5 w-5 text-primary" /> <a href={waUrl} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp: {phone}</a></li>
              <li className="flex items-start gap-3"><Facebook className="mt-0.5 h-5 w-5 text-primary" /> <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:underline">The Ulu We Want</a></li>
            </ul>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Our location"
                src={mapSrc}
                width="100%"
                height="240"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-8 rounded-2xl bg-muted p-6">
              <h3 className="font-bold">Newsletter</h3>
              <p className="mt-1 text-sm text-muted-foreground">Monthly updates on projects and community impact.</p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => { e.preventDefault(); if (newsletterEmail) newsletterMutation.mutate(); }}
              >
                <Input type="email" required placeholder="you@example.com" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} />
                <Button type="submit" disabled={newsletterMutation.isPending}>
                  {newsletterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>

          <form
            className="rounded-2xl bg-card p-8 shadow-card lg:col-span-3"
            onSubmit={(e) => { e.preventDefault(); messageMutation.mutate(); }}
          >
            <h2 className="text-2xl font-bold text-secondary">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">Goes directly to our inbox — we usually reply within 1–2 days.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required minLength={5} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={messageMutation.isPending}>
              {messageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </form>
        </section>
      </main>
    </SiteLayout>
  );
}
