// Comprehensive Unit Tests for tap_stack.tf
// Validates all components against user requirements (PROMPT.md)
// No Terraform commands executed - pure static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

const countResource = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"\\w+"`, "g");
  return (content.match(regex) || []).length;
};

const getResourceBlock = (content: string, resourceType: string, resourceName: string): string | null => {
  const regex = new RegExp(
    `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{[\\s\\S]*?\\n}(?=\\n(?:resource|#|variable|output|data|locals|$))`,
    "m"
  );
  const match = content.match(regex);
  return match ? match[0] : null;
};

describe("File Structure & Basic Validations", () => {
  let content: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`tap_stack.tf not found at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists and is readable", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(content.length).toBeGreaterThan(1000);
  });

  test("does NOT declare AWS provider (provider.tf owns it)", () => {
    expect(content).not.toMatch(/provider\s+"aws"\s*\{/);
  });
});

describe("Terraform Configuration (provider.tf owns this)", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("does NOT declare terraform block (provider.tf owns it)", () => {
    expect(content).not.toMatch(/terraform\s*\{/);
  });

  test("does NOT declare required_providers (provider.tf owns it)", () => {
    expect(content).not.toMatch(/required_providers\s*\{/);
  });

  test("uses random_id resource (provider configured in provider.tf)", () => {
    expect(content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
  });
});

describe("CRITICAL: aws_region Variable Handling", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("does NOT redeclare aws_region variable", () => {
    expect(content).not.toMatch(/variable\s+"aws_region"\s*\{/);
  });

  test("references aws_region from provider.tf in locals", () => {
    expect(content).toMatch(/var\.aws_region/);
    expect(content).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("Variables & Inputs", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares required variables with defaults", () => {
    expect(content).toMatch(/variable\s+"environment"/);
    expect(content).toMatch(/variable\s+"owner"/);
    expect(content).toMatch(/variable\s+"project"/);
    expect(content).toMatch(/variable\s+"document_retention_days"/);
    expect(content).toMatch(/default\s*=\s*90/); // 90-day retention
  });

  test("declares alarm configuration variables", () => {
    expect(content).toMatch(/variable\s+"alarm_sns_topic_arn"/);
    expect(content).toMatch(/variable\s+"cloudwatch_alarm_error_threshold"/);
  });
});

describe("Data Sources & Common Tags", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares random_id for bucket suffix", () => {
    expect(content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
  });

  test("defines common_tags with Environment, Owner, Project", () => {
    expect(content).toMatch(/common_tags\s*=/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
    expect(content).toMatch(/Owner\s*=\s*var\.owner/);
    expect(content).toMatch(/Project\s*=\s*var\.project/);
  });
});

describe("REQUIRED: KMS Encryption Keys", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates 2 KMS keys (document + CloudTrail)", () => {
    expect(countResource(content, "aws_kms_key")).toBe(2);
  });

  test("CRITICAL: document KMS key has S3 service permissions", () => {
    const docKey = getResourceBlock(content, "aws_kms_key", "document_key");
    expect(docKey).toMatch(/s3\.amazonaws\.com/);
    expect(docKey).toMatch(/kms:GenerateDataKey/);
  });

  test("both KMS keys have key rotation enabled", () => {
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/g);
  });

  test("creates KMS aliases with region reference", () => {
    expect(content).toMatch(/alias\/legal-documents-key-\$\{local\.region\}/);
    expect(content).toMatch(/alias\/legal-cloudtrail-key-\$\{local\.region\}/);
  });
});

describe("REQUIRED: S3 Document Bucket - Core Features", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates document S3 bucket", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"document_bucket"/);
  });

  test("enables versioning (REQUIRED)", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"document_versioning"/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures KMS encryption (REQUIRED)", () => {
    expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*document_encryption/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.document_key\.arn/);
  });

  test("enables bucket key for cost optimization", () => {
    expect(content).toMatch(/bucket_key_enabled\s*=\s*true/);
  });

  test("configures 90-day retention lifecycle policy (REQUIRED)", () => {
    expect(content).toMatch(/aws_s3_bucket_lifecycle_configuration.*document_lifecycle/);
    expect(content).toMatch(/days\s*=\s*var\.document_retention_days/);
    expect(content).toMatch(/noncurrent_version_expiration/);
  });

  test("blocks all public access (REQUIRED)", () => {
    expect(content).toMatch(/aws_s3_bucket_public_access_block.*document_bucket_public_access_block/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("enforces TLS-only access (REQUIRED)", () => {
    expect(content).toMatch(/aws_s3_bucket_policy.*document_bucket_policy/);
    expect(content).toMatch(/aws:SecureTransport/);
    expect(content).toMatch(/Effect.*Deny/);
  });

  test("enables S3 access logging (REQUIRED)", () => {
    expect(content).toMatch(/aws_s3_bucket_logging.*document_bucket_logging/);
    expect(content).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.log_bucket\.id/);
  });
});

describe("S3 Log Bucket Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates separate log bucket", () => {
    expect(countResource(content, "aws_s3_bucket")).toBe(2);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"log_bucket"/);
  });

  test("log bucket is encrypted", () => {
    expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*log_encryption/);
  });

  test("BEST PRACTICE: log bucket does NOT have versioning (not required, saves cost)", () => {
    const versioningMatches = content.match(/resource\s+"aws_s3_bucket_versioning"/g);
    expect(versioningMatches).toHaveLength(1); // Only document bucket
  });

  test("log bucket has policy allowing CloudTrail and S3 logging", () => {
    expect(content).toMatch(/cloudtrail\.amazonaws\.com/);
    expect(content).toMatch(/logging\.s3\.amazonaws\.com/);
  });
});

describe("REQUIRED: CloudTrail Audit Logging", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates CloudTrail trail", () => {
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"legal_document_trail"/);
  });

  test("CloudTrail logs to dedicated bucket", () => {
    const trail = getResourceBlock(content, "aws_cloudtrail", "legal_document_trail");
    expect(trail).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.log_bucket\.id/);
  });

  test("enables log file validation", () => {
    expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("is multi-region trail", () => {
    expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("uses KMS encryption", () => {
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudtrail_key\.arn/);
  });

  test("has event selector for S3 data events", () => {
    expect(content).toMatch(/event_selector/);
    expect(content).toMatch(/AWS::S3::Object/);
    expect(content).toMatch(/aws_s3_bucket\.document_bucket\.arn/);
  });

  test("BEST PRACTICE: has explicit depends_on for bucket policy", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.log_bucket_policy\]/);
  });
});

describe("REQUIRED: IAM Policies & Roles (Least Privilege)", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates separate read and write IAM policies", () => {
    expect(countResource(content, "aws_iam_policy")).toBe(2);
    expect(content).toMatch(/document_read_policy/);
    expect(content).toMatch(/document_write_policy/);
  });

  test("read policy allows read operations only", () => {
    const readPolicy = getResourceBlock(content, "aws_iam_policy", "document_read_policy");
    expect(readPolicy).toMatch(/s3:GetObject/);
    expect(readPolicy).toMatch(/kms:Decrypt/);
    expect(readPolicy).not.toMatch(/s3:PutObject/);
  });

  test("write policy includes necessary KMS permissions", () => {
    const writePolicy = getResourceBlock(content, "aws_iam_policy", "document_write_policy");
    expect(writePolicy).toMatch(/kms:Encrypt/);
    expect(writePolicy).toMatch(/kms:GenerateDataKey/);
  });

  test("creates separate reader and writer IAM roles", () => {
    expect(countResource(content, "aws_iam_role")).toBe(2);
    expect(content).toMatch(/document_reader_role/);
    expect(content).toMatch(/document_writer_role/);
  });

  test("attaches policies to roles", () => {
    expect(countResource(content, "aws_iam_role_policy_attachment")).toBe(2);
  });
});

describe("CRITICAL: CloudWatch Monitoring - S3 Request Metrics", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("enables S3 request metrics (CRITICAL FIX)", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_metric"\s+"document_bucket_metrics"/);
  });

  test("metrics cover entire bucket", () => {
    const metrics = getResourceBlock(content, "aws_s3_bucket_metric", "document_bucket_metrics");
    expect(metrics).toMatch(/name\s*=\s*"EntireBucket"/);
  });
});

describe("REQUIRED: CloudWatch Alarms", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("creates at least 4 CloudWatch alarms", () => {
    expect(countResource(content, "aws_cloudwatch_metric_alarm")).toBeGreaterThanOrEqual(4);
  });

  test("CRITICAL: 4xx alarm references S3 bucket metric", () => {
    const alarm = getResourceBlock(content, "aws_cloudwatch_metric_alarm", "s3_4xx_error_alarm");
    expect(alarm).toMatch(/metric_name\s*=\s*"4xxErrors"/);
    expect(alarm).toMatch(/namespace\s*=\s*"AWS\/S3"/);
    expect(alarm).toMatch(/FilterId\s*=\s*aws_s3_bucket_metric\.document_bucket_metrics\.name/);
  });

  test("alarms have configurable SNS notifications", () => {
    expect(content).toMatch(/alarm_actions.*alarm_sns_topic_arn/);
  });

  test("monitors error rates and unusual patterns", () => {
    expect(content).toMatch(/4xxErrors/);
    expect(content).toMatch(/5xxErrors/);
    expect(content).toMatch(/DeleteRequests/);
    expect(content).toMatch(/AllRequests/);
  });
});

describe("REQUIRED: Outputs", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("outputs document bucket information", () => {
    expect(content).toMatch(/output\s+"document_bucket_name"/);
    expect(content).toMatch(/output\s+"document_bucket_arn"/);
  });

  test("outputs bucket region using aws_region reference", () => {
    expect(content).toMatch(/output\s+"document_bucket_region"/);
    expect(content).toMatch(/local\.region/);
  });

  test("outputs log bucket name", () => {
    expect(content).toMatch(/output\s+"log_bucket_name"/);
  });

  test("outputs KMS key ID", () => {
    expect(content).toMatch(/output\s+"document_kms_key_id"/);
  });

  test("outputs CloudTrail name", () => {
    expect(content).toMatch(/output\s+"cloudtrail_name"/);
  });

  test("outputs IAM role ARNs", () => {
    expect(content).toMatch(/output\s+"document_reader_role_arn"/);
    expect(content).toMatch(/output\s+"document_writer_role_arn"/);
  });

  test("outputs CloudWatch alarm information", () => {
    expect(content).toMatch(/output\s+"cloudwatch_alarms"/);
  });

  test("has at least 9 outputs", () => {
    const outputs = content.match(/output\s+"\w+"\s*\{/g);
    expect(outputs).not.toBeNull();
    expect(outputs!.length).toBeGreaterThanOrEqual(9);
  });
});

describe("REQUIRED: Resource Tagging", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("all major resources use common_tags", () => {
    const resourcesWithTags = [
      /aws_kms_key.*document_key[\s\S]*?tags\s*=\s*local\.common_tags/,
      /aws_kms_key.*cloudtrail_key[\s\S]*?tags\s*=\s*local\.common_tags/,
      /aws_s3_bucket.*document_bucket[\s\S]*?tags\s*=\s*local\.common_tags/,
      /aws_s3_bucket.*log_bucket[\s\S]*?tags\s*=\s*local\.common_tags/,
      /aws_cloudtrail.*[\s\S]*?tags\s*=\s*local\.common_tags/,
    ];

    resourcesWithTags.forEach(pattern => {
      expect(content).toMatch(pattern);
    });
  });
});

describe("Security & Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("uses jsonencode for policies (not heredoc)", () => {
    const jsonencodeCount = (content.match(/jsonencode\(/g) || []).length;
    expect(jsonencodeCount).toBeGreaterThan(5);
  });

  test("no hardcoded sensitive data", () => {
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
  });

  test("bucket names use dynamic references", () => {
    expect(content).toMatch(/\$\{local\.account_id\}/);
    expect(content).toMatch(/\$\{random_id\.bucket_suffix\.hex\}/);
  });
});

describe("Resource Count Summary", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("correct resource counts", () => {
    expect(countResource(content, "aws_kms_key")).toBe(2);
    expect(countResource(content, "aws_s3_bucket")).toBe(2);
    expect(countResource(content, "aws_iam_policy")).toBe(2);
    expect(countResource(content, "aws_iam_role")).toBe(2);
    expect(countResource(content, "aws_cloudtrail")).toBe(1);
    expect(countResource(content, "aws_s3_bucket_metric")).toBe(1);
    expect(countResource(content, "aws_cloudwatch_metric_alarm")).toBeGreaterThanOrEqual(4);
  });
});

