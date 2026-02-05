import { loadProducts, escapeHtml, avgScore } from "./utils.js";

const tbody = document.querySelector("#results tbody");
const status = document.getElementById("status");

(async function init(){
  const db = await loadProducts();
  const instById = new Map((db.institutions||[]).map(i => [i.institution_id, i]));
  const rows = (db.products||[])
    .map(p => ({ p, inst: instById.get(p.institution_id) }))
    .filter(x => x.inst?.institution_type === "mfi" || x.p.target_segment === "micro");

  tbody.innerHTML = rows.map(({p, inst}) => `
    <tr>
      <td><div style="font-weight:900">${escapeHtml(p.product_name)}</div><div class="small">${escapeHtml(p.product_category)}</div></td>
      <td>${escapeHtml(inst?.name || "—")}</td>
      <td><span class="badge">${escapeHtml(p.contract_type)}</span></td>
      <td><span class="badge">Avg: ${avgScore(p) ?? "—"}</span></td>
    </tr>
  `).join("");

  status.textContent = `${rows.length} product(s) shown. Add MFIs/products in Admin.`;
})();
