import { db, nextId } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import { enrich, parseServiceInput, stockProblem, deductStock, computeCost } from '@/lib/services';

export const dynamic = 'force-dynamic';

// GET /api/service-records            -> all logs
// GET /api/service-records?vehicleId= -> history for one vehicle
export async function GET(req) {
  const vehicleId = new URL(req.url).searchParams.get('vehicleId');
  const list = db.serviceRecords
    .filter((s) => !vehicleId || s.vehicleId === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return ok(list.map(enrich));
}

export async function POST(req) {
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');
  const { error, value } = parseServiceInput(body);
  if (error) return fail(error);

  const problem = stockProblem(value.partIds);
  if (problem) return fail(problem, 409);

  deductStock(value.partIds);
  const record = { id: nextId('S'), ...value, totalCost: computeCost(value.partIds) };
  db.serviceRecords.push(record);
  return ok(enrich(record), 201);
}
