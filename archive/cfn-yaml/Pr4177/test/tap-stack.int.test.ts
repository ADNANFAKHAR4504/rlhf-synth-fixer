// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DeleteItemCommand,
  DescribeContinuousBackupsCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  PublishCommand,
  SNSClient,
} from '@aws-sdk/client-sns';

jest.setTimeout(600000); // allow for AWS API latency

// --- Helpers to parse values from outputs ---
const flat = outputs; // already flat JSON (keys -> values)
const bucketName: string = flat.S3BucketName;
const bucketArn: string = flat.S3BucketArn;
const tableName: string = flat.DynamoDbTableName;
const lambdaFunctionName: string = flat.LambdaFunctionName;
const lambdaFunctionArn: string = flat.LambdaFunctionArn;
const rdsEndpoint: string = flat.RdsEndpoint;
const rdsPort: number = parseInt(flat.RdsPort, 10);
const secretArn: string = flat.DbPasswordSecretArn;
const topicArn: string = flat.SnsTopicArn;
const vpcId: string = flat.VpcId;
const igwId: string = flat.InternetGatewayId;
const nat1Id: string = flat.NatGateway1Id;
const privateSubnet1Id: string = flat.PrivateSubnet1Id;
const privateSubnet2Id: string = flat.PrivateSubnet2Id;

// derive region/account/project/env from names/ARNs
const parseRegionFromArn = (arn: string) => arn.split(':')[3];
const region = parseRegionFromArn(lambdaFunctionArn) || process.env.AWS_REGION || 'eu-central-1';
const accountId = lambdaFunctionArn.split(':')[4];

const nameParts = bucketName.split('-'); // myapp-dev-ACCOUNT-REGION-data
const projectName = nameParts[0];
const envFromName = nameParts[1];

// build alarm names from convention
const alarmBase = `${projectName}-${envFromName}-${accountId}-${region}`;
const alarmNames = [
  `${alarmBase}-lambda-errors`,
  `${alarmBase}-lambda-throttles`,
  `${alarmBase}-rds-cpu`,
  `${alarmBase}-rds-storage`,
  `${alarmBase}-dynamodb-read-throttle`,
  `${alarmBase}-dynamodb-write-throttle`,
];

// SDK clients
const ddb = new DynamoDBClient({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const secrets = new SecretsManagerClient({ region });
const rds = new RDSClient({ region });
const sns = new SNSClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });
const ec2 = new EC2Client({ region });

