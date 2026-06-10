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

const PROJECT_STATUSES = ["Captação", "Em produção", "Em edição", "Aguardando aprovação", "Concluído"];
const LEAD_STAGES = ["Novo lead", "Contato feito", "Proposta enviada", "Negociação", "Fechado"];
const EVENT_STATUSES = ["Orçamento", "Confirmado", "Em planejamento", "Realizado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const brl = (n) => "R$ " + Number(n || 0).toLocaleString("pt-BR");

function statusColors(status) {
  if (["Concluído", "Realizado", "Fechado"].includes(status)) return { bg: GREEN_SOFT, fg: GREEN };
  if (["Aguardando aprovação", "Orçamento", "Proposta enviada"].includes(status)) return { bg: AMBER_SOFT, fg: AMBER };
  if (["Em edição", "Negociação", "Em planejamento"].includes(status)) return { bg: VIOLET_SOFT, fg: VIOLET };
  if (["Captação", "Novo lead"].includes(status)) return { bg: GRAY_SOFT, fg: "#55565E" };
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
          "anon public" do Supabase (você encontra em Settings → API no painel do Supabase).
          Depois publique novamente. O guia COMO-CONECTAR-SUPABASE.md explica tudo.
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
    if (error) setErro("E-mail ou senha incorretos. Tente novamente.");
    else onLogin();
  };

  const inputStyle = { border: "1px solid #D8D8D2", borderRadius: 8, padding: "10px 12px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {fontTag}
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 24 }}>sua<span style={{ color: VIOLET }}>agência</span></div>
          <div style={{ fontSize: 12, color: "#8B8C95" }}>marketing & eventos</div>
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
          Acesso criado pela agência. Esqueceu a senha? Fale com a gente.
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
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 720 : false);
  const [forms, setForms] = useState({ proj: "", projClient: "", projDeadline: "", projValue: "", camp: "", campClient: "", ev: "", evClient: "", evDate: "", evType: "Casamento", lead: "", leadInterest: "Marketing", leadValue: "", task: "", newClient: "" });

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
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof || { role: "cliente", client_name: null });
      await fetchAll();
    })();
  }, [session]);

  const fetchAll = async () => {
    const [cl, pr, ca, ev, le] = await Promise.all([
      supabase.from("clients").select("name").order("name"),
      supabase.from("projects").select("*").order("id"),
      supabase.from("campaigns").select("*").order("id"),
      supabase.from("events").select("*").order("date"),
      supabase.from("leads").select("*").order("id"),
    ]);
    setData({
      clients: (cl.data || []).map((c) => c.name),
      projects: pr.data || [],
      campaigns: ca.data || [],
      events: (ev.data || []).map((e) => ({ ...e, checklist: e.checklist || [] })),
      leads: le.data || [],
    });
  };

  const run = async (promise) => {
    setSaving(true);
    try { await promise; } catch (e) {} finally { setSaving(false); }
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
  const activeClient = realAgency ? (previewClient || data.clients[0] || "") : (profile.client_name || "");

  const visProjects = isAgency ? data.projects : data.projects.filter((p) => p.client === activeClient);
  const visCampaigns = isAgency ? data.campaigns : data.campaigns.filter((c) => c.client === activeClient);
  const visEvents = isAgency ? data.events : data.events.filter((e) => e.client === activeClient);
  const pendingApproval = visProjects.filter((p) => p.status === "Aguardando aprovação");
  const pipelineValue = data.leads.filter((l) => ["Proposta enviada", "Negociação"].includes(l.stage)).reduce((s, l) => s + Number(l.value || 0), 0);

  const setF = (k, v) => setForms({ ...forms, [k]: v });
  const noClients = data.clients.length === 0;

  const moveProject = (id, dir) => {
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    const i = PROJECT_STATUSES.indexOf(p.status) + dir;
    if (i < 0 || i >= PROJECT_STATUSES.length) return;
    const status = PROJECT_STATUSES[i];
    setData({ ...data, projects: data.projects.map((x) => (x.id === id ? { ...x, status } : x)) });
    run(supabase.from("projects").update({ status }).eq("id", id));
  };

  const setProjectStatus = (id, status) => {
    setData({ ...data, projects: data.projects.map((p) => (p.id === id ? { ...p, status } : p)) });
    run(supabase.from("projects").update({ status }).eq("id", id));
  };

  const addProject = () => {
    if (!forms.proj.trim() || noClients) return;
    const row = { id: Date.now(), name: forms.proj.trim(), client: forms.projClient || data.clients[0], status: "Captação", deadline: forms.projDeadline, value: Number(forms.projValue || 0) };
    setData({ ...data, projects: [...data.projects, row] });
    setForms({ ...forms, proj: "", projDeadline: "", projValue: "" });
    run(supabase.from("projects").insert(row));
  };

  const addCampaign = () => {
    if (!forms.camp.trim() || noClients) return;
    const row = { id: Date.now(), name: forms.camp.trim(), client: forms.campClient || data.clients[0], active: true };
    setData({ ...data, campaigns: [...data.campaigns, row] });
    setF("camp", "");
    run(supabase.from("campaigns").insert(row));
  };

  const toggleCampaign = (id) => {
    const c = data.campaigns.find((x) => x.id === id);
    if (!c) return;
    const active = !c.active;
    setData({ ...data, campaigns: data.campaigns.map((x) => (x.id === id ? { ...x, active } : x)) });
    run(supabase.from("campaigns").update({ active }).eq("id", id));
  };

  const addEvent = () => {
    if (!forms.ev.trim() || !forms.evDate || noClients) return;
    const row = { id: Date.now(), name: forms.ev.trim(), client: forms.evClient || data.clients[0], date: forms.evDate, type: forms.evType, status: "Orçamento", checklist: [] };
    setData({ ...data, events: [...data.events, row] });
    setForms({ ...forms, ev: "", evDate: "" });
    run(supabase.from("events").insert(row));
  };

  const cycleEventStatus = (id) => {
    const e = data.events.find((x) => x.id === id);
    if (!e) return;
    const status = EVENT_STATUSES[(EVENT_STATUSES.indexOf(e.status) + 1) % EVENT_STATUSES.length];
    setData({ ...data, events: data.events.map((x) => (x.id === id ? { ...x, status } : x)) });
    run(supabase.from("events").update({ status }).eq("id", id));
  };

  const updateChecklist = (eventId, checklist) => {
    setData({ ...data, events: data.events.map((e) => (e.id === eventId ? { ...e, checklist } : e)) });
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

  const addLead = () => {
    if (!forms.lead.trim()) return;
    const row = { id: Date.now(), name: forms.lead.trim(), stage: "Novo lead", interest: forms.leadInterest, value: Number(forms.leadValue || 0) };
    setData({ ...data, leads: [...data.leads, row] });
    setForms({ ...forms, lead: "", leadValue: "" });
    run(supabase.from("leads").insert(row));
  };

  const moveLead = (id, dir) => {
    const l = data.leads.find((x) => x.id === id);
    if (!l) return;
    const i = LEAD_STAGES.indexOf(l.stage) + dir;
    if (i < 0 || i >= LEAD_STAGES.length) return;
    const stage = LEAD_STAGES[i];
    setData({ ...data, leads: data.leads.map((x) => (x.id === id ? { ...x, stage } : x)) });
    run(supabase.from("leads").update({ stage }).eq("id", id));
  };

  const addClient = () => {
    const name = forms.newClient.trim();
    if (!name || data.clients.includes(name)) return;
    setData({ ...data, clients: [...data.clients, name].sort() });
    setF("newClient", "");
    run(supabase.from("clients").insert({ name }));
  };

  const sair = () => supabase.auth.signOut();

  const navItems = [
    { id: "visao", label: "Visão geral", short: "Início", icon: "◆" },
    { id: "projetos", label: "Projetos", short: "Projetos", icon: "▣" },
    { id: "campanhas", label: "Campanhas", short: "Campanhas", icon: "◉" },
    { id: "eventos", label: "Eventos", short: "Eventos", icon: "✦" },
    ...(isAgency ? [{ id: "captacao", label: "Captação", short: "Leads", icon: "▲" }] : []),
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

  const viewSwitch = (dark) => realAgency ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <button onClick={() => { setView("agencia"); setTab("visao"); }} style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: isAgency ? "#9C92F2" : dark ? "rgba(255,255,255,0.08)" : "#E7E7E2", color: isAgency ? INK : dark ? "#A7A8B0" : "#76777F" }}>Agência</button>
      <button onClick={() => { setView("cliente"); setTab("visao"); }} style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: !isAgency ? "#9C92F2" : dark ? "rgba(255,255,255,0.08)" : "#E7E7E2", color: !isAgency ? INK : dark ? "#A7A8B0" : "#76777F" }}>Ver como cliente</button>
      {!isAgency && (
        <select value={activeClient} onChange={(e) => setPreviewClient(e.target.value)} style={{ background: dark ? "rgba(255,255,255,0.08)" : "#fff", color: dark ? "#EDEDEA" : INK, border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #D8D8D2", borderRadius: 99, padding: "5px 8px", fontSize: 12, fontFamily: "inherit", maxWidth: 130 }}>
          {data.clients.map((c) => <option key={c} value={c} style={{ color: INK }}>{c}</option>)}
        </select>
      )}
    </div>
  ) : null;

  const content = (
    <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "16px 14px 86px" : "26px 28px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: isMobile ? 18 : 21, fontWeight: 700, margin: 0 }}>
          {navItems.find((n) => n.id === tab)?.label}
        </h1>
        <span style={{ fontSize: 12, color: "#76777F" }}>
          {isAgency ? "Visão da agência" : `Portal de ${activeClient || "cliente"}`} · {saving ? "salvando…" : "sincronizado ✓"}
        </span>
      </div>

      {tab === "visao" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Projetos ativos", value: visProjects.filter((p) => p.status !== "Concluído").length, accent: VIOLET },
              { label: "Campanhas no ar", value: visCampaigns.filter((c) => c.active).length, accent: VIOLET },
              { label: "Eventos futuros", value: visEvents.filter((e) => e.status !== "Realizado").length, accent: ROSE },
              isAgency
                ? { label: "Em negociação", value: brl(pipelineValue), accent: GREEN, money: true }
                : { label: "Aguardando você", value: pendingApproval.length, accent: AMBER },
            ].map((m) => (
              <Card key={m.label} style={{ padding: 12 }}>
                <div style={{ fontSize: 11.5, color: "#76777F", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: m.money ? 18 : 24, fontWeight: 700, color: m.accent }}>{m.value}</div>
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
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Próximos eventos</div>
              {visEvents.filter((e) => e.status !== "Realizado").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #F0F0EC", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{e.date.split("-").reverse().join("/")} · {e.type}</div>
                  </div>
                  <Pill label={e.status} />
                </div>
              ))}
              {visEvents.filter((e) => e.status !== "Realizado").length === 0 && <div style={{ fontSize: 12.5, color: "#9A9BA2" }}>Nenhum evento futuro.</div>}
            </Card>
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Prazos mais próximos</div>
              {visProjects.filter((p) => p.deadline && p.status !== "Concluído").sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4).map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid #F0F0EC", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{p.client}</div>
                  </div>
                  <DeadlineTag deadline={p.deadline} />
                </div>
              ))}
              {visProjects.filter((p) => p.deadline && p.status !== "Concluído").length === 0 && <div style={{ fontSize: 12.5, color: "#9A9BA2" }}>Nenhum prazo cadastrado.</div>}
            </Card>
            {isAgency && (
              <Card>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>Clientes</div>
                {data.clients.map((c) => (
                  <div key={c} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #F0F0EC" }}>{c}</div>
                ))}
                {noClients && <div style={{ fontSize: 12.5, color: "#9A9BA2", marginBottom: 6 }}>Cadastre seu primeiro cliente para liberar projetos, campanhas e eventos.</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Nome do novo cliente" value={forms.newClient} onChange={(e) => setF("newClient", e.target.value)} onKeyDown={(e) => e.key === "Enter" && addClient()} />
                  <button style={btnStyle} onClick={addClient}>+</button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "projetos" && (
        <div>
          {isAgency && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 2, minWidth: 150 }} placeholder={noClients ? "Cadastre um cliente primeiro (Visão geral)" : "Nome do novo projeto"} value={forms.proj} onChange={(e) => setF("proj", e.target.value)} disabled={noClients} />
              <select style={inputStyle} value={forms.projClient} onChange={(e) => setF("projClient", e.target.value)} disabled={noClients}>
                {data.clients.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input type="date" style={inputStyle} value={forms.projDeadline} onChange={(e) => setF("projDeadline", e.target.value)} title="Prazo de entrega" disabled={noClients} />
              <input type="number" style={{ ...inputStyle, width: 110 }} placeholder="Valor (R$)" value={forms.projValue} onChange={(e) => setF("projValue", e.target.value)} disabled={noClients} />
              <button style={btnStyle} onClick={addProject} disabled={noClients}>Adicionar</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {PROJECT_STATUSES.map((status) => {
              const items = visProjects.filter((p) => p.status === status);
              return (
                <div key={status} style={{ minWidth: isMobile ? 200 : 185, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}><Pill label={status} /> <span style={{ fontSize: 11.5, color: "#9A9BA2" }}>{items.length}</span></div>
                  {items.map((p) => (
                    <Card key={p.id} style={{ padding: 11, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9A9BA2", marginBottom: 4 }}>{p.client}{isAgency && p.value ? ` · ${brl(p.value)}` : ""}</div>
                      <div style={{ marginBottom: 8 }}><DeadlineTag deadline={p.status !== "Concluído" ? p.deadline : ""} /></div>
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

      {tab === "campanhas" && (
        <div>
          {isAgency && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder={noClients ? "Cadastre um cliente primeiro (Visão geral)" : "Nome da nova campanha"} value={forms.camp} onChange={(e) => setF("camp", e.target.value)} disabled={noClients} />
              <select style={inputStyle} value={forms.campClient} onChange={(e) => setF("campClient", e.target.value)} disabled={noClients}>
                {data.clients.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button style={btnStyle} onClick={addCampaign} disabled={noClients}>Adicionar</button>
            </div>
          )}
          {visCampaigns.map((c) => (
            <Card key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{c.client}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.active ? GREEN : "#9A9BA2" }}>{c.active ? "Ativa" : "Pausada"}</span>
                {isAgency && (
                  <button
                    onClick={() => toggleCampaign(c.id)}
                    style={{ width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer", position: "relative", background: c.active ? GREEN : "#D5D5CF", transition: "background .2s" }}
                  >
                    <span style={{ position: "absolute", top: 3, left: c.active ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </button>
                )}
              </div>
            </Card>
          ))}
          {visCampaigns.length === 0 && <div style={{ fontSize: 13, color: "#9A9BA2" }}>Nenhuma campanha por aqui ainda.</div>}
        </div>
      )}

      {tab === "eventos" && (
        <div>
          {isAgency && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 130 }} placeholder={noClients ? "Cadastre um cliente primeiro (Visão geral)" : "Nome do evento"} value={forms.ev} onChange={(e) => setF("ev", e.target.value)} disabled={noClients} />
              <input type="date" style={inputStyle} value={forms.evDate} onChange={(e) => setF("evDate", e.target.value)} disabled={noClients} />
              <select style={inputStyle} value={forms.evType} onChange={(e) => setF("evType", e.target.value)} disabled={noClients}>
                <option>Casamento</option><option>Aniversário</option><option>Corporativo</option><option>Outro</option>
              </select>
              <select style={inputStyle} value={forms.evClient} onChange={(e) => setF("evClient", e.target.value)} disabled={noClients}>
                {data.clients.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button style={btnStyle} onClick={addEvent} disabled={noClients}>Adicionar</button>
            </div>
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
                return (
                  <div key={i} style={{ minHeight: isMobile ? 50 : 62, padding: 3, borderTop: i >= 7 ? "1px solid #F2F2ED" : "none", borderLeft: i % 7 !== 0 ? "1px solid #F2F2ED" : "none", fontSize: 11, color: d ? INK : "transparent" }}>
                    {d || "."}
                    {dayEvents.map((e) => {
                      const c = statusColors(e.status);
                      return (
                        <div key={e.id} title={`${e.name} — ${e.status}`} style={{ background: e.type === "Casamento" ? ROSE_SOFT : c.bg, color: e.type === "Casamento" ? ROSE : c.fg, borderRadius: 5, padding: "2px 4px", marginTop: 3, fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isMobile ? "●" : e.name}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </Card>
          {visEvents.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
            const done = e.checklist.filter((t) => t.done).length;
            const open = expandedEvent === e.id;
            return (
              <Card key={e.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9A9BA2" }}>{e.date.split("-").reverse().join("/")} · {e.type} · {e.client}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                    {e.checklist.length === 0 && <div style={{ fontSize: 12.5, color: "#9A9BA2", marginBottom: 6 }}>Nenhuma tarefa ainda.</div>}
                    {isAgency && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nova tarefa (ex: fechar buffet)" value={forms.task} onChange={(ev2) => setF("task", ev2.target.value)} onKeyDown={(ev2) => ev2.key === "Enter" && addTask(e.id)} />
                        <button style={btnStyle} onClick={() => addTask(e.id)}>+</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "captacao" && isAgency && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input style={{ ...inputStyle, flex: 1, minWidth: 150 }} placeholder="Nome do lead (ex: Padaria do Bairro)" value={forms.lead} onChange={(e) => setF("lead", e.target.value)} />
            <select style={inputStyle} value={forms.leadInterest} onChange={(e) => setF("leadInterest", e.target.value)}>
              <option>Marketing</option><option>Evento</option>
            </select>
            <input type="number" style={{ ...inputStyle, width: 110 }} placeholder="Valor (R$)" value={forms.leadValue} onChange={(e) => setF("leadValue", e.target.value)} />
            <button style={btnStyle} onClick={addLead}>Adicionar</button>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {LEAD_STAGES.map((stage) => {
              const items = data.leads.filter((l) => l.stage === stage);
              const total = items.reduce((s, l) => s + Number(l.value || 0), 0);
              return (
                <div key={stage} style={{ minWidth: isMobile ? 195 : 175, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}><Pill label={stage} /> <span style={{ fontSize: 11, color: "#9A9BA2" }}>{total > 0 ? brl(total) : items.length}</span></div>
                  {items.map((l) => (
                    <Card key={l.id} style={{ padding: 11, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: l.interest === "Evento" ? ROSE : VIOLET, fontWeight: 600, marginBottom: 2 }}>{l.interest}</div>
                      {l.value > 0 && <div style={{ fontSize: 11.5, color: "#76777F", marginBottom: 8 }}>{brl(l.value)}</div>}
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={smallBtn} onClick={() => moveLead(l.id, -1)}>←</button>
                        <button style={smallBtn} onClick={() => moveLead(l.id, 1)}>→</button>
                      </div>
                    </Card>
                  ))}
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
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E4E4DF", display: "flex", justifyContent: "space-around", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 50 }}>
          {navItems.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit", color: tab === n.id ? VIOLET : "#9A9BA2", fontSize: 10.5, fontWeight: tab === n.id ? 700 : 500, flex: 1 }}>
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
