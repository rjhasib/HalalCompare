import { loadProducts, escapeHtml, fmtMoneyBDT, avgScore } from "./utils.js";

const elCountry = document.getElementById("country");
const elQ = document.getElementById("q");
const elCat = document.getElementById("cat");
const tbody = document.querySelector("#results tbody");
const status = document.getElementById("status");

let db = null;

function scoreCells(p){
  const keys = [
    ["🕌", "shariah_clarity_score"],
    ["🔍", "transparency_score"],
    ["🚪", "accessibility_score"],
    ["🤝", "fairness_score"]
  ];
  return keys.map(([ico,k]) => `<span class="badge"><span class="score">${escapeHtml(p[k])}</span> ${ico}</span>`).join(" ");
}

function srcLinks(p){
  const s = Array.isArray(p.sources) ? p.sources : [];
  if (!s.length) return "—";
  return s.slice(0,3).map(x => {
    const u = escapeHtml(x.url || "");
    const l = escapeHtml(x.label || "Source");
    if (!u) return l;
    return `<a class="badge" href="${u}" target="_blank" rel="noopener">${l}</a>`;
  }).join(" ");
}

function render(){
  if (!db) return;
  const country = elCountry.value;
  const q = (elQ.value || "").trim().toLowerCase();
  const cat = elCat.value;

  const instById = new Map((db.institutions||[]).map(i => [i.institution_id, i]));
  let rows = (db.products||[])
    .map(p => ({ p, inst: instById.get(p.institution_id) }))
    .filter(x => (x.inst?.country || "bd") === country);

  if (cat !== "all") rows = rows.filter(x => x.p.product_category === cat);

  if (q){
    rows = rows.filter(x => {
      const hay = [
        x.p.product_name, x.p.product_category, x.p.contract_type, x.p.target_segment,
        x.inst?.name, x.inst?.institution_type, x.inst?.islamic_model
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  rows.sort((a,b) => (avgScore(b.p)||0) - (avgScore(a.p)||0));

  tbody.innerHTML = rows.map(({p, inst}) => {
    const min = fmtMoneyBDT(p.financing_min_bdt);
    const max = fmtMoneyBDT(p.financing_max_bdt);
    return `<tr>
      <td>
        <div style="font-weight:900">${escapeHtml(p.product_name)}</div>
        <div class="small">${escapeHtml(p.summary || "")}</div>
        <div class="small"><span class="badge">${escapeHtml(p.product_category)}</span> <span class="badge">${escapeHtml(p.target_segment)}</span></div>
      </td>
      <td>
        <div style="font-weight:900">${escapeHtml(inst?.name || "Missing institution")}</div>
        <div class="small">${escapeHtml(inst?.islamic_model || "")}</div>
      </td>
      <td><span class="badge">${escapeHtml(p.contract_type)}</span></td>
      <td>${min} / ${max}</td>
      <td>${scoreCells(p)}</td>
      <td>${srcLinks(p)}</td>
    </tr>`;
  }).join("");

  status.textContent = `${rows.length} product(s) shown. Edit data in Admin.`;
}

(async function init(){
  try{
    db = await loadProducts();
    render();
    [elCountry, elQ, elCat].forEach(el => el.addEventListener("input", render));
  }catch(e){
    status.textContent = String(e?.message || e);
  }
})();
