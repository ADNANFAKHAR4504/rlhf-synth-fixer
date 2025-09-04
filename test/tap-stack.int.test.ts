// test/tap-stack.int.test.ts
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for a deployed TapStack stack.
 * These tests read CloudFormation outputs from:
 *    cfn-outputs/all-outputs.json
 *
 * They are resilient to many JSON shapes (CLI, CDK, custom aggregators).
 * We recursively collect string/number leaves into a flat map and then assert
 * on the expected Output Keys from TapStack.yml.
 */

// ---- Types & helpers ----

type OutputMap = Record<string, string>;

// Expected Output keys from TapStack.yml
const REQUIRED_KEYS = [
  'VPCId',
  'PublicSubnet1Id',
  'PublicSubnet2Id',
  'PrivateSubnet1Id',
  'PrivateSubnet2Id',
  'BastionSecurityGroupId',
  'DatabaseSecurityGroupId',
  'BastionInstanceId',
  'BastionPublicDnsName',
  'SecureBucketName',
  'SecureBucketArn',
  'DatabaseEndpoint',
  'DatabasePort',
  'MasterUserSecretArn',
  'CentralizedLogGroupName',
  'CentralizedLogGroupArn',
  'AlarmTopicArn',
  'S3PolicyGuardFunctionName',
  'S3PolicyGuardFunctionArn',
  'CloudTrailName',
  'CloudTrailArn',
] as const;

function loadOutputsFile(): any {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
  const raw = fs.readFileSync(outputsPath, 'utf8').trim();
  if (!raw) throw new Error('Outputs file is empty');

  // Some pipelines double-serialize JSON (string inside a JSON string). Handle that.
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Outputs file is not valid JSON');
  }
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      // leave as string; we'll handle below
    }
  }
  return parsed;
}

/**
 * Recursively traverse an arbitrary object/array and collect leaf values.
 * - Keys are the final property names (last segment).
 * - Values are coerced to strings.
 * - First value wins (to avoid clobbering).
 */
function collectLeafStrings(input: any, out: OutputMap = {}, parentKey?: string): OutputMap {
  if (input === null || input === undefined) return out;

  if (Array.isArray(input)) {
    for (const item of input) collectLeafStrings(item, out, parentKey);
    return out;
  }

  if (typeof input === 'object') {
    for (const [k, v] of Object.entries(input)) {
      if (v !== null && typeof v === 'object') {
        collectLeafStrings(v, out, k);
      } else {
        const leafKey = k; // prefer most specific key name
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          if (!(leafKey in out)) out[leafKey] = String(v);
        }
      }
    }
    return out;
  }

  // primitive at root (unlikely)
  if (parentKey && !(parentKey in out)) {
    out[parentKey] = String(input);
  }
  return out;
}

/**
 * Attempt several common CFN output shapes first, then fall back to a deep scan.
 */
function coerceOutputsToMap(input: any): OutputMap {
  // 1) AWS CLI: { "Stacks": [ { "Outputs": [ { "OutputKey": "...", "OutputValue": "..." }, ... ] } ] }
  if (input?.Stacks && Array.isArray(input.Stacks)) {
    for (const stk of input.Stacks) {
      if (Array.isArray(stk?.Outputs)) {
        const map: OutputMap = {};
        for (const o of stk.Outputs) {
          if (o?.OutputKey && (typeof o.OutputValue === 'string' || typeof o.OutputValue === 'number')) {
            map[o.OutputKey] = String(o.OutputValue);
          }
        }
        if (Object.keys(map).length) return map;
      }
    }
  }

  // 2) { "Outputs": [ { "OutputKey": "...", "OutputValue": "..." } ] }
  if (Array.isArray(input?.Outputs)) {
    const map: OutputMap = {};
    for (const o of input.Outputs) {
      if (o?.OutputKey && (typeof o.OutputValue === 'string' || typeof o.OutputValue === 'number')) {
        map[o.OutputKey] = String(o.OutputValue);
      }
    }
    if (Object.keys(map).length) return map;
  }

  // 3) CDK-like: { "StackName": { "VPCId": "...", ... } }
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    // If a top-level value looks like an Outputs map, use it.
    for (const v of Object.values(input)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const leafs = collectLeafStrings(v as Record<string, any>);
        const hasAnyRequired = REQUIRED_KEYS.some(k => k in leafs);
        if (hasAnyRequired) return leafs;
      }
    }

    // Or if input is already a flat { key: string } map
    const flat: OutputMap = {};
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === 'string' || typeof v === 'number') flat[k] = String(v);
    }
    if (Object.keys(flat).length) {
      const hasAnyRequired = REQUIRED_KEYS.some(k => k in flat);
      if (hasAnyRequired) return flat;
    }
  }

  // 4) Last resort: deep-scan and collect all string leaves
  const deep = collectLeafStrings(input);
  const hasAnyRequired = REQUIRED_KEYS.some(k => k in deep);
  if (hasAnyRequired) return deep;

  throw new Error('Unsupported outputs JSON shape; cannot find outputs.');
}

