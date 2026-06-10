import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function send(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Método não permitido." });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return send(res, 500, {
      error: "Variáveis da Vercel não configuradas. Cadastre SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return send(res, 401, { error: "Sessão não enviada. Saia e entre novamente na plataforma." });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const agencyUser = userData?.user;

  if (userError || !agencyUser) {
    return send(res, 401, { error: "Sessão inválida. Saia e entre novamente na plataforma." });
  }

  const { data: agencyProfile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", agencyUser.id)
    .single();

  if (profileError || agencyProfile?.role !== "agencia") {
    return send(res, 403, { error: "Apenas a agência pode cadastrar clientes com acesso." });
  }

  const body = req.body || {};
  const client = body.client || {};
  const name = cleanText(client.name);
  const email = cleanText(client.email)?.toLowerCase() || null;
  const createLogin = body.create_login === true;
  const password = cleanText(body.password);

  if (!name) {
    return send(res, 400, { error: "Informe o nome do cliente." });
  }

  const clientType = client.client_type === "aleatorio" ? "aleatorio" : "fixo";

  if (createLogin && !email) {
    return send(res, 400, { error: "Para criar acesso, informe o e-mail do cliente." });
  }

  if (createLogin && (!password || password.length < 6)) {
    return send(res, 400, { error: "A senha provisória precisa ter pelo menos 6 caracteres." });
  }

  const clientRow = {
    name,
    client_type: clientType,
    phone: cleanText(client.phone),
    email,
    instagram: cleanText(client.instagram),
    company: cleanText(client.company),
    status: cleanText(client.status) || "ativo",
    notes: cleanText(client.notes),
  };

  const { data: savedClient, error: clientError } = await admin
    .from("clients")
    .upsert(clientRow, { onConflict: "name" })
    .select("*")
    .single();

  if (clientError) {
    return send(res, 400, { error: "Não consegui salvar o cliente: " + clientError.message });
  }

  let createdUser = null;

  if (createLogin) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "cliente",
        client_name: name,
      },
    });

    if (createError) {
      return send(res, 400, {
        error: "Cliente salvo, mas não consegui criar o acesso: " + createError.message,
      });
    }

    createdUser = created?.user || null;

    if (createdUser?.id) {
      const { error: profileSaveError } = await admin
        .from("profiles")
        .upsert({
          id: createdUser.id,
          email,
          role: "cliente",
          client_name: name,
        }, { onConflict: "id" });

      if (profileSaveError) {
        return send(res, 400, {
          error: "Acesso criado, mas não consegui vincular o perfil do cliente: " + profileSaveError.message,
        });
      }
    }
  }

  return send(res, 200, {
    ok: true,
    client: savedClient,
    user_created: Boolean(createdUser),
    email,
  });
}

