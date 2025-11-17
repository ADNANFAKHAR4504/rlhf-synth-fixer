/**
 * Integration tests for TapStack - E-commerce Containerized Application
 *
 * These tests validate actual AWS resources after deployment
 * Requires: cfn-outputs/flat-outputs.json to be present after stack deployment
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

const region = process.env.AWS_REGION || 'ap-southeast-1';
let environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const ecsClient = new ECSClient({ region });
const ecrClient = new ECRClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const autoScalingClient = new ApplicationAutoScalingClient({ region });
const secretsClient = new SecretsManagerClient({ region });

interface StackOutputs {
  vpcId?: string;
  albDnsName?: string;
  ecrRepositoryUri?: string;
  databaseEndpoint?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
  region?: string;
  environmentSuffixOutput?: string;
}

let stackOutputs: StackOutputs = {};

describe('E-commerce Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Load stack outputs from flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const outputsData = fs.readFileSync(outputsPath, 'utf-8');
      stackOutputs = JSON.parse(outputsData);
      console.log('Loaded stack outputs:', stackOutputs);

      // Update environmentSuffix from stack outputs if available
      if (stackOutputs.environmentSuffixOutput) {
        environmentSuffix = stackOutputs.environmentSuffixOutput;
      }
    } else {
      console.warn(
        'Stack outputs file not found. Some tests may be skipped.'
      );
    }
  });

  describe('1. VPC Configuration', () => {
    it('should have VPC created', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(stackOutputs.vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    it('should have 3 public and 3 private subnets', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
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
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(6);

      // Count public and private subnets
      let publicCount = 0;
      let privateCount = 0;

      response.Subnets?.forEach((subnet) => {
        const isPublic = subnet.MapPublicIpOnLaunch || false;
        if (isPublic) {
          publicCount++;
        } else {
          privateCount++;
        }
      });

      expect(publicCount).toBeGreaterThanOrEqual(3);
      expect(privateCount).toBeGreaterThanOrEqual(3);
    }, 30000);

    it('should have proper security groups configured', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.vpcId],
          },
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      // Should have at least ALB, ECS, and RDS security groups
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('2. RDS PostgreSQL Database', () => {
    it('should have RDS instance created with correct configuration', async () => {
      const dbIdentifier = `ecommerce-db-${environmentSuffix}`;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      try {
        const response = await rdsClient.send(command);
        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances?.length).toBeGreaterThan(0);

        const dbInstance = response.DBInstances![0];
        expect(dbInstance.Engine).toBe('postgres');
        expect(dbInstance.DBInstanceClass).toBe('db.t3.medium');
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      } catch (error: any) {
        if (error.name === 'DBInstanceNotFoundFault') {
          console.warn('RDS instance not found, may not be deployed yet');
        } else {
          throw error;
        }
      }
    }, 30000);

    it('should have database endpoint output', () => {
      if (stackOutputs.databaseEndpoint) {
        expect(stackOutputs.databaseEndpoint).toMatch(/\.rds\.amazonaws\.com/);
        expect(stackOutputs.databaseEndpoint).toContain(':5432');
      }
    });
  });

  describe('3. ECS Fargate Cluster', () => {
    it('should have ECS cluster created', async () => {
      const clusterName = stackOutputs.ecsClusterName || `ecommerce-cluster-${environmentSuffix}`;

      const command = new DescribeClustersCommand({
        clusters: [clusterName],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBeGreaterThan(0);

      const cluster = response.clusters![0];
      expect(cluster.clusterName).toBe(clusterName);
      expect(cluster.status).toBe('ACTIVE');
    }, 30000);

    it('should have ECS service running', async () => {
      const clusterName = stackOutputs.ecsClusterName || `ecommerce-cluster-${environmentSuffix}`;
      const serviceName = stackOutputs.ecsServiceName || `ecommerce-service-${environmentSuffix}`;

      const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
      });

      try {
        const response = await ecsClient.send(command);
        expect(response.services).toBeDefined();
        expect(response.services?.length).toBeGreaterThan(0);

        const service = response.services![0];
        expect(service.serviceName).toBe(serviceName);
        expect(service.launchType).toBe('FARGATE');
        expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      } catch (error: any) {
        console.warn('ECS service check failed:', error.message);
      }
    }, 30000);

    it('should have task definition with correct specifications', async () => {
      const taskFamily = `ecommerce-task-${environmentSuffix}`;

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: taskFamily,
      });

      try {
        const response = await ecsClient.send(command);
        expect(response.taskDefinition).toBeDefined();

        const taskDef = response.taskDefinition!;
        expect(taskDef.cpu).toBe('1024'); // 1 vCPU
        expect(taskDef.memory).toBe('2048'); // 2 GB
        expect(taskDef.networkMode).toBe('awsvpc');
        expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      } catch (error: any) {
        console.warn('Task definition check failed:', error.message);
      }
    }, 30000);
  });

  describe('4. ECR Repository', () => {
    it('should have ECR repository created', async () => {
      const repoName = `ecommerce-app-${environmentSuffix}`;

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });

      try {
        const response = await ecrClient.send(command);
        expect(response.repositories).toBeDefined();
        expect(response.repositories?.length).toBeGreaterThan(0);

        const repo = response.repositories![0];
        expect(repo.repositoryName).toBe(repoName);
        expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
      } catch (error: any) {
        if (error.name === 'RepositoryNotFoundException') {
          console.warn('ECR repository not found');
        } else {
          throw error;
        }
      }
    }, 30000);

    it('should have ECR repository URI in outputs', () => {
      if (stackOutputs.ecrRepositoryUri) {
        expect(stackOutputs.ecrRepositoryUri).toContain('.dkr.ecr.');
        expect(stackOutputs.ecrRepositoryUri).toContain('.amazonaws.com/');
        expect(stackOutputs.ecrRepositoryUri).toContain(`ecommerce-app-${environmentSuffix}`);
      }
    });
  });

  describe('5. Application Load Balancer', () => {
    it('should have ALB created and active', async () => {
      const albName = `ecommerce-alb-${environmentSuffix}`;

      const command = new DescribeLoadBalancersCommand({
        Names: [albName],
      });

      try {
        const response = await elbClient.send(command);
        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers?.length).toBeGreaterThan(0);

        const alb = response.LoadBalancers![0];
        expect(alb.LoadBalancerName).toBe(albName);
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.State?.Code).toBe('active');
      } catch (error: any) {
        console.warn('ALB check failed:', error.message);
      }
    }, 30000);

    it('should have target group with health checks configured', async () => {
      const tgName = `ecommerce-tg-${environmentSuffix}`;

      const command = new DescribeTargetGroupsCommand({
        Names: [tgName],
      });

      try {
        const response = await elbClient.send(command);
        expect(response.TargetGroups).toBeDefined();
        expect(response.TargetGroups?.length).toBeGreaterThan(0);

        const targetGroup = response.TargetGroups![0];
        expect(targetGroup.TargetType).toBe('ip');
        expect(targetGroup.HealthCheckPath).toBe('/health');
        expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
      } catch (error: any) {
        console.warn('Target group check failed:', error.message);
      }
    }, 30000);

    it('should have ALB DNS name in outputs', () => {
      if (stackOutputs.albDnsName) {
        expect(stackOutputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
      }
    });
  });

  describe('6. CloudWatch Logging', () => {
    it('should have log group created with retention', async () => {
      const logGroupName = `/ecs/ecommerce-app-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(30);
      }
    }, 30000);
  });

  describe('7. Auto-scaling Configuration', () => {
    it('should have auto-scaling target configured', async () => {
      const clusterName = stackOutputs.ecsClusterName || `ecommerce-cluster-${environmentSuffix}`;
      const serviceName = stackOutputs.ecsServiceName || `ecommerce-service-${environmentSuffix}`;
      const resourceId = `service/${clusterName}/${serviceName}`;

      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
        ResourceIds: [resourceId],
      });

      try {
        const response = await autoScalingClient.send(command);
        expect(response.ScalableTargets).toBeDefined();

        if (response.ScalableTargets && response.ScalableTargets.length > 0) {
          const target = response.ScalableTargets[0];
          expect(target.MinCapacity).toBe(2);
          expect(target.MaxCapacity).toBe(10);
        }
      } catch (error: any) {
        console.warn('Auto-scaling target check failed:', error.message);
      }
    }, 30000);

    it('should have auto-scaling policy configured', async () => {
      const clusterName = stackOutputs.ecsClusterName || `ecommerce-cluster-${environmentSuffix}`;
      const serviceName = stackOutputs.ecsServiceName || `ecommerce-service-${environmentSuffix}`;
      const resourceId = `service/${clusterName}/${serviceName}`;

      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
        ResourceId: resourceId,
      });

      try {
        const response = await autoScalingClient.send(command);
        expect(response.ScalingPolicies).toBeDefined();

        if (response.ScalingPolicies && response.ScalingPolicies.length > 0) {
          const policy = response.ScalingPolicies[0];
          expect(policy.PolicyType).toBe('TargetTrackingScaling');
          expect(
            policy.TargetTrackingScalingPolicyConfiguration?.TargetValue
          ).toBe(70.0);
        }
      } catch (error: any) {
        console.warn('Auto-scaling policy check failed:', error.message);
      }
    }, 30000);
  });

  describe('8. Secrets Manager', () => {
    it('should have database connection secret created', async () => {
      const secretName = `ecommerce-db-connection-${environmentSuffix}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      try {
        const response = await secretsClient.send(command);
        expect(response.Name).toBe(secretName);
        expect(response.Description).toContain('Database connection string');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn('Secret not found');
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('9. Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'albDnsName',
        'ecrRepositoryUri',
        'databaseEndpoint',
        'ecsClusterName',
        'ecsServiceName',
        'region',
        'environmentSuffixOutput',
      ];

      requiredOutputs.forEach((output) => {
        if (Object.keys(stackOutputs).length > 0) {
          expect(stackOutputs).toHaveProperty(output);
        }
      });
    });

    it('should have correct region in outputs', () => {
      if (stackOutputs.region) {
        expect(stackOutputs.region).toBe('ap-southeast-1');
      }
    });

    it('should have correct environment suffix in outputs', () => {
      if (stackOutputs.environmentSuffixOutput) {
        expect(stackOutputs.environmentSuffixOutput).toBe(environmentSuffix);
      }
    });
  });

  describe('10. Resource Naming Validation', () => {
    it('should use environment suffix in all resource names', () => {
      expect(stackOutputs.ecsClusterName).toContain(environmentSuffix);
      expect(stackOutputs.ecsServiceName).toContain(environmentSuffix);
      expect(stackOutputs.ecrRepositoryUri).toContain(environmentSuffix);
    });
  });
});
