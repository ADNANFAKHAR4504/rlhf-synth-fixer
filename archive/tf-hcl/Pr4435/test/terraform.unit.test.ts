/**
 * Terraform Unit Tests — static assertions against tap_stack.tf (no cloud calls)
 * Robust parsing (brace-aware) to avoid truncation on nested blocks (e.g., WAF).
 *
 * Run:
 *   jest --testPathPattern=\.unit\.test\.(js|ts)$ --coverage
 *   npm run test:unit
 */
const fs = require("fs");
const path = require("path");

/* =========================
 * Config & helpers
 * ========================= */
const LIB_DIR = process.env.TF_LIB_DIR
  ? path.resolve(process.cwd(), process.env.TF_LIB_DIR)
  : path.resolve(__dirname, "../lib");

function readTfFile(name) {
  const filePath = path.join(LIB_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `tap_stack.tf not found at ${filePath}. Set TF_LIB_DIR or place file at ./lib.`
    );
  }
  return fs.readFileSync(filePath, "utf8");
}

/** Find the start index of `resource "type" "name"` (or data/variable) */
function findHeaderIndex(content, kind, type, name) {
  const re =
    kind === "variable"
      ? new RegExp(String.raw`${kind}\s+"${type}"\s*\{`, "m")
      : new RegExp(String.raw`${kind}\s+"${type}"\s+"${name}"\s*\{`, "m");
  const m = re.exec(content);
  return m ? m.index : -1;
}

/** Extract a full HCL block starting at the opening `{` (brace-aware). */
function extractBlock(content, startIdx) {
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

function getBlock(content, kind, type, name) {
  const headerIdx = findHeaderIndex(content, kind, type, name);
  if (headerIdx === -1) return null;
  return extractBlock(content, headerIdx);
}

function expectMatch(block, re) {
  expect(block).toBeTruthy();
  if (!block) return;
  const ok = re.test(block);
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error(
      "Regex did not match. Pattern:\n",
      re,
      "\n--- Block start ---\n",
      block.slice(0, 600),
      "\n--- Block end ---"
    );
  }
  expect(ok).toBe(true);
}

/* =========================
 * Tests
 * ========================= */
