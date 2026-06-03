import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Link, useNavigate } from 'react-router';
import {
  Plus, Trash2, BarChart3, LogOut, User, AlertTriangle, CheckCircle,
  AlertCircle, Package, Phone, Mic, Settings, Truck, Pencil, X,
  Wifi, WifiOff, Play, Square, Stethoscope, MessageCircle, Shield, RefreshCw,
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';
import { Input } from './ui/input';
import { prescriptionApi, generatorApi, type Prescription, type PrescriptionStats } from '../api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useOfflineSync } from '../hooks/useOfflineSync';

const statusLabel = (s: string) => s === 'PENDING' ? 'Pending' : 'Delivered';

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(f: { medicationName: string; doctor: string; date: string }) {
  const e: Record<string, string> = {};
  if (!f.medicationName || f.medicationName.trim().length < 3) e.medicationName = 'At least 3 characters.';
  if (!f.doctor || f.doctor.trim().length < 5) e.doctor = 'At least 5 characters.';
  if (!f.date || !/^\d{2}\/\d{2}\/\d{4}$/.test(f.date)) e.date = 'Format: DD/MM/YYYY.';
  return e;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
type FormStatus = 'PENDING' | 'DELIVERED';
interface FormData { medicationName: string; doctor: string; date: string; status: FormStatus; daysRemaining: string; }
const emptyForm: FormData = { medicationName: '', doctor: '', date: '', status: 'PENDING', daysRemaining: '' };

function PrescriptionModal({ initial, onSave, onClose }: {
  initial?: Prescription; onSave: (d: Omit<Prescription, 'id'>) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial
    ? { medicationName: initial.medicationName, doctor: initial.doctor ?? '', date: initial.date, status: initial.status as FormStatus, daysRemaining: String(initial.daysRemaining ?? '') }
    : emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ medicationName: form.medicationName.trim(), doctor: form.doctor.trim(), date: form.date.trim(), status: form.status, daysRemaining: form.daysRemaining ? parseInt(form.daysRemaining) : undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{initial ? 'Edit' : 'Add'} Prescription</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {([
            ['Medication Name', 'medicationName', 'e.g. Aspirin 100mg', 'text'],
            ['Doctor', 'doctor', 'e.g. Dr. Ion Popescu', 'text'],
            ['Date (DD/MM/YYYY)', 'date', '01/01/2026', 'text'],
            ['Days Remaining', 'daysRemaining', 'e.g. 10', 'number'],
          ] as const).map(([label, key, placeholder, type]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <Input type={type} value={form[key as keyof FormData]}
                onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })); }}
                placeholder={placeholder} className={`rounded-xl ${errors[key] ? 'border-red-500' : ''}`} />
              {errors[key] && <p className="text-red-600 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as FormStatus }))}
              className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm">
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl">
            {initial ? 'Save Changes' : 'Add Prescription'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
function OfflineBanner({ isOnline, isServerReachable, pendingCount, onSync }: {
  isOnline: boolean; isServerReachable: boolean; pendingCount: number; onSync: () => void;
}) {
  if (isOnline && isServerReachable) return null;
  return (
    <div className={`mx-6 mb-4 rounded-2xl px-5 py-3 flex items-center gap-3 ${!isOnline ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-yellow-100 border border-yellow-300 text-yellow-800'}`}>
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">{!isOnline ? 'You are offline' : 'Server unreachable'}</span>
        {pendingCount > 0 && <span className="ml-2 text-sm">— {pendingCount} operation(s) queued</span>}
      </div>
      {pendingCount > 0 && isOnline && isServerReachable && (
        <Button onClick={onSync} variant="outline" className="text-sm py-1 px-3 rounded-lg gap-1">
          <RefreshCw className="w-3 h-3" /> Sync Now
        </Button>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, isAdmin, logout } = useAuth();

  // UI state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isTableView, setIsTableView] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Prescription | undefined>(undefined);
  const [showSOS, setShowSOS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Data state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PrescriptionStats | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [generatorRunning, setGeneratorRunning] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  // Infinite scroll sentinel
  const pageSize = 5;

  // Silver: offline
  const { isOnline, isServerReachable, pendingOps, syncNow } = useOfflineSync(
    ({ replayed }) => { if (replayed > 0) loadPage(1, true); }
  );

  // Load a page of prescriptions
  const loadPage = useCallback(async (p: number, reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    try {
      const res = await prescriptionApi.getAll({ page: p, pageSize });
      if (reset) {
        setPrescriptions(res.data);
      } else {
        setPrescriptions(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const newItems = res.data.filter(x => !existingIds.has(x.id));
          return [...prev, ...newItems];
        });
      }
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch { /* offline */ } finally { setLoading(false); }
  }, [loading]);

  const loadStats = useCallback(async () => {
    try { setStats(await prescriptionApi.getStats()); } catch { /* offline */ }
  }, []);

  // Initial load
  useEffect(() => { loadPage(1, true); loadStats(); }, []);

  // Gold: infinite scroll via window scroll event (avoids overflow issues)
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
      if (scrolledToBottom && page < totalPages && !loading) {
        loadPage(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, totalPages, loading, loadPage]);

  // Silver: WebSocket — stable callback, no deps that change
  const handleBatch = useCallback((batch: unknown[]) => {
    console.log('WS batch received:', batch);
    if (!batch || batch.length === 0) return;
    const mapped = batch.map((p) => {
      const item = p as Record<string, unknown>;
      return {
        id: item.id as number,
        medicationName: item.medicationName as string,
        doctor: (item.doctor ?? item.doctorName ?? '') as string,
        date: item.date as string,
        status: item.status as 'PENDING' | 'DELIVERED',
        daysRemaining: item.daysRemaining as number | undefined,
      };
    });
    console.log('mapped:', mapped);
    setLiveCount(c => c + mapped.length);
    setPrescriptions(prev => {
      console.log('prev length:', prev.length, 'adding:', mapped.length);
      return [...mapped, ...prev];
    });
    setTotal(t => t + mapped.length);
    prescriptionApi.getStats().then(s => setStats(s)).catch(() => {});
    const el = document.getElementById('ws-flash');
    if (el) { el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 2500); }
  }, []); // stable — no deps

  const ws = useWebSocket({ onBatch: handleBatch, onStatusChange: setWsConnected });

  // CRUD
  const handleSave = async (data: Omit<Prescription, 'id'>) => {
    try {
      if (editTarget) {
        await prescriptionApi.update(editTarget.id, data);
      } else {
        await prescriptionApi.create(data as never);
      }
      setShowModal(false);
      setEditTarget(undefined);
      loadPage(1, true);
      loadStats();
    } catch (err: unknown) {
      alert((err as { error?: string })?.error ?? 'Could not save.');
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (!ids.length || !confirm(`Delete ${ids.length} prescription(s)?`)) return;
    try {
      if (ids.length === 1) await prescriptionApi.delete(ids[0]);
      else await prescriptionApi.deleteBulk(ids);
      setSelectedRows([]);
      loadPage(1, true);
      loadStats();
    } catch { alert('Delete failed.'); }
  };

  const toggleRow = (id: number) =>
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const toggleGenerator = async () => {
    try {
      if (generatorRunning) {
        await generatorApi.stop();
        setGeneratorRunning(false);
      } else {
        if (!wsConnected) ws.connect(); // auto-connect WS when starting generator
        await generatorApi.start(3, 2);
        setGeneratorRunning(true);
      }
    } catch { alert('Could not reach server.'); }
  };

  // Stats
  const pendingCount = stats?.pending ?? 0;
  const deliveredCount = stats?.delivered ?? 0;
  const urgentCount = stats?.urgentCount ?? 0;
  const pieData = [{ name: 'Delivered', value: deliveredCount }, { name: 'Pending', value: pendingCount }];
  const byDoctorData = stats ? Object.entries(stats.byDoctor).map(([name, count]) => ({ name: name.replace('Dr. ', ''), count })) : [];

  const NavBar = ({ simple = false }) => (
    <nav className="bg-white shadow-sm px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className={simple ? 'w-16 h-16' : 'w-14 h-14'} />
          <span className={`font-bold text-gray-900 ${simple ? 'text-2xl' : 'text-xl'}`}>PharmaConnect</span>
          {authUser && (
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${authUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {authUser.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/doctors"><Button variant="ghost" className="gap-2"><Stethoscope className="w-5 h-5" />Doctors</Button></Link>
          <Link to="/chat"><Button variant="ghost" className="gap-2"><MessageCircle className="w-5 h-5" />Chat</Button></Link>
          {isAdmin && <Link to="/admin"><Button variant="ghost" className="gap-2 text-purple-600"><Shield className="w-5 h-5" />Admin</Button></Link>}
          <Link to="/profile"><Button variant="ghost" className="gap-2"><User className="w-5 h-5" />Profile</Button></Link>
          <Button variant="outline" className="gap-2" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="w-5 h-5" />Log Out
          </Button>
        </div>
      </div>
    </nav>
  );

  // ── Simple Mode ─────────────────────────────────────────────────────────────
  if (!isAdvancedMode) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          <NavBar simple />
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="mb-10">
              <h1 className="text-5xl font-bold text-gray-900 mb-3">Hello{authUser ? `, ${authUser.username}` : ''}!</h1>
              <p className="text-2xl text-gray-600">What would you like to do today?</p>
            </div>
            <div className="mb-8 flex justify-end">
              <button onClick={() => setIsAdvancedMode(true)} className="flex items-center gap-2 text-gray-600 border border-gray-300 rounded-xl px-5 py-3">
                <Settings className="w-5 h-5" /> Advanced Mode
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <button onClick={() => navigate('/create-order')} className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left">
                <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-6"><Truck className="w-10 h-10 text-green-600" /></div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Send Courier</h2>
                <p className="text-lg text-gray-600">Pick up my prescription</p>
              </button>
              <button onClick={() => navigate('/order-tracking')} className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left">
                <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mb-6"><Package className="w-10 h-10 text-blue-600" /></div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h2>
                <p className="text-lg text-gray-600">Track deliveries</p>
              </button>
              <button onClick={() => { setShowSOS(true); setTimeout(() => { alert('🚨 Emergency!'); setShowSOS(false); }, 2000); }}
                className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 text-left relative overflow-hidden"
                style={{ boxShadow: showSOS ? '0 0 60px rgba(239,68,68,0.8)' : undefined }}>
                {showSOS && <div className="absolute inset-0 bg-red-400 animate-ping opacity-50" />}
                <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10"><Phone className="w-10 h-10 text-white" /></div>
                <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Emergency SOS</h2>
                <p className="text-lg text-white/90 relative z-10">Need help now?</p>
              </button>
            </div>
            <button onClick={() => { setIsListening(true); setShowVoiceModal(true); setTimeout(() => { const c = ['I need medication','Send a courier','Emergency']; setVoiceCommand(c[Math.floor(Math.random()*c.length)]); setIsListening(false); }, 2000); }}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl p-10 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-6 mb-10">
              <div className={`bg-white/20 w-20 h-20 rounded-full flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}><Mic className="w-10 h-10 text-white" /></div>
              <div className="text-left"><h2 className="text-3xl font-bold text-white mb-2">Speak Your Request</h2><p className="text-xl text-white/90">Say: "I need medication" or "Emergency"</p></div>
            </button>
            {showVoiceModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 text-center">
                  {isListening
                    ? <><div className="bg-purple-100 w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-8 animate-pulse"><Mic className="w-16 h-16 text-purple-600" /></div><h2 className="text-4xl font-bold text-gray-900">Listening...</h2></>
                    : <><div className="bg-green-100 w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-8"><CheckCircle className="w-16 h-16 text-green-600" /></div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">I heard:</h2>
                        <p className="text-3xl font-bold text-purple-600 mb-8">"{voiceCommand}"</p>
                        <div className="flex gap-4">
                          <Button onClick={() => { setShowVoiceModal(false); voiceCommand.toLowerCase().includes('emergency') ? setShowSOS(true) : navigate('/create-order'); }} className="flex-1 bg-green-600 text-white text-2xl py-8 rounded-2xl">Yes, Continue</Button>
                          <Button onClick={() => { setShowVoiceModal(false); setVoiceCommand(''); }} variant="outline" className="flex-1 text-2xl py-8 rounded-2xl">No, Cancel</Button>
                        </div>
                      </>}
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl shadow-lg p-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Active Prescriptions</h2>
              <div className="space-y-4">
                {prescriptions.slice(0, 3).map(p => {
                  const isCritical = p.daysRemaining === 1;
                  const isWarn = (p.daysRemaining ?? 99) <= 5;
                  return (
                    <div key={p.id} onClick={() => navigate(`/prescription/${p.id}`)}
                      className={`rounded-2xl p-6 cursor-pointer hover:scale-[1.01] transition-all ${isCritical ? 'bg-red-50 border-2 border-red-500' : isWarn ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50 border-2 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isCritical ? <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" /> : isWarn ? <AlertTriangle className="w-6 h-6 text-yellow-600" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
                            <h3 className="text-xl font-bold text-gray-900">{p.medicationName}</h3>
                          </div>
                          <p className="text-gray-600">{p.doctor}</p>
                          {p.daysRemaining !== undefined && <p className={`text-sm font-bold mt-1 ${isCritical ? 'text-red-700' : isWarn ? 'text-yellow-700' : 'text-gray-500'}`}>{isCritical ? '⚠️ Expires tomorrow!' : `${p.daysRemaining} days remaining`}</p>}
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold ${p.status === 'DELIVERED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>{statusLabel(p.status)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={() => setIsAdvancedMode(true)} variant="outline" className="w-full mt-8 text-xl py-7 rounded-xl">View All Prescriptions</Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // ── Advanced Mode ───────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50">
        <NavBar />

        {/* Silver: live flash */}
        <div id="ws-flash" style={{ opacity: 0, transition: 'opacity 0.4s' }}
          className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium pointer-events-none">
          🔴 Live: {liveCount} new prescriptions received
        </div>

        {/* Silver: offline banner */}
        <div className="pt-4">
          <OfflineBanner isOnline={isOnline} isServerReachable={isServerReachable} pendingCount={pendingOps.length} onSync={syncNow} />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
            <button onClick={() => setIsAdvancedMode(false)} className="text-gray-600 bg-white border border-gray-300 rounded-xl px-5 py-2.5 shadow-sm">Simple Mode</button>
          </div>

          {/* Silver: WebSocket + Generator panel */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium text-gray-700">WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}</span>
              <Button onClick={() => wsConnected ? ws.disconnect() : ws.connect()} variant="outline" className="text-xs py-1 px-3 rounded-lg ml-1">
                {wsConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-sm font-medium text-gray-700">Faker Generator:</span>
              <Button onClick={toggleGenerator} className={`text-sm py-1 px-4 rounded-lg gap-1 ${generatorRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                {generatorRunning ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
              </Button>
              {generatorRunning && <span className="text-xs text-gray-500 animate-pulse">Generating every 3s…</span>}
            </div>
            {liveCount > 0 && <span className="ml-auto text-xs text-gray-500">+{liveCount} auto-generated</span>}
          </div>

          {/* Stats */}
          <div className="mb-6 bg-white rounded-2xl shadow p-6">
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-3xl font-bold text-gray-800">{total}</p><p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2"><CheckCircle className="w-5 h-5 text-white" /></div>
                <div><p className="font-bold text-green-800">Delivered</p><p className="text-sm text-green-600">{deliveredCount}</p></div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300 flex items-center gap-3">
                <div className="bg-yellow-500 rounded-full p-2"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <div><p className="font-bold text-yellow-800">Pending</p><p className="text-sm text-yellow-600">{pendingCount}</p></div>
              </div>
              <div className={`bg-red-50 rounded-xl p-4 border-2 flex items-center gap-3 ${urgentCount > 0 ? 'border-red-600 animate-pulse' : 'border-red-200'}`}>
                <div className="bg-red-600 rounded-full p-2"><AlertCircle className="w-5 h-5 text-white" /></div>
                <div><p className="font-bold text-red-900">Urgent</p><p className="text-sm text-red-700">{urgentCount} critical</p></div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 items-center">
              <Button onClick={() => { setEditTarget(undefined); setShowModal(true); }} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Add Prescription
              </Button>
              {/* Silver: Delete only visible and allowed for ADMIN */}
              {isAdmin && (
                <Button variant="destructive" onClick={() => handleDelete(selectedRows)} disabled={!selectedRows.length} className="gap-2 rounded-xl">
                  <Trash2 className="w-4 h-4" /> Delete ({selectedRows.length})
                </Button>
              )}
              {isOnline && isServerReachable
                ? <div className="flex items-center gap-1 text-green-600 text-sm"><Wifi className="w-4 h-4" /> Online</div>
                : <div className="flex items-center gap-1 text-red-500 text-sm"><WifiOff className="w-4 h-4" /> Offline</div>}
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm">
              <BarChart3 className={`w-5 h-5 ${!isTableView ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm font-semibold text-gray-700">Charts</span>
              <Switch checked={isTableView} onCheckedChange={setIsTableView} className="data-[state=checked]:bg-green-600" />
              <span className="text-sm font-semibold text-gray-700">Table</span>
            </div>
          </div>

          {/* Gold: dual view */}
          <div className={`flex gap-6 ${isTableView ? '' : 'flex-col lg:flex-row'}`}>
            <div className={isTableView ? 'w-full' : 'lg:w-1/2'}>
              <div className="bg-white rounded-2xl shadow">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4 rounded" onChange={e => setSelectedRows(e.target.checked ? prescriptions.map(p => p.id) : [])} /></th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase">Medication</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase hidden md:table-cell">Doctor</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase hidden sm:table-cell">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {prescriptions.map(p => {
                        const isCritical = p.daysRemaining === 1;
                        return (
                          <tr key={p.id} className={`transition-colors cursor-pointer ${isCritical ? 'bg-red-50 border-l-4 border-red-600' : selectedRows.includes(p.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                            onClick={e => { if ((e.target as HTMLElement).closest('button,input')) return; navigate(`/prescription/${p.id}`); }}>
                            <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded" checked={selectedRows.includes(p.id)} onChange={() => toggleRow(p.id)} onClick={e => e.stopPropagation()} /></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2">{isCritical && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}<span className={`font-medium ${isCritical ? 'text-red-900 font-bold' : 'text-gray-900'}`}>{p.medicationName}</span></div></td>
                            <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{p.doctor}</td>
                            <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{p.date}</td>
                            <td className="px-4 py-3"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${isCritical ? 'bg-red-600 text-white' : p.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{isCritical ? '⚠️ URGENT' : statusLabel(p.status)}</span></td>
                            <td className="px-4 py-3"><button onClick={e => { e.stopPropagation(); setEditTarget(p); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4 text-gray-600" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {loading && <div className="flex justify-center py-4 text-gray-500 gap-2"><div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />Loading more…</div>}
                {!loading && page >= totalPages && prescriptions.length > 0 && <div className="text-center py-3 text-xs text-gray-400">All {total} prescriptions loaded</div>}
              </div>
            </div>

            {/* Charts */}
            {!isTableView && (
              <div className="lg:w-1/2 space-y-6">
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Status Distribution</h3>
                    {wsConnected && <span className="text-xs text-green-600 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</span>}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`} labelLine={false}>
                        <Cell fill="#10b981" /><Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">By Doctor</h3>
                    {wsConnected && <span className="text-xs text-green-600 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</span>}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byDoctorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip /><Bar dataKey="count" fill="#10b981" name="Prescriptions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {showModal && <PrescriptionModal initial={editTarget} onSave={handleSave} onClose={() => { setShowModal(false); setEditTarget(undefined); }} />}
      </div>
    </PageWrapper>
  );
}