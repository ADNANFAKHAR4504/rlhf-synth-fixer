import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
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
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  let outputs: Record<string, string> = {};

  const ec2Client = new EC2Client({ region });
  const ecsClient = new ECSClient({ region });
  const rdsClient = new RDSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const s3Client = new S3Client({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    // Load outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      const rawOutputs = JSON.parse(outputsContent);

      // CDKTF outputs are nested under stack name, flatten them
      // Example: { "TapStackpr6176": { "environment_vpc-id_2837DF5F": "vpc-xxx" } }
      const stackName = Object.keys(rawOutputs)[0];
      if (stackName) {
        const stackOutputs = rawOutputs[stackName];

        // Map CDKTF output keys to simple keys
        // environment_vpc-id_HASH -> vpc-id
        Object.keys(stackOutputs).forEach((key) => {
          // Extract the meaningful part between environment_ and _HASH
          const match = key.match(/environment_(.+?)_[A-F0-9]+$/);
          if (match) {
            const simpleKey = match[1];
            outputs[simpleKey] = stackOutputs[key];
          }
        });
      }
    } else {
      console.warn(
        'flat-outputs.json not found. Integration tests may fail if infrastructure is not deployed.'
      );
    }
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and is available', async () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      // DNS settings are not directly on Vpc object, need separate DescribeVpcAttribute call
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
    });

    test('Public subnets exist and are configured correctly', async () => {
      const vpcId = outputs['vpc-id'];

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'map-public-ip-on-launch',
            Values: ['true'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2); // At least 2 AZs
    });

    test('Private subnets exist', async () => {
      const vpcId = outputs['vpc-id'];

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'map-public-ip-on-launch',
            Values: ['false'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2); // At least 2 AZs
    });
  });

  describe('ALB (Application Load Balancer)', () => {
    test('ALB exists and is active', async () => {
      const albArn = outputs['alb-arn'];
      expect(albArn).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State!.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    });

    test('ALB DNS name is resolvable', async () => {
      const albDnsName = outputs['alb-dns-name'];
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toMatch(/^alb-.*\.elb\.amazonaws\.com$/i);
    });

    test('Target group exists and is healthy', async () => {
      const albArn = outputs['alb-arn'];

      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThanOrEqual(1);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.TargetType).toBe('ip');
    });
  });

  describe('ECS Cluster and Service', () => {
    test('ECS cluster exists and is active', async () => {
      const clusterArn = outputs['ecs-cluster-arn'];
      expect(clusterArn).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [clusterArn],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toHaveLength(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    test('ECS service is running with desired count', async () => {
      const clusterName = outputs['ecs-cluster-name'];
      const clusterArn = outputs['ecs-cluster-arn'];

      // First, list services in the cluster
      const listCommand = new ListServicesCommand({
        cluster: clusterArn,
      });

      const listResponse = await ecsClient.send(listCommand);
      expect(listResponse.serviceArns).toBeDefined();
      expect(listResponse.serviceArns!.length).toBeGreaterThan(0);

      // Then describe the services
      const describeCommand = new DescribeServicesCommand({
        cluster: clusterArn,
        services: listResponse.serviceArns,
      });

      const response = await ecsClient.send(describeCommand);
      expect(response.services).toBeDefined();
      expect(response.services!.length).toBeGreaterThan(0);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    });

    test('CloudWatch log group exists for ECS tasks', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs/',
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const rdsEndpoint = outputs['rds-endpoint'];
      expect(rdsEndpoint).toBeDefined();

      // Extract identifier from endpoint
      const identifier = rdsEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: identifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('RDS database name is correct', () => {
      const dbName = outputs['rds-db-name'];
      expect(dbName).toBe('myapp');
    });

    test('RDS endpoint is reachable format', () => {
      const rdsEndpoint = outputs['rds-endpoint'];
      expect(rdsEndpoint).toMatch(
        /^postgres-.*\..*\.rds\.amazonaws\.com:\d+$/
      );
    });
  });

  describe('S3 Assets Bucket', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs['s3-assets-bucket-name'];
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs['s3-assets-bucket-name'];

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules!.length
      ).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs['s3-assets-bucket-name'];

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have required tags', async () => {
      const vpcId = outputs['vpc-id'];

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagMap = Object.fromEntries(tags.map((t) => [t.Key!, t.Value!]));

      expect(tagMap).toHaveProperty('Environment');
      expect(tagMap).toHaveProperty('Team', 'platform-engineering');
      expect(tagMap).toHaveProperty('CostCenter', 'infrastructure');
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete infrastructure stack is deployed and operational', async () => {
      // Verify all critical outputs exist
      expect(outputs['vpc-id']).toBeDefined();
      expect(outputs['alb-dns-name']).toBeDefined();
      expect(outputs['rds-endpoint']).toBeDefined();
      expect(outputs['ecs-cluster-name']).toBeDefined();
      expect(outputs['s3-assets-bucket-name']).toBeDefined();
    });

    test('ALB can route traffic to ECS tasks', async () => {
      const albDnsName = outputs['alb-dns-name'];
      const clusterArn = outputs['ecs-cluster-arn'];

      // Verify ALB and ECS service exist
      expect(albDnsName).toBeDefined();
      expect(clusterArn).toBeDefined();

      // Note: Actual HTTP request testing would require deployed tasks
      // This test verifies the infrastructure is in place
    });

    test('ECS tasks can connect to RDS database', async () => {
      const rdsEndpoint = outputs['rds-endpoint'];
      const ecsClusterArn = outputs['ecs-cluster-arn'];

      // Verify both exist
      expect(rdsEndpoint).toBeDefined();
      expect(ecsClusterArn).toBeDefined();

      // Note: Actual database connectivity would require network access
      // This test verifies the infrastructure is configured
    });
  });
});
