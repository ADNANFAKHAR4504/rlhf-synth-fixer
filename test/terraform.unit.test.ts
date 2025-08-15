
/**
 * Unit tests for ../lib/tap_stack.tf
 * - Pure static analysis: NO terraform init/plan/apply.
 * - Uses string/regex introspection so it runs anywhere.
 * - If you prefer a parser, see the optional section at the bottom.
 */
import * as fs from "fs";
import * as path from "path";

// Resolve path to the HCL file (expects project layout: <repo>/lib/tap_stack.tf)
const tfPath = path.resolve(__dirname, "../lib/tap_stack.tf");

/** Load file once for all tests */
const hcl = fs.readFileSync(tfPath, "utf-8");

/** Tiny helpers for assertions */
const has = (snippet: string) => hcl.includes(snippet);
const re = (pattern: RegExp) => pattern.test(hcl);

/** Pull a block body by rough regex (simple, not a full HCL parser) */
function blockBody(kind: string, name: string, second?: string): string | null {
  const n2 = second ? `\\s+"${second}"` : "";
  const rx = new RegExp(String.raw`(?ms)^\\s*${kind}\\s+"${name}"${n2}\\s*\\{([\\s\\S]*?)^\\s*\\}`, "m");
  const m = hcl.match(rx);
  return m ? m[1] : null;
}

/** Extract default value for a variable (quick+dirty) */
function varDefault(name: string): string | null {
  const body = blockBody("variable", name);
  if (!body) return null;
  const m = body.match(/(?m)^\s*default\s*=\s*(.+)\s*$/);
  return m ? m[1].trim() : null;
}

/** Count blocks of a given type */
function countBlocks(kind: string): number {
  const rx = new RegExp(String.raw`(?m)^\\s*${kind}\\s+"[\\w-]+"\s*(?:"[\\w-]+")?\\s*\\{`);
  return (hcl.match(rx) || []).length;
}

describe("Project layout", () => {
  it("has the expected Terraform file", () => {
    expect(fs.existsSync(tfPath)).toBe(true);
    expect(hcl.length).toBeGreaterThan(1000);
  });
});

describe("High-level shape", () => {
  it("defines variables, resources, data sources, locals, and outputs", () => {
    expect(countBlocks("variable")).toBeGreaterThanOrEqual(8);
    expect(countBlocks("resource")).toBeGreaterThanOrEqual(8);
    expect(countBlocks("data")).toBeGreaterThanOrEqual(2);
    expect(countBlocks("locals")).toBeGreaterThanOrEqual(1);
    expect(countBlocks("output")).toBeGreaterThanOrEqual(8);
  });
});

describe("Variables & Defaults", () => {
  it("aws_region default is us-east-1", () => {
    expect(varDefault("aws_region")).toBe(`"us-east-1"`);
  });

  it("company_name and environment have sensible defaults", () => {
    expect(varDefault("company_name")).toMatch(/"acme"/);
    expect(varDefault("environment")).toMatch(/"dev"/);
  });

  it("lambda defaults: runtime, handler, memory>=512, timeout>=30", () => {
    expect(varDefault("lambda_runtime")).toMatch(/python3\.(\d+)/);
    expect(varDefault("lambda_handler")).toBe(`"index.handler"`);

    const mem = varDefault("lambda_memory_size");
    const timeout = varDefault("lambda_timeout");

    const memNum = mem ? parseInt(mem, 10) : 0;
    const timeoutNum = timeout ? parseInt(timeout, 10) : 0;
    expect(memNum).toBeGreaterThanOrEqual(512);
    expect(timeoutNum).toBeGreaterThanOrEqual(30);
  });

  it("DynamoDB defaults: RCU/WCU >= 5", () => {
    const r = varDefault("dynamodb_read_capacity");
    const w = varDefault("dynamodb_write_capacity");
    expect(r && parseInt(r, 10)).toBeGreaterThanOrEqual(5);
    expect(w && parseInt(w, 10)).toBeGreaterThanOrEqual(5);
  });

  it("tags variable exists and is a map", () => {
    const body = blockBody("variable", "tags");
    expect(body).toBeTruthy();
    expect(body).toMatch(/type\s*=\s*map\(string\)/);
  });
});

