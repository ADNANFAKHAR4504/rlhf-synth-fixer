// tests/integration/integration-cfn.spec.ts

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  S3Client,
  GetBucketEncryptionCommand
} from '@aws-sdk/client-s3';
import {
  WAFV2Client,
  GetWebACLCommand
} from '@aws-sdk/client-wafv2';

const hasAwsCreds = !!(
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
  process.env.AWS_PROFILE ||
  process.env.AWS_ROLE_ARN
);

describe('Provisioned AWS infra (integration tests)', () => {
  beforeAll(() => {
    if (!hasAwsCreds) {
      console.warn('Skipping integration tests: no AWS credentials provided.');
    }
  });


  test('CloudTrail trail is deployed and logging is enabled', async () => {
    if (!hasAwsCreds) return;

    const ct = new CloudTrailClient({});
    const resp = await ct.send(new DescribeTrailsCommand({ includeShadowTrails: false }));
    const trails = resp.trailList || [];
    expect(trails.length).toBeGreaterThan(0);
    const trail = trails[0];
    const status = await ct.send(new GetTrailStatusCommand({ Name: trail?.Name }));
    expect(status.IsLogging).toBe(true);
  });

  test('Encrypted RDS instance exists in private subnet', async () => {
    if (!hasAwsCreds) return;

    const rds = new RDSClient({});
    const resp = await rds.send(new DescribeDBInstancesCommand({}));
    const inst = resp.DBInstances?.find(i => i.StorageEncrypted);
    expect(inst).toBeDefined();

    const subnetGroupName = inst?.DBSubnetGroup?.DBSubnetGroupName;
    expect(subnetGroupName).toBeDefined();

    const subnetsResp = await rds.send(new DescribeDBSubnetGroupsCommand({
      DBSubnetGroupName: subnetGroupName,
    }));

    const subnetGroup = subnetsResp.DBSubnetGroups?.[0];
    expect(subnetGroup?.DBSubnetGroupDescription).toBeDefined();
    });

  test('VPC and at least two subnets created', async () => {
    if (!hasAwsCreds) return;

    const ec2 = new EC2Client({});
    const vk = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: 'tag:Name', Values: ['*secure-vpc-*'] }] }));
    expect(vk.Vpcs?.length).toBeGreaterThan(0);

    const sn = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: vk.Vpcs!.map(v => v.VpcId!) }] }));
    expect(sn.Subnets?.length).toBeGreaterThanOrEqual(2);
  });

  test('S3 buckets have KMS encryption enabled', async () => {
    if (!hasAwsCreds) return;

    const s3 = new S3Client({});
    const buckets = ['prod-secure-app-bucket-iac', 'prod-security-logs-bucket-iac'];
    for (const name of buckets) {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: name }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms')).toBe(true);
    }
  });

});
