import fs from 'fs';
import path from 'path';

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  ListTopicsCommand,
  SNSClient,
} from '@aws-sdk/client-sns';

// ---- Config (override via env in CI) ----
const region = process.env.AWS_REGION || 'eu-central-1';
const environment = process.env.ENVIRONMENT || 'dev';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const projectPrefix = process.env.PROJECT_PREFIX || 'securex';

// Static names per the deployed template
const expectedTableName = `TurnAroundPromptTable${environmentSuffix}`;
const expectedVpcName = `${projectPrefix}-vpc-${environmentSuffix}`;
const expectedTrailName = `${projectPrefix}-trail-${environment}-${environmentSuffix}`;
const expectedDbIdentifier = `${projectPrefix}-db-${environment}-${environmentSuffix}`;

// Clients
const clients = {
  dynamo: new DynamoDBClient({ region }),
  ec2: new EC2Client({ region }),
  rds: new RDSClient({ region }),
  s3: new S3Client({ region }),
  kms: new KMSClient({ region }),
  cloudtrail: new CloudTrailClient({ region }),
  sns: new SNSClient({ region }),
  secrets: new SecretsManagerClient({ region }),
};

// Load flat outputs (we only rely on RdsSecretUsed)
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
const flatOutputs = fs.existsSync(outputsPath)
  ? JSON.parse(fs.readFileSync(outputsPath, 'utf8'))
  : {};

