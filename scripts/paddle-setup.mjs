/**
 * Creates the Premium catalog in Paddle: one product with three prices
 * (monthly, yearly, lifetime), each with country price overrides.
 *
 *   npm run paddle:setup                 # uses .env.local (PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_ENV)
 *   npm run paddle:setup -- --sandbox    # force the sandbox account
 *   npm run paddle:setup -- --dry-run    # print the catalog, change nothing
 *
 * Safe to re-run: items it created before (tagged in custom_data) are reused,
 * never duplicated. Existing prices are not changed — the script only reports
 * differences; edit those in the Paddle dashboard.
 *
 * Amounts are strings in the currency's lowest unit: "299" = 2.99.
 * Prices include tax (tax_mode "internal"), so customers pay exactly this.
 */

const CATALOG = {
  product: {
    name: "Czech Pexeso Premium",
    description: "Unlimited games, full game history and every future feature in Czech Pexeso, the memory game for learning Czech.",
    tax_category: "standard",
    custom_data: { app: "czechpexeso", key: "premium" },
  },
  prices: [
    {
      plan: "month",
      env: "PADDLE_PRICE_MONTHLY",
      name: "Monthly",
      billing_cycle: { interval: "month", frequency: 1 },
      base: ["EUR", "299"],
      overrides: { CZ: ["CZK", "5900"], US: ["USD", "349"], GB: ["GBP", "249"], PL: ["PLN", "799"], UA: ["UAH", "6900"] },
    },
    {
      plan: "year",
      env: "PADDLE_PRICE_YEARLY",
      name: "Yearly",
      billing_cycle: { interval: "year", frequency: 1 },
      base: ["EUR", "1499"],
      overrides: { CZ: ["CZK", "29900"], US: ["USD", "1699"], GB: ["GBP", "1299"], PL: ["PLN", "3999"], UA: ["UAH", "34900"] },
    },
    {
      plan: "lifetime",
      env: "PADDLE_PRICE_LIFETIME",
      name: "Lifetime",
      billing_cycle: null,
      base: ["EUR", "4499"],
      overrides: { CZ: ["CZK", "89900"], US: ["USD", "4999"], GB: ["GBP", "3799"], PL: ["PLN", "11999"], UA: ["UAH", "99900"] },
    },
  ],
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: use the environment as is.
}
const sandbox = args.has("--sandbox") || process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox";
const apiKey = process.env.PADDLE_API_KEY ?? "";
const base = sandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

const money = ([currency, amount]) => `${currency} ${(Number(amount) / 100).toFixed(2)}`;

function priceBody(p, productId) {
  return {
    product_id: productId,
    name: p.name,
    description: `Premium ${p.name.toLowerCase()} (${money(p.base)})`,
    billing_cycle: p.billing_cycle,
    tax_mode: "internal",
    unit_price: { amount: p.base[1], currency_code: p.base[0] },
    unit_price_overrides: Object.entries(p.overrides).map(([country, [currency, amount]]) => ({
      country_codes: [country],
      unit_price: { amount, currency_code: currency },
    })),
    quantity: { minimum: 1, maximum: 1 },
    custom_data: { app: "czechpexeso", plan: p.plan },
  };
}

async function api(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Paddle-Version": "1" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json.error ?? {};
    const fields = (err.errors ?? []).map((e) => `\n    ${e.field}: ${e.message}`).join("");
    throw new Error(`${method} ${path} → ${res.status} ${err.code ?? ""}: ${err.detail ?? res.statusText}${fields}`);
  }
  return json.data;
}

/** Differences between what the script wants and an existing price. */
function drift(want, have) {
  const out = [];
  if (have.unit_price.amount !== want.unit_price.amount || have.unit_price.currency_code !== want.unit_price.currency_code) {
    out.push(`base ${have.unit_price.currency_code} ${have.unit_price.amount} (script: ${want.unit_price.currency_code} ${want.unit_price.amount})`);
  }
  const haveOverrides = new Map(
    (have.unit_price_overrides ?? []).flatMap((o) => o.country_codes.map((c) => [c, `${o.unit_price.currency_code} ${o.unit_price.amount}`])),
  );
  for (const o of want.unit_price_overrides) {
    const c = o.country_codes[0];
    const w = `${o.unit_price.currency_code} ${o.unit_price.amount}`;
    if (haveOverrides.get(c) !== w) out.push(`${c} ${haveOverrides.get(c) ?? "none"} (script: ${w})`);
  }
  return out;
}

function printCatalog() {
  const countries = Object.keys(CATALOG.prices[0].overrides);
  console.log(`\n${CATALOG.product.name}`);
  console.log(["Plan".padEnd(10), "Default".padEnd(12), ...countries.map((c) => c.padEnd(13))].join(""));
  for (const p of CATALOG.prices) {
    console.log([p.name.padEnd(10), money(p.base).padEnd(12), ...countries.map((c) => money(p.overrides[c]).padEnd(13))].join(""));
  }
}

async function main() {
  console.log(`Paddle ${sandbox ? "SANDBOX" : "LIVE"} account${dryRun ? " (dry run: nothing is created)" : ""}`);
  printCatalog();
  if (dryRun) return;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not set (add it to .env.local).");

  const products = await api("GET", "/products?status=active&per_page=200");
  let product = products.find((p) => p.custom_data?.app === "czechpexeso" && p.custom_data?.key === "premium");
  const productState = product ? "existing" : "created";
  product ??= await api("POST", "/products", CATALOG.product);

  const prices = await api("GET", `/prices?product_id=${product.id}&status=active&per_page=200`);
  const results = [];
  for (const p of CATALOG.prices) {
    const want = priceBody(p, product.id);
    const have = prices.find((x) => x.custom_data?.app === "czechpexeso" && x.custom_data?.plan === p.plan);
    if (have) {
      results.push({ p, id: have.id, state: "existing", drift: drift(want, have) });
    } else {
      const created = await api("POST", "/prices", want);
      results.push({ p, id: created.id, state: "created", drift: [] });
    }
  }

  console.log(`\nProduct  ${product.id}  ${product.name}  (${productState})`);
  for (const r of results) {
    console.log(`Price    ${r.id}  ${r.p.name.padEnd(9)} ${money(r.p.base)}  (${r.state})`);
    for (const d of r.drift) console.log(`           differs in Paddle: ${d}`);
  }
  console.log("\nAdd these to .env.local and to Vercel (Settings → Environment Variables):\n");
  for (const r of results) console.log(`${r.p.env}=${r.id}`);
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