// utilities
const readStreamToString = async (stream: any) => {
  if (typeof stream?.transformToString === 'function') {
    return stream.transformToString();
  }
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('sanity: outputs loaded and region parsed', async () => {
      expect(bucketName).toBeTruthy();
      expect(tableName).toBeTruthy();
      expect(lambdaFunctionName).toBeTruthy();
      expect(region).toBeTruthy();
    });

    test('DynamoDB: Put/Get/Delete item works in PAY_PER_REQUEST table', async () => {
      const id = `it-${Date.now()}`;
      // Put
      await ddb.send(new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          createdAt: { N: `${Date.now()}` },
          payload: { S: 'integration-test' },
        },
        ReturnConsumedCapacity: 'TOTAL',
      }));
      // Get
      const got = await ddb.send(new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: id } },
        ConsistentRead: true,
      }));
      expect(got.Item?.id?.S).toBe(id);
      expect(got.Item?.payload?.S).toBe('integration-test');
      // Cleanup
      await ddb.send(new DeleteItemCommand({
        TableName: tableName,
        Key: { id: { S: id } },
      }));
      // PITR state matches environment (dev: disabled, prod: enabled)
      const pitr = await ddb.send(new DescribeContinuousBackupsCommand({ TableName: tableName }));
      const status = pitr.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
      if (environmentSuffix === 'prod' || envFromName === 'prod') {
        expect(status).toBe('ENABLED');
      } else {
        // dev
        expect(['DISABLED', undefined]).toContain(status);
      }
    });

    test('S3: Put/Get/Delete object; versioning & encryption & public-block enforced; TLS-only policy present', async () => {
      const key = `int-test/${Date.now()}.txt`;
      const body = `hello from integration test ${new Date().toISOString()}`;
      // Put
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
      }));
      // Get
      const get = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const read = await readStreamToString(get.Body as any);
      expect(read).toBe(body);
      // Versioning
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(ver.Status).toBe('Enabled');
      // Encryption
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      const algo = rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(algo).toBe('AES256');
      // Public access block
      const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      const cfg = pab.PublicAccessBlockConfiguration!;
      expect(cfg.BlockPublicAcls && cfg.BlockPublicPolicy && cfg.IgnorePublicAcls && cfg.RestrictPublicBuckets).toBe(true);
      // Policy contains TLS-only deny
      const pol = await s3.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
      const policyDoc = JSON.parse(pol.Policy as string);
      const denyTls = policyDoc.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyTls?.Effect).toBe('Deny');
      // Cleanup
      await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    });

    test('Lambda: invoke returns expected payload and env wiring; function attached to VPC with private subnets', async () => {
      // Invoke
      const resp = await lambda.send(new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({ ping: true })),
      }));
      expect(resp.StatusCode).toBeGreaterThanOrEqual(200);
      expect(resp.StatusCode).toBeLessThan(300);
      const payloadStr = Buffer.from(resp.Payload as Uint8Array).toString('utf8');
      const parsed = JSON.parse(payloadStr);
      const body = JSON.parse(parsed.body);
      expect(body.environment).toBe(envFromName);
      expect(body.table).toBe(tableName);
      expect(body.bucket).toBe(bucketName);
      // Configuration & VPC
      const cfg = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionName }));
      expect(cfg.VpcConfig?.SubnetIds).toEqual(expect.arrayContaining([privateSubnet1Id, privateSubnet2Id]));
      expect(cfg.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThanOrEqual(1);
    });

    test('Secrets Manager: DB credentials secret is present and structured {username,password}', async () => {
      const sec = await secrets.send(new GetSecretValueCommand({ SecretId: secretArn }));
      expect(sec.ARN).toBe(secretArn);
      const secret = JSON.parse(sec.SecretString || '{}');
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(typeof secret.password).toBe('string');
      expect(secret.password.length).toBeGreaterThanOrEqual(12);
    });

    test('RDS: instance is available and endpoint/port match outputs', async () => {
      // Find instance by matching endpoint address
      const desc = await rds.send(new DescribeDBInstancesCommand({}));
      const match = (desc.DBInstances || []).find(db => db.Endpoint?.Address === rdsEndpoint);
      expect(match).toBeDefined();
      expect(match!.DBInstanceStatus).toBe('available');
      expect(match!.Endpoint?.Port).toBe(rdsPort);
      expect(['postgres', 'mysql']).toContain(match!.Engine);
      // engine version should look like "15.x" or "15.x-rY" for postgres (template default)
      if (match!.Engine === 'postgres') {
        expect(/^15(\.|$)/.test(match!.EngineVersion || '')).toBe(true);
      }
    });

    test('SNS: publish succeeds to alarms topic', async () => {
      const res = await sns.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: 'integration-test',
        Message: JSON.stringify({
          ts: new Date().toISOString(),
          test: 'sns-publish',
        }),
      }));
      expect(res.MessageId).toBeDefined();
    });

    test('CloudWatch Logs: lambda log group exists with correct retention (14 dev / 30 prod)', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const lg = await logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      }));
      const found = (lg.logGroups || []).find(g => g.logGroupName === logGroupName);
      expect(found).toBeDefined();
      if (envFromName === 'prod' || environmentSuffix === 'prod') {
        expect(found!.retentionInDays).toBe(30);
      } else {
        expect(found!.retentionInDays).toBe(14);
      }
    });

    test('CloudWatch Alarms: all expected alarms exist and point to the SNS topic', async () => {
      const res = await cw.send(new DescribeAlarmsCommand({
        AlarmNames: alarmNames,
      }));
      const namesReturned = new Set((res.MetricAlarms || []).map(a => a.AlarmName));
      alarmNames.forEach(n => expect(namesReturned.has(n)).toBe(true));
      (res.MetricAlarms || []).forEach(a => {
        expect(a.AlarmActions || []).toEqual(expect.arrayContaining([topicArn]));
      });
    });

    test('Networking: VPC attributes, IGW attachment, NAT, and subnets exist', async () => {
      // VPC exists
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcs.Vpcs?.[0]?.VpcId).toBe(vpcId);
      // DNS attributes
      const dnsSupport = await ec2.send(new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsSupport' }));
      const dnsHost = await ec2.send(new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsHostnames' }));
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHost.EnableDnsHostnames?.Value).toBe(true);
      // IGW attached (AWS often reports state "available" rather than "attached")
      const igw = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
      const att = igw.InternetGateways?.[0]?.Attachments || [];
      const attached = att.some(a => a.VpcId === vpcId && ['available', 'attached'].includes((a.State || '').toLowerCase()));
      expect(attached).toBe(true);
      // NAT GW available
      const nat = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [nat1Id] }));
      expect(nat.NatGateways?.[0]?.State).toBe('available');
      // Subnets exist
      const subnets = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [privateSubnet1Id, privateSubnet2Id] }));
      expect(subnets.Subnets?.length).toBe(2);
      subnets.Subnets?.forEach(s => expect(s.VpcId).toBe(vpcId));
    });
  });
});
