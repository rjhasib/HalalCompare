export function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

export function fmtMoneyBDT(n){
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  try{
    return new Intl.NumberFormat("en-BD", { style:"currency", currency:"BDT", maximumFractionDigits:0 }).format(num);
  }catch{
    return `BDT ${Math.round(num).toLocaleString()}`;
  }
}

export function avgScore(p){
  const keys = ["shariah_clarity_score","transparency_score","accessibility_score","fairness_score"];
  const vals = keys.map(k => Number(p[k])).filter(v => Number.isFinite(v));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10;
}

export async function loadProducts(){
  const res = await fetch("./data/products.json", { cache:"no-store" });
  if (!res.ok) throw new Error("Could not load data/products.json");
  return await res.json();
}

export function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
