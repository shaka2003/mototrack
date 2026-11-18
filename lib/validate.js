export function validateVehicle(b) {
  const plate = String(b.plate ?? '').trim();
  const model = String(b.model ?? '').trim();
  const odometerKm = Number(b.odometerKm);
  if (!plate) return { error: 'License plate is required' };
  if (!model) return { error: 'Model name is required' };
  if (!Number.isFinite(odometerKm) || odometerKm < 0) {
    return { error: 'Odometer must be a number of 0 or more' };
  }
  return { value: { plate, model, odometerKm: Math.round(odometerKm) } };
}

export function validatePart(b) {
  const name = String(b.name ?? '').trim();
  const price = Number(b.price);
  const stock = Number(b.stock);
  if (!name) return { error: 'Part name is required' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be a number of 0 or more' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number of 0 or more' };
  return { value: { name, price: Math.round(price), stock } };
}
