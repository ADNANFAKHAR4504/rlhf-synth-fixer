import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

let content = '';
let providerContent = '';

function getBlock(regex: RegExp, src: string): string | null {
  const m = src.match(regex);
  return m ? m[0] : null;
}

describe('Terraform integration tests (static) for tap_stack.tf', () => {
  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(fs.existsSync(providerPath)).toBe(true);
    content = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
  });

  test('provider separation: tap_stack has no provider; provider.tf defines aws', () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    expect(providerContent).toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('required variables exist; certain variables intentionally have defaults', () => {
    const mustExist = [
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
    for (const v of mustExist) {
      expect(content).toMatch(new RegExp(`variable\\s+"${v}"\\s*{`));
    }

    // project_name, environment likely have defaults
    expect(
      getBlock(
        /variable\s+"project_name"[\s\S]*?default\s*=\s*"iac-nova"[\s\S]*?}/,
        content
      )
    ).toBeTruthy();
    expect(
      getBlock(
        /variable\s+"environment"[\s\S]*?default\s*=\s*"dev"[\s\S]*?}/,
        content
      )
    ).toBeTruthy();
  });

  test('locals define name_prefix using aws_region and include standard tags', () => {
    expect(content).toMatch(
      /locals\s*{[\s\S]*name_prefix\s*=\s*"\$\{var\.project_name}.*\$\{var\.environment}.*\$\{var\.aws_region}"/
    );
    expect(content).toMatch(
      /tags\s*=\s*{[\s\S]*Project\s*=\s*"IaC\s*-\s*AWS\s+Nova\s+Model\s+Breaking"/
    );
    expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test('subnets use for_each across two AZ config maps; routing and NAT are present', () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    expect(content).toMatch(/locals\s*{[\s\S]*azs\s*=\s*slice\(/);
    expect(content).toMatch(
      /resource\s+"aws_subnet"\s+"public"[\s\S]*for_each/
    );
    expect(content).toMatch(
      /resource\s+"aws_subnet"\s+"private"[\s\S]*for_each/
    );
    expect(content).toMatch(
      /resource\s+"aws_route"\s+"public_internet"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.igw\.id/
    );
    expect(content).toMatch(/locals\s*{[\s\S]*nat_keys\s*=/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"this"/);
    expect(content).toMatch(
      /resource\s+"aws_route"\s+"private_to_nat"[\s\S]*nat_gateway_id/
    );
  });

  test('VPC Flow Logs to CloudWatch with retention from variable and least-privilege IAM', () => {
    expect(content).toMatch(
      /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"[\s\S]*retention_in_days\s*=\s*var\.cw_log_retention_days/
    );
    expect(content).toMatch(
      /data\s+"aws_iam_policy_document"\s+"flow_logs_assume"[\s\S]*sts:AssumeRole/
    );
    expect(content).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    expect(content).toMatch(
      /resource\s+"aws_flow_log"\s+"vpc"[\s\S]*log_destination_type\s*=\s*"cloud-watch-logs"/
    );
    expect(content).toMatch(
      /resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"[\s\S]*logs:CreateLogStream[\s\S]*logs:PutLogEvents/
    );
  });

  test('S3: private ACL, public access blocked, TLS-only policy, and SSE-S3', () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app"/);
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
      /data\s+"aws_iam_policy_document"\s+"app_bucket_policy"[\s\S]*DenyInsecureTransport[\s\S]*aws:SecureTransport/
    );
    expect(content).toMatch(
      /data\s+"aws_iam_policy_document"\s+"app_bucket_policy"[\s\S]*DenyAnonymousRequests/
    );
  });

  test('Security groups: web allows only 80/443 from allowed CIDRs; db allows only from web SG', () => {
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

  test('IAM application role: trust policy to EC2 and least-privilege inline policy', () => {
    expect(content).toMatch(
      /data\s+"aws_iam_policy_document"\s+"app_assume"[\s\S]*sts:AssumeRole/
    );
    expect(content).toMatch(/ec2\.amazonaws\.com/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"app"/);
    expect(content).toMatch(/data\s+"aws_iam_policy_document"\s+"app_policy"/);
    expect(content).toMatch(/s3:GetObject/);
    expect(content).toMatch(/app-data\/*/);
    expect(content).toMatch(/logs:CreateLogStream/);
    expect(content).toMatch(/logs:PutLogEvents/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"app"/);
  });

  test('RDS: private, encrypted, with toggles and parameters; random resources defined', () => {
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
    expect(content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
    expect(content).toMatch(/resource\s+"random_password"\s+"db"/);
  });

  test('Outputs: expected identifiers and ARNs present', () => {
    const outs = [
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
    for (const o of outs) {
      expect(content).toMatch(new RegExp(`output\\s+"${o}"\\s*{`));
    }
  });
});
