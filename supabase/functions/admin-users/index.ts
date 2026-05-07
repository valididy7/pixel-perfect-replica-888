import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch {}
  const action = body.action as string;

  try {
    if (action === "list") {
      const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 200 });
      if (error) return json({ error: error.message }, 400);
      const ids = users.users.map((u) => u.id);
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        admin.from("profiles").select("user_id, username, display_name, last_seen_at").in("user_id", ids),
        admin.from("user_roles").select("user_id, role").in("user_id", ids),
      ]);
      const pmap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const rmap = new Map<string, string[]>();
      (roles || []).forEach((r: any) => {
        const arr = rmap.get(r.user_id) || [];
        arr.push(r.role);
        rmap.set(r.user_id, arr);
      });
      const list = users.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        username: pmap.get(u.id)?.username ?? null,
        display_name: pmap.get(u.id)?.display_name ?? null,
        last_seen_at: pmap.get(u.id)?.last_seen_at ?? null,
        roles: rmap.get(u.id) || [],
      }));
      return json({ users: list });
    }

    if (action === "create") {
      const username = (body.username || "").toString().trim();
      const password = (body.password || "").toString();
      // Todo usuário criado pelo painel é "user". Admin só é criado por mim
      // (manualmente no banco / fora desse fluxo).
      const role = "user";
      if (!username || !password) return json({ error: "username e senha obrigatórios" }, 400);
      if (password.length < 6) return json({ error: "senha precisa ter 6+ chars" }, 400);

      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "_")}@user.local`;

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, display_name: username },
      });
      if (error || !created.user) return json({ error: error?.message || "erro ao criar" }, 400);

      // Garante username no profile (trigger pode ter rodado antes do meta)
      await admin.from("profiles").upsert(
        { user_id: created.user.id, username, display_name: username },
        { onConflict: "user_id" },
      );
      await admin.from("user_roles").insert({ user_id: created.user.id, role });
      return json({ ok: true, id: created.user.id });
    }

    if (action === "delete") {
      const id = (body.id || "").toString();
      if (!id) return json({ error: "id obrigatório" }, 400);
      if (id === userData.user.id) return json({ error: "não pode deletar a si mesmo" }, 400);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_role") {
      const id = (body.id || "").toString();
      const role = body.role === "admin" ? "admin" : "user";
      if (!id) return json({ error: "id obrigatório" }, 400);
      await admin.from("user_roles").delete().eq("user_id", id);
      await admin.from("user_roles").insert({ user_id: id, role });
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const id = (body.id || "").toString();
      const password = (body.password || "").toString();
      if (!id || password.length < 6) return json({ error: "dados inválidos" }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "ação inválida" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || "erro" }, 500);
  }
});