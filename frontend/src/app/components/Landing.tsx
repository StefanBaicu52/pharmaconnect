import { Button } from './ui/button';
import { Link } from 'react-router';
import { Heart, Shield, Clock, Phone } from 'lucide-react';
import Logo from './figma/Logo';
import PageWrapper from './PageWrapper';

export default function Landing() {
  return (
    <PageWrapper>
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Simple Header */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-16 h-16" />
            <span className="text-2xl font-bold text-gray-900">PharmaConnect</span>
          </div>
          
          <Link to="/login">
            <Button variant="outline" className="text-lg px-6 py-6">
              Log In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Simple and Clear */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
          Get your medication<br />
          <span className="text-green-600">delivered safely</span>
        </h1>
        
        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Fast, reliable prescription delivery right to your door. Simple to use, trusted by thousands.
        </p>

        <Link to="/register">
          <Button className="bg-green-600 hover:bg-green-700 text-white text-2xl px-16 py-10 rounded-2xl shadow-xl transform hover:scale-105 transition-all">
            Start Order Now
          </Button>
        </Link>

        <p className="text-lg text-gray-500 mt-6">
          No credit card required • Free delivery
        </p>
      </div>

      {/* Trust Features - Simple Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-3xl p-10 shadow-lg text-center transform hover:scale-105 transition-all">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Trusted Care</h3>
            <p className="text-lg text-gray-600">
              Licensed pharmacies. Verified prescriptions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-3xl p-10 shadow-lg text-center transform hover:scale-105 transition-all">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
            <p className="text-lg text-gray-600">
              Average delivery time: 30 minutes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-3xl p-10 shadow-lg text-center transform hover:scale-105 transition-all">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">24/7 Support</h3>
            <p className="text-lg text-gray-600">
              Emergency button for urgent needs.
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Simple */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
          </div>
          <p className="text-gray-600">Trusted medication delivery for everyone</p>
        </div>
      </footer>
    </div>
      </PageWrapper>
  );
}