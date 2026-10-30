export async function POST() {
  return Response.json({ error: 'Payments are unavailable in this read-only demo.' }, { status: 503 })
}
