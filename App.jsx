import { useState, useEffect } from "react";
import { supabase, configured } from "./supabase";

const INK = "#1C1D24";
const PAPER = "#F5F5F2";
const VIOLET = "#5246C9";
const VIOLET_SOFT = "#EDEBFB";
const ROSE = "#B05279";
const ROSE_SOFT = "#F8ECF1";
const GREEN = "#2E7D5B";
const GREEN_SOFT = "#E4F2EB";
const AMBER = "#9A6710";
const AMBER_SOFT = "#FBF1DC";
const RED = "#B3403C";
const GRAY_SOFT = "#ECECE8";

const PROJECT_STATUSES = ["Briefing", "Em produção", "Em edição", "Aguardando aprovação", "Concluído"];
const EVENT_STATUSES = ["Orçamento", "Confirmado", "Em planejamento", "Realizado"];
const CAPTURE_STATUSES = ["agendada", "captada", "em_edicao", "entregue", "arquivada"];
const CAPTURE_STATUS_LABELS = {
  agendada: "Agendada",
  captada: "Captada",
  em_edicao: "Em edição",
  entregue: "Entregue",
  arquivada: "Arquivada",
};
const CAPTURE_TYPE_LABELS = {
  foto: "Foto",
  video: "Vídeo",
  foto_video: "Foto + vídeo",
  drone: "Drone",
  reels: "Reels",
  evento: "Evento",
  outro: "Outro",
};
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const brl = (n) => "R$ " + Number(n || 0).toLocaleString("pt-BR");
const money = (n) => Number(n || 0);

function formatDate(date) {
  if (!date) return "Sem data";
  const parts = String(date).split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function captureStatusLabel(status) {
  return CAPTURE_STATUS_LABELS[status] || status || "Agendada";
}

function captureTypeLabel(type) {
  return CAPTURE_TYPE_LABELS[type] || type || "Foto + vídeo";
}

function clientTypeLabel(type) {
  return type === "aleatorio" ? "Aleatório" : "Fixo";
}

function normalizeProjectStatus(status) {
  return status === "Captação" ? "Briefing" : (status || "Briefing");
}

function statusColors(status) {
  if (["Concluído", "Realizado", "Fechado", "Entregue", "entregue"].includes(status)) return { bg: GREEN_SOFT, fg: GREEN };
  if (["Aguardando aprovação", "Orçamento", "Proposta enviada", "Agendada", "agendada"].includes(status)) return { bg: AMBER_SOFT, fg: AMBER };
  if (["Em edição", "Negociação", "Em planejamento", "Captada", "captada", "Em captação"].includes(status)) return { bg: VIOLET_SOFT, fg: VIOLET };
  if (["Briefing", "Captação", "Novo lead", "Arquivada", "arquivada"].includes(status)) return { bg: GRAY_SOFT, fg: "#55565E" };
  return { bg: ROSE_SOFT, fg: ROSE };
}

function Pill({ label }) {
  const c = statusColors(label);
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E4DF", borderRadius: 12, padding: 14, ...style }}>
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 12.5, color: "#9A9BA2", lineHeight: 1.5 }}>{children}</div>;
}

function DeadlineTag({ deadline }) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  let color = "#76777F";
  let label = "até " + deadline.split("-").reverse().slice(0, 2).join("/");
  if (diff < 0) { color = RED; label = "atrasado " + Math.abs(diff) + "d"; }
  else if (diff <= 3) { color = AMBER; label = diff === 0 ? "entrega hoje" : "faltam " + diff + "d"; }
  return <span style={{ fontSize: 10.5, fontWeight: 600, color }}>⏱ {label}</span>;
}

const fontTag = <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');`}</style>;
const shell = { fontFamily: "'Sora', system-ui, sans-serif", background: PAPER, minHeight: "100vh", color: INK };

