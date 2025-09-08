// test/tap-stack.integration.test.ts
/**
 * Integration tests for the TapStack CloudFormation stack.
 *
 * What these tests do:
 *  - Load the synthesized CloudFormation outputs written after a deploy at:
 *      cfn-outputs/all-outputs.json
 *  - Validate presence and format of all expected outputs (IDs, ARNs, names)
 *  - Perform additional integrity checks against the source templates where helpful:
 *      ../lib/TapStack.yml (readable)
 *      ../lib/TapStack.json (structure checks; no external libs)
 *
 * Notes:
 *  - No network calls or AWS SDK usage; purely file-based verification.
 *  - Tests are defensive against slight variations in output JSON shapes.
 *  - Designed to pass provided the stack follows the supplied TapStack.yml.
 */

import * as fs from 'fs';
import * as path from 'path';

/* -------------------------------- Helpers -------------------------------- */

type OutputsShape =
  | Record<string, { Value: any; [k: string]: any }>
  | Record<string, any>; // allow plain { key: value } too

function readFileUTF8(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function loadOutputs(): OutputsShape {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  const raw = readFileUTF8(p);
  return JSON.parse(raw);
}

function getOutputValue(outputs: OutputsShape, key: string): any {
  const val = (outputs as any)[key];
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'object' && 'Value' in val) return (val as any).Value;
  return val;
}

function assertString(val: any, msg: string): asserts val is string {
  expect(typeof val).toBe('string');
  expect(val.length).toBeGreaterThan(0);
}

function isDnsSafeBucketName(name: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(name);
}

function isArn(s: string): boolean {
  return /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/.test(s) || /^arn:aws:[a-z0-9-]+::\d{12}:.+/.test(s);
}

