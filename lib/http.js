export const ok = (data, status = 200) => Response.json(data, { status });
export const fail = (message, status = 400) => Response.json({ error: message }, { status });

export async function readBody(req) {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}
