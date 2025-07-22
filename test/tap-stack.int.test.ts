// test/tap-stack.int.test.ts
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketAclCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const outputs = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../lib/TapStack.json'), 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const ec2 = new EC2Client({});
const s3 = new S3Client({});
const rds = new RDSClient({});

describe('TapStack Infrastructure Integration Tests (SDK-based)', () => {
  test('VPC should exist and be available', async () => {
    const vpcId = outputs.VPCId;
    const { Vpcs } = await ec2.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(Vpcs?.[0]?.VpcId).toBe(vpcId);
    expect(Vpcs?.[0]?.State).toBe('available');
  });

  test('RDS instance should be in available state', async () => {
    const endpoint = outputs.RDSInstanceEndpoint;
    const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({}));
    const instance = DBInstances?.find((db) =>
      db.Endpoint?.Address === endpoint
    );
    expect(instance).toBeDefined();
    expect(instance?.DBInstanceStatus).toBe('available');
  });

  test('All resource names/values should contain environment suffix', () => {
    expect(outputs.S3BucketName).toContain(environmentSuffix);
    expect(outputs.RDSInstanceEndpoint).toContain(environmentSuffix);
    expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
  });
});
