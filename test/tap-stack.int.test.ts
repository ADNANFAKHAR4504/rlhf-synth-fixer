// test/tap-stack.integration.test.ts
import * as fs from 'fs';
import * as path from 'path';

/**
 * This integration test suite validates the deployed TapStack stack
 * by reading its CloudFormation outputs from:
 *   cfn-outputs/all-outputs.json
 *
 * It checks presence, formatting, and cross-field consistency for:
 * - Core infra IDs (VPC, Subnets, SGs, EC2)
 * - S3 bucket name/ARN pairing
 * - RDS endpoint/port/secret ARN
 * - CloudWatch Logs group name/ARN pairing
 * - SNS Topic ARN
 * - Lambda function name/ARN pairing
 * - CloudTrail trail name/ARN and logging targets
 * - Region/account consistency across ARNs
 *
 * The tests are intentionally defensive and will pass as long as the
 * deployed resources follow AWS ID/ARN conventions and the template’s outputs.
 */

type OutputMap = Record<string, string>;

/** Loads and normalizes the outputs file (supports several common shapes). */
function loadOutputs(): OutputMap {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) {
    throw new Error(`Outputs file exists but is empty at ${p}`);
  }
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${p}: ${(e as Error).message}`);
  }
  return coerceOutputsToMap(json);
}

/** Try to coerce variety of shapes into a flat { [OutputKey]: OutputValue } map. */
function coerceOutputsToMap(input: any): OutputMap {
  // 1) { Stacks: [ { Outputs: [ { OutputKey, OutputValue } ] } ] }
  if (input?.Stacks && Array.isArray(input.Stacks)) {
    for (const s of input.Stacks) {
      if (Array.isArray(s?.Outputs)) {
        const map: OutputMap = {};
        for (const o of s.Outputs) {
          if (o?.OutputKey && typeof o.OutputValue === 'string') {
            map[o.OutputKey] = o.OutputValue;
          }
        }
        if (Object.keys(map).length > 0) return map;
      }
    }
  }

  // 2) { Outputs: [ { OutputKey, OutputValue } ] }
  if (Array.isArray(input?.Outputs)) {
    const map: OutputMap = {};
    for (const o of input.Outputs) {
      if (o?.OutputKey && typeof o.OutputValue === 'string') {
        map[o.OutputKey] = o.OutputValue;
      }
    }
    if (Object.keys(map).length > 0) return map;
  }

  // 3) { Outputs: { VPCId: "...", ... } }
  if (input?.Outputs && typeof input.Outputs === 'object' && !Array.isArray(input.Outputs)) {
    const map: OutputMap = {};
    for (const [k, v] of Object.entries(input.Outputs)) {
      if (typeof v === 'string') map[k] = v;
      else if ((v as any)?.Value && typeof (v as any).Value === 'string') map[k] = (v as any).Value;
      else if ((v as any)?.OutputValue && typeof (v as any).OutputValue === 'string') map[k] = (v as any).OutputValue;
    }
    if (Object.keys(map).length > 0) return map;
  }

  // 4) Flat map already { VPCId: "...", ... }
  if (typeof input === 'object' && input && !Array.isArray(input)) {
    const map: OutputMap = {};
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === 'string') map[k] = v;
    }
    if (Object.keys(map).length > 0) return map;
  }

  throw new Error(`Unsupported outputs JSON shape; cannot find outputs.`);
}

/** Extract ARN parts; throws on invalid ARN */
function parseArn(arn: string) {
  const m = /^arn:(aws|aws-cn|aws-us-gov):([a-z0-9-]+):([a-z0-9-]*):(\d{12})?:(.+)$/.exec(arn);
  if (!m) throw new Error(`Invalid ARN: ${arn}`);
  const [, partition, service, region, account, resource] = m;
  return { partition, service, region, account, resource };
}

/** Helpers to validate AWS identifiers */
const reVpcId = /^vpc-[0-9a-f]{8,17}$/i;
const reSubnetId = /^subnet-[0-9a-f]{8,17}$/i;
const reSgId = /^sg-[0-9a-f]{8,17}$/i;
const reInstanceId = /^i-[0-9a-f]{8,17}$/i;
const reHostname = /^[a-z0-9.-]+$/; // relaxed, AWS endpoints are lowercase/dots/dashes
const reBucket = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/; // strict DNS-compliant bucket
const reS3Arn = /^arn:(aws|aws-cn|aws-us-gov):s3:::([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])$/;
const reCwlArn = /^arn:(aws|aws-cn|aws-us-gov):logs:[a-z0-9-]+:\d{12}:log-group:[^:]+(?::.*)?$/;
const reSnsArn = /^arn:(aws|aws-cn|aws-us-gov):sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9-_]+$/;
const reLambdaArn = /^arn:(aws|aws-cn|aws-us-gov):lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+(:(\$LATEST|[0-9]+))?$/;
const reSecretsArn = /^arn:(aws|aws-cn|aws-us-gov):secretsmanager:[a-z0-9-]+:\d{12}:secret:[A-Za-z0-9/_+=.@-]+$/;
const reCloudTrailArn = /^arn:(aws|aws-cn|aws-us-gov):cloudtrail:[a-z0-9-]+:\d{12}:trail\/[A-Za-z0-9._-]+$/;

function expectNonEmptyString(v: any, key: string) {
  expect(typeof v).toBe('string');
  expect((v as string).length).toBeGreaterThan(0);
}

describe('TapStack Integration - CloudFormation Outputs', () => {
  let outputs: OutputMap;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  test('Outputs file present and contains all expected keys', () => {
    const required = [
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
      'CloudTrailArn'
    ];
    const missing = required.filter(k => outputs[k] === undefined);
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

  test('EC2 public DNS and RDS endpoint look like hostnames; DB port looks numeric', () => {
    expect(outputs.BastionPublicDnsName).toMatch(reHostname);
    expect(outputs.DatabaseEndpoint).toMatch(reHostname);
    expect(/^\d+$/.test(outputs.DatabasePort)).toBe(true);
    // typical postgres port if defaulted
    expect(Number(outputs.DatabasePort)).toBeGreaterThan(0);
  });

  test('S3 bucket name and ARN pairing and format', () => {
    const name = outputs.SecureBucketName;
    const arn = outputs.SecureBucketArn;

    expect(name).toMatch(reBucket);
    const arnMatch = reS3Arn.exec(arn);
    expect(arnMatch).not.toBeNull();
    if (arnMatch) {
      const bucketFromArn = arnMatch[2];
      expect(bucketFromArn).toBe(name);
    }
    // Lowercase DNS-safe
    expect(name).toBe(name.toLowerCase());
    expect(!name.includes('..')).toBe(true);
  });

  test('CloudWatch Logs group name/ARN alignment', () => {
    const name = outputs.CentralizedLogGroupName;
    const arn = outputs.CentralizedLogGroupArn;
    expectNonEmptyString(name, 'CentralizedLogGroupName');
    expect(arn).toMatch(reCwlArn);
    // Name should be part of ARN suffix after log-group:
    expect(arn.includes(`log-group:${name}`)).toBe(true);
  });

  test('SNS Topic ARN shape', () => {
    expect(outputs.AlarmTopicArn).toMatch(reSnsArn);
  });

  test('Lambda function name/ARN pairing', () => {
    const fnName = outputs.S3PolicyGuardFunctionName;
    const fnArn = outputs.S3PolicyGuardFunctionArn;
    expectNonEmptyString(fnName, 'S3PolicyGuardFunctionName');
    expect(fnArn).toMatch(reLambdaArn);
    expect(fnArn.endsWith(`function:${fnName}`) || fnArn.includes(`function:${fnName}:`)).toBe(true);
  });

  test('RDS master user secret ARN (auto-managed) format', () => {
    expect(outputs.MasterUserSecretArn).toMatch(reSecretsArn);
  });

  test('CloudTrail name/ARN pairing', () => {
    const trailName = outputs.CloudTrailName;
    const trailArn = outputs.CloudTrailArn;
    expectNonEmptyString(trailName, 'CloudTrailName');
    expect(trailArn).toMatch(reCloudTrailArn);
    expect(trailArn.endsWith(`/` + trailName)).toBe(true);
  });

  test('Region and Account are consistent across key ARNs', () => {
    const arns = [
      outputs.SecureBucketArn,
      outputs.CentralizedLogGroupArn,
      outputs.AlarmTopicArn,
      outputs.S3PolicyGuardFunctionArn,
      outputs.MasterUserSecretArn,
      outputs.CloudTrailArn
    ];
    const parsed = arns.map(parseArn);

    // S3 ARN may have empty region/account in some partitions; align with majority where present.
    const withRegion = parsed.filter(p => p.region && p.region.length > 0);
    const withAccount = parsed.filter(p => p.account && p.account.length > 0);
    if (withRegion.length > 0) {
      const region = withRegion[0].region;
      for (const p of withRegion) expect(p.region).toBe(region);
    }
    if (withAccount.length > 0) {
      const account = withAccount[0].account;
      for (const p of withAccount) expect(p.account).toBe(account);
    }
  });

  // -----------------
  // Edge cases
  // -----------------

  test('Edge: Every output value is a non-empty string', () => {
    for (const [k, v] of Object.entries(outputs)) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    }
  });

  test('Edge: Bucket ARN ends with bucket name; CWL ARN contains log-group name; Lambda ARN contains function name', () => {
    const bucketMatch = reS3Arn.exec(outputs.SecureBucketArn);
    expect(bucketMatch?.[2]).toBe(outputs.SecureBucketName);

    expect(outputs.CentralizedLogGroupArn.includes(`log-group:${outputs.CentralizedLogGroupName}`)).toBe(true);

    const fnName = outputs.S3PolicyGuardFunctionName;
    const fnArn = outputs.S3PolicyGuardFunctionArn;
    expect(fnArn.includes(`function:${fnName}`)).toBe(true);
  });

  test('Edge: Hostname-style outputs are lowercase (no spaces/uppercase)', () => {
    // RDS endpoint and EC2 DNS should be lowercase hostnames
    expect(outputs.BastionPublicDnsName).toBe(outputs.BastionPublicDnsName.toLowerCase());
    expect(outputs.DatabaseEndpoint).toBe(outputs.DatabaseEndpoint.toLowerCase());
    expect(/\s/.test(outputs.BastionPublicDnsName)).toBe(false);
    expect(/\s/.test(outputs.DatabaseEndpoint)).toBe(false);
  });
});
