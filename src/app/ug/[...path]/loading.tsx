import { Header, Footer } from "@/components-ug/shell";

export default function ArticleLoading() {
  return (
    <>
      <Header categories={[]} />
      <main id="main" className="site-width article-layout skeleton-active" aria-busy="true">
        <div className="article-breadcrumb skeleton-breadcrumb">
          <div className="skeleton-bar" style={{ width: 60, height: 14 }} />
          <span>/</span>
          <div className="skeleton-bar" style={{ width: 80, height: 14 }} />
          <span>/</span>
          <div className="skeleton-bar" style={{ width: 140, height: 14 }} />
        </div>

        <div className="article-grid">
          <div className="article-main-col">
            <article className="article">
              <header className="article-header">
                <div className="skeleton-bar" style={{ width: 100, height: 16, margin: "0 auto 16px" }} />
                <div className="skeleton-bar" style={{ width: "90%", height: 38, margin: "0 auto 12px" }} />
                <div className="skeleton-bar" style={{ width: "65%", height: 38, margin: "0 auto 20px" }} />
                <div className="article-byline" style={{ border: "none", justifyContent: "center", gap: 16 }}>
                  <div className="skeleton-bar" style={{ width: 120, height: 14 }} />
                  <div className="skeleton-bar" style={{ width: 90, height: 14 }} />
                  <div className="skeleton-bar" style={{ width: 80, height: 14 }} />
                </div>
              </header>

              <div className="article-body">
                <div
                  className="skeleton-bar"
                  style={{
                    float: "left",
                    width: 360,
                    maxWidth: "46%",
                    height: 220,
                    borderRadius: 8,
                    margin: "8px 24px 20px 0",
                  }}
                />
                <div className="skeleton-bar" style={{ width: "100%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "95%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "98%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "88%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "92%", height: 18, marginBottom: 28 }} />

                <div className="skeleton-bar" style={{ width: "100%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "96%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "90%", height: 18, marginBottom: 14 }} />
                <div className="skeleton-bar" style={{ width: "94%", height: 18, marginBottom: 14 }} />
              </div>
            </article>
          </div>

          {/* Sidebar Skeleton */}
          <aside className="article-sidebar" aria-hidden="true">
            <div className="sidebar-sticky-wrap">
              <div className="sidebar-widget">
                <div className="skeleton-bar" style={{ width: 120, height: 18, marginBottom: 16 }} />
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div className="skeleton-bar" style={{ width: 72, height: 60, borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-bar" style={{ width: "90%", height: 14, marginBottom: 8 }} />
                      <div className="skeleton-bar" style={{ width: "60%", height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
