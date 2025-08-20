import http from 'http';
import url from 'url';
import { handler as nonceHandler } from './api/auth/nonce.js';
import { handler as verifyHandler } from './api/auth/verify.js';
import { handler as ownershipHandler } from './api/ownership.js';
import { handler as scoreSubmit } from './api/score/submit.js';
import { handler as leaderboardTop } from './api/leaderboard/top.js';
import { handler as seasonCurrent } from './api/season/current.js';
import { handler as claimEligible } from './api/claim/eligible.js';
import { handler as claimBadge } from './api/claim/badge.js';
import { handler as runStart } from './api/run/start.js';

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }

  const pathname = url.parse(req.url, true).pathname;

  try {
    if (pathname === '/api/auth/nonce' && req.method === 'GET') return nonceHandler(req, res);
    if (pathname === '/api/auth/verify' && req.method === 'POST') return verifyHandler(req, res);
    if (pathname === '/api/ownership' && req.method === 'POST') return ownershipHandler(req, res);
    if (pathname === '/api/score/submit' && req.method === 'POST') return scoreSubmit(req, res);
    if (pathname === '/api/leaderboard/top' && req.method === 'GET') return leaderboardTop(req, res);
    if (pathname === '/api/season/current') return seasonCurrent(req, res);
    if (pathname === '/api/claim/eligible' && req.method === 'GET') return claimEligible(req, res);
    if (pathname === '/api/claim/badge' && req.method === 'POST') return claimBadge(req, res);
    if (pathname === '/api/run/start' && req.method === 'POST') return runStart(req, res);
    res.statusCode = 404; res.end('Not Found');
  } catch (e) {
    console.error(e);
    res.statusCode = 500; res.end('Internal Error');
  }
});

server.listen(process.env.PORT || 8787, () => console.log('OGFishfinz API running on :' + (process.env.PORT || 8787)));
