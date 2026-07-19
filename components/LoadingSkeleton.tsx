export default function LoadingSkeleton() {
  return (
    <div className="herb-grid" id="loading-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image skeleton-shimmer"></div>
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line-lg skeleton-shimmer"></div>
            <div className="skeleton-line skeleton-line-sm skeleton-shimmer"></div>
            <div className="skeleton-line skeleton-line-md skeleton-shimmer"></div>
            <div className="skeleton-tags">
              <div className="skeleton-tag skeleton-shimmer"></div>
              <div className="skeleton-tag skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
