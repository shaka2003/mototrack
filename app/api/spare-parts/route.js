import { db, nextId } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import { validatePart } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok(db.spareParts);
}

export async function POST(req) {
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');
  const { error, value } = validatePart(body);
  if (error) return fail(error);
  const part = { id: nextId('P'), ...value };
  db.spareParts.push(part);
  return ok(part, 201);
}