describe("Locals & naming convention", () => {
  it("name_prefix uses company-env pattern", () => {
    const body = blockBody("locals", "");
    // Simple check using known snippet
    expect(has('name_prefix = "${var.company_name}-${var.environment}"')).toBe(true);
  });

  it("deterministic names for resources derived from prefix", () => {
    expect(has('ddb_table_name    = "${local.name_prefix}-table"')).toBe(true);
    expect(has('lambda1_name      = "${local.name_prefix}-lambda1"')).toBe(true);
    expect(has('lambda2_name      = "${local.name_prefix}-lambda2"')).toBe(true);
    expect(has('kms_alias_name    = "alias/${local.name_prefix}-cmk"')).toBe(true);
  });
});

describe("KMS CMK & Alias", () => {
  it("creates a CMK with rotation enabled and sensible policy", () => {
    const keyBody = blockBody("resource", "aws_kms_key", "cmk");
    expect(keyBody).toBeTruthy();
    expect(keyBody!).toMatch(/enable_key_rotation\s*=\s*true/);
    expect(keyBody!).toMatch(/policy\s*=\s*data\.aws_iam_policy_document\.kms_key_policy\.json/);

    const policyBody = blockBody("data", "aws_iam_policy_document", "kms_key_policy");
    expect(policyBody).toBeTruthy();
    expect(policyBody!).toMatch(/AllowRootAccount/);
    expect(policyBody!).toMatch(/AllowCloudWatchLogsUse/);
    expect(policyBody!).toMatch(/AllowLambdaUse/);
  });

  it("creates an alias for the CMK", () => {
    const aliasBody = blockBody("resource", "aws_kms_alias", "cmk_alias");
    expect(aliasBody).toBeTruthy();
    expect(aliasBody!).toMatch(/name\s*=\s*local\.kms_alias_name/);
    expect(aliasBody!).toMatch(/target_key_id\s*=\s*aws_kms_key\.cmk\.id/);
  });
});

describe("DynamoDB Table", () => {
  it("provisioned capacity with server-side encryption using the CMK", () => {
    const body = blockBody("resource", "aws_dynamodb_table", "main");
    expect(body).toBeTruthy();
    expect(body!).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
    expect(body!).toMatch(/read_capacity\s*=\s*var\.dynamodb_read_capacity/);
    expect(body!).toMatch(/write_capacity\s*=\s*var\.dynamodb_write_capacity/);
    expect(body!).toMatch(/server_side_encryption\s*{\s*[\s\S]*kms_key_arn\s*=\s*aws_kms_key\.cmk\.arn/);
  });
});

describe("CloudWatch Log Groups", () => {
  it("has log group for lambda1 with retention and KMS", () => {
    const body = blockBody("resource", "aws_cloudwatch_log_group", "lambda1");
    expect(body).toBeTruthy();
    expect(body!).toMatch(/name\s*=\s*local\.log_group_lambda1/);
    expect(body!).toMatch(/retention_in_days\s*=\s*14/);
    expect(body!).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cmk\.arn/);
  });

  it("has log group for lambda2 with retention and KMS", () => {
    const body = blockBody("resource", "aws_cloudwatch_log_group", "lambda2");
    expect(body).toBeTruthy();
    expect(body!).toMatch(/name\s*=\s*local\.log_group_lambda2/);
    expect(body!).toMatch(/retention_in_days\s*=\s*14/);
    expect(body!).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cmk\.arn/);
  });
});

