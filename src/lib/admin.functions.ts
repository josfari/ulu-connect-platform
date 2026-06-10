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
