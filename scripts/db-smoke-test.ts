import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
  const { error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true });
  if (error) {
    console.error(`❌ Table '${tableName}' check failed:`, error.message);
    return false;
  }
  console.log(`✅ Table '${tableName}' exists and is accessible (${count ?? 0} rows)`);
  return true;
}

async function runSmokeTest() {
  console.log("🔍 Starting Database Smoke Test...\n");

  const tables = [
    "whatsapp_instances",
    "whatsapp_webhooks",
    "chats",
    "messages",
    "quotes",
    "quote_items",
    "products",
    "agents",
  ];

  let allPassed = true;

  for (const table of tables) {
    const passed = await checkTable(table);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log("\n🎉 All critical tables are present and accessible!");
  } else {
    console.error("\n⚠️ Some tables are missing or inaccessible. Check your migrations.");
    process.exit(1);
  }
}

runSmokeTest();
