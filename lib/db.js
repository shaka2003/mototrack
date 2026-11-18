// In-memory JSON/dictionary store (no external database).
// Stored on globalThis so every API route handler shares the same state,
// even when Next.js reloads modules in development.

const seed = () => ({
  vehicles: [
    { id: 'V01', plate: 'D 4512 ABC', model: 'Honda PCX 160', odometerKm: 12500 },
    { id: 'V02', plate: 'D 8890 XYZ', model: 'Yamaha NMAX 155', odometerKm: 18200 },
  ],
  spareParts: [
    { id: 'P01', name: 'Synthetic Engine Oil 10W-30', price: 85000, stock: 10 },
    { id: 'P02', name: 'Front Brake Pad Set', price: 110000, stock: 5 },
    { id: 'P03', name: 'Air Filter Element', price: 65000, stock: 8 },
  ],
  serviceRecords: [
    {
      id: 'S01',
      vehicleId: 'V01',
      partIds: ['P01', 'P03'],
      date: '2026-11-15',
      serviceType: 'Routine 12,000 km Service',
      totalCost: 150000,
    },
  ],
  counters: { V: 2, P: 3, S: 1 },
});

if (!globalThis.__mototrackDb) globalThis.__mototrackDb = seed();

export const db = globalThis.__mototrackDb;

export function nextId(prefix) {
  db.counters[prefix] += 1;
  return prefix + String(db.counters[prefix]).padStart(2, '0');
}
