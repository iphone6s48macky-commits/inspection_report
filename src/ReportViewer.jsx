import { useState, useEffect } from "react";
import { INSPECTION_ITEMS, STATUS_CONFIG } from "./constants.js";
import { decodeReportData } from "./utils.js";

const CATEGORY_ICONS = {
  "ブレーキ": "🛑",
  "ステアリング": "🔄",
  "灯火・視界": "💡",
  "タイヤ": "⚫",
  "エンジン": "⚙️",
};

export default function ReportViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (!hash.startsWith("#data=")) { setError(true); return; }
      const encoded = hash.slice(6);
      setData(decodeReportData(encoded));
    } catch {
      setError(true);
    }
  }, []);

  if (error) return <ErrorPage />;
  if (!data) return <LoadingPage />;

  const { name, plate, mileage, date, results, comments, overallComment, photos } = data;
  const badItems     = INSPECTION_ITEMS.filter((i) => results[i.id] === "bad");
  const cautionItems = INSPECTION_ITEMS.filter((i) => results[i.id] === "caution");
  const goodCount    = INSPECTION_ITEMS.filter((i) => results[i.id] === "good").length;
  const categories   = [...new Set(INSPECTION_ITEMS.map((i) => i.category))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
      color: "#f1f5f9",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {/* ヘッダー */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
        padding: "24px 20px 20px",
        borderBottom: "1px solid #1e40af44",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🔧</div>
          <div>
            <div style={{ fontSize: 12, color: "#93c5fd", letterSpacing: 2, fontWeight: 600 }}>macky's car shop</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>出張点検レポート</div>
          </div>
        </div>

        {/* 車両情報 */}
        <div style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{formatDate(date)}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{name} 様</div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94a3b8" }}>
            <span>🚗 {plate}</span>
            {mileage && <span>📍 {Number(mileage).toLocaleString()} km</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* サマリー */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: "良好",  count: goodCount,          color: "#22c55e", bg: "#052e16", border: "#166534" },
            { label: "要注意", count: cautionItems.length, color: "#f59e0b", bg: "#1c1a09", border: "#854d0e" },
            { label: "要修理", count: badItems.length,    color: "#ef4444", bg: "#1c0a0a", border: "#991b1b" },
          ].map(({ label, count, color, bg, border }) => (
            <div key={label} style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: 12, padding: "14px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 要対応項目ハイライト */}
        {(badItems.length > 0 || cautionItems.length > 0) && (
          <div style={{
            background: "#1c0a0a", border: "1px solid #7f1d1d",
            borderRadius: 14, padding: "16px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5", marginBottom: 12 }}>
              ⚠️ 要対応項目
            </div>
            {badItems.map((item) => (
              <AlertItem key={item.id} item={item} status="bad" comment={comments?.[item.id]} photo={photos?.[item.id]} />
            ))}
            {cautionItems.map((item) => (
              <AlertItem key={item.id} item={item} status="caution" comment={comments?.[item.id]} photo={photos?.[item.id]} />
            ))}
          </div>
        )}

        {/* 整備士コメント */}
        {overallComment && (
          <div style={{
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: 14, padding: "16px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
              💬 整備士からのコメント
            </div>
            <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {overallComment}
            </div>
          </div>
        )}

        {/* 全項目詳細 */}
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, letterSpacing: 1, fontWeight: 600 }}>
          点検項目詳細
        </div>

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              color: "#3b82f6", marginBottom: 8,
            }}>
              <span>{CATEGORY_ICONS[cat] || "▍"}</span>
              <span>{cat}</span>
            </div>

            {INSPECTION_ITEMS.filter((i) => i.category === cat).map((item) => {
              const status = results?.[item.id];
              const cfg = STATUS_CONFIG[status];
              const comment = comments?.[item.id];
              const photo = photos?.[item.id];

              return (
                <div key={item.id} style={{
                  background: cfg ? cfg.bg : "#1e293b",
                  border: `1px solid ${cfg ? cfg.border : "#334155"}`,
                  borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", flex: 1, paddingRight: 8 }}>
                      {item.label}
                    </div>
                    {cfg && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <span>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </span>
                    )}
                  </div>
                  {comment && (
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>
                      {comment}
                    </div>
                  )}
                  {photo && (
                    <img src={photo} alt={item.label} style={{
                      width: "100%", borderRadius: 8, marginTop: 8,
                      maxHeight: 180, objectFit: "cover",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* フッター */}
        <div style={{
          marginTop: 8, paddingTop: 20,
          borderTop: "1px solid #1e293b",
          textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #1e3a5f, #0f2744)",
            border: "1px solid #1e40af44",
            borderRadius: 12, padding: "12px 20px",
          }}>
            <span style={{ fontSize: 18 }}>🔧</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>macky's car shop</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>堺市美原区 出張整備</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
            点検日：{formatDate(date)}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ item, status, comment, photo }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: cfg.color, fontWeight: 700, flexShrink: 0,
        }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{item.label}</div>
          {comment && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{comment}</div>}
        </div>
      </div>
      {photo && (
        <img src={photo} alt={item.label} style={{
          width: "100%", borderRadius: 8, marginTop: 8,
          maxHeight: 160, objectFit: "cover",
        }} />
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}年${m}月${d}日`;
}

function LoadingPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
        <div>読み込み中...</div>
      </div>
    </div>
  );
}

function ErrorPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
          レポートを読み込めません
        </div>
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
          URLが正しいか確認してください。<br />
          整備士にURLを再送してもらってください。
        </div>
      </div>
    </div>
  );
}
