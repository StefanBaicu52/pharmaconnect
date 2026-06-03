import { Button } from './ui/button';
import { Link } from 'react-router';
import { ArrowLeft, Camera, Upload, X, CheckCircle } from 'lucide-react';
import Logo from "./figma/Logo";
import PageWrapper from "./PageWrapper";
import { useState, useRef } from 'react';

export default function Profile() {
  const [showModal, setShowModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
  };

  const handleSubmit = () => {
    if (capturedImage) {
      setUploadSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setUploadSuccess(false);
        setCapturedImage(null);
      }, 2000);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCapturedImage(null);
    setUploadSuccess(false);
    stopCamera();
  };

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-14 h-14" />
            <span className="text-xl font-bold text-gray-900">PharmaConnect</span>
          </div>
          
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg p-10 mb-8">
          <div className="flex items-center gap-8 mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl">
              MI
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Maria Ionescu</h1>
              <p className="text-2xl text-gray-600">Age: 68 years</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Email</h3>
              <p className="text-lg font-medium text-gray-900">maria.ionescu@email.ro</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Phone</h3>
              <p className="text-lg font-medium text-gray-900">+40 712 345 678</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 md:col-span-2">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-2">Address</h3>
              <p className="text-lg font-medium text-gray-900">Str. Libertății nr. 25, București</p>
            </div>
          </div>
        </div>

        {/* Upload Prescription Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-8 px-8 rounded-3xl font-bold text-2xl shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-4"
        >
          <Camera className="w-8 h-8" />
          Upload Prescription Photo
        </button>
      </div>

      {/* Modal for Adding New Prescription */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Upload Prescription</h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-10">
              {uploadSuccess ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-8">
                    <CheckCircle className="w-20 h-20 text-green-600" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-3">Success!</h3>
                  <p className="text-xl text-gray-600">Prescription uploaded successfully</p>
                </div>
              ) : (
                <>
                  <p className="text-xl text-gray-600 mb-8 text-center">
                    Take a photo or upload an image of your prescription
                  </p>

                  {/* Camera View */}
                  {isCamera && !capturedImage && (
                    <div className="mb-6">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-2xl border-4 border-green-500"
                      />
                      <Button
                        onClick={capturePhoto}
                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-8 text-xl font-bold rounded-xl"
                      >
                        <Camera className="w-7 h-7 mr-3" />
                        Capture Photo
                      </Button>
                    </div>
                  )}

                  {/* Image Preview */}
                  {capturedImage && (
                    <div className="mb-6">
                      <img
                        src={capturedImage}
                        alt="Captured prescription"
                        className="w-full rounded-2xl border-4 border-green-500 shadow-lg"
                      />
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="mt-6 text-red-600 hover:text-red-700 font-bold text-lg flex items-center gap-2"
                      >
                        <X className="w-6 h-6" />
                        Delete and try again
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!capturedImage && !isCamera && (
                    <div className="space-y-5">
                      <button
                        onClick={startCamera}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-8 px-6 rounded-2xl font-bold text-2xl shadow-xl flex items-center justify-center gap-4"
                      >
                        <Camera className="w-8 h-8" />
                        Open Camera
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-lg">
                          <span className="px-6 bg-white text-gray-500 font-bold">OR</span>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-8 px-6 rounded-2xl font-bold text-2xl shadow-xl flex items-center justify-center gap-4"
                      >
                        <Upload className="w-8 h-8" />
                        Upload from Gallery
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  {capturedImage && (
                    <Button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-8 text-2xl font-bold shadow-xl rounded-xl"
                    >
                      <CheckCircle className="w-7 h-7 mr-3" />
                      Submit Prescription
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
      </PageWrapper>
  );
}