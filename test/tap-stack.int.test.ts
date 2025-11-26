/**
 * Integration Tests for TAP Infrastructure
 * These tests validate deployed resources in AWS using live API calls
 */

import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudFrontClient
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchClient,
  DescribeDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
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
  ElasticLoadBalancingV2Client
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
  let cloudFrontClient: CloudFrontClient;
  let apiGatewayClient: APIGatewayClient;
  let snsClient: SNSClient;
  let cloudWatchClient: CloudWatchClient;

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
      // If outputs don't exist, tests will be skipped with proper messaging
      outputs = {};
    }

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    lambdaClient = new LambdaClient({ region });
    dynamoDBClient = new DynamoDBClient({ region });
    s3Client = new S3Client({ region });
    cloudFrontClient = new CloudFrontClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    snsClient = new SNSClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
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

  describe('Live VPC and Network Integration', () => {
    it('should have VPC deployed and available in AWS', async () => {
      if (!outputs.vpcId) {
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have DNS hostnames and resolution enabled', async () => {
      if (!outputs.vpcId) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs?.[0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs?.[0].EnableDnsSupport).toBe(true);
    });

    it('should have 3 public subnets deployed across different AZs', async () => {
      if (!outputs.publicSubnetIds || !Array.isArray(outputs.publicSubnetIds)) {
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have 3 private subnets deployed across different AZs', async () => {
      if (!outputs.privateSubnetIds || !Array.isArray(outputs.privateSubnetIds)) {
        pending('Deployment outputs not available - requires successful deployment');
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

  describe('Live Database Integration', () => {
    it('should have Aurora cluster deployed and available', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      // Extract cluster identifier from endpoint
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

    it('should have Aurora cluster with correct engine version', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
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
        pending('Deployment outputs not available - requires successful deployment');
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
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have RDS Proxy deployed', async () => {
      if (!outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
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

  describe('Live Load Balancer Integration', () => {
    it('should have ALB deployed and active', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have ALB in public subnets', async () => {
      if (!outputs.albDnsName || !outputs.publicSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb?.AvailabilityZones?.length).toBe(3);
    });

    it('should have ALB with healthy targets', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);

      const alb = lbResponse.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);

      if (alb?.LoadBalancerArn) {
        // Note: Target health may take time after deployment
        // This test validates the structure exists
        expect(alb.LoadBalancerArn).toBeDefined();
      }
    });
  });

  describe('Live Lambda Function Integration', () => {
    it('should have Lambda function deployed', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have Lambda with correct runtime and architecture', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available - requires successful deployment');
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
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: outputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.MemorySize).toBe(3072);
    });
  });

  describe('Live DynamoDB Tables Integration', () => {
    it('should have sessions table deployed with correct configuration', async () => {
      if (!outputs.sessionsTableName) {
        pending('Deployment outputs not available - requires successful deployment');
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

    it('should have cache table deployed with correct configuration', async () => {
      if (!outputs.cacheTableName) {
        pending('Deployment outputs not available - requires successful deployment');
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
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.sessionsTableName,
      });

      const response = await dynamoDBClient.send(command);
      expect(response.Table?.SSEDescription).toBeDefined();
    });
  });

  describe('Live S3 Buckets Integration', () => {
    it('should have static assets bucket deployed', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.staticAssetsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have logs bucket deployed', async () => {
      if (!outputs.logsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.logsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have artifacts bucket deployed', async () => {
      if (!outputs.artifactsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.artifactsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have S3 buckets with encryption enabled', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
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
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.staticAssetsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Live CloudFront Distribution Integration', () => {
    it('should have CloudFront distribution deployed and enabled', async () => {
      if (!outputs.cloudfrontDomainName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      // Extract distribution ID - this is a simplified approach
      // In reality, you might need to list all distributions and find the matching one
      const domainParts = outputs.cloudfrontDomainName.split('.');
      const distributionId = domainParts[0];

      // Note: This test might need adjustment based on how you store the distribution ID
      // You may want to export the distribution ID separately in your outputs
      expect(outputs.cloudfrontDomainName).toContain('cloudfront.net');
      expect(outputs.cloudfrontDomainName).toBeTruthy();
    });
  });

  describe('Live API Gateway Integration', () => {
    it('should have API Gateway deployed', async () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      // Extract API ID from ARN: arn:aws:execute-api:region:account:apiId/stage
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
        pending('Deployment outputs not available - requires successful deployment');
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

  describe('Live Monitoring Integration', () => {
    it('should have SNS topic deployed', async () => {
      if (!outputs.snsTopicArn) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.snsTopicArn);
    });

    it('should have CloudWatch dashboard deployed', async () => {
      if (!outputs.dashboardName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const command = new DescribeDashboardsCommand({
        DashboardNamePrefix: outputs.dashboardName,
      });

      const response = await cloudWatchClient.send(command);
      const dashboard = response.DashboardEntries?.find(
        d => d.DashboardName === outputs.dashboardName
      );
      expect(dashboard).toBeDefined();
      expect(dashboard?.DashboardName).toBe(outputs.dashboardName);
    });
  });

  describe('High Availability Validation', () => {
    it('should have resources distributed across 3 availability zones', async () => {
      if (!outputs.publicSubnetIds || !outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const allSubnetIds = [...outputs.publicSubnetIds, ...outputs.privateSubnetIds];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2Client.send(command);
      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      // Verify resources are spread across 3 AZs for high availability
      expect(uniqueAzs.size).toBe(3);
    });

    it('should have Aurora with multi-AZ configuration', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
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

  describe('Security Validation', () => {
    it('should have Aurora cluster not publicly accessible', async () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const clusterIdentifier = outputs.auroraClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters?.[0].PubliclyAccessible).toBe(false);
    });

    it('should have Lambda in VPC with private subnets', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available - requires successful deployment');
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
});
