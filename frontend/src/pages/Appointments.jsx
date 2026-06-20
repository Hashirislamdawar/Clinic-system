import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { api } from "../api.js";
import { dayMonth } from "../lib/format.js";
import { exportCsv } from "../lib/export.js";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { StatusBadge } from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import { Input, Select, Textarea } from "../components/ui/Field.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const STATUSES = ["Scheduled", "Completed", "Cancelled", "No-Show"];
const FILTERS = ["All", ...STATUSES];
const EMPTY = { patient_id: "", doctor_id: "", appointment_date: "", start_time: "", status: "Scheduled", reason: "" };

export default function Appointments() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/appointments?page_size=200"), api.get("/patients?page_size=200"), api.get("/doctors?page_size=200")])
      .then(([a, p, d]) => { setRows(a); setPatients(p); setDoctors(d); })
      .catch((e) => toast.error("Failed to load", e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const filtered = useMemo(
    () => (filter === "All" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  // Live conflict detection: is this doctor already booked at this slot?
  const conflict = useMemo(() => {
    if (!form.doctor_id || !form.appointment_date || !form.start_time) return null;
    return rows.find(
      (a) =>
        a.id !== editing?.id &&
        a.doctor_id === Number(form.doctor_id) &&
        a.appointment_date === form.appointment_date &&
        a.start_time?.slice(0, 5) === form.start_time
    );
  }, [rows, form, editing]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ patient_id: a.patient_id, doctor_id: a.doctor_id, appointment_date: a.appointment_date, start_time: a.start_time?.slice(0, 5) || "", status: a.status, reason: a.reason || "" });
    setError(""); setOpen(true);
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (conflict) return;
    setSaving(true); setError("");
    const payload = { ...form, patient_id: Number(form.patient_id), doctor_id: Number(form.doctor_id), reason: form.reason || null };
    try {
      if (editing) { await api.put(`/appointments/${editing.id}`, payload); toast.success("Appointment updated"); }
      else { await api.post("/appointments", payload); toast.success("Appointment booked", "The slot is reserved."); }
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (a) => {
    if (!confirm("Delete this appointment?")) return;
    try { await api.del(`/appointments/${a.id}`); toast.success("Appointment deleted"); load(); }
    catch (err) { toast.error("Could not delete", err.message); }
  };

  const exportAppointments = () =>
    exportCsv("appointments.csv", rows, [
      { header: "Date", value: (r) => r.appointment_date },
      { header: "Time", value: (r) => r.start_time?.slice(0, 5) },
      { header: "Patient", value: (r) => r.patient?.full_name || "" },
      { header: "Doctor", value: (r) => r.doctor?.full_name || "" },
      { header: "Status", value: (r) => r.status },
      { header: "Reason", value: (r) => r.reason || "" },
    ]);

  const columns = [
    {
      key: "appointment_date", header: "When", sortable: true,
      render: (a) => {
        const dm = dayMonth(a.appointment_date);
        return (
          <div className="flex items-center gap-12">
            <div className="date-chip"><span className="d">{dm.d}</span><span className="m">{dm.m}</span></div>
            <div><div className="cell-strong">{a.start_time?.slice(0, 5)}</div><div className="cell-sub">{dm.m} {dm.d}</div></div>
          </div>
        );
      },
    },
    {
      key: "patient", header: "Patient", sortable: true, sortValue: (a) => a.patient?.full_name,
      render: (a) => (
        <div className="flex items-center gap-12">
          <Avatar name={a.patient?.full_name || "?"} size={32} />
          <span className="cell-strong">{a.patient?.full_name || "—"}</span>
        </div>
      ),
    },
    { key: "doctor", header: "Doctor", sortable: true, sortValue: (a) => a.doctor?.full_name, render: (a) => a.doctor?.full_name || "—" },
    { key: "reason", header: "Reason", render: (a) => <span className="cell-sub">{a.reason || "—"}</span> },
    { key: "status", header: "Status", sortable: true, render: (a) => <StatusBadge status={a.status} /> },
    {
      key: "actions", header: "", align: "right",
      render: (a) => (
        <div className="row-actions">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={(e) => { e.stopPropagation(); openEdit(a); }} aria-label="Edit" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); remove(a); }} aria-label="Delete" />
        </div>
      ),
    },
  ];

  const canBook = patients.length && doctors.length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="h-page">Appointments</h1>
          <p>{loading ? "Loading…" : `${rows.length} total · ${rows.filter((r) => r.status === "Scheduled").length} scheduled`}</p>
        </div>
        <div className="flex gap-8">
          <Button variant="secondary" icon={Download} onClick={exportAppointments} disabled={!rows.length}>Export</Button>
          <Button variant="primary" icon={Plus} onClick={openCreate} disabled={!canBook}
            title={canBook ? "" : "Add a patient and a doctor first"}>
            Book Appointment
          </Button>
        </div>
      </div>

      {/* status filter */}
      <div className="flex gap-8 mb-16" style={{ flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? "btn-secondary" : "btn-ghost"}`}
            style={filter === f ? { borderColor: "var(--blue-200)", color: "var(--blue-700)" } : {}}
            onClick={() => setFilter(f)}>
            {f}
            {f !== "All" && <span className="caption" style={{ marginLeft: 4 }}>{rows.filter((r) => r.status === f).length}</span>}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        searchKeys={["reason"]}
        searchable={false}
        emptyTitle="No appointments"
        emptyHint="Book your first appointment to see it here."
        emptyIcon={CalendarDays}
        onRowClick={openEdit}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Appointment" : "Book Appointment"}
        subtitle={editing ? "Update appointment details" : "Reserve a time slot for a patient"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} disabled={!!conflict} onClick={submit}>
              {editing ? "Save changes" : "Confirm booking"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit}>
          {error && <div className="form-banner"><AlertTriangle size={16} /> {error}</div>}
          <Select label="Patient" required name="patient_id" value={form.patient_id} onChange={change}>
            <option value="" disabled>Select patient…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
          <Select label="Doctor" required name="doctor_id" value={form.doctor_id} onChange={change}>
            <option value="" disabled>Select doctor…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}{d.specialization ? ` — ${d.specialization.name}` : ""}</option>)}
          </Select>
          <div className="field-row">
            <Input label="Date" required type="date" name="appointment_date" value={form.appointment_date} onChange={change} />
            <Input label="Time" required type="time" name="start_time" value={form.start_time} onChange={change} />
          </div>

          {/* live conflict / availability feedback */}
          {form.doctor_id && form.appointment_date && form.start_time && (
            conflict ? (
              <div className="form-banner" style={{ background: "var(--amber-50)", borderColor: "var(--amber-100)", color: "var(--amber-600)" }}>
                <AlertTriangle size={16} />
                This doctor is already booked at {form.start_time}. Pick another time.
              </div>
            ) : (
              <div className="form-banner" style={{ background: "var(--emerald-50)", borderColor: "var(--emerald-100)", color: "var(--emerald-600)" }}>
                <CheckCircle2 size={16} /> This slot is available.
              </div>
            )
          )}

          <Select label="Status" name="status" value={form.status} onChange={change}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Textarea label="Reason for visit" name="reason" value={form.reason} onChange={change} rows={2} placeholder="optional" />
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
}
