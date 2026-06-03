import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, Printer, Calendar, Building2, Pill, Clock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';
import { prescriptionApi, type Prescription } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prescriptionApi.getById(Number(id))
      .then(p => setPrescription(p as unknown as Prescription))
      .catch(() => setPrescription(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!prescription) return;
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    await prescriptionApi.delete(prescription.id);
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!prescription) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Prescription not found</h2>
        <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
      </div>
    </div>
  );

  const isCritical = prescription.daysRemaining === 1;
  const isWarning = prescription.daysRemaining !== undefined && prescription.daysRemaining <= 5;
  const statusLabel = prescription.status === 'DELIVERED' ? 'Delivered' : 'Pending';

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12" />
              <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button onClick={handleDelete} variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {isCritical && (
            <div className="bg-red-600 text-white rounded-2xl p-6 mb-8 flex items-center gap-4 animate-pulse">
              <span className="text-4xl">⚠️</span>
              <div>
                <h2 className="text-2xl font-bold">URGENT: Expires Tomorrow!</h2>
                <p className="text-lg">Order a courier immediately to pick up your prescription.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className={`px-10 py-8 ${isCritical ? 'bg-red-600' : isWarning ? 'bg-yellow-500' : 'bg-green-600'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-lg mb-2">Prescription #{prescription.id}</p>
                  <h1 className="text-4xl font-bold text-white">{prescription.medicationName}</h1>
                </div>
                <span className={`px-6 py-3 rounded-xl text-lg font-bold ${prescription.status === 'DELIVERED' ? 'bg-white text-green-700' : 'bg-white/20 text-white border-2 border-white'}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="px-10 py-8 grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-xl"><Building2 className="w-7 h-7 text-blue-600" /></div>
                <div><p className="text-sm font-semibold text-gray-500 uppercase mb-1">Doctor</p><p className="text-xl font-bold text-gray-900">{prescription.doctor}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-xl"><Calendar className="w-7 h-7 text-green-600" /></div>
                <div><p className="text-sm font-semibold text-gray-500 uppercase mb-1">Date Issued</p><p className="text-xl font-bold text-gray-900">{prescription.date}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-xl"><Pill className="w-7 h-7 text-purple-600" /></div>
                <div><p className="text-sm font-semibold text-gray-500 uppercase mb-1">Medication</p><p className="text-xl font-bold text-gray-900">{prescription.medicationName}</p></div>
              </div>
              {prescription.daysRemaining !== undefined && (
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isCritical ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <Clock className={`w-7 h-7 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Days Remaining</p>
                    <p className={`text-xl font-bold ${isCritical ? 'text-red-600' : 'text-gray-900'}`}>{prescription.daysRemaining} days</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 pb-10 flex flex-wrap gap-4">
              <Link to="/create-order">
                <Button className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg gap-2">
                  Send Courier to Pick Up
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.print()} className="text-lg px-8 py-6 rounded-xl gap-2">
                <Printer className="w-5 h-5" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}