describe("IAM for Lambda", () => {
  it("execution role is assumable by Lambda service", () => {
    const body = blockBody("resource", "aws_iam_role", "lambda_exec");
    expect(body).toBeTruthy();
    expect(body!).toMatch(/Principal\s*=\s*{[^}]*Service\s*=\s*"lambda\.amazonaws\.com"/);
  });

  it("attaches AWSLambdaBasicExecutionRole", () => {
    const body = blockBody("resource", "aws_iam_role_policy_attachment", "lambda_basic");
    expect(body).toBeTruthy();
    expect(body!).toMatch(/AWSLambdaBasicExecutionRole/);
  });

  it("has a custom least-privilege policy for table+KMS only", () => {
    const doc = blockBody("data", "aws_iam_policy_document", "lambda_custom");
    expect(doc).toBeTruthy();
    // DynamoDB CRUD on the specific table only
    expect(doc!).toMatch(/dynamodb:GetItem/);
    expect(doc!).toMatch(/resources\s*=\s*\[aws_dynamodb_table\.main\.arn\]/);
    // KMS minimal set against the specific CMK
    expect(doc!).toMatch(/kms:Decrypt/);
    expect(doc!).toMatch(/kms:GenerateDataKey\*/);
    expect(doc!).toMatch(/resources\s*=\s*\[aws_kms_key\.cmk\.arn\]/);
  });

  it("attaches custom policy to lambda role", () => {
    const attach = blockBody("resource", "aws_iam_role_policy_attachment", "lambda_custom_attach");
    expect(attach).toBeTruthy();
    expect(attach!).toMatch(/role\s*=\s*aws_iam_role\.lambda_exec\.name/);
    expect(attach!).toMatch(/policy_arn\s*=\s*aws_iam_policy\.lambda_custom\.arn/);
  });
});

describe("Embedded Lambda functions", () => {
  it("defines 2 Lambda functions wired to zips, with memory/timeout/runtime and KMS", () => {
    const l1 = blockBody("resource", "aws_lambda_function", "lambda1");
    const l2 = blockBody("resource", "aws_lambda_function", "lambda2");
    expect(l1 && l2).toBeTruthy();

    for (const body of [l1!, l2!]) {
      expect(body).toMatch(/filename\s*=\s*data\.archive_file\./);
      expect(body).toMatch(/source_code_hash\s*=\s*data\.archive_file\./);
      expect(body).toMatch(/role\s*=\s*aws_iam_role\.lambda_exec\.arn/);
      expect(body).toMatch(/handler\s*=\s*var\.lambda_handler/);
      expect(body).toMatch(/runtime\s*=\s*var\.lambda_runtime/);
      expect(body).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
      expect(body).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
      expect(body).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.cmk\.arn/);
      expect(body).toMatch(/DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.main\.name/);
    }
  });
});

describe("archive_file data sources", () => {
  it("packages inline code for both lambdas", () => {
    const z1 = blockBody("data", "archive_file", "lambda1_zip");
    const z2 = blockBody("data", "archive_file", "lambda2_zip");
    expect(z1 && z2).toBeTruthy();
    expect(z1!).toMatch(/type\s*=\s*"zip"/);
    expect(z2!).toMatch(/type\s*=\s*"zip"/);
    expect(z1!).toMatch(/output_path\s*=\s*\$\{path\.module/);
    expect(z2!).toMatch(/output_path\s*=\s*\$\{path\.module/);
  });
});

describe("Outputs", () => {
  const expected = [
    "region",
    "company_name",
    "environment",
    "kms_key_arn",
    "kms_key_alias",
    "dynamodb_table_name",
    "dynamodb_table_arn",
    "lambda1_name",
    "lambda1_arn",
    "lambda2_name",
    "lambda2_arn",
    "log_group_lambda1",
    "log_group_lambda2",
    "lambda_role_name",
    "lambda_role_arn"
  ];

  it("emits all useful outputs for CI/tests", () => {
    for (const name of expected) {
      const out = blockBody("output", name);
      expect(out).toBeTruthy();
      // Ensure outputs are not empty
      expect((out || "").trim().length).toBeGreaterThan(10);
    }
  });
});

describe("Guardrails", () => {
  it("does not contain obviously unsafe patterns", () => {
    // No 0.0.0.0/0 SG rules or public ACLs (this stack shouldn't have SGs anyway)
    expect(re(/0\.0\.0\.0\/0/)).toBe(false);
    expect(re(/"AllUsers"/)).toBe(false); // public S3 ACL
  });
});

/**
 * OPTIONAL (disabled by default):
 * If you install a proper HCL->JSON parser you can add deeper assertions.
 * Example (requires: npm i -D @cdktf/hcl2json):
 *
 *    import { execFileSync } from "child_process";
 *    const parsed = JSON.parse(execFileSync("./node_modules/.bin/hcl2json", [tfPath], { encoding: "utf-8" }));
 *    // ...assert parsed.resource["aws_lambda_function"].lambda1.memory_size === "${var.lambda_memory_size}"
 *
 * The string/regex checks above are intentionally parser-free per requirements.
 */
