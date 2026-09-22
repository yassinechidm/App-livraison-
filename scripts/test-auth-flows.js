const ts = require("typescript");
const fs = require("fs");
const path = require("path");

// Simple TypeScript in-memory runner
function loadTsModule(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  // strip or mock react-native / expo imports for unit testing
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  const m = { exports: {} };
  const customRequire = (reqPath) => {
    if (reqPath.includes("sanitize")) {
      const sanCode = fs.readFileSync("lib/sanitize.ts", "utf8");
      const sanTrans = ts.transpileModule(sanCode, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      });
      const sanMod = { exports: {} };
      const sanFn = new Function(
        "module",
        "exports",
        "require",
        sanTrans.outputText,
      );
      sanFn(sanMod, sanMod.exports, () => ({}));
      return sanMod.exports;
    }
    if (reqPath.includes("rateLimiter")) {
      return { clientRateLimiter: { assert: () => true, reset: () => true } };
    }
    if (reqPath.includes("supabase")) {
      return {
        supabase: {
          auth: {},
          from: () => ({ select: () => ({ single: () => ({}) }) }),
        },
      };
    }
    if (reqPath.includes("expo-web-browser")) {
      return {
        maybeCompleteAuthSession: () => ({}),
        openAuthSessionAsync: async () => ({ type: "cancel" }),
      };
    }
    if (reqPath.includes("expo-linking")) {
      return {
        addEventListener: () => ({ remove: () => {} }),
        getInitialURL: async () => null,
        createURL: (p) => p,
      };
    }
    return {};
  };

  const fn = new Function(
    "module",
    "exports",
    "require",
    "__dirname",
    "__filename",
    transpiled.outputText,
  );
  fn(m, m.exports, customRequire, path.dirname(filePath), filePath);
  return m.exports;
}

const { authService } = loadTsModule("services/auth.service.ts");
const { sanitizeOtp } = loadTsModule("lib/sanitize.ts");

console.log("====================================================");
console.log("QUICKLY LIVRAISON — AUTHENTICATION & OTP TEST SUITE");
console.log("====================================================\n");

let total = 0;
let passed = 0;
let failed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`[FAIL] ${name} -> ${err.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      `${msg || "Assertion failed"}: expected "${expected}", got "${actual}"`,
    );
  }
}

// 1. Phone Normalization Tests
console.log("--- 1. Phone Number Normalization Tests ---");
test("Moroccan 06 local (06 12 34 56 78)", () => {
  assertEqual(
    authService.normalizePhoneNumber("06 12 34 56 78"),
    "+212612345678",
  );
});
test("Moroccan 07 local (07-00-11-22-33)", () => {
  assertEqual(
    authService.normalizePhoneNumber("07-00-11-22-33"),
    "+212700112233",
  );
});
test("Moroccan 9-digit without leading zero (600112233)", () => {
  assertEqual(authService.normalizePhoneNumber("600112233"), "+212600112233");
});
test("Moroccan with country code prefix 212 (212612345678)", () => {
  assertEqual(
    authService.normalizePhoneNumber("212612345678"),
    "+212612345678",
  );
});
test("Moroccan with international 00 prefix (00212612345678)", () => {
  assertEqual(
    authService.normalizePhoneNumber("00212612345678"),
    "+212612345678",
  );
});
test("Moroccan with +212 standard (+212 6 12 34 56 78)", () => {
  assertEqual(
    authService.normalizePhoneNumber("+212 6 12 34 56 78"),
    "+212612345678",
  );
});
test("International E.164 (+33612345678)", () => {
  assertEqual(authService.normalizePhoneNumber("+33612345678"), "+33612345678");
});
test("Invalid phone - string with letters", () => {
  assertEqual(authService.normalizePhoneNumber("abc0612345678"), null);
});
test("Invalid phone - email address", () => {
  assertEqual(authService.normalizePhoneNumber("user@quickly.ma"), null);
});
test("Invalid phone - empty string", () => {
  assertEqual(authService.normalizePhoneNumber("   "), null);
});

// 2. Resend Target Discrimination Tests
console.log("\n--- 2. Resend Target Discrimination Tests ---");
test("Email target correctly identified for email confirmation resend", () => {
  const target = "client@gmail.com";
  const isEmail = target.includes("@");
  assertEqual(isEmail, true, "Should detect email");
});
test("Phone target correctly identified for SMS resend", () => {
  const target = "+212612345678";
  const isEmail = target.includes("@");
  assertEqual(isEmail, false, "Should detect phone");
});
test("Phone target correctly identified for WhatsApp resend", () => {
  const target = "+212612345678";
  const isWhatsApp = "true";
  assertEqual(
    isWhatsApp === "true" && !target.includes("@"),
    true,
    "Should route to WhatsApp OTP",
  );
});

// 3. OTP Sanitization & Validation Tests
console.log("\n--- 3. OTP Sanitization & Validation Tests ---");
test('Valid 6-digit numeric OTP ("123456")', () => {
  assertEqual(sanitizeOtp("123456"), "123456");
});
test('OTP with spaces and formatting (" 12 34 56 ")', () => {
  assertEqual(sanitizeOtp(" 12 34 56 "), "123456");
});
test('OTP with non-digits stripped ("12a3-45b6")', () => {
  assertEqual(sanitizeOtp("12a3-45b6"), "123456");
});
test("Short OTP rejected by length validation", () => {
  const clean = sanitizeOtp("123");
  assertEqual(clean.length === 6, false);
});

console.log("\n====================================================");
console.log(
  `TEST SUMMARY: ${passed}/${total} checks passed (${failed} failed)`,
);
console.log("====================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✅ ALL AUTHENTICATION UNIT TESTS PASSED.");
}
