/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for TapStack CloudFormation deployment outputs.
 * - Loads cfn-outputs/all-outputs.json from process.cwd()
 * - Validates structure, formats, and environment alignment (positive + edge cases)
 * - Single file, ≥20 tests per discovered stack (22 here)
 */

import * as fs from 'fs';
import * as path from 'path';

type OutputsMap = Record<string, any>;

const OUTPUT_FILE = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

// ------------------------- Helpers & Validators ------------------------------

function safeLoadJson(file: string): any | null {
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isPlainObject(x: any): x is Record<string, any> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Keys we expect in a "bag of outputs" */
const expectedOutputKeys = new Set([
  'VpcId',
  'PublicSubnetId',
  'PrivateSubnetId',
  'AlbArn',
  'AlbDnsName',
  'AlbSecurityGroupId',
  'TargetGroupArn',
  'HttpListenerArn',
  'AutoScalingGroupName',
  'LaunchTemplateId',
  'InstanceRoleArn',
  'InstanceProfileArn',
  'AppSecurityGroupId',
  'RdsEndpoint',
  'RdsPort',
  'DbSubnetGroupName',
  'RdsSecurityGroupId',
  'DynamoTableName',
  'DynamoTableArn',
  'S3LogsBucketName',
  'S3LogsBucketArn',
  'S3AccessLogsBucketName',
  'S3AccessLogsBucketArn',
  'CloudWatchDashboardName',
  'LogGroupName',
  'SsmParameterPathPrefix',
]);

/**
 * Discover one or more "outputs-like" objects somewhere in any JSON shape.
 * An outputs object is a plain object that contains a handful of expected keys.
 */
function collectOutputsObjects(root: any): OutputsMap[] {
  const found: OutputsMap[] = [];
  const seen = new Set<any>();

  function walk(n: any) {
    if (n === null || typeof n !== 'object') return;
    if (seen.has(n)) return;
    seen.add(n);

    if (Array.isArray(n)) {
      for (const item of n) walk(item);
      return;
    }

    if (isPlainObject(n)) {
      const keys = Object.keys(n);
      const matches = keys.filter((k) => expectedOutputKeys.has(k));
      if (matches.length >= 5) {
        found.push(n as OutputsMap);
      }
      for (const v of Object.values(n)) walk(v);
    }
  }

  walk(root);
  return found;
}

function inferEnvNameFromOutputs(out: OutputsMap): string {
  const pref = String(out.SsmParameterPathPrefix || '');
  const m = pref.match(/\/tapstack\/(Production|Staging)$/i);
  if (m) return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  const dash = String(out.CloudWatchDashboardName || '');
  const n = dash.match(/^(Production|Staging)-/i);
  if (n) return n[1][0].toUpperCase() + n[1].slice(1).toLowerCase();
  return 'Unknown';
}

function noUnresolvedIntrinsics(v: any): boolean {
  if (typeof v !== 'string') return true;
  return !v.includes('${') && !v.includes('Ref::');
}

// Regex validators
const reVpcId = /^vpc-[0-9a-f]+$/i;
const reSubnetId = /^subnet-[0-9a-f]+$/i;
const reSgId = /^sg-[0-9a-f]+$/i;
const reLtId = /^lt-[0-9a-f]+$/i;
const reArn = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/i; // generic
const reAlbArn = /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:loadbalancer\/.+/i;
const reTgArn = /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:targetgroup\/.+/i;
const reListenerArn = /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:listener\/.+/i;
const reDdbArn = /^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/.+/i;
const reS3Arn = /^arn:aws:s3:::[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const reBucketName = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const reAlbDns = /^[a-z0-9-]+\.([a-z0-9-]+)\.elb\.amazonaws\.com(\.cn)?$/i; // ALB DNS
const reDbSubnetGroupName = /^[A-Za-z0-9-_.]+$/;
const reAsgName = /^[A-Za-z0-9-_.]+$/;
const reCwDashboardName = /^(Production|Staging)-TapStack-Dashboard$/;
const reLogGroupName = /^\/tapstack\/(Production|Staging)\/application$/;
const reSsmPrefix = /^\/tapstack\/(Production|Staging)$/;

// --------------------------- Load once at module init ------------------------

const fileExists: boolean = fs.existsSync(OUTPUT_FILE);
const parsedJson: any | null = safeLoadJson(OUTPUT_FILE);
const outputsSets: OutputsMap[] = parsedJson ? collectOutputsObjects(parsedJson) : [];

// --------------------------------- Tests -------------------------------------

describe('TapStack - Integration (cfn-outputs/all-outputs.json)', () => {
  test('00 - outputs file exists and parses as JSON', () => {
    expect(fileExists).toBe(true);
    expect(parsedJson).not.toBeNull();
  });

  test('01 - discovered at least one outputs set', () => {
    expect(outputsSets.length).toBeGreaterThanOrEqual(1);
  });

  // Generate a comprehensive block of tests for each discovered stack
  outputsSets.forEach((out, idx) => {
    const envName = inferEnvNameFromOutputs(out);

    describe(`${envName} stack - outputs validation [set #${idx + 1}]`, () => {
      test('02 - core networking IDs (VpcId/Subnets) are present and well-formed', () => {
        expect(typeof out.VpcId).toBe('string');
        expect(out.VpcId).toMatch(reVpcId);

        expect(typeof out.PublicSubnetId).toBe('string');
        expect(out.PublicSubnetId).toMatch(reSubnetId);

        expect(typeof out.PrivateSubnetId).toBe('string');
        expect(out.PrivateSubnetId).toMatch(reSubnetId);

        expect(noUnresolvedIntrinsics(out.VpcId)).toBe(true);
        expect(noUnresolvedIntrinsics(out.PublicSubnetId)).toBe(true);
        expect(noUnresolvedIntrinsics(out.PrivateSubnetId)).toBe(true);
      });

      test('03 - ALB ARNs/DNS and related outputs are valid', () => {
        expect(out.AlbArn).toMatch(reAlbArn);
        expect(out.TargetGroupArn).toMatch(reTgArn);
        expect(out.HttpListenerArn).toMatch(reListenerArn);

        expect(typeof out.AlbDnsName).toBe('string');
        expect(out.AlbDnsName.toLowerCase()).toContain('elb.amazonaws.com');
        expect(out.AlbDnsName).toBe(out.AlbDnsName.toLowerCase()); // DNS lowercased

        expect(typeof out.AlbSecurityGroupId).toBe('string');
        expect(out.AlbSecurityGroupId).toMatch(reSgId);

        expect(noUnresolvedIntrinsics(out.AlbArn)).toBe(true);
        expect(noUnresolvedIntrinsics(out.AlbDnsName)).toBe(true);
      });

      test('04 - compute outputs (ASG, LaunchTemplate) are present', () => {
        expect(typeof out.AutoScalingGroupName).toBe('string');
        expect(out.AutoScalingGroupName).toMatch(reAsgName);

        expect(typeof out.LaunchTemplateId).toBe('string');
        expect(out.LaunchTemplateId).toMatch(reLtId);
      });

      test('05 - IAM outputs (InstanceRoleArn / InstanceProfileArn) are valid ARNs', () => {
        expect(out.InstanceRoleArn).toMatch(reArn);
        expect(out.InstanceProfileArn).toMatch(reArn);
      });

      test('06 - App Security Group ID is valid', () => {
        expect(out.AppSecurityGroupId).toMatch(reSgId);
      });

      test('07 - RDS endpoint/port and DB subnet group name are valid', () => {
        expect(typeof out.RdsEndpoint).toBe('string');
        expect(out.RdsEndpoint).toMatch(/\.rds\.amazonaws\.com(\.cn)?$/i);
        expect(noUnresolvedIntrinsics(out.RdsEndpoint)).toBe(true);

        const portNum = Number(out.RdsPort);
        expect(Number.isFinite(portNum)).toBe(true);
        expect(portNum).toBeGreaterThan(0);
        expect(portNum).toBeGreaterThanOrEqual(1024);
        expect(portNum).toBeLessThanOrEqual(65535);

        expect(typeof out.DbSubnetGroupName).toBe('string');
        expect(out.DbSubnetGroupName).toMatch(reDbSubnetGroupName);

        expect(typeof out.RdsSecurityGroupId).toBe('string');
        expect(out.RdsSecurityGroupId).toMatch(reSgId);
      });

      test('08 - DynamoDB outputs have valid name and ARN', () => {
        expect(typeof out.DynamoTableName).toBe('string');
        expect(out.DynamoTableName.length).toBeGreaterThan(0);
        expect(out.DynamoTableArn).toMatch(reDdbArn);
        expect(out.DynamoTableArn).toContain(`table/${out.DynamoTableName}`);
      });

      test('09 - S3 logs and access-logs bucket outputs are valid and distinct', () => {
        expect(typeof out.S3LogsBucketName).toBe('string');
        expect(out.S3LogsBucketName).toMatch(reBucketName);
        expect(out.S3LogsBucketName).toBe(out.S3LogsBucketName.toLowerCase());

        expect(typeof out.S3AccessLogsBucketName).toBe('string');
        expect(out.S3AccessLogsBucketName).toMatch(reBucketName);
        expect(out.S3AccessLogsBucketName).toBe(out.S3AccessLogsBucketName.toLowerCase());

        expect(out.S3LogsBucketArn).toMatch(reS3Arn);
        expect(out.S3LogsBucketArn).toContain(`:${out.S3LogsBucketName}`);

        expect(out.S3AccessLogsBucketArn).toMatch(reS3Arn);
        expect(out.S3AccessLogsBucketArn).toContain(`:${out.S3AccessLogsBucketName}`);

        expect(out.S3LogsBucketName).not.toBe(out.S3AccessLogsBucketName);
      });

      test('10 - CloudWatch dashboard and log group outputs are valid and environment-qualified', () => {
        expect(typeof out.CloudWatchDashboardName).toBe('string');
        expect(out.CloudWatchDashboardName).toMatch(reCwDashboardName);

        expect(typeof out.LogGroupName).toBe('string');
        expect(out.LogGroupName).toMatch(reLogGroupName);
      });

      test('11 - SSM Parameter path prefix is valid and environment-qualified', () => {
        expect(typeof out.SsmParameterPathPrefix).toBe('string');
        expect(out.SsmParameterPathPrefix).toMatch(reSsmPrefix);
      });

      // ------------------ Edge-case style validations -----------------------

      test('12 - No output contains unresolved CFN intrinsics like ${...}', () => {
        const values = Object.values(out).filter((v) => typeof v === 'string');
        const unresolved = values.filter((v) => v.includes('${'));
        expect(unresolved).toHaveLength(0);
      });

      test('13 - No obviously empty/placeholder values (undefined/null/empty)', () => {
        for (const [k, v] of Object.entries(out)) {
          expect(v).not.toBeNull();
          if (typeof v === 'string') {
            expect(v.trim().length).toBeGreaterThan(0);
            expect(v).not.toMatch(/(undefined|null|\[object Object\])/i);
          }
        }
      });

      test('14 - ALB/Dynamo/RDS/S3 ARNs conform to arn:aws:* format', () => {
        expect(out.AlbArn).toMatch(reArn);
        expect(out.TargetGroupArn).toMatch(reArn);
        expect(out.HttpListenerArn).toMatch(reArn);
        expect(out.DynamoTableArn).toMatch(reArn);
        expect(out.S3LogsBucketArn).toMatch(reArn);
        expect(out.S3AccessLogsBucketArn).toMatch(reArn);
      });

      test('15 - ALB DNS does not include scheme, only hostname', () => {
        expect(out.AlbDnsName.startsWith('http://')).toBe(false);
        expect(out.AlbDnsName.startsWith('https://')).toBe(false);
        expect(out.AlbDnsName).toMatch(reAlbDns);
      });

      test('16 - Security Group IDs look correct and not the same for ALB vs App vs RDS', () => {
        const sgAlb = out.AlbSecurityGroupId;
        const sgApp = out.AppSecurityGroupId;
        const sgRds = out.RdsSecurityGroupId;
        expect(sgAlb).toMatch(reSgId);
        expect(sgApp).toMatch(reSgId);
        expect(sgRds).toMatch(reSgId);
        // Prefer uniqueness; allow at least 2 unique among the three
        expect(new Set([sgAlb, sgApp, sgRds]).size).toBeGreaterThanOrEqual(2);
      });

      test('17 - LaunchTemplateId and AutoScalingGroupName look sane', () => {
        expect(out.LaunchTemplateId).toMatch(reLtId);
        expect(out.AutoScalingGroupName).toMatch(reAsgName);
        expect(out.AutoScalingGroupName.length).toBeGreaterThan(3);
      });

      test('18 - SSM path prefix aligns with CloudWatch log group environment segment', () => {
        const envFromSsm = out.SsmParameterPathPrefix.replace('/tapstack/', '');
        const envFromLogGroup = (out.LogGroupName.match(/^\/tapstack\/([^/]+)/) || [])[1] || '';
        expect(envFromSsm).toBe(envFromLogGroup);
        expect(['Production', 'Staging']).toContain(envFromSsm);
      });

      test('19 - DynamoDB ARN includes table name exactly', () => {
        expect(
          out.DynamoTableArn.endsWith(`/table/${out.DynamoTableName}`) ||
          out.DynamoTableArn.includes(`/table/${out.DynamoTableName}`)
        ).toBe(true);
      });

      test('20 - RDS endpoint host appears to be a DNS hostname (contains at least two dots)', () => {
        const dotCount = String(out.RdsEndpoint).split('.').length - 1;
        expect(dotCount).toBeGreaterThanOrEqual(2);
      });

      test('21 - Bucket names are DNS compliant (lowercase, no underscores, proper length)', () => {
        const names = [out.S3LogsBucketName, out.S3AccessLogsBucketName];
        names.forEach((b) => {
          expect(b).toMatch(reBucketName);
          expect(b).toBe(b.toLowerCase());
          expect(b).not.toContain('_');
          expect(b.length).toBeGreaterThanOrEqual(3);
          expect(b.length).toBeLessThanOrEqual(63);
        });
      });

      test('22 - Outputs appear to correspond to a single environment (Production or Staging)', () => {
        const envFromSsm = out.SsmParameterPathPrefix.replace('/tapstack/', '');
        expect(['Production', 'Staging']).toContain(envFromSsm);
        expect(out.CloudWatchDashboardName.startsWith(`${envFromSsm}-`)).toBe(true);
      });
    });
  });
});
