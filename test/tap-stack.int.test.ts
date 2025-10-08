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
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
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

// Load flat outputs (only RdsSecretUsed is guaranteed)
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
const flatOutputs = fs.existsSync(outputsPath)
  ? JSON.parse(fs.readFileSync(outputsPath, 'utf8'))
  : {};

const expectedTableName = `TurnAroundPromptTable${environmentSuffix}`;
const expectedVpcName = `${projectPrefix}-vpc-${environmentSuffix}`;
const expectedTrailName = `${projectPrefix}-trail-${environment}-${environmentSuffix}`;
const expectedAppInstanceName = `${projectPrefix}-app-instance-${environmentSuffix}`;
const expectedSnsDisplayName = `${projectPrefix} Operations Alerts`;

describe('TAP Stack – Live Integration', () => {
  const timeout = 60_000;

  // -------- DynamoDB --------
  describe('DynamoDB', () => {
    test(
      'table exists, is active, pay-per-request, SSE on, and supports CRUD',
      async () => {
        // Describe
        const describe = await clients.dynamo.send(
          new DescribeTableCommand({ TableName: expectedTableName })
        );
        expect(describe.Table).toBeTruthy();
        expect(describe.Table!.TableStatus).toBe('ACTIVE');
        expect(describe.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(describe.Table!.SSEDescription?.Status).toBe('ENABLED');

        // CRUD
        const id = `it-${Date.now()}`;
        const item = {
          id: { S: id },
          prompt: { S: 'integration-test' },
          ts: { N: String(Date.now()) },
        };

        await clients.dynamo.send(new PutItemCommand({ TableName: expectedTableName, Item: item }));
        const got = await clients.dynamo.send(new GetItemCommand({ TableName: expectedTableName, Key: { id: { S: id } } }));
        expect(got.Item?.prompt?.S).toBe('integration-test');
        await clients.dynamo.send(new DeleteItemCommand({ TableName: expectedTableName, Key: { id: { S: id } } }));
      },
      timeout
    );
  });

  // -------- VPC / Subnets / Instances / SGs --------
  describe('Networking', () => {
    let vpcId: string;
    let publicSubnets: string[] = [];
    let privateSubnets: string[] = [];

    test(
      'VPC is present by Name tag',
      async () => {
        const vpcs = await clients.ec2.send(new DescribeVpcsCommand({}));
        const found = vpcs.Vpcs?.find(v =>
          (v.Tags || []).some(t => t.Key === 'Name' && t.Value === expectedVpcName)
        );
        expect(found).toBeTruthy();
        expect(found!.State).toBe('available');
        vpcId = found!.VpcId!;
      },
      timeout
    );

    test(
      'public and private subnets exist and are in different AZs',
      async () => {
        const subnetsResp = await clients.ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
        const subnets = subnetsResp.Subnets || [];
        expect(subnets.length).toBeGreaterThanOrEqual(4);

        // Classify by MapPublicIpOnLaunch (true => public)
        const publicOnes = subnets.filter(s => s.MapPublicIpOnLaunch);
        const privateOnes = subnets.filter(s => !s.MapPublicIpOnLaunch);
        expect(publicOnes.length).toBeGreaterThanOrEqual(2);
        expect(privateOnes.length).toBeGreaterThanOrEqual(2);

        publicSubnets = publicOnes.map(s => s.SubnetId!);
        privateSubnets = privateOnes.map(s => s.SubnetId!);

        const azSet = new Set(subnets.map(s => s.AvailabilityZone));
        expect(azSet.size).toBeGreaterThanOrEqual(2);
      },
      timeout
    );

    test(
      'app instance is in a private subnet and has monitoring enabled',
      async () => {
        const inst = await clients.ec2.send(new DescribeInstancesCommand({
          Filters: [
            { Name: 'tag:Name', Values: [expectedAppInstanceName] },
            { Name: 'instance-state-name', Values: ['pending', 'running', 'stopped', 'stopping'] },
          ],
        }));
        const instances = (inst.Reservations || []).flatMap(r => r.Instances || []);
        expect(instances.length).toBeGreaterThan(0);

        const app = instances[0];
        expect(privateSubnets).toContain(app.SubnetId!);
        expect(app.Monitoring?.State).toBe('enabled');
      },
      timeout
    );

    test(
      'RDS SG allows 5432 from App SG; Bastion SG (if present) only allows SSH',
      async () => {
        // RDS instance to discover SG
        const rds = await clients.rds.send(new DescribeDBInstancesCommand({}));
        const ourDb = (rds.DBInstances || []).find(db =>
          db.DBInstanceIdentifier?.includes(`${projectPrefix}-db-${environment}-${environmentSuffix}`)
        );
        expect(ourDb).toBeTruthy();
        const rdsSgIds = (ourDb!.VpcSecurityGroups || []).map(g => g.VpcSecurityGroupId!);
        expect(rdsSgIds.length).toBeGreaterThan(0);

        // App instance SGs (from previous test)
        const appInst = await clients.ec2.send(new DescribeInstancesCommand({
          Filters: [{ Name: 'tag:Name', Values: [expectedAppInstanceName] }],
        }));
        const app = (appInst.Reservations || []).flatMap(r => r.Instances || [])[0];
        const appSgIds = (app.SecurityGroups || []).map(g => g.GroupId!);

        const sgs = await clients.ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [...new Set([...rdsSgIds, ...appSgIds])] }));
        const rdsSg = sgs.SecurityGroups!.find(sg => rdsSgIds.includes(sg.GroupId!));
        expect(rdsSg).toBeTruthy();

        // Check 5432 ingress from the app SG on the RDS SG
        const has5432FromApp = (rdsSg!.IpPermissions || []).some(p =>
          p.FromPort === 5432 &&
          p.ToPort === 5432 &&
          (p.UserIdGroupPairs || []).some(pair => appSgIds.includes(pair.GroupId!))
        );
        expect(has5432FromApp).toBe(true);

        // Optional: Bastion SG (only exists if KeyPair was provided). If present, only SSH.
        const allSgs = sgs.SecurityGroups || [];
        const maybeBastion = allSgs.find(sg =>
          (sg.GroupName?.includes('bastion') || (sg.Tags || []).some(t => t.Key === 'Name' && /bastion/i.test(t.Value!)))
        );
        if (maybeBastion) {
          const ingress = maybeBastion.IpPermissions || [];
          // Only one ingress rule and it's SSH
          expect(ingress.length).toBe(1);
          expect(ingress[0].FromPort).toBe(22);
          expect(ingress[0].ToPort).toBe(22);
        }
      },
      timeout
    );
  });

  // -------- RDS --------
  describe('RDS', () => {
    test(
      'RDS instance is available, private, encrypted, postgres, and has backups',
      async () => {
        const resp = await clients.rds.send(new DescribeDBInstancesCommand({}));
        const db = (resp.DBInstances || []).find(d =>
          d.DBInstanceIdentifier?.includes(`${projectPrefix}-db-${environment}-${environmentSuffix}`)
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
      'Secrets Manager holds the credentials actually used',
      async () => {
        const secretArn = flatOutputs.RdsSecretUsed || flatOutputs['RdsSecretUsed'];
        expect(secretArn).toBeTruthy();

        const ds = await clients.secrets.send(new DescribeSecretCommand({ SecretId: secretArn }));
        expect(ds.ARN).toBe(secretArn);
        expect(ds.Name).toBeDefined();
      },
      timeout
    );
  });

  // -------- CloudTrail & S3 (logs) --------
  describe('CloudTrail & S3', () => {
    let trailBucket: string | undefined;
    let trailKmsKeyId: string | undefined;

    test(
      'trail exists and is healthy',
      async () => {
        const trails = await clients.cloudtrail.send(new DescribeTrailsCommand({}));
        const trail = (trails.trailList || []).find(t => t.Name === expectedTrailName);
        expect(trail).toBeTruthy();

        // Core properties
        expect(trail!.IsMultiRegionTrail).toBe(true);
        expect(trail!.IncludeGlobalServiceEvents).toBe(true);
        expect(trail!.LogFileValidationEnabled).toBe(true);

        // capture for next tests
        trailBucket = trail!.S3BucketName;
        trailKmsKeyId = trail!.KmsKeyId; // may be full ARN or key-id

        // Status
        const status = await clients.cloudtrail.send(new GetTrailStatusCommand({ Name: expectedTrailName }));
        expect(status.IsLogging).toBe(true);
      },
      timeout
    );

    test(
      'trail S3 bucket has KMS encryption and versioning',
      async () => {
        if (!trailBucket) return;

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
      'trail KMS key (if managed by stack) is enabled',
      async () => {
        if (!trailKmsKeyId) return; // may be using an external key

        // Accept ARN or key-id
        const keyId = trailKmsKeyId.split('/').pop() || trailKmsKeyId;
        const k = await clients.kms.send(new DescribeKeyCommand({ KeyId: keyId }));
        expect(k.KeyMetadata?.KeyState).toBe('Enabled');
        expect(k.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      },
      timeout
    );
  });

  // -------- SNS --------
  describe('SNS', () => {
    test(
      'operations topic exists (by DisplayName) and is accessible',
      async () => {
        // We don’t have an output — scan topics and find the one with our DisplayName
        const topics = await clients.sns.send(new ListTopicsCommand({}));
        const topicArns = (topics.Topics || []).map(t => t.TopicArn!).filter(Boolean);

        let foundArn: string | undefined;
        for (const arn of topicArns) {
          const attrs = await clients.sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
          if (attrs.Attributes?.DisplayName === expectedSnsDisplayName) {
            foundArn = arn;
            break;
          }
        }

        expect(foundArn).toBeTruthy();
        // Once found, fetch again to assert stable attributes
        const attrs = await clients.sns.send(new GetTopicAttributesCommand({ TopicArn: foundArn! }));
        expect(attrs.Attributes?.TopicArn).toBe(foundArn);
      },
      timeout
    );
  });
});
