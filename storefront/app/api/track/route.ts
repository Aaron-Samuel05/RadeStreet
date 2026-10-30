export async function POST() {
  return Response.json({ error: 'Tracking is unavailable in this read-only demo.' }, { status: 503 })
}
