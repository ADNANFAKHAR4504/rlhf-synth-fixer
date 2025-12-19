// test/terraform.unit.test.ts
// Unit tests for your current tap_stack.tf
// Run:  TF_LIB_DIR=/absolute/path/to/dir/containing/tap_stack.tf jest --testPathPattern=\.unit\.test\.(ts|js)$ --coverage

import * as fs from "fs";
import * as path from "path";

/* ---------------- File resolver ---------------- */
const CANDIDATE_DIRS = [
  process.env.TF_LIB_DIR && path.resolve(process.env.TF_LIB_DIR),
  path.resolve(process.cwd()),
  path.resolve(process.cwd(), "lib"),
  path.resolve(process.cwd(), "iac"),
  path.resolve(process.cwd(), "iac/lib"),
  path.resolve(__dirname, "../"),
  path.resolve(__dirname, "../lib"),
].filter(Boolean) as string[];

function readTfFile(name: string): string {
  for (const base of CANDIDATE_DIRS) {
    const p = path.join(base, name);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error(
    `tap_stack.tf not found. Looked in:\n - ${CANDIDATE_DIRS
      .map((d) => path.join(d, name))
      .join("\n - ")}\nSet TF_LIB_DIR or move the file.`
  );
}

/* ---------------- Tiny HCL helpers (regex-based) ---------------- */
function headerIndex(
  content: string,
  kind: "resource" | "data" | "variable" | "locals",
  typeOrName: string,
  name?: string
): number {
  if (kind === "locals") {
    const m = /\blocals\s*\{/m.exec(content);
    return m ? m.index : -1;
  }
  const re =
    kind === "variable"
      ? new RegExp(String.raw`\bvariable\s+"${typeOrName}"\s*\{`, "m")
      : new RegExp(String.raw`\b${kind}\s+"${typeOrName}"\s+"${name ?? ""}"\s*\{`, "m");
  const m = re.exec(content);
  return m ? m.index : -1;
}

function extractBlock(content: string, startIdx: number): string | null {
  const braceStart = content.indexOf("{", startIdx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return content.slice(startIdx, i + 1);
    }
  }
  return null;
}

function getBlock(
  content: string,
  kind: "resource" | "data" | "variable" | "locals",
  typeOrName: string,
  name?: string
): string | null {
  const idx = headerIndex(content, kind, typeOrName, name);
  if (idx === -1) return null;
  return extractBlock(content, idx);
}

function expectMatch(block: string | null, re: RegExp) {
  expect(block).toBeTruthy();
  if (!block) return;
  const ok = re.test(block);
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error("Regex did not match.\nPattern:", re, "\n--- Block snippet ---\n", block.slice(0, 800), "\n---");
  }
  expect(ok).toBe(true);
}