describe('TAP Stack – Live Integration', () => {
  const timeout = 60_000;

  // ---------- Helpers (functionality-based discovery) ----------
  async function findVpcIdByName(name: string): Promise<string> {
    const vpcs = await clients.ec2.send(new DescribeVpcsCommand({}));
    const vpc = vpcs.Vpcs?.find(v =>
      (v.Tags || []).some(t => t.Key === 'Name' && t.Value === name)
    );
    if (!vpc?.VpcId) throw new Error(`VPC with Name=${name} not found`);
    return vpc.VpcId;
  }

  async function getSubnetsByVpc(vpcId: string) {
    const subnetsResp = await clients.ec2.send(
      new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
    );
    const subnets = subnetsResp.Subnets || [];
    if (subnets.length < 1) throw new Error(`No subnets found in VPC ${vpcId}`);

    const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch).map(s => s.SubnetId!);
    const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch).map(s => s.SubnetId!);

    if (publicSubnets.length < 1 || privateSubnets.length < 1) {
      throw new Error('Expected both public and private subnets');
    }
    return { publicSubnets, privateSubnets, all: subnetsResp.Subnets! };
  }

  async function findSgIdByDescriptionInVpc(desc: string, vpcId: string) {
    const sgs = await clients.ec2.send(
      new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
    );
    const sg = (sgs.SecurityGroups || []).find(g => g.Description === desc);
    if (!sg?.GroupId) throw new Error(`Security group with Description="${desc}" not found in VPC ${vpcId}`);
    return sg.GroupId;
  }

  async function findInstancesInSgAndSubnets(sgId: string, subnetIds: string[]) {
    const resp = await clients.ec2.send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: 'instance.group-id', Values: [sgId] },
          { Name: 'subnet-id', Values: subnetIds },
          { Name: 'instance-state-name', Values: ['pending', 'running', 'stopped', 'stopping'] },
        ],
      })
    );
    return (resp.Reservations || []).flatMap(r => r.Instances || []);
  }

  // ---------- DynamoDB ----------
  describe('DynamoDB', () => {
    test(
      'table exists, is active, pay-per-request, SSE on, and supports CRUD',
      async () => {
        const describe = await clients.dynamo.send(
          new DescribeTableCommand({ TableName: expectedTableName })
        );
        expect(describe.Table).toBeTruthy();
        expect(describe.Table!.TableStatus).toBe('ACTIVE');
        expect(describe.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(describe.Table!.SSEDescription?.Status).toBe('ENABLED');

        const id = `it-${Date.now()}`;
        const item = { id: { S: id }, prompt: { S: 'integration-test' }, ts: { N: String(Date.now()) } };

        await clients.dynamo.send(new PutItemCommand({ TableName: expectedTableName, Item: item }));
        const got = await clients.dynamo.send(new GetItemCommand({ TableName: expectedTableName, Key: { id: { S: id } } }));
        expect(got.Item?.prompt?.S).toBe('integration-test');
        await clients.dynamo.send(new DeleteItemCommand({ TableName: expectedTableName, Key: { id: { S: id } } }));
      },
      timeout
    );
  });

  // ---------- Networking (pure functionality) ----------
  describe('Networking', () => {
    let vpcId: string;
    let privateSubnets: string[] = [];

    test(
      'VPC present and subnets partitioned',
      async () => {
        vpcId = await findVpcIdByName(expectedVpcName);
        const { publicSubnets, privateSubnets: priv, all } = await getSubnetsByVpc(vpcId);
        expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
        expect(priv.length).toBeGreaterThanOrEqual(2);
        privateSubnets = priv;

        // different AZs used
        const azs = new Set(all.map(s => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      },
      timeout
    );

    test(
      'App instance(s) attached to "App SG" reside in private subnets and have detailed monitoring enabled',
      async () => {
        const appSgId = await findSgIdByDescriptionInVpc('App SG', vpcId);
        const instances = await findInstancesInSgAndSubnets(appSgId, privateSubnets);
        expect(instances.length).toBeGreaterThan(0);

        // Assert each found instance is indeed in private subnets and monitoring is enabled
        for (const inst of instances) {
          expect(privateSubnets).toContain(inst.SubnetId!);
          expect(inst.Monitoring?.State).toBe('enabled');
        }
      },
      timeout
    );

    test(
      'RDS SG allows TCP/5432 ingress from "App SG"; if Bastion SG exists it only allows SSH',
      async () => {
        // RDS
        const rds = await clients.rds.send(new DescribeDBInstancesCommand({}));
        const db = (rds.DBInstances || []).find(d =>
          d.DBInstanceIdentifier?.includes(expectedDbIdentifier)
        );
        expect(db).toBeTruthy();
        const rdsSgIds = (db!.VpcSecurityGroups || []).map(g => g.VpcSecurityGroupId!);
        expect(rdsSgIds.length).toBeGreaterThan(0);

        // App SG
        const appSgId = await findSgIdByDescriptionInVpc('App SG', vpcId);

        // Check RDS SG ingress has 5432 from App SG
        const sgResp = await clients.ec2.send(
          new DescribeSecurityGroupsCommand({ GroupIds: rdsSgIds })
        );
        const rdsSg = sgResp.SecurityGroups![0];
        const has5432FromApp = (rdsSg.IpPermissions || []).some(p =>
          p.FromPort === 5432 &&
          p.ToPort === 5432 &&
          (p.UserIdGroupPairs || []).some(pair => pair.GroupId === appSgId)
        );
        expect(has5432FromApp).toBe(true);

        // Bastion SG (optional resource, functionality-based)
        const maybeBastionId = await (async () => {
          try { return await findSgIdByDescriptionInVpc('Bastion SG', vpcId); }
          catch { return undefined; }
        })();
        if (maybeBastionId) {
          const bastion = await clients.ec2.send(
            new DescribeSecurityGroupsCommand({ GroupIds: [maybeBastionId] })
          );
          const ingress = bastion.SecurityGroups![0].IpPermissions || [];
          // Exactly one TCP/22 rule
          const onlySsh =
            ingress.length === 1 &&
            ingress[0].FromPort === 22 &&
            ingress[0].ToPort === 22 &&
            (ingress[0].IpProtocol === 'tcp' || ingress[0].IpProtocol === '6');
          expect(onlySsh).toBe(true);
        }
      },
      timeout
    );
  });

  // ---------- RDS ----------
  describe('RDS', () => {
    test(
      'Instance is available, private, encrypted, postgres, with backups',
      async () => {
        const resp = await clients.rds.send(new DescribeDBInstancesCommand({}));
        const db = (resp.DBInstances || []).find(d =>
          d.DBInstanceIdentifier?.includes(expectedDbIdentifier)
        );
        expect(db).toBeTruthy();
        expect(db!.DBInstanceStatus).toBe('available');
        expect(db!.PubliclyAccessible).toBe(false);
        expect(db!.StorageEncrypted).toBe(true);
        expect(db!.Engine).toBe('postgres');
        expect((db!.BackupRetentionPeriod || 0)).toBeGreaterThan(0);
      },
      timeout
    );

    test(
      'Secrets Manager has the credentials actually used',
      async () => {
        const secretArn = flatOutputs.RdsSecretUsed || flatOutputs['RdsSecretUsed'];
        expect(secretArn).toBeTruthy();
        const ds = await clients.secrets.send(new DescribeSecretCommand({ SecretId: secretArn }));
        expect(ds.ARN).toBe(secretArn);
      },
      timeout
    );
  });

  // ---------- CloudTrail & S3 ----------
  describe('CloudTrail & S3', () => {
    let trailBucket: string | undefined;
    let trailKmsKeyId: string | undefined;

    test(
      'Trail exists and is healthy',
      async () => {
        const trails = await clients.cloudtrail.send(new DescribeTrailsCommand({}));
        const trail = (trails.trailList || []).find(t => t.Name === expectedTrailName);
        expect(trail).toBeTruthy();
        expect(trail!.IsMultiRegionTrail).toBe(true);
        expect(trail!.IncludeGlobalServiceEvents).toBe(true);
        expect(trail!.LogFileValidationEnabled).toBe(true);

        trailBucket = trail!.S3BucketName;
        trailKmsKeyId = trail!.KmsKeyId;

        const status = await clients.cloudtrail.send(new GetTrailStatusCommand({ Name: expectedTrailName }));
        expect(status.IsLogging).toBe(true);
      },
      timeout
    );

    test(
      'Trail S3 bucket has KMS encryption and versioning',
      async () => {
        if (!trailBucket) throw new Error('Trail bucket missing');
        await clients.s3.send(new HeadBucketCommand({ Bucket: trailBucket }));

        const enc = await clients.s3.send(new GetBucketEncryptionCommand({ Bucket: trailBucket }));
        const algo = enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
        expect(algo).toBe('aws:kms');

        const ver = await clients.s3.send(new GetBucketVersioningCommand({ Bucket: trailBucket }));
        expect(ver.Status).toBe('Enabled');
      },
      timeout
    );

    test(
      'Trail KMS key is enabled (external or stack-managed)',
      async () => {
        if (!trailKmsKeyId) throw new Error('Trail KMS key id missing');
        const keyId = trailKmsKeyId.split('/').pop() || trailKmsKeyId;
        const k = await clients.kms.send(new DescribeKeyCommand({ KeyId: keyId }));
        expect(k.KeyMetadata?.KeyState).toBe('Enabled');
        expect(k.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      },
      timeout
    );
  });

  // ---------- SNS ----------
  describe('SNS', () => {
    test(
      'Operations topic exists and allows CloudWatch to publish',
      async () => {
        const topics = await clients.sns.send(new ListTopicsCommand({}));
        const topicArns = (topics.Topics || []).map(t => t.TopicArn!).filter(Boolean);

        let foundArn: string | undefined;
        for (const arn of topicArns) {
          const attrs = await clients.sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
          const policyJson = attrs.Attributes?.Policy;
          if (!policyJson) continue;
          const policy = JSON.parse(policyJson);
          const stmts = Array.isArray(policy.Statement) ? policy.Statement : [policy.Statement];
          const hasCwPublish = stmts.some(
            (s: any) =>
              (s.Sid === 'AllowCloudWatchToPublish' || /CloudWatchToPublish/i.test(s.Sid || '')) &&
              (s.Principal?.Service === 'cloudwatch.amazonaws.com' ||
                (Array.isArray(s.Principal?.Service) && s.Principal.Service.includes('cloudwatch.amazonaws.com'))) &&
              (Array.isArray(s.Action) ? s.Action.includes('SNS:Publish') : s.Action === 'SNS:Publish')
          );
          if (hasCwPublish) {
            foundArn = arn;
            break;
          }
        }

        expect(foundArn).toBeTruthy();
        const attrs = await clients.sns.send(new GetTopicAttributesCommand({ TopicArn: foundArn! }));
        expect(attrs.Attributes?.TopicArn).toBe(foundArn);
      },
      timeout
    );
  });
});
