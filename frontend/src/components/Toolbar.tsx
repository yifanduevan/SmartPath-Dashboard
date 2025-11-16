export function Toolbar({ lastUpdated, hasError }: { lastUpdated: Date | null; hasError: boolean }) {
  return (
<div className="toolbar">
        <p className="muted">
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
        </p>
        {hasError && <p className="error">Failed to fetch metrics. Retrying…</p>}
</div>
  );
}