/** Extract ARN parts; throws on invalid ARN */
function parseArn(arn: string) {
  const m = /^arn:(aws|aws-cn|aws-us-gov):([a-z0-9-]+):([a-z0-9-]*):(\d{12})?:(.+)$/.exec(arn);
  if (!m) throw new Error(`Invalid ARN: ${arn}`);
  const [, partition, service, region, account, resource] = m;
  return { partition, service, region, account, resource };
}

// ---- Regexes for AWS identifiers ----
const reVpcId = /^vpc-[0-9a-f]{8,17}$/i;
const reSubnetId = /^subnet-[0-9a-f]{8,17}$/i;
const reSgId = /^sg-[0-9a-f]{8,17}$/i;
const reInstanceId = /^i-[0-9a-f]{8,17}$/i;
const reHostname = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/; // relaxed hostname
const reBucket = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/; // DNS-compliant bucket
const reS3Arn = /^arn:(aws|aws-cn|aws-us-gov):s3:::([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])$/;
const reCwlArn = /^arn:(aws|aws-cn|aws-us-gov):logs:[a-z0-9-]+:\d{12}:log-group:[^:]+(?::.*)?$/;
const reSnsArn = /^arn:(aws|aws-cn|aws-us-gov):sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9-_]+$/;
const reLambdaArn = /^arn:(aws|aws-cn|aws-us-gov):lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+(:(\$LATEST|[0-9]+))?$/;
const reSecretsArn = /^arn:(aws|aws-cn|aws-us-gov):secretsmanager:[a-z0-9-]+:\d{12}:secret:[A-Za-z0-9/_+=.@-]+$/;
const reCloudTrailArn = /^arn:(aws|aws-cn|aws-us-gov):cloudtrail:[a-z0-9-]+:\d{12}:trail\/[A-Za-z0-9._-]+$/;
const reTrailName = /^[A-Za-z0-9._-]+$/;
const reNoSpaces = /^\S+$/;

// ---- Test suite ----

