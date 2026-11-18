import { db } from '@/lib/db';
import { ok, fail } from '@/lib/http';
import { enrich } from '@/lib/services';

export const dynamic = 'force-dynamic';

// Multi-entity read: Vehicle + ServiceRecord + SparePart
export async function GET(_req, { params }) {
  const vehicle = db.vehicles.find((v) => v.id === params.id);
  if (!vehicle) return fail('Vehicle not found', 404);

  const records = db.serviceRecords
    .filter((s) => s.vehicleId === vehicle.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .map(enrich);

  return ok({
    vehicle,
    totalServices: records.length,
    cumulativeCost: records.reduce((sum, r) => sum + r.totalCost, 0),
    records,
  });
}
