import { db, nextId } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import { validateVehicle } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok(db.vehicles);
}

export async function POST(req) {
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');
  const { error, value } = validateVehicle(body);
  if (error) return fail(error);
  if (db.vehicles.some((v) => v.plate.toLowerCase() === value.plate.toLowerCase())) {
    return fail('A vehicle with this plate already exists', 409);
  }
  const vehicle = { id: nextId('V'), ...value };
  db.vehicles.push(vehicle);
  return ok(vehicle, 201);
}
