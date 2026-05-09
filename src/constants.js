export const INSPECTION_ITEMS = [
  { id: "brake_fluid", category: "ブレーキ", label: "ブレーキ液の量" },
  { id: "brake_pedal", category: "ブレーキ", label: "ブレーキペダルの踏みしろ・効き具合" },
  { id: "parking_brake", category: "ブレーキ", label: "駐車ブレーキの引きしろ" },
  { id: "steering", category: "ステアリング", label: "ステアリングのあそび・状態" },
  { id: "wiper", category: "灯火・視界", label: "ワイパーの払拭状態" },
  { id: "washer", category: "灯火・視界", label: "ウォッシャー液の量" },
  { id: "headlight", category: "灯火・視界", label: "前照灯の点灯" },
  { id: "brake_light", category: "灯火・視界", label: "制動灯・方向指示器の点灯" },
  { id: "tire_pressure", category: "タイヤ", label: "タイヤの空気圧" },
  { id: "tire_wear", category: "タイヤ", label: "タイヤの溝・損傷" },
  { id: "engine_oil", category: "エンジン", label: "エンジンオイルの量" },
  { id: "coolant", category: "エンジン", label: "冷却水の量" },
];

export const STATUS_CONFIG = {
  good:    { label: "良好",  color: "#22c55e", bg: "#052e16", border: "#166534", icon: "✓" },
  caution: { label: "要注意", color: "#f59e0b", bg: "#1c1a09", border: "#854d0e", icon: "⚠" },
  bad:     { label: "要修理", color: "#ef4444", bg: "#1c0a0a", border: "#991b1b", icon: "✗" },
};
