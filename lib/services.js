import { db } from './db';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const findPart = (id) => db.spareParts.find((p) => p.id === id);

// Adds vehicle + part names so the UI can show readable history.
export function enrich(rec) {
  const v = db.vehicles.find((x) => x.id === rec.vehicleId);
  return {
    ...rec,
    vehicle: v ? { id: v.id, plate: v.plate, model: v.model } : null,
    parts: rec.partIds.map((id) => {
      const p = findPart(id);
      return p ? { id: p.id, name: p.name, price: p.price } : { id, name: '(deleted part)', price: 0 };
    }),
  };
}

export function parseServiceInput(b) {
  const vehicleId = String(b.vehicleId ?? '');
  if (!db.vehicles.some((v) => v.id === vehicleId)) return { error: 'Vehicle not found' };

  const date = String(b.date ?? '');
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: 'Date must be in YYYY-MM-DD format' };
  }

  const serviceType = String(b.serviceType ?? '').trim();
  if (!serviceType) return { error: 'Service type is required' };

  if (!Array.isArray(b.partIds)) return { error: 'partIds must be an array' };
  const partIds = [...new Set(b.partIds.map(String))];
  for (const id of partIds) {
    if (!findPart(id)) return { error: `Spare part ${id} not found` };
  }
  return { value: { vehicleId, date, serviceType, partIds } };
}

// oldPartIds = parts already deducted by this record (when editing),
// so keeping the same part doesn't need extra stock.
export function stockProblem(partIds, oldPartIds = []) {
  for (const id of partIds) {
    const p = findPart(id);
    const available = p.stock + (oldPartIds.includes(id) ? 1 : 0);
    if (available < 1) return `${p.name} is out of stock`;
  }
  return null;
}

export function deductStock(partIds) {
  for (const id of partIds) {
    const p = findPart(id);
    if (p) p.stock -= 1;
  }
}

export function restoreStock(partIds) {
  for (const id of partIds) {
    const p = findPart(id);
    if (p) p.stock += 1;
  }
}

export function computeCost(partIds) {
  return partIds.reduce((sum, id) => sum + (findPart(id)?.price ?? 0), 0);
}
