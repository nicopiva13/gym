import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Wallet,
  CreditCard,
  Plus,
  Search,
  Filter,
  FileText,
  X,
  Save,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Client {
  id: number;
  name: string;
  lastname: string;
}

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
}

interface DailySummary {
  total: number;
  breakdown: { method: string; total: number }[];
}

interface NewPaymentForm {
  client_id: string;
  plan_id: string;
  amount: string;
  discount: string;
  method: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHODS = ["Efectivo", "Transferencia", "Débito", "Crédito", "Otro"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [{ value: "all", label: "Todos los meses" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: getMonthLabel(d.getFullYear(), d.getMonth()) });
  }
  return options;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-panel p-5 flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-orange-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-body text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-display font-semibold text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-500 font-body mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DailySummaryCard({ summary, date }: { summary: DailySummary | null; date: string }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wide">
          Resumen del día — {formatDate(date)}
        </h3>
      </div>
      {summary === null ? (
        <p className="text-zinc-500 font-body text-sm">Cargando…</p>
      ) : summary.total === 0 && summary.breakdown.length === 0 ? (
        <p className="text-zinc-500 font-body text-sm">Sin movimientos hoy.</p>
      ) : (
        <>
          <p className="text-2xl font-display font-bold text-orange-400 mb-3">
            {formatCurrency(summary.total)}
          </p>
          <ul className="space-y-1.5">
            {summary.breakdown.map((b) => (
              <li key={b.method} className="flex justify-between text-sm font-body">
                <span className="text-zinc-400">{b.method}</span>
                <span className="text-white font-medium">{formatCurrency(b.total)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── Register Payment Modal ───────────────────────────────────────────────────

function RegisterPaymentModal({
  clients,
  plans,
  onClose,
  onSuccess,
}: {
  clients: Client[];
  plans: MembershipPlan[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<NewPaymentForm>({
    client_id: "",
    plan_id: "",
    amount: "",
    discount: "0",
    method: "Efectivo",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => String(p.id) === form.plan_id);

  useEffect(() => {
    if (selectedPlan) {
      setForm((f) => ({ ...f, amount: String(selectedPlan.price) }));
    }
  }, [form.plan_id]);

  const finalAmount = useMemo(() => {
    const amt = parseFloat(form.amount) || 0;
    const disc = parseFloat(form.discount) || 0;
    return Math.max(0, amt - disc);
  }, [form.amount, form.discount]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      setError("Seleccioná un cliente.");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createPayment({
        client_id: Number(form.client_id),
        amount: parseFloat(form.amount),
        discount: parseFloat(form.discount) || 0,
        final_amount: finalAmount,
        method: form.method,
        notes: form.notes,
      });

      if (form.plan_id && selectedPlan) {
        const today = new Date().toISOString().split("T")[0];
        await api.assignMembership({
          client_id: Number(form.client_id),
          plan_id: Number(form.plan_id),
          start_date: today,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error al registrar el pago.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-lg glass-panel p-6 z-10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <h2 className="font-display font-semibold text-white text-lg uppercase tracking-wide">
              Registrar Pago
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="label-field">Cliente *</label>
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Seleccioná un cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.lastname}
                </option>
              ))}
            </select>
          </div>

          {/* Plan (optional) */}
          <div>
            <label className="label-field">Plan (opcional)</label>
            <select
              name="plan_id"
              value={form.plan_id}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Sin plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount + Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Monto *</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="label-field">Descuento</label>
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>

          {/* Final amount preview */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="text-sm font-body text-zinc-400">Total a cobrar</span>
            <span className="font-display font-bold text-orange-400 text-lg">
              {formatCurrency(finalAmount)}
            </span>
          </div>

          {/* Method */}
          <div>
            <label className="label-field">Método de pago *</label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="form-input"
              required
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Notas (opcional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Observaciones…"
              className="form-input resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 font-body bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-spin rounded-full w-4 h-4 border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
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
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  // ── Data loading ────────────────────────────────────────────────────────────

  async function loadPayments() {
    try {
      const res = await api.getPayments();
      setPayments(res.data ?? []);
    } catch {
      setPayments([]);
    }
  }

  async function loadSupport() {
    try {
      const [clientsRes, plansRes, summaryRes] = await Promise.all([
        api.getClients(),
        api.getMembershipPlans(),
        api.getDailySummary(todayStr),
      ]);
      setClients(clientsRes.data ?? []);
      setPlans(plansRes.data ?? []);
      setDailySummary(summaryRes.data ?? { total: 0, breakdown: [] });
    } catch {
      setDailySummary({ total: 0, breakdown: [] });
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPayments(), loadSupport()]).finally(() => setLoading(false));
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const fullName = `${p.name} ${p.lastname}`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase());

      let matchesMonth = true;
      if (monthFilter !== "all") {
        const paymentMonth = p.created_at.slice(0, 7);
        matchesMonth = paymentMonth === monthFilter;
      }

      return matchesSearch && matchesMonth;
    });
  }, [payments, search, monthFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + p.final_amount, 0);
    const transactions = payments.length;

    const nowMonth = todayStr.slice(0, 7);
    const thisMonth = payments
      .filter((p) => p.created_at.slice(0, 7) === nowMonth)
      .reduce((s, p) => s + p.final_amount, 0);

    return { total, transactions, thisMonth };
  }, [payments]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wide text-white">
              Mis Cobros
            </h1>
            <p className="font-body text-sm text-zinc-400 mt-0.5">
              Historial de pagos de tus clientes
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Registrar pago
          </button>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-panel p-5 h-20 animate-pulse bg-zinc-800/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={DollarSign}
              label="Ingresos totales"
              value={formatCurrency(stats.total)}
              sub={`${stats.transactions} transacciones`}
            />
            <StatCard
              icon={TrendingUp}
              label="Este mes"
              value={formatCurrency(stats.thisMonth)}
              sub={new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            />
            <StatCard
              icon={Wallet}
              label="Transacciones"
              value={String(stats.transactions)}
              sub="en total"
            />
          </div>
        )}

        {/* Daily summary + filters row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily summary */}
          <div className="lg:col-span-1">
            <DailySummaryCard summary={dailySummary} date={todayStr} />
          </div>

          {/* Filters */}
          <div className="lg:col-span-2 glass-panel p-5 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 w-full"
              />
            </div>

            {/* Month filter */}
            <div className="relative sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="form-input pl-9 w-full"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payments table */}
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800/60">
            <FileText className="w-4 h-4 text-orange-500" />
            <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wide">
              Pagos
            </h2>
            <span className="ml-auto text-xs font-body text-zinc-500">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 font-body">Cargando pagos…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-body">
              {payments.length === 0
                ? "Aún no hay pagos registrados."
                : "No se encontraron pagos con esos filtros."}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800/60">
                      <th className="px-5 py-3 text-left font-medium">Ref #</th>
                      <th className="px-5 py-3 text-left font-medium">Cliente</th>
                      <th className="px-5 py-3 text-left font-medium">Plan</th>
                      <th className="px-5 py-3 text-right font-medium">Monto</th>
                      <th className="px-5 py-3 text-left font-medium">Método</th>
                      <th className="px-5 py-3 text-left font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-zinc-500">#{p.id}</td>
                        <td className="px-5 py-3 text-white font-medium">
                          {p.name} {p.lastname}
                        </td>
                        <td className="px-5 py-3 text-zinc-400">
                          {p.plan_name ?? <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-orange-400 font-semibold">
                          {formatCurrency(p.final_amount)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
                            <CreditCard className="w-3 h-3" />
                            {p.method}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-400">{formatDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-zinc-800/40">
                {filtered.map((p) => (
                  <div key={p.id} className="px-4 py-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body font-medium text-white">
                        {p.name} {p.lastname}
                      </span>
                      <span className="font-display font-semibold text-orange-400">
                        {formatCurrency(p.final_amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-body text-zinc-500">
                      <span>#{p.id}</span>
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {p.method}
                      </span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                    {p.plan_name && (
                      <p className="text-xs font-body text-zinc-500">{p.plan_name}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Register payment modal */}
      <AnimatePresence>
        {showModal && (
          <RegisterPaymentModal
            clients={clients}
            plans={plans}
            onClose={() => setShowModal(false)}
            onSuccess={loadPayments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
