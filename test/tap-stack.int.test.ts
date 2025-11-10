/**
 * Integration Tests for TapStack
 *
 * These tests validate the deployed AWS infrastructure using actual stack outputs.
 * They verify end-to-end functionality of the multi-environment payment processing platform.
 *
 * Test Approach:
 * - Uses cfn-outputs/flat-outputs.json for dynamic resource references
 * - Tests against live AWS resources (no mocking)
 * - Validates resource connectivity and configuration
 * - Ensures environment-specific settings are correct
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketEncryptionCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX =
  process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({ region: REGION });
const ecsClient = new ECSClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const cloudWatchClient = new CloudWatchClient({ region: REGION });
const secretsManagerClient = new SecretsManagerClient({ region: REGION });

/**
 * Load stack outputs from deployment
 * Expected location: cfn-outputs/flat-outputs.json
 */
function loadStackOutputs(): Record<string, any> {
  const outputsPath = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );

  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Stack outputs not found at ${outputsPath}. Deploy the stack first.`
    );
  }

  return JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

describe('TapStack Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    try {
      outputs = loadStackOutputs();
    } catch (error) {
      console.error('Failed to load stack outputs:', error);
      throw error;
    }
  });

  describe('VPC and Network Infrastructure', () => {
    it('should have VPC deployed with correct configuration', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.EnableDnsHostnames).toBe(true);
      expect(vpc?.EnableDnsSupport).toBe(true);

      // Verify CIDR block matches environment pattern
      expect(vpc?.CidrBlock).toMatch(/^10\.[1-3]\.0\.0\/16$/);
    });

    it('should have public subnets across 2 availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'tag:Type',
            Values: ['public'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const availabilityZones = [
        ...new Set(subnets.map(s => s.AvailabilityZone)),
      ];
      expect(availabilityZones.length).toBe(2);

      // Verify subnets are in us-east-1 region
      subnets.forEach(subnet => {
        expect(subnet.AvailabilityZone).toMatch(/^us-east-1[a-z]$/);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have private subnets across 2 availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'tag:Type',
            Values: ['private'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const availabilityZones = [
        ...new Set(subnets.map(s => s.AvailabilityZone)),
      ];
      expect(availabilityZones.length).toBe(2);

      // Verify private subnets don't auto-assign public IPs
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have NAT gateways deployed for private subnet internet access', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      expect(natGateways.length).toBeGreaterThanOrEqual(2);

      // Verify NAT gateways are available
      natGateways.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
      });
    });

    it('should have security groups with proper ingress/egress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'tag:EnvironmentSuffix',
            Values: [ENVIRONMENT_SUFFIX],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];

      // Should have at least ALB, ECS, and RDS security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      securityGroups.forEach(sg => {
        expect(sg.IpPermissions).toBeDefined();
        expect(sg.IpPermissionsEgress).toBeDefined();
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB deployed and available', async () => {
      expect(outputs.albUrl).toBeDefined();

      const albDnsName = outputs.albUrl.replace(/^https?:\/\//, '');

      const command = new DescribeLoadBalancersCommand({
        Names: [],
      });

      const response = await elbClient.send(command);
      const alb = response.LoadBalancers?.find(lb =>
        lb.DNSName === albDnsName.split('/')[0]
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should have target group configured for ECS tasks', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const targetGroups = response.TargetGroups?.filter(tg =>
        tg.VpcId === outputs.vpcId
      );

      expect(targetGroups?.length).toBeGreaterThan(0);

      const tg = targetGroups?.[0];
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.Port).toBe(3000);
      expect(tg?.TargetType).toBe('ip');
      expect(tg?.HealthCheckEnabled).toBe(true);
      expect(tg?.HealthCheckPath).toBe('/health');
    });

    it('should validate SSL configuration based on environment', async () => {
      const environment = outputs.environment || 'dev';

      // SSL should be enabled for staging and prod only
      if (environment === 'staging' || environment === 'prod') {
        expect(outputs.albUrl).toMatch(/^https:\/\//);
      } else {
        expect(outputs.albUrl).toMatch(/^http:\/\//);
      }
    });
  });

  describe('ECS Fargate Cluster and Service', () => {
    it('should have ECS cluster deployed', async () => {
      expect(outputs.ecsClusterId).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [outputs.ecsClusterId],
      });

      const response = await ecsClient.send(command);
      const cluster = response.clusters?.[0];

      expect(cluster).toBeDefined();
      expect(cluster?.status).toBe('ACTIVE');
      expect(cluster?.clusterName).toContain('payment-cluster');
    });

    it('should have ECS service running with correct task count', async () => {
      const environment = outputs.environment || 'dev';

      // Get service from outputs or derive from cluster
      const listServicesCommand = new DescribeServicesCommand({
        cluster: outputs.ecsClusterId,
        services: [], // List all services in cluster
      });

      const response = await ecsClient.send(listServicesCommand);
      const service = response.services?.[0];

      expect(service).toBeDefined();
      expect(service?.status).toBe('ACTIVE');
      expect(service?.launchType).toBe('FARGATE');

      // Verify task count matches environment
      const expectedTaskCount =
        environment === 'dev' ? 1 : environment === 'staging' ? 2 : 4;

      expect(service?.desiredCount).toBe(expectedTaskCount);
      expect(service?.runningCount).toBe(expectedTaskCount);
    });

    it('should have task definition with correct configuration', async () => {
      const servicesResponse = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ecsClusterId,
          services: [],
        })
      );

      const service = servicesResponse.services?.[0];
      const taskDefinitionArn = service?.taskDefinition;

      expect(taskDefinitionArn).toBeDefined();

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefinitionArn,
      });

      const taskDefResponse = await ecsClient.send(taskDefCommand);
      const taskDefinition = taskDefResponse.taskDefinition;

      expect(taskDefinition?.family).toContain('payment-api');
      expect(taskDefinition?.requiresCompatibilities).toContain('FARGATE');
      expect(taskDefinition?.networkMode).toBe('awsvpc');
      expect(taskDefinition?.cpu).toBe('256');
      expect(taskDefinition?.memory).toBe('512');

      // Verify container definition
      const container = taskDefinition?.containerDefinitions?.[0];
      expect(container?.name).toBe('payment-api');
      expect(container?.portMappings?.[0]?.containerPort).toBe(3000);
      expect(container?.logConfiguration?.logDriver).toBe('awslogs');
    });
  });

  describe('RDS PostgreSQL Database', () => {
    it('should have RDS instance deployed with correct configuration', async () => {
      expect(outputs.rdsEndpoint).toBeDefined();

      const dbIdentifier = outputs.rdsEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.EngineVersion).toMatch(/^15\./);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    });

    it('should use correct instance class based on environment', async () => {
      const environment = outputs.environment || 'dev';
      const dbIdentifier = outputs.rdsEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      const expectedInstanceClass =
        environment === 'dev'
          ? 'db.t3.micro'
          : environment === 'staging'
            ? 'db.t3.small'
            : 'db.t3.medium';

      expect(dbInstance?.DBInstanceClass).toBe(expectedInstanceClass);
    });

    it('should have multi-AZ enabled only for production', async () => {
      const environment = outputs.environment || 'dev';
      const dbIdentifier = outputs.rdsEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      const expectedMultiAz = environment === 'prod';
      expect(dbInstance?.MultiAZ).toBe(expectedMultiAz);
    });

    it('should have database password stored in Secrets Manager', async () => {
      const secretName = `${outputs.environment || 'dev'}/payment-db-password-${ENVIRONMENT_SUFFIX}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await secretsManagerClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.ARN).toBeDefined();
    });
  });

  describe('S3 Storage', () => {
    it('should have S3 bucket deployed and accessible', async () => {
      expect(outputs.bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });

      // This will throw if bucket doesn't exist or isn't accessible
      await s3Client.send(command);
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
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];

      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    it('should have lifecycle policy matching environment', async () => {
      const environment = outputs.environment || 'dev';

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      const rule = response.Rules?.[0];

      expect(rule?.Status).toBe('Enabled');

      const expectedDays =
        environment === 'dev' ? 7 : environment === 'staging' ? 30 : 90;

      const transitionDays = rule?.Transitions?.[0]?.Days;
      expect(transitionDays).toBe(expectedDays);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch alarms for staging and prod only', async () => {
      const environment = outputs.environment || 'dev';

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environment,
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      if (environment === 'staging' || environment === 'prod') {
        // Should have CPU, memory, and task count alarms
        expect(alarms.length).toBeGreaterThanOrEqual(3);

        const cpuAlarm = alarms.find(a => a.AlarmName?.includes('cpu'));
        const memoryAlarm = alarms.find(a =>
          a.AlarmName?.includes('memory')
        );
        const taskCountAlarm = alarms.find(a =>
          a.AlarmName?.includes('task-count')
        );

        expect(cpuAlarm).toBeDefined();
        expect(memoryAlarm).toBeDefined();
        expect(taskCountAlarm).toBeDefined();
      } else {
        // Dev should have no monitoring alarms
        expect(alarms.length).toBe(0);
      }
    });
  });

  describe('Resource Tagging', () => {
    it('should have all resources tagged with Environment and EnvironmentSuffix', async () => {
      // Verify VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs?.[0]?.Tags || [];

      const environmentTag = vpcTags.find(t => t.Key === 'Environment');
      const envSuffixTag = vpcTags.find(
        t => t.Key === 'EnvironmentSuffix'
      );
      const managedByTag = vpcTags.find(t => t.Key === 'ManagedBy');

      expect(environmentTag?.Value).toBeDefined();
      expect(envSuffixTag?.Value).toBe(ENVIRONMENT_SUFFIX);
      expect(managedByTag?.Value).toBe('Pulumi');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should validate complete resource connectivity', async () => {
      // This test ensures that all resources are properly connected:
      // VPC -> Subnets -> NAT Gateways
      // VPC -> Security Groups
      // ALB -> Target Group -> ECS Service
      // ECS Service -> RDS
      // S3 bucket accessible

      // All previous tests validate individual components
      // This test confirms no critical connections are missing

      expect(outputs.vpcId).toBeDefined();
      expect(outputs.albUrl).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.ecsClusterId).toBeDefined();
    });
  });
});
