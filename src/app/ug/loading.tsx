import { Header, Footer } from "@/components-ug/shell";

export default function HomeLoading() {
  return (
    <>
      <Header categories={[]} />
      <main id="main" className="site-width editorial-layout skeleton-active" aria-busy="true">
        {/* Region Rail Skeleton */}
        <aside className="region-rail" aria-hidden="true">
          <div className="skeleton-bar" style={{ width: 100, height: 16, marginBottom: 16 }} />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-bar" style={{ width: "80%", height: 16, marginBottom: 12 }} />
          ))}
        </aside>

        {/* Main Column Grid Skeleton */}
        <div className="main-column">
          <div className="listing-header" style={{ marginBottom: 24 }}>
            <div className="skeleton-bar" style={{ width: 120, height: 14, marginBottom: 10 }} />
            <div className="skeleton-bar" style={{ width: 220, height: 32, marginBottom: 12 }} />
            <div className="skeleton-bar" style={{ width: 80, height: 14 }} />
          </div>

          <div className="posts-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="post-card skeleton-card" style={{ padding: 14, border: "1px solid var(--rule)", borderRadius: 8 }}>
                <div className="skeleton-bar" style={{ width: "100%", aspectRatio: "16/10", borderRadius: 6, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "40%", height: 12, marginBottom: 10 }} />
                <div className="skeleton-bar" style={{ width: "90%", height: 18, marginBottom: 8 }} />
                <div className="skeleton-bar" style={{ width: "70%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "100%", height: 12, marginBottom: 6 }} />
                <div className="skeleton-bar" style={{ width: "85%", height: 12 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Rail Skeleton */}
        <aside className="latest-rail" aria-hidden="true">
          <div className="skeleton-bar" style={{ width: 100, height: 16, marginBottom: 16 }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div className="skeleton-bar" style={{ width: "100%", height: 140, borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton-bar" style={{ width: "85%", height: 14, marginBottom: 6 }} />
              <div className="skeleton-bar" style={{ width: "50%", height: 12 }} />
            </div>
          ))}
        </aside>
      </main>
      <Footer />
    </>
  );
}
