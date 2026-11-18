import { db } from '@/lib/db';
import { ok, fail, readBody } from '@/lib/http';
import {
  enrich, parseServiceInput, stockProblem, deductStock, restoreStock, computeCost,
} from '@/lib/services';

export const dynamic = 'force-dynamic';

const find = (id) => db.serviceRecords.find((s) => s.id === id);

export async function GET(_req, { params }) {
  const rec = find(params.id);
  return rec ? ok(enrich(rec)) : fail('Service record not found', 404);
}

export async function PUT(req, { params }) {
  const rec = find(params.id);
  if (!rec) return fail('Service record not found', 404);
  const body = await readBody(req);
  if (!body) return fail('Invalid JSON body');

  const { error, value } = parseServiceInput({
    vehicleId: rec.vehicleId,
    date: rec.date,
    serviceType: rec.serviceType,
    partIds: rec.partIds,
    ...body,
  });
  if (error) return fail(error);

  const problem = stockProblem(value.partIds, rec.partIds);
  if (problem) return fail(problem, 409);

  // give back the old parts, take the new ones, recompute cost
  restoreStock(rec.partIds);
  deductStock(value.partIds);
  Object.assign(rec, value, { totalCost: computeCost(value.partIds) });
  return ok(enrich(rec));
}

export async function DELETE(_req, { params }) {
  const i = db.serviceRecords.findIndex((s) => s.id === params.id);
  if (i === -1) return fail('Service record not found', 404);
  const [removed] = db.serviceRecords.splice(i, 1);
  restoreStock(removed.partIds);
  return ok({ message: 'Service record deleted and stock restored', record: removed });
}
