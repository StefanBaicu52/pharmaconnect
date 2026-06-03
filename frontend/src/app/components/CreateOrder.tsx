import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Phone, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';
import { useApp, validateOrder } from '../context/AppContext';

export default function CreateOrder() {
  const navigate = useNavigate();
  const { addOrder } = useApp();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ address?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateOrder({ address, phone });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    addOrder({ address: address.trim(), phone: phone.trim(), note: note.trim() });
    setTimeout(() => navigate('/order-tracking'), 500);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14" />
              <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
            </div>
            <Link to="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-lg p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Send Courier</h1>
            <p className="text-2xl text-gray-600 mb-10">A courier will come to pick up your prescription</p>

            <form onSubmit={handleSubmit} className="space-y-8" data-testid="create-order-form">
              <div>
                <label className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-4">
                  <MapPin className="w-6 h-6 text-green-600" /> Your Address
                </label>
                <Input type="text" value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: undefined })); }}
                  placeholder="e.g. Str. Libertății nr. 25, Cluj-Napoca"
                  className={`h-16 text-xl rounded-xl ${errors.address ? 'border-red-500' : ''}`} data-testid="address-input" />
                {errors.address && <p className="text-red-600 text-sm mt-2">{errors.address}</p>}
              </div>

              <div>
                <label className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-4">
                  <Phone className="w-6 h-6 text-green-600" /> Your Phone Number
                </label>
                <Input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
                  placeholder="e.g. +40 712 345 678"
                  className={`h-16 text-xl rounded-xl ${errors.phone ? 'border-red-500' : ''}`} data-testid="phone-input" />
                {errors.phone && <p className="text-red-600 text-sm mt-2">{errors.phone}</p>}
              </div>

              <div>
                <label className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-4">
                  <MessageSquare className="w-6 h-6 text-green-600" /> Note (Optional)
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Any special instructions?"
                  className="w-full h-32 text-xl rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none" />
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">How it works:</h3>
                <ol className="text-base text-blue-800 space-y-2 ml-5 list-decimal">
                  <li>Courier comes to your address</li>
                  <li>You give them your physical prescription</li>
                  <li>Courier goes to the pharmacy</li>
                  <li>Courier brings back your medication</li>
                </ol>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-2xl py-8 rounded-2xl shadow-xl transition-all"
                data-testid="submit-order-btn">
                {loading ? 'Placing order...' : 'Send Courier Now'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
