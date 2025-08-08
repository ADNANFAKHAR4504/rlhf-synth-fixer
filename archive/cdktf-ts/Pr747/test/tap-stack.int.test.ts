import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });

describe('TAP Stack Core AWS Infrastructure', () => {
  let vpcId: string;
  let bastionSgId: string;
  let rdsSgId: string;
  let logBucketName: string;
  let secretArn: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['vpcId'];
    bastionSgId = stackOutputs['bastionSecurityGroupId'];
    rdsSgId = stackOutputs['rdsSecurityGroupId'];
    logBucketName = stackOutputs['logBucketName'];
    secretArn = stackOutputs['DatabaseSecretArn'];
    // rdsEndpoint = stackOutputs['rdsInstanceEndpoint'];

    if (!vpcId || !bastionSgId || !rdsSgId || !logBucketName || !secretArn ) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // VPC Test
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // Security Groups Test
  describe('Security Groups', () => {
    test(`should have Bastion SG "${bastionSgId}" in the VPC`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] }));
      expect(SecurityGroups?.[0].GroupId).toBe(bastionSgId);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);

    test(`should have RDS SG "${rdsSgId}" in the VPC`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId] }));
      expect(SecurityGroups?.[0].GroupId).toBe(rdsSgId);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);
  });

  // S3 Logging Bucket Test
  describe('S3 Logging Bucket', () => {
    test(`should have logging bucket "${logBucketName}" in correct region`, async () => {
      const { LocationConstraint } = await s3Client.send(new GetBucketLocationCommand({ Bucket: logBucketName }));
      const expectedRegion = LocationConstraint || 'us-east-1';
      expect(expectedRegion).toBe(awsRegion);
    }, 20000);
  });

  // Secrets Manager Test
  describe('RDS Secrets', () => {
    test(`should have secret ARN "${secretArn}" available in Secrets Manager`, async () => {
      const { ARN } = await secretsClient.send(new DescribeSecretCommand({ SecretId: secretArn }));
      expect(ARN).toBe(secretArn);
    }, 20000);
  });
});
