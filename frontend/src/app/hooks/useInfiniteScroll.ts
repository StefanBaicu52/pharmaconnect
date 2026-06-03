import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; totalPages: number; total: number }>;
  pageSize?: number;
  deps?: unknown[];  // re-fetch from scratch when these change
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  prepend: (newItems: T[]) => void;
}

/**
 * Gold challenge: infinite scroll with backend pagination.
 * Prefetches the next page while the user reads the current one.
 */
export function useInfiniteScroll<T>({
  fetcher,
  pageSize = 5,
  deps = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const prefetchedRef = useRef<{ page: number; data: T[]; total: number; totalPages: number } | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      let result: { data: T[]; totalPages: number; total: number };

      // Use prefetched data if available for this page
      if (prefetchedRef.current?.page === pageNum) {
        result = prefetchedRef.current;
        prefetchedRef.current = null;
      } else {
        result = await fetcher(pageNum, pageSize);
      }

      setTotalPages(result.totalPages);
      setTotal(result.total);
      setItems(prev => append ? [...prev, ...result.data] : result.data);

      // Prefetch next page in background
      const nextPage = pageNum + 1;
      if (nextPage <= result.totalPages) {
        fetcher(nextPage, pageSize).then(next => {
          prefetchedRef.current = { page: nextPage, ...next };
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Infinite scroll fetch error', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetcher, pageSize]);

  // Reset when deps change
  useEffect(() => {
    prefetchedRef.current = null;
    setPage(1);
    setItems([]);
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pageSize]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    if (nextPage > totalPages || loading) return;
    setPage(nextPage);
    load(nextPage, true);
  }, [page, totalPages, loading, load]);

  const reset = useCallback(() => {
    prefetchedRef.current = null;
    setPage(1);
    setItems([]);
    load(1, false);
  }, [load]);

  const prepend = useCallback((newItems: T[]) => {
    setItems(prev => [...newItems, ...prev]);
    setTotal(t => t + newItems.length);
  }, []);

  return {
    items,
    total,
    loading,
    hasMore: page < totalPages,
    loadMore,
    reset,
    prepend,
  };
}