export async function GET() {
  return Response.json({ error: 'Sign-in is unavailable in this read-only demo.' }, { status: 503 })
}