/* ---------------- Tests ---------------- */
describe("tap_stack.tf — static unit checks (no AWS calls)", () => {
  let tf = "";

  beforeAll(() => {
    tf = readTfFile("tap_stack.tf");
  });

  describe("General hygiene", () => {
    it("does not contain provider/backend blocks", () => {
      expect(/^\s*provider\s+"aws"/m.test(tf)).toBe(false);
      expect(/^\s*backend\s+"/m.test(tf)).toBe(false);
    });
    it("no CloudFront resources", () => {
      expect(/aws_cloudfront_/m.test(tf)).toBe(false);
    });
  });

  describe("Variables", () => {
    it("ProjectName & Environment defined with expected defaults and validation", () => {
      const vProject = getBlock(tf, "variable", "ProjectName");
      const vEnv = getBlock(tf, "variable", "Environment");

      // Defaults
      expectMatch(vProject, /default\s*=\s*"serverless-app"/m);
      expectMatch(vEnv, /default\s*=\s*"prod"/m);

      // ProjectName validation uses can(regex("^[a-z0-9-]+$", var.ProjectName))
      expectMatch(
        vProject,
        /validation[\s\S]*can\(\s*regex\(\s*"\^\[a-z0-9-]\+\$"\s*,\s*var\.ProjectName\s*\)\s*\)/m
      );

      // Environment validation uses contains(["dev","staging","prod"], var.Environment)
      expectMatch(
        vEnv,
        /validation[\s\S]*contains\(\s*\[\s*"dev"\s*,\s*"staging"\s*,\s*"prod"\s*\]\s*,\s*var\.Environment\s*\)/m
      );
    });
  });

  describe("Data sources & locals", () => {
    it("aws_caller_identity & aws_region exist; locals name buckets and tags", () => {
      expect(!!getBlock(tf, "data", "aws_caller_identity", "current")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_region", "current")).toBe(true);
      const locals = getBlock(tf, "locals", "locals");
      expectMatch(locals, /content_bucket_name/);
      expectMatch(locals, /logs_bucket_name/);
      expectMatch(locals, /base_tags\s*=\s*\{/);
    });
  });

  describe("KMS", () => {
    it("CMK policy has root allow, logs service principal, lambda service principal; alias targets key", () => {
      const cmk = getBlock(tf, "resource", "aws_kms_key", "KMSKey");
      const alias = getBlock(tf, "resource", "aws_kms_alias", "KMSKeyAlias");

      // Root principal statement (Enable IAM User Permissions) and kms:* action present somewhere
      expectMatch(cmk, /"arn:aws:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root"/m);
      expectMatch(cmk, /"kms:\*"/m);

      // Logs service principal statement
      expectMatch(cmk, /"logs\.\$\{data\.aws_region\.current\.name\}\.amazonaws\.com"/m);

      // Lambda service principal statement (also includes CreateGrant)
      expectMatch(cmk, /"lambda\.amazonaws\.com"/m);
      expectMatch(cmk, /"kms:CreateGrant"/m);

      // Alias wiring
      expectMatch(alias, /target_key_id\s*=\s*aws_kms_key\.KMSKey\.key_id/);
    });
  });

  describe("S3 buckets", () => {
    it("logging & content buckets exist; ownership controls/PAB/SSE/versioning/lifecycle", () => {
      expect(!!getBlock(tf, "resource", "aws_s3_bucket", "S3LoggingBucket")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_s3_bucket", "S3Bucket")).toBe(true);

      const own = getBlock(tf, "resource", "aws_s3_bucket_ownership_controls", "S3LoggingBucket");
      expectMatch(own, /object_ownership\s*=\s*"BucketOwnerPreferred"/);

      expect(!!getBlock(tf, "resource", "aws_s3_bucket_public_access_block", "S3LoggingBucket")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_s3_bucket_public_access_block", "S3Bucket")).toBe(true);

      expectMatch(getBlock(tf, "resource", "aws_s3_bucket_server_side_encryption_configuration", "S3LoggingBucket"), /AES256/);
      expectMatch(
        getBlock(tf, "resource", "aws_s3_bucket_server_side_encryption_configuration", "S3Bucket"),
        /sse_algorithm\s*=\s*"aws:kms"[\s\S]*kms_master_key_id\s*=\s*aws_kms_key\.KMSKey\.arn/
      );

      expectMatch(getBlock(tf, "resource", "aws_s3_bucket_versioning", "S3Bucket"), /status\s*=\s*"Enabled"/);

      const life = getBlock(tf, "resource", "aws_s3_bucket_lifecycle_configuration", "S3LoggingBucket");
      expectMatch(life, /expiration\s*\{\s*days\s*=\s*90\s*\}/m);
      expectMatch(life, /filter\s*\{\s*prefix\s*=\s*""\s*\}/m);
    });

    it("content bucket logs to logs bucket with 'access-logs/' prefix", () => {
      const l = getBlock(tf, "resource", "aws_s3_bucket_logging", "S3Bucket");
      expectMatch(l, /target_bucket\s*=\s*aws_s3_bucket\.S3LoggingBucket\.id/);
      expectMatch(l, /target_prefix\s*=\s*"access-logs\/"/);
    });

    it("logging bucket policy grants only S3 logging service (no CloudFront)", () => {
      const logPol = getBlock(tf, "resource", "aws_s3_bucket_policy", "LoggingBucketPolicy");
      expectMatch(logPol, /"logging\.s3\.amazonaws\.com"/);
      expect(/cloudfront\.amazonaws\.com/.test(logPol || "")).toBe(false);
    });
  });

  describe("DynamoDB", () => {
    it("table uses PROVISIONED, hash id, SSE with KMS, PITR enabled", () => {
      const t = getBlock(tf, "resource", "aws_dynamodb_table", "DynamoDBTable");
      expectMatch(t, /billing_mode\s*=\s*"PROVISIONED"/);
      expectMatch(t, /hash_key\s*=\s*"id"/);
      expectMatch(t, /attribute\s*\{[\s\S]*name\s*=\s*"id"[\s\S]*type\s*=\s*"S"[\s\S]*\}/m);
      expectMatch(t, /server_side_encryption\s*\{[\s\S]*kms_key_arn\s*=\s*aws_kms_key\.KMSKey\.arn/m);
      expectMatch(t, /point_in_time_recovery\s*\{\s*enabled\s*=\s*true\s*\}/m);
    });
  });

  describe("IAM for Lambda", () => {
    it("role + basic exec + inline S3/DDB/KMS/notification policies", () => {
      expect(!!getBlock(tf, "resource", "aws_iam_role", "LambdaExecutionRole")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "LambdaBasicExecution")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy", "LambdaExecutionRole_S3Access")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy", "LambdaExecutionRole_DynamoDBAccess")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy", "LambdaExecutionRole_KMSAccess")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy", "LambdaExecutionRole_S3NotificationAccess")).toBe(true);
    });
  });

  describe("Lambda", () => {
    it("function, log group (KMS), and env vars are present", () => {
      const lf = getBlock(tf, "resource", "aws_lambda_function", "LambdaFunction");
      const lg = getBlock(tf, "resource", "aws_cloudwatch_log_group", "LambdaLogGroup");
      expectMatch(lf, /runtime\s*=\s*"python3\.9"/);
      expectMatch(lf, /environment\s*\{[\s\S]*DYNAMODB_TABLE[\s\S]*S3_BUCKET[\s\S]*KMS_KEY_ID/m);
      expectMatch(lg, /kms_key_id\s*=\s*aws_kms_key\.KMSKey\.arn/);
    });
  });

  describe("S3 → Lambda notifications", () => {
    it("bucket notification + lambda permission present and wired", () => {
      const perm = getBlock(tf, "resource", "aws_lambda_permission", "LambdaInvokePermissionS3");
      const notif = getBlock(tf, "resource", "aws_s3_bucket_notification", "S3Notification");
      expect(!!perm).toBe(true);
      expect(!!notif).toBe(true);
      expectMatch(perm, /principal\s*=\s*"s3\.amazonaws\.com"/);
      expectMatch(
        notif,
        /lambda_function_arn\s*=\s*aws_lambda_function\.LambdaFunction\.arn/
      );
      expectMatch(notif, /events\s*=\s*\[\s*"s3:ObjectCreated:\*"\s*\]/m);
    });
  });

  describe("API Gateway (REST v1)", () => {
    it("core resources exist", () => {
      expect(!!getBlock(tf, "resource", "aws_api_gateway_rest_api", "ApiGateway")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_resource", "ApiGatewayResource")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_method", "ApiGatewayMethod")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_integration", "ApiGatewayIntegrationLambda")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_method_response", "ApiGatewayMethod_200")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_deployment", "ApiGatewayDeployment")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_api_gateway_stage", "ApiGatewayStage")).toBe(true);
    });

    it("integration URI uses Lambda invoke path (AWS_PROXY)", () => {
      const integ = getBlock(tf, "resource", "aws_api_gateway_integration", "ApiGatewayIntegrationLambda");
      expectMatch(integ, /\btype\s*=\s*"AWS_PROXY"/);
      expectMatch(
        integ,
        /arn:aws:apigateway:\$\{data\.aws_region\.current\.name\}:lambda:path\/2015-03-31\/functions\/\$\{aws_lambda_function\.LambdaFunction\.arn\}\/invocations/
      );
    });

    it("stage has access log settings pointing to KMS-encrypted log group", () => {
      const stage = getBlock(tf, "resource", "aws_api_gateway_stage", "ApiGatewayStage");
      expectMatch(stage, /access_log_settings\s*\{/);
      expectMatch(stage, /destination_arn\s*=\s*aws_cloudwatch_log_group\.ApiGatewayLogGroup\.arn/);
      expectMatch(stage, /\$context\.requestId/);

      const cwlg = getBlock(tf, "resource", "aws_cloudwatch_log_group", "ApiGatewayLogGroup");
      expectMatch(cwlg, /kms_key_id\s*=\s*aws_kms_key\.KMSKey\.arn/);
    });

    it("API Gateway account is linked to CW logs role", () => {
      const role = getBlock(tf, "resource", "aws_iam_role", "APIGatewayCloudWatchLogsRole");
      const attach = getBlock(tf, "resource", "aws_iam_role_policy_attachment", "APIGatewayLogsAttach");
      const acc = getBlock(tf, "resource", "aws_api_gateway_account", "ApiGatewayAccount");
      expectMatch(role, /apigateway\.amazonaws\.com/);
      expectMatch(attach, /AmazonAPIGatewayPushToCloudWatchLogs/);
      expectMatch(acc, /cloudwatch_role_arn\s*=\s*aws_iam_role\.APIGatewayCloudWatchLogsRole\.arn/);
    });

    it("Lambda invoke permission for API includes execute-api source_arn", () => {
      const perm = getBlock(tf, "resource", "aws_lambda_permission", "LambdaInvokePermissionApi");
      expectMatch(perm, /principal\s*=\s*"apigateway\.amazonaws\.com"/);
      expectMatch(
        perm,
        /source_arn\s*=\s*"arn:aws:execute-api:\$\{data\.aws_region\.current\.name\}:\$\{data\.aws_caller_identity\.current\.account_id\}:\$\{aws_api_gateway_rest_api\.ApiGateway\.id\}\/\$\{aws_api_gateway_stage\.ApiGatewayStage\.stage_name\}\/\*\/\*"/
      );
    });
  });

  describe("EC2 (default VPC) + IAM", () => {
    it("default VPC & subnets and AL2023 AMI data source", () => {
      expect(!!getBlock(tf, "resource", "aws_default_vpc", "default")).toBe(true);
      const subnets = getBlock(tf, "data", "aws_subnets", "default_vpc_subnets");
      expectMatch(subnets, /filter\s*\{[\s\S]*name\s*=\s*"vpc-id"[\s\S]*\}/m);

      const ami = getBlock(tf, "data", "aws_ssm_parameter", "al2023_ami");
      expectMatch(ami, /name\s*=\s*"\/aws\/service\/ami-amazon-linux-latest\/al2023-ami-kernel-6\.1-x86_64"/);
    });

    it("EC2 instance role + instance profile + SSM core", () => {
      expect(!!getBlock(tf, "resource", "aws_iam_role", "EC2InstanceRole")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "EC2_SSM_Core")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_instance_profile", "EC2InstanceProfile")).toBe(true);
    });

    it("EC2 inline policy allows S3 Put/List, DDB Put, and KMS encrypt/datakey", () => {
      const pol = getBlock(tf, "resource", "aws_iam_role_policy", "EC2InstanceAccess");
      expectMatch(pol, /"s3:PutObject","s3:ListBucket","s3:PutObjectTagging"/);
      expectMatch(pol, /"dynamodb:PutItem"/);
      expectMatch(pol, /"kms:Encrypt","kms:GenerateDataKey","kms:GenerateDataKeyWithoutPlaintext","kms:DescribeKey"/);
    });

    it("Security group egress 0.0.0.0/0 and instance wires expected attributes", () => {
      const sg = getBlock(tf, "resource", "aws_security_group", "EC2SecurityGroup");
      expectMatch(sg, /cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);

      const ec2 = getBlock(tf, "resource", "aws_instance", "EC2TestInstance");
      expectMatch(ec2, /ami\s*=\s*data\.aws_ssm_parameter\.al2023_ami\.value/);
      expectMatch(ec2, /associate_public_ip_address\s*=\s*true/);
      expectMatch(ec2, /iam_instance_profile\s*=\s*aws_iam_instance_profile\.EC2InstanceProfile\.name/);
      expectMatch(ec2, /vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.EC2SecurityGroup\.id\s*\]/);
      expectMatch(ec2, /depends_on\s*=\s*\[/);
    });
  });

  describe("Outputs", () => {
    it("exports all expected outputs", () => {
      const outs = [
        "Environment",
        "StackName",
        "S3BucketName",
        "S3BucketArn",
        "DynamoDBTableName",
        "DynamoDBTableArn",
        "LambdaFunctionName",
        "LambdaFunctionArn",
        "ApiGatewayUrl",
        "ApiGatewayId",
        "KMSKeyId",
        "KMSKeyArn",
        "EC2InstanceId",
        "EC2PublicIp",
      ];
      const missing = outs.filter((o) => !new RegExp(String.raw`\boutput\s+"${o}"\s*\{`).test(tf));
      if (missing.length) {
        // eslint-disable-next-line no-console
        console.error("Missing outputs:\n - " + missing.join("\n - "));
      }
      expect(missing.length).toBe(0);
    });
  });
});
