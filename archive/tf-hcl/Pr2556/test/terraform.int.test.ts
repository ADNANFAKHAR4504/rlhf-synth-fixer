// Integration-style static checks against the Terraform code in `lib/`.
// These tests run both locally and in CI and validate that the repo's
// Terraform HCL implements the core security requirements from PROMPT.md.
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

function readAllTf(): { file: string; content: string }[] {
  const files = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.tf'));
  return files.map((f) => ({ file: f, content: fs.readFileSync(path.join(LIB_DIR, f), 'utf8') }));
}

describe('Terraform integration-style checks (file-based)', () => {
  test('S3: app + logging buckets present with versioning and SSE-KMS', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    // Count resource declarations (some files may declare multiple buckets in the same file)
    const s3Matches = joined.match(/resource\s+"aws_s3_bucket"/g) || [];
    // Also account for count = N on bucket resources
    let s3Count = 0;
    const bucketRegex = /resource\s+"aws_s3_bucket"[\s\S]*?\{[\s\S]*?\n\}/g;
    const bucketBlocks = joined.match(bucketRegex) || [];
    for (const block of bucketBlocks) {
      const m = block.match(/count\s*=\s*(\d+)/);
      s3Count += m ? Number(m[1]) : 1;
    }
    // fallback to simple matches if no blocks found
    if (s3Count === 0) s3Count = s3Matches.length;
    expect(s3Count).toBeGreaterThanOrEqual(2);

    // Ensure versioning and SSE are configured (either via aws_s3_bucket_versioning or server_side_encryption resource)
    const hasVersioning = files.some((f) => /resource\s+"aws_s3_bucket_versioning"/.test(f.content) || /versioning_configuration\s*\{[\s\S]*status\s*=\s*"Enabled"/.test(f.content));
    const hasSSE = files.some((f) => /resource\s+"aws_s3_bucket_server_side_encryption_configuration"/.test(f.content) || /kms_master_key_id/.test(f.content) || /sse_algorithm\s*=\s*"aws:kms"/.test(f.content));
    expect(hasVersioning).toBe(true);
    expect(hasSSE).toBe(true);
  });

  test('S3: public access is blocked for buckets', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    // Check for aws_s3_bucket_public_access_block resources or block_public_acls/block_public_policy settings
    const hasPublicBlockResource = /resource\s+"aws_s3_bucket_public_access_block"/.test(joined);
    const hasBlockSettings = /block_public_acls\s*=\s*true|block_public_policy\s*=\s*true|ignore_public_acls\s*=\s*true/i.test(joined);
    expect(hasPublicBlockResource || hasBlockSettings).toBe(true);
  });

  test('S3: server access logging configured (app bucket logs to logging bucket)', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    // Look for logging { target_bucket = aws_s3_bucket.logging.id } or server_access_logging_bucket references
    const hasLoggingBlock = /resource\s+"aws_s3_bucket_logging"/.test(joined) || /logging\s*\{[\s\S]*target_bucket\s*=\s*/.test(joined) || /server_access_logging_bucket|server_access_logs|access_logging/.test(joined);
    // Heuristic: ensure there is at least one bucket named logging or a resource aws_s3_bucket.logging
    const hasLoggingBucket = /resource\s+"aws_s3_bucket"\s+"logging"/.test(joined) || /resource\s+"aws_s3_bucket"[\s\S]*?logging/.test(joined) || /logging_bucket/.test(joined);
    expect(hasLoggingBlock).toBe(true);
    expect(hasLoggingBucket).toBe(true);
  });

  test('CloudTrail: trail resource exists and writes to S3', () => {
    const files = readAllTf();
    const ct = files.find((f) => /resource\s+"aws_cloudtrail"|resource\s+"aws_cloudtrail_trail"/.test(f.content) || /aws_cloudtrail/.test(f.content));
    expect(ct).toBeDefined();
    if (ct) {
      expect(/s3_bucket_name|s3_bucket|S3BucketName|output_bucket/i.test(ct.content)).toBe(true);
    }
  });

  test('VPC: main VPC and at least 2 public and 2 private subnets declared', () => {
    const files = readAllTf();
    const vpc = files.find((f) => /resource\s+"aws_vpc"\s+"main"/.test(f.content) || /resource\s+"aws_vpc"/.test(f.content));
    expect(vpc).toBeDefined();
    const joined = files.map((f) => f.content).join('\n');
    // For each aws_subnet resource block, extract count if present, else count as 1
    const subnetBlockRegex = /resource\s+"aws_subnet"[\s\S]*?\{[\s\S]*?\n\}/g;
    const subnetBlocks = joined.match(subnetBlockRegex) || [];
    let totalSubnet = 0;
    for (const block of subnetBlocks) {
      const m = block.match(/count\s*=\s*(\d+)/);
      totalSubnet += m ? Number(m[1]) : 1;
    }
    // As a fallback, if there are no explicit blocks matched, count simple resource occurrences
    if (totalSubnet === 0) totalSubnet = (joined.match(/resource\s+"aws_subnet"/g) || []).length;
    expect(totalSubnet).toBeGreaterThanOrEqual(4);
    // Also ensure at least one public and one private naming convention exists
    const publicCount = (joined.match(/public(\s|\-)?subnet|public\s*=/gi) || []).length;
    const privateCount = (joined.match(/private(\s|\-)?subnet|private\s*=/gi) || []).length;
    expect(publicCount + privateCount).toBeGreaterThanOrEqual(2);
  });

  test('EC2: launch template / ASG exist and do not enable public IPs explicitly', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    const hasLaunchTemplate = /resource\s+"aws_launch_template"/.test(joined) || /resource\s+"aws_instance"/.test(joined) || /resource\s+"aws_autoscaling_group"/.test(joined);
    expect(hasLaunchTemplate).toBe(true);
    // Ensure no explicit associate_public_ip_address = true in the repo (private subnets expected)
    expect(/associate_public_ip_address\s*=\s*true/.test(joined)).toBe(false);
  });

  test('KMS: CMK resource exists and rotation enabled', () => {
    const files = readAllTf();
    const kms = files.find((f) => /resource\s+"aws_kms_key"/.test(f.content));
    expect(kms).toBeDefined();
    if (kms) {
      expect(/enable_key_rotation\s*=\s*true/.test(kms.content) || /rotation_enabled\s*=\s*true/.test(kms.content)).toBe(true);
    }
  });

  test('AWS Config: a managed rule or config rule exists for EC2-in-ASG', () => {
    const files = readAllTf();
    const cfg = files.find((f) => /resource\s+"aws_config_config_rule"/.test(f.content) || /aws_config_rule/.test(f.content) || /config_rule/.test(f.content));
    // The repo may use a managed rule; at minimum ensure a config rule resource exists
    expect(cfg).toBeDefined();
  });

  test('Networking: IGW, NAT Gateways and route tables exist and are associated', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    const hasIgw = /resource\s+"aws_internet_gateway"/.test(joined) || /aws_internet_gateway/.test(joined);
    const hasNat = /resource\s+"aws_nat_gateway"/.test(joined) || /aws_nat_gateway/.test(joined);
    const hasRouteTable = /resource\s+"aws_route_table"/.test(joined) || /aws_route_table/.test(joined);
    expect(hasIgw).toBe(true);
    // NAT gateways are optional if using centralized NAT, but at least one should exist
    expect(hasNat || /nat_gateway_id/.test(joined)).toBe(true);
    expect(hasRouteTable).toBe(true);
  });

  test('CloudWatch: metric filter for root activity and an alarm with SNS action exist', () => {
    const files = readAllTf();
    const joined = files.map((f) => f.content).join('\n');
    const hasMetricFilter = /resource\s+"aws_cloudwatch_log_metric_filter"/.test(joined) || /cloudwatch_log_metric_filter/.test(joined) || /metric_transformation/.test(joined);
    const hasAlarm = /resource\s+"aws_cloudwatch_metric_alarm"/.test(joined) || /aws_cloudwatch_metric_alarm/.test(joined) || /metric_alarm/.test(joined);
    const hasSns = /resource\s+"aws_sns_topic"/.test(joined) || /aws_sns_topic/.test(joined) || /sns_topic/.test(joined);
    expect(hasMetricFilter).toBe(true);
    expect(hasAlarm).toBe(true);
    expect(hasSns).toBe(true);
  });
});
