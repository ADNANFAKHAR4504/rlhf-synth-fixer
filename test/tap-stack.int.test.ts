// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeContinuousBackupsCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) as Record<
  string,
  string
>;

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const runE2E = process.env.E2E === 'true';
const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Outputs', () => {
  test('required outputs exist and have valid shapes', async () => {
    const requiredKeys = [
      'VpcId',
      'PublicSubnetIds',
      'PrivateSubnetIds',
      'AppBucketName',
      'BastionInstanceId',
      'AlbDnsName',
      'DbEndpointAddress',
      'DynamoTableName',
    ];

    // Presence and non-empty
    for (const key of requiredKeys) {
      expect(outputs[key]).toBeDefined();
      expect(String(outputs[key]).trim().length).toBeGreaterThan(0);
    }

    // ID formats
    expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    expect(outputs.BastionInstanceId).toMatch(/^i-[0-9a-f]{8,17}$/);

    // Subnet lists
    const publicSubnets = outputs.PublicSubnetIds.split(',').map(s => s.trim());
    const privateSubnets = outputs.PrivateSubnetIds.split(',').map(s =>
      s.trim()
    );
    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    for (const id of [...publicSubnets, ...privateSubnets]) {
      expect(id).toMatch(/^subnet-[0-9a-f]{8,17}$/);
    }
    // Ensure no duplicates across provided lists
    const all = new Set([...publicSubnets, ...privateSubnets]);
    expect(all.size).toBe(publicSubnets.length + privateSubnets.length);

    // S3 bucket name rules
    expect(outputs.AppBucketName).toMatch(/^[a-z0-9.-]{3,63}$/);
    expect(outputs.AppBucketName).not.toMatch(/[A-Z_]/);

    // ALB DNS and DB endpoint should be in us-east-1 for this stack
    expect(outputs.AlbDnsName).toMatch(
      /^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/
    );
    expect(outputs.DbEndpointAddress).toMatch(
      /^[a-z0-9.-]+\.us-east-1\.rds\.amazonaws\.com$/
    );

    // DynamoDB table naming constraints: 3-255 chars of A-Za-z0-9_.-
    expect(outputs.DynamoTableName).toMatch(/^[A-Za-z0-9_.-]{3,255}$/);
  });
});

describe('TapStack E2E (live AWS checks)', () => {
  // Only run if explicitly enabled to avoid failures without live infra/creds
  (runE2E ? test : test.skip)('ALB responds with 200 OK at root', async () => {
    const url = `http://${outputs.AlbDnsName}`;
    const resp = await axios.get(url, { timeout: 8000 });
    expect(resp.status).toBe(200);
    expect(String(resp.data)).toContain('OK');
  });

  (runE2E ? test : test.skip)(
    'S3 bucket has SSE-S3 and public access blocked',
    async () => {
      const s3 = new S3Client({ region });
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.AppBucketName })
      );
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      const hasSseS3 = rules.some(
        r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'AES256'
      );
      expect(hasSseS3).toBe(true);

      const pab = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.AppBucketName })
      );
      const cfg = pab.PublicAccessBlockConfiguration!;
      expect(cfg.BlockPublicAcls).toBe(true);
      expect(cfg.BlockPublicPolicy).toBe(true);
      expect(cfg.IgnorePublicAcls).toBe(true);
      expect(cfg.RestrictPublicBuckets).toBe(true);
    }
  );

  (runE2E ? test : test.skip)('DynamoDB table has PITR enabled', async () => {
    const ddb = new DynamoDBClient({ region });
    const res = await ddb.send(
      new DescribeContinuousBackupsCommand({
        TableName: outputs.DynamoTableName,
      })
    );
    expect(
      res.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
        ?.PointInTimeRecoveryStatus
    ).toBe('ENABLED');
  });

  (runE2E ? test : test.skip)(
    'EC2 bastion instance exists and VPC exists',
    async () => {
      const ec2 = new EC2Client({ region });
      const inst = await ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.BastionInstanceId],
        })
      );
      const hasInstance = (inst.Reservations || []).some(r =>
        (r.Instances || []).some(
          i => i.InstanceId === outputs.BastionInstanceId
        )
      );
      expect(hasInstance).toBe(true);

      const vpcs = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
      );
      expect((vpcs.Vpcs || []).length).toBe(1);
    }
  );

  (runE2E ? test : test.skip)(
    'RDS instance backing endpoint is Multi-AZ and encrypted',
    async () => {
      const rds = new RDSClient({ region });
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const match = (res.DBInstances || []).find(
        db => db.Endpoint?.Address === outputs.DbEndpointAddress
      );
      expect(match).toBeDefined();
      expect(match?.MultiAZ).toBe(true);
      expect(match?.StorageEncrypted).toBe(true);
    }
  );
});
