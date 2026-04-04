import { useCallback, useEffect, useRef, useState } from "react";
import apiHandler from "@/RESTAPIs/helper";

const LAST_VIEWED_KEY = "dashboardLastViewedAt";

export function getLastViewedAt() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_VIEWED_KEY);
}

export function setLastViewedNow() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
}

/**
 * @param {object} opts
 * @param {string|undefined} opts.include - comma list for API ?include=
 * @param {boolean} opts.sendSince - when true, sends ?since= last visit for deltaSince
 * @param {string|undefined} opts.from - ISO 8601 range start (optional; omit with to for rolling 24h)
 * @param {string|undefined} opts.to - ISO 8601 range end
 * @param {number} opts.pollMs - poll interval when tab visible (0 = off)
 * @param {boolean} opts.enabled - when false, skips fetch (e.g. invalid custom range)
 */
export function useDashboardSummary({
  include,
  sendSince = true,
  from,
  to,
  pollMs = 60000,
  enabled = true,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const timerRef = useRef(null);
  const hasLoadedOnce = useRef(false);

  const fetchSummary = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const params = {};
    if (include) params.include = include;
    if (from && to) {
      params.from = from;
      params.to = to;
    }
    if (sendSince) {
      const since = getLastViewedAt();
      if (since) params.since = since;
    }
    if (!hasLoadedOnce.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const res = await apiHandler("GET", "dashboard/summary", true, false, undefined, params);
      setData(res.data.data);
      setRefreshedAt(new Date().toISOString());
      hasLoadedOnce.current = true;
    } catch (e) {
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [include, sendSince, enabled, from, to]);

  useEffect(() => {
    if (!enabled) return undefined;
    hasLoadedOnce.current = false;
    fetchSummary();
    return undefined;
  }, [fetchSummary, enabled]);

  useEffect(() => {
    if (!pollMs || !enabled) return undefined;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      fetchSummary();
    };

    timerRef.current = setInterval(tick, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pollMs, fetchSummary, enabled]);

  return {
    data,
    loading,
    refreshing,
    error,
    refreshedAt,
    refresh: fetchSummary,
  };
}
