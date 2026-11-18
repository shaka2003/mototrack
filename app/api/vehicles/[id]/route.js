import { db } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import { validateVehicle } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const find = (id) => db.vehicles.find((v) => v.id === id);

export async function GET(_req, { params }) {
  const v = find(params.id);
  return v ? ok(v) : fail('Vehicle not found', 404);
}

export async function PUT(req, { params }) {
  const v = find(params.id);
  if (!v) return fail('Vehicle not found', 404);
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');
  const { error, value } = validateVehicle({ ...v, ...body });
  if (error) return fail(error);
  if (db.vehicles.some((x) => x.id !== v.id && x.plate.toLowerCase() === value.plate.toLowerCase())) {
    return fail('A vehicle with this plate already exists', 409);
  }
  Object.assign(v, value);
  return ok(v);
}

export async function DELETE(_req, { params }) {
  const i = db.vehicles.findIndex((v) => v.id === params.id);
  if (i === -1) return fail('Vehicle not found', 404);
  if (db.serviceRecords.some((s) => s.vehicleId === params.id)) {
    return fail('This vehicle has service records. Delete those records first.', 409);
  }
  const [removed] = db.vehicles.splice(i, 1);
  return ok({ message: 'Vehicle deleted', vehicle: removed });
}
