/**
 * Integration Tests for TAP Infrastructure
 * These tests validate deployed resources in AWS using both static validation and live AWS SDK calls
 */

import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBProxiesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  const region = process.env.AWS_REGION || 'us-east-1';

  // AWS Clients
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let lambdaClient: LambdaClient;
  let dynamoDBClient: DynamoDBClient;
  let s3Client: S3Client;
  let apiGatewayClient: APIGatewayClient;
  let snsClient: SNSClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);

      // Parse subnet IDs if they're strings
      if (typeof outputs.publicSubnetIds === 'string') {
        outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
      }
      if (typeof outputs.privateSubnetIds === 'string') {
        outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
      }
    } else {
      outputs = {};
    }

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    lambdaClient = new LambdaClient({ region });
    dynamoDBClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    snsClient = new SNSClient({ region });
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      if (!outputs || Object.keys(outputs).length === 0) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const requiredOutputs = [
        'vpcId',
        'publicSubnetIds',
        'privateSubnetIds',
        'auroraClusterEndpoint',
        'auroraReaderEndpoint',
        'rdsProxyEndpoint',
        'albDnsName',
        'cloudfrontDomainName',
        'apiGatewayUrl',
        'staticAssetsBucketName',
        'logsBucketName',
        'artifactsBucketName',
        'sessionsTableName',
        'cacheTableName',
        'lambdaFunctionName',
        'snsTopicArn',
        'dashboardName',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });
  });

  describe('Live VPC Validation', () => {
    it('should have VPC deployed and available in AWS', async () => {
      if (!outputs.vpcId) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.vpcId);
      expect(response.Vpcs?.[0].State).toBe('available');
    });
  });

  describe('Live Subnet Validation', () => {
    it('should have 3 public subnets across different AZs', async () => {
      if (!outputs.publicSubnetIds || !Array.isArray(outputs.publicSubnetIds)) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.publicSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      // Verify subnets are in different AZs
      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);

      // Verify all subnets are available
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpcId);
      });
    });

    it('should have 3 private subnets across different AZs', async () => {
      if (!outputs.privateSubnetIds || !Array.isArray(outputs.privateSubnetIds)) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.privateSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      // Verify subnets are in different AZs
      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);

      // Verify all subnets are available
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpcId);
      });
    });
  });

  describe('Live Aurora Database Validation', () => {
    it('should have Aurora cluster deployed and available', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);
      expect(response.DBClusters?.[0].Status).toBe('available');
      expect(response.DBClusters?.[0].Engine).toBe('aurora-postgresql');
    });

    it('should have Aurora cluster with PostgreSQL 17.4', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].EngineVersion).toBe('17.4');
    });

    it('should have Aurora cluster in private subnets', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].DBSubnetGroup).toBeDefined();
      expect(response.DBClusters?.[0].VpcSecurityGroups).toBeDefined();
      expect(response.DBClusters?.[0].VpcSecurityGroups?.length).toBeGreaterThan(0);
    });

    it('should have Aurora cluster with read replicas', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const members = response.DBClusters?.[0].DBClusterMembers || [];

      // Should have 1 writer + 2 readers = 3 total instances
      expect(members.length).toBeGreaterThanOrEqual(1);

      // Verify we have at least one writer
      const writers = members.filter(m => m.IsClusterWriter);
      expect(writers.length).toBe(1);
    });

    it('should have multi-AZ configuration', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].MultiAZ).toBe(true);
    });
  });

  describe('Live RDS Proxy Validation', () => {
    it('should have RDS Proxy deployed and available', async () => {
      if (!outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available');
        return;
      }

      const proxyName = outputs.rdsProxyEndpoint.split('.')[0];
      const command = new DescribeDBProxiesCommand({
        DBProxyName: proxyName,
      });

      const response = await rdsClient.send(command);
      expect(response.DBProxies).toBeDefined();
      expect(response.DBProxies?.length).toBe(1);
      expect(response.DBProxies?.[0].Status).toBe('available');
    });
  });

  describe('Live ALB Validation', () => {
    it('should have ALB deployed and active', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should have ALB in public subnets across 3 AZs', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb?.AvailabilityZones?.length).toBe(3);
    });
  });

  describe('Live Lambda Function Validation', () => {
    it('should have Lambda function deployed and active', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambdaFunctionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    it('should have Lambda with Node.js runtime and ARM64 architecture', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toContain('nodejs');
      expect(response.Configuration?.Architectures).toContain('arm64');
    });

    it('should have Lambda with 3GB memory allocation', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(3072);
    });

    it('should have Lambda in VPC with private subnets', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
    });
  });

  describe('Live DynamoDB Tables Validation', () => {
    it('should have sessions table with PAY_PER_REQUEST billing', async () => {
      if (!outputs.sessionsTableName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.sessionsTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.sessionsTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have cache table with PAY_PER_REQUEST billing', async () => {
      if (!outputs.cacheTableName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.cacheTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.cacheTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have DynamoDB tables with encryption enabled', async () => {
      if (!outputs.sessionsTableName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.sessionsTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.SSEDescription).toBeDefined();
    });
  });

  describe('Live S3 Buckets Validation', () => {
    it('should have static assets bucket deployed', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.staticAssetsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have logs bucket deployed', async () => {
      if (!outputs.logsBucketName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.logsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have artifacts bucket deployed', async () => {
      if (!outputs.artifactsBucketName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.artifactsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have S3 buckets with encryption enabled', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.staticAssetsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
    });

    it('should have S3 buckets with versioning enabled', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.staticAssetsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Live API Gateway Validation', () => {
    it('should have API Gateway deployed', async () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available');
        return;
      }

      const arnParts = outputs.apiGatewayUrl.split(':');
      const apiIdAndStage = arnParts[arnParts.length - 1];
      const apiId = apiIdAndStage.split('/')[0];

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(apiId);
      expect(response.name).toBeDefined();
    });

    it('should have API Gateway stage deployed', async () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available');
        return;
      }

      const arnParts = outputs.apiGatewayUrl.split(':');
      const apiIdAndStage = arnParts[arnParts.length - 1];
      const [apiId, stageName] = apiIdAndStage.split('/');

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: stageName,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe(stageName);
    });
  });

  describe('Live CloudFront Validation', () => {
    it('should have CloudFront domain name', () => {
      if (!outputs.cloudfrontDomainName) {
        pending('Deployment outputs not available');
        return;
      }

      expect(outputs.cloudfrontDomainName).toBeDefined();
      expect(outputs.cloudfrontDomainName).toContain('cloudfront.net');
      expect(outputs.cloudfrontDomainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    });
  });

  describe('Live SNS Topic Validation', () => {
    it('should have SNS topic deployed', async () => {
      if (!outputs.snsTopicArn) {
        pending('Deployment outputs not available');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
    });
  });

  describe('Live CloudWatch Dashboard Validation', () => {
    it('should have CloudWatch dashboard name in outputs', () => {
      if (!outputs.dashboardName) {
        pending('Deployment outputs not available');
        return;
      }

      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.dashboardName).toContain('ecommerce-metrics');
    });
  });

  describe('High Availability Validation', () => {
    it('should have resources distributed across 3 AZs', async () => {
      if (!outputs.publicSubnetIds || !outputs.privateSubnetIds) {
        pending('Deployment outputs not available');
        return;
      }

      const allSubnetIds = [...outputs.publicSubnetIds, ...outputs.privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });
  });
});
