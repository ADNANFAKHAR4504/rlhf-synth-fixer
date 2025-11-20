import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  const region = 'us-east-1';

  // AWS SDK clients
  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const lambdaClient = new LambdaClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });
  const cloudWatchClient = new CloudWatchClient({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.lambdaArn).toBeDefined();
      expect(outputs.apiUrl).toBeDefined();
    });

    it('should have valid output formats', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.rdsEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.lambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.apiUrl).toContain('.amazonaws.com');
    });
  });

  describe('VPC Configuration', () => {
    it('should have VPC deployed', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.vpcId);
    });

    it('should have public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
    });

    it('should have NAT gateways', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      });
      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have internet gateway', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      });
      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Bucket', () => {
    it('should have S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('Lambda Function', () => {
    it('should have Lambda function deployed', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(outputs.lambdaArn);
    });

    it('should be in VPC', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(outputs.vpcId);
    });

    it('should have environment variables configured', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.RDS_ENDPOINT
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.S3_BUCKET
      ).toBeDefined();
    });

    it('should be invocable', async () => {
      const functionName = outputs.lambdaArn.split(':').pop();
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify({ test: 'data' })),
      });
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    it('should have API Gateway deployed', async () => {
      const apiId = outputs.apiUrl.split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(apiId);
    });

    it('should have stage deployed', async () => {
      const apiId = outputs.apiUrl.split('.')[0];
      const stageName = outputs.apiUrl.split('/').pop();
      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: stageName!,
      });
      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe(stageName);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have RDS CPU alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'rds-cpu-alarm',
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    it('should have Lambda log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/data-processor',
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    it('should have API Gateway log group', async () => {
      const apiId = outputs.apiUrl.split('.')[0];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/apigateway/${apiId}`,
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should have Lambda security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'group-name', Values: ['*lambda-sg*'] },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });

    it('should have RDS security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'group-name', Values: ['*rds-sg*'] },
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    it('should have tags on VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs?.[0].Tags).toBeDefined();
      expect(response.Vpcs?.[0].Tags!.length).toBeGreaterThan(0);
    });

    it('should have environment tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);
      const envTag = response.Vpcs?.[0].Tags?.find(
        (tag) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });
  });
});
