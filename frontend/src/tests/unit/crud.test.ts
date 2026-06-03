import { describe, it, expect, beforeEach } from 'vitest';
import { validatePrescription, validateOrder } from '../../app/context/AppContext';

// ─── Validation tests ───────────────────────────────────────────────────────

describe('validatePrescription', () => {
  it('passes with valid data', () => {
    const errs = validatePrescription({
      medicationName: 'Aspirin 100mg',
      doctor: 'Dr. Ion Popescu',
      date: '01/01/2026',
    });
    expect(Object.keys(errs)).toHaveLength(0);
  });

  it('fails when medicationName is too short', () => {
    const errs = validatePrescription({ medicationName: 'Ab', doctor: 'Dr. Ion Popescu', date: '01/01/2026' });
    expect(errs.medicationName).toBeDefined();
  });

  it('fails when medicationName is empty', () => {
    const errs = validatePrescription({ medicationName: '', doctor: 'Dr. Ion Popescu', date: '01/01/2026' });
    expect(errs.medicationName).toBeDefined();
  });

  it('fails when doctor name is too short', () => {
    const errs = validatePrescription({ medicationName: 'Aspirin 100mg', doctor: 'Dr.', date: '01/01/2026' });
    expect(errs.doctor).toBeDefined();
  });

  it('fails when date format is wrong', () => {
    const errs = validatePrescription({ medicationName: 'Aspirin 100mg', doctor: 'Dr. Ion Popescu', date: '2026-01-01' });
    expect(errs.date).toBeDefined();
  });

  it('fails when date is missing', () => {
    const errs = validatePrescription({ medicationName: 'Aspirin 100mg', doctor: 'Dr. Ion Popescu', date: '' });
    expect(errs.date).toBeDefined();
  });
});

describe('validateOrder', () => {
  it('passes with valid address and phone', () => {
    const errs = validateOrder({ address: 'Str. Libertății 25', phone: '+40712345678' });
    expect(Object.keys(errs)).toHaveLength(0);
  });

  it('fails with empty address', () => {
    const errs = validateOrder({ address: '', phone: '+40712345678' });
    expect(errs.address).toBeDefined();
  });

  it('fails with short address', () => {
    const errs = validateOrder({ address: 'Str', phone: '+40712345678' });
    expect(errs.address).toBeDefined();
  });

  it('fails with invalid phone', () => {
    const errs = validateOrder({ address: 'Str. Libertății 25', phone: '123' });
    expect(errs.phone).toBeDefined();
  });

  it('fails with empty phone', () => {
    const errs = validateOrder({ address: 'Str. Libertății 25', phone: '' });
    expect(errs.phone).toBeDefined();
  });
});

// ─── In-memory CRUD simulation ───────────────────────────────────────────────

import type { Prescription } from '../../app/context/AppContext';

function createStore(initial: Prescription[] = []) {
  let items = [...initial];
  let nextId = initial.length ? Math.max(...initial.map(p => p.id)) + 1 : 1;

  return {
    getAll: () => items,
    get: (id: number) => items.find(p => p.id === id),
    add: (data: Omit<Prescription, 'id'>): Prescription => {
      const p = { ...data, id: nextId++ };
      items = [...items, p];
      return p;
    },
    update: (id: number, data: Partial<Prescription>) => {
      items = items.map(p => p.id === id ? { ...p, ...data } : p);
    },
    delete: (id: number) => {
      items = items.filter(p => p.id !== id);
    },
    deleteMany: (ids: number[]) => {
      items = items.filter(p => !ids.includes(p.id));
    },
  };
}

describe('Prescription CRUD (in-memory)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore([
      { id: 1, medicationName: 'Aspirin 100mg', doctor: 'Dr. Maria Ionescu', date: '15/03/2026', status: 'Delivered', daysRemaining: 10 },
      { id: 2, medicationName: 'Metformin 500mg', doctor: 'Dr. Ion Popescu', date: '16/03/2026', status: 'Pending', daysRemaining: 5 },
    ]);
  });

  it('returns all prescriptions', () => {
    expect(store.getAll()).toHaveLength(2);
  });

  it('gets a prescription by id', () => {
    const p = store.get(1);
    expect(p?.medicationName).toBe('Aspirin 100mg');
  });

  it('returns undefined for non-existent id', () => {
    expect(store.get(999)).toBeUndefined();
  });

  it('adds a new prescription', () => {
    const added = store.add({ medicationName: 'Lisinopril 10mg', doctor: 'Dr. Ana Dumitrescu', date: '20/03/2026', status: 'Pending' });
    expect(store.getAll()).toHaveLength(3);
    expect(added.id).toBeDefined();
    expect(added.medicationName).toBe('Lisinopril 10mg');
  });

  it('added prescription is retrievable by id', () => {
    const added = store.add({ medicationName: 'Losartan 50mg', doctor: 'Dr. Gheorghe Popa', date: '21/03/2026', status: 'Pending' });
    const found = store.get(added.id);
    expect(found?.medicationName).toBe('Losartan 50mg');
  });

  it('updates an existing prescription', () => {
    store.update(1, { status: 'Pending', medicationName: 'Aspirin 200mg' });
    expect(store.get(1)?.status).toBe('Pending');
    expect(store.get(1)?.medicationName).toBe('Aspirin 200mg');
  });

  it('update does not affect other prescriptions', () => {
    store.update(1, { status: 'Pending' });
    expect(store.get(2)?.status).toBe('Pending');
    expect(store.get(2)?.medicationName).toBe('Metformin 500mg');
  });

  it('deletes a prescription by id', () => {
    store.delete(1);
    expect(store.getAll()).toHaveLength(1);
    expect(store.get(1)).toBeUndefined();
  });

  it('deletes multiple prescriptions', () => {
    store.deleteMany([1, 2]);
    expect(store.getAll()).toHaveLength(0);
  });

  it('deleteMany only removes specified ids', () => {
    store.add({ medicationName: 'Extra', doctor: 'Dr. Extra Extra', date: '01/04/2026', status: 'Pending' });
    store.deleteMany([1]);
    expect(store.getAll()).toHaveLength(2);
    expect(store.get(1)).toBeUndefined();
    expect(store.get(2)).toBeDefined();
  });

  it('pagination slices correctly', () => {
    for (let i = 3; i <= 8; i++) {
      store.add({ medicationName: `Med ${i}`, doctor: 'Dr. Test Testescu', date: '01/04/2026', status: 'Pending' });
    }
    const all = store.getAll();
    const page1 = all.slice(0, 5);
    const page2 = all.slice(5, 10);
    expect(page1).toHaveLength(5);
    expect(page2).toHaveLength(3);
  });
});
