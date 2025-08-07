import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam'; // Added IAM client
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const STACK_NAME = process.env.STACK_NAME || 'WebAppStack'; // Your deployed stack name
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const secretsManagerClient = new SecretsManagerClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION }); // Initialized IAM client

// --- Read Deployed Stack Outputs ---
let outputs: { [key: string]: string } = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Failed to load cfn-outputs/flat-outputs.json. Skipping integration tests.'
  );
}

// Conditionally run tests only if stack outputs were loaded successfully
const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('Web Application Stack Integration Tests', () => {
  // Resource identifiers fetched from outputs
  const vpcId = outputs.VPCId;
  const albDnsName = outputs.ALBDNSName;
  const rdsEndpoint = outputs.RDSInstanceEndpoint;
  const s3BucketName = outputs.S3BucketName;
  const dbSecretArn = outputs.DBSecretARN;
  const lambdaFunctionName = 'WebApp-Placeholder-Function'; // This name comes from the template

  // Resource identifiers discovered during tests
  let albArn: string;
  let rdsInstanceIdentifier: string;
  let securityGroupIds: { [key: string]: string } = {};

  beforeAll(async () => {
    // Discover the ALB ARN from its DNS name
    const albResponse = await elbv2Client.send(
      new DescribeLoadBalancersCommand({})
    );
    const alb = albResponse.LoadBalancers?.find(
      lb => lb.DNSName === albDnsName
    );
    if (!alb || !alb.LoadBalancerArn)
      throw new Error('Could not find deployed Application Load Balancer');
    albArn = alb.LoadBalancerArn;

    // Discover the RDS Instance Identifier from its endpoint address
    const rdsResponse = await rdsClient.send(
      new DescribeDBInstancesCommand({})
    );
    const rdsInstance = rdsResponse.DBInstances?.find(
      db => db.Endpoint?.Address === rdsEndpoint
    );
    if (!rdsInstance || !rdsInstance.DBInstanceIdentifier)
      throw new Error('Could not find deployed RDS Instance');
    rdsInstanceIdentifier = rdsInstance.DBInstanceIdentifier;

    // Discover Security Group IDs by name
    const sgResponse = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );
    const albSg = sgResponse.SecurityGroups?.find(
      sg => sg.GroupName === 'WebApp-ALB-SG'
    );
    const webSg = sgResponse.SecurityGroups?.find(
      sg => sg.GroupName === 'WebApp-WebServer-SG'
    );
    const dbSg = sgResponse.SecurityGroups?.find(
      sg => sg.GroupName === 'WebApp-Database-SG'
    );

    if (!albSg?.GroupId || !webSg?.GroupId || !dbSg?.GroupId)
      throw new Error('Could not find all required security groups');
    securityGroupIds = {
      alb: albSg.GroupId,
      web: webSg.GroupId,
      db: dbSg.GroupId,
    };
  }, 60000);

  describe('🌐 Networking Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(Vpcs![0].State).toBe('available');
    });

    test('Should have 2 public and 2 private subnets across different AZs', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const publicSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('🛡️ Security (Least Privilege)', () => {
    test('ALB Security Group should allow public HTTP traffic', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.alb] })
      );
      const httpRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 80 && p.IpProtocol === 'tcp'
      );
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Server SG should only allow ingress from ALB SG', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.web] })
      );
      const ingressRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 80
      );
      expect(ingressRule?.UserIdGroupPairs).toHaveLength(1);
      expect(ingressRule?.UserIdGroupPairs?.[0].GroupId).toBe(
        securityGroupIds.alb
      );
    });

    test('Database SG should only allow ingress from Web Server SG', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.db] })
      );
      const ingressRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 5432
      );
      expect(ingressRule?.UserIdGroupPairs).toHaveLength(1);
      expect(ingressRule?.UserIdGroupPairs?.[0].GroupId).toBe(
        securityGroupIds.web
      );
    });

    // --- NEW ROBUST TEST ---
    test("Lambda function's IAM role should have the correct trust policy", async () => {
      // 1. Get the Lambda function's configuration to find its role ARN
      const { Configuration } = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );
      const roleArn = Configuration?.Role;
      expect(roleArn).toBeDefined();

      // 2. Extract the role name from the ARN (e.g., 'WebAppStack-MyRole-123ABC')
      const roleName = roleArn!.split('/').pop();

      // 3. Get the role from IAM using the extracted name
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role).toBeDefined();

      // 4. Decode and parse the AssumeRolePolicyDocument to verify who can assume it
      const trustPolicy = JSON.parse(
        decodeURIComponent(Role!.AssumeRolePolicyDocument!)
      );
      const principalService = trustPolicy.Statement[0].Principal.Service;

      expect(principalService).toBe('lambda.amazonaws.com');
    });
  });

  describe('🗄️ Database & Secrets', () => {
    test('RDS instance should be encrypted, Multi-AZ, and running PostgreSQL', async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: rdsInstanceIdentifier,
        })
      );
      expect(DBInstances).toHaveLength(1);
      const db = DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
      expect(db.MultiAZ).toBe(true);
      expect(db.Engine).toBe('postgres');
    });

    test('Secrets Manager secret should exist and be accessible', async () => {
      const { ARN } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: dbSecretArn })
      );
      expect(ARN).toBe(dbSecretArn);
    });
  });

  describe('📦 Storage, Functions, and Load Balancing', () => {
    test('S3 Bucket should have versioning enabled and public access blocked', async () => {
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      const config = publicAccess.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
    });

    test('Lambda function should be configured correctly in the VPC', async () => {
      const { Configuration } = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaFunctionName,
        })
      );
      expect(Configuration?.PackageType).toBe('Image');
      expect(Configuration?.VpcConfig?.VpcId).toBe(vpcId);
      expect(Configuration?.VpcConfig?.SecurityGroupIds).toContain(
        securityGroupIds.web
      );
    });

    test('Application Load Balancer should be internet-facing and have an HTTP listener', async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );
      expect(LoadBalancers![0].Scheme).toBe('internet-facing');

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );
      const httpListener = Listeners?.find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );
      expect(httpListener).toBeDefined();
      expect(httpListener?.DefaultActions?.[0].Type).toBe('forward');
    });
  });
});
