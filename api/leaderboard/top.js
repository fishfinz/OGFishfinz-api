import { addCors, bad, ok, getSupabaseAdmin } from '../_lib/utils.js';
import { parse } from 'url';

export async function handler(req, res) {
  addCors(res);
  if (req.method !== 'GET') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

  const supa = getSupabaseAdmin();
  const { query } = parse(req.url, true);
  const limit = Math.min(parseInt(query.limit || '20', 10), 100);
  const season = query.season ? parseInt(query.season, 10) : null;

  if (season) {
    const { data, error } = await supa
      .from('season_profiles')
      .select('player_id, best_score, last_seen')
      .eq('season', season)
      .order('best_score', { ascending: false })
      .limit(limit);
    if (error) return bad(res, 500, 'Failed to fetch leaderboard');
    return ok(res, { top: data });
  } else {
    const { data, error } = await supa
      .from('profiles')
      .select('player_id, best_score, last_seen')
      .order('best_score', { ascending: false })
      .limit(limit);
    if (error) return bad(res, 500, 'Failed to fetch leaderboard');
    return ok(res, { top: data });
  }
}
export default handler;
