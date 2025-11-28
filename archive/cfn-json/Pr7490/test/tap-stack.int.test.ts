import fs from 'fs';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
  ListServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';

const AWS_REGION = 'us-east-2';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const ecsClient = new ECSClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const autoScalingClient = new ApplicationAutoScalingClient({ region: AWS_REGION });

describe('ECS Batch Processing System Integration Tests', () => {
  describe('ECS Cluster', () => {
    test('should have Fargate capacity providers configured', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      const cluster = response.clusters![0];
      expect(cluster.capacityProviders).toContain('FARGATE');
      expect(cluster.capacityProviders).toContain('FARGATE_SPOT');
    });
  });

  describe('ECS Services', () => {
    test('should have three ECS services running', async () => {
      const listCommand = new ListServicesCommand({
        cluster: outputs.ECSClusterName,
      });
      const listResponse = await ecsClient.send(listCommand);

      expect(listResponse.serviceArns).toBeDefined();
      expect(listResponse.serviceArns!.length).toBeGreaterThanOrEqual(3);
    });

    test('data ingestion service should have 2 running tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.DataIngestionServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services![0];
      expect(service.serviceName).toBe(outputs.DataIngestionServiceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    });

    test('transaction processing service should have 2 running tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.TransactionProcessingServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services![0];
      expect(service.serviceName).toBe(outputs.TransactionProcessingServiceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    });

    test('report generation service should have 2 running tasks', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ReportGenerationServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services![0];
      expect(service.serviceName).toBe(outputs.ReportGenerationServiceName);
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
    });

    test('report generation service should have load balancer configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ReportGenerationServiceName],
      });
      const response = await ecsClient.send(command);

      const service = response.services![0];
      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
      expect(service.loadBalancers![0].containerName).toBe('report-generation');
      expect(service.loadBalancers![0].containerPort).toBe(80);
    });

    test('all services should have circuit breaker enabled', async () => {
      const services = [
        outputs.DataIngestionServiceName,
        outputs.TransactionProcessingServiceName,
        outputs.ReportGenerationServiceName,
      ];

      for (const serviceName of services) {
        const command = new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [serviceName],
        });
        const response = await ecsClient.send(command);

        const service = response.services![0];
        expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
        expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);
      }
    });
  });

  describe('Task Definitions', () => {
    test('all task definitions should be Fargate compatible', async () => {
      const services = [
        outputs.DataIngestionServiceName,
        outputs.TransactionProcessingServiceName,
        outputs.ReportGenerationServiceName,
      ];

      for (const serviceName of services) {
        const serviceCommand = new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [serviceName],
        });
        const serviceResponse = await ecsClient.send(serviceCommand);

        const taskDefArn = serviceResponse.services![0].taskDefinition!;
        const taskDefCommand = new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefArn,
        });
        const taskDefResponse = await ecsClient.send(taskDefCommand);

        const taskDef = taskDefResponse.taskDefinition!;
        expect(taskDef.requiresCompatibilities).toContain('FARGATE');
        expect(taskDef.networkMode).toBe('awsvpc');
        expect(taskDef.cpu).toBe('1024');
        expect(taskDef.memory).toBe('2048');
      }
    });

    test('all task definitions should have X-Ray sidecar container', async () => {
      const services = [
        outputs.DataIngestionServiceName,
        outputs.TransactionProcessingServiceName,
        outputs.ReportGenerationServiceName,
      ];

      for (const serviceName of services) {
        const serviceCommand = new DescribeServicesCommand({
          cluster: outputs.ECSClusterName,
          services: [serviceName],
        });
        const serviceResponse = await ecsClient.send(serviceCommand);

        const taskDefArn = serviceResponse.services![0].taskDefinition!;
        const taskDefCommand = new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefArn,
        });
        const taskDefResponse = await ecsClient.send(taskDefCommand);

        const taskDef = taskDefResponse.taskDefinition!;
        const xrayContainer = taskDef.containerDefinitions?.find(
          (c) => c.name === 'xray-daemon'
        );
        expect(xrayContainer).toBeDefined();
        expect(xrayContainer?.essential).toBe(false);
        expect(xrayContainer?.image).toContain('xray');
      }
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB deployed and active', async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.LoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.State?.Code).toBe('active');
    });

    test('should have target group with correct health check configuration', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const targetGroup = response.TargetGroups?.find((tg) =>
        tg.TargetGroupName?.includes('tg-report-gen')
      );

      expect(targetGroup).toBeDefined();
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup?.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup?.HealthyThresholdCount).toBe(2);
      expect(targetGroup?.UnhealthyThresholdCount).toBe(3);
      expect(targetGroup?.TargetType).toBe('ip');
    });

    test('ALB should be accessible via DNS', async () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
    });

    test('should have security groups configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const ecsSecurityGroup = response.SecurityGroups?.find((sg) =>
        sg.GroupName?.includes('ecs-tasks-sg')
      );
      const albSecurityGroup = response.SecurityGroups?.find((sg) =>
        sg.GroupName?.includes('alb-sg')
      );

      expect(ecsSecurityGroup).toBeDefined();
      expect(albSecurityGroup).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket deployed', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('should have secret deployed', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.SecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.SecretArn);
      expect(response.Name).toContain('db-credentials');
    });

    test('secret should contain valid database credentials', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.SecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const credentials = JSON.parse(response.SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.engine).toBe('postgres');
    });
  });

  describe('CloudWatch Logs', () => {

    test('all log groups should have 30-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/ecs/',
      });
      const response = await logsClient.send(command);

      const taskLogGroups = response.logGroups?.filter((lg) =>
        lg.logGroupName?.includes('data-ingestion') ||
        lg.logGroupName?.includes('transaction-processing') ||
        lg.logGroupName?.includes('report-generation') ||
        lg.logGroupName?.includes('xray')
      );

      taskLogGroups?.forEach((lg) => {
        expect(lg.retentionInDays).toBe(30);
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should have scalable targets for all services', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      const targets = response.ScalableTargets?.filter((t) =>
        t.ResourceId?.includes(outputs.ECSClusterName)
      );

      expect(targets).toBeDefined();
      expect(targets!.length).toBeGreaterThanOrEqual(3);
    });

    test('all scalable targets should have min capacity of 2 and max capacity of 10', async () => {
      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      const targets = response.ScalableTargets?.filter((t) =>
        t.ResourceId?.includes(outputs.ECSClusterName)
      );

      targets?.forEach((target) => {
        expect(target.MinCapacity).toBe(2);
        expect(target.MaxCapacity).toBe(10);
      });
    });

    test('should have scaling policies configured', async () => {
      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
      });
      const response = await autoScalingClient.send(command);

      const policies = response.ScalingPolicies?.filter((p) =>
        p.ResourceId?.includes(outputs.ECSClusterName)
      );

      expect(policies).toBeDefined();
      expect(policies!.length).toBeGreaterThanOrEqual(3);

      policies?.forEach((policy) => {
        expect(policy.PolicyType).toBe('TargetTrackingScaling');
        expect(policy.TargetTrackingScalingPolicyConfiguration?.TargetValue).toBe(70.0);
      });
    });
  });

  describe('End-to-End Validation', () => {
    test('all required outputs should be present', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.DataIngestionServiceName).toBeDefined();
      expect(outputs.TransactionProcessingServiceName).toBeDefined();
      expect(outputs.ReportGenerationServiceName).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.SecretArn).toBeDefined();
    });

    test('all resources should have environment suffix in names', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912817';

      expect(outputs.ECSClusterName).toContain(environmentSuffix);
      expect(outputs.DataIngestionServiceName).toContain(environmentSuffix);
      expect(outputs.TransactionProcessingServiceName).toContain(environmentSuffix);
      expect(outputs.ReportGenerationServiceName).toContain(environmentSuffix);
      expect(outputs.S3BucketName).toContain(environmentSuffix);
    });
  });
});
