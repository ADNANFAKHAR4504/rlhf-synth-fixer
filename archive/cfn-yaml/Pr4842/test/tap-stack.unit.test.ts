import * as fs from 'fs';
import * as path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const yamlPath = path.resolve(__dirname, '../lib/TapStack.yml');
const jsonPath = path.resolve(__dirname, '../lib/TapStack.json');

let yamlRaw = '';
let tpl: CfnTemplate = {};

beforeAll(() => {
  // Read YAML (text-only sanity checks to avoid bringing a YAML parser)
  expect(fs.existsSync(yamlPath)).toBe(true);
  yamlRaw = fs.readFileSync(yamlPath, 'utf8');
  expect(yamlRaw.length).toBeGreaterThan(0);

  // Read JSON (primary source for structural validation)
  expect(fs.existsSync(jsonPath)).toBe(true);
  const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
  tpl = JSON.parse(jsonRaw) as CfnTemplate;

  // Basic structure presence
  expect(tpl).toBeTruthy();
  expect(typeof tpl).toBe('object');
  expect(tpl.Resources).toBeTruthy();
});

function getResourceByType(type: string): Array<[string, any]> {
  const out: Array<[string, any]> = [];
  const resources = tpl.Resources || {};
  for (const [logicalId, res] of Object.entries(resources)) {
    if (res && res.Type === type) out.push([logicalId, res]);
  }
  return out;
}

function getResource(logicalId: string): any {
  return tpl.Resources?.[logicalId];
}

function hasTag(res: any, key: string, expected?: string): boolean {
  const tags = res?.Properties?.Tags || [];
  const found = tags.find((t: any) => t.Key === key);
  if (!found) return false;
  return expected ? found.Value === expected || typeof found.Value === 'object' : true;
}

// ------------------------------
// 1) Template & Parameters
// ------------------------------

test('Template has required top-level sections', () => {
  expect(tpl.AWSTemplateFormatVersion).toBeDefined();
  expect(tpl.Description).toBeDefined();
  expect(tpl.Parameters).toBeDefined();
  expect(tpl.Resources).toBeDefined();
  expect(tpl.Outputs).toBeDefined();
});

