import { Link } from 'react-router';
import { ArrowLeft, MapPin, FileText, Building2, Package, Home, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';
import { useApp } from '../context/AppContext';

export default function OrderTracking() {
  const { orders, updateOrderStep } = useApp();
  const latestOrder = orders[orders.length - 1];
  const [currentStep, setCurrentStep] = useState(latestOrder?.step ?? 1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 5) {
          if (latestOrder) updateOrderStep(latestOrder.id, prev + 1);
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 1, title: 'Courier on the way to you', description: 'Coming to pick up your prescription', icon: <MapPin className="w-8 h-8" /> },
    { id: 2, title: 'Prescription picked up', description: 'Your prescription has been collected', icon: <FileText className="w-8 h-8" /> },
    { id: 3, title: 'Courier at pharmacy', description: 'Getting your medication from the pharmacy', icon: <Building2 className="w-8 h-8" /> },
    { id: 4, title: 'Medication picked up', description: 'Your medication is ready', icon: <Package className="w-8 h-8" /> },
    { id: 5, title: 'Delivering to you', description: 'The courier is bringing your medication', icon: <Home className="w-8 h-8" /> },
  ];

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14" />
              <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
            </div>
            <Link to="/dashboard"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Back to Home</Button></Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl shadow-lg p-10 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Order #{latestOrder?.id ?? '—'}</h1>
            <p className="text-xl text-gray-600">Tracking your medication delivery</p>
            {latestOrder && <p className="text-gray-500 mt-1">Address: {latestOrder.address} · {latestOrder.phone}</p>}
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-10" data-testid="tracking-steps">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Delivery Progress</h2>
            <div className="space-y-6">
              {steps.map((step, index) => {
                const completed = currentStep > step.id;
                const active = currentStep === step.id;
                return (
                  <div key={step.id} className="relative">
                    {index < steps.length - 1 && (
                      <div className={`absolute left-8 top-20 w-1 h-16 transition-colors duration-700 ${completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                    <div className={`relative flex items-start gap-6 p-8 rounded-2xl transition-all ${active ? 'bg-green-50 border-2 border-green-500 shadow-lg' : completed ? 'bg-gray-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-gray-200'}`}>
                      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all ${completed ? 'bg-green-500 text-white' : active ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-300 text-gray-500'}`}>
                        {completed ? <CheckCircle className="w-8 h-8" /> : step.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold mb-2 ${active ? 'text-green-900' : 'text-gray-900'}`}>{step.title}</h3>
                        <p className="text-lg text-gray-600">{step.description}</p>
                        {active && <span className="mt-3 inline-block bg-green-200 text-green-900 text-sm font-bold uppercase px-4 py-1.5 rounded-full">Current Step</span>}
                        {completed && <p className="mt-3 text-green-600 font-semibold">✓ Completed</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {currentStep > 5 && (
              <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-10 text-center text-white">
                <CheckCircle className="w-20 h-20 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-3">Delivered!</h2>
                <p className="text-2xl">Your medication has been delivered successfully</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
