// test/terraform.unit.test.ts
// Task-04 — Terraform Unit Tests (Jest TS) for tap_stack.tf (no cloud calls)
// Run: jest --testPathPattern=\.unit\.test\.(ts|js)$ --coverage

import * as fs from "fs";
import * as path from "path";

const LIB_DIR = process.env.TF_LIB_DIR
  ? path.resolve(process.cwd(), process.env.TF_LIB_DIR)
  : path.resolve(__dirname, "../lib");

function readTfFile(name: string): string {
  const filePath = path.join(LIB_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`tap_stack.tf not found at ${filePath}. Set TF_LIB_DIR or place file at ./lib.`);
  }
  return fs.readFileSync(filePath, "utf8");
}

/** Find the start index of a block header. */
function findHeaderIndex(
  content: string,
  kind: "resource" | "data" | "variable" | "locals",
  typeOrName: string,
  name?: string
): number {
  if (kind === "locals") {
    const re = /\blocals\s*\{/m;
    const m = re.exec(content);
    return m ? m.index : -1;
  }
  const re =
    kind === "variable"
      ? new RegExp(String.raw`\bvariable\s+"${typeOrName}"\s*\{`, "m")
      : new RegExp(String.raw`\b${kind}\s+"${typeOrName}"\s+"${name ?? ""}"\s*\{`, "m");
  const m = re.exec(content);
  return m ? m.index : -1;
}

/** Extract a full HCL block starting at the opening `{` (brace-aware). */
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
  const idx = findHeaderIndex(content, kind, typeOrName, name);
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

describe("tap_stack.tf — static unit checks (no AWS calls)", () => {
  let tf = "";

  beforeAll(() => {
    tf = readTfFile("tap_stack.tf");
  });

  describe("General hygiene & tags", () => {
    it("does not contain provider/backend blocks", () => {
      expect(/^\s*provider\s+"aws"/m.test(tf)).toBe(false);
      expect(/^\s*backend\s+"/m.test(tf)).toBe(false);
    });

    it("locals.base_tags has required keys: project, Environment, Owner, CostCenter", () => {
      const localsBlock = getBlock(tf, "locals", "locals");
      expect(localsBlock).toBeTruthy();
      const baseTags = /base_tags\s*=\s*\{[\s\S]*?\}/m.exec(localsBlock || "")?.[0] || "";

      // allow unquoted or quoted keys
      const key = (k: string) => new RegExp(String.raw`["']?${k}["']?\s*=\s*`, "m");
      expect(key("project").test(baseTags)).toBe(true);
      expect(/["']?project["']?\s*=\s*"cloud-setup"/.test(baseTags)).toBe(true);
      expect(key("Environment").test(baseTags) && /var\.env/.test(baseTags)).toBe(true);
      expect(key("Owner").test(baseTags) && /var\.owner/.test(baseTags)).toBe(true);
      expect(key("CostCenter").test(baseTags) && /var\.cost_center/.test(baseTags)).toBe(true);
    });
  });

  describe("Variables", () => {
    it("defines all required variables with expected defaults (single test)", () => {
      const vars: Array<[string, string | number]> = [
        ["env", "dev"],
        ["owner", "platform-team"],
        ["cost_center", "cc-0001"],
        ["domain_name", ""],
        ["hosted_zone_id", ""],
        ["alb_cert_arn_use2", ""],
        ["cloudfront_cert_arn_use2", ""],
        ["use2_cidr", "10.10.0.0/16"],
        ["euw2_cidr", "10.20.0.0/16"],
        ["web_instance_type", "t3.micro"],
        ["rds_engine", "postgres"],
        ["rds_engine_version", "15.4"],
        ["rds_instance_class", "db.t3.micro"],
        ["rds_allocated_storage", 20],
        ["s3_upload_bucket_name", ""],
        ["s3_upload_prefix", ""],
      ];

      const failures: string[] = [];
      for (const [name, defVal] of vars) {
        const v = getBlock(tf, "variable", name);
        if (!v) {
          failures.push(`missing variable "${name}"`);
          continue;
        }
        const defRe =
          typeof defVal === "number"
            ? new RegExp(String.raw`^\s*default\s*=\s*${defVal}\b`, "m")
            : new RegExp(String.raw`^\s*default\s*=\s*"?${defVal}"?`, "m");
        if (!defRe.test(v)) {
          failures.push(`variable "${name}" default mismatch`);
        }
      }
      if (failures.length) {
        // eslint-disable-next-line no-console
        console.error("Variable checks failed:\n - " + failures.join("\n - "));
      }
      expect(failures.length).toBe(0);
    });
  });

  describe("Data sources", () => {
    it("AZs & AL2023 AMIs via SSM in both regions + caller identity", () => {
      expect(!!getBlock(tf, "data", "aws_availability_zones", "use2")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_availability_zones", "euw2")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_ssm_parameter", "al2023_ami_use2")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_ssm_parameter", "al2023_ami_euw2")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_caller_identity", "current")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_caller_identity", "current_euw2")).toBe(true);
    });

    it("optional Route53 zone lookup is count-guarded", () => {
      const dz = getBlock(tf, "data", "aws_route53_zone", "zone");
      expect(dz).toBeTruthy();
      expect(/count\s*=\s*\(var\.domain_name\s*!?=/.test(dz || "")).toBe(true);
    });
  });

  describe("KMS", () => {
    it("CMKs + aliases in use2 & euw2; separate logs CMK in use2 with policy", () => {
      expectMatch(getBlock(tf, "resource", "aws_kms_key", "use2"), /enable_key_rotation\s*=\s*true/);
      expectMatch(getBlock(tf, "resource", "aws_kms_alias", "use2"), /target_key_id\s*=\s*aws_kms_key\.use2\.key_id/);
      expectMatch(getBlock(tf, "resource", "aws_kms_key", "euw2"), /enable_key_rotation\s*=\s*true/);
      expectMatch(getBlock(tf, "resource", "aws_kms_alias", "euw2"), /target_key_id\s*=\s*aws_kms_key\.euw2\.key_id/);
      const logsPol = getBlock(tf, "data", "aws_iam_policy_document", "use2_logs_key");
      const logsK = getBlock(tf, "resource", "aws_kms_key", "use2_logs");
      expect(logsPol).toBeTruthy();
      expectMatch(logsK, /policy\s*=\s*data\.aws_iam_policy_document\.use2_logs_key\.json/);
    });
  });

  describe("Networking — VPCs, IGW, Subnets, NAT, RTs (both regions)", () => {
    it("VPC + IGW for use2 & euw2", () => {
      expect(!!getBlock(tf, "resource", "aws_vpc", "use2")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_internet_gateway", "use2")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_vpc", "euw2")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_internet_gateway", "euw2")).toBe(true);
    });

    it("public & private subnets in both AZs for each region (publics mapPublicIpOnLaunch=true)", () => {
      for (const p of ["use2", "euw2"] as const) {
        const pubA = getBlock(tf, "resource", "aws_subnet", `${p}_public_a`);
        const pubB = getBlock(tf, "resource", "aws_subnet", `${p}_public_b`);
        const priA = getBlock(tf, "resource", "aws_subnet", `${p}_private_a`);
        const priB = getBlock(tf, "resource", "aws_subnet", `${p}_private_b`);
        expectMatch(pubA, /map_public_ip_on_launch\s*=\s*true/);
        expectMatch(pubB, /map_public_ip_on_launch\s*=\s*true/);
        expect(!!priA && !!priB).toBe(true);
      }
    });

    it("NAT EIP + NAT GW in both regions", () => {
      expect(!!getBlock(tf, "resource", "aws_eip", "use2_nat")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_nat_gateway", "use2")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_eip", "euw2_nat")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_nat_gateway", "euw2")).toBe(true);
    });

    it("Route tables + 0.0.0.0/0 routes via IGW (public) and NAT (private)", () => {
      expectMatch(getBlock(tf, "resource", "aws_route", "use2_public_igw"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "use2_private_a_nat"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "use2_private_b_nat"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "euw2_public_a_igw"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "euw2_public_b_igw"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "euw2_private_a_nat"), /0\.0\.0\.0\/0/);
      expectMatch(getBlock(tf, "resource", "aws_route", "euw2_private_b_nat"), /0\.0\.0\.0\/0/);
    });
  });

  describe("VPC Peering + routes", () => {
    it("PCX request, accepter, and bidirectional routes exist", () => {
      expect(!!getBlock(tf, "resource", "aws_vpc_peering_connection", "use2_to_euw2")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_vpc_peering_connection_accepter", "euw2_accept")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "use2_public_to_euw2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "use2_private_a_to_euw2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "use2_private_b_to_euw2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "euw2_public_a_to_use2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "euw2_public_b_to_use2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "euw2_private_a_to_use2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "euw2_private_b_to_use2_pcx")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route_table", "euw2_main")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_route", "euw2_main_to_use2_pcx")).toBe(true);
    });
  });

  describe("Security Groups posture", () => {
    it("ALB 80 ingress; app allows 80 from ALB; RDS allows 5432 from app; web allows 80 from world", () => {
      const alb80 = getBlock(tf, "resource", "aws_vpc_security_group_ingress_rule", "use2_alb_http_80");
      expectMatch(alb80, /from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/);

      const appFromAlb = getBlock(tf, "resource", "aws_vpc_security_group_ingress_rule", "use2_app_http_from_alb");
      expectMatch(appFromAlb, /referenced_security_group_id\s*=\s*aws_security_group\.use2_alb_https\.id/);

      const rds5432 = getBlock(tf, "resource", "aws_vpc_security_group_ingress_rule", "use2_rds_5432_from_app");
      expectMatch(rds5432, /from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/);

      const web80 = getBlock(tf, "resource", "aws_vpc_security_group_ingress_rule", "use2_web_http_world");
      expectMatch(web80, /cidr_ipv4\s*=\s*"0\.0\.0\.0\/0"[\s\S]*from_port\s*=\s*80/);
    });
  });

  describe("IAM for EC2 (role, attachments, instance profile)", () => {
    it("EC2 role attachments + instance profile", () => {
      expect(!!getBlock(tf, "resource", "aws_iam_role", "app_role")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "app_role_ec2_readonly")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "app_role_ssm_core")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "app_role_cw_agent")).toBe(true);
      const prof = getBlock(tf, "resource", "aws_iam_instance_profile", "app_profile");
      expectMatch(prof, /role\s*=\s*aws_iam_role\.app_role\.name/);
    });
  });

  describe("CloudWatch Logs (us-east-2) with KMS", () => {
    it("log group is KMS-encrypted", () => {
      const lg = getBlock(tf, "resource", "aws_cloudwatch_log_group", "use2_app");
      expectMatch(lg, /kms_key_id\s*=\s*aws_kms_key\.use2_logs\.arn/);
    });
  });

  describe("SSM interface endpoints (reliability)", () => {
    it("VPC endpoints for ssm, ssmmessages, ec2messages in use2", () => {
      expect(!!getBlock(tf, "resource", "aws_vpc_endpoint", "use2_ssm")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_vpc_endpoint", "use2_ssmmessages")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_vpc_endpoint", "use2_ec2messages")).toBe(true);
    });
  });

  describe("API Gateway HTTP API → ALB (IAM auth)", () => {
    it("HTTP API + proxy integration to ALB, routes '/', '/ec2' with AWS_IAM", () => {
      const api = getBlock(tf, "resource", "aws_apigatewayv2_api", "http_api");
      const integ = getBlock(tf, "resource", "aws_apigatewayv2_integration", "alb_proxy");
      const r1 = getBlock(tf, "resource", "aws_apigatewayv2_route", "root_get");
      const r2 = getBlock(tf, "resource", "aws_apigatewayv2_route", "ec2_get");
      const stg = getBlock(tf, "resource", "aws_apigatewayv2_stage", "default");
      expect(api && integ && r1 && r2 && stg).toBeTruthy();
      expectMatch(r1, /authorization_type\s*=\s*"AWS_IAM"/);
      expectMatch(r2, /authorization_type\s*=\s*"AWS_IAM"/);
      expectMatch(integ, /integration_uri\s*=\s*"http:\/\/\$\{aws_lb\.use2\.dns_name\}"/);
    });
  });

  describe("RDS — Postgres, KMS, private, password in SSM", () => {
    it("db subnet group, random_password, SSM SecureString with KMS, encrypted non-public DB", () => {
      expect(!!getBlock(tf, "resource", "aws_db_subnet_group", "use2")).toBe(true);
      expect(!!getBlock(tf, "resource", "random_password", "rds_master")).toBe(true);
      const ssm = getBlock(tf, "resource", "aws_ssm_parameter", "rds_password");
      expectMatch(ssm, /type\s*=\s*"SecureString"[\s\S]*key_id\s*=\s*aws_kms_key\.use2\.arn/);
      const db = getBlock(tf, "resource", "aws_db_instance", "use2");
      expectMatch(db, /publicly_accessible\s*=\s*false/);
      expectMatch(db, /storage_encrypted\s*=\s*true/);
      expectMatch(db, /kms_key_id\s*=\s*aws_kms_key\.use2\.arn/);
    });
  });

  describe("S3 uploads bucket — versioning + SSE-KMS + TLS-only policy", () => {
    it("bucket + versioning + SSE-KMS + PublicAccessBlock + TLS-only policy", () => {
      const b = getBlock(tf, "resource", "aws_s3_bucket", "uploads");
      const v = getBlock(tf, "resource", "aws_s3_bucket_versioning", "uploads");
      const sse = getBlock(tf, "resource", "aws_s3_bucket_server_side_encryption_configuration", "uploads");
      const pab = getBlock(tf, "resource", "aws_s3_bucket_public_access_block", "uploads");
      const polDoc = getBlock(tf, "data", "aws_iam_policy_document", "uploads_policy");
      const bp = getBlock(tf, "resource", "aws_s3_bucket_policy", "uploads");
      expect(b && v && sse && pab && polDoc && bp).toBeTruthy();
      expectMatch(sse, /sse_algorithm\s*=\s*"aws:kms"[\s\S]*kms_master_key_id\s*=\s*aws_kms_key\.use2\.arn/);
      expectMatch(polDoc, /DenyInsecureTransport/);
      expectMatch(bp, /policy\s*=\s*data\.aws_iam_policy_document\.uploads_policy\.json/);
      // PAB posture (all true)
      expectMatch(
        pab,
        /block_public_acls\s*=\s*true[\s\S]*block_public_policy\s*=\s*true[\s\S]*ignore_public_acls\s*=\s*true[\s\S]*restrict_public_buckets\s*=\s*true/
      );
    });
  });

  describe("Lambda (on_upload & heartbeat) + S3 trigger + KMS grant", () => {
    it("IAM role + policy + attachment exist for lambdas", () => {
      expect(!!getBlock(tf, "resource", "aws_iam_role", "lambda_role")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_policy", "lambda_policy")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_iam_role_policy_attachment", "lambda_attach")).toBe(true);
    });

    it("on_upload and heartbeat lambdas are packaged and deployed", () => {
      expect(!!getBlock(tf, "data", "archive_file", "lambda_zip")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_lambda_function", "on_upload")).toBe(true);
      expect(!!getBlock(tf, "data", "archive_file", "heartbeat_zip")).toBe(true);
      const hb = getBlock(tf, "resource", "aws_lambda_function", "heartbeat");
      expectMatch(hb, /runtime\s*=\s*"python3\.12"/);
    });

    it("S3→Lambda notification wired & permission granted; KMS grant present; warm-ups exist", () => {
      expect(!!getBlock(tf, "resource", "aws_lambda_permission", "allow_s3_invoke")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_s3_bucket_notification", "uploads")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_kms_grant", "lambda_upload_kms")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_lambda_invocation", "on_upload_warm")).toBe(true);
      expect(!!getBlock(tf, "data", "aws_lambda_invocation", "heartbeat_warm")).toBe(true);
    });
  });

  describe("CloudFront", () => {
    it("distribution exists with ALB origin (http-only origin policy, default cert)", () => {
      const cf = getBlock(tf, "resource", "aws_cloudfront_distribution", "cdn");
      expectMatch(cf, /origin\s*\{[\s\S]*domain_name\s*=\s*aws_lb\.use2\.dns_name/);
      expectMatch(cf, /origin_protocol_policy\s*=\s*"http-only"/);
      expectMatch(cf, /cloudfront_default_certificate\s*=\s*true/);
    });
  });

  describe("Route53 alias to ALB (count-guarded)", () => {
    it("A record alias exists behind count", () => {
      const r = getBlock(tf, "resource", "aws_route53_record", "app_alias_alb");
      expect(r).toBeTruthy();
      expect(/count\s*=\s*\(var\.domain_name/.test(r || "")).toBe(true);
      expectMatch(r, /alias\s*\{[\s\S]*zone_id\s*=\s*aws_lb\.use2\.zone_id/);
    });
  });

  describe("CloudTrail (multi-region) + TLS-only bucket policy", () => {
    it("trail bucket + versioning + AES256 SSE + PAB + policy with TLS only & CloudTrail permissions", () => {
      expect(!!getBlock(tf, "resource", "aws_s3_bucket", "cloudtrail")).toBe(true);
      expect(!!getBlock(tf, "resource", "aws_s3_bucket_versioning", "cloudtrail")).toBe(true);
      const sse = getBlock(tf, "resource", "aws_s3_bucket_server_side_encryption_configuration", "cloudtrail");
      expectMatch(sse, /sse_algorithm\s*=\s*"AES256"/);
      expect(!!getBlock(tf, "resource", "aws_s3_bucket_public_access_block", "cloudtrail")).toBe(true);
      const polDoc = getBlock(tf, "data", "aws_iam_policy_document", "cloudtrail_tls_only");
      const pol = getBlock(tf, "resource", "aws_s3_bucket_policy", "cloudtrail");
      expect(polDoc && pol).toBeTruthy();
      expectMatch(polDoc, /DenyInsecureTransport/);
      expectMatch(polDoc, /cloudtrail\.amazonaws\.com/);
    });

    it("multi-region CloudTrail enabled with log file validation", () => {
      const trail = getBlock(tf, "resource", "aws_cloudtrail", "main");
      expectMatch(trail, /is_multi_region_trail\s*=\s*true/);
      expectMatch(trail, /enable_log_file_validation\s*=\s*true/);
    });
  });

  describe("CloudWatch Alarms + SNS", () => {
    it("SNS topic and ASG CPU>70% alarm exist and wired", () => {
      expect(!!getBlock(tf, "resource", "aws_sns_topic", "use2_alarms")).toBe(true);
      const alarm = getBlock(tf, "resource", "aws_cloudwatch_metric_alarm", "use2_asg_cpu_high");
      expectMatch(alarm, /alarm_actions\s*=\s*\[\s*aws_sns_topic\.use2_alarms\.arn\s*\]/);
    });
  });

  describe("Outputs", () => {
    it("exports all required outputs (single test)", () => {
      const outputs = [
        "use2_vpc_id","euw2_vpc_id",
        "use2_public_subnet_ids","use2_private_subnet_ids",
        "euw2_public_subnet_ids","euw2_private_subnet_ids",
        "use2_kms_key_arn","euw2_kms_key_arn",
        "upload_bucket_name",
        "lambda_on_upload_name","lambda_on_upload_arn","lambda_heartbeat_name",
        "alb_arn","alb_dns_name",
        "api_invoke_url","cloudfront_domain_name",
        "rds_endpoint","rds_port",
        "app_role_name","app_role_arn",
        "sns_alarms_topic_arn",
        "cw_log_group_use2",
        "use2_cidr","euw2_cidr",
        "web_sg_id","ec2_instance_id","ec2_public_ip",
        "cloudtrail_bucket_name"
      ];

      const missing = outputs.filter(
        (o) => !new RegExp(String.raw`\boutput\s+"${o}"\s*\{`).test(tf)
      );

      if (missing.length) {
        // eslint-disable-next-line no-console
        console.error("Missing outputs:\n - " + missing.join("\n - "));
      }
      expect(missing.length).toBe(0);
    });
  });

});

// ---------------------------------------------------------------------------
// Final requirement summary — must be >=95%
// ---------------------------------------------------------------------------
test("Unit requirements coverage summary (>=95%)", () => {
  const c = fs.readFileSync(path.join(LIB_DIR, "tap_stack.tf"), "utf8");

  const has = (kind: "resource" | "data" | "variable" | "locals", t: string, n?: string) =>
    getBlock(c, kind, t, n) !== null;

  // Helper to parse signatures like:
  //   "aws_s3_bucket uploads"                        -> resource
  //   "data aws_iam_policy_document uploads_policy"  -> data
  function hasSig(sig: string): boolean {
    const parts = sig.trim().split(/\s+/);
    if (parts.length === 2) {
      const [type, name] = parts;
      return has("resource", type as any, name);
    }
    if (parts.length === 3) {
      const [kind, type, name] = parts as ["resource" | "data", string, string];
      return has(kind, type, name);
    }
    return false;
  }

  const checks: Array<[string, boolean]> = [
    ["No provider/backend blocks", !/^\s*provider\s+"aws"/m.test(c) && !/^\s*backend\s+"/m.test(c)],
    [
      "locals.base_tags has project/Environment/Owner/CostCenter",
      (() => {
        const lb = getBlock(c, "locals", "locals") || "";
        const bt = /base_tags\s*=\s*\{[\s\S]*?\}/m.exec(lb)?.[0] || "";
        return /["']?project["']?\s*=\s*"cloud-setup"/.test(bt) &&
               /["']?Environment["']?\s*=\s*var\.env/.test(bt) &&
               /["']?Owner["']?\s*=\s*var\.owner/.test(bt) &&
               /["']?CostCenter["']?\s*=\s*var\.cost_center/.test(bt);
      })(),
    ],
    ["VPCs+IGWs both regions", has("resource","aws_vpc","use2") && has("resource","aws_vpc","euw2") && has("resource","aws_internet_gateway","use2") && has("resource","aws_internet_gateway","euw2")],
    ["Subnets 2+2 both regions", ["use2_public_a","use2_public_b","use2_private_a","use2_private_b","euw2_public_a","euw2_public_b","euw2_private_a","euw2_private_b"].every(n=>has("resource","aws_subnet",n))],
    ["NAT both regions", has("resource","aws_nat_gateway","use2") && has("resource","aws_nat_gateway","euw2")],
    ["PCX req+accept", has("resource","aws_vpc_peering_connection","use2_to_euw2") && has("resource","aws_vpc_peering_connection_accepter","euw2_accept")],
    ["PCX routes both ways", ["use2_public_to_euw2_pcx","use2_private_a_to_euw2_pcx","use2_private_b_to_euw2_pcx","euw2_public_a_to_use2_pcx","euw2_public_b_to_use2_pcx","euw2_private_a_to_use2_pcx","euw2_private_b_to_use2_pcx","euw2_main_to_use2_pcx"].every(n=>has("resource","aws_route",n))],
    ["ALB SG + 80 ingress", has("resource","aws_security_group","use2_alb_https") && has("resource","aws_vpc_security_group_ingress_rule","use2_alb_http_80")],
    ["App SG from ALB", has("resource","aws_security_group","use2_app") && has("resource","aws_vpc_security_group_ingress_rule","use2_app_http_from_alb")],
    ["RDS SG 5432 from app", has("resource","aws_security_group","use2_rds") && has("resource","aws_vpc_security_group_ingress_rule","use2_rds_5432_from_app")],
    ["Web SG world 80", has("resource","aws_security_group","use2_web") && has("resource","aws_vpc_security_group_ingress_rule","use2_web_http_world")],
    ["EC2 public AL2023 IMDSv2", has("resource","aws_instance","use2_web") && /http_tokens\s*=\s*"required"/.test(c) && /data\.aws_ssm_parameter\.al2023_ami_use2\.value/.test(c)],
    ["ASG + LT + TG + Listener", ["aws_launch_template use2_app","aws_autoscaling_group use2_app","aws_lb use2","aws_lb_target_group use2","aws_lb_listener use2_http"].every(sig=>{const [t,n]=sig.split(" ");return has("resource",t as any,n);})],
    ["SSM VPC endpoints (3)", ["use2_ssm","use2_ssmmessages","use2_ec2messages"].every(n=>has("resource","aws_vpc_endpoint",n))],
    ["HTTP API → ALB (IAM)", has("resource","aws_apigatewayv2_api","http_api") && has("resource","aws_apigatewayv2_integration","alb_proxy") && has("resource","aws_apigatewayv2_route","root_get") && has("resource","aws_apigatewayv2_route","ec2_get") && has("resource","aws_apigatewayv2_stage","default")],
    ["RDS enc+private + SSM pwd", has("resource","aws_db_subnet_group","use2") && has("resource","random_password","rds_master") && has("resource","aws_ssm_parameter","rds_password") && has("resource","aws_db_instance","use2")],
    ["S3 uploads: versioning+SSE-KMS+PAB+TLS-only",
      [
        "aws_s3_bucket uploads",
        "aws_s3_bucket_versioning uploads",
        "aws_s3_bucket_server_side_encryption_configuration uploads",
        "aws_s3_bucket_public_access_block uploads",
        "data aws_iam_policy_document uploads_policy",
        "aws_s3_bucket_policy uploads"
      ].every(hasSig)
    ],
    ["Lambdas + trigger + KMS grant + warm-ups", has("data","archive_file","lambda_zip") && has("resource","aws_lambda_function","on_upload") && has("data","archive_file","heartbeat_zip") && has("resource","aws_lambda_function","heartbeat") && has("resource","aws_lambda_permission","allow_s3_invoke") && has("resource","aws_s3_bucket_notification","uploads") && has("resource","aws_kms_grant","lambda_upload_kms") && has("data","aws_lambda_invocation","on_upload_warm") && has("data","aws_lambda_invocation","heartbeat_warm")],
    ["CloudFront & Route53 alias", has("resource","aws_cloudfront_distribution","cdn") && has("resource","aws_route53_record","app_alias_alb")],
    ["CloudTrail multi-region + bucket policy", has("resource","aws_cloudtrail","main") && has("resource","aws_s3_bucket_policy","cloudtrail")],
    ["SNS + ASG CPU alarm", has("resource","aws_sns_topic","use2_alarms") && has("resource","aws_cloudwatch_metric_alarm","use2_asg_cpu_high")],
    [
      "All required outputs present",
      [
        "use2_vpc_id","euw2_vpc_id",
        "use2_public_subnet_ids","use2_private_subnet_ids",
        "euw2_public_subnet_ids","euw2_private_subnet_ids",
        "use2_kms_key_arn","euw2_kms_key_arn",
        "upload_bucket_name",
        "lambda_on_upload_name","lambda_on_upload_arn","lambda_heartbeat_name",
        "alb_arn","alb_dns_name",
        "api_invoke_url","cloudfront_domain_name",
        "rds_endpoint","rds_port",
        "app_role_name","app_role_arn",
        "sns_alarms_topic_arn",
        "cw_log_group_use2",
        "use2_cidr","euw2_cidr",
        "web_sg_id","ec2_instance_id","ec2_public_ip",
        "cloudtrail_bucket_name"
      ].every(o => new RegExp(String.raw`\boutput\s+"${o}"\s*\{`).test(c))
    ],
  ];

  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  const total = checks.length;
  const passed = total - failed.length;
  const pct = Math.round((passed / total) * 100);

  if (failed.length) {
    // eslint-disable-next-line no-console
    console.error("\n Requirements not met:\n - " + failed.join("\n - ") + "\n");
  } else {
    // eslint-disable-next-line no-console
    console.log("\n All unit requirements passed (summary = 100%).\n");
  }

  // eslint-disable-next-line no-console
  console.log(`Unit requirements coverage: ${passed}/${total} (${pct}%)`);
  expect(pct).toBeGreaterThanOrEqual(100);
});

