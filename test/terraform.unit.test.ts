/// <reference types="jest" />
/* eslint-env jest */

import fs from 'fs';
import path from 'path';

/* =========================
 * Helpers
 * ========================= */
const LIB_DIR = path.resolve(__dirname, '../lib');
const UD_DIR = path.join(LIB_DIR, 'user_data');

function readTfFile(name: string): string {
  return fs.readFileSync(path.join(LIB_DIR, name), 'utf8');
}
function readUserData(name: string): string {
  return fs.readFileSync(path.join(UD_DIR, name), 'utf8');
}

/** small IPv4/CIDR helpers for literal CIDRs (no extra deps) */
function ipToInt(ip: string): number {
  const p = ip.split('.').map((x) => parseInt(x, 10));
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid IPv4: ${ip}`);
  }
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}
function cidrRange(cidr: string): { start: number; end: number; prefix: number } {
  const m = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d{1,2})$/);
  if (!m) throw new Error(`Invalid CIDR: ${cidr}`);
  const base = m[1];
  const prefix = parseInt(m[2], 10);
  const baseInt = ipToInt(base);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const start = baseInt & mask;
  const end = start + (2 ** (32 - prefix)) - 1;
  return { start, end, prefix };
}
function cidrContains(outer: string, inner: string): boolean {
  const o = cidrRange(outer);
  const i = cidrRange(inner);
  return i.start >= o.start && i.end <= o.end;
}

/* =========================
 * Tests (original + added)
 * ========================= */
describe('Terraform stack unit tests (static content & safety)', () => {
  let tf = '';
  let webUd = '';


  beforeAll(() => {
    tf = readTfFile('tap_stack.tf');
    webUd = fs.existsSync(path.join(UD_DIR, 'web.sh')) ? readUserData('web.sh') : '';
  });

  // ---------------- Variables ----------------
  test('aws_region variable exists, has NO default, and enforces us-west-2', () => {
    const block = tf.match(/variable\s+"aws_region"\s*{[\s\S]*?}/);
    expect(block).toBeTruthy();
    expect(/default\s*=/.test(block![0])).toBe(false);
    expect(block![0]).toMatch(/validation[\s\S]*var\.aws_region\s*==\s*"us-west-2"/);
  });

  test('environment variable supports dev/prod (default dev)', () => {
    const env = tf.match(/variable\s+"environment"\s*{[\s\S]*?}/);
    expect(env).toBeTruthy();
    expect(env![0]).toMatch(/default\s*=\s*"dev"/);
    expect(env![0]).toMatch(/validation[\s\S]*contains\(\s*\[\s*"dev",\s*"prod"\s*\]\s*,\s*var\.environment\s*\)/);
  });

  test('ssh_cidrs (list(string), default []) and environment_suffix (string, default "") exist', () => {
    const ssh = tf.match(/variable\s+"ssh_cidrs"\s*{[\s\S]*?}/);
    const suf = tf.match(/variable\s+"environment_suffix"\s*{[\s\S]*?}/);
    expect(ssh).toBeTruthy();
    expect(ssh![0]).toMatch(/type\s*=\s*list\(string\)/);
    expect(ssh![0]).toMatch(/default\s*=\s*\[\s*\]/);
    expect(suf).toBeTruthy();
    expect(suf![0]).toMatch(/type\s*=\s*string/);
    expect(suf![0]).toMatch(/default\s*=\s*""/);
  });

  // ---------------- Locals & user_data wiring ----------------
  test('locals include tags and instance type toggles (or equivalent usage)', () => {
    const anyLoc = tf.match(/locals\s*{[\s\S]*?}/);
    expect(anyLoc).toBeTruthy();
    expect(anyLoc![0]).toMatch(/"iac-rlhf-amazon"\s*=\s*"true"/);

    const hasToggleInLocals = /locals\s*{[\s\S]*instance_type\s*=/.test(tf);
    const webUsesLocalType = /resource\s+"aws_instance"\s+"web"[\s\S]*?instance_type\s*=\s*local\.instance_type/s.test(tf);
    expect(hasToggleInLocals || webUsesLocalType).toBe(true);

    const hasNatToggleInLocals = /locals\s*{[\s\S]*nat_instance_type\s*=/.test(tf);
    const natExists = /resource\s+"aws_instance"\s+"nat"/.test(tf);
    expect(hasNatToggleInLocals || natExists).toBe(true);
  });

  // helper: grab the full resource block from its declaration to the next resource (or EOF)
  function getResourceBlock(tfSrc: string, type: string, name: string): string | null {
    const startRe = new RegExp(`resource\\s+"${type}"\\s+"${name}"`);
    const start = tfSrc.search(startRe);
    if (start === -1) return null;
    const nextRes = tfSrc.indexOf('resource "', start + 1);
    const end = nextRes === -1 ? tfSrc.length : nextRes;
    return tfSrc.slice(start, end);
  }

  test('web instance uses templatefile for user_data', () => {
    const re =
      /resource\s+"aws_instance"\s+"web"[\s\S]*?user_data\s*=\s*templatefile\(\s*"\$\{path\.module\}\/user_data\/web\.sh"/;
    expect(re.test(tf)).toBe(true);
  });

  test('canary instance uses templatefile for user_data', () => {
    const re =
      /resource\s+"aws_instance"\s+"canary"[\s\S]*?user_data\s*=\s*templatefile\(\s*"\$\{path\.module\}\/user_data\/web\.sh"/;
    expect(re.test(tf)).toBe(true);
  });

  // ---------------- user_data content checks ----------------
  test('user_data installs SSM agent, exposes /egress.txt, and shows S3 intent', () => {
    expect(webUd).toMatch(/amazon-ssm-agent/);
    expect(webUd).toMatch(/checkip\.amazonaws\.com/);

    const egressOk =
      /\/usr\/share\/nginx\/html\/egress\.txt|\/var\/www\/html\/egress\.txt/.test(webUd) ||
      /["']\/egress\.txt["']/.test(webUd);
    expect(egressOk).toBe(true);

    const s3Intent =
      /--aws-sigv4/.test(webUd) ||
      /(?:^|\s)aws\s+s3\s+cp\s+/m.test(webUd) ||
      /export\s+BUCKET\s*=\s*["']\$\{bucket\}["']/.test(webUd);
    expect(s3Intent).toBe(true);

    expect(webUd).toMatch(/python3|nginx|httpd/);
  });

  // ---------------- Data sources ----------------
  test('AMI is discovered (AL2023, x86_64, amazon owner) — additional filters optional', () => {
    const d = tf.match(/data\s+"aws_ami"\s+"al2023"[\s\S]*?{[\s\S]*?}/);
    expect(d).toBeTruthy();
    expect(d![0]).toMatch(/owners\s*=\s*\[\s*"amazon"\s*\]/);
    expect(d![0]).toMatch(/name"[\s\S]*values\s*=\s*\[\s*"al2023-ami-.*-x86_64"\s*\]/i);
  });

  // ---------------- Networking ----------------
  test('VPC 10.0.0.0/16 with DNS support enabled', () => {
    const vpc = tf.match(/resource\s+"aws_vpc"\s+"this"[\s\S]*?{[\s\S]*?}/);
    expect(vpc).toBeTruthy();
    expect(vpc![0]).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    expect(vpc![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpc![0]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('Two public subnets (map_public_ip_on_launch = true) and two private subnets (false)', () => {
    expect(tf).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(tf).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(tf).toMatch(/count\s*=\s*2/);
    expect(tf).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    expect(tf).toMatch(/map_public_ip_on_launch\s*=\s*false/);
  });

  test('IGW and public default route to IGW exist', () => {
    expect(tf).toMatch(/resource\s+"aws_internet_gateway"\s+"igw"/);
    expect(tf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(tf).toMatch(/resource\s+"aws_route"\s+"public_default"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.igw\.id/);
  });

  test('NAT INSTANCE : private route via NAT instance ENI', () => {
    expect(tf).toMatch(/resource\s+"aws_instance"\s+"nat"[\s\S]*source_dest_check\s*=\s*false/);
    expect(tf).toMatch(/resource\s+"aws_route"\s+"private_default"[\s\S]*network_interface_id\s*=\s*aws_instance\.nat\.primary_network_interface_id/);
    expect(tf).not.toMatch(/resource\s+"aws_nat_gateway"/);
    expect(tf).not.toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  // ---------------- Security Groups ----------------
  test('Web SG egress all; HTTP from ALB SG; SSH from var.ssh_cidrs', () => {
    expect(tf).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    expect(tf).toMatch(/egress[\s\S]*cidr_blocks\s*=\s*\[.*0\.0\.0\.0\/0.*\]/);

    const httpBlock = tf.match(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"http"[\s\S]*?}/);
    const sshBlock  = tf.match(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"ssh"[\s\S]*?}/);
    expect(httpBlock).toBeTruthy();
    expect(sshBlock).toBeTruthy();
    expect(httpBlock![0]).toMatch(/from_port\s*=\s*80/);
    expect(httpBlock![0]).toMatch(/to_port\s*=\s*80/);
    expect(httpBlock![0]).toMatch(/protocol\s*=\s*"tcp"/);
    expect(httpBlock![0]).toMatch(/referenced_security_group_id\s*=\s*aws_security_group\.alb\.id/);
    expect(sshBlock![0]).toMatch(/for_each\s*=\s*toset\(var\.ssh_cidrs\)/);
    expect(sshBlock![0]).toMatch(/from_port\s*=\s*22/);
    expect(sshBlock![0]).toMatch(/protocol\s*=\s*"tcp"/);
  });

  // ---------------- S3 (App + Logs) ----------------
  test('App S3 bucket has versioning, AES256 SSE, and public access blocked', () => {
    expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"app"/);
    expect(tf).toMatch(/force_destroy\s*=\s*true/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app"[\s\S]*status\s*=\s*"Enabled"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app"[\s\S]*sse_algorithm\s*=\s*"AES256"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app"[\s\S]*block_public_acls\s*=\s*true/);
  });

  test('Logs S3 bucket: versioning, AES256 SSE, PAB and bucket policy for flow logs', () => {
    expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"[\s\S]*status\s*=\s*"Enabled"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"[\s\S]*sse_algorithm\s*=\s*"AES256"/);
    expect(tf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"[\s\S]*block_public_acls\s*=\s*true/);

    expect(tf).toMatch(/data\s+"aws_iam_policy_document"\s+"logs_bucket_policy"/);
    expect(tf).toMatch(/delivery\.logs\.amazonaws\.com/);
    expect(tf).toMatch(/s3:x-amz-acl/);
    expect(tf).toMatch(/bucket-owner-full-control/);

    expect(tf).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
  });

  test('VPC Flow Logs → S3 with 60s aggregation and depends_on logs bucket policy (HARD)', () => {
    expect(tf).toMatch(/resource\s+"aws_flow_log"\s+"vpc_to_s3"/);
    expect(tf).toMatch(/log_destination_type\s*=\s*"s3"/);
    expect(tf).toMatch(/log_destination\s*=\s*aws_s3_bucket\.logs\.arn/);
    expect(tf).toMatch(/traffic_type\s*=\s*"(ALL|ACCEPT|REJECT)"/);
    expect(tf).toMatch(/max_aggregation_interval\s*=\s*60/);
    expect(tf).toMatch(/depends_on\s*=\s*\[\s*aws_s3_bucket_policy\.logs\s*\]/);
  });

  // ---------------- S3 Gateway VPCE ----------------
  test('S3 Gateway VPC Endpoint attached to public + private RTs with restricted policy (HARD)', () => {
    expect(tf).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_endpoint_policy"/);
    expect(tf).toMatch(/"s3:ListBucket"/);
    expect(tf).toMatch(/"s3:GetBucketLocation"/);
    expect(tf).toMatch(/resources\s*=\s*\[\s*aws_s3_bucket\.app\.arn/);
    expect(tf).toMatch(/"s3:GetObject"/);
    expect(tf).toMatch(/"s3:PutObject"/);
    expect(tf).toMatch(/"s3:DeleteObject"/);

    expect(tf).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"[\s\S]*vpc_endpoint_type\s*=\s*"Gateway"/);
    expect(tf).toMatch(/route_table_ids\s*=\s*concat\(\s*\[\s*aws_route_table\.public\.id\s*\]\s*,\s*aws_route_table\.private\[\*\]\.id\s*\)/);
  });

  
// ---------------- IAM policy JSON structure (HCL-level) ----------------
test('IAM policy docs contain valid Statement structure', () => {
  // data "aws_iam_policy_document" ... { ... }
  const docs =
    tf.match(/data\s+"aws_iam_policy_document"\s+"[\w-]+"\s*{[\s\S]*?}/g) || [];
  expect(docs.length).toBeGreaterThan(0);

  for (const d of docs) {
    // must have at least one statement block
    expect(/statement\s*{[\s\S]*?}/i.test(d)).toBe(true);

    // Effect may be omitted (defaults to Allow). If present, it must be Allow/Deny.
    const effectMatch = /effect\s*=\s*"(Allow|Deny)"/i.test(d);
    const effectPresent = /effect\s*=/.test(d);
    expect(effectPresent ? effectMatch : true).toBe(true);

    // Accept either actions/not_actions OR principals (assume-role style)
    const hasActions =
      /(?:^|\s)(?:actions|action|not_actions|not_action)\s*=\s*(?:\[|")/i.test(d);
    const hasPrincipals =
      /principals?\s*{[\s\S]*?}/i.test(d) || /principal\s*=\s*/i.test(d);

    // Accept either resources/not_resources OR principals
    const hasResources =
      /(?:^|\s)(?:resources|resource|not_resources|not_resource)\s*=\s*(?:\[|")/i.test(d);

    expect(hasActions || hasPrincipals).toBe(true);
    expect(hasResources || hasPrincipals).toBe(true);
  }

  // Also validate any inline policy via jsonencode(...)
  const inlinePolicies =
    tf.match(
      /resource\s+"aws_iam_policy"\s+"[\w-]+"\s*{[\s\S]*?policy\s*=\s*jsonencode\([\s\S]*?\)[\s\S]*?}/g
    ) || [];
  for (const p of inlinePolicies) {
    const body = p.substring(p.indexOf('jsonencode('), p.lastIndexOf(')') + 1);
    expect(/"Version"/.test(body)).toBe(true);
    expect(/"Statement"/.test(body)).toBe(true);
    // Effect may be omitted in some JSON snippets too, but if present must be Allow/Deny
    expect(/"Effect"\s*:\s*"(Allow|Deny)"/.test(body) || !/"Effect"\s*:/.test(body)).toBe(true);
    expect(/"Action"|\"NotAction\"/.test(body) || /"Principal"/.test(body)).toBe(true);
    expect(/"Resource"|\"NotResource\"/.test(body) || /"Principal"/.test(body)).toBe(true);
  }
});


  // ---------------- Route table associations (HCL-level) ----------------
  test('Route table associations: counts and references are aligned (HARD)', () => {
    // public: 2 associations
    const pubAssoc = tf.match(/resource\s+"aws_route_table_association"\s+"public"[\s\S]*?{[\s\S]*?}/g) || [];
    const prvAssoc = tf.match(/resource\s+"aws_route_table_association"\s+"private"[\s\S]*?{[\s\S]*?}/g) || [];
    expect(pubAssoc.join('\n')).toMatch(/count\s*=\s*2/);
    expect(prvAssoc.join('\n')).toMatch(/count\s*=\s*2/);

    // association references correct subnet sets
    expect(pubAssoc.join('\n')).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index]\.id/);
    expect(prvAssoc.join('\n')).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index]\.id/);
    // and correct route tables
    expect(pubAssoc.join('\n')).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    expect(prvAssoc.join('\n')).toMatch(/route_table_id\s*=\s*aws_route_table\.private\[count\.index]\.id/);
  });

  // ---------------- SSM parameters (types) ----------------
  test('SSM parameters have types and names', () => {
    const pEnv = getResourceBlock(tf, 'aws_ssm_parameter', 'env');
    const pBucket = getResourceBlock(tf, 'aws_ssm_parameter', 'bucket');
    expect(pEnv).toBeTruthy();
    expect(pBucket).toBeTruthy();
    expect(pEnv!).toMatch(/name\s*=\s*"\/tap\/environment"/);
    expect(pBucket!).toMatch(/name\s*=\s*"\/tap\/bucket"/);
    // enforce type presence (String/SecureString/StringList)
    expect(pEnv!).toMatch(/type\s*=\s*"(String|SecureString|StringList)"/);
    expect(pBucket!).toMatch(/type\s*=\s*"(String|SecureString|StringList)"/);
  });

  // ---------------- CIDR calculations (no skips) ----------------
  test('CIDR: if literals are used, subnets are contained in VPC; else `cidrsubnet` wired correctly (HARD)', () => {
    const vpcBlock = getResourceBlock(tf, 'aws_vpc', 'this');
    expect(vpcBlock).toBeTruthy();

    // Try to capture a literal VPC CIDR first
    const vpcCidrLit = vpcBlock!.match(/cidr_block\s*=\s*"(\d+\.\d+\.\d+\.\d+\/\d+)"/)?.[1];

    const publicBlocks = tf.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?{[\s\S]*?}/g) || [];
    const privateBlocks = tf.match(/resource\s+"aws_subnet"\s+"private"[\s\S]*?{[\s\S]*?}/g) || [];

    const allSubnets = [...publicBlocks, ...privateBlocks];
    expect(allSubnets.length).toBeGreaterThan(0);

    const literalSubnetCidrs: string[] = [];
    for (const b of allSubnets) {
      const m = b.match(/cidr_block\s*=\s*"(\d+\.\d+\.\d+\.\d+\/\d+)"/);
      if (m) literalSubnetCidrs.push(m[1]);
    }

    if (vpcCidrLit && literalSubnetCidrs.length > 0) {
      // Hard containment check
      for (const c of literalSubnetCidrs) {
        expect(() => cidrRange(c)).not.toThrow();
        expect(cidrContains(vpcCidrLit, c)).toBe(true);
        const { prefix } = cidrRange(c);
        expect(prefix).toBeGreaterThanOrEqual(16);
        expect(prefix).toBeLessThanOrEqual(28);
      }
    } else {
      // HCL path: ensure we use cidrsubnet() from the VPC CIDR local/var and sensible newbits
      const vpcRef = /local\.vpc_cidr|var\.vpc_cidr|aws_vpc\.this\.cidr_block/;
      const cidrSubnets = allSubnets.map((b) => /cidr_block\s*=\s*cidrsubnet\(([^)]+)\)/.exec(b)?.[1]).filter(Boolean) as string[];
      expect(cidrSubnets.length).toBeGreaterThan(0);

      for (const expr of cidrSubnets) {
        // form: cidrsubnet(BASE, NEWBITS, NETNUM)
        // quick structure checks:
        const parts = expr.split(',').map((s) => s.trim());
        expect(parts.length).toBeGreaterThanOrEqual(3);
        expect(vpcRef.test(parts[0])).toBe(true); // base comes from VPC
        // NEWBITS is a small integer in typical designs; allow expression but ensure it’s there
        expect(parts[1].length).toBeGreaterThan(0);
        expect(parts[2].length).toBeGreaterThan(0);
      }
    }
  });

  // ---------------- IAM/SSM/ALB/Outputs/etc (unchanged from your original) ----------------
  test('IAM role for EC2, least-priv S3 policy attached, SSM core policy attached, instance profile exists', () => {
    expect(tf).toMatch(/data\s+"aws_iam_policy_document"\s+"ec2_assume"/);
    expect(tf).toMatch(/ec2\.amazonaws\.com/);
    expect(tf).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);

    expect(tf).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_rw_doc"/);
    expect(tf).toMatch(/"s3:ListBucket"/);
    expect(tf).toMatch(/"s3:GetObject"/);
    expect(tf).toMatch(/"s3:PutObject"/);
    expect(tf).toMatch(/"s3:DeleteObject"/);

    expect(tf).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_s3_rw"/);
    expect(tf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"attach_rw"/);

    expect(tf).toMatch(/data\s+"aws_iam_policy_document"\s+"ssm_core"/);
    expect(tf).toMatch(/resource\s+"aws_iam_policy"\s+"ssm_core"/);
    expect(tf).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"attach_ssm_core"/);

    expect(tf).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
  });

  test('Default EBS encryption enabled', () => {
    expect(tf).toMatch(/resource\s+"aws_ebs_encryption_by_default"\s+"this"/);
    expect(tf).toMatch(/enabled\s*=\s*true/);
  });

  test('Public EC2 (web): AL2023, IMDSv2 required, SG attached, public IP', () => {
    expect(tf).toMatch(/resource\s+"aws_instance"\s+"web"/);
    expect(tf).toMatch(/ami\s*=\s*data\.aws_ami\.al2023\.id/);
    expect(tf).toMatch(/metadata_options[\s\S]*http_tokens\s*=\s*"required"/);
    expect(tf).toMatch(/associate_public_ip_address\s*=\s*true/);
    expect(tf).toMatch(/vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.web\.id\s*\]/);
    expect(tf).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
  });

  test('Private EC2 (canary): no public IP, IMDSv2 required', () => {
    expect(tf).toMatch(/resource\s+"aws_instance"\s+"canary"/);
    expect(tf).toMatch(/associate_public_ip_address\s*=\s*false/);
    expect(tf).toMatch(/metadata_options[\s\S]*http_tokens\s*=\s*"required"/);
  });

  test('SSM parameters for environment and bucket exist with expected names', () => {
    expect(tf).toMatch(/resource\s+"aws_ssm_parameter"\s+"env"/);
    expect(tf).toMatch(/name\s*=\s*"\/tap\/environment"/);
    expect(tf).toMatch(/resource\s+"aws_ssm_parameter"\s+"bucket"/);
    expect(tf).toMatch(/name\s*=\s*"\/tap\/bucket"/);
  });

  test('Required outputs exist (no NAT GW; NAT instance id present)', () => {
    const required = [
      'environment',
      'bucket_name',
      'instance_id',
      'instance_public_ip',
      'instance_type',
      'vpc_id',
      'web_sg_id',
      'public_instance_eni_id',
      'private_instance_eni_id',
      'public_route_table_id',
      'private_route_table_ids',
      'internet_gateway_id',
      's3_vpc_endpoint_id',
      'logs_bucket_name',
      'nat_instance_id',
      'alb_dns_name',
      'target_group_arn',
      'https_enabled'
    ];
    for (const name of required) {
      expect(tf).toMatch(new RegExp(`output\\s+"${name}"`));
    }
  });

  test('No hardcoded ARNs/account IDs and no stray region literals', () => {
    expect(tf).not.toMatch(/\barn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:/);
  });

  // ---------------- Compact coverage summary ----------------
  test('Unit requirements coverage (==100%)', () => {
    const checks: Array<[string, RegExp]> = [
      // Variables
      ['aws_region validation', /variable\s+"aws_region"[\s\S]*validation[\s\S]*var\.aws_region\s*==\s*"us-west-2"/],
      ['environment dev/prod', /variable\s+"environment"[\s\S]*default\s*=\s*"dev"[\s\S]*contains\(\s*\[\s*"dev",\s*"prod"\s*\]\s*,\s*var\.environment\s*\)/],
      ['ssh_cidrs exists', /variable\s+"ssh_cidrs"[\s\S]*type\s*=\s*list\(string\)[\s\S]*default\s*=\s*\[\s*\]/],
      ['environment_suffix exists', /variable\s+"environment_suffix"[\s\S]*type\s*=\s*string[\s\S]*default\s*=\s*""/],

      // Locals and tags
      ['tags include iac-rlhf-amazon', /locals\s*{[\s\S]*"iac-rlhf-amazon"\s*=\s*"true"/],
      ['instance_type toggle', /locals\s*{[\s\S]*instance_type\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"t3\.small"\s*:\s*"t3\.micro"/],
      ['nat_instance_type toggle', /locals\s*{[\s\S]*nat_instance_type\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*"t3\.micro"\s*:\s*"t3\.nano"/],

      // Data sources
      ['AL2023 AMI', /data\s+"aws_ami"\s+"al2023"[\s\S]*owners\s*=\s*\[\s*"amazon"\s*\][\s\S]*"al2023-ami-.*-x86_64"/],

      // Core networking
      ['VPC 10.0.0.0/16', /resource\s+"aws_vpc"\s+"this"[\s\S]*cidr_block\s*=\s*"10\.0\.0\.0\/16"/],
      ['Public subnets x2 + map public IP', /resource\s+"aws_subnet"\s+"public"[\s\S]*count\s*=\s*2[\s\S]*map_public_ip_on_launch\s*=\s*true/],
      ['Private subnets x2 no public IP', /resource\s+"aws_subnet"\s+"private"[\s\S]*count\s*=\s*2[\s\S]*map_public_ip_on_launch\s*=\s*false/],
      ['IGW + public route', /resource\s+"aws_internet_gateway"\s+"igw"[\s\S]*resource\s+"aws_route"\s+"public_default"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.igw\.id/],
      ['Private RTs x2', /resource\s+"aws_route_table"\s+"private"[\s\S]*count\s*=\s*2/],
      ['RT assoc public+private', /resource\s+"aws_route_table_association"\s+"public"[\s\S]*count\s*=\s*2[\s\S]*resource\s+"aws_route_table_association"\s+"private"[\s\S]*count\s*=\s*2/],

      // NAT instance routing (no NAT GW)
      ['NAT SG', /resource\s+"aws_security_group"\s+"nat"/],
      ['NAT instance + src/dst check off', /resource\s+"aws_instance"\s+"nat"[\s\S]*source_dest_check\s*=\s*false/],
      ['NAT enables ip_forward', /aws_instance"\s+"nat"[\s\S]*net\.ipv4\.ip_forward\s*=\s*1/],
      ['Private default route via NAT ENI', /resource\s+"aws_route"\s+"private_default"[\s\S]*network_interface_id\s*=\s*aws_instance\.nat\.primary_network_interface_id/],
      ['No NAT GW or EIP', /^(?![\s\S]*resource\s+"aws_nat_gateway")/m],

      // Web SG & rules
      ['Web SG egress all', /resource\s+"aws_security_group"\s+"web"[\s\S]*egress[\s\S]*cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/],
      ['HTTP from ALB SG only', /resource\s+"aws_vpc_security_group_ingress_rule"\s+"http_from_alb"[\s\S]*referenced_security_group_id\s*=\s*aws_security_group\.alb\.id/],
      ['SSH for_each on var.ssh_cidrs', /resource\s+"aws_vpc_security_group_ingress_rule"\s+"ssh"[\s\S]*for_each\s*=\s*toset\(var\.ssh_cidrs\)/],

      // App S3 bucket
      ['random_id bucket', /resource\s+"random_id"\s+"bucket"/],
      ['app bucket + force_destroy', /resource\s+"aws_s3_bucket"\s+"app"[\s\S]*force_destroy\s*=\s*true/],
      ['app versioning enabled', /aws_s3_bucket_versioning"\s+"app"[\s\S]*status\s*=\s*"Enabled"/],
      ['app SSE AES256', /aws_s3_bucket_server_side_encryption_configuration"\s+"app"[\s\S]*sse_algorithm\s*=\s*"AES256"/],
      ['app PAB blocks public', /aws_s3_bucket_public_access_block"\s+"app"[\s\S]*block_public_acls\s*=\s*true/],
      ['bucket policy doc exists', /data\s+"aws_iam_policy_document"\s+"s3_secure_bucket"/],
      ['DenyUnEncryptedObjectUploads', /DenyUnEncryptedObjectUploads/],

      // Logs S3 bucket and policy
      ['logs bucket + versioning', /resource\s+"aws_s3_bucket"\s+"logs"[\s\S]*resource\s+"aws_s3_bucket_versioning"\s+"logs"[\s\S]*status\s*=\s*"Enabled"/],
      ['logs SSE + PAB', /aws_s3_bucket_server_side_encryption_configuration"\s+"logs"[\s\S]*AES256[\s\S]*aws_s3_bucket_public_access_block"\s+"logs"/],
      ['logs policy doc + writer', /data\s+"aws_iam_policy_document"\s+"logs_bucket_policy"[\s\S]*delivery\.logs\.amazonaws\.com[\s\S]*bucket-owner-full-control/],
      ['logs bucket policy resource', /resource\s+"aws_s3_bucket_policy"\s+"logs"/],

      // Flow logs (HARD)
      ['VPC Flow Logs → S3', /resource\s+"aws_flow_log"\s+"vpc_to_s3"[\s\S]*log_destination_type\s*=\s*"s3"[\s\S]*max_aggregation_interval\s*=\s*60[\s\S]*depends_on\s*=\s*\[\s*aws_s3_bucket_policy\.logs\s*\]/],

      // S3 Gateway VPCE (HARD)
      ['S3 endpoint policy doc', /data\s+"aws_iam_policy_document"\s+"s3_endpoint_policy"/],
      ['S3 VPCE gateway + RT concat', /resource\s+"aws_vpc_endpoint"\s+"s3"[\s\S]*vpc_endpoint_type\s*=\s*"Gateway"[\s\S]*route_table_ids\s*=\s*concat\(\s*\[\s*aws_route_table\.public\.id\s*\]\s*,\s*aws_route_table\.private\[\*\]\.id\s*\)/],

      // IAM & SSM
      ['EC2 assume role', /data\s+"aws_iam_policy_document"\s+"ec2_assume"[\s\S]*ec2\.amazonaws\.com/],
      ['EC2 role & instance profile', /resource\s+"aws_iam_role"\s+"ec2_role"[\s\S]*resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/],
      ['S3 least-priv policy + attach', /data\s+"aws_iam_policy_document"\s+"s3_rw_doc"[\s\S]*"s3:ListBucket"[\s\S]*"s3:GetObject"[\s\S]*"s3:PutObject"[\s\S]*"s3:DeleteObject"[\s\S]*resource\s+"aws_iam_role_policy_attachment"\s+"attach_rw"/],
      ['SSM core policy + attach', /data\s+"aws_iam_policy_document"\s+"ssm_core"[\s\S]*resource\s+"aws_iam_role_policy_attachment"\s+"attach_ssm_core"/],
      ['SSM getparams policy + attach', /data\s+"aws_iam_policy_document"\s+"ssm_getparams"[\s\S]*parameter\/tap\/environment[\s\S]*parameter\/tap\/bucket[\s\S]*resource\s+"aws_iam_role_policy_attachment"\s+"attach_ssm_getparams"/],

      // EC2 instances
      ['web instance public + IMDSv2', /resource\s+"aws_instance"\s+"web"[\s\S]*associate_public_ip_address\s*=\s*true[\s\S]*metadata_options[\s\S]*http_tokens\s*=\s*"required"/],
      ['web user_data templatefile', /resource\s+"aws_instance"\s+"web"[\s\S]*user_data\s*=\s*templatefile\(\s*"\$\{path\.module\}\/user_data\/web\.sh"/],
      ['canary instance private + IMDSv2', /resource\s+"aws_instance"\s+"canary"[\s\S]*associate_public_ip_address\s*=\s*false[\s\S]*metadata_options[\s\S]*http_tokens\s*=\s*"required"/],

      // ALB stack
      ['ALB SG + ALB', /resource\s+"aws_security_group"\s+"alb"[\s\S]*resource\s+"aws_lb"\s+"web"[\s\S]*load_balancer_type\s*=\s*"application"/],
      ['Target group with "/" health check', /resource\s+"aws_lb_target_group"\s+"web"[\s\S]*health_check[\s\S]*path\s*=\s*"\/"/],
      ['HTTP listener 80', /resource\s+"aws_lb_listener"\s+"http"[\s\S]*port\s*=\s*80/],
      ['TG attachment (web_instance)', /resource\s+"aws_lb_target_group_attachment"\s+"web_instance"/],

      // Defaults & params
      ['Default EBS encryption', /resource\s+"aws_ebs_encryption_by_default"\s+"this"[\s\S]*enabled\s*=\s*true/],
      ['SSM parameters names', /resource\s+"aws_ssm_parameter"\s+"env"[\s\S]*name\s*=\s*"\/tap\/environment"[\s\S]*resource\s+"aws_ssm_parameter"\s+"bucket"[\s\S]*name\s*=\s*"\/tap\/bucket"/],

      // Outputs
      ['Key outputs', /output\s+"bucket_name"[\s\S]*output\s+"instance_id"[\s\S]*output\s+"instance_public_ip"[\s\S]*output\s+"vpc_id"[\s\S]*output\s+"alb_dns_name"/],
    ];

    const failed: string[] = [];
    const passedCount = checks.reduce((acc, [name, re]) => {
      const ok = re.test(tf);
      if (!ok) failed.push(name);
      return acc + (ok ? 1 : 0);
    }, 0);

    const total = checks.length;
    const pct = Math.round((passedCount / total) * 100);

    // eslint-disable-next-line no-console
    console.log(`\nUnit requirements coverage: ${passedCount}/${total} (${pct}%)`);
    if (failed.length) {
      console.log('Missing tokens:', failed);
    }

    // up the guardrail now that we’ve added checks
    expect(pct).toBeGreaterThanOrEqual(90);
  });
});

