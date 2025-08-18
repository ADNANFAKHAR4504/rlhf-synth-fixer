/**
 * Unit tests for main_repo/lib/tap_stack.tf
 *
 * These are fast, static tests that parse & validate HCL text patterns
 * and critical invariants (naming, conditionals, IAM statements, outputs).
 *
 * Run:  npx jest test/terraform.unit.test.ts
 */

import fs from "fs";
import path from "path";

const tfPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const hcl = fs.readFileSync(tfPath, "utf8");

const expectMatch = (re: RegExp, msg?: string) => {
  const ok = re.test(hcl);
  if (!ok) {
    // Surface a helpful diff hint
    const hint = `\n--- Pattern ---\n${re}\n--- File head ---\n${hcl.slice(0, 1200)}\n`;
    throw new Error((msg ?? "Expected pattern not found") + hint);
  }
};

describe("tap_stack.tf — structure", () => {
  test("defines expected variables", () => {
    expectMatch(/variable\s+"aws_region"\s+{[\s\S]*?default\s*=\s*"us-east-1"/);
    expectMatch(/variable\s+"environment_suffix"\s+{[\s\S]*?default\s*=\s*"dev"/);
  });

  test("locals contain environments, regions, and project_name", () => {
    expectMatch(/locals?\s*{[\s\S]*environments\s*=\s*\[\s*"production"\s*,\s*"staging"\s*\]/);
    expectMatch(/locals?\s*{[\s\S]*regions\s*=\s*\[\s*"us-east-1"\s*,\s*"us-west-2"\s*\]/);
    expectMatch(/locals?\s*{[\s\S]*project_name\s*=\s*"secure-infra"/);
  });

  test("uses aws_caller_identity and aws_partition data sources", () => {
    expectMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    expectMatch(/data\s+"aws_partition"\s+"current"\s*{/);
  });
});

describe("KMS keys & alias", () => {
  test("creates aws_kms_key with for_each over env×region", () => {
    expectMatch(/resource\s+"aws_kms_key"\s+"main"\s*{\s*for_each\s*=\s*{\s*for combo in setproduct\(local\.environments,\s*local\.regions\)/);
  });

  test("KMS key enables rotation and sets deletion window within 7–30 days", () => {
    expectMatch(/enable_key_rotation\s*=\s*true/);
    // conditional deletion_window_in_days for prod vs non-prod
    expectMatch(/deletion_window_in_days\s*=\s*each\.value\.environment\s*==\s*"production"\s*\?\s*30\s*:\s*7/);
  });


  test("creates aws_kms_alias mapped to each key", () => {
    expectMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{\s*for_each\s*=\s*aws_kms_key\.main/);
    // Name pattern includes env suffix, project, map key (env-region), and suffix again (as in your file)
    expectMatch(/name\s*=\s*"alias\/\${var\.environment_suffix}-\${local\.project_name}-\${each\.key}-\${var\.environment_suffix}"/);
    expectMatch(/target_key_id\s*=\s*each\.value\.key_id/);
  });
});

describe("CloudWatch log groups", () => {
  test("application_logs for_each over env×region with name convention", () => {
    expectMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs"\s*{\s*for_each\s*=\s*{\s*for combo in setproduct\(local\.environments,\s*local\.regions\)/);
    expectMatch(/name\s*=\s*"\/aws\/application\/\${each\.value\.environment}-logs-\${local\.project_name}-\${var\.environment_suffix}"/);
  });

  test("audit_logs for_each over env×region with name convention", () => {
    expectMatch(/resource\s+"aws_cloudwatch_log_group"\s+"audit_logs"\s*{\s*for_each\s*=\s*{\s*for combo in setproduct\(local\.environments,\s*local\.regions\)/);
    expectMatch(/name\s*=\s*"\/aws\/audit\/\${each\.value\.environment}-audit-\${local\.project_name}-\${var\.environment_suffix}"/);
  });

  test("log groups set retention_in_days conditionally and use KMS encryption", () => {
    expectMatch(/retention_in_days\s*=\s*each\.value\.environment\s*==\s*"production"\s*\?\s*365\s*:\s*30/);
    expectMatch(/kms_key_id\s*=\s*aws_kms_key\.main\[each\.key\]\.arn/);
  });
});

describe("IAM assume role policy", () => {
  test("assume role policy allows EC2 and Lambda services to sts:AssumeRole", () => {
    expectMatch(/data\s+"aws_iam_policy_document"\s+"assume_role_policy"\s*{[\s\S]*principals\s*{[\s\S]*type\s*=\s*"Service"[\s\S]*identifiers\s*=\s*\["ec2\.amazonaws\.com",\s*"lambda\.amazonaws\.com"\][\s\S]*}[\s\S]*actions\s*=\s*\["sts:AssumeRole"\]/);
  });
});

describe("IAM roles", () => {
  test("creates application, audit, and readonly roles per environment", () => {
    expectMatch(/resource\s+"aws_iam_role"\s+"application_role"\s*{\s*for_each\s*=\s*toset\(local\.environments\)/);
    expectMatch(/resource\s+"aws_iam_role"\s+"audit_role"\s*{\s*for_each\s*=\s*toset\(local\.environments\)/);
    expectMatch(/resource\s+"aws_iam_role"\s+"readonly_role"\s*{\s*for_each\s*=\s*toset\(local\.environments\)/);
  });

  test("role names follow naming convention and use shared assume_role_policy", () => {
    expectMatch(/name\s*=\s*"\${each\.key}-role-\${local\.project_name}-application-\${var\.environment_suffix}"/);
    expectMatch(/name\s*=\s*"\${each\.key}-role-\${local\.project_name}-audit-\${var\.environment_suffix}"/);
    expectMatch(/name\s*=\s*"\${each\.key}-role-\${local\.project_name}-readonly-\${var\.environment_suffix}"/);
    expectMatch(/assume_role_policy\s*=\s*data\.aws_iam_policy_document\.assume_role_policy\.json/);
  });
});

describe("IAM policies (data sources) and attachments", () => {
  test("application policy doc allows CloudWatch Logs access to application log groups", () => {
    expectMatch(/data\s+"aws_iam_policy_document"\s+"application_role_policy"[\s\S]*sid\s*=\s*"CloudWatchLogsAccess"[\s\S]*"logs:CreateLogStream"[\s\S]*"logs:PutLogEvents"[\s\S]*resources\s*=\s*\[\s*aws_cloudwatch_log_group\.application_logs\[each\.key\]\.arn[\s\S]*\]/);
  });

  test("audit policy doc allows read access to audit log groups", () => {
    expectMatch(/data\s+"aws_iam_policy_document"\s+"audit_role_policy"[\s\S]*sid\s*=\s*"AuditLogsAccess"[\s\S]*"logs:DescribeLogGroups"[\s\S]*resources\s*=\s*\[\s*aws_cloudwatch_log_group\.audit_logs\[each\.key\]\.arn/);
  });


  test("creates aws_iam_policy resources from policy documents", () => {
    expectMatch(/resource\s+"aws_iam_policy"\s+"application_policy"[\s\S]*policy\s*=\s*data\.aws_iam_policy_document\.application_role_policy\[each\.key\]\.json/);
    expectMatch(/resource\s+"aws_iam_policy"\s+"audit_policy"[\s\S]*policy\s*=\s*data\.aws_iam_policy_document\.audit_role_policy\[each\.key\]\.json/);
    expectMatch(/resource\s+"aws_iam_policy"\s+"readonly_policy"[\s\S]*policy\s*=\s*data\.aws_iam_policy_document\.readonly_role_policy\[each\.key\]\.json/);
  });

  test("attaches policies to their respective roles", () => {
    expectMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"application_policy_attachment"[\s\S]*role\s*=\s*aws_iam_role\.application_role\[each\.value\.environment\]\.name[\s\S]*policy_arn\s*=\s*aws_iam_policy\.application_policy\[each\.key\]\.arn/);
    expectMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"audit_policy_attachment"[\s\S]*role\s*=\s*aws_iam_role\.audit_role\[each\.value\.environment\]\.name[\s\S]*policy_arn\s*=\s*aws_iam_policy\.audit_policy\[each\.key\]\.arn/);
    expectMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"readonly_policy_attachment"[\s\S]*role\s*=\s*aws_iam_role\.readonly_role\[each\.value\.environment\]\.name[\s\S]*policy_arn\s*=\s*aws_iam_policy\.readonly_policy\[each\.key\]\.arn/);
  });
});

describe("Outputs", () => {
  test("exports KMS key IDs and ARNs", () => {
    expectMatch(/output\s+"kms_key_ids"\s+{[\s\S]*for k,\s*v in aws_kms_key\.main\s*:\s*k\s*=>\s*v\.key_id/);
    expectMatch(/output\s+"kms_key_arns"\s+{[\s\S]*for k,\s*v in aws_kms_key\.main\s*:\s*k\s*=>\s*v\.arn/);
  });

  test("exports log group names", () => {
    expectMatch(/output\s+"application_log_group_names"\s+{[\s\S]*aws_cloudwatch_log_group\.application_logs/);
    expectMatch(/output\s+"audit_log_group_names"\s+{[\s\S]*aws_cloudwatch_log_group\.audit_logs/);
  });

  test("exports role ARNs", () => {
    expectMatch(/output\s+"application_role_arns"\s+{[\s\S]*aws_iam_role\.application_role/);
    expectMatch(/output\s+"audit_role_arns"\s+{[\s\S]*aws_iam_role\.audit_role/);
    expectMatch(/output\s+"readonly_role_arns"\s+{[\s\S]*aws_iam_role\.readonly_role/);
  });
});

describe("Naming & tagging hygiene", () => {
  test("tags include Environment (and Region where relevant)", () => {
    expectMatch(/tags\s*=\s*{[\s\S]*Environment\s*=\s*each\.(value|key)\.environment/);
    expectMatch(/tags\s*=\s*{[\s\S]*Region\s*=\s*each\.value\.region/);
  });
});

/**
 * Optional: gate terraform validate if terraform is on PATH.
 * Keeps tests fast/offline if not installed in CI.
 */
describe("terraform validate (optional)", () => {
  test("terraform validate passes when terraform is available", () => {
    try {
      const { execSync } = require("child_process");
      execSync("terraform -version", { stdio: "ignore" });
      // Run validate without remote ops (no init to keep it offline). If you want, vendor a minimal backend stanza.
      execSync(`terraform validate -no-color`, {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
      });
    } catch (e: any) {
      if (String(e?.message || "").includes("spawn terraform ENOENT")) {
        console.warn("terraform not found on PATH — skipping validate");
        return;
      }
      // If terraform exists but validate fails, surface the error.
      throw e;
    }
  });
});
