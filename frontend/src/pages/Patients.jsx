import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, UsersRound, Download } from "lucide-react";
import { api } from "../api.js";
import { age, formatDate } from "../lib/format.js";
import { exportCsv } from "../lib/export.js";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import { Input, Select, Textarea } from "../components/ui/Field.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const EMPTY = { full_name: "", email: "", phone: "", gender: "Male", date_of_birth: "", address: "" };
const GENDER_TONE = { Male: "blue", Female: "violet", Other: "slate" };

export default function Patients() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/patients?page_size=200").then(setRows).catch((e) => toast.error("Failed to load", e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ full_name: p.full_name, email: p.email || "", phone: p.phone, gender: p.gender, date_of_birth: p.date_of_birth, address: p.address || "" });
    setError(""); setOpen(true);
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = { ...form, email: form.email || null };
    try {
      if (editing) {
        await api.put(`/patients/${editing.id}`, payload);
        toast.success("Patient updated", form.full_name);
      } else {
        await api.post("/patients", payload);
        toast.success("Patient added", form.full_name);
      }
      setOpen(false); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.full_name}"? This removes their appointments too.`)) return;
    try { await api.del(`/patients/${p.id}`); toast.success("Patient deleted", p.full_name); load(); }
    catch (err) { toast.error("Could not delete", err.message); }
  };

  const exportPatients = () =>
    exportCsv("patients.csv", rows, [
      { header: "Name", value: (r) => r.full_name },
      { header: "Gender", value: (r) => r.gender },
      { header: "Date of Birth", value: (r) => r.date_of_birth },
      { header: "Phone", value: (r) => r.phone },
      { header: "Email", value: (r) => r.email || "" },
      { header: "Address", value: (r) => r.address || "" },
    ]);

  const columns = [
    {
      key: "full_name", header: "Patient", sortable: true,
      render: (p) => (
        <div className="flex items-center gap-12">
          <Avatar name={p.full_name} size={36} />
          <div>
            <div className="cell-strong">{p.full_name}</div>
            <div className="cell-sub">{p.email || "No email"}</div>
          </div>
        </div>
      ),
    },
    { key: "gender", header: "Gender", sortable: true, render: (p) => <Badge tone={GENDER_TONE[p.gender]}>{p.gender}</Badge> },
    { key: "date_of_birth", header: "Age", sortable: true, sortValue: (p) => age(p.date_of_birth), render: (p) => `${age(p.date_of_birth)} yrs` },
    { key: "phone", header: "Phone", render: (p) => p.phone },
    { key: "dob", header: "Date of Birth", sortValue: (p) => p.date_of_birth, render: (p) => formatDate(p.date_of_birth) },
    {
      key: "actions", header: "", align: "right",
      render: (p) => (
        <div className="row-actions">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={(e) => { e.stopPropagation(); openEdit(p); }} aria-label="Edit" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); remove(p); }} aria-label="Delete" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="h-page">Patients</h1>
          <p>{loading ? "Loading…" : `${rows.length} patient${rows.length === 1 ? "" : "s"} registered`}</p>
        </div>
        <div className="flex gap-8">
          <Button variant="secondary" icon={Download} onClick={exportPatients} disabled={!rows.length}>Export</Button>
          <Button variant="primary" icon={Plus} onClick={openCreate}>Add Patient</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchKeys={["full_name", "email", "phone"]}
        searchPlaceholder="Search by name, email, or phone…"
        emptyTitle="No patients yet"
        emptyHint="Add your first patient to get started."
        emptyIcon={UsersRound}
        onRowClick={(p) => navigate(`/patients/${p.id}`)}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Patient" : "Add Patient"}
        subtitle={editing ? editing.full_name : "Register a new patient record"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={submit}>{editing ? "Save changes" : "Add patient"}</Button>
          </>
        }
      >
        <form onSubmit={submit}>
          {error && <div className="form-banner">{error}</div>}
          <Input label="Full name" required name="full_name" value={form.full_name} onChange={change} placeholder="e.g. Hassan Raza" />
          <div className="field-row">
            <Select label="Gender" required name="gender" value={form.gender} onChange={change}>
              <option>Male</option><option>Female</option><option>Other</option>
            </Select>
            <Input label="Date of birth" required type="date" name="date_of_birth" value={form.date_of_birth} onChange={change} max={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="field-row">
            <Input label="Phone" required name="phone" value={form.phone} onChange={change} placeholder="0300xxxxxxx" />
            <Input label="Email" type="email" name="email" value={form.email} onChange={change} placeholder="optional" />
          </div>
          <Textarea label="Address" name="address" value={form.address} onChange={change} rows={2} placeholder="optional" />
          <button type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
}
