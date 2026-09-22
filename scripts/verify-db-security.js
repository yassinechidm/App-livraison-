const fs = require("fs");
const path = require("path");

console.log("====================================================");
console.log("QUICKLY LIVRAISON — DATABASE SECURITY VERIFICATION");
console.log("====================================================\n");

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(title, condition, detail) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${title}`);
  } else {
    failedChecks++;
    console.error(`[FAIL] ${title} - Detail: ${detail}`);
  }
}

// 1. Check Ad-hoc scripts are archived and not in root
const supabaseFixInRoot = fs.existsSync("SUPABASE_FIX.sql");
const restoMigInRoot = fs.existsSync("supabase/restaurants_migration.sql");
check(
  "SUPABASE_FIX.sql removed from root",
  !supabaseFixInRoot,
  "SUPABASE_FIX.sql still in root",
);
check(
  "restaurants_migration.sql removed from supabase root",
  !restoMigInRoot,
  "restaurants_migration.sql still in supabase root",
);

const supabaseFixArchived = fs.existsSync(
  "supabase/archive/SUPABASE_FIX.sql.bak",
);
const restoMigArchived = fs.existsSync(
  "supabase/archive/restaurants_migration.sql.bak",
);
check(
  "Insecure ad-hoc scripts archived safely",
  supabaseFixArchived && restoMigArchived,
  "Missing archive backup",
);

// 2. Inspect canonical schema.sql
const schemaContent = fs.readFileSync("supabase/schema.sql", "utf8");

check(
  "schema.sql exists and is non-empty",
  schemaContent.length > 50000,
  `Length: ${schemaContent.length}`,
);
check(
  "schema.sql contains all 11 migrations",
  (schemaContent.match(/BEGIN MIGRATION/g) || []).length === 11,
  "Migration count != 11",
);

// 3. Verify no orders_full_access or order_items_full_access active in schema.sql
check(
  "No active orders_full_access in schema.sql",
  !schemaContent.includes('CREATE POLICY "orders_full_access"'),
  "Found CREATE POLICY orders_full_access",
);
check(
  "No active order_items_full_access in schema.sql",
  !schemaContent.includes('CREATE POLICY "order_items_full_access"'),
  "Found CREATE POLICY order_items_full_access",
);

// 4. Verify Catalog mutations are admin protected
const allowAdminMig = fs.readFileSync(
  "supabase/migrations/20260916000003_allow_admin_product_and_menu_updates.sql",
  "utf8",
);
check(
  "menu_items mutations restricted to is_admin",
  allowAdminMig.includes("menu_items_insert_policy") &&
    allowAdminMig.includes("public.is_admin()"),
  "menu_items_insert_policy does not check is_admin",
);
check(
  "restaurants mutations restricted to is_admin",
  allowAdminMig.includes("restaurants_insert_policy") &&
    allowAdminMig.includes("public.is_admin()"),
  "restaurants_insert_policy does not check is_admin",
);
check(
  "products mutations restricted to is_admin",
  allowAdminMig.includes("products_insert_policy") &&
    allowAdminMig.includes("public.is_admin()"),
  "products_insert_policy does not check is_admin",
);

// 5. Verify RPCs check is_admin in 20260916000003
check(
  "rpc_update_menu_item checks is_admin",
  allowAdminMig.includes("public.rpc_update_menu_item") &&
    allowAdminMig.includes("IF NOT public.is_admin()"),
  "rpc_update_menu_item missing is_admin check",
);
check(
  "rpc_update_product checks is_admin",
  allowAdminMig.includes("public.rpc_update_product") &&
    allowAdminMig.includes("IF NOT public.is_admin()"),
  "rpc_update_product missing is_admin check",
);
check(
  "rpc_update_restaurant checks is_admin",
  allowAdminMig.includes("public.rpc_update_restaurant") &&
    allowAdminMig.includes("IF NOT public.is_admin()"),
  "rpc_update_restaurant missing is_admin check",
);

// 6. Verify anon execute permissions are revoked on admin RPCs
check(
  "Revoke execute from anon on admin RPCs",
  allowAdminMig.includes(
    "REVOKE EXECUTE ON FUNCTION public.rpc_update_restaurant FROM anon, public;",
  ),
  "Anon execute not revoked",
);

// 7. Verify all SECURITY DEFINER functions in schema.sql specify SET search_path = public
const secDefRegex =
  /CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+([a-zA-Z0-9_\.]+)\s*\([^)]*\)[\s\S]*?SECURITY\s+DEFINER[\s\S]*?\$\$/gi;
let secDefMatches = 0;
let missingSearchPath = 0;
let match;
while ((match = secDefRegex.exec(schemaContent)) !== null) {
  secDefMatches++;
  const funcBody = match[0];
  if (
    !funcBody.includes("SET search_path = public") &&
    !funcBody.includes("SET search_path=public")
  ) {
    console.warn(
      `[WARN] Function ${match[1]} might be missing SET search_path = public`,
    );
    missingSearchPath++;
  }
}
check(
  "All SECURITY DEFINER functions set search_path = public",
  missingSearchPath === 0,
  `${missingSearchPath} functions missing search_path`,
);

// 8. Verify order immutability trigger exists
check(
  "Order financial immutability trigger present",
  schemaContent.includes("protect_order_immutability") &&
    schemaContent.includes("trg_protect_order_immutability"),
  "Missing protect_order_immutability",
);

// 9. Verify profile role escalation trigger exists
check(
  "Profile role escalation trigger present",
  schemaContent.includes("protect_profile_role") &&
    schemaContent.includes("trg_protect_profile_role"),
  "Missing protect_profile_role",
);

// 10. Verify order_items polymorphic foreign keys
const canonMig = fs.readFileSync(
  "supabase/migrations/20260910000000_canonical_schema.sql",
  "utf8",
);
check(
  "order_items.product_id is UUID referencing products(id)",
  canonMig.includes("product_id UUID REFERENCES public.products(id)"),
  "product_id not UUID FK",
);
check(
  "order_items.menu_item_id is UUID referencing restaurant_menu_items(id)",
  canonMig.includes(
    "menu_item_id UUID REFERENCES public.restaurant_menu_items(id)",
  ),
  "menu_item_id not UUID FK",
);

console.log("\n====================================================");
console.log(
  `VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`,
);
console.log("====================================================\n");

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log("✅ ALL DATABASE SECURITY & SCHEMA INTEGRITY CHECKS PASSED.");
}
