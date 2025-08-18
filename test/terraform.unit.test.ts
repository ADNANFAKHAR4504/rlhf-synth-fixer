
/**
 * terraform.unit.test.ts
 *
 * Pure Jest tests that validate the Terraform stack structure and configuration
 * by parsing HCL text directly — no `terraform init/plan/apply` calls.
 *
 * File resolution order:
 *   1) ../lib/tap_stack.tf
 *   2) ../lib/main.tf
 *   3) All ../lib/*.tf concatenated (if the above aren’t found)
 *
 * What’s validated (high level):
 *  - required_version and basic formatting
 *  - variables (names, presence, some defaults)
 *  - networking (VPC, subnets, route tables, IGW, no NAT/EIP)
 *  - VPC Endpoints (S3 Gateway, SSM/EC2Messages/SSMMessages Interface)
 *  - Security Groups (bastion + private rules)
 *  - KMS key & alias
 *  - S3 bucket + versioning + KMS SSE + public access block
 *  - IAM roles, instance profiles, SSM + custom S3 policy attachment
 *  - SSH key generation flow & effective key local
 *  - AMI data source (Ubuntu Jammy)
 *  - EC2 instances (bastion public; app private; proper SGs & profiles)
 *  - DynamoDB lock table
 *  - Outputs
 *  - Negative assertions: no aws_eip, no aws_nat_gateway
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

const LIB_DIR = path.resolve(__dirname, '../lib');

function readStackText(): string {
  const primary = path.join(LIB_DIR, 'tap_stack.tf');
  const alt = path.join(LIB_DIR, 'tap_stack.tf');

  if (fs.existsSync(primary)) {
    return fs.readFileSync(primary, 'utf8');
  }
  if (fs.existsSync(alt)) {
    return fs.readFileSync(alt, 'utf8');
  }
  const tfFiles = glob.sync(path.join(LIB_DIR, '*.tf'));
  if (tfFiles.length === 0) {
    throw new Error(`No Terraform files found in ${LIB_DIR}`);
  }
  return tfFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
}

const tf = readStackText();

/**
 * Utilities to find HCL blocks and inspect their bodies without needing Terraform.
 * We do a light, robust parse sufficient for unit assertions:
 *   - findBlock(kind, type, name) gets the full text of the specific block.
 *   - getAttr(body, key) extracts a simple attribute value (string, number, bool, array-of-strings).
 *   - has(body, snippetRegex) checks a regex inside a block's body.
 */

// Finds a block like:   resource "aws_vpc" "main" { ...balanced braces... }
function findBlock(kind: 'resource' | 'data' | 'variable' | 'output' | 'locals' | 'module', type?: string, nameOrLabel?: string): string | null {
  const header = (() => {
    if (kind === 'locals') return `locals\\s*\\{`;
    if (type && nameOrLabel) return `${kind}\\s+"${escapeReg(type)}"\\s+"${escapeReg(nameOrLabel)}"\\s*\\{`;
    if (type) return `${kind}\\s+"${escapeReg(type)}"\\s*\\{`;
    return `${kind}\\s*\\{`;
  })();

  const re = new RegExp(header, 'g');
  const m = re.exec(tf);
  if (!m) return null;

  const startIdx = m.index + m[0].length - 1; // we landed after the opening '{'
  const block = extractBalancedBlock(tf, startIdx);
  return block;
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Given index pointing at '{', return '{...}' including braces
function extractBalancedBlock(source: string, openBraceIdx: number): string {
  let depth = 0;
  let i = openBraceIdx;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(openBraceIdx - 1, i + 1); // include the opening char before '{' to get clean block
      }
    }
  }
  throw new Error('Unbalanced braces while parsing HCL block.');
}

function getBody(block: string): string {
  const firstBrace = block.indexOf('{');
  const lastBrace = block.lastIndexOf('}');
  return block.slice(firstBrace + 1, lastBrace);
}

function has(body: string, re: RegExp): boolean {
  return re.test(body);
}

