import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Trash2, Pencil, X, Stethoscope, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';
import { doctorApi, type Doctor, type Prescription } from '../api';


// ─── Doctor Form Modal ────────────────────────────────────────────────────────

function DoctorModal({
  initial, onSave, onClose,
}: {
  initial?: Doctor;
  onSave: (data: Omit<Doctor, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:      initial?.name      ?? '',
    specialty: initial?.specialty ?? '',
    phone:     initial?.phone     ?? '',
    address:   initial?.address   ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 5)      e.name      = 'Name must be at least 5 characters.';
    if (form.specialty.trim().length < 3)  e.specialty = 'Specialty must be at least 3 characters.';
    if (!/^\+?[\d\s\-]{10,15}$/.test(form.phone.trim())) e.phone = 'Phone must be 10–15 digits.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ name: form.name.trim(), specialty: form.specialty.trim(), phone: form.phone.trim(), address: form.address.trim() });
  };

  const field = (label: string, key: keyof typeof form, placeholder: string) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <Input
        value={form[key]}
        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })); }}
        placeholder={placeholder}
        className={`rounded-xl ${errors[key] ? 'border-red-500' : ''}`}
      />
      {errors[key] && <p className="text-red-600 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{initial ? 'Edit Doctor' : 'Add Doctor'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {field('Name', 'name', 'e.g. Dr. Ion Popescu')}
          {field('Specialty', 'specialty', 'e.g. Cardiologie')}
          {field('Phone', 'phone', '+40712345678')}
          {field('Address', 'address', 'Str. Clinicilor 1, Cluj-Napoca')}
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            {initial ? 'Save Changes' : 'Add Doctor'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Row with expandable prescriptions (1-to-many) ────────────────────

function DoctorRow({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  onEdit: (d: Doctor) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && prescriptions.length === 0) {
      setLoadingRx(true);
      try {
        const res = await doctorApi.getPrescriptions(doctor.id);
        // Backend returns {data: [], total: n}
        const rx = Array.isArray(res) ? res : (res as { data: Prescription[] }).data ?? [];
        setPrescriptions(rx);
      } catch { /* ignore */ } finally { setLoadingRx(false); }
    }
    setExpanded(e => !e);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="px-4 py-4">
          <button onClick={toggleExpand} className="p-1 hover:bg-gray-200 rounded-lg">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-4">
          <div className="font-semibold text-gray-900">{doctor.name}</div>
        </td>
        <td className="px-4 py-4 text-gray-600 hidden md:table-cell">{doctor.specialty}</td>
        <td className="px-4 py-4 text-gray-600 hidden sm:table-cell">{doctor.phone}</td>
        <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{doctor.address ?? '—'}</td>
        <td className="px-4 py-4">
          <div className="flex gap-2">
            <button onClick={() => onEdit(doctor)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Pencil className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => onDelete(doctor.id)} className="p-1.5 hover:bg-red-100 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </td>
      </tr>

      {/* 1-to-many: expanded prescriptions */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-8 py-4 bg-blue-50 border-b border-blue-100">
            <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Prescriptions by {doctor.name}
            </div>
            {loadingRx ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : prescriptions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No prescriptions found for this doctor.</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map(p => (
                  <div key={p.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="font-medium text-gray-900">{p.medicationName}</span>
                      <span className="text-gray-500 text-sm ml-3">{p.date}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      p.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Doctors Page ─────────────────────────────────────────────────────────────

export default function Doctors() {
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const loadPage = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const res = await doctorApi.getAll({ page: p, pageSize });
      if (reset) setDoctors(res.data);
      else setDoctors(prev => [...prev, ...res.data.filter(d => !prev.find(x => x.id === d.id))]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPage(1, true); }, [refreshKey]);

  // window scroll for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && page < totalPages && !loading) {
        loadPage(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, totalPages, loading, loadPage]);

  const refresh = () => { setRefreshKey(k => k + 1); setDoctors([]); setPage(1); };

  const handleSave = async (data: Omit<Doctor, 'id'>) => {
    try {
      if (editTarget) { await doctorApi.update(editTarget.id, data); }
      else            { await doctorApi.create(data); }
      setShowModal(false);
      setEditTarget(undefined);
      refresh();
    } catch (err: unknown) {
      alert('Error saving doctor: ' + ((err as { error?: string })?.error ?? 'Unknown error'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this doctor?')) return;
    try { await doctorApi.delete(id); refresh(); }
    catch { alert('Could not delete doctor.'); }
  };

  const openAdd  = () => { setEditTarget(undefined); setShowModal(true); };
  const openEdit = (d: Doctor) => { setEditTarget(d); setShowModal(true); };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Nav */}
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12" />
              <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-600 font-medium">Doctors</span>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
              <p className="text-gray-500 mt-1">{total} doctors — click a row to see their prescriptions</p>
            </div>
            <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> Add Doctor
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase hidden md:table-cell">Specialty</th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase hidden lg:table-cell">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map(d => (
                    <DoctorRow key={d.id} doctor={d} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                  {doctors.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Infinite scroll loading indicator */}
            {loading && (
              <div className="flex justify-center py-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Loading more...
                </div>
              </div>
            )}
            {!loading && page >= totalPages && doctors.length > 0 && (
              <div className="text-center py-3 text-xs text-gray-400">All {total} doctors loaded</div>
            )}
          </div>
        </div>

        {showModal && (
          <DoctorModal initial={editTarget} onSave={handleSave} onClose={() => { setShowModal(false); setEditTarget(undefined); }} />
        )}
      </div>
    </PageWrapper>
  );
}