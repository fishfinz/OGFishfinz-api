import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import crypto from 'crypto';

export function normalizeAddress(addr) {
  if (!addr) return addr;
  if (addr.startsWith('ronin:')) return '0x' + addr.slice(6);
  return addr;
}

export function addCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export function ok(res, data) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function bad(res, code, message) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
}

export function getProvider() {
  const url = process.env.RONIN_RPC_URL;
  if (!url) throw new Error('Missing RONIN_RPC_URL');
  return new ethers.JsonRpcProvider(url);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// HMAC anti-cheat for run tokens
export function signRunToken(playerId, issuedAt) {
  const secret = process.env.RUN_HMAC_SECRET || 'dev-run-secret';
  const msg = `${playerId}:${issuedAt}`;
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}
export function verifyRunToken(playerId, issuedAt, token) {
  const expected = signRunToken(playerId, issuedAt);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)'
];
export const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)'
];
