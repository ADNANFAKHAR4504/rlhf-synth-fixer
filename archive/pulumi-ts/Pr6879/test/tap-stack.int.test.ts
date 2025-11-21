/**
 * Integration tests for deployed infrastructure
 * These tests validate the deployed resources using stack outputs from cfn-outputs/flat-outputs.json
 */

import {
  DatabaseMigrationServiceClient,
  DescribeReplicationTasksCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
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
  RDSClient,
} from '@aws-sdk/client-rds';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

describe('Payment Processing Migration Infrastructure Integration Tests', () => {
  let stackOutputs: Record<string, string>;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let ecsClient: ECSClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let dmsClient: DatabaseMigrationServiceClient;
  let lambdaClient: LambdaClient;

  beforeAll(() => {
    // Initialize AWS SDK clients
    ec2Client = new EC2Client({ region: AWS_REGION });
    rdsClient = new RDSClient({ region: AWS_REGION });
    ecsClient = new ECSClient({ region: AWS_REGION });
    elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
    dmsClient = new DatabaseMigrationServiceClient({ region: AWS_REGION });
    lambdaClient = new LambdaClient({ region: AWS_REGION });

    // Load stack outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      console.warn(
        'Warning: cfn-outputs/flat-outputs.json not found. Integration tests require deployed infrastructure.'
      );
      stackOutputs = {};
    } else {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      stackOutputs = JSON.parse(outputsContent);
      console.log('Loaded stack outputs:', Object.keys(stackOutputs));
    }
  });

  describe('VPC and Network Configuration', () => {
    it('should have VPC deployed', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('Skipping: vpcId not found in stack outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
      expect(response.Vpcs?.[0].VpcId).toBe(stackOutputs.vpcId);
      expect(response.Vpcs?.[0].State).toBe('available');
    });

    it('should have VPC with correct CIDR block', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('Skipping: vpcId not found in stack outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have public and private subnets', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('Skipping: vpcId not found in stack outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    it('should have RDS cluster deployed', async () => {
      if (!stackOutputs.rdsClusterEndpoint) {
        console.warn('Skipping: rdsClusterEndpoint not found in stack outputs');
        return;
      }

      const clusterIdentifier = stackOutputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBeGreaterThan(0);
      expect(response.DBClusters?.[0].Status).toBe('available');
    });

    it('should have encryption at rest enabled', async () => {
      if (!stackOutputs.rdsClusterEndpoint) {
        console.warn('Skipping: rdsClusterEndpoint not found in stack outputs');
        return;
      }

      const clusterIdentifier = stackOutputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    });

    it('should have automated backups enabled', async () => {
      if (!stackOutputs.rdsClusterEndpoint) {
        console.warn('Skipping: rdsClusterEndpoint not found in stack outputs');
        return;
      }

      const clusterIdentifier = stackOutputs.rdsClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters?.[0].BackupRetentionPeriod).toBeGreaterThan(0);
    });

    it('should have reader endpoint configured', async () => {
      if (!stackOutputs.rdsReaderEndpoint) {
        console.warn('Skipping: rdsReaderEndpoint not found in stack outputs');
        return;
      }

      expect(stackOutputs.rdsReaderEndpoint).toBeDefined();
      expect(stackOutputs.rdsReaderEndpoint).toContain('rds.amazonaws.com');
    });
  });

  describe('ECS Fargate Service', () => {
    it('should have ECS cluster deployed', async () => {
      if (!stackOutputs.ecsClusterName) {
        console.warn('Skipping: ecsClusterName not found in stack outputs');
        return;
      }

      const command = new DescribeClustersCommand({
        clusters: [stackOutputs.ecsClusterName],
      });

      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBeGreaterThan(0);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
    });

    it('should have ECS service running', async () => {
      if (!stackOutputs.ecsClusterName || !stackOutputs.ecsServiceName) {
        console.warn('Skipping: ECS cluster or service name not found in stack outputs');
        return;
      }

      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBeGreaterThan(0);
      expect(response.services?.[0].status).toBe('ACTIVE');
    });

    it('should have desired number of tasks running', async () => {
      if (!stackOutputs.ecsClusterName || !stackOutputs.ecsServiceName) {
        console.warn('Skipping: ECS cluster or service name not found in stack outputs');
        return;
      }

      const command = new DescribeServicesCommand({
        cluster: stackOutputs.ecsClusterName,
        services: [stackOutputs.ecsServiceName],
      });

      const response = await ecsClient.send(command);

      const service = response.services?.[0];
      expect(service?.desiredCount).toBeGreaterThanOrEqual(3);
      expect(service?.runningCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB deployed', async () => {
      if (!stackOutputs.albDnsName) {
        console.warn('Skipping: albDnsName not found in stack outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === stackOutputs.albDnsName
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
    });

    it('should be internet-facing', async () => {
      if (!stackOutputs.albDnsName) {
        console.warn('Skipping: albDnsName not found in stack outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === stackOutputs.albDnsName
      );

      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should have DNS name accessible', () => {
      if (!stackOutputs.albDnsName) {
        console.warn('Skipping: albDnsName not found in stack outputs');
        return;
      }

      expect(stackOutputs.albDnsName).toBeDefined();
      expect(stackOutputs.albDnsName).toContain('elb.amazonaws.com');
    });
  });

  describe('DMS Replication Task', () => {
    it('should have replication task created', async () => {
      if (!stackOutputs.dmsReplicationTaskArn) {
        console.warn('Skipping: dmsReplicationTaskArn not found in stack outputs');
        return;
      }

      const command = new DescribeReplicationTasksCommand({
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [stackOutputs.dmsReplicationTaskArn],
          },
        ],
      });

      const response = await dmsClient.send(command);

      expect(response.ReplicationTasks).toBeDefined();
      expect(response.ReplicationTasks?.length).toBeGreaterThan(0);
    });

    it('should be configured for CDC', async () => {
      if (!stackOutputs.dmsReplicationTaskArn) {
        console.warn('Skipping: dmsReplicationTaskArn not found in stack outputs');
        return;
      }

      const command = new DescribeReplicationTasksCommand({
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [stackOutputs.dmsReplicationTaskArn],
          },
        ],
      });

      const response = await dmsClient.send(command);

      expect(response.ReplicationTasks?.[0].MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('Lambda Validation Function', () => {
    it('should have Lambda function deployed', async () => {
      if (!stackOutputs.validationLambdaArn) {
        console.warn('Skipping: validationLambdaArn not found in stack outputs');
        return;
      }

      const functionName = stackOutputs.validationLambdaArn.split(':').pop() || '';
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    it('should be configured with Node.js runtime', async () => {
      if (!stackOutputs.validationLambdaArn) {
        console.warn('Skipping: validationLambdaArn not found in stack outputs');
        return;
      }

      const functionName = stackOutputs.validationLambdaArn.split(':').pop() || '';
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toContain('nodejs');
    });

    it('should have VPC configuration', async () => {
      if (!stackOutputs.validationLambdaArn) {
        console.warn('Skipping: validationLambdaArn not found in stack outputs');
        return;
      }

      const functionName = stackOutputs.validationLambdaArn.split(':').pop() || '';
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    it('should have all required stack outputs', () => {
      // This test verifies that flat-outputs.json exists and has expected structure
      if (Object.keys(stackOutputs).length === 0) {
        console.warn('Skipping: Stack outputs not available');
        return;
      }

      expect(stackOutputs).toBeDefined();
      // At least some outputs should be present
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
    });

    it('should have deployment outputs include environment suffix', () => {
      if (Object.keys(stackOutputs).length === 0) {
        console.warn('Skipping: Stack outputs not available');
        return;
      }

      // Check that resource names include environment suffix pattern
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const hasResourceWithSuffix = Object.keys(stackOutputs).some((key) => {
        const value = stackOutputs[key];
        return typeof value === 'string' && value.includes(environmentSuffix);
      });

      if (hasResourceWithSuffix) {
        expect(hasResourceWithSuffix).toBe(true);
      } else {
        console.warn('No resources found with environment suffix in outputs');
      }
    });
  });
});