describe("Terraform stack unit tests (static content & safety)", () => {
  let content = "";

  beforeAll(() => {
    content = readTfFile("tap_stack.tf");
  });

  const hygiene = {
    hasProvider: (c) => /^\s*provider\s+"aws"/m.test(c),
    hasBackend: (c) => /^\s*backend\s+"/m.test(c),
    hasUsEast1: (c) => /"us-east-1"/.test(c),
    hasUsWest2: (c) => /"us-west-2"/.test(c),
    hasEnv: (c) => /"Environment"\s*=\s*var\.environment/.test(c),
    hasOwner: (c) => /"Owner"\s*=\s*var\.owner/.test(c),
    hasCC: (c) => /"CostCenter"\s*=\s*var\.cost_center/.test(c),
    hasProj: (c) => /"project"\s*=\s*var\.project_name/.test(c),
    hasOrgTag: (c) => /"iac-rlhf-amazon"\s*=\s*"true"/.test(c),
  };

  describe("tap_stack.tf — general hygiene", () => {
    it("does not contain provider/backend blocks or hard-coded regions", () => {
      expect(hygiene.hasProvider(content)).toBe(false);
      expect(hygiene.hasBackend(content)).toBe(false);
      expect(hygiene.hasUsEast1(content)).toBe(false);
      expect(hygiene.hasUsWest2(content)).toBe(false);
    });

    it("defines mandatory tagging via locals.base_tags", () => {
      expect(
        hygiene.hasEnv(content) &&
          hygiene.hasOwner(content) &&
          hygiene.hasCC(content) &&
          hygiene.hasProj(content) &&
          hygiene.hasOrgTag(content)
      ).toBe(true);
    });
  });

  describe("Variables & Data sources", () => {
    it("has aws_region with validation regex (pattern + can(regex(..., var.aws_region)))", () => {
      expect(/variable\s+"aws_region"/.test(content)).toBe(true);
      // tolerant spacing: can(regex("...\\d$", var.aws_region))
      expect(
        /can\s*\(\s*regex\s*\(\s*"\^[^"]*\\\\d\$",\s*var\.aws_region\s*\)\s*\)/.test(
          content
        )
      ).toBe(true);
      // ensure no default on aws_region
      const v = getBlock(content, "variable", "aws_region", "");
      expect(v && !/^\s*default\s*=/m.test(v)).toBe(true);
    });

    it("has ip_allowlist default [] and allowed_ssh_cidrs default []", () => {
      expect(
        /variable\s+"ip_allowlist"[\s\S]*?default\s*=\s*\[\]/m.test(content)
      ).toBe(true);
      expect(
        /variable\s+"allowed_ssh_cidrs"[\s\S]*?default\s*=\s*\[\]/m.test(
          content
        )
      ).toBe(true);
    });

    it("loads AL2023 AMI via SSM and AZs via data source", () => {
      expect(
        !!getBlock(content, "data", "aws_ssm_parameter", "al2023_ami")
      ).toBe(true);
      expect(
        !!getBlock(content, "data", "aws_availability_zones", "available")
      ).toBe(true);
    });
  });

  describe("KMS", () => {
    it("has a CMK with rotation and alias", () => {
      const key = getBlock(content, "resource", "aws_kms_key", "platform");
      expectMatch(
        key,
        /^\s*resource\s+"aws_kms_key"\s+"platform"[\s\S]*?enable_key_rotation\s*=\s*true[\s\S]*?\}$/m
      );
      const alias = getBlock(content, "resource", "aws_kms_alias", "platform");
      expectMatch(alias, /target_key_id\s*=\s*aws_kms_key\.platform\.key_id/);
    });
  });

  describe("Networking: VPC, IGW, Subnets, NAT, Routes", () => {
    it("creates VPC with DNS support+hostnames and IGW", () => {
      const vpc = getBlock(content, "resource", "aws_vpc", "main");
      expectMatch(vpc, /enable_dns_support\s*=\s*true/);
      expectMatch(vpc, /enable_dns_hostnames\s*=\s*true/);
      expect(
        !!getBlock(content, "resource", "aws_internet_gateway", "igw")
      ).toBe(true);
    });

    it("has 2 public + 2 private subnets with mapPublicIpOnLaunch on publics", () => {
      const pubA = getBlock(content, "resource", "aws_subnet", "public_a");
      const pubB = getBlock(content, "resource", "aws_subnet", "public_b");
      const privA = getBlock(content, "resource", "aws_subnet", "private_a");
      const privB = getBlock(content, "resource", "aws_subnet", "private_b");
      expectMatch(pubA, /map_public_ip_on_launch\s*=\s*true/);
      expectMatch(pubB, /map_public_ip_on_launch\s*=\s*true/);
      expect(!!pubA && !!pubB && !!privA && !!privB).toBe(true);
    });

    it("has NAT gateway and routes 0.0.0.0/0 via IGW/NAT", () => {
      expect(!!getBlock(content, "resource", "aws_nat_gateway", "nat_a")).toBe(
        true
      );
      expect(
        /resource\s+"aws_route"\s+"public_igw"[\s\S]*0\.0\.0\.0\/0/.test(
          content
        )
      ).toBe(true);
      expect(
        /resource\s+"aws_route"\s+"private_nat"[\s\S]*0\.0\.0\.0\/0/.test(
          content
        )
      ).toBe(true);
    });
  });

  describe("S3 Trail bucket — versioning, public blocks, SSE-KMS, policy", () => {
    it("configures versioning, public access block, and SSE-KMS", () => {
      expect(!!getBlock(content, "resource", "aws_s3_bucket", "trail")).toBe(
        true
      );
      expect(
        !!getBlock(content, "resource", "aws_s3_bucket_versioning", "trail")
      ).toBe(true);
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_s3_bucket_public_access_block",
          "trail"
        )
      ).toBe(true);
      const sse = getBlock(
        content,
        "resource",
        "aws_s3_bucket_server_side_encryption_configuration",
        "trail"
      );
      expectMatch(sse, /sse_algorithm\s*=\s*"aws:kms"/);
    });

    it("builds policy doc with CloudTrail allows and DenyInsecureTransport", () => {
      // single policy doc in your HCL: data "aws_iam_policy_document" "trail_bucket_policy"
      const polDoc = getBlock(
        content,
        "data",
        "aws_iam_policy_document",
        "trail_bucket_policy"
      );
      expect(polDoc).toBeTruthy();
      const txt = polDoc || "";
      expect(/AWSCloudTrailAclCheck/.test(txt)).toBe(true);
      expect(/AWSCloudTrailWrite/.test(txt)).toBe(true);
      expect(/DenyInsecureTransport/.test(txt)).toBe(true);
    });

    it("optionally layers IP deny via dynamic statement and uses local for bucket policy", () => {
      const polDoc = getBlock(
        content,
        "data",
        "aws_iam_policy_document",
        "trail_bucket_policy"
      );
      expect(polDoc).toBeTruthy();
      // dynamic "statement" plus DenyNonAllowlistedIPs
      expect(/dynamic\s+"statement"/.test(polDoc)).toBe(true);
      expect(/DenyNonAllowlistedIPs/.test(polDoc)).toBe(true);

      // local + resource assignment
      const hasLocal =
        /locals?\s*\{[\s\S]*trail_bucket_policy_json\s*=\s*data\.aws_iam_policy_document\.trail_bucket_policy\.json[\s\S]*\}/m.test(
          content
        );
      const bucketPol = getBlock(
        content,
        "resource",
        "aws_s3_bucket_policy",
        "trail"
      );
      expect(hasLocal).toBe(true);
      expectMatch(bucketPol, /policy\s*=\s*local\.trail_bucket_policy_json/);
    });
  });

  describe("CloudTrail + CloudWatch Logs", () => {
    it("creates log group with KMS, role+policy for delivery, and multi-region trail", () => {
      const lg = getBlock(
        content,
        "resource",
        "aws_cloudwatch_log_group",
        "trail"
      );
      expectMatch(lg, /kms_key_id\s*=\s*aws_kms_key\.platform\.arn/);
      expect(
        !!getBlock(content, "resource", "aws_iam_role", "cloudtrail_to_cwl")
      ).toBe(true);
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_iam_role_policy",
          "cloudtrail_to_cwl"
        )
      ).toBe(true);
      const trail = getBlock(content, "resource", "aws_cloudtrail", "org");
      expectMatch(trail, /is_multi_region_trail\s*=\s*true/);
      expectMatch(trail, /enable_logging\s*=\s*true/);
    });

    it("creates metric filter and alarm for console login failures", () => {
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_cloudwatch_log_metric_filter",
          "console_login_failures"
        )
      ).toBe(true);
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_cloudwatch_metric_alarm",
          "console_login_failures"
        )
      ).toBe(true);
    });
  });

  describe("IAM role with IP-based restriction", () => {
    it("trust policy uses account root ARN and has IpAddress condition", () => {
      const role = getBlock(
        content,
        "resource",
        "aws_iam_role",
        "ip_restricted_role"
      );
      expectMatch(
        role,
        /arn:\$\{data\.aws_partition\.current\.partition\}:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root/
      );
      expectMatch(
        role,
        /IpAddress[\s\S]*"aws:SourceIp"[\s\S]*var\.ip_allowlist/
      );
    });

    it("inline policy allows S3 read only with IpAddress condition", () => {
      const pol = getBlock(
        content,
        "resource",
        "aws_iam_role_policy",
        "ip_restricted_policy"
      );
      expectMatch(
        pol,
        /Action\s*=\s*\[\s*"s3:GetObject"\s*,\s*"s3:ListBucket"\s*\]/
      );
      expectMatch(pol, /"aws:SourceIp"[\s\S]*var\.ip_allowlist/);
    });
  });

  describe("Security Groups", () => {
    it("web SG allows HTTP 80 and optional SSH via dynamic block", () => {
      const web = getBlock(content, "resource", "aws_security_group", "web");
      expectMatch(web, /from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/);
      expect(/dynamic\s+"ingress"[\s\S]*allowed_ssh_cidrs/.test(content)).toBe(
        true
      );
    });

    it("db SG exists and ingress from lambda+web via aws_vpc_security_group_ingress_rule", () => {
      expect(!!getBlock(content, "resource", "aws_security_group", "db")).toBe(
        true
      );
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_vpc_security_group_ingress_rule",
          "db_from_lambda"
        )
      ).toBe(true);
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_vpc_security_group_ingress_rule",
          "db_from_web"
        )
      ).toBe(true);
    });

    it("lambda SG exists with egress all", () => {
      const lsg = getBlock(content, "resource", "aws_security_group", "lambda");
      expectMatch(lsg, /egress[\s\S]*protocol\s*=\s*"-?1"/);
    });
  });

  describe("EC2 instance", () => {
    it("uses AL2023 AMI, IMDSv2 required, nginx user_data, in public subnet", () => {
      const inst = getBlock(content, "resource", "aws_instance", "web");
      expectMatch(
        inst,
        /ami\s*=\s*data\.aws_ssm_parameter\.al2023_ami\.value/
      );
      expectMatch(inst, /http_tokens\s*=\s*"required"/);
      expectMatch(inst, /dnf\s+-y\s+install\s+nginx/);
      expectMatch(inst, /subnet_id\s*=\s*aws_subnet\.public_a\.id/);
    });

    it("attaches instance profile referencing ec2_ssm_role", () => {
      const prof = getBlock(
        content,
        "resource",
        "aws_iam_instance_profile",
        "web"
      );
      expectMatch(prof, /role\s*=\s*aws_iam_role\.ec2_ssm_role\.name/);
    });
  });

  describe("RDS PostgreSQL", () => {
    it("creates random password stored in SSM with KMS key", () => {
      const pw = getBlock(
        content,
        "resource",
        "random_password",
        "db_master_password"
      );
      expect(!!pw).toBe(true);
      const ssm = getBlock(
        content,
        "resource",
        "aws_ssm_parameter",
        "db_master_password"
      );
      expectMatch(ssm, /type\s*=\s*"SecureString"/);
      expectMatch(ssm, /key_id\s*=\s*aws_kms_key\.platform\.key_id/);
    });

    it("subnet group, parameter group with rds.force_ssl=1, and non-public DB instance", () => {
      expect(
        !!getBlock(content, "resource", "aws_db_subnet_group", "main")
      ).toBe(true);
      const pg = getBlock(
        content,
        "resource",
        "aws_db_parameter_group",
        "pg"
      );
      expectMatch(
        pg,
        /parameter\s*\{[\s\S]*name\s*=\s*"rds\.force_ssl"[\s\S]*value\s*=\s*"1"/
      );
      const db = getBlock(content, "resource", "aws_db_instance", "pg");
      expectMatch(db, /publicly_accessible\s*=\s*false/);
      expectMatch(db, /storage_encrypted\s*=\s*true/);
      expectMatch(db, /kms_key_id\s*=\s*aws_kms_key\.platform\.arn/);
    });
  });

  describe("Lambda + API Gateway (HTTP API) with AWS_IAM auth", () => {
    it("packages function zip and has VPC config", () => {
      expect(
        !!getBlock(content, "data", "archive_file", "lambda_zip")
      ).toBe(true);
      const fn = getBlock(
        content,
        "resource",
        "aws_lambda_function",
        "heartbeat"
      );
      expectMatch(fn, /vpc_config\s*\{[\s\S]*security_group_ids/);
      // reserved_concurrent_executions is not required in your HCL, so not asserted
    });

    it("configures HTTP API, proxy integration, $default route with AWS_IAM, stage, and permission", () => {
      expect(!!getBlock(content, "resource", "aws_apigatewayv2_api", "http")).toBe(
        true
      );
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_apigatewayv2_integration",
          "heartbeat"
        )
      ).toBe(true);
      const route = getBlock(
        content,
        "resource",
        "aws_apigatewayv2_route",
        "root"
      );
      expectMatch(route, /\$default/);
      expectMatch(route, /authorization_type\s*=\s*"AWS_IAM"/);
      expect(
        !!getBlock(content, "resource", "aws_apigatewayv2_stage", "default")
      ).toBe(true);
      expect(
        !!getBlock(content, "resource", "aws_lambda_permission", "apigw_invoke")
      ).toBe(true);
    });
  });

  describe("WAFv2 and logging", () => {
    it("creates regional Web ACL with AWSManagedRulesCommonRuleSet; association resource exists", () => {
      const waf = getBlock(content, "resource", "aws_wafv2_web_acl", "api");
      expectMatch(waf, /AWSManagedRulesCommonRuleSet/i);
      // association exists (in your HCL it's count = 0, but resource is present)
      expect(
        !!getBlock(
          content,
          "resource",
          "aws_wafv2_web_acl_association",
          "api_stage"
        )
      ).toBe(true);
    });

    it("optionally enables logging when waf_firehose_arn is provided (count expression)", () => {
      const re =
        /resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"api"[\s\S]*count\s*=\s*local\.waf_logging_enabled\s*\?\s*1\s*:\s*0/;
      expect(re.test(content)).toBe(true);
    });
  });

  describe("Optional CloudFront blocks guarded by count", () => {
    it("CloudFront OAC and distribution use count based on enable_cloudfront", () => {
      expect(
        /resource\s+"aws_cloudfront_origin_access_control"[\s\S]*count\s*=\s*var\.enable_cloudfront\s*\?\s*1\s*:\s*0/.test(
          content
        )
      ).toBe(true);
      expect(
        /resource\s+"aws_cloudfront_distribution"[\s\S]*count\s*=\s*var\.enable_cloudfront\s*\?\s*1\s*:\s*0/.test(
          content
        )
      ).toBe(true);
    });
  });

  describe("Outputs", () => {
    it("exposes key IDs and endpoints (VPC, subnets, IGW, RTs, SGs, EC2, API, RDS, S3, CloudTrail)", () => {
      const keys = [
        "vpc_id",
        "public_subnet_ids",
        "private_subnet_ids",
        "subnet_azs",
        "internet_gateway_id",
        "public_route_table_id",
        "private_route_table_id",
        "security_group_web_id",
        "security_group_db_id",
        "security_group_lambda_id",
        "ec2_instance_id",
        "ec2_public_ip",
        "api_invoke_url",
        "lambda_function_name",
        "rds_endpoint",
        "trail_bucket_name",
        "cloudtrail_name",
        "app_bucket_name",
      ];
      for (const k of keys) {
        const re = new RegExp(String.raw`output\s+"${k}"\s*\{`);
        expect(re.test(content)).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Unit requirements coverage summary (==100%)
// ---------------------------------------------------------------------------
test("Unit requirements coverage summary (==100%)", () => {
  const contentLocal = fs.readFileSync(
    path.join(LIB_DIR, "tap_stack.tf"),
    "utf8"
  );

  // Tiny brace-aware helpers (inline)
  function findHeaderIndex(c, kind, type, name) {
    const re =
      kind === "variable"
        ? new RegExp(String.raw`${kind}\s+"${type}"\s*\{`, "m")
        : new RegExp(String.raw`${kind}\s+"${type}"\s+"${name}"\s*\{`, "m");
    const m = re.exec(c);
    return m ? m.index : -1;
  }
  function extractBlock(c, startIdx) {
    const braceStart = c.indexOf("{", startIdx);
    if (braceStart === -1) return null;
    let depth = 0;
    for (let i = braceStart; i < c.length; i++) {
      const ch = c[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return c.slice(startIdx, i + 1);
      }
    }
    return null;
  }
  function gb(t, n) {
    const idx = findHeaderIndex(contentLocal, "resource", t, n);
    return idx === -1 ? null : extractBlock(contentLocal, idx);
  }
  function gd(t, n) {
    const idx = findHeaderIndex(contentLocal, "data", t, n);
    return idx === -1 ? null : extractBlock(contentLocal, idx);
  }
  function gv(name) {
    const idx = findHeaderIndex(contentLocal, "variable", name, "");
    return idx === -1 ? null : extractBlock(contentLocal, idx);
  }

  const checks = [
    [
      'aws_region present (no default) + can(regex(..., var.aws_region))',
      (() => {
        const v = gv("aws_region");
        const noDefault = !!v && !/^\s*default\s*=/m.test(v);
        const hasCanRegex = /can\s*\(\s*regex\s*\(\s*".*?\\\\d\$",\s*var\.aws_region\s*\)\s*\)/.test(
          contentLocal
        );
        return !!v && noDefault && hasCanRegex;
      })(),
    ],
    [
      "ip_allowlist & allowed_ssh_cidrs default []",
      /variable\s+"ip_allowlist"[\s\S]*?default\s*=\s*\[\]/m.test(
        contentLocal
      ) &&
        /variable\s+"allowed_ssh_cidrs"[\s\S]*?default\s*=\s*\[\]/m.test(
          contentLocal
        ),
    ],
    [
      "locals.base_tags includes iac-rlhf-amazon",
      /locals?\s*\{[\s\S]*base_tags[\s\S]*"iac-rlhf-amazon"\s*=\s*"true"[\s\S]*\}/m.test(
        contentLocal
      ),
    ],
    [
      "WAF Web ACL exists & association resource present",
      !!gb("aws_wafv2_web_acl", "api") &&
        !!gb("aws_wafv2_web_acl_association", "api_stage"),
    ],
    [
      "Outputs present (key infra)",
      [
        "vpc_id",
        "public_subnet_ids",
        "private_subnet_ids",
        "subnet_azs",
        "internet_gateway_id",
        "public_route_table_id",
        "private_route_table_id",
        "security_group_web_id",
        "security_group_db_id",
        "security_group_lambda_id",
        "ec2_instance_id",
        "ec2_public_ip",
        "api_invoke_url",
        "lambda_function_name",
        "rds_endpoint",
        "trail_bucket_name",
        "cloudtrail_name",
        "app_bucket_name",
      ].every((o) =>
        new RegExp(String.raw`output\s+"${o}"\s*\{`).test(contentLocal)
      ),
    ],
    [
      "S3 trail policy local wired to bucket policy",
      /locals?\s*\{[\s\S]*trail_bucket_policy_json[\s\S]*\}/m.test(
        contentLocal
      ) &&
        /resource\s+"aws_s3_bucket_policy"\s+"trail"[\s\S]*policy\s*=\s*local\.trail_bucket_policy_json/m.test(
          contentLocal
        ),
    ],
    [
      "EC2 instance profile uses ec2_ssm_role",
      /resource\s+"aws_iam_instance_profile"[\s\S]*name\s*=\s*".*?-web-instance-profile"[\s\S]*role\s*=\s*aws_iam_role\.ec2_ssm_role\.name/m.test(
        contentLocal
      ),
    ],
    [
      "HTTP API -> heartbeat integration",
      !!gb("aws_apigatewayv2_api", "http") &&
        !!gb("aws_apigatewayv2_integration", "heartbeat"),
    ],
  ];

  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  const total = checks.length;
  const passed = total - failed.length;
  const pct = Math.round((passed / total) * 100);

  if (failed.length) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Requirements not met:\n - " + failed.join("\n - ") + "\n");
  } else {
    // eslint-disable-next-line no-console
    console.log("\n✅ All unit requirements passed (summary = 100%).\n");
  }

  // eslint-disable-next-line no-console
  console.log(`Unit requirements coverage: ${passed}/${total} (${pct}%)`);
  expect(pct).toBe(100);
});