function SetupScreen() {
  return (
    <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {fontTag}
      <Card style={{ maxWidth: 440 }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Falta um passo de configuração</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#55565E", margin: 0 }}>
          Abra o arquivo <b>src/supabase.js</b> e cole a URL do seu projeto e a chave
          "anon public" do Supabase. Depois publique novamente.
        </p>
      </Card>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) setErro("Não conseguimos entrar com esses dados. Confira o e-mail e a senha.");
    else onLogin();
  };

  const inputStyle = { border: "1px solid #D8D8D2", borderRadius: 8, padding: "10px 12px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {fontTag}
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 24 }}>sua<span style={{ color: VIOLET }}>agência</span></div>
          <div style={{ fontSize: 12, color: "#8B8C95" }}>portal de marketing, eventos e captações</div>
        </div>
        <Card style={{ padding: 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>E-mail</label>
          <input style={{ ...inputStyle, marginBottom: 14 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Senha</label>
          <input style={{ ...inputStyle, marginBottom: 16 }} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} placeholder="••••••••" />
          {erro && <div style={{ fontSize: 12.5, color: RED, marginBottom: 12 }}>{erro}</div>}
          <button onClick={entrar} disabled={carregando} style={{ width: "100%", background: INK, color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: carregando ? 0.7 : 1 }}>
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </Card>
        <p style={{ fontSize: 11.5, color: "#9A9BA2", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          Cada cliente acessa apenas os projetos, campanhas, eventos e captações liberados para ele.
        </p>
      </div>
    </div>
  );
}

export default function AgencyPlatform() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("visao");
  const [view, setView] = useState("agencia");
  const [previewClient, setPreviewClient] = useState("");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [expandedCapture, setExpandedCapture] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 720 : false);
  const [forms, setForms] = useState({
    proj: "", projClient: "", projDeadline: "", projValue: "", projVisible: true,
    camp: "", campClient: "", campVisible: true,
    ev: "", evClient: "", evDate: "", evType: "Casamento", evVisible: true,
    task: "",
    newClient: "", newClientType: "fixo", newClientPhone: "", newClientEmail: "", newClientInstagram: "", newClientCreateLogin: false, newClientPassword: "",
    capTitle: "", capClient: "", capType: "foto_video", capDate: "", capStart: "", capEnd: "", capLocation: "", capAddress: "", capResponsible: "", capTeam: "", capBriefing: "", capShotList: "", capEquipment: "", capDrive: "", capDelivery: "", capVisible: true, capNotes: "",
    capTask: "", capTaskVisible: false,
  });

  useEffect(() => {
    const f = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); setData(null); return; }
    (async () => {
      setLoadError("");
      const { data: prof, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (error) {
        setLoadError("Não consegui carregar o perfil do usuário.");
        setProfile({ role: "cliente", client_name: null });
        return;
      }
      const safeProfile = prof || { role: "cliente", client_name: null };
      setProfile(safeProfile);
      await fetchAll(safeProfile);
    })();
  }, [session]);

  const fetchAll = async (profileArg = profile) => {
    const agencyRole = profileArg?.role === "agencia";
    setLoadError("");

    const requests = [
      supabase.from("clients").select("*").order("name"),
      supabase.from("projects").select("*").order("id"),
      supabase.from("campaigns").select("*").order("id"),
      supabase.from("events").select("*").order("date"),
      supabase.from("captures").select("*").order("date", { ascending: true, nullsFirst: false }),
      supabase.from("capture_checklist").select("*").order("order_index"),
    ];

    if (agencyRole) requests.push(supabase.from("project_financials").select("*"));

    const [cl, pr, ca, ev, cap, capTasks, fin] = await Promise.all(requests);

    const importantError = [cl, pr, ca, ev, cap, capTasks, fin].filter(Boolean).find((r) => r.error);
    if (importantError) {
      console.error(importantError.error);
      setLoadError("Algo não carregou no banco. Confira se a migração foi aplicada e tente atualizar a página.");
    }

    const financials = {};
    (fin?.data || []).forEach((f) => { financials[f.project_id] = f; });

    const clients = (cl.data || []).map((c) => ({
      ...c,
      client_type: c.client_type || "fixo",
      status: c.status || "ativo",
    }));

    const projects = (pr.data || []).map((p) => ({
      ...p,
      status: normalizeProjectStatus(p.status),
      visible_to_client: p.visible_to_client !== false,
      value: agencyRole ? money(financials[p.id]?.value ?? p.value ?? 0) : 0,
    }));

    const campaigns = (ca.data || []).map((c) => ({ ...c, visible_to_client: c.visible_to_client !== false }));
    const events = (ev.data || []).map((e) => ({ ...e, visible_to_client: e.visible_to_client !== false, checklist: e.checklist || [] }));
    const tasks = capTasks.data || [];
    const captures = (cap.data || []).map((c) => ({
      ...c,
      visible_to_client: c.visible_to_client !== false,
      checklist: tasks.filter((t) => t.capture_id === c.id),
    }));

    setData({ clients, projects, campaigns, events, captures });
  };

  const run = async (promise, refresh = false) => {
    setSaving(true);
    try {
      const result = await promise;
      if (result?.error) throw result.error;
      if (refresh) await fetchAll(profile);
      return result;
    } catch (e) {
      console.error(e);
      alert("Não consegui salvar essa alteração. Vou recarregar os dados para evitar informação errada na tela.");
      await fetchAll(profile);
      return null;
    } finally {
      setSaving(false);
    }
  };

  if (!configured) return <SetupScreen />;
  if (!session) return <LoginScreen onLogin={() => {}} />;
  if (!profile || !data) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {fontTag}
        <span style={{ color: "#777", fontSize: 14 }}>Carregando sua plataforma…</span>
      </div>
    );
  }

  const realAgency = profile.role === "agencia";
  const isAgency = realAgency && view === "agencia";
  const clientNames = data.clients.map((c) => c.name);
  const activeClient = realAgency ? (previewClient || clientNames[0] || "") : (profile.client_name || "");
  const noClients = data.clients.length === 0;

  const clientMeta = (name) => data.clients.find((c) => c.name === name) || { name, client_type: "fixo", status: "ativo" };
  const rowVisible = (row) => row.visible_to_client !== false;
  const rowForPortal = (row) => row.client === activeClient && rowVisible(row);

  const visProjects = isAgency ? data.projects : data.projects.filter(rowForPortal);
  const visCampaigns = isAgency ? data.campaigns : data.campaigns.filter(rowForPortal);
  const visEvents = isAgency ? data.events : data.events.filter(rowForPortal);
  const visCaptures = isAgency ? data.captures : data.captures.filter(rowForPortal);
  const pendingApproval = visProjects.filter((p) => p.status === "Aguardando aprovação");

  const setF = (k, v) => setForms((old) => ({ ...old, [k]: v }));

  const updateRowState = (key, id, patch) => {
    setData((old) => ({ ...old, [key]: old[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };

  const updateClientField = (name, field, value) => {
    setData({ ...data, clients: data.clients.map((c) => (c.name === name ? { ...c, [field]: value } : c)) });
    run(supabase.from("clients").update({ [field]: value }).eq("name", name));
  };

  const toggleVisible = (table, key, id, current) => {
    const visible_to_client = !current;
    updateRowState(key, id, { visible_to_client });
    run(supabase.from(table).update({ visible_to_client }).eq("id", id));
  };

  const visibilityButton = (table, key, row) => isAgency ? (
    <button
      style={{ background: row.visible_to_client !== false ? GREEN_SOFT : GRAY_SOFT, color: row.visible_to_client !== false ? GREEN : "#76777F", border: "none", borderRadius: 99, padding: "4px 9px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      onClick={() => toggleVisible(table, key, row.id, row.visible_to_client !== false)}
      title="Controla se o cliente consegue ver este item no portal dele"
    >
      Cliente: {row.visible_to_client !== false ? "visível" : "oculto"}
    </button>
  ) : null;

  const moveProject = (id, dir) => {
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    const i = PROJECT_STATUSES.indexOf(p.status) + dir;
    if (i < 0 || i >= PROJECT_STATUSES.length) return;
    const status = PROJECT_STATUSES[i];
    updateRowState("projects", id, { status });
    run(supabase.from("projects").update({ status }).eq("id", id));
  };

  const setProjectStatus = (id, status) => {
    updateRowState("projects", id, { status });
    run(supabase.from("projects").update({ status }).eq("id", id));
  };

  const addProject = async () => {
    if (!forms.proj.trim() || noClients) return;
    const projectId = Date.now();
    const row = {
      id: projectId,
      name: forms.proj.trim(),
      client: forms.projClient || clientNames[0],
      status: "Briefing",
      deadline: forms.projDeadline || null,
      visible_to_client: forms.projVisible !== false,
    };
    setData({ ...data, projects: [...data.projects, { ...row, value: money(forms.projValue) }] });
    setForms({ ...forms, proj: "", projDeadline: "", projValue: "", projVisible: true });
    const inserted = await run(supabase.from("projects").insert(row));
    if (inserted && money(forms.projValue) > 0) {
      await run(supabase.from("project_financials").insert({ project_id: projectId, value: money(forms.projValue) }));
    }
  };

  const addCampaign = () => {
    if (!forms.camp.trim() || noClients) return;
    const row = { id: Date.now(), name: forms.camp.trim(), client: forms.campClient || clientNames[0], active: true, visible_to_client: forms.campVisible !== false };
    setData({ ...data, campaigns: [...data.campaigns, row] });
    setForms({ ...forms, camp: "", campVisible: true });
    run(supabase.from("campaigns").insert(row));
  };

  const toggleCampaign = (id) => {
    const c = data.campaigns.find((x) => x.id === id);
    if (!c) return;
    const active = !c.active;
    updateRowState("campaigns", id, { active });
    run(supabase.from("campaigns").update({ active }).eq("id", id));
  };

  const addEvent = () => {
    if (!forms.ev.trim() || !forms.evDate || noClients) return;
    const row = { id: Date.now(), name: forms.ev.trim(), client: forms.evClient || clientNames[0], date: forms.evDate, type: forms.evType, status: "Orçamento", checklist: [], visible_to_client: forms.evVisible !== false };
    setData({ ...data, events: [...data.events, row] });
    setForms({ ...forms, ev: "", evDate: "", evVisible: true });
    run(supabase.from("events").insert(row));
  };

  const cycleEventStatus = (id) => {
    const e = data.events.find((x) => x.id === id);
    if (!e) return;
    const status = EVENT_STATUSES[(EVENT_STATUSES.indexOf(e.status) + 1) % EVENT_STATUSES.length];
    updateRowState("events", id, { status });
    run(supabase.from("events").update({ status }).eq("id", id));
  };

  const updateChecklist = (eventId, checklist) => {
    updateRowState("events", eventId, { checklist });
    run(supabase.from("events").update({ checklist }).eq("id", eventId));
  };

  const toggleTask = (eventId, taskId) => {
    const e = data.events.find((x) => x.id === eventId);
    if (!e) return;
    updateChecklist(eventId, e.checklist.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  };

  const addTask = (eventId) => {
    if (!forms.task.trim()) return;
    const e = data.events.find((x) => x.id === eventId);
    if (!e) return;
    updateChecklist(eventId, [...e.checklist, { id: Date.now(), text: forms.task.trim(), done: false }]);
    setF("task", "");
  };

  const addClient = async () => {
    const name = forms.newClient.trim();
    if (!name) return;
    if (clientNames.includes(name)) {
      alert("Esse cliente já está cadastrado.");
      return;
    }

    const row = {
      name,
      client_type: forms.newClientType || "fixo",
      phone: forms.newClientPhone || null,
      email: forms.newClientEmail || null,
      instagram: forms.newClientInstagram || null,
      status: "ativo",
    };

    if (forms.newClientCreateLogin) {
      if (!row.email) {
        alert("Para criar acesso, preencha o e-mail do cliente.");
        return;
      }
      if (!forms.newClientPassword || forms.newClientPassword.length < 6) {
        alert("A senha provisória precisa ter pelo menos 6 caracteres.");
        return;
      }

      setSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      try {
        const response = await fetch("/api/create-client-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            client: row,
            create_login: true,
            password: forms.newClientPassword,
          }),
        });

        const result = await response.json();
        setSaving(false);

        if (!response.ok) {
          alert(result.error || "Não consegui criar o cliente com acesso.");
          return;
        }

        const createdClient = result.client || row;
        setData({ ...data, clients: [...data.clients, createdClient].sort((a, b) => a.name.localeCompare(b.name)) });
        setForms({ ...forms, newClient: "", newClientType: "fixo", newClientPhone: "", newClientEmail: "", newClientInstagram: "", newClientCreateLogin: false, newClientPassword: "" });
        alert("Cliente cadastrado e acesso criado com sucesso.");
      } catch (error) {
        console.error(error);
        setSaving(false);
        alert("Não consegui chamar a função segura da Vercel. Confira se o arquivo api/create-client-user.js foi enviado e se a Vercel terminou o deploy.");
      }
      return;
    }

    setData({ ...data, clients: [...data.clients, row].sort((a, b) => a.name.localeCompare(b.name)) });
    setForms({ ...forms, newClient: "", newClientType: "fixo", newClientPhone: "", newClientEmail: "", newClientInstagram: "", newClientCreateLogin: false, newClientPassword: "" });
    run(supabase.from("clients").insert(row));
  };

  const addCapture = async () => {
    if (!forms.capTitle.trim() || noClients) return;
    const selectedClient = forms.capClient || clientNames[0];
    const row = {
      title: forms.capTitle.trim(),
      client: selectedClient,
      client_type: clientMeta(selectedClient).client_type || "fixo",
      capture_type: forms.capType || "foto_video",
      date: forms.capDate || null,
      start_time: forms.capStart || null,
      end_time: forms.capEnd || null,
      location_name: forms.capLocation || null,
      address: forms.capAddress || null,
      responsible: forms.capResponsible || null,
      team: forms.capTeam || null,
      briefing: forms.capBriefing || null,
      shot_list: forms.capShotList || null,
      equipment: forms.capEquipment || null,
      status: "agendada",
      drive_url: forms.capDrive || null,
      delivery_deadline: forms.capDelivery || null,
      visible_to_client: forms.capVisible !== false,
      notes: forms.capNotes || null,
    };

    setSaving(true);
    const { data: inserted, error } = await supabase.from("captures").insert(row).select("*").single();
    setSaving(false);
    if (error) {
      console.error(error);
      alert("Não consegui criar a captação. Confira os campos e tente novamente.");
      return;
    }
    const created = { ...inserted, checklist: [] };
    setData({ ...data, captures: [...data.captures, created] });
    setForms({
      ...forms,
      capTitle: "", capDate: "", capStart: "", capEnd: "", capLocation: "", capAddress: "", capResponsible: "", capTeam: "", capBriefing: "", capShotList: "", capEquipment: "", capDrive: "", capDelivery: "", capVisible: true, capNotes: "",
    });
  };

  const moveCapture = (id, dir) => {
    const c = data.captures.find((x) => x.id === id);
    if (!c) return;
    const i = CAPTURE_STATUSES.indexOf(c.status) + dir;
    if (i < 0 || i >= CAPTURE_STATUSES.length) return;
    const status = CAPTURE_STATUSES[i];
    updateRowState("captures", id, { status });
    run(supabase.from("captures").update({ status }).eq("id", id));
  };

  const addCaptureTask = async (captureId) => {
    if (!forms.capTask.trim()) return;
    const c = data.captures.find((x) => x.id === captureId);
    if (!c) return;
    const row = { capture_id: captureId, text: forms.capTask.trim(), done: false, order_index: c.checklist.length, visible_to_client: forms.capTaskVisible === true };
    setSaving(true);
    const { data: inserted, error } = await supabase.from("capture_checklist").insert(row).select("*").single();
    setSaving(false);
    if (error) {
      console.error(error);
      alert("Não consegui adicionar essa tarefa.");
      return;
    }
    setData({ ...data, captures: data.captures.map((x) => (x.id === captureId ? { ...x, checklist: [...x.checklist, inserted] } : x)) });
    setForms({ ...forms, capTask: "", capTaskVisible: false });
  };

  const toggleCaptureTask = (captureId, taskId) => {
    const c = data.captures.find((x) => x.id === captureId);
    const t = c?.checklist.find((x) => x.id === taskId);
    if (!c || !t) return;
    const done = !t.done;
    setData({ ...data, captures: data.captures.map((cap) => (cap.id === captureId ? { ...cap, checklist: cap.checklist.map((task) => (task.id === taskId ? { ...task, done } : task)) } : cap)) });
    run(supabase.from("capture_checklist").update({ done }).eq("id", taskId));
  };

  const toggleCaptureTaskVisible = (captureId, taskId) => {
    const c = data.captures.find((x) => x.id === captureId);
    const t = c?.checklist.find((x) => x.id === taskId);
    if (!c || !t) return;
    const visible_to_client = !t.visible_to_client;
    setData({ ...data, captures: data.captures.map((cap) => (cap.id === captureId ? { ...cap, checklist: cap.checklist.map((task) => (task.id === taskId ? { ...task, visible_to_client } : task)) } : cap)) });
    run(supabase.from("capture_checklist").update({ visible_to_client }).eq("id", taskId));
  };

  const sair = () => supabase.auth.signOut();

  const navItems = [
    { id: "visao", label: "Visão geral", short: "Início", icon: "◆" },
    ...(isAgency ? [{ id: "clientes", label: "Clientes", short: "Clientes", icon: "●" }] : []),
    { id: "projetos", label: "Projetos", short: "Projetos", icon: "▣" },
    { id: "campanhas", label: "Campanhas", short: "Campanhas", icon: "◉" },
    { id: "eventos", label: "Eventos", short: "Eventos", icon: "✦" },
    { id: "captacoes", label: "Captações", short: "Captações", icon: "▲" },
  ];

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dateStr = (d) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const inputStyle = { border: "1px solid #D8D8D2", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit" };
  const btnStyle = { background: INK, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const smallBtn = { background: "#fff", border: "1px solid #D8D8D2", borderRadius: 6, padding: "3px 9px", fontSize: 12, cursor: "pointer", color: "#444", fontFamily: "inherit" };
  const textareaStyle = { ...inputStyle, minHeight: 66, resize: "vertical" };

  const checkboxLabel = (label, checked, onChange) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#55565E", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );

  const viewSwitch = (dark) => realAgency ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button onClick={() => { setView("agencia"); setTab("visao"); }} style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: isAgency ? "#9C92F2" : dark ? "rgba(255,255,255,0.08)" : "#E7E7E2", color: isAgency ? INK : dark ? "#A7A8B0" : "#76777F" }}>Agência</button>
      <button onClick={() => { setView("cliente"); setTab("visao"); }} style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: !isAgency ? "#9C92F2" : dark ? "rgba(255,255,255,0.08)" : "#E7E7E2", color: !isAgency ? INK : dark ? "#A7A8B0" : "#76777F" }}>Ver como cliente</button>
      {!isAgency && (
        <select value={activeClient} onChange={(e) => setPreviewClient(e.target.value)} style={{ background: dark ? "rgba(255,255,255,0.08)" : "#fff", color: dark ? "#EDEDEA" : INK, border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #D8D8D2", borderRadius: 99, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", maxWidth: 150 }}>
          {clientNames.map((c) => <option key={c} value={c} style={{ color: INK }}>{c}</option>)}
        </select>
      )}
    </div>
  ) : null;

  const clientPortalWarning = !realAgency && !profile.client_name;

  const content = (
    <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "16px 14px 86px" : "26px 28px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 700, margin: 0 }}>
          {navItems.find((n) => n.id === tab)?.label || "Visão geral"}
        </h1>
        <span style={{ fontSize: 12, color: "#76777F" }}>
          {isAgency ? "Visão da agência" : `Portal de ${activeClient || "cliente"}`} · {saving ? "salvando…" : "sincronizado ✓"}
        </span>
      </div>

      {loadError && (
        <Card style={{ marginBottom: 14, borderLeft: `3px solid ${RED}`, borderRadius: "0 12px 12px 0" }}>
          <div style={{ fontSize: 13, color: RED, fontWeight: 600 }}>{loadError}</div>
        </Card>
      )}

      {clientPortalWarning && (
        <Card style={{ borderLeft: `3px solid ${AMBER}`, borderRadius: "0 12px 12px 0" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>Portal ainda não vinculado a um cliente</div>
          <Empty>Peça para a agência preencher o campo <b>client_name</b> no perfil deste usuário dentro do Supabase. Enquanto isso, o portal não mostra dados de nenhum cliente.</Empty>
        </Card>
      )}

      {tab === "visao" && !clientPortalWarning && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            {(isAgency ? [
              { label: "Clientes fixos", value: data.clients.filter((c) => c.client_type === "fixo" && c.status !== "arquivado").length, accent: VIOLET },
              { label: "Clientes aleatórios", value: data.clients.filter((c) => c.client_type === "aleatorio" && c.status !== "arquivado").length, accent: ROSE },
              { label: "Captações agendadas", value: visCaptures.filter((c) => c.status === "agendada").length, accent: AMBER },
              { label: "Em edição", value: visCaptures.filter((c) => c.status === "em_edicao").length, accent: VIOLET },
            ] : [
              { label: "Projetos ativos", value: visProjects.filter((p) => p.status !== "Concluído").length, accent: VIOLET },
              { label: "Campanhas no ar", value: visCampaigns.filter((c) => c.active).length, accent: VIOLET },
              { label: "Captações agendadas", value: visCaptures.filter((c) => c.status === "agendada").length, accent: AMBER },
              { label: "Aguardando você", value: pendingApproval.length, accent: AMBER },
            ]).map((m) => (
              <Card key={m.label} style={{ padding: 12 }}>
                <div style={{ fontSize: 11.5, color: "#76777F", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: m.accent }}>{m.value}</div>
              </Card>
            ))}
          </div>

          {pendingApproval.length > 0 && (
            <Card style={{ marginBottom: 16, borderLeft: `3px solid ${AMBER}`, borderRadius: "0 12px 12px 0" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>
                {isAgency ? "Peças esperando o cliente aprovar" : "Peças esperando a sua aprovação"}
              </div>
              {pendingApproval.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F0F0EC", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13 }}>{p.name} <span style={{ color: "#9A9BA2", fontSize: 12 }}>· {p.client}</span></div>
                  {!isAgency && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...smallBtn, background: GREEN_SOFT, color: GREEN, border: "none", fontWeight: 600 }} onClick={() => setProjectStatus(p.id, "Concluído")}>Aprovar</button>
                      <button style={{ ...smallBtn, background: VIOLET_SOFT, color: VIOLET, border: "none", fontWeight: 600 }} onClick={() => setProjectStatus(p.id, "Em edição")}>Pedir ajuste</button>
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Próximas captações</div>
              {visCaptures.filter((c) => c.status !== "entregue" && c.status !== "arquivada").sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999"))).slice(0, 4).map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #F0F0EC", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{formatDate(c.date)} · {captureTypeLabel(c.capture_type)}</div>
                  </div>
                  <Pill label={captureStatusLabel(c.status)} />
                </div>
              ))}
              {visCaptures.filter((c) => c.status !== "entregue" && c.status !== "arquivada").length === 0 && <Empty>Nenhuma captação pendente.</Empty>}
            </Card>

            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Próximos eventos</div>
              {visEvents.filter((e) => e.status !== "Realizado").sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999"))).slice(0, 4).map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #F0F0EC", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{formatDate(e.date)} · {e.type}</div>
                  </div>
                  <Pill label={e.status} />
                </div>
              ))}
              {visEvents.filter((e) => e.status !== "Realizado").length === 0 && <Empty>Nenhum evento futuro.</Empty>}
            </Card>

            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Prazos mais próximos</div>
              {visProjects.filter((p) => p.deadline && p.status !== "Concluído").sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))).slice(0, 4).map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #F0F0EC", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{p.client}</div>
                  </div>
                  <DeadlineTag deadline={p.deadline} />
                </div>
              ))}
              {visProjects.filter((p) => p.deadline && p.status !== "Concluído").length === 0 && <Empty>Nenhum prazo cadastrado.</Empty>}
            </Card>
          </div>
        </div>
      )}

      {tab === "clientes" && isAgency && (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Cadastrar cliente</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 130px 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
              <input style={inputStyle} placeholder="Nome do cliente" value={forms.newClient} onChange={(e) => setF("newClient", e.target.value)} />
              <select style={inputStyle} value={forms.newClientType} onChange={(e) => setF("newClientType", e.target.value)}>
                <option value="fixo">Fixo</option>
                <option value="aleatorio">Aleatório</option>
              </select>
              <input style={inputStyle} placeholder="Telefone" value={forms.newClientPhone} onChange={(e) => setF("newClientPhone", e.target.value)} />
              <input style={inputStyle} placeholder="E-mail do cliente" value={forms.newClientEmail} onChange={(e) => setF("newClientEmail", e.target.value)} />
              <input style={inputStyle} placeholder="Instagram" value={forms.newClientInstagram} onChange={(e) => setF("newClientInstagram", e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              {checkboxLabel("criar acesso de login para este cliente", forms.newClientCreateLogin, (v) => setF("newClientCreateLogin", v))}
              {forms.newClientCreateLogin && (
                <input
                  style={{ ...inputStyle, width: isMobile ? "100%" : 220 }}
                  type="text"
                  placeholder="Senha provisória"
                  value={forms.newClientPassword}
                  onChange={(e) => setF("newClientPassword", e.target.value)}
                />
              )}
              <button style={btnStyle} onClick={addClient}>{forms.newClientCreateLogin ? "Cadastrar e criar acesso" : "Adicionar cliente"}</button>
            </div>
            {forms.newClientCreateLogin && (
              <div style={{ fontSize: 11.5, color: "#76777F", marginTop: 8, lineHeight: 1.5 }}>
                O cliente vai entrar usando o e-mail informado e essa senha provisória. Depois você pode pedir para ele trocar a senha.
              </div>
            )}
          </Card>

          {data.clients.map((c) => (
            <Card key={c.name} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{c.email || "sem e-mail"} {c.phone ? `· ${c.phone}` : ""} {c.instagram ? `· ${c.instagram}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select style={inputStyle} value={c.client_type || "fixo"} onChange={(e) => updateClientField(c.name, "client_type", e.target.value)}>
                    <option value="fixo">Cliente fixo</option>
                    <option value="aleatorio">Cliente aleatório</option>
                  </select>
                  <select style={inputStyle} value={c.status || "ativo"} onChange={(e) => updateClientField(c.name, "status", e.target.value)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
          {noClients && <Empty>Nenhum cliente cadastrado ainda.</Empty>}
        </div>
      )}

      {tab === "projetos" && !clientPortalWarning && (
        <div>
          {isAgency && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...inputStyle, flex: 2, minWidth: 150 }} placeholder={noClients ? "Cadastre um cliente primeiro" : "Nome do novo projeto"} value={forms.proj} onChange={(e) => setF("proj", e.target.value)} disabled={noClients} />
                <select style={inputStyle} value={forms.projClient} onChange={(e) => setF("projClient", e.target.value)} disabled={noClients}>
                  {clientNames.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="date" style={inputStyle} value={forms.projDeadline} onChange={(e) => setF("projDeadline", e.target.value)} title="Prazo de entrega" disabled={noClients} />
                <input type="number" style={{ ...inputStyle, width: 120 }} placeholder="Valor interno" value={forms.projValue} onChange={(e) => setF("projValue", e.target.value)} disabled={noClients} />
                {checkboxLabel("visível ao cliente", forms.projVisible, (v) => setF("projVisible", v))}
                <button style={btnStyle} onClick={addProject} disabled={noClients}>Adicionar</button>
              </div>
            </Card>
          )}
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {PROJECT_STATUSES.map((status) => {
              const items = visProjects.filter((p) => p.status === status);
              return (
                <div key={status} style={{ minWidth: isMobile ? 210 : 190, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}><Pill label={status} /> <span style={{ fontSize: 11.5, color: "#9A9BA2" }}>{items.length}</span></div>
                  {items.map((p) => (
                    <Card key={p.id} style={{ padding: 11, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9A9BA2", marginBottom: 4 }}>{p.client}{isAgency && p.value ? ` · ${brl(p.value)}` : ""}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                        <DeadlineTag deadline={p.status !== "Concluído" ? p.deadline : ""} />
                        {visibilityButton("projects", "projects", p)}
                      </div>
                      {isAgency && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <button style={smallBtn} onClick={() => moveProject(p.id, -1)} title="Voltar etapa">←</button>
                          <button style={smallBtn} onClick={() => moveProject(p.id, 1)} title="Avançar etapa">→</button>
                        </div>
                      )}
                    </Card>
                  ))}
                  {items.length === 0 && <div style={{ fontSize: 12, color: "#C2C3C8", border: "1px dashed #DDDDD7", borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>vazio</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "campanhas" && !clientPortalWarning && (
        <div>
          {isAgency && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder={noClients ? "Cadastre um cliente primeiro" : "Nome da nova campanha"} value={forms.camp} onChange={(e) => setF("camp", e.target.value)} disabled={noClients} />
                <select style={inputStyle} value={forms.campClient} onChange={(e) => setF("campClient", e.target.value)} disabled={noClients}>
                  {clientNames.map((c) => <option key={c}>{c}</option>)}
                </select>
                {checkboxLabel("visível ao cliente", forms.campVisible, (v) => setF("campVisible", v))}
                <button style={btnStyle} onClick={addCampaign} disabled={noClients}>Adicionar</button>
              </div>
            </Card>
          )}
          {visCampaigns.map((c) => (
            <Card key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{c.client}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {visibilityButton("campaigns", "campaigns", c)}
                <span style={{ fontSize: 12, fontWeight: 600, color: c.active ? GREEN : "#9A9BA2" }}>{c.active ? "Ativa" : "Pausada"}</span>
                {isAgency && (
                  <button onClick={() => toggleCampaign(c.id)} style={{ width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer", position: "relative", background: c.active ? GREEN : "#D5D5CF", transition: "background .2s" }}>
                    <span style={{ position: "absolute", top: 3, left: c.active ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </button>
                )}
              </div>
            </Card>
          ))}
          {visCampaigns.length === 0 && <Empty>Nenhuma campanha por aqui ainda.</Empty>}
        </div>
      )}

      {tab === "eventos" && !clientPortalWarning && (
        <div>
          {isAgency && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...inputStyle, flex: 1, minWidth: 130 }} placeholder={noClients ? "Cadastre um cliente primeiro" : "Nome do evento"} value={forms.ev} onChange={(e) => setF("ev", e.target.value)} disabled={noClients} />
                <input type="date" style={inputStyle} value={forms.evDate} onChange={(e) => setF("evDate", e.target.value)} disabled={noClients} />
                <select style={inputStyle} value={forms.evType} onChange={(e) => setF("evType", e.target.value)} disabled={noClients}>
                  <option>Casamento</option><option>Aniversário</option><option>Corporativo</option><option>Outro</option>
                </select>
                <select style={inputStyle} value={forms.evClient} onChange={(e) => setF("evClient", e.target.value)} disabled={noClients}>
                  {clientNames.map((c) => <option key={c}>{c}</option>)}
                </select>
                {checkboxLabel("visível ao cliente", forms.evVisible, (v) => setF("evVisible", v))}
                <button style={btnStyle} onClick={addEvent} disabled={noClients}>Adicionar</button>
              </div>
            </Card>
          )}
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #EFEFEA" }}>
              <button style={smallBtn} onClick={() => { const m = calMonth - 1; if (m < 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(m); }}>←</button>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{MONTHS[calMonth]} {calYear}</div>
              <button style={smallBtn} onClick={() => { const m = calMonth + 1; if (m > 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(m); }}>→</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontSize: 11, color: "#9A9BA2", textAlign: "center", borderBottom: "1px solid #EFEFEA" }}>
              {WEEKDAYS.map((w) => <div key={w} style={{ padding: "6px 0" }}>{w}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {cells.map((d, i) => {
                const dayEvents = d ? visEvents.filter((e) => e.date === dateStr(d)) : [];
                const dayCaptures = d ? visCaptures.filter((c) => c.date === dateStr(d)) : [];
                return (
                  <div key={i} style={{ minHeight: isMobile ? 54 : 66, padding: 3, borderTop: i >= 7 ? "1px solid #F2F2ED" : "none", borderLeft: i % 7 !== 0 ? "1px solid #F2F2ED" : "none", fontSize: 11, color: d ? INK : "transparent" }}>
                    {d || "."}
                    {dayEvents.map((e) => {
                      const c = statusColors(e.status);
                      return <div key={`e-${e.id}`} title={`${e.name} — ${e.status}`} style={{ background: e.type === "Casamento" ? ROSE_SOFT : c.bg, color: e.type === "Casamento" ? ROSE : c.fg, borderRadius: 5, padding: "2px 4px", marginTop: 3, fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isMobile ? "●" : e.name}</div>;
                    })}
                    {dayCaptures.map((cpt) => (
                      <div key={`c-${cpt.id}`} title={`${cpt.title} — ${captureStatusLabel(cpt.status)}`} style={{ background: VIOLET_SOFT, color: VIOLET, borderRadius: 5, padding: "2px 4px", marginTop: 3, fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isMobile ? "▲" : `Cap. ${cpt.title}`}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
          {visEvents.slice().sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999"))).map((e) => {
            const done = e.checklist.filter((t) => t.done).length;
            const open = expandedEvent === e.id;
            return (
              <Card key={e.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{formatDate(e.date)} · {e.type} · {e.client}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {visibilityButton("events", "events", e)}
                    <Pill label={e.status} />
                    {isAgency && <button style={smallBtn} onClick={() => cycleEventStatus(e.id)}>Mudar status</button>}
                    <button style={{ ...smallBtn, fontWeight: 600 }} onClick={() => setExpandedEvent(open ? null : e.id)}>
                      Checklist {e.checklist.length > 0 ? `${done}/${e.checklist.length}` : ""} {open ? "▴" : "▾"}
                    </button>
                  </div>
                </div>
                {open && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0F0EC" }}>
                    {e.checklist.length > 0 && (
                      <div style={{ height: 5, background: "#EFEFEA", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((done / e.checklist.length) * 100)}%`, background: e.type === "Casamento" ? ROSE : VIOLET, transition: "width .3s" }} />
                      </div>
                    )}
                    {e.checklist.map((t) => (
                      <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, cursor: "pointer", color: t.done ? "#9A9BA2" : INK, textDecoration: t.done ? "line-through" : "none" }}>
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(e.id, t.id)} />
                        {t.text}
                      </label>
                    ))}
                    {e.checklist.length === 0 && <Empty>Nenhuma tarefa ainda.</Empty>}
                    {isAgency && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nova tarefa do evento" value={forms.task} onChange={(ev2) => setF("task", ev2.target.value)} onKeyDown={(ev2) => ev2.key === "Enter" && addTask(e.id)} />
                        <button style={btnStyle} onClick={() => addTask(e.id)}>+</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          {visEvents.length === 0 && <Empty>Nenhum evento por aqui ainda.</Empty>}
        </div>
      )}

      {tab === "captacoes" && !clientPortalWarning && (
        <div>
          {isAgency && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Nova captação</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input style={inputStyle} placeholder={noClients ? "Cadastre um cliente primeiro" : "Título da captação"} value={forms.capTitle} onChange={(e) => setF("capTitle", e.target.value)} disabled={noClients} />
                <select style={inputStyle} value={forms.capClient} onChange={(e) => setF("capClient", e.target.value)} disabled={noClients}>
                  {clientNames.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select style={inputStyle} value={forms.capType} onChange={(e) => setF("capType", e.target.value)} disabled={noClients}>
                  <option value="foto">Foto</option>
                  <option value="video">Vídeo</option>
                  <option value="foto_video">Foto + vídeo</option>
                  <option value="drone">Drone</option>
                  <option value="reels">Reels</option>
                  <option value="evento">Evento</option>
                  <option value="outro">Outro</option>
                </select>
                <input type="date" style={inputStyle} value={forms.capDate} onChange={(e) => setF("capDate", e.target.value)} disabled={noClients} />
                <input type="date" style={inputStyle} value={forms.capDelivery} onChange={(e) => setF("capDelivery", e.target.value)} title="Prazo de entrega" disabled={noClients} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input type="time" style={inputStyle} value={forms.capStart} onChange={(e) => setF("capStart", e.target.value)} disabled={noClients} />
                <input type="time" style={inputStyle} value={forms.capEnd} onChange={(e) => setF("capEnd", e.target.value)} disabled={noClients} />
                <input style={inputStyle} placeholder="Local" value={forms.capLocation} onChange={(e) => setF("capLocation", e.target.value)} disabled={noClients} />
                <input style={inputStyle} placeholder="Endereço" value={forms.capAddress} onChange={(e) => setF("capAddress", e.target.value)} disabled={noClients} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input style={inputStyle} placeholder="Responsável" value={forms.capResponsible} onChange={(e) => setF("capResponsible", e.target.value)} disabled={noClients} />
                <input style={inputStyle} placeholder="Equipe" value={forms.capTeam} onChange={(e) => setF("capTeam", e.target.value)} disabled={noClients} />
                <input style={inputStyle} placeholder="Link da pasta Google Drive" value={forms.capDrive} onChange={(e) => setF("capDrive", e.target.value)} disabled={noClients} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <textarea style={textareaStyle} placeholder="Briefing" value={forms.capBriefing} onChange={(e) => setF("capBriefing", e.target.value)} disabled={noClients} />
                <textarea style={textareaStyle} placeholder="Lista de cenas" value={forms.capShotList} onChange={(e) => setF("capShotList", e.target.value)} disabled={noClients} />
                <textarea style={textareaStyle} placeholder="Equipamentos / observações internas" value={forms.capEquipment} onChange={(e) => setF("capEquipment", e.target.value)} disabled={noClients} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {checkboxLabel("visível ao cliente", forms.capVisible, (v) => setF("capVisible", v))}
                <button style={btnStyle} onClick={addCapture} disabled={noClients}>Criar captação</button>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {CAPTURE_STATUSES.map((status) => {
              const items = visCaptures.filter((c) => c.status === status);
              return (
                <div key={status} style={{ minWidth: isMobile ? 240 : 220, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}><Pill label={captureStatusLabel(status)} /> <span style={{ fontSize: 11.5, color: "#9A9BA2" }}>{items.length}</span></div>
                  {items.map((c) => {
                    const open = expandedCapture === c.id;
                    const done = c.checklist.filter((t) => t.done).length;
                    return (
                      <Card key={c.id} style={{ padding: 11, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.title}</div>
                            <div style={{ fontSize: 11.5, color: "#9A9BA2", marginBottom: 3 }}>{c.client} · {clientTypeLabel(c.client_type || clientMeta(c.client).client_type)}</div>
                            <div style={{ fontSize: 11.5, color: VIOLET, fontWeight: 600 }}>{captureTypeLabel(c.capture_type)}</div>
                          </div>
                          {visibilityButton("captures", "captures", c)}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#76777F", marginTop: 8, lineHeight: 1.5 }}>
                          {formatDate(c.date)} {c.start_time ? `· ${c.start_time}` : ""}{c.end_time ? ` às ${c.end_time}` : ""}<br />
                          {c.location_name || "Sem local"}{c.address ? ` · ${c.address}` : ""}
                        </div>
                        {c.delivery_deadline && <div style={{ marginTop: 5 }}><DeadlineTag deadline={c.delivery_deadline} /></div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                          {isAgency && <button style={smallBtn} onClick={() => moveCapture(c.id, -1)}>←</button>}
                          {isAgency && <button style={smallBtn} onClick={() => moveCapture(c.id, 1)}>→</button>}
                          <button style={{ ...smallBtn, fontWeight: 600 }} onClick={() => setExpandedCapture(open ? null : c.id)}>
                            Detalhes {c.checklist.length > 0 ? `${done}/${c.checklist.length}` : ""} {open ? "▴" : "▾"}
                          </button>
                        </div>
                        {open && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0F0EC" }}>
                            {c.briefing && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}><b>Briefing:</b> {c.briefing}</div>}
                            {c.shot_list && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}><b>Lista de cenas:</b> {c.shot_list}</div>}
                            {isAgency && c.equipment && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}><b>Equipamentos:</b> {c.equipment}</div>}
                            {c.responsible && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}><b>Responsável:</b> {c.responsible}</div>}
                            {c.team && <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}><b>Equipe:</b> {c.team}</div>}
                            {c.drive_url && <a href={c.drive_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", color: VIOLET, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Abrir pasta no Drive</a>}

                            {c.checklist.length > 0 && (
                              <div style={{ height: 5, background: "#EFEFEA", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.round((done / c.checklist.length) * 100)}%`, background: VIOLET, transition: "width .3s" }} />
                              </div>
                            )}
                            {c.checklist.map((t) => (
                              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "5px 0", borderTop: "1px solid #F7F7F3" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: isAgency ? "pointer" : "default", color: t.done ? "#9A9BA2" : INK, textDecoration: t.done ? "line-through" : "none" }}>
                                  <input type="checkbox" checked={t.done} disabled={!isAgency} onChange={() => toggleCaptureTask(c.id, t.id)} />
                                  {t.text}
                                </label>
                                {isAgency && (
                                  <button style={{ ...smallBtn, fontSize: 11, background: t.visible_to_client ? GREEN_SOFT : GRAY_SOFT, border: "none", color: t.visible_to_client ? GREEN : "#76777F" }} onClick={() => toggleCaptureTaskVisible(c.id, t.id)}>
                                    {t.visible_to_client ? "cliente vê" : "interno"}
                                  </button>
                                )}
                              </div>
                            ))}
                            {c.checklist.length === 0 && <Empty>Nenhuma tarefa nesta captação.</Empty>}
                            {isAgency && (
                              <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <input style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder="Nova tarefa da captação" value={forms.capTask} onChange={(ev2) => setF("capTask", ev2.target.value)} onKeyDown={(ev2) => ev2.key === "Enter" && addCaptureTask(c.id)} />
                                {checkboxLabel("cliente vê", forms.capTaskVisible, (v) => setF("capTaskVisible", v))}
                                <button style={btnStyle} onClick={() => addCaptureTask(c.id)}>+</button>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {items.length === 0 && <div style={{ fontSize: 12, color: "#C2C3C8", border: "1px dashed #DDDDD7", borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>vazio</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );

  if (isMobile) {
    return (
      <div style={shell}>
        {fontTag}
        <header style={{ background: INK, color: "#EDEDEA", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>sua<span style={{ color: "#9C92F2" }}>agência</span></div>
            <div style={{ fontSize: 10, color: "#8B8C95" }}>{session.user.email}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {viewSwitch(true)}
            <button onClick={sair} style={{ background: "rgba(255,255,255,0.08)", color: "#A7A8B0", border: "none", borderRadius: 99, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
          </div>
        </header>
        {content}
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E4E4DF", display: "flex", justifyContent: "space-around", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 50, overflowX: "auto" }}>
          {navItems.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit", color: tab === n.id ? VIOLET : "#9A9BA2", fontSize: 10.5, fontWeight: tab === n.id ? 700 : 500, flex: 1, minWidth: 68 }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {n.short}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div style={shell}>
      {fontTag}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 210, flexShrink: 0, background: INK, color: "#EDEDEA", padding: "22px 14px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: 0.5, marginBottom: 4 }}>
            sua<span style={{ color: "#9C92F2" }}>agência</span>
          </div>
          <div style={{ fontSize: 11, color: "#8B8C95", marginBottom: 26 }}>marketing & eventos</div>
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                background: tab === n.id ? "rgba(156,146,242,0.16)" : "transparent",
                color: tab === n.id ? "#fff" : "#A7A8B0",
                border: "none", borderRadius: 8, padding: "9px 10px", fontSize: 13.5, fontWeight: tab === n.id ? 600 : 400,
                cursor: "pointer", marginBottom: 2, fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 11, color: tab === n.id ? "#9C92F2" : "#5A5B66" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {realAgency && <div style={{ fontSize: 11, color: "#8B8C95", marginBottom: 8 }}>Visualizando como</div>}
            {viewSwitch(true)}
            <div style={{ fontSize: 10.5, color: "#5A5B66", marginTop: 12, wordBreak: "break-all" }}>{session.user.email}</div>
            <button onClick={sair} style={{ marginTop: 8, background: "rgba(255,255,255,0.08)", color: "#A7A8B0", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>Sair</button>
          </div>
        </aside>
        {content}
      </div>
    </div>
  );
}
