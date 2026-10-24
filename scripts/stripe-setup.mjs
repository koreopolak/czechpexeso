#!/usr/bin/env node
/**
 * Creates the Premium product with a monthly and a yearly price in your Stripe
 * account, then prints the env vars to copy into .env.local / Vercel.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup -- --currency=eur --monthly=399 --yearly=2999
 *
 * Amounts are in the smallest currency unit (399 = 3.99). Safe to re-run: an
 * existing product with the same lookup keys is reused.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first (use a test key: sk_test_...).");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => a.slice(2).split("=")),
);
const currency = (args.currency ?? "eur").toLowerCase();
const monthly = Number(args.monthly ?? 399);
const yearly = Number(args.yearly ?? 2999);

const stripe = new Stripe(key);

async function findOrCreatePrice(lookupKey, product, amount, interval) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return stripe.prices.create({
    product,
    currency,
    unit_amount: amount,
    recurring: { interval },
    lookup_key: lookupKey,
    tax_behavior: "inclusive",
    nickname: `Premium ${interval === "month" ? "monthly" : "yearly"}`,
  });
}

const products = await stripe.products.search({ query: "metadata['app']:'czechpexeso'" }).catch(() => ({ data: [] }));
const product =
  products.data[0] ??
  (await stripe.products.create({
    name: "Czech Pexeso Premium",
    description: "All decks, daily challenge, unlimited games and progress sync.",
    metadata: { app: "czechpexeso" },
  }));

const month = await findOrCreatePrice(`czechpexeso_premium_month_${currency}`, product.id, monthly, "month");
const year = await findOrCreatePrice(`czechpexeso_premium_year_${currency}`, product.id, yearly, "year");

console.log(`\nProduct: ${product.name} (${product.id})`);
console.log(`Monthly: ${(month.unit_amount / 100).toFixed(2)} ${currency.toUpperCase()}`);
console.log(`Yearly:  ${(year.unit_amount / 100).toFixed(2)} ${currency.toUpperCase()}\n`);
console.log("Add these to .env.local (and to Vercel → Settings → Environment Variables):\n");
console.log(`STRIPE_PRICE_MONTHLY=${month.id}`);
console.log(`STRIPE_PRICE_YEARLY=${year.id}\n`);
