import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './figma/Logo';
import { useAuth } from '../context/AuthContext';
import { adminApi, type ActionLog, type SuspiciousUser } from '../api';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousUser[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'suspicious'>('logs');

  // Redirect non-admins
  useEffect(() => { if (!isAdmin) navigate('/dashboard'); }, [isAdmin, navigate]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLogs(page, 20);
      setLogs(res.data);
      setTotalLogs(res.total);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page]);

  const loadSuspicious = useCallback(async () => {
    try { setSuspicious(await adminApi.getSuspicious()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadLogs(); loadSuspicious(); }, [loadLogs, loadSuspicious]);

  const clearSuspicious = async (userId: number) => {
    await adminApi.clearSuspicious(userId);
    loadSuspicious();
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString('ro-RO');

  const actionColor = (action: string) => {
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="font-bold text-gray-900">PharmaConnect</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <Shield className="w-4 h-4" /> Admin Panel
            </span>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-blue-100 rounded-xl p-3"><Eye className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{totalLogs}</p><p className="text-sm text-gray-500">Total Actions Logged</p></div>
          </div>
          <div className={`bg-white rounded-2xl shadow p-5 flex items-center gap-4 ${suspicious.length > 0 ? 'border-2 border-red-400' : ''}`}>
            <div className={`${suspicious.length > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-xl p-3`}>
              <AlertTriangle className={`w-6 h-6 ${suspicious.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{suspicious.length}</p>
              <p className="text-sm text-gray-500">Suspicious Users</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('logs')}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            Action Logs
          </button>
          <button onClick={() => setActiveTab('suspicious')}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'suspicious' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            <AlertTriangle className="w-4 h-4" />
            Observation List
            {suspicious.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{suspicious.length}</span>}
          </button>
          <Button onClick={() => { loadLogs(); loadSuspicious(); }} variant="outline" className="ml-auto rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-bold hidden md:table-cell">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-bold hidden lg:table-cell">IP</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No logs yet.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{log.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${log.groupId === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {log.groupId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">{log.details}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm hidden lg:table-cell">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{totalLogs} total logs</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="rounded-lg text-sm">Previous</Button>
                <span className="px-3 py-2 text-sm">Page {page + 1}</span>
                <Button variant="outline" onClick={() => setPage(p => p+1)} disabled={logs.length < 20} className="rounded-lg text-sm">Next</Button>
              </div>
            </div>
          </div>
        )}

        {/* Suspicious Users Tab */}
        {activeTab === 'suspicious' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {suspicious.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No suspicious users detected.</p>
                <p className="text-gray-400 text-sm mt-1">The system monitors for abnormal behaviour automatically.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold">Username</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suspicious.map(u => (
                    <tr key={u.id} className="bg-red-50">
                      <td className="px-4 py-4 font-bold text-red-900">{u.username}</td>
                      <td className="px-4 py-4 text-gray-600">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
                          {u.suspiciousReason}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button onClick={() => clearSuspicious(u.id)} variant="outline"
                          className="text-sm rounded-lg gap-1 border-green-300 text-green-700 hover:bg-green-50">
                          <CheckCircle className="w-3 h-3" /> Clear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