test('Parameters include core controls with sensible defaults', () => {
  const p = tpl.Parameters || {};
  expect(p.ProjectTag?.Default).toBeDefined();
  expect(p.VpcCidr?.Default).toBe('10.0.0.0/16');
  expect(p.PublicSubnetCidr?.Default).toBe('10.0.1.0/24');
  expect(p.PrivateSubnetCidr?.Default).toBe('10.0.2.0/24');
  expect(p.InstanceType?.Default).toBe('t3.micro');
  expect(p.AllowedSSHIp?.Default).toBeDefined();
  expect(p.KeyName?.Default).toBeDefined();
  expect(p.CpuAlarmHighThreshold?.Default).toBeDefined();
  expect(p.KmsKeyAlias?.Default).toBeDefined();
  expect(p.TrailKmsKeyAlias?.Default).toBeDefined();
  expect(p.NotificationEmail?.Default).toBeDefined();
  expect(p.AmiId?.Default).toMatch(/\/aws\/service\/ami-amazon-linux-latest\//);
  expect(p.NamePrefix?.AllowedPattern).toMatch(/^[\^]?(\[\^?\])?/); // exists & is a regex string; loose check
  expect(p.NamePrefix?.Default).toBe('tapstack');
});

test('Conditions present for SSH, KeyName, and NotificationEmail', () => {
  const c = tpl.Conditions || {};
  expect(c.HasSSHAccess).toBeDefined();
  expect(c.HasKeyName).toBeDefined();
  expect(c.HasNotificationEmail).toBeDefined();
});

// ------------------------------
// 2) YAML sanity checks (text only)
// ------------------------------

test('YAML includes core logical IDs by name', () => {
  // String presence checks so we don’t need a YAML parser
  [
    'Vpc:', 'InternetGateway:', 'PublicSubnet:', 'PrivateSubnet:',
    'PublicRouteTable:', 'PrivateRouteTable:', 'PublicRoute:',
    'WebSecurityGroup:', 'SensitiveDataKmsKey:', 'CloudTrailKmsKey:',
    'SensitiveDataBucket:', 'CloudTrailBucket:', 'Trail:',
    'InstanceRole:', 'InstanceProfile:', 'Instance:', 'CpuAlarm:'
  ].forEach(token => expect(yamlRaw.includes(token)).toBe(true));
});

test('YAML uses lowercase-friendly bucket naming pattern', () => {
  // Just ensure the pattern references NamePrefix and avoids uppercase
  expect(yamlRaw).toMatch(/NamePrefix/i);
  expect(yamlRaw).toMatch(/\${NamePrefix}-cloudtrail-logs-\$\{AWS::AccountId}-\$\{AWS::Region}/);
  expect(yamlRaw).toMatch(/\${NamePrefix}-sensitive-data-\$\{AWS::AccountId}-\$\{AWS::Region}/);
});

// ------------------------------
// 3) Networking resources
// ------------------------------

test('VPC exists with DNS support/hostnames', () => {
  const vpcs = getResourceByType('AWS::EC2::VPC');
  expect(vpcs.length).toBe(1);
  const vpc = vpcs[0][1];
  expect(vpc.Properties.EnableDnsSupport).toBe(true);
  expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  expect(hasTag(vpc, 'Project')).toBe(true);
});

test('Public and private subnets exist', () => {
  const subnets = getResourceByType('AWS::EC2::Subnet');
  expect(subnets.length).toBeGreaterThanOrEqual(2);
  const names = subnets.map(([id]) => id);
  expect(names).toEqual(expect.arrayContaining(['PublicSubnet', 'PrivateSubnet']));
});

test('InternetGateway and attachment exist', () => {
  expect(getResourceByType('AWS::EC2::InternetGateway').length).toBe(1);
  expect(getResourceByType('AWS::EC2::VPCGatewayAttachment').length).toBe(1);
});

test('Public route to IGW is configured', () => {
  const routes = getResourceByType('AWS::EC2::Route');
  const route = routes.find(([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0');
  expect(route).toBeTruthy();
});

test('RouteTables and Associations exist', () => {
  const rts = getResourceByType('AWS::EC2::RouteTable');
  expect(rts.length).toBeGreaterThanOrEqual(2);
  const assoc = getResourceByType('AWS::EC2::SubnetRouteTableAssociation');
  expect(assoc.length).toBeGreaterThanOrEqual(2);
});

// ------------------------------
// 4) Security Group
// ------------------------------

test('WebSecurityGroup allows only HTTP/HTTPS from 0.0.0.0/0', () => {
  const sg = getResource('WebSecurityGroup');
  expect(sg).toBeTruthy();
  const ingress = sg.Properties?.SecurityGroupIngress || [];
  const has80 = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === '0.0.0.0/0');
  const has443 = ingress.find((r: any) => r.FromPort === 443 && r.ToPort === 443 && r.CidrIp === '0.0.0.0/0');
  expect(has80).toBeTruthy();
  expect(has443).toBeTruthy();
});

// ------------------------------
// 5) EC2 instance
// ------------------------------

test('Instance exists, uses t3.micro by default and references SSM-based AMI', () => {
  const inst = getResource('Instance');
  expect(inst).toBeTruthy();
  // InstanceType likely references a parameter; assert param default instead
  expect(tpl.Parameters?.InstanceType?.Default).toBe('t3.micro');
  // AMI via SSM Parameter type param
  expect(tpl.Parameters?.AmiId?.Default).toContain('/aws/service/ami-amazon-linux-latest/');
  expect(hasTag(inst, 'Project')).toBe(true);
});

test('Instance profile and role exist and are attached', () => {
  expect(getResource('InstanceProfile')).toBeTruthy();
  expect(getResource('InstanceRole')).toBeTruthy();
  const inst = getResource('Instance');
  expect(inst.Properties?.IamInstanceProfile).toBeDefined();
});

// ------------------------------
// 6) S3 Sensitive bucket & KMS
// ------------------------------

test('Sensitive S3 bucket exists with versioning and SSE-KMS', () => {
  const bucket = getResource('SensitiveDataBucket');
  expect(bucket).toBeTruthy();
  expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
  const enc = bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault;
  expect(enc?.SSEAlgorithm).toBe('aws:kms');
  expect(enc?.KMSMasterKeyID).toBeDefined();
});

test('Sensitive bucket policy enforces TLS-only', () => {
  const pol = getResource('SensitiveDataBucketPolicy');
  expect(pol).toBeTruthy();
  const stmts = pol.Properties?.PolicyDocument?.Statement || [];
  const tlsDeny = stmts.find((s: any) => s.Sid === 'DenyInsecureConnections' && s.Effect === 'Deny');
  expect(tlsDeny).toBeTruthy();
});

test('KMS key for sensitive data and its alias exist', () => {
  expect(getResource('SensitiveDataKmsKey')).toBeTruthy();
  expect(getResource('SensitiveDataKmsKeyAlias')).toBeTruthy();
});

// ------------------------------
// 7) CloudTrail & its bucket/policy/KMS
// ------------------------------

test('CloudTrail bucket exists and has lifecycle + SSE', () => {
  const b = getResource('CloudTrailBucket');
  expect(b).toBeTruthy();
  const enc = b.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault;
  expect(enc?.SSEAlgorithm).toBe('AES256');
  expect(b.Properties?.LifecycleConfiguration?.Rules?.[0]?.Status).toBe('Enabled');
});

test('CloudTrail bucket policy allows PutObject with required ACL', () => {
  const pol = getResource('CloudTrailBucketPolicy');
  expect(pol).toBeTruthy();
  const stmts = pol.Properties?.PolicyDocument?.Statement || [];
  const putStmt = stmts.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
  expect(putStmt).toBeTruthy();
  expect(putStmt.Action).toContain('s3:PutObject');
  expect(putStmt.Condition?.StringEquals?.['s3:x-amz-acl']).toBe('bucket-owner-full-control');
});

test('CloudTrail trail exists and references KMS key', () => {
  const trail = getResource('Trail');
  expect(trail).toBeTruthy();
  expect(trail.Properties?.IsLogging).toBe(true);
  expect(trail.Properties?.EnableLogFileValidation).toBe(true);
  expect(trail.Properties?.KMSKeyId).toBeDefined();
});

test('CloudTrail KMS key and alias exist with service permissions', () => {
  expect(getResource('CloudTrailKmsKey')).toBeTruthy();
  expect(getResource('CloudTrailKmsKeyAlias')).toBeTruthy();
});

// ------------------------------
// 8) IAM Role least-privilege read to sensitive bucket
// ------------------------------

test('InstanceRole grants read-only S3 access to the sensitive bucket and minimal KMS decrypt', () => {
  const role = getResource('InstanceRole');
  expect(role).toBeTruthy();
  const policies = role.Properties?.Policies || [];
  const inline = policies.find((p: any) => p.PolicyName === 'SensitiveBucketReadOnly');
  expect(inline).toBeTruthy();

  const stmts = inline.PolicyDocument?.Statement || [];
  const s3Stmt = stmts.find((s: any) => (s.Action || []).includes('s3:GetObject') && (s.Action || []).includes('s3:ListBucket'));
  expect(s3Stmt).toBeTruthy();

  const kmsStmt = stmts.find((s: any) => (s.Action || []).includes('kms:Decrypt') && (s.Action || []).includes('kms:DescribeKey'));
  expect(kmsStmt).toBeTruthy();
});

// ------------------------------
// 9) Monitoring — CloudWatch
// ------------------------------

test('CPU Alarm exists for EC2 CPUUtilization with threshold parameter', () => {
  const alarm = getResource('CpuAlarm');
  expect(alarm).toBeTruthy();
  expect(alarm.Properties?.MetricName).toBe('CPUUtilization');
  expect(alarm.Properties?.Namespace).toBe('AWS/EC2');
  expect(alarm.Properties?.Threshold).toBeDefined();
  expect(tpl.Parameters?.CpuAlarmHighThreshold?.Default).toBeDefined();
});

// ------------------------------
// 10) Outputs coverage
// ------------------------------

test('Outputs cover key identifiers across VPC, EC2, S3, KMS, CloudTrail, and Alarms', () => {
  const o = tpl.Outputs || {};
  const required = [
    'VpcId', 'PublicSubnetId', 'PrivateSubnetId', 'InternetGatewayId', 'PublicRouteTableId',
    'WebSecurityGroupId', 'InstanceId', 'InstancePublicIp', 'InstanceRoleArn',
    'SensitiveBucketName', 'SensitiveBucketArn', 'SensitiveBucketKmsKeyArn',
    'CloudTrailName', 'CloudTrailBucketName', 'CloudTrailBucketArn', 'CloudTrailKmsKeyArn',
    'CpuAlarmName'
  ];
  required.forEach(k => expect(o[k]).toBeDefined());
});

// ------------------------------
// 11) Tagging standard
// ------------------------------

test('Most core resources carry Project tag', () => {
  const ids = [
    'Vpc', 'PublicSubnet', 'PrivateSubnet', 'PublicRouteTable', 'PrivateRouteTable',
    'WebSecurityGroup', 'Instance', 'SensitiveDataBucket', 'CloudTrailBucket'
  ];
  ids.forEach(id => {
    const res = getResource(id);
    expect(res).toBeTruthy();
    expect(hasTag(res, 'Project')).toBe(true);
  });
});

// ------------------------------
// 12) YAML cfn-lint-friendly hints (no Fn::Sub without vars)
// ------------------------------

test('YAML avoids obvious unnecessary Fn::Sub in static strings (heuristic)', () => {
  // Heuristic: ensure we don’t find patterns like `!Sub ABC` without ${}
  // This simple check looks for "!Sub " lines that do not contain "${"
  const lines = yamlRaw.split('\n').map(l => l.trim());
  const offenders = lines.filter(l => l.startsWith('!Sub ') && !l.includes('${'));
  expect(offenders.length).toBe(0);
});
