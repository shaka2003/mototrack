import { db } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import { validatePart } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const find = (id) => db.spareParts.find((p) => p.id === id);

export async function GET(_req, { params }) {
  const p = find(params.id);
  return p ? ok(p) : fail('Spare part not found', 404);
}

export async function PUT(req, { params }) {
  const p = find(params.id);
  if (!p) return fail('Spare part not found', 404);
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');
  const { error, value } = validatePart({ ...p, ...body });
  if (error) return fail(error);
  Object.assign(p, value);
  return ok(p);
}

export async function DELETE(_req, { params }) {
  const i = db.spareParts.findIndex((p) => p.id === params.id);
  if (i === -1) return fail('Spare part not found', 404);
  const [removed] = db.spareParts.splice(i, 1);
  return ok({ message: 'Spare part deleted', part: removed });
}
