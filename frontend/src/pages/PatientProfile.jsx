import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, MapPin, Cake, CalendarDays, CheckCircle2, Clock, XCircle, CalendarX,
} from "lucide-react";
import { api } from "../api.js";
import { age, dayMonth } from "../lib/format.js";
import Avatar from "../components/ui/Avatar.jsx";
import { Badge, StatusBadge } from "../components/ui/Badge.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Button from "../components/ui/Button.jsx";

const GENDER_TONE = { Male: "blue", Female: "violet", Other: "slate" };

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    api.get(`/patients/${id}/profile`).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="card card-pad empty">
        <span className="empty-icon"><CalendarX size={22} /></span>
        <h4>{error}</h4>
        <Button variant="secondary" onClick={() => navigate("/patients")}>Back to patients</Button>
      </div>
    );
  }
  if (!data) return <Skeleton height={400} radius={16} />;

  const p = data.patient;
  const stats = [
    { label: "Total Visits", value: data.stats.total, icon: CalendarDays, tint: "tint-blue" },
    { label: "Upcoming", value: data.stats.upcoming, icon: Clock, tint: "tint-amber" },
    { label: "Completed", value: data.stats.completed, icon: CheckCircle2, tint: "tint-emerald" },
    { label: "Cancelled", value: data.stats.cancelled, icon: XCircle, tint: "tint-red" },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate("/patients")}>
        Back to patients
      </Button>

      <div className="profile-head card">
        <Avatar name={p.full_name} size={72} />
        <div className="profile-id">
          <h1 className="h-page">{p.full_name}</h1>
          <div className="profile-meta">
            <Badge tone={GENDER_TONE[p.gender]}>{p.gender}</Badge>
            <span><Cake /> {age(p.date_of_birth)} years</span>
          </div>
          <div className="profile-contacts">
            <span><Mail /> {p.email || "No email"}</span>
            <span><Phone /> {p.phone}</span>
            <span><MapPin /> {p.address || "No address"}</span>
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
            <div className="caption">All visits, most recent first</div>
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
                    <div className="cell-strong">{a.doctor?.full_name || "—"}</div>
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
