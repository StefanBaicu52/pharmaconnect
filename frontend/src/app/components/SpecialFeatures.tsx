import { Button } from './ui/button';
import { Link } from 'react-router';
import { ArrowLeft, Zap, Plane, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import Logo from "./figma/Logo";
import PageWrapper from "./PageWrapper";
import { useState } from 'react';

export default function SpecialFeatures() {
  const [sosActivated, setSosActivated] = useState(false);

  const handleSOSClick = () => {
    setSosActivated(true);
    setTimeout(() => {
      setSosActivated(false);
    }, 5000);
  };

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
          </Link>
          
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Înapoi la Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Section 1: BAZINGA Feature - Emergency SOS Button */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full mb-4">
              <Zap className="w-5 h-5 text-red-600" />
              <span className="text-sm font-bold text-red-600 uppercase">BAZINGA Feature</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Buton SOS Urgență Medicale</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Caracteristica unică a PharmaConnect: Când viața ta depinde de un medicament, un singur click activează livrarea prin dronă în mai puțin de 10 minute!
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 via-white to-red-50 rounded-3xl shadow-2xl p-12 border-4 border-red-200">
            <div className="flex flex-col items-center">
              {/* Emergency SOS Button */}
              <div className="relative mb-8">
                {/* Pulsing rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 rounded-full bg-red-400 opacity-20 animate-ping"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center animation-delay-1000">
                  <div className="w-72 h-72 rounded-full bg-red-500 opacity-30 animate-ping"></div>
                </div>
                
                {/* Main Button */}
                <button
                  onClick={handleSOSClick}
                  disabled={sosActivated}
                  className="relative w-64 h-64 rounded-full bg-gradient-to-br from-red-600 to-red-700 shadow-2xl hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: sosActivated 
                      ? '0 0 80px rgba(239, 68, 68, 0.8), 0 0 120px rgba(239, 68, 68, 0.6)' 
                      : '0 20px 60px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-white">
                    <AlertCircle className="w-20 h-20 mb-4 animate-pulse" />
                    <span className="text-3xl font-black uppercase tracking-wider">SOS</span>
                    <span className="text-lg font-bold mt-2">URGENȚĂ</span>
                  </div>
                </button>
              </div>

              {/* Status Message */}
              {sosActivated ? (
                <div className="bg-green-600 text-white px-8 py-6 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-12 h-12" />
                    <div>
                      <h3 className="text-2xl font-bold">SOS ACTIVAT!</h3>
                      <p className="text-lg">Drona este în drum cu medicamentele tale. ETA: 8 minute</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-2xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Cum Funcționează?</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-red-600">1</span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Apasă Butonul SOS</h4>
                      <p className="text-sm text-gray-600">Un singur click activează sistemul de urgență</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Plane className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Drona Decolează</h4>
                      <p className="text-sm text-gray-600">Farmacia cea mai apropiată trimite drona automat</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Heart className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">Salvează Vieți</h4>
                      <p className="text-sm text-gray-600">Primești medicamentele în mai puțin de 10 minute</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Break & Fix Design */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-bold text-purple-600 uppercase">Design Principles Showcase</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Break & Fix: Principii de Design</h2>
            <p className="text-xl text-gray-600">
              Demonstrație: Cum principiile UNITY, SYMMETRY și REPETITION transformă un design caotic într-unul profesional
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT: Broken Design */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-10">
                ❌ DESIGN GREȘIT
              </div>
              
              <div className="bg-white rounded-xl shadow-xl p-8 border-4 border-red-300">
                {/* Intentionally broken design with no unity */}
                <div className="space-y-6">
                  {/* Chaotic header */}
                  <div style={{ 
                    background: 'linear-gradient(45deg, #ff00ff, #00ff00, #ff0000)',
                    padding: '20px',
                    transform: 'rotate(-2deg)'
                  }}>
                    <h3 style={{ 
                      fontFamily: 'Comic Sans MS, cursive',
                      fontSize: '32px',
                      color: '#ffff00',
                      textShadow: '3px 3px 0px #ff0000, 6px 6px 0px #0000ff',
                      textAlign: 'left'
                    }}>
                      REȚETA TA!!!
                    </h3>
                  </div>

                  {/* Misaligned content */}
                  <div style={{ 
                    backgroundColor: '#ff6b9d',
                    padding: '15px 10px 25px 30px',
                    transform: 'rotate(1deg)'
                  }}>
                    <p style={{ 
                      fontFamily: 'Arial',
                      fontSize: '14px',
                      color: '#00ffff',
                      marginBottom: '5px',
                      textAlign: 'right'
                    }}>
                      Medicament
                    </p>
                    <p style={{ 
                      fontFamily: 'Times New Roman',
                      fontSize: '24px',
                      color: '#ffff00',
                      fontWeight: 'bold',
                      textAlign: 'left'
                    }}>
                      Aspirin 100MG
                    </p>
                  </div>

                  {/* Random colors and fonts */}
                  <div style={{ 
                    backgroundColor: '#00ff00',
                    padding: '20px',
                    transform: 'rotate(-3deg)'
                  }}>
                    <p style={{ 
                      fontFamily: 'Courier New',
                      fontSize: '18px',
                      color: '#ff0000',
                      textAlign: 'center'
                    }}>
                      Doctor: Dr. Popescu
                    </p>
                  </div>

                  {/* Chaotic spacing */}
                  <div style={{ 
                    backgroundColor: '#ffa500',
                    padding: '5px 40px 30px 10px'
                  }}>
                    <p style={{ 
                      fontFamily: 'Verdana',
                      fontSize: '20px',
                      color: '#0000ff',
                      marginBottom: '15px'
                    }}>
                      Data
                    </p>
                    <p style={{ 
                      fontFamily: 'Georgia',
                      fontSize: '12px',
                      color: '#ff00ff',
                      textAlign: 'right',
                      transform: 'rotate(5deg)'
                    }}>
                      15/03/2026
                    </p>
                  </div>

                  {/* Ugly button */}
                  <button style={{ 
                    backgroundColor: '#ff0000',
                    color: '#00ff00',
                    padding: '15px 25px',
                    border: '5px dashed #0000ff',
                    fontFamily: 'Impact',
                    fontSize: '16px',
                    transform: 'rotate(-5deg)',
                    cursor: 'pointer',
                    marginLeft: '30px'
                  }}>
                    CLICK HERE NOW!!!
                  </button>
                </div>

                {/* Problems List */}
                <div className="mt-8 bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-800 mb-2">❌ Probleme:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Culori care se ciocnesc violent</li>
                    <li>• Fonturi diferite și inconsistente</li>
                    <li>• Lipsă de aliniere și simetrie</li>
                    <li>• Spacing haotic și neprofesional</li>
                    <li>• Zero UNITY, SYMMETRY sau REPETITION</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* RIGHT: Fixed Design */}
            <div className="relative">
              <div className="absolute -top-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-10">
                ✓ DESIGN CORECTAT
              </div>
              
              <div className="bg-white rounded-xl shadow-xl p-8 border-4 border-green-300">
                {/* Professional fixed design */}
                <div className="space-y-6">
                  {/* Unified header with medical colors */}
                  <div className="bg-emerald-600 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold text-white text-center">
                      Rețeta Ta Medicală
                    </h3>
                  </div>

                  {/* Symmetrical and aligned content */}
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Medicament
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      Aspirin 100mg
                    </p>
                  </div>

                  {/* Repetition of style */}
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Doctor Prescriptor
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      Dr. Popescu
                    </p>
                  </div>

                  {/* Consistent spacing and alignment */}
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-2">
                      Data Emiterii
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      15/03/2026
                    </p>
                  </div>

                  {/* Professional button */}
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition-colors shadow-md">
                    Vezi Detalii Complete
                  </button>
                </div>

                {/* Principles Applied */}
                <div className="mt-8 bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-800 mb-2">✓ Principii Aplicate:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>UNITY:</strong> Paletă de culori medicală consistentă (emerald)</li>
                    <li>• <strong>SYMMETRY:</strong> Aliniere perfectă și layout centrat</li>
                    <li>• <strong>REPETITION:</strong> Același stil pentru toate cardurile</li>
                    <li>• <strong>BALANCE:</strong> Spacing uniform și ierarhie clară</li>
                    <li>• <strong>CONTRAST:</strong> Text lizibil și profesional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Design Principles Summary */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-6">
              Ce Am Învățat?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl mb-3">🎨</div>
                <h4 className="font-bold text-gray-900 mb-2">UNITY</h4>
                <p className="text-sm text-gray-600">Culori și fonturi consistente creează coerență vizuală</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl mb-3">⚖️</div>
                <h4 className="font-bold text-gray-900 mb-2">SYMMETRY</h4>
                <p className="text-sm text-gray-600">Aliniere și echilibru oferă aspect profesional</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="text-4xl mb-3">🔁</div>
                <h4 className="font-bold text-gray-900 mb-2">REPETITION</h4>
                <p className="text-sm text-gray-600">Pattern-uri consistente construiesc identitate vizuală</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </PageWrapper>
  );
}
