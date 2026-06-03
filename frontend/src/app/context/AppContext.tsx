import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Prescription {
  id: number;
  medicationName: string;
  doctor: string;
  date: string;
  status: 'Pending' | 'Delivered';
  daysRemaining?: number;
  address?: string;
  phone?: string;
  note?: string;
}

export interface Order {
  id: number;
  prescriptionId?: number;
  address: string;
  phone: string;
  note?: string;
  createdAt: string;
  step: number;
}

export interface ValidationErrors {
  medicationName?: string;
  doctor?: string;
  date?: string;
  address?: string;
  phone?: string;
}

const initialPrescriptions: Prescription[] = [
  { id: 1, medicationName: 'Aspirin 100mg', doctor: 'Dr. Maria Ionescu', date: '15/03/2026', status: 'Delivered', daysRemaining: 10 },
  { id: 2, medicationName: 'Metformin 500mg', doctor: 'Dr. Ion Popescu', date: '16/03/2026', status: 'Pending', daysRemaining: 5 },
  { id: 3, medicationName: 'Lisinopril 10mg', doctor: 'Dr. Ana Dumitrescu', date: '16/03/2026', status: 'Pending', daysRemaining: 1 },
  { id: 4, medicationName: 'Atorvastatin 20mg', doctor: 'Dr. Maria Ionescu', date: '17/03/2026', status: 'Delivered', daysRemaining: 12 },
  { id: 5, medicationName: 'Omeprazole 20mg', doctor: 'Dr. Gheorghe Popa', date: '17/03/2026', status: 'Pending', daysRemaining: 8 },
  { id: 6, medicationName: 'Amlodipine 5mg', doctor: 'Dr. Ion Popescu', date: '18/03/2026', status: 'Delivered', daysRemaining: 15 },
  { id: 7, medicationName: 'Losartan 50mg', doctor: 'Dr. Ana Dumitrescu', date: '18/03/2026', status: 'Pending', daysRemaining: 3 },
];

export function validatePrescription(data: Partial<Prescription>): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.medicationName || data.medicationName.trim().length < 3) {
    errors.medicationName = 'Medication name must be at least 3 characters.';
  }
  if (!data.doctor || data.doctor.trim().length < 5) {
    errors.doctor = 'Doctor name must be at least 5 characters.';
  }
  if (!data.date || !/^\d{2}\/\d{2}\/\d{4}$/.test(data.date)) {
    errors.date = 'Date must be in DD/MM/YYYY format.';
  }
  return errors;
}

export function validateOrder(data: { address: string; phone: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.address || data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters.';
  }
  if (!data.phone || !/^\+?[\d\s\-]{10,15}$/.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (10-15 digits).';
  }
  return errors;
}

interface AppContextType {
  prescriptions: Prescription[];
  addPrescription: (p: Omit<Prescription, 'id'>) => Prescription;
  updatePrescription: (id: number, p: Partial<Prescription>) => void;
  deletePrescription: (id: number) => void;
  deletePrescriptions: (ids: number[]) => void;
  getPrescription: (id: number) => Prescription | undefined;
  orders: Order[];
  addOrder: (o: Omit<Order, 'id' | 'createdAt' | 'step'>) => Order;
  updateOrderStep: (id: number, step: number) => void;
  currentUser: { name: string; email: string };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [orders, setOrders] = useState<Order[]>([]);
  const currentUser = { name: 'Maria', email: 'maria@example.com' };

  // Cookie-based activity tracking
  useEffect(() => {
    const visits = parseInt(getCookie('visit_count') || '0') + 1;
    setCookie('visit_count', String(visits), 365);
    setCookie('last_visit', new Date().toISOString(), 365);
  }, []);

  const addPrescription = (p: Omit<Prescription, 'id'>): Prescription => {
    const newP: Prescription = { ...p, id: Date.now() };
    setPrescriptions(prev => [...prev, newP]);
    trackActivity('add_prescription', p.medicationName);
    return newP;
  };

  const updatePrescription = (id: number, p: Partial<Prescription>) => {
    setPrescriptions(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    trackActivity('update_prescription', String(id));
  };

  const deletePrescription = (id: number) => {
    setPrescriptions(prev => prev.filter(item => item.id !== id));
    trackActivity('delete_prescription', String(id));
  };

  const deletePrescriptions = (ids: number[]) => {
    setPrescriptions(prev => prev.filter(item => !ids.includes(item.id)));
    trackActivity('delete_prescriptions', ids.join(','));
  };

  const getPrescription = (id: number) => prescriptions.find(p => p.id === id);

  const addOrder = (o: Omit<Order, 'id' | 'createdAt' | 'step'>): Order => {
    const newO: Order = { ...o, id: Date.now(), createdAt: new Date().toISOString(), step: 1 };
    setOrders(prev => [...prev, newO]);
    trackActivity('create_order', o.address);
    return newO;
  };

  const updateOrderStep = (id: number, step: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, step } : o));
  };

  return (
    <AppContext.Provider value={{
      prescriptions, addPrescription, updatePrescription,
      deletePrescription, deletePrescriptions, getPrescription,
      orders, addOrder, updateOrderStep, currentUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Cookie utilities
export function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function trackActivity(action: string, detail: string) {
  const log = JSON.parse(getCookie('activity_log') || '[]');
  log.push({ action, detail, time: new Date().toISOString() });
  if (log.length > 50) log.shift();
  setCookie('activity_log', JSON.stringify(log), 30);
}
