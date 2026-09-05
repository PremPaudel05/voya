// Legacy provider routes stay closed even when invoked directly on Vercel.
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ code: 'PLANNER_MOVED', error: 'Please refresh Voya and use the signed-in trip planner.' });
}
