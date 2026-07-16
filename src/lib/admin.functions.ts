import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: { rpc: Function }, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profilesRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, full_name, created_at").order("created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.error || rolesRes.error) {
      console.error("listUsers", profilesRes.error ?? rolesRes.error);
      return { users: [], error: "Could not load users" as string | null };
    }
    const users = (profilesRes.data ?? []).map((p) => ({
      ...p,
      roles: (rolesRes.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
    return { users, error: null as string | null };
  });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["super_admin", "admin", "editor"]),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      return { ok: false, error: "You cannot change your own role." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const del = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (del.error) return { ok: false, error: "Could not update role." };
    const ins = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (ins.error) return { ok: false, error: "Could not update role." };
    return { ok: true, error: null };
  });

export const removeUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      return { ok: false, error: "You cannot remove your own access." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (error) return { ok: false, error: "Could not remove access." };
    return { ok: true, error: null };
  });

// ---------- Members admin ----------

async function assertStaff(supabase: { rpc: Function }, userId: string) {
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error || !data) throw new Error("Forbidden: staff access required");
}

export const listAdminMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: members, error } = await supabaseAdmin
      .from("members")
      .select("id, full_name, phone, email, national_id, membership_category, status, photo_url, membership_number, date_joined, approved_at, created_at")
      .order("created_at", { ascending: false });
    if (error) return { members: [], error: "Could not load members" };

    const memberIds = (members ?? []).map((m) => m.id);
    const paymentsRes = memberIds.length
      ? await supabaseAdmin
          .from("member_payments")
          .select("member_id, amount, mpesa_code, paid_on, verified")
          .in("member_id", memberIds)
      : { data: [], error: null };

    const totals = new Map<string, number>();
    for (const p of paymentsRes.data ?? []) {
      totals.set(p.member_id, (totals.get(p.member_id) ?? 0) + Number(p.amount ?? 0));
    }

    // Sign photo URLs (private "images" bucket needs signed URLs to display)
    const enriched = await Promise.all(
      (members ?? []).map(async (m) => {
        let photo_display_url: string | null = null;
        if (m.photo_url) {
          if (m.photo_url.startsWith("http")) {
            photo_display_url = m.photo_url;
          } else {
            // New uploads live in the "images" bucket; legacy uploads in "media"
            const bucket = m.photo_url.startsWith("members/") ? "media" : "images";
            const signed = await supabaseAdmin.storage
              .from(bucket)
              .createSignedUrl(m.photo_url, 60 * 60);
            photo_display_url = signed.data?.signedUrl ?? null;
          }
        }
        return {
          ...m,
          amount_paid: totals.get(m.id) ?? 0,
          photo_display_url,
        };
      })
    );

    return { members: enriched, error: null as string | null };
  });

export const approveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Uses the SECURITY DEFINER RPC which checks auth.uid() is admin and amount_paid >= 300
    const { data: result, error } = await context.supabase.rpc("approve_member", {
      _member_id: data.memberId,
    });
    if (error) {
      return { ok: false as const, error: error.message, membership_number: null };
    }
    const row = Array.isArray(result) ? result[0] : result;
    return { ok: true as const, error: null, membership_number: row?.membership_number ?? null };
  });

export const rejectMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("members")
      .update({ status: "inactive" })
      .eq("id", data.memberId);
    if (error) return { ok: false, error: "Could not reject member." };
    return { ok: true, error: null };
  });

export const getMemberPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payments, error } = await supabaseAdmin
      .from("member_payments")
      .select("id, amount, mpesa_code, payer_phone, paid_on, verified, created_at")
      .eq("member_id", data.memberId)
      .order("paid_on", { ascending: false });
    if (error) return { payments: [], error: "Could not load payments" };
    return { payments: payments ?? [], error: null as string | null };
  });

