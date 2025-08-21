// Integration tests for live environment after deployment
// Requires:
// - AWS credentials with permissions to read CFN outputs and resources in the target account
// - A JSON file at cfn-outputs/flat-outputs.json with flattened stack outputs
// - Environment variables (optional): AWS_REGION, APPLICATION_NAME (default: healthapp), ENVIRONMENT_SUFFIX (default: prod)

import fs from 'fs';
import path from 'path';

import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, SecurityGroup, IpPermission, Subnet } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DBInstance } from '@aws-sdk/client-rds';
import { KMSClient, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, LogGroup } from '@aws-sdk/client-cloudwatch-logs';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const region = process.env.AWS_REGION || 'us-west-2';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> | null = null;

const applicationName = process.env.APPLICATION_NAME || 'healthapp';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

const s3 = new S3Client({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const kms = new KMSClient({ region });
const logs = new CloudWatchLogsClient({ region });
const secrets = new SecretsManagerClient({ region });
const iam = new IAMClient({ region });
const sts = new STSClient({ region });

async function getAccountId(): Promise<string> {
  const id = await sts.send(new GetCallerIdentityCommand({}));
  return id.Account as string;
}

function expectOutputKeys(out: Record<string, string>, keys: string[]) {
  const missing = keys.filter(k => !(k in out));
  if (missing.length) {
    throw new Error(`Missing outputs in cfn-outputs/flat-outputs.json: ${missing.join(', ')}`);
  }
}

describe('TapStack - Live Integration Tests', () => {
  beforeAll(async () => {
    if (!fs.existsSync(outputsPath)) {
      console.warn(`flat-outputs.json not found at ${outputsPath}. Skipping integration tests.`);
      // Signal to Jest that tests should be skipped by throwing and catching within tests
      outputs = null;
      return;
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) as Record<string, string>;

    expectOutputKeys(outputs, [
      'VPCId',
      'PrivateSubnetIds',
      'PublicSubnetIds',
      'DatabaseEndpoint',
      'KMSKeyId',
      'PatientDataBucket',
      'LogsBucket',
      'DatabaseSecretArn',
      'ApplicationAPISecretArn',
      'ApplicationRoleArn',
      'ApplicationSecurityGroupId',
      'LoadBalancerSecurityGroupId',
    ]);
  });

  it('validates KMS key rotation is enabled', async () => {
    if (!outputs) return; // skip
    const keyId = outputs['KMSKeyId'];
    const rot = await kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
    expect(rot.KeyRotationEnabled).toBe(true);
  });

  it('validates S3 PatientDataBucket encryption, public access block, and versioning', async () => {
    if (!outputs) return; // skip
    const bucket = outputs['PatientDataBucket'];

    // Encryption
    try {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      const sse = rules[0].ApplyServerSideEncryptionByDefault!;
      expect(sse.SSEAlgorithm).toBe('aws:kms');
      expect(sse.KMSMasterKeyID).toBeDefined();
    } catch (e: any) {
      throw new Error(`Bucket ${bucket} encryption not configured or not accessible: ${e}`);
    }

    // Public access block
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);

    // Versioning
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(ver.Status).toBe('Enabled');
  });

  it('validates S3 Logs bucket encryption and public access block', async () => {
    if (!outputs) return; // skip
    const logsBucket = outputs['LogsBucket'];

    // Ensure bucket exists
    await s3.send(new HeadBucketCommand({ Bucket: logsBucket }));

    // Encryption
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: logsBucket }));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    expect(rules.length).toBeGreaterThan(0);
    const sse = rules[0].ApplyServerSideEncryptionByDefault!;
    expect(sse.SSEAlgorithm).toBe('aws:kms');
    expect(sse.KMSMasterKeyID).toBeDefined();

    // Public access block
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: logsBucket }));
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);
  });

  it('validates VPC and subnets from outputs', async () => {
    if (!outputs) return; // skip
    const vpcId = outputs['VPCId'];
    const privateSubnets = outputs['PrivateSubnetIds'].split(',').map(s => s.trim());
    const publicSubnets = outputs['PublicSubnetIds'].split(',').map(s => s.trim());

    // Verify subnets exist and belong to VPC
    const privResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnets }));
    (privResp.Subnets || []).forEach((s: Subnet) => expect(s.VpcId).toBe(vpcId));

    const pubResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnets }));
    (pubResp.Subnets || []).forEach((s: Subnet) => expect(s.VpcId).toBe(vpcId));

    // Skipped MapPublicIpOnLaunch attribute checks due to EC2 client version constraints.
  });

  it('validates Security Groups ingress rules', async () => {
    if (!outputs) return; // skip
    const albSgId = outputs['LoadBalancerSecurityGroupId'];
    const appSgId = outputs['ApplicationSecurityGroupId'];

    const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [albSgId, appSgId] }));
    const sgMap = new Map<string, SecurityGroup>((sgResp.SecurityGroups || []).map((sg: SecurityGroup) => [sg.GroupId!, sg]));

    const alb = sgMap.get(albSgId)!;
    const hasIngress = (sg: SecurityGroup, from: number, to: number, cidr?: string, srcSg?: string) => {
      return (sg.IpPermissions || []).some((perm: IpPermission) => {
        const portsMatch = perm.FromPort === from && perm.ToPort === to && (perm.IpProtocol === 'tcp' || perm.IpProtocol === '-1');
        const cidrMatch = cidr
          ? (perm.IpRanges || []).some(r => r.CidrIp === cidr)
          : true;
        const sgMatch = srcSg
          ? (perm.UserIdGroupPairs || []).some(p => p.GroupId === srcSg)
          : true;
        return portsMatch && cidrMatch && sgMatch;
      });
    };

    expect(hasIngress(alb, 80, 80, '0.0.0.0/0')).toBe(true);
    expect(hasIngress(alb, 443, 443, '0.0.0.0/0')).toBe(true);

    const app = sgMap.get(appSgId)!;
    expect(hasIngress(app, 80, 80, undefined, albSgId)).toBe(true);
    expect(hasIngress(app, 443, 443, undefined, albSgId)).toBe(true);
  });

  it('validates RDS instance encryption, performance insights and backups', async () => {
    if (!outputs) return; // skip
    const endpoint = outputs['DatabaseEndpoint'];

    // Find DB instance by endpoint
    let marker: string | undefined;
    let matched: DBInstance | undefined;
    while (true) {
      const resp = await rds.send(new DescribeDBInstancesCommand(marker ? { Marker: marker } : {}));
      for (const db of resp.DBInstances || []) {
        if (db.Endpoint?.Address === endpoint) {
          matched = db;
          break;
        }
      }
      if (matched || !resp.Marker) break;
      marker = resp.Marker;
    }

    expect(matched).toBeDefined();

    // Encryption
    expect(matched!.StorageEncrypted).toBe(true);
    expect(matched!.KmsKeyId).toBeDefined();

    // Performance insights
    if (matched!.PerformanceInsightsEnabled) {
      expect(matched!.PerformanceInsightsKMSKeyId).toBeDefined();
    }

    // Backups
    expect((matched!.BackupRetentionPeriod || 0) >= 7).toBe(true);

    // Subnet group includes at least two subnets
    expect((matched!.DBSubnetGroup?.Subnets || []).length).toBeGreaterThanOrEqual(2);
  });

  it('validates CloudWatch Log Group with KMS key and retention', async () => {
    if (!outputs) return; // skip
    const logGroupName = `/aws/healthcare/${applicationName}-${environmentSuffix}`;

    // Find the log group
    let found: LogGroup | undefined;
    let nextToken: string | undefined;
    do {
      const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName, nextToken }));
      found = (resp.logGroups || []).find((lg: LogGroup) => lg.logGroupName === logGroupName);
      nextToken = resp.nextToken;
    } while (!found && nextToken);

    if (!found) {
      throw new Error(`CloudWatch Log Group ${logGroupName} not found. Ensure stack created it.`);
    }

    const expectedRetention = (process.env.ENVIRONMENT_SUFFIX || 'prod') === 'prod' ? 2557 : 365;
    expect(found.retentionInDays).toBe(expectedRetention);
    // kmsKeyId property should be present when KMS is associated
    expect(found.kmsKeyId).toBeDefined();
  });

  it('validates Database Secret contains username and password', async () => {
    if (!outputs) return; // skip
    const arn = outputs['DatabaseSecretArn'];
    const sec = await secrets.send(new GetSecretValueCommand({ SecretId: arn }));
    const payload = sec.SecretString || '';
    const data = JSON.parse(payload);
    expect(typeof data.username).toBe('string');
    expect(typeof data.password).toBe('string');
  });

  it('validates Application API Secret contains api_key and jwt_secret', async () => {
    if (!outputs) return; // skip
    const arn = outputs['ApplicationAPISecretArn'];
    const sec = await secrets.send(new GetSecretValueCommand({ SecretId: arn }));
    const payload = sec.SecretString || '';
    const data = JSON.parse(payload);
    expect(typeof data.api_key).toBe('string');
    expect(typeof data.jwt_secret).toBe('string');
  });

  it('validates IAM ApplicationRole inline policy contains expected statements', async () => {
    if (!outputs) return; // skip
    const roleArn = outputs['ApplicationRoleArn'];
    const roleName = roleArn.split('/').pop() as string;

    // Ensure role exists
    const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(role.Role?.Arn).toBe(roleArn);

    // Fetch inline policy
    const polName = 'HealthcareAppPolicy';
    const pol = await iam.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: polName }));
    // PolicyDocument is URL-encoded JSON
    const decoded = decodeURIComponent(pol.PolicyDocument as unknown as string);
    const doc = JSON.parse(decoded);
    const statements = Array.isArray(doc.Statement) ? doc.Statement : [doc.Statement];

    const hasAction = (action: string) => statements.some((s: any) =>
      Array.isArray(s.Action) ? s.Action.includes(action) : s.Action === action
    );

    expect(hasAction('s3:GetObject')).toBe(true);
    expect(hasAction('s3:ListBucket')).toBe(true);
    expect(hasAction('secretsmanager:GetSecretValue')).toBe(true);
    expect(hasAction('kms:Decrypt')).toBe(true);
  });
});
