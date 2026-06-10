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