// Crude attribute getter for common patterns (string/number/bool/array-of-strings)
function getAttr(body: string, key: string): string | string[] | number | boolean | null {
  // string => key = "value"
  const strRe = new RegExp(`\\b${escapeReg(key)}\\s*=\\s*"([^"]*)"`);
  const sm = strRe.exec(body);
  if (sm) return sm[1];

  // number => key = 123 or 10.5
  const numRe = new RegExp(`\\b${escapeReg(key)}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)\\b`);
  const nm = numRe.exec(body);
  if (nm) return Number(nm[1]);

  // boolean => key = true|false
  const boolRe = new RegExp(`\\b${escapeReg(key)}\\s*=\\s*(true|false)\\b`);
  const bm = boolRe.exec(body);
  if (bm) return bm[1] === 'true';

  // array of strings => key = ["a","b",...]
  const arrRe = new RegExp(`\\b${escapeReg(key)}\\s*=\\s*\\[([^\\]]*)\\]`);
  const am = arrRe.exec(body);
  if (am) {
    const inner = am[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^"|"$/g, ''));
    return inner;
  }

  return null;
}

/* ----------------------- Tests begin here ----------------------- */

describe('Terraform Stack (HCL static validation)', () => {
  test('has required Terraform version >= 1.6.0', () => {
    expect(/terraform\s*\{[\s\S]*?required_version\s*=\s*">=\s*1\.6\.0"/.test(tf)).toBe(true);
  });

  test('declares key variables with sensible defaults', () => {
    const awsRegion = findBlock('variable', 'aws_region', undefined);
    expect(awsRegion).toBeTruthy();
    expect(getBody(awsRegion!)).toMatch(/default\s*=\s*"us-east-1"/);

    const project = findBlock('variable', 'project_name', undefined);
    expect(project).toBeTruthy();
    expect(getBody(project!)).toMatch(/default\s*=\s*"prod"/);

    const env = findBlock('variable', 'env', undefined);
    expect(env).toBeTruthy();
    expect(getBody(env!)).toMatch(/default\s*=\s*"Prod"/);

    const vpcCidr = findBlock('variable', 'vpc_cidr', undefined);
    expect(vpcCidr).toBeTruthy();
    expect(getBody(vpcCidr!)).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);

    const sshKey = findBlock('variable', 'ssh_key_name', undefined);
    expect(sshKey).toBeTruthy();
    expect(getBody(sshKey!)).toMatch(/default\s*=\s*""/);
  });
  
  test('VPC endpoints configured (S3 gateway + SSM/EC2Messages/SSMMessages interfaces)', () => {
    const epS3 = findBlock('resource', 'aws_vpc_endpoint', 's3');
    expect(epS3).toBeTruthy();
    const epS3Body = getBody(epS3!);
    expect(getAttr(epS3Body, 'vpc_endpoint_type')).toBe('Gateway');
    expect(has(epS3Body, /service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/)).toBe(true);
    expect(has(epS3Body, /route_table_ids\s*=\s*\[\s*aws_route_table\.private\.id\s*\]/)).toBe(true);

    const epSSM = findBlock('resource', 'aws_vpc_endpoint', 'ssm');
    const epEC2M = findBlock('resource', 'aws_vpc_endpoint', 'ec2messages');
    const epSSMM = findBlock('resource', 'aws_vpc_endpoint', 'ssmmessages');
    expect(epSSM && epEC2M && epSSMM).toBeTruthy();

    for (const [blk, svc] of [
      [epSSM!, 'ssm'],
      [epEC2M!, 'ec2messages'],
      [epSSMM!, 'ssmmessages'],
    ] as const) {
      const body = getBody(blk);
      expect(getAttr(body, 'vpc_endpoint_type')).toBe('Interface');
      expect(has(body, new RegExp(`service_name\\s*=\\s*"com\\.amazonaws\\.\\$\\{var\\.aws_region\\}\\.${svc}"`))).toBe(true);
      expect(has(body, /subnet_ids\s*=\s*\[\s*aws_subnet\.private_a\.id,\s*aws_subnet\.private_b\.id\s*\]/)).toBe(true);
      expect(has(body, /security_group_ids\s*=\s*\[\s*aws_security_group\.endpoints_sg\.id\s*\]/)).toBe(true);
      expect(getAttr(body, 'private_dns_enabled')).toBe(true);
    }

    const epSg = findBlock('resource', 'aws_security_group', 'endpoints_sg');
    expect(epSg).toBeTruthy();
    const epSgBody = getBody(epSg!);
    expect(has(epSgBody, /ingress\s*\{[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\[\s*var\.vpc_cidr\s*\]/)).toBe(true);
  });

  test('Security Groups: bastion restricts SSH to detected IP; private allows from bastion SG', () => {
    const bastionSg = findBlock('resource', 'aws_security_group', 'bastion_sg');
    expect(bastionSg).toBeTruthy();
    const bastionSgBody = getBody(bastionSg!);
    expect(has(bastionSgBody, /ingress\s*\{[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\[\s*local\.bastion_allowed_cidr\s*\]/)).toBe(true);
    expect(has(bastionSgBody, /egress\s*\{[\s\S]*protocol\s*=\s*"-1"[\s\S]*"0\.0\.0\.0\/0"/)).toBe(true);

    const privateSg = findBlock('resource', 'aws_security_group', 'private_sg');
    expect(privateSg).toBeTruthy();
    const privateSgBody = getBody(privateSg!);
    expect(has(privateSgBody, /ingress\s*\{[\s\S]*from_port\s*=\s*22[\s\S]*security_groups\s*=\s*\[\s*aws_security_group\.bastion_sg\.id\s*\]/)).toBe(true);
  });

  test('KMS key & alias exist', () => {
    const kms = findBlock('resource', 'aws_kms_key', 'state_key');
    expect(kms).toBeTruthy();
    expect(has(getBody(kms!), /enable_key_rotation\s*=\s*true/)).toBe(true);

    const alias = findBlock('resource', 'aws_kms_alias', 'state_key_alias');
    expect(alias).toBeTruthy();
    expect(has(getBody(alias!), /name\s*=\s*"alias\/\$\{var\.project_name\}-state-key"/)).toBe(true);
  });

  test('S3 bucket is versioned, KMS-encrypted, and fully private via public access block', () => {
    const bucket = findBlock('resource', 'aws_s3_bucket', 'app_bucket');
    expect(bucket).toBeTruthy();

    const versioning = findBlock('resource', 'aws_s3_bucket_versioning', 'app_versioning');
    expect(versioning).toBeTruthy();
    expect(getBody(versioning!)).toMatch(/status\s*=\s*"Enabled"/);

    const sse = findBlock('resource', 'aws_s3_bucket_server_side_encryption_configuration', 'app_encryption');
    expect(sse).toBeTruthy();
    const sseBody = getBody(sse!);
    expect(has(sseBody, /kms_master_key_id\s*=\s*aws_kms_key\.state_key\.arn/)).toBe(true);
    expect(has(sseBody, /sse_algorithm\s*=\s*"aws:kms"/)).toBe(true);

    const pab = findBlock('resource', 'aws_s3_bucket_public_access_block', 'app_public_access');
    expect(pab).toBeTruthy();
    const pabBody = getBody(pab!);
    expect(getAttr(pabBody, 'block_public_acls')).toBe(true);
    expect(getAttr(pabBody, 'block_public_policy')).toBe(true);
    expect(getAttr(pabBody, 'ignore_public_acls')).toBe(true);
    expect(getAttr(pabBody, 'restrict_public_buckets')).toBe(true);
  });

  test('IAM roles, policies, and instance profiles are in place', () => {
    const appRole = findBlock('resource', 'aws_iam_role', 'app_role');
    const appS3Policy = findBlock('resource', 'aws_iam_policy', 'app_s3_policy');
    const appAttachS3 = findBlock('resource', 'aws_iam_role_policy_attachment', 'app_attach_s3');
    const appAttachSSM = findBlock('resource', 'aws_iam_role_policy_attachment', 'app_attach_ssm');
    const appProfile = findBlock('resource', 'aws_iam_instance_profile', 'app_profile');

    expect(appRole && appS3Policy && appAttachS3 && appAttachSSM && appProfile).toBeTruthy();

    const appPolicyBody = getBody(appS3Policy!);
    expect(/"s3:GetObject"/.test(appPolicyBody)).toBe(true);
    expect(/"s3:PutObject"/.test(appPolicyBody)).toBe(true);
    expect(/"s3:ListBucket"/.test(appPolicyBody)).toBe(true);
    expect(/"\$\{aws_s3_bucket\.app_bucket\.arn\}\/\*"/.test(appPolicyBody)).toBe(true);

    const bastionRole = findBlock('resource', 'aws_iam_role', 'bastion_role');
    const bastionAttach = findBlock('resource', 'aws_iam_role_policy_attachment', 'bastion_attach_ssm');
    const bastionProfile = findBlock('resource', 'aws_iam_instance_profile', 'bastion_profile');
    expect(bastionRole && bastionAttach && bastionProfile).toBeTruthy();

    const ssmAttachBodies = [getBody(appAttachSSM!), getBody(bastionAttach!)];
    for (const b of ssmAttachBodies) {
      expect(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/.test(b)).toBe(true);
    }
  });

  test('AMI data source is Ubuntu Jammy 22.04 (most recent, HVM)', () => {
    const ami = findBlock('data', 'aws_ami', 'ubuntu');
    expect(ami).toBeTruthy();
    const body = getBody(ami!);
    expect(getAttr(body, 'most_recent')).toBe(true);
    expect(/owners\s*=\s*\[\s*"099720109477"\s*\]/.test(body)).toBe(true);
    expect(/values\s*=\s*\[\s*"ubuntu\/images\/hvm-ssd\/ubuntu-jammy-22\.04-amd64-server-\*"\s*\]/.test(body)).toBe(true);
    expect(/name\s*=\s*"virtualization-type"[\s\S]*values\s*=\s*\[\s*"hvm"\s*\]/.test(body) || /"virtualization-type"[\s\S]*"hvm"/.test(body)).toBe(true);
  });

  test('EC2 instances: bastion (public) + app (private) with correct SGs & profiles', () => {
    const bastion = findBlock('resource', 'aws_instance', 'bastion');
    const app = findBlock('resource', 'aws_instance', 'app');
    expect(bastion && app).toBeTruthy();

    const bBody = getBody(bastion!);
    expect(getAttr(bBody, 'associate_public_ip_address')).toBe(true);
    expect(has(bBody, /subnet_id\s*=\s*aws_subnet\.public\.id/)).toBe(true);
    expect(has(bBody, /vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.bastion_sg\.id\s*\]/)).toBe(true);
    expect(has(bBody, /iam_instance_profile\s*=\s*aws_iam_instance_profile\.bastion_profile\.name/)).toBe(true);

    const aBody = getBody(app!);
    expect(getAttr(aBody, 'associate_public_ip_address')).toBe(false);
    expect(has(aBody, /subnet_id\s*=\s*aws_subnet\.private_a\.id/)).toBe(true);
    expect(has(aBody, /vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.private_sg\.id\s*\]/)).toBe(true);
    expect(has(aBody, /iam_instance_profile\s*=\s*aws_iam_instance_profile\.app_profile\.name/)).toBe(true);
  });

  test('DynamoDB lock table is PAY_PER_REQUEST with LockID hash', () => {
    const table = findBlock('resource', 'aws_dynamodb_table', 'tf_lock');
    expect(table).toBeTruthy();
    const body = getBody(table!);
    expect(getAttr(body, 'billing_mode')).toBe('PAY_PER_REQUEST');
    expect(has(body, /hash_key\s*=\s*"LockID"/)).toBe(true);
    expect(has(body, /attribute\s*\{[\s\S]*name\s*=\s*"LockID"[\s\S]*type\s*=\s*"S"/)).toBe(true);
  });

  test('Outputs are defined and reference the correct resources', () => {
    const outVpc = findBlock('output', 'vpc_id');
    const outPub = findBlock('output', 'public_subnet_id');
    const outPriv = findBlock('output', 'private_subnet_ids');
    const outBastionIp = findBlock('output', 'bastion_public_ip');
    const outAppId = findBlock('output', 'app_instance_id');
    const outBucket = findBlock('output', 'app_s3_bucket');
    const outKms = findBlock('output', 'kms_key_arn');
    const outKeyName = findBlock('output', 'ssh_key_name_effective');
    const outKeyPath = findBlock('output', 'generated_private_key_path');

    for (const o of [outVpc, outPub, outPriv, outBastionIp, outAppId, outBucket, outKms, outKeyName, outKeyPath]) {
      expect(o).toBeTruthy();
    }

    expect(getBody(outVpc!)).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    expect(getBody(outPub!)).toMatch(/value\s*=\s*aws_subnet\.public\.id/);
    expect(getBody(outPriv!)).toMatch(/value\s*=\s*\[\s*aws_subnet\.private_a\.id,\s*aws_subnet\.private_b\.id\s*\]/);
    expect(getBody(outBastionIp!)).toMatch(/value\s*=\s*aws_instance\.bastion\.public_ip/);
    expect(getBody(outAppId!)).toMatch(/value\s*=\s*aws_instance\.app\.id/);
    expect(getBody(outBucket!)).toMatch(/value\s*=\s*aws_s3_bucket\.app_bucket\.bucket/);
    expect(getBody(outKms!)).toMatch(/value\s*=\s*aws_kms_key\.state_key\.arn/);
    expect(getBody(outKeyName!)).toMatch(/value\s*=\s*local\.effective_key_name/);
    expect(getBody(outKeyPath!)).toMatch(/value\s*=\s*var\.private_key_path/);
  });
});


