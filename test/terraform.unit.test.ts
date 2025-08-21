import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

let content = '';

describe('Terraform single-file stack: tap_stack.tf', () => {
  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    content = fs.readFileSync(stackPath, 'utf8');
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares all required variables', () => {
    const vars = [
      'aws_region',
      'project_name',
      'allowed_cidrs',
      'environment',
      'multi_az',
      'deletion_protection',
      'vpc_cidr',
      'nat_per_az',
      'rds_engine',
      'rds_engine_version',
      'rds_instance_class',
      'rds_allocated_storage',
      'cw_log_retention_days',
    ];
    for (const v of vars) {
      expect(content).toMatch(new RegExp(`variable\\s+"${v}"\\s*{`));
    }
  });

  test('locals define tags with Project, ManagedBy, Environment', () => {
    expect(content).toMatch(
      /locals\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?Project\s*=\s*"IaC\s*-\s*AWS\s+Nova\s+Model\s+Breaking"[\s\S]*?ManagedBy\s*=\s*"Terraform"[\s\S]*?Environment\s*=\s*var\.environment[\s\S]*?}/
    );
  });

  test('VPC and subnets and routing are defined (including NAT)', () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"igw"\s*{/);
    expect(content).toMatch(
      /resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*for_each/
    );
    expect(content).toMatch(
      /resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*for_each/
    );
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"this"\s*{/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    expect(content).toMatch(/resource\s+"aws_route"\s+"private_to_nat"/);
  });

  test('VPC Flow Logs to CloudWatch with least-privilege role', () => {
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/
    );
    expect(content).toMatch(
      /data\s+"aws_iam_policy_document"\s+"flow_logs_assume"/
    );
    expect(content).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    expect(content).toMatch(
      /resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/
    );
    expect(content).toMatch(/logs:CreateLogStream/);
    expect(content).toMatch(/logs:PutLogEvents/);
    expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
    expect(content).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/);
    expect(content).toMatch(
      /retention_in_days\s*=\s*var\.cw_log_retention_days/
    );
  });

  test('S3 bucket is private, blocks public access, enforces TLS-only, and uses SSE-S3', () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app"\s*{/);
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_ownership_controls"\s+"app"/
    );
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_acl"\s+"app"[\s\S]*acl\s*=\s*"private"/
    );
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_public_access_block"\s+"app"[\s\S]*block_public_acls\s*=\s*true[\s\S]*block_public_policy\s*=\s*true[\s\S]*ignore_public_acls\s*=\s*true[\s\S]*restrict_public_buckets\s*=\s*true/
    );
    expect(content).toMatch(
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app"[\s\S]*sse_algorithm\s*=\s*"AES256"/
    );
    expect(content).toMatch(
      /data\s+"aws_iam_policy_document"\s+"app_bucket_policy"/
    );
    expect(content).toMatch(/DenyInsecureTransport/);
    expect(content).toMatch(/aws:SecureTransport/);
    expect(content).toMatch(/DenyAnonymousRequests/);
  });

  test('Security groups restrict ingress to 80/443 from allowed CIDRs; DB allows only from web SG', () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    expect(content).toMatch(
      /resource\s+"aws_security_group_rule"\s+"web_http"[\s\S]*from_port\s*=\s*80[\s\S]*cidr_blocks/
    );
    expect(content).toMatch(
      /resource\s+"aws_security_group_rule"\s+"web_https"[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks/
    );
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"db"/);
    expect(content).toMatch(
      /resource\s+"aws_security_group_rule"\s+"db_from_web"[\s\S]*source_security_group_id\s*=\s*aws_security_group\.web\.id/
    );
  });

  test('IAM application role has least-privilege inline policy', () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"app"/);
    expect(content).toMatch(/data\s+"aws_iam_policy_document"\s+"app_assume"/);
    expect(content).toMatch(/ec2\.amazonaws\.com/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"app"/);
    expect(content).toMatch(/s3:GetObject/);
    expect(content).toMatch(/app-data\/*/);
    expect(content).toMatch(/logs:CreateLogStream/);
    expect(content).toMatch(/logs:PutLogEvents/);
  });

  test('RDS instance is encrypted, private, and parameterized with toggles', () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"db"/);
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"db"/);
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/publicly_accessible\s*=\s*false/);
    expect(content).toMatch(/multi_az\s*=\s*var\.multi_az/);
    expect(content).toMatch(
      /deletion_protection\s*=\s*var\.deletion_protection/
    );
    expect(content).toMatch(/engine\s*=\s*var\.rds_engine/);
    expect(content).toMatch(/engine_version\s*=\s*var\.rds_engine_version/);
    expect(content).toMatch(/instance_class\s*=\s*var\.rds_instance_class/);
    expect(content).toMatch(
      /allocated_storage\s*=\s*var\.rds_allocated_storage/
    );
    expect(content).toMatch(/password\s*=\s*random_password\.db\.result/);
  });

  test('Outputs include required identifiers and ARNs', () => {
    const requiredOutputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'web_sg_id',
      'db_sg_id',
      's3_bucket_name',
      'rds_endpoint',
      'iam_flow_logs_role_arn',
      'iam_app_role_arn',
    ];
    for (const o of requiredOutputs) {
      expect(content).toMatch(new RegExp(`output\\s+"${o}"\\s*{`));
    }
  });
});
