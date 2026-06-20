import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Wallet, CalendarDays, CheckCircle2, Clock, TrendingUp, CalendarX,
} from "lucide-react";
import { api } from "../api.js";
import { currency, compactCurrency, dayMonth } from "../lib/format.js";
import Avatar from "../components/ui/Avatar.jsx";
import { Badge, StatusBadge } from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Button from "../components/ui/Button.jsx";

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    api.get(`/doctors/${id}/profile`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="card card-pad empty">
        <span className="empty-icon"><CalendarX size={22} /></span>
        <h4>{error}</h4>
        <Button variant="secondary" onClick={() => navigate("/doctors")}>Back to doctors</Button>
      </div>
    );
  }
  if (!data) return <Skeleton height={400} radius={16} />;

  const d = data.doctor;
  const stats = [
    { label: "Total Appointments", value: data.stats.total, icon: CalendarDays, tint: "tint-blue" },
    { label: "Completed", value: data.stats.completed, icon: CheckCircle2, tint: "tint-emerald" },
    { label: "Upcoming", value: data.stats.upcoming, icon: Clock, tint: "tint-amber" },
    { label: "Revenue", value: compactCurrency(data.stats.revenue), icon: Wallet, tint: "tint-violet" },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/doctors")}>
        Back to doctors
      </Button>

      <div className="profile-head card">
        <Avatar name={d.full_name} size={72} />
        <div className="profile-id">
          <h1 className="h-page">{d.full_name}</h1>
          <div className="profile-meta">
            <Badge tone="emerald">{d.specialization?.name || "—"}</Badge>
            <span><Wallet /> {currency(d.consultation_fee)} / visit</span>
          </div>
          <div className="profile-contacts">
            <span><Mail /> {d.email}</span>
            <span><Phone /> {d.phone || "No phone"}</span>
          </div>
        </div>
      </div>

      <div className="kpi-grid mb-16">
        {stats.map((s) => (
          <div key={s.label} className="kpi">
            <div className="kpi-top">
              <span className={`kpi-icon ${s.tint}`}><s.icon /></span>
            </div>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Appointment History</h3>
            <div className="caption">All booked visits with this doctor</div>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {data.appointments.length === 0 ? (
            <div className="empty" style={{ padding: "32px 0" }}>
              <span className="empty-icon"><CalendarDays size={22} /></span>
              <h4>No appointments yet</h4>
            </div>
          ) : (
            data.appointments.map((a) => {
              const dm = dayMonth(a.appointment_date);
              return (
                <div key={a.id} className="upcoming-item">
                  <div className="date-chip"><span className="d">{dm.d}</span><span className="m">{dm.m}</span></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong">{a.patient?.full_name || "—"}</div>
                    <div className="cell-sub">{a.start_time?.slice(0, 5)} · {a.reason || "No reason given"}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
