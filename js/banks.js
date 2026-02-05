import { loadProducts, escapeHtml } from "./utils.js";

const elCountry = document.getElementById("country");
const elQ = document.getElementById("q");
const cards = document.getElementById("cards");

let db = null;

function badge(text){ return `<span class="badge">${escapeHtml(text)}</span>`; }

function render(){
  if (!db) return;
  const country = elCountry.value;
  const q = (elQ.value || "").trim().toLowerCase();

  let inst = (db.institutions||[])
    .filter(i => (i.country || "bd") === country)
    .filter(i => (i.institution_type || "").includes("bank"));

  if (q) inst = inst.filter(i => (i.name||"").toLowerCase().includes(q));

  cards.innerHTML = inst.map(i => `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <div style="font-weight:900">${escapeHtml(i.name)}</div>
        ${i.website_url ? `<a class="badge" href="${escapeHtml(i.website_url)}" target="_blank" rel="noopener">Website</a>` : badge("No website")}
      </div>
      <div class="row" style="margin-top:10px">
        ${badge(i.institution_type)}
        ${badge(i.islamic_model)}
        ${badge(i.country.toUpperCase())}
      </div>
      <div class="small" style="margin-top:10px"><b>ID:</b> ${escapeHtml(i.institution_id)}</div>
    </div>
  `).join("") || `<div class="card">No matching institutions yet. Add them in Admin.</div>`;
}

(async function init(){
  db = await loadProducts();
  render();
  [elCountry, elQ].forEach(el => el.addEventListener("input", render));
})();
