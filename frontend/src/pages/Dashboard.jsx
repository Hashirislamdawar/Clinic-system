import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Stethoscope,
  CalendarDays,
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  UserPlus,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../api.js";
import { compactCurrency, currency, dayMonth, formatDate } from "../lib/format.js";
import Avatar from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { StatusBadge } from "../components/ui/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_COLORS = {
  Scheduled: "#2563eb",
  Completed: "#10b981",
  Cancelled: "#ef4444",
  "No-Show": "#f59e0b",
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "var(--shadow-md)",
        fontSize: 13,
      }}
    >
      {label && <div style={{ color: "var(--text-3)", marginBottom: 2 }}>{label}</div>}
      <strong>
        {payload[0].value}
        {suffix}
      </strong>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    api
      .get("/analytics/overview")
      .then((d) => active && setData(d))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const k = data?.kpis;
  const kpis = k
    ? [
        { label: "Total Patients", value: k.patients, icon: Users, tint: "tint-blue", delta: k.growth_pct },
        { label: "Active Doctors", value: k.doctors, icon: Stethoscope, tint: "tint-violet" },
        { label: "Appointments", value: k.appointments, icon: CalendarDays, tint: "tint-sky", sub: `${k.appointments_today} today` },
        { label: "Revenue", value: compactCurrency(k.revenue), icon: Wallet, tint: "tint-emerald", raw: currency(k.revenue) },
        { label: "Patient Growth", value: k.growth_pct == null ? "—" : `${k.growth_pct}%`, icon: TrendingUp, tint: "tint-amber", delta: k.growth_pct },
        { label: "Utilization", value: `${k.utilization}%`, icon: Activity, tint: "tint-blue" },
      ]
    : [];

  const trend = (data?.appointments_trend || []).map((d) => ({
    ...d,
    label: `${dayMonth(d.date).d} ${dayMonth(d.date).m}`,
  }));
  const statusData = data?.status_distribution || [];
  const workload = data?.doctor_workload || [];

  if (failed) {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="h-page">Dashboard</h1>
            <p>Overview of clinic activity</p>
          </div>
        </div>
        <div className="card card-pad empty">
          <span className="empty-icon"><Activity size={22} /></span>
          <h4>Couldn't load analytics</h4>
          <p className="caption">The API isn't responding. Make sure the backend is running on port 8000.</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome header */}
      <div className="page-head">
        <div>
          <h1 className="h-hero">
            {greeting()} <span style={{ opacity: 0.4 }}>·</span> {user?.full_name || "there"}
          </h1>
          <p>Here's what's happening at City Clinic today.</p>
        </div>
        <div className="flex gap-8">
          <Button variant="secondary" icon={UserPlus} onClick={() => navigate("/patients")}>
            Add Patient
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate("/appointments")}>
            New Appointment
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid mb-24">
        {!data
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={132} radius={16} />)
          : kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className="kpi"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="kpi-top">
                  <span className={`kpi-icon ${kpi.tint}`}>
                    <kpi.icon />
                  </span>
                  {kpi.delta != null && (
                    <span className={`kpi-delta ${kpi.delta > 0 ? "up" : kpi.delta < 0 ? "down" : "flat"}`}>
                      {kpi.delta > 0 ? <ArrowUpRight size={13} /> : kpi.delta < 0 ? <ArrowDownRight size={13} /> : null}
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value" title={kpi.raw}>{kpi.value}</div>
                {kpi.sub && <div className="caption" style={{ marginTop: 6 }}>{kpi.sub}</div>}
              </motion.div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid-charts mb-16">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Appointments Trend</h3>
              <div className="caption">Bookings over time</div>
            </div>
          </div>
          <div className="card-pad">
            {!data ? (
              <Skeleton height={240} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#gTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Status Distribution</h3>
          </div>
          <div className="card-pad">
            {!data ? (
              <Skeleton height={240} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                      {statusData.map((s) => (
                        <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {statusData.map((s) => (
                    <div key={s.status} className="flex items-center" style={{ justifyContent: "space-between", fontSize: ".85rem" }}>
                      <span className="flex items-center gap-8">
                        <span style={{ width: 9, height: 9, borderRadius: 9, background: STATUS_COLORS[s.status] || "#94a3b8" }} />
                        {s.status}
                      </span>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lists row */}
      <div className="grid-2 mb-16">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Upcoming Appointments</h3>
              <div className="caption">Next scheduled visits</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/appointments")}>
              View all
            </Button>
          </div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {!data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={48} style={{ margin: "12px 0" }} />)
            ) : data.upcoming.length === 0 ? (
              <div className="empty" style={{ padding: "32px 0" }}>
                <span className="empty-icon"><Clock size={22} /></span>
                <h4>No upcoming appointments</h4>
              </div>
            ) : (
              data.upcoming.map((a) => {
                const dm = dayMonth(a.appointment_date);
                return (
                  <div key={a.id} className="upcoming-item">
                    <div className="date-chip">
                      <span className="d">{dm.d}</span>
                      <span className="m">{dm.m}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cell-strong">{a.patient_name}</div>
                      <div className="cell-sub">
                        {a.start_time} · {a.doctor_name}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent Activity</h3>
          </div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {!data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={40} style={{ margin: "12px 0" }} />)
            ) : data.recent_activity.length === 0 ? (
              <div className="empty" style={{ padding: "32px 0" }}>
                <span className="empty-icon"><Activity size={22} /></span>
                <h4>No activity yet</h4>
              </div>
            ) : (
              data.recent_activity.map((a) => (
                <div key={a.id} className="activity-item">
                  <Avatar name={a.patient_name || "?"} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".86rem" }}>
                      <strong>{a.patient_name}</strong> with {a.doctor_name}
                    </div>
                    <div className="cell-sub">{formatDate(a.appointment_date)}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Doctor workload */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Doctor Workload</h3>
            <div className="caption">Appointments per doctor</div>
          </div>
        </div>
        <div className="card-pad">
          {!data ? (
            <Skeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, workload.length * 46)}>
              <BarChart data={workload} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="doctor" width={130} tick={{ fontSize: 12, fill: "var(--text-2)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-3)" }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
