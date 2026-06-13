/**
 * API client for communicating with the FastAPI backend.
 * All backtest and price endpoints are defined here.
 */

import type { BacktestRequest, BacktestResponse, PricePoint } from "../types";

// Base URL defaults to the FastAPI dev server; override via env var if needed
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Fetch historical prices for a symbol within a date range.
 * Calls GET /api/prices?symbol=...&from=...&to=...
 */
export async function fetchPrices(
  symbol: string,
  from: string,
  to: string
): Promise<PricePoint[]> {
  const params = new URLSearchParams({ symbol, from, to });
  const res = await fetch(`${BASE_URL}/api/prices?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Failed to fetch prices (${res.status})`);
  }
  return res.json();
}

/**
 * Run a full backtest simulation.
 * Calls POST /api/backtest with the provided parameters.
 */
export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const res = await fetch(`${BASE_URL}/api/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Backtest failed (${res.status})`);
  }
  return res.json();
}
