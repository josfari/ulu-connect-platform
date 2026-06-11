import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Phone, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitMemberPayment, getRegistrationStatus, getPublicSiteSettings } from "@/lib/public.functions";

const searchSchema = z.object({ m: z.string().uuid().optional() });

export const Route = createFileRoute("/join/payment")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Confirm Payment — The Ulu We Want SHG" },
      { name: "description", content: "Confirm your Ksh 300 M-Pesa registration payment for The Ulu We Want SHG." },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { m: memberId } = Route.useSearch();
  const fetchStatus = useServerFn(getRegistrationStatus);
  const fetchSettings = useServerFn(getPublicSiteSettings);
  const pay = useServerFn(submitMemberPayment);

  const statusQuery = useQuery({
    queryKey: ["reg-status", memberId],
    queryFn: () => fetchStatus({ data: { member_id: memberId! } }),
    enabled: !!memberId,
  });

  const settingsQuery = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetchSettings(),
  });

  const [mpesa, setMpesa] = useState("");
  const [phone, setPhone] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));

  const mutation = useMutation({
    mutationFn: () =>
      pay({
        data: {
          member_id: memberId!,
          mpesa_code: mpesa,
          payer_phone: phone,
          paid_on: paidOn,
          amount: settingsQuery.data?.settings?.registration_fee ?? 300,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Payment recorded. Admin will verify and approve shortly.");
        statusQuery.refetch();
      } else {
        toast.error(res.error ?? "Could not record payment.");
      }
    },
  });

  if (!memberId) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">No application found</h1>
          <p className="mt-2 text-muted-foreground">Please start by completing the membership form.</p>
          <Button asChild className="mt-6"><Link to="/join">Start registration</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const settings = settingsQuery.data?.settings;
  const fee = settings?.registration_fee ?? 300;
  const paybill = settings?.mpesa_paybill;
  const till = settings?.mpesa_till;
  const account = settings?.mpesa_account ?? "Member full name";
  const fallbackPhone = settings?.contact_phone;

  const member = statusQuery.data?.member;
  const already = member?.status && member.status !== "pending_payment";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-secondary">Confirm your payment</h1>
        <p className="mt-2 text-muted-foreground">
          Application reference: <span className="font-mono text-foreground">{memberId.slice(0, 8)}</span>
          {member?.full_name && <> — {member.full_name}</>}
        </p>

        {already && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
            <p className="inline-flex items-center gap-2 font-semibold text-primary">
              <CheckCircle2 className="h-5 w-5" /> Payment already submitted
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Current status: <strong className="text-foreground">{member?.status?.replace(/_/g, " ")}</strong>.
              {member?.membership_number && <> Your membership number is <strong>{member.membership_number}</strong>.</>}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold text-secondary">Payment instructions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registration fee: <span className="text-2xl font-bold text-primary">Ksh {fee}</span>
            </p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2"><Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Open M-Pesa on your phone.</li>
              {paybill ? (
                <>
                  <li>Choose <strong>Lipa na M-Pesa → Pay Bill</strong>.</li>
                  <li>Business number: <strong className="font-mono">{paybill}</strong></li>
                  <li>Account number: <strong className="font-mono">{account}</strong></li>
                </>
              ) : till ? (
                <>
                  <li>Choose <strong>Lipa na M-Pesa → Buy Goods</strong>.</li>
                  <li>Till number: <strong className="font-mono">{till}</strong></li>
                </>
              ) : (
                <li className="rounded-md bg-accent/10 p-3 text-accent-foreground">
                  Paybill/till is not yet configured.{" "}
                  {fallbackPhone ? <>Send Ksh {fee} via M-Pesa to <strong>{fallbackPhone}</strong>.</> : "Please contact the office."}
                </li>
              )}
              <li>Enter <strong>Ksh {fee}</strong> as the amount.</li>
              <li>Complete the payment, then enter the M-Pesa confirmation code below.</li>
            </ol>
            {fallbackPhone && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> Need help? Call {fallbackPhone}
              </p>
            )}
          </div>

          <form
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          >
            <h2 className="text-lg font-bold text-secondary">Submit payment confirmation</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="mp">M-Pesa transaction code *</Label>
                <Input id="mp" required maxLength={20} value={mpesa} onChange={(e) => setMpesa(e.target.value.toUpperCase())} placeholder="e.g. SHJ2X9K5L1" />
              </div>
              <div>
                <Label htmlFor="ph">Phone you paid with *</Label>
                <Input id="ph" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
              </div>
              <div>
                <Label htmlFor="dt">Date of payment *</Label>
                <Input id="dt" type="date" required value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Confirm payment"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Admin will verify your payment within 24 hours. You'll be notified and assigned a membership number.
              </p>
            </div>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
