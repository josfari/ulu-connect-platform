import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { submitRegistration } from "@/lib/public.functions";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Become a Member — The Ulu We Want SHG" },
      { name: "description", content: "Register to join The Ulu We Want Self-Help Group. Complete the form, upload your passport photo, and pay the Ksh 300 registration fee." },
      { property: "og:title", content: "Join The Ulu We Want SHG" },
      { property: "og:description", content: "Register, pay Ksh 300, and become part of our community." },
    ],
  }),
  component: JoinPage,
});

const categories = [
  "Ordinary Member",
  "Youth Member",
  "Women Member",
  "Volunteer",
  "Executive",
] as const;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

async function compressImage(file: File, maxWidth = 1024, quality = 0.82): Promise<string> {
  if (file.size <= 400_000) return fileToDataUrl(file);
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Could not read image"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

interface FormState {
  full_name: string;
  date_of_birth: string;
  gender: string;
  national_id: string;
  phone: string;
  email: string;
  county: string;
  sub_county: string;
  ward: string;
  physical_location: string;
  occupation: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  emergency_contact: string;
  membership_category: string;
  reason_for_joining: string;
  agree_terms: boolean;
  passport_photo: string;
  id_front: string;
  id_back: string;
}

const initialState: FormState = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  national_id: "",
  phone: "",
  email: "",
  county: "Makueni",
  sub_county: "",
  ward: "",
  physical_location: "",
  occupation: "",
  next_of_kin_name: "",
  next_of_kin_phone: "",
  emergency_contact: "",
  membership_category: "Ordinary Member",
  reason_for_joining: "",
  agree_terms: false,
  passport_photo: "",
  id_front: "",
  id_back: "",
};

function JoinPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const submit = useServerFn(submitRegistration);
  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          ...form,
          gender: form.gender as "male" | "female" | "other",
          agree_terms: true,
        },
      }),
    onSuccess: (res) => {
      if (res.ok && res.memberId) {
        toast.success("Application submitted! Now confirm your payment.");
        navigate({ to: "/join/payment", search: { m: res.memberId } });
      } else {
        toast.error(res.error ?? "Could not submit your application.");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong."),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((s) => ({ ...s, [k]: v }));

  const handleImage = async (
    e: ChangeEvent<HTMLInputElement>,
    field: "passport_photo" | "id_front" | "id_back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8_000_000) {
      toast.error("Image is too large (max 8MB).");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      set(field, dataUrl);
    } catch {
      toast.error("Could not read the image.");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree_terms) {
      toast.error("Please agree to the terms.");
      return;
    }
    if (!form.gender) {
      toast.error("Please select your gender.");
      return;
    }
    mutation.mutate();
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-secondary md:text-4xl">Become a Member</h1>
          <p className="mt-3 text-muted-foreground">
            Join The Ulu We Want SHG. Complete this form, upload your passport photo, and pay the
            <strong className="text-foreground"> Ksh 300 </strong> registration fee.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <form onSubmit={onSubmit} className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
          {/* Personal */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-secondary">Personal details</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" required maxLength={200} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dob">Date of birth *</Label>
                <Input id="dob" type="date" required value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nid">National ID *</Label>
                <Input id="nid" required maxLength={20} value={form.national_id} onChange={(e) => set("national_id", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (07… or +254…) *</Label>
                <Input id="phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="occ">Occupation</Label>
                <Input id="occ" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              </div>
              <div>
                <Label>Membership category *</Label>
                <Select value={form.membership_category} onValueChange={(v) => set("membership_category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Location */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-secondary">Location</legend>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="county">County *</Label>
                <Input id="county" required value={form.county} onChange={(e) => set("county", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sc">Sub-county *</Label>
                <Input id="sc" required value={form.sub_county} onChange={(e) => set("sub_county", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ward">Ward / village *</Label>
                <Input id="ward" required value={form.ward} onChange={(e) => set("ward", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="loc">Physical location</Label>
              <Input id="loc" placeholder="e.g. Near Ulu Market" value={form.physical_location} onChange={(e) => set("physical_location", e.target.value)} />
            </div>
          </fieldset>

          {/* Next of kin */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-secondary">Next of kin & emergency</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nok">Next of kin name *</Label>
                <Input id="nok" required value={form.next_of_kin_name} onChange={(e) => set("next_of_kin_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nokp">Next of kin phone *</Label>
                <Input id="nokp" required value={form.next_of_kin_phone} onChange={(e) => set("next_of_kin_phone", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="emerg">Emergency contact (name & phone)</Label>
                <Input id="emerg" value={form.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* Uploads */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-secondary">Uploads</legend>
            <div className="grid gap-4 md:grid-cols-3">
              <UploadBox
                label="Passport photo (optional)"
                value={form.passport_photo}
                inputRef={photoInputRef}
                onChange={(e) => handleImage(e, "passport_photo")}
                onClear={() => set("passport_photo", "")}
              />
              <UploadBox
                label="ID front (optional)"
                value={form.id_front}
                inputRef={idFrontRef}
                onChange={(e) => handleImage(e, "id_front")}
                onClear={() => set("id_front", "")}
              />
              <UploadBox
                label="ID back (optional)"
                value={form.id_back}
                inputRef={idBackRef}
                onChange={(e) => handleImage(e, "id_back")}
                onClear={() => set("id_back", "")}
              />
            </div>
          </fieldset>

          {/* Reason + terms */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-secondary">Why you're joining</legend>
            <Textarea
              rows={4}
              maxLength={1000}
              placeholder="Briefly tell us why you want to join."
              value={form.reason_for_joining}
              onChange={(e) => set("reason_for_joining", e.target.value)}
            />
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <Checkbox
                checked={form.agree_terms}
                onCheckedChange={(c) => set("agree_terms", c === true)}
                aria-label="Agree to terms"
              />
              <span>
                I agree to abide by The Ulu We Want SHG constitution and the terms of membership, and I confirm the
                information above is correct.
              </span>
            </label>
          </fieldset>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Submit application"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}

function UploadBox({
  label, value, inputRef, onChange, onClear,
}: {
  label: string;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className="mt-1 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-primary"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-xs text-muted-foreground">
            <Upload className="mx-auto mb-1 h-5 w-5" /> Click to upload
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      {value && (
        <button type="button" className="mt-1 text-xs text-destructive hover:underline" onClick={onClear}>
          Remove
        </button>
      )}
      {value && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="h-3 w-3" /> ready
        </p>
      )}
    </div>
  );
}
