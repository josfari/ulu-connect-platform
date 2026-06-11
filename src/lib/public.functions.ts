import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicMembers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, full_name, role, membership_category, status, photo_url, bio, date_joined")
    .in("status", ["active", "executive", "volunteer"])
    .order("status", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) {
    console.error("getPublicMembers", error);
    return { members: [], error: "Could not load members" as string | null };
  }
  return { members: data ?? [], error: null as string | null };
});

const contactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(255),
  subject: z.string().max(255).optional(),
  message: z.string().min(5).max(5000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject ?? null,
      message: data.message,
    });
    if (error) {
      console.error("submitContactMessage", error);
      return { ok: false, error: "Could not send your message. Please try again." };
    }
    return { ok: true, error: null };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email: data.email.toLowerCase() }, { onConflict: "email" });
    if (error) {
      console.error("subscribeNewsletter", error);
      return { ok: false, error: "Could not subscribe. Please try again." };
    }
    return { ok: true, error: null };
  });

// ---------- Membership registration ----------

const phoneRegex = /^(?:\+?254|0)?7\d{8}$/;

const registrationSchema = z.object({
  full_name: z.string().trim().min(2).max(200),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]),
  national_id: z.string().trim().min(5).max(20),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid Kenyan phone number"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  county: z.string().trim().min(2).max(100),
  sub_county: z.string().trim().min(2).max(100),
  ward: z.string().trim().min(2).max(100),
  physical_location: z.string().trim().max(255).optional().or(z.literal("")),
  occupation: z.string().trim().max(100).optional().or(z.literal("")),
  next_of_kin_name: z.string().trim().min(2).max(200),
  next_of_kin_phone: z.string().trim().regex(phoneRegex, "Enter a valid Kenyan phone number"),
  emergency_contact: z.string().trim().max(200).optional().or(z.literal("")),
  membership_category: z.string().trim().min(2).max(100),
  reason_for_joining: z.string().trim().max(1000).optional().or(z.literal("")),
  agree_terms: z.literal(true),
  // base64 data URLs (jpeg/png), capped
  passport_photo: z.string().startsWith("data:image/").max(2_500_000),
  id_front: z.string().startsWith("data:image/").max(2_500_000).optional().or(z.literal("")),
  id_back: z.string().startsWith("data:image/").max(2_500_000).optional().or(z.literal("")),
});

function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  return { buffer: Buffer.from(match[2], "base64"), contentType, ext };
}

async function uploadDataUrl(
  storage: { from: (bucket: string) => { upload: (path: string, body: Buffer, opts: { contentType: string; upsert?: boolean }) => Promise<{ error: { message: string } | null }> } },
  folder: string,
  dataUrl: string,
): Promise<string | null> {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return null;
  const path = `${folder}/${crypto.randomUUID()}.${decoded.ext}`;
  const { error } = await storage.from("media").upload(path, decoded.buffer, {
    contentType: decoded.contentType,
    upsert: false,
  });
  if (error) {
    console.error("uploadDataUrl", error);
    return null;
  }
  return path;
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Duplicate guard
    const { data: dup } = await supabaseAdmin
      .from("members")
      .select("id")
      .or(`national_id.eq.${data.national_id},phone.eq.${data.phone}`)
      .maybeSingle();
    if (dup) {
      return { ok: false as const, error: "A member with this ID or phone number is already registered.", memberId: null };
    }

    const photoPath = await uploadDataUrl(supabaseAdmin.storage, "members/photos", data.passport_photo);
    if (!photoPath) return { ok: false as const, error: "Could not upload passport photo.", memberId: null };
    const idFrontPath = data.id_front ? await uploadDataUrl(supabaseAdmin.storage, "members/ids", data.id_front) : null;
    const idBackPath = data.id_back ? await uploadDataUrl(supabaseAdmin.storage, "members/ids", data.id_back) : null;

    const { data: inserted, error } = await supabaseAdmin
      .from("members")
      .insert({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        national_id: data.national_id,
        phone: data.phone,
        email: data.email || null,
        county: data.county,
        sub_county: data.sub_county,
        ward: data.ward,
        physical_location: data.physical_location || null,
        occupation: data.occupation || null,
        next_of_kin_name: data.next_of_kin_name,
        next_of_kin_phone: data.next_of_kin_phone,
        emergency_contact: data.emergency_contact || null,
        membership_category: data.membership_category,
        reason_for_joining: data.reason_for_joining || null,
        photo_url: photoPath,
        id_front_path: idFrontPath,
        id_back_path: idBackPath,
        status: "pending_payment",
        date_joined: new Date().toISOString().slice(0, 10),
        show_contact: false,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("submitRegistration", error);
      return { ok: false as const, error: "Could not submit your application. Please try again.", memberId: null };
    }
    return { ok: true as const, error: null, memberId: inserted.id };
  });

const paymentSchema = z.object({
  member_id: z.string().uuid(),
  mpesa_code: z.string().trim().min(6).max(20),
  payer_phone: z.string().trim().regex(phoneRegex, "Enter a valid Kenyan phone number"),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(1).max(100000).default(300),
});

export const submitMemberPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => paymentSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ensure the member exists and is still pending
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, status")
      .eq("id", data.member_id)
      .maybeSingle();
    if (!member) return { ok: false as const, error: "Application not found." };

    const { error: insErr } = await supabaseAdmin.from("member_payments").insert({
      member_id: data.member_id,
      amount: data.amount,
      mpesa_code: data.mpesa_code.toUpperCase(),
      payer_phone: data.payer_phone,
      paid_on: data.paid_on,
      verified: false,
    });
    if (insErr) {
      console.error("submitMemberPayment", insErr);
      return { ok: false as const, error: "Could not record your payment. Please try again." };
    }

    await supabaseAdmin
      .from("members")
      .update({ status: "payment_submitted" })
      .eq("id", data.member_id);

    return { ok: true as const, error: null };
  });

export const getRegistrationStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ member_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin
      .from("members")
      .select("id, full_name, status, membership_number")
      .eq("id", data.member_id)
      .maybeSingle();
    if (!m) return { member: null };
    return { member: m };
  });

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("org_name, contact_phone, contact_email, location, mpesa_paybill, mpesa_account, mpesa_till, registration_fee, hero_title, hero_subtitle")
    .eq("id", "main")
    .maybeSingle();
  return { settings: data ?? null };
});
