import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Stethoscope, Download } from "lucide-react";
import { api } from "../api.js";
import { currency } from "../lib/format.js";
import { exportCsv } from "../lib/export.js";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import { Input, Select } from "../components/ui/Field.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY = { full_name: "", email: "", phone: "", specialization_id: "", consultation_fee: "" };

export default function Doctors() {
  const toast = useToast();
  const navigate = useNavigate();
  const { can } = useAuth();
  const isAdmin = can("Admin");
  const [rows, setRows] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/doctors?page_size=200"), api.get("/specializations")])
      .then(([d, s]) => { setRows(d); setSpecs(s); })
      .catch((e) => toast.error("Failed to load", e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY, specialization_id: specs[0]?.id || "" }); setError(""); setOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ full_name: d.full_name, email: d.email, phone: d.phone || "", specialization_id: d.specialization_id, consultation_fee: d.consultation_fee });
    setError(""); setOpen(true);
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = { ...form, specialization_id: Number(form.specialization_id), consultation_fee: Number(form.consultation_fee || 0), phone: form.phone || null };
    try {
      if (editing) { await api.put(`/doctors/${editing.id}`, payload); toast.success("Doctor updated", form.full_name); }
      else { await api.post("/doctors", payload); toast.success("Doctor added", form.full_name); }
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (d) => {
    if (!confirm(`Delete "${d.full_name}"?`)) return;
    try { await api.del(`/doctors/${d.id}`); toast.success("Doctor deleted", d.full_name); load(); }
    catch (err) { toast.error("Could not delete", err.message); }
  };

  const exportDoctors = () =>
    exportCsv("doctors.csv", rows, [
      { header: "Name", value: (r) => r.full_name },
      { header: "Specialization", value: (r) => r.specialization?.name || "" },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone || "" },
      { header: "Consultation Fee", value: (r) => r.consultation_fee },
    ]);

  const columns = [
    {
      key: "full_name", header: "Doctor", sortable: true,
      render: (d) => (
        <div className="flex items-center gap-12">
          <Avatar name={d.full_name} size={36} />
          <div>
            <div className="cell-strong">{d.full_name}</div>
            <div className="cell-sub">{d.email}</div>
          </div>
        </div>
      ),
    },
    { key: "spec", header: "Specialization", sortable: true, sortValue: (d) => d.specialization?.name, render: (d) => <Badge tone="emerald">{d.specialization?.name || "—"}</Badge> },
    { key: "phone", header: "Phone", render: (d) => d.phone || "—" },
    { key: "consultation_fee", header: "Fee", sortable: true, align: "right", sortValue: (d) => Number(d.consultation_fee), render: (d) => <span className="tnum">{currency(d.consultation_fee)}</span> },
    ...(isAdmin
      ? [{
          key: "actions", header: "", align: "right",
          render: (d) => (
            <div className="row-actions">
              <Button variant="ghost" size="sm" icon={Pencil} onClick={(e) => { e.stopPropagation(); openEdit(d); }} aria-label="Edit" />
              <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); remove(d); }} aria-label="Delete" />
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="h-page">Doctors</h1>
          <p>{loading ? "Loading…" : `${rows.length} doctor${rows.length === 1 ? "" : "s"} on staff`}</p>
        </div>
        <div className="flex gap-8">
          <Button variant="secondary" icon={Download} onClick={exportDoctors} disabled={!rows.length}>Export</Button>
          {isAdmin && <Button variant="primary" icon={Plus} onClick={openCreate}>Add Doctor</Button>}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchKeys={["full_name", "email", "phone"]}
        searchPlaceholder="Search doctors…"
        emptyTitle="No doctors yet"
        emptyHint="Add a doctor to start scheduling."
        emptyIcon={Stethoscope}
        onRowClick={(d) => navigate(`/doctors/${d.id}`)}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Doctor" : "Add Doctor"}
        subtitle={editing ? editing.full_name : "Register a new doctor"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={submit}>{editing ? "Save changes" : "Add doctor"}</Button>
          </>
        }
      >
        <form onSubmit={submit}>
          {error && <div className="form-banner">{error}</div>}
          <Input label="Full name" required name="full_name" value={form.full_name} onChange={change} placeholder="e.g. Dr. Ayesha Khan" />
          <Select label="Specialization" required name="specialization_id" value={form.specialization_id} onChange={change}>
            <option value="" disabled>Select…</option>
            {specs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Email" required type="email" name="email" value={form.email} onChange={change} placeholder="name@cityclinic.com" />
          <div className="field-row">
            <Input label="Phone" name="phone" value={form.phone} onChange={change} placeholder="optional" />
            <Input label="Consultation fee (PKR)" type="number" min="0" step="0.01" name="consultation_fee" value={form.consultation_fee} onChange={change} placeholder="0" />
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
}