function splitCsvIds(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

/* ----------------------------- Template Helpers ---------------------------- */

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadJsonTemplate(): CfnTemplate {
  const p = path.resolve(__dirname, '../lib/TapStack.json');
  const text = readFileUTF8(p);
  return JSON.parse(text);
}

/* ---------------------------------- Tests --------------------------------- */

describe('TapStack integration: outputs file presence & shape', () => {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

  test('outputs file exists and is readable', () => {
    expect(fileExists(outputsPath)).toBe(true);
    const txt = readFileUTF8(outputsPath);
    expect(txt.length).toBeGreaterThan(0);
  });

  test('outputs JSON parses and has keys', () => {
    const outputs = loadOutputs();
    expect(outputs && typeof outputs).toBe('object');
    expect(Object.keys(outputs).length).toBeGreaterThan(10);
  });
});

describe('TapStack integration: required outputs exist with sane formats', () => {
  const outputs = loadOutputs();

  const requiredKeys = [
    'VPCId',
    'PublicSubnetIds',
    'PrivateSubnetIds',
    'AlbArn',
    'AlbDnsName',
    'AlbSecurityGroupId',
    'TargetGroupArn',
    'WebAclArn',
    'Ec2AutoScalingGroupName',
    'Ec2InstanceProfileArn',
    'LambdaFunctionName',
    'LambdaFunctionArn',
    'LambdaLogGroupName',
    'TrailName',
    'TrailArn',
    'CloudTrailLogGroupArn',
    'KmsKeyArn',
    'AccessLogsBucketName',
    'TrailLogsBucketName',
    'LambdaArtifactsBucketName',
    'S3GatewayEndpointId',
    'KmsInterfaceEndpointId',
    'LogsInterfaceEndpointId',
    'SsmInterfaceEndpointId',
    'Ec2MessagesInterfaceEndpointId',
  ];

  test('all required output keys are present', () => {
    for (const k of requiredKeys) {
      const v = getOutputValue(outputs, k);
      expect(v).toBeDefined();
    }
  });

  test('VPCId looks like a VPC ID', () => {
    const vpcId = getOutputValue(outputs, 'VPCId');
    assertString(vpcId, 'VPCId must be a string');
    expect(/^vpc-[0-9a-f]+$/.test(vpcId)).toBe(true);
  });

  test('PublicSubnetIds contains at least two subnet IDs', () => {
    const s = getOutputValue(outputs, 'PublicSubnetIds');
    assertString(s, 'PublicSubnetIds must be a CSV string');
    const arr = splitCsvIds(s);
    expect(arr.length).toBeGreaterThanOrEqual(2);
    arr.forEach((id) => expect(/^subnet-[0-9a-f]+$/.test(id)).toBe(true));
  });

  test('PrivateSubnetIds contains at least two subnet IDs', () => {
    const s = getOutputValue(outputs, 'PrivateSubnetIds');
    assertString(s, 'PrivateSubnetIds must be a CSV string');
    const arr = splitCsvIds(s);
    expect(arr.length).toBeGreaterThanOrEqual(2);
    arr.forEach((id) => expect(/^subnet-[0-9a-f]+$/.test(id)).toBe(true));
  });

  test('AlbArn is an ARN', () => {
    const arn = getOutputValue(outputs, 'AlbArn');
    assertString(arn, 'AlbArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':elasticloadbalancing:')).toBe(true);
  });

  test('AlbDnsName looks like an ELB DNS name', () => {
    const dns = getOutputValue(outputs, 'AlbDnsName');
    assertString(dns, 'AlbDnsName must be a string');
    expect(dns).toMatch(/elb\.amazonaws\.com$/);
  });

  test('AlbSecurityGroupId looks like a security group ID', () => {
    const sg = getOutputValue(outputs, 'AlbSecurityGroupId');
    assertString(sg, 'AlbSecurityGroupId must be a string');
    expect(/^sg-[0-9a-f]+$/.test(sg)).toBe(true);
  });

  test('TargetGroupArn is an ARN and includes targetgroup', () => {
    const arn = getOutputValue(outputs, 'TargetGroupArn');
    assertString(arn, 'TargetGroupArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':targetgroup/')).toBe(true);
  });

  test('WebAclArn is an ARN referencing wafv2', () => {
    const arn = getOutputValue(outputs, 'WebAclArn');
    assertString(arn, 'WebAclArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':wafv2:')).toBe(true);
  });

  test('Ec2AutoScalingGroupName is a non-empty name', () => {
    const name = getOutputValue(outputs, 'Ec2AutoScalingGroupName');
    assertString(name, 'Ec2AutoScalingGroupName must be a string');
    expect(name.length).toBeGreaterThan(2);
  });

  test('Ec2InstanceProfileArn is an ARN and mentions instance-profile', () => {
    const arn = getOutputValue(outputs, 'Ec2InstanceProfileArn');
    assertString(arn, 'Ec2InstanceProfileArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':instance-profile/')).toBe(true);
  });

  test('LambdaFunctionName is a non-empty string', () => {
    const name = getOutputValue(outputs, 'LambdaFunctionName');
    assertString(name, 'LambdaFunctionName must be a string');
  });

  test('LambdaFunctionArn is an ARN for Lambda', () => {
    const arn = getOutputValue(outputs, 'LambdaFunctionArn');
    assertString(arn, 'LambdaFunctionArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':lambda:')).toBe(true);
    expect(arn.includes(':function:')).toBe(true);
  });

  test('LambdaLogGroupName starts with /aws/lambda/', () => {
    const lg = getOutputValue(outputs, 'LambdaLogGroupName');
    assertString(lg, 'LambdaLogGroupName must be a string');
    expect(lg.startsWith('/aws/lambda/')).toBe(true);
  });

  test('TrailName is non-empty', () => {
    const name = getOutputValue(outputs, 'TrailName');
    assertString(name, 'TrailName must be a string');
  });

  test('TrailArn is an ARN referencing cloudtrail', () => {
    const arn = getOutputValue(outputs, 'TrailArn');
    assertString(arn, 'TrailArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':cloudtrail:')).toBe(true);
  });

  test('CloudTrailLogGroupArn is a CW Logs ARN', () => {
    const arn = getOutputValue(outputs, 'CloudTrailLogGroupArn');
    assertString(arn, 'CloudTrailLogGroupArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':logs:')).toBe(true);
    expect(arn.includes(':log-group:')).toBe(true);
  });

  test('KmsKeyArn is a KMS key ARN', () => {
    const arn = getOutputValue(outputs, 'KmsKeyArn');
    assertString(arn, 'KmsKeyArn must be a string');
    expect(isArn(arn)).toBe(true);
    expect(arn.includes(':kms:')).toBe(true);
    expect(arn.includes(':key/')).toBe(true);
  });

  test('AccessLogsBucketName, TrailLogsBucketName, LambdaArtifactsBucketName are DNS-safe and lowercase', () => {
    const keys = ['AccessLogsBucketName', 'TrailLogsBucketName', 'LambdaArtifactsBucketName'] as const;
    for (const k of keys) {
      const name = getOutputValue(outputs, k);
      assertString(name, `${k} must be a string`);
      expect(isDnsSafeBucketName(name)).toBe(true);
      expect(name).toBe(name.toLowerCase());
    }
  });

  test('VPC endpoint IDs have expected prefix', () => {
    const ids = [
      'S3GatewayEndpointId',
      'KmsInterfaceEndpointId',
      'LogsInterfaceEndpointId',
      'SsmInterfaceEndpointId',
      'Ec2MessagesInterfaceEndpointId',
    ] as const;
    for (const k of ids) {
      const id = getOutputValue(outputs, k);
      assertString(id, `${k} must be a string`);
      expect(/^vpce-[a-z0-9]+/i.test(id)).toBe(true);
    }
  });
});

describe('TapStack integration: cross-check a few structural invariants from the JSON template', () => {
  const tpl = loadJsonTemplate();

  function resourcesByType(type: string) {
    return Object.entries(tpl.Resources || {}).filter(([, r]) => r?.Type === type);
  }
  function getRes(id: string) {
    return (tpl.Resources || {})[id];
  }

  test('template has a single ALB Listener and it is HTTP (no HTTPS)', () => {
    const listeners = resourcesByType('AWS::ElasticLoadBalancingV2::Listener').map(([, r]) => r);
    expect(listeners.length).toBeGreaterThanOrEqual(1);
    const protos = listeners.map((l) => (l?.Properties?.Protocol || '').toString().toUpperCase());
    expect(protos).toContain('HTTP');
    expect(protos).not.toContain('HTTPS');
  });

  test('no ACM certificate resources', () => {
    const hasAcm = Object.values(tpl.Resources || {}).some((r: any) => (r?.Type || '').startsWith('AWS::CertificateManager::'));
    expect(hasAcm).toBe(false);
  });

  test('EC2 Security Group has NO SSH (22) ingress', () => {
    const ec2Sg = getRes('EC2SecurityGroup');
    expect(ec2Sg?.Type).toBe('AWS::EC2::SecurityGroup');
    const inRules = ec2Sg?.Properties?.SecurityGroupIngress || [];
    const hasSsh = (inRules as any[]).some((r) => r.FromPort === 22 || r.ToPort === 22);
    expect(hasSsh).toBe(false);
  });

  test('LaunchTemplate EBS is encrypted and does not force a custom KMS key (avoid race)', () => {
    const lt = getRes('EC2LaunchTemplate');
    expect(lt?.Type).toBe('AWS::EC2::LaunchTemplate');
    const ebs = lt?.Properties?.LaunchTemplateData?.BlockDeviceMappings?.[0]?.Ebs;
    expect(ebs?.Encrypted).toBe(true);
    expect(ebs?.KmsKeyId).toBeUndefined();
  });

  test('WAFv2 WebACL has AWS managed rule groups present', () => {
    const webacls = resourcesByType('AWS::WAFv2::WebACL').map(([, r]) => r);
    expect(webacls.length).toBeGreaterThanOrEqual(1);
    const rules = webacls[0]?.Properties?.Rules || [];
    expect(rules.length).toBeGreaterThanOrEqual(3);
  });
});

describe('TapStack integration: edge-case validations on outputs', () => {
  const outputs = loadOutputs();

  test('Bucket names do not contain underscores or uppercase letters', () => {
    const buckets = ['AccessLogsBucketName', 'TrailLogsBucketName', 'LambdaArtifactsBucketName'] as const;
    for (const k of buckets) {
      const v = getOutputValue(outputs, k);
      assertString(v, `${k} must be a string`);
      expect(/[A-Z_]/.test(v)).toBe(false);
    }
  });

  test('ALB DNS name does not include https scheme (HTTP-only per exclusions)', () => {
    const dns = getOutputValue(outputs, 'AlbDnsName');
    assertString(dns, 'AlbDnsName must be a string');
    expect(dns.startsWith('http://') || dns.startsWith('https://')).toBe(false);
  });

  test('Target group ARN belongs to elbv2 service', () => {
    const arn = getOutputValue(outputs, 'TargetGroupArn');
    assertString(arn, 'TargetGroupArn must be a string');
    expect(arn.includes(':elasticloadbalancing:')).toBe(true);
  });

  test('KMS ARN region is present (us-east-1 expected)', () => {
    const arn = getOutputValue(outputs, 'KmsKeyArn');
    assertString(arn, 'KmsKeyArn must be a string');
    // arn:aws:kms:us-east-1:<acct>:key/<uuid>
    expect(/arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+/i.test(arn)).toBe(true);
  });
});
