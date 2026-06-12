import { NextRequest, NextResponse } from 'next/server';
import { getVoteHistory } from '@/lib/hive';
import { calculateCurationQualityScore } from '@/lib/curation-score';
import type { VoteHistoryEntry, CurationQualityScore } from '@/types/hive';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  result: CurationQualityScore;
  cachedAt: number;
}

// Module-level cache — survives across requests in the same server process
const cache = new Map<string, CacheEntry>();

function parseVotes(rawVotes: any[]): VoteHistoryEntry[] {
  return rawVotes.map((entry: any) => {
    const transaction = entry[1];
    const opData = transaction.op[1];
    return {
      transactionNumber: entry[0],
      timestamp: transaction.timestamp,
      voter: opData.voter,
      author: opData.author,
      permlink: opData.permlink,
      weight: opData.weight,
    };
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account')?.toLowerCase().replace(/^@/, '');

  if (!account || !/^[a-z0-9._-]{3,16}$/.test(account)) {
    return NextResponse.json(
      { error: 'Invalid or missing account parameter' },
      { status: 400 }
    );
  }

  const now = Date.now();
  const cached = cache.get(account);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      account,
      ...cached.result,
      cachedAt: new Date(cached.cachedAt).toISOString(),
      fromCache: true,
      cacheExpiresIn: Math.round((CACHE_TTL_MS - (now - cached.cachedAt)) / 1000),
    });
  }

  try {
    const rawVotes = await getVoteHistory(account, 7);
    const votes = parseVotes(rawVotes);
    const result = calculateCurationQualityScore(votes, 7);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not calculate score — account may not exist or has no vote history' },
        { status: 404 }
      );
    }

    cache.set(account, { result, cachedAt: now });

    return NextResponse.json({
      account,
      ...result,
      cachedAt: new Date(now).toISOString(),
      fromCache: false,
      cacheExpiresIn: Math.round(CACHE_TTL_MS / 1000),
    });
  } catch (error) {
    console.error(`[CQS API] Failed for ${account}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Hive nodes' },
      { status: 502 }
    );
  }
}
