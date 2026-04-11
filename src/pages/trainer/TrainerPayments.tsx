import { useState, useEffect, useMemo } from "react";
import {
  DollarSign, Wallet, CreditCard, Plus, Search, Filter,
  FileText, X, Save, TrendingUp, ArrowUpRight, Banknote,
  Smartphone, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../../api/client";
import { toast } from "../../utils/toast";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Payment {
  id: number;
  name: string;
  lastname: string;
  final_amount: number;
  method: string;
  created_at: string;
  notes?: string;
  plan_name?: string;
}

interface Client { id: number; name: string; lastname: string; }
interface MembershipPlan { id: number; name: string; price: number; }

interface NewPaymentForm {
  client_id: string; plan_id: string; amount: string;
  discount: string; method: string; notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const METHODS = ["Efectivo", "Transferencia", "Débito", "Crédito", "MercadoPago"];

const METHOD_META: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Efectivo:      { color: "text-green-400",  bg: "bg-green-500/15",   icon: Banknote },
  Transferencia: { color: "text-blue-400",   bg: "bg-blue-500/15",    icon: ArrowUpRight },
  Débito:        { color: "text-purple-400", bg: "bg-purple-500/15",  icon: CreditCard },
  Crédito:       { color: "text-pink-400",   bg: "bg-pink-500/15",    icon: CreditCard },
  MercadoPago:   { color: "text-sky-400",    bg: "bg-sky-500/15",     icon: Smartphone },
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#0ea5e9", "#f59e0b"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

function buildMonthOptions() {
  const opts = [{ value: "all", label: "Todos los meses" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({
      value,
      label: d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

// ─── Register Modal ───────────────────────────────────────────────────────────

function RegisterPaymentModal({
  clients, plans, onClose, onSuccess,
}: { clients: Client[]; plans: MembershipPlan[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<NewPaymentForm>({
    client_id: "", plan_id: "", amount: "", discount: "0", method: "Efectivo", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => String(p.id) === form.plan_id);

  useEffect(() => {
    if (selectedPlan) setForm((f) => ({ ...f, amount: String(selectedPlan.price) }));
  }, [form.plan_id]);

  const finalAmount = useMemo(() => {
    return Math.max(0, (parseFloat(form.amount) || 0) - (parseFloat(form.discount) || 0));
  }, [form.amount, form.discount]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) { setError("Seleccioná un cliente."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Ingresá un monto válido."); return; }
    setSaving(true);
    setError(null);
    try {
      if (form.plan_id && selectedPlan) {
        await api.assignMembership({
          client_id: Number(form.client_id),
          plan_id: Number(form.plan_id),
          start_date: new Date().toISOString().split("T")[0],
        });
      }
      await api.createPayment({
        client_id: Number(form.client_id),
        amount: parseFloat(form.amount),
        discount: parseFloat(form.discount) || 0,
        final_amount: finalAmount,
        method: form.method,
        notes: form.notes || (selectedPlan ? `Plan: ${selectedPlan.name}` : undefined),
      });
      toast.success("Pago registrado correctamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar el pago.");
    } finally {
      setSaving(false);
    }
  }

  const MethodIcon = METHOD_META[form.method]?.icon ?? CreditCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md glass-panel rounded-2xl p-6 z-10 shadow-2xl"
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="font-display font-black text-white uppercase tracking-wider text-lg">Registrar Pago</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Cliente *</label>
            <select name="client_id" value={form.client_id} onChange={handleChange} className="form-input" required>
              <option value="">Seleccioná un cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.lastname}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Plan de membresía (opcional)</label>
            <select name="plan_id" value={form.plan_id} onChange={handleChange} className="form-input">
              <option value="">Sin plan asociado</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Monto *</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange}
                min="0" step="0.01" placeholder="0" className="form-input" required />
            </div>
            <div>
              <label className="label-field">Descuento</label>
              <input type="number" name="discount" value={form.discount} onChange={handleChange}
                min="0" step="0.01" placeholder="0" className="form-input" />
            </div>
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/25">
            <span className="text-xs font-body font-black text-zinc-400 uppercase tracking-widest">Total a cobrar</span>
            <span className="font-display font-black text-orange-400 text-2xl">{fmt(finalAmount)}</span>
          </div>

          <div>
            <label className="label-field">Método de pago *</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const meta = METHOD_META[m] ?? { color: "text-zinc-400", bg: "bg-zinc-800", icon: CreditCard };
                const Icon = meta.icon;
                const active = form.method === m;
                return (
                  <button key={m} type="button"
                    onClick={() => setForm(f => ({ ...f, method: m }))}
                    className={`py-2.5 px-2 rounded-xl border text-[10px] font-body font-black uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${active ? `${meta.bg} border-current ${meta.color}` : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label-field">Notas (opcional)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={2} placeholder="Observaciones…" className="form-input resize-none" />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body font-bold">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <span className="animate-spin rounded-full w-4 h-4 border-2 border-white/30 border-t-white" />
                : <Save className="w-4 h-4" />}
              {saving ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrainerPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  async function loadAll() {
    try {
      const [pRes, cRes, plRes] = await Promise.all([
        api.getPayments(),
        api.getClients(),
        api.getMembershipPlans(),
      ]);
      // CRITICAL: parse final_amount as float (MySQL returns strings)
      const parsed = (pRes.data ?? []).map((p: any) => ({
        ...p,
        final_amount: parseFloat(p.final_amount) || 0,
      }));
      setPayments(parsed);
      setClients(cRes.data ?? []);
      setPlans(plRes.data ?? []);
    } catch {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  async function reloadPayments() {
    try {
      const pRes = await api.getPayments();
      const parsed = (pRes.data ?? []).map((p: any) => ({
        ...p,
        final_amount: parseFloat(p.final_amount) || 0,
      }));
      setPayments(parsed);
    } catch { /* silenced */ }
  }

  useEffect(() => { loadAll(); }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const nowMonth = today.slice(0, 7);
    const prevMonth = (() => {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    const total = payments.reduce((s, p) => s + p.final_amount, 0);
    const thisMonth = payments.filter(p => p.created_at.slice(0, 7) === nowMonth)
      .reduce((s, p) => s + p.final_amount, 0);
    const lastMonth = payments.filter(p => p.created_at.slice(0, 7) === prevMonth)
      .reduce((s, p) => s + p.final_amount, 0);
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

    // By method
    const byMethod: Record<string, number> = {};
    payments.forEach(p => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.final_amount; });
    const methodChart = Object.entries(byMethod).map(([name, value]) => ({ name, value }));

    // By day (last 14 days)
    const byDay: Record<string, number> = {};
    payments.forEach(p => {
      const day = p.created_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + p.final_amount;
    });
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return { day: d.getDate(), total: byDay[key] ?? 0 };
    });

    // Top clients
    const clientMap: Record<string, { name: string; total: number; count: number }> = {};
    payments.forEach(p => {
      const key = `${p.name} ${p.lastname}`;
      if (!clientMap[key]) clientMap[key] = { name: key, total: 0, count: 0 };
      clientMap[key].total += p.final_amount;
      clientMap[key].count++;
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);

    return { total, thisMonth, lastMonth, growth, transactions: payments.length, methodChart, last14, topClients };
  }, [payments]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const fullName = `${p.name} ${p.lastname}`.toLowerCase();
      const matchSearch = fullName.includes(search.toLowerCase());
      const matchMonth = monthFilter === "all" || p.created_at.slice(0, 7) === monthFilter;
      return matchSearch && matchMonth;
    });
  }, [payments, search, monthFilter]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-orange-500 font-display text-2xl tracking-[0.3em] font-black animate-pulse uppercase">
      Cargando Caja…
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-wider leading-none">
            Monitor de <span className="text-orange-500">Caja</span>
          </h1>
          <p className="text-xs font-body font-black text-zinc-500 uppercase tracking-widest mt-1">
            Gestión de cobros y pagos de tus socios
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Registrar Pago
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total acumulado", value: fmt(stats.total), sub: `${stats.transactions} operaciones`, icon: Wallet, color: "orange" },
          {
            label: "Este mes", value: fmt(stats.thisMonth), icon: TrendingUp, color: "green",
            sub: stats.growth !== null
              ? `${stats.growth >= 0 ? "+" : ""}${stats.growth}% vs mes anterior`
              : "Primer mes con datos",
            positive: stats.growth !== null && stats.growth >= 0,
          },
          { label: "Operaciones", value: String(stats.transactions), sub: "pagos registrados", icon: FileText, color: "blue" },
          {
            label: "Promedio por pago",
            value: stats.transactions > 0 ? fmt(stats.total / stats.transactions) : fmt(0),
            sub: "por transacción", icon: DollarSign, color: "purple",
          },
        ].map((card, i) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            orange: "bg-orange-500/15 text-orange-500",
            green:  "bg-green-500/15 text-green-400",
            blue:   "bg-blue-500/15 text-blue-400",
            purple: "bg-purple-500/15 text-purple-400",
          };
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="glass-panel p-4 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-body font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
                <p className="text-xl font-display font-black text-white leading-tight mt-0.5">{card.value}</p>
                {card.sub && (
                  <p className={`text-[10px] font-body mt-0.5 font-bold flex items-center gap-1 ${
                    'positive' in card ? (card.positive ? 'text-green-400' : 'text-red-400') : 'text-zinc-500'
                  }`}>
                    {'positive' in card && card.positive !== undefined && <ChevronUp className={`w-3 h-3 ${card.positive ? '' : 'rotate-180'}`} />}
                    {card.sub}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart - last 14 days */}
        <div className="lg:col-span-2 glass-panel p-5">
          <h3 className="text-[10px] font-body font-black text-zinc-400 uppercase tracking-widest mb-4">
            Ingresos — últimos 14 días
          </h3>
          {stats.last14.every(d => d.total === 0) ? (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-xs font-body font-bold uppercase tracking-widest">
              Sin movimientos recientes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={stats.last14} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 11 }}
                  formatter={(v: any) => [fmt(v), "Ingreso"]}
                  labelFormatter={(l) => `Día ${l}`}
                />
                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]}
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie - by method */}
        <div className="glass-panel p-5">
          <h3 className="text-[10px] font-body font-black text-zinc-400 uppercase tracking-widest mb-4">
            Por método de pago
          </h3>
          {stats.methodChart.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-600 text-xs font-body font-bold uppercase tracking-widest">Sin datos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={stats.methodChart} dataKey="value" cx="50%" cy="50%"
                    innerRadius={32} outerRadius={50} paddingAngle={3}>
                    {stats.methodChart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, fontSize: 11 }}
                    formatter={(v: any) => [fmt(v)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1">
                {stats.methodChart.map((m, i) => (
                  <li key={m.name} className="flex items-center justify-between text-[10px] font-body">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {m.name}
                    </span>
                    <span className="text-white font-bold">{fmt(m.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Top clients + Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top clients */}
        <div className="glass-panel p-5">
          <h3 className="text-[10px] font-body font-black text-zinc-400 uppercase tracking-widest mb-4">
            Top socios por ingreso
          </h3>
          {stats.topClients.length === 0 ? (
            <p className="text-zinc-600 text-xs font-body text-center py-4">Sin datos</p>
          ) : (
            <ul className="space-y-3">
              {stats.topClients.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-display font-black text-xs flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] font-body text-zinc-500">{c.count} pago{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-display font-black text-orange-400 flex-shrink-0">{fmt(c.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filters + Table */}
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-zinc-800/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Buscar por cliente…" value={search}
                onChange={e => setSearch(e.target.value)} className="form-input pl-9 w-full" />
            </div>
            <div className="relative sm:w-52">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                className="form-input pl-9 w-full">
                {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Table header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/40">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-body font-black text-[10px] text-zinc-400 uppercase tracking-widest">Historial</span>
            <span className="ml-auto text-[10px] font-body text-zinc-600">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Rows */}
          <div className="overflow-y-auto max-h-72 flex-1">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-zinc-600 font-body text-xs font-bold uppercase tracking-widest">
                {payments.length === 0 ? "Aún no hay pagos registrados" : "Sin resultados para ese filtro"}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/40">
                {filtered.map((p) => {
                  const meta = METHOD_META[p.method] ?? { color: "text-zinc-400", bg: "bg-zinc-800", icon: CreditCard };
                  const Icon = meta.icon;
                  return (
                    <div key={p.id} className="px-5 py-3 hover:bg-zinc-800/25 transition-colors flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-bold text-white truncate">{p.name} {p.lastname}</p>
                        <p className="text-[10px] font-body text-zinc-500">
                          #{p.id} · {p.plan_name ?? "Sin plan"} · {fmtDate(p.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className={`font-display font-black text-base ${meta.color}`}>{fmt(p.final_amount)}</p>
                        <p className={`text-[10px] font-body font-bold uppercase ${meta.color} opacity-70`}>{p.method}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RegisterPaymentModal
            clients={clients} plans={plans}
            onClose={() => setShowModal(false)}
            onSuccess={reloadPayments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