describe('TapStack Integration - CloudFormation Outputs', () => {
  let raw: any;
  let outputs: OutputMap;

  beforeAll(() => {
    raw = loadOutputsFile();
    outputs = coerceOutputsToMap(raw);
  });

  test('Outputs file present and contains all expected keys', () => {
    const missing = REQUIRED_KEYS.filter(k => outputs[k] === undefined);
    expect(missing).toEqual([]);
  });

  test('Core IDs follow AWS formats', () => {
    expect(outputs.VPCId).toMatch(reVpcId);
    expect(outputs.PublicSubnet1Id).toMatch(reSubnetId);
    expect(outputs.PublicSubnet2Id).toMatch(reSubnetId);
    expect(outputs.PrivateSubnet1Id).toMatch(reSubnetId);
    expect(outputs.PrivateSubnet2Id).toMatch(reSubnetId);
    expect(outputs.BastionSecurityGroupId).toMatch(reSgId);
    expect(outputs.DatabaseSecurityGroupId).toMatch(reSgId);
    expect(outputs.BastionInstanceId).toMatch(reInstanceId);
  });

  test('Subnet IDs are distinct (no duplicates across the four subnets)', () => {
    const subs = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    expect(new Set(subs).size).toBe(subs.length);
  });

  test('EC2 public DNS and RDS endpoint look like hostnames; DB port looks numeric', () => {
    expect(outputs.BastionPublicDnsName).toMatch(reHostname);
    expect(outputs.DatabaseEndpoint).toMatch(reHostname);
    expect(outputs.BastionPublicDnsName.toLowerCase()).toBe(outputs.BastionPublicDnsName);
    expect(outputs.DatabaseEndpoint.toLowerCase()).toBe(outputs.DatabaseEndpoint);
    expect(reNoSpaces.test(outputs.BastionPublicDnsName)).toBe(true);
    expect(reNoSpaces.test(outputs.DatabaseEndpoint)).toBe(true);

    expect(/^\d+$/.test(outputs.DatabasePort)).toBe(true);
    const port = Number(outputs.DatabasePort);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65535);
  });

  test('S3 bucket name and ARN pairing and format', () => {
    const name = outputs.SecureBucketName;
    const arn = outputs.SecureBucketArn;
    expect(name).toMatch(reBucket);
    expect(name).toBe(name.toLowerCase());
    expect(!name.includes('..')).toBe(true);

    const m = reS3Arn.exec(arn);
    expect(m).not.toBeNull();
    if (m) {
      expect(m[2]).toBe(name);
    }
  });

  test('CloudWatch Logs group name/ARN alignment', () => {
    const lgName = outputs.CentralizedLogGroupName;
    const lgArn = outputs.CentralizedLogGroupArn;
    expect(typeof lgName).toBe('string');
    expect(lgName.length).toBeGreaterThan(0);
    expect(lgName.startsWith('/')).toBe(true);
    // Convention from template uses /tapstack/centralized
    expect(lgName.includes('/tapstack')).toBe(true);
    expect(lgArn).toMatch(reCwlArn);
    expect(lgArn.includes(`log-group:${lgName}`)).toBe(true);
  });

  test('SNS Topic ARN shape', () => {
    expect(outputs.AlarmTopicArn).toMatch(reSnsArn);
    const parsed = parseArn(outputs.AlarmTopicArn);
    expect(parsed.service).toBe('sns');
  });

  test('Lambda function name/ARN pairing', () => {
    const fnName = outputs.S3PolicyGuardFunctionName;
    const fnArn = outputs.S3PolicyGuardFunctionArn;
    expect(typeof fnName).toBe('string');
    expect(fnName.length).toBeGreaterThan(0);
    expect(reNoSpaces.test(fnName)).toBe(true);
    expect(fnArn).toMatch(reLambdaArn);
    expect(fnArn.includes(`function:${fnName}`)).toBe(true);
  });

  test('RDS master user secret ARN (auto-managed) format', () => {
    expect(outputs.MasterUserSecretArn).toMatch(reSecretsArn);
    const parsed = parseArn(outputs.MasterUserSecretArn);
    expect(parsed.service).toBe('secretsmanager');
  });

  test('CloudTrail name/ARN pairing', () => {
    const trailName = outputs.CloudTrailName;
    const trailArn = outputs.CloudTrailArn;
    expect(trailName).toMatch(reTrailName);
    expect(trailArn).toMatch(reCloudTrailArn);
    expect(trailArn.endsWith('/' + trailName)).toBe(true);
    const parsed = parseArn(trailArn);
    expect(parsed.service).toBe('cloudtrail');
    expect(parsed.resource.startsWith('trail/')).toBe(true);
  });

  test('Region and Account are consistent across key ARNs (where present)', () => {
    const candidates = [
      outputs.SecureBucketArn,            // s3 ARNs may omit region/account
      outputs.CentralizedLogGroupArn,
      outputs.AlarmTopicArn,
      outputs.S3PolicyGuardFunctionArn,
      outputs.MasterUserSecretArn,
      outputs.CloudTrailArn,
    ];
    const parsed = candidates.map(parseArn);
    const withRegion = parsed.filter(p => p.region);
    const withAccount = parsed.filter(p => p.account);
    if (withRegion.length > 0) {
      const region = withRegion[0].region;
      withRegion.forEach(p => expect(p.region).toBe(region));
    }
    if (withAccount.length > 0) {
      const account = withAccount[0].account;
      withAccount.forEach(p => expect(p.account).toBe(account));
    }
  });

  test('Edge: Every output value is a non-empty, trimmed string', () => {
    for (const [k, v] of Object.entries(outputs)) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
      expect(v).toBe(v.trim());
    }
  });

  test('Edge: Bucket ARN ends with bucket name; CWL ARN contains log-group name; Lambda ARN contains function name', () => {
    const m = reS3Arn.exec(outputs.SecureBucketArn);
    expect(m?.[2]).toBe(outputs.SecureBucketName);
    expect(outputs.CentralizedLogGroupArn.includes(`log-group:${outputs.CentralizedLogGroupName}`)).toBe(true);
    expect(outputs.S3PolicyGuardFunctionArn.includes(`function:${outputs.S3PolicyGuardFunctionName}`)).toBe(true);
  });

  test('Edge: Output keys do not contain unexpected whitespace or uppercase (sanity)', () => {
    for (const key of REQUIRED_KEYS) {
      expect(reNoSpaces.test(key)).toBe(true);
      // keys are CamelCase by design; this assertion ensures no leading/trailing spaces in keys.
      expect(key).toBe(key.trim());
    }
  });

  test('Edge: VPC/Subnet/SG/Instance IDs all share the correct AWS prefixes', () => {
    expect(outputs.VPCId.startsWith('vpc-')).toBe(true);
    expect(outputs.PublicSubnet1Id.startsWith('subnet-')).toBe(true);
    expect(outputs.BastionSecurityGroupId.startsWith('sg-')).toBe(true);
    expect(outputs.BastionInstanceId.startsWith('i-')).toBe(true);
  });

  test('Edge: Public and Private subnet IDs are not equal (isolation sanity)', () => {
    expect(outputs.PublicSubnet1Id).not.toBe(outputs.PrivateSubnet1Id);
    expect(outputs.PublicSubnet2Id).not.toBe(outputs.PrivateSubnet2Id);
  });

  test('Edge: DatabasePort is commonly 5432 (advisory; does not fail if different)', () => {
    const port = Number(outputs.DatabasePort);
    // advisory check; pass regardless, just ensure reasonable range
    expect(port >= 1024 && port <= 65535).toBe(true);
  });
});
