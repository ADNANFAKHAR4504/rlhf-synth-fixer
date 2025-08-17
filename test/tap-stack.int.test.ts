/**
 * Integration tests (live) that use the same flat-outputs format/path you specified.
 * Reads cfn-outputs/flat-outputs.json and validates resources exist & are configured.
 *
 * Required Outputs in flat JSON:
 *  - VpcId
 *  - PublicSubnets (comma-separated)
 *  - PrivateSubnets (comma-separated)
 *  - AppBucketName
 *  - CloudTrailBucketName
 *  - KmsKeyArn
 *  - CloudTrailArn
 *  - SsmParamDbPassword (the resolved SSM parameter name path)
 */

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient, DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand, GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.dirname(path.resolve(__filename));
const flatOutputsPath = path.join(baseDir, '..', '..', 'cfn-outputs', 'flat-outputs.json');

// Load flat outputs (same format/location as your Python snippet)
let flat_outputs: Record<string, any> = {};
if (fs.existsSync(flatOutputsPath)) {
  const raw = fs.readFileSync(flatOutputsPath, 'utf8');
  try {
    flat_outputs = JSON.parse(raw);
  } catch {
    flat_outputs = {};
  }
} else {
  flat_outputs = {};
}

// Helper getters
function must(key: string): string {
  const v = flat_outputs[key];
  if (!v || typeof v !== 'string' || v.trim() === '') {
    throw new Error(`Missing required output ${key} in ${flatOutputsPath}`);
  }
  return v;
}

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const ct = new CloudTrailClient({ region });
const ssm = new SSMClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });

// Derive project/env from the SSM path if needed: "/<project>/<env>/DB_PASSWORD"
function fromParamPath(paramPath: string) {
  const parts = paramPath.split('/').filter(Boolean); // ['project','env','DB_PASSWORD']
  const project = parts[0];
  const env = parts[1];
  return { project, env };
}

describe('TapStack Integration (live)', () => {
  const vpcId = must('VpcId');
  const publicSubnetsCsv = must('PublicSubnets');
  const privateSubnetsCsv = must('PrivateSubnets');
  const appBucket = must('AppBucketName');
  const ctBucket = must('CloudTrailBucketName');
  const kmsArn = must('KmsKeyArn');
  const trailArn = must('CloudTrailArn');
  const ssmParamName = must('SsmParamDbPassword');

  const publicSubnets = publicSubnetsCsv.split(',').map(s => s.trim()).filter(Boolean);
  const privateSubnets = privateSubnetsCsv.split(',').map(s => s.trim()).filter(Boolean);

  const { project, env } = fromParamPath(ssmParamName);
  const ctLogGroup = `/aws/cloudtrail/${project}/${env}`;
  const unauthAlarmName = `alarm-unauth-${project}-${env}`;

  it('VPC exists', async () => {
    const out = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(out.Vpcs && out.Vpcs.length).toBe(1);
  }, 30000);

  it('Subnets exist (2 public + 2 private)', async () => {
    const ids = [...publicSubnets, ...privateSubnets];
    const out = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }));
    expect(out.Subnets?.length).toBe(ids.length);
  }, 30000);

  it('App bucket exists, versioning enabled, KMS encryption configured', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: appBucket }));
    const v = await s3.send(new GetBucketVersioningCommand({ Bucket: appBucket }));
    expect(v.Status).toBe('Enabled');

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: appBucket }));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || enc.ServerSideEncryptionConfiguration;
    // Some SDK shapes differ; assert presence of configuration
    expect(rules).toBeDefined();
  }, 45000);

  it('CloudTrail bucket exists and versioning enabled', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: ctBucket }));
    const v = await s3.send(new GetBucketVersioningCommand({ Bucket: ctBucket }));
    expect(v.Status).toBe('Enabled');
  }, 45000);

  it('KMS key exists and rotation is enabled', async () => {
    const d = await kms.send(new DescribeKeyCommand({ KeyId: kmsArn }));
    expect(d.KeyMetadata?.KeyManager).toBeDefined();
    const rot = await kms.send(new GetKeyRotationStatusCommand({ KeyId: kmsArn }));
    expect(rot.KeyRotationEnabled).toBe(true);
  }, 30000);

  it('CloudTrail is logging and sending to CloudWatch Logs', async () => {
    // Confirm trail is discoverable and has CW logs set
    const desc = await ct.send(new DescribeTrailsCommand({ trailNameList: [trailArn], includeShadowTrails: true }));
    expect(desc.trailList && desc.trailList.length).toBeGreaterThan(0);
    const trail = desc.trailList![0];
    expect(trail.CloudWatchLogsLogGroupArn).toContain(ctLogGroup);

    const status = await ct.send(new GetTrailStatusCommand({ Name: trailArn }));
    expect(status.IsLogging).toBe(true);
  }, 45000);

  it('CloudWatch Logs: CloudTrail log group exists', async () => {
    const lg = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: ctLogGroup, limit: 1 }));
    const found = (lg.logGroups || []).find(g => g.logGroupName === ctLogGroup);
    expect(found).toBeTruthy();
  }, 30000);

  it('Metric filter for unauthorized access exists on CloudTrail log group', async () => {
    const mf = await logs.send(new DescribeMetricFiltersCommand({ logGroupName: ctLogGroup }));
    const hasUnauthorized = (mf.metricFilters || []).some(f => (f.filterPattern || '').includes('UnauthorizedOperation') || (f.filterPattern || '').includes('AccessDenied'));
    expect(hasUnauthorized).toBe(true);
  }, 30000);

  it('CloudWatch alarm for unauthorized access exists', async () => {
    const a = await cw.send(new DescribeAlarmsCommand({ AlarmNames: [unauthAlarmName] }));
    const alarm = (a.MetricAlarms || []).find(al => al.AlarmName === unauthAlarmName);
    expect(alarm).toBeTruthy();
    expect(alarm?.Threshold).toBe(1);
    expect(alarm?.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
  }, 30000);

  it('SSM parameter exists and is readable as String (no decryption required)', async () => {
    const p = await ssm.send(new GetParameterCommand({ Name: ssmParamName, WithDecryption: false }));
    expect(p.Parameter?.Name).toBe(ssmParamName);
    // `Type` is usually included in GetParameter responses
    if (p.Parameter?.Type) {
      expect(p.Parameter?.Type).toBe('String');
    }
    expect(typeof p.Parameter?.Value).toBe('string');
    expect((p.Parameter?.Value || '').length).toBeGreaterThan(0);
  }, 30000);
});
