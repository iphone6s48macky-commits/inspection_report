import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { INSPECTION_ITEMS, STATUS_CONFIG } from "./constants.js";
import { resizePhoto, getReportUrl } from "./utils.js";

const categories = [...new Set(INSPECTION_ITEMS.map((i) => i.category))];

export default function InspectionApp() {
  const [step, setStep] = useState("info");
  const [carInfo, setCarInfo] = useState({
    name: "", plate: "", mileage: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [results, setResults] = useState({});
  const [photos, setPhotos] = useState({});
  const [comments, setComments] = useState({});
  const [overallComment, setOverallComment] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [reportUrl, setReportUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRefs = useRef({});
  const qrCanvasRef = useRef(null);

  const setStatus = (id, status) => setResults((r) => ({ ...r, [id]: status }));
  const setComment = (id, text) => setComments((c) => ({ ...c, [id]: text }));

  const handlePhoto = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await resizePhoto(file, 400, 0.6);
    setPhotos((p) => ({ ...p, [id]: base64 }));
  };

  const completedCount = Object.keys(results).length;
  const allDone = completedCount === INSPECTION_ITEMS.length;
  const badItems = INSPECTION_ITEMS.filter((i) => results[i.id] === "bad");
  const cautionItems = INSPECTION_ITEMS.filter((i) => results[i.id] === "caution");

  const buildPayload = useCallback(
    (includePhotos) => ({
      name: carInfo.name,
      plate: carInfo.plate,
      mileage: carInfo.mileage,
      date: carInfo.date,
      results,
      comments,
      overallComment,
      ...(includePhotos && Object.keys(photos).length > 0 ? { photos } : {}),
    }),
    [carInfo, results, comments, overallComment, photos]
  );

  useEffect(() => {
    if (step !== "preview") return;
    // 写真なしURL（LINEでリンクとして機能する長さに収める）
    const url = getReportUrl(buildPayload(false), false);
    setReportUrl(url);

    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#f1f5f9", light: "#1e293b" },
      });
    }
  }, [step, buildPayload]);

  const copyUrl = () => {
    navigator.clipboard.writeText(reportUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyReportText = () => {
    const lines = [
      "【出張点検レポート】",
      `お客様名：${carInfo.name}`,
      `ナンバー：${carInfo.plate}`,
      `走行距離：${carInfo.mileage}km`,
      `点検日：${carInfo.date}`,
      "",
      "▼点検結果",
      ...INSPECTION_ITEMS.map((item) => {
        const s = results[item.id];
        const label = STATUS_CONFIG[s]?.label || "未点検";
        const c = comments[item.id] ? `（${comments[item.id]}）` : "";
        return `・${item.label}：${label}${c}`;
      }),
      "",
      overallComment ? `▼整備士コメント\n${overallComment}` : "",
      "",
      `▼詳細レポート（写真付き）\n${reportUrl}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n")).then(() =>
      alert("コピーしました！LINEに貼り付けてください")
    );
  };

  const resetAll = () => {
    setStep("info");
    setResults({});
    setPhotos({});
    setComments({});
    setOverallComment("");
    setCarInfo({ name: "", plate: "", mileage: "", date: new Date().toISOString().split("T")[0] });
    setReportUrl("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
      color: "#f1f5f9",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
        padding: "20px 20px 16px",
        borderBottom: "1px solid #1e40af44",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🔧</div>
          <div>
            <div style={{ fontSize: 13, color: "#93c5fd", letterSpacing: 2, fontWeight: 600 }}>MOBILE MECHANIC</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>出張点検レポート</div>
          </div>
        </div>

        {step !== "info" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
              <span>点検進捗</span>
              <span>{completedCount} / {INSPECTION_ITEMS.length}項目</span>
            </div>
            <div style={{ height: 4, background: "#1e3a5f", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(completedCount / INSPECTION_ITEMS.length) * 100}%`,
                background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* STEP 1: 車両情報 */}
        {step === "info" && (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, letterSpacing: 1 }}>STEP 1 — 車両情報入力</div>
            {[
              { key: "name",    label: "お客様名",          placeholder: "山田 太郎",       type: "text" },
              { key: "plate",   label: "ナンバープレート",   placeholder: "品川 500 あ 1234", type: "text" },
              { key: "mileage", label: "走行距離（km）",     placeholder: "45000",            type: "number" },
              { key: "date",    label: "点検日",             placeholder: "",                 type: "date" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{label}</div>
                <input
                  type={type}
                  value={carInfo[key]}
                  onChange={(e) => setCarInfo((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    background: "#1e293b", border: "1px solid #334155",
                    color: "#f1f5f9", fontSize: 16, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                if (carInfo.name && carInfo.plate) setStep("inspect");
                else alert("お客様名とナンバーは必須です");
              }}
              style={{
                width: "100%", padding: "15px", marginTop: 8,
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
              }}
            >
              点検開始 →
            </button>
          </div>
        )}

        {/* STEP 2: 点検入力 */}
        {step === "inspect" && (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, letterSpacing: 1 }}>STEP 2 — 各項目を点検</div>

            {categories.map((cat) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#3b82f6", marginBottom: 8, paddingLeft: 2 }}>
                  ▍{cat}
                </div>

                {INSPECTION_ITEMS.filter((i) => i.category === cat).map((item) => {
                  const status = results[item.id];
                  const isOpen = activeItem === item.id;
                  const cfg = status ? STATUS_CONFIG[status] : null;

                  return (
                    <div key={item.id} style={{
                      background: cfg ? cfg.bg : "#1e293b",
                      border: `1px solid ${cfg ? cfg.border : "#334155"}`,
                      borderRadius: 12, marginBottom: 8, overflow: "hidden",
                      transition: "all 0.2s",
                    }}>
                      <div
                        onClick={() => setActiveItem(isOpen ? null : item.id)}
                        style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{item.label}</div>
                          {photos[item.id] && <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>📷 写真あり</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {cfg && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              padding: "3px 8px", borderRadius: 99,
                            }}>{cfg.label}</span>
                          )}
                          <span style={{ color: "#475569", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #0f172a" }}>
                          <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12 }}>
                            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
                              <button
                                key={key}
                                onClick={() => setStatus(item.id, key)}
                                style={{
                                  flex: 1, padding: "9px 4px", borderRadius: 8,
                                  border: `2px solid ${status === key ? c.color : "#334155"}`,
                                  background: status === key ? c.bg : "transparent",
                                  color: status === key ? c.color : "#64748b",
                                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>

                          <div style={{ marginBottom: 10 }}>
                            <input
                              type="file" accept="image/*" capture="environment"
                              ref={(el) => (fileRefs.current[item.id] = el)}
                              onChange={(e) => handlePhoto(item.id, e)}
                              style={{ display: "none" }}
                            />
                            <button
                              onClick={() => fileRefs.current[item.id]?.click()}
                              style={{
                                width: "100%", padding: "9px",
                                background: photos[item.id] ? "#1e3a5f" : "#0f172a",
                                border: "1px dashed #334155", borderRadius: 8,
                                color: "#64748b", fontSize: 12, cursor: "pointer",
                              }}
                            >
                              {photos[item.id] ? "📷 写真を変更" : "📷 写真を撮る"}
                            </button>
                            {photos[item.id] && (
                              <img src={photos[item.id]} alt="" style={{
                                width: "100%", borderRadius: 8, marginTop: 8,
                                maxHeight: 160, objectFit: "cover",
                              }} />
                            )}
                          </div>

                          <textarea
                            value={comments[item.id] || ""}
                            onChange={(e) => setComment(item.id, e.target.value)}
                            placeholder="メモ（任意）"
                            rows={2}
                            style={{
                              width: "100%", padding: "9px 12px", borderRadius: 8,
                              background: "#0f172a", border: "1px solid #334155",
                              color: "#e2e8f0", fontSize: 13, resize: "none",
                              outline: "none", boxSizing: "border-box",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>整備士コメント（顧客向け）</div>
              <textarea
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="全体的な状態や今後のアドバイスなどを入力"
                rows={4}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  background: "#1e293b", border: "1px solid #334155",
                  color: "#e2e8f0", fontSize: 14, resize: "none",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={() => setStep("preview")}
              disabled={!allDone}
              style={{
                width: "100%", padding: "15px",
                background: allDone ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#1e293b",
                border: "none", borderRadius: 12,
                color: allDone ? "#fff" : "#475569",
                fontSize: 16, fontWeight: 700,
                cursor: allDone ? "pointer" : "not-allowed", letterSpacing: 1,
              }}
            >
              {allDone ? "レポートを確認 →" : `あと${INSPECTION_ITEMS.length - completedCount}項目残っています`}
            </button>
          </div>
        )}

        {/* STEP 3: プレビュー＆共有 */}
        {step === "preview" && (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, letterSpacing: 1 }}>STEP 3 — レポート確認・送信</div>

            {/* サマリーカード */}
            <div style={{ background: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #334155" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{carInfo.date}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{carInfo.name} 様</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
                {carInfo.plate}　{carInfo.mileage && `${Number(carInfo.mileage).toLocaleString()} km`}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "良好",  count: INSPECTION_ITEMS.filter((i) => results[i.id] === "good").length, color: "#22c55e" },
                  { label: "要注意", count: cautionItems.length, color: "#f59e0b" },
                  { label: "要修理", count: badItems.length,    color: "#ef4444" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ background: "#0f172a", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                  </div>
                ))}
              </div>

              {(badItems.length > 0 || cautionItems.length > 0) && (
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>⚠️ 要対応項目</div>
                  {[...badItems, ...cautionItems].map((item) => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 0", borderBottom: "1px solid #1e293b", fontSize: 13,
                    }}>
                      <span style={{ color: results[item.id] === "bad" ? "#ef4444" : "#f59e0b" }}>
                        {results[item.id] === "bad" ? "●" : "◐"}
                      </span>
                      <span style={{ color: "#e2e8f0" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {overallComment && (
                <div style={{ marginTop: 14, padding: 12, background: "#0f172a", borderRadius: 10, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                  💬 {overallComment}
                </div>
              )}
            </div>

            {/* 顧客用URL */}
            <div style={{ background: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #334155" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 4 }}>📤 顧客用レポートURL</div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>LINEで送れます。写真はデータが大きいためURLには含まれません。</div>
              <div style={{
                background: "#0f172a", borderRadius: 8, padding: "10px 12px",
                fontSize: 11, color: "#475569", wordBreak: "break-all",
                marginBottom: 12, lineHeight: 1.5,
              }}>
                {reportUrl ? reportUrl.slice(0, 80) + (reportUrl.length > 80 ? "…" : "") : "生成中..."}
              </div>
              <button
                onClick={copyUrl}
                style={{
                  width: "100%", padding: "12px",
                  background: copied ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
                }}
              >
                {copied ? "✓ コピー済み！" : "🔗 URLをコピー（LINE送信用）"}
              </button>
            </div>

            {/* QRコード */}
            <div style={{ background: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #334155" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", marginBottom: 4 }}>📱 QRコード</div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>印刷して渡す場合はこちら。</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <canvas ref={qrCanvasRef} style={{ borderRadius: 8 }} />
              </div>
            </div>

            {/* その他アクション */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={copyReportText}
                style={{
                  padding: "14px", background: "#1e3a5f",
                  border: "1px solid #1e40af", borderRadius: 12, color: "#93c5fd",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                📋 テキストをコピー（URL付き）
              </button>
              <button
                onClick={resetAll}
                style={{
                  padding: "13px", background: "transparent",
                  border: "1px solid #334155", borderRadius: 12, color: "#64748b",
                  fontSize: 14, cursor: "pointer",
                }}
              >
                新しい点検を始める
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
