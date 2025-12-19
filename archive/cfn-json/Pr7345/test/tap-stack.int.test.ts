import fs from 'fs';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
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

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Load CloudFormation outputs
let outputs: any = {};
try {
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    console.warn('cfn-outputs/flat-outputs.json not found, skipping integration tests');
  }
} catch (error) {
  console.error('Error loading outputs:', error);
}

describe('ECS Fargate Fraud Detection Service Integration Tests', () => {
  const ecsClient = new ECSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });
  const autoScalingClient = new ApplicationAutoScalingClient({ region });

  // Skip tests if outputs are not available
  const skipIfNoOutputs = outputs && Object.keys(outputs).length > 0 ? it : it.skip;

  describe('ECS Cluster', () => {
    skipIfNoOutputs('should have ECS cluster with correct configuration', async () => {
      expect(outputs.ECSClusterArn).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();

      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterArn],
        include: ['SETTINGS'],
      });

      const response = await ecsClient.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);

      const cluster = response.clusters![0];
      expect(cluster.clusterName).toContain(environmentSuffix);
      expect(cluster.status).toBe('ACTIVE');

      // Verify Container Insights is enabled
      const containerInsights = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );
      expect(containerInsights).toBeDefined();
      expect(containerInsights?.value).toBe('enabled');
    });

    skipIfNoOutputs('should have cluster ARN in correct format', () => {
      expect(outputs.ECSClusterArn).toMatch(/^arn:aws:ecs:/);
      expect(outputs.ECSClusterArn).toContain(region);
    });
  });

  describe('ECS Service', () => {
    skipIfNoOutputs('should have ECS service running with correct configuration', async () => {
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.ECSClusterArn).toBeDefined();

      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterArn,
        services: [outputs.ECSServiceName],
        include: ['TAGS'],
      });

      const response = await ecsClient.send(command);
      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);

      const service = response.services![0];
      expect(service.serviceName).toContain(environmentSuffix);
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.platformVersion).toBe('1.4.0');

      // Verify desired count and running count
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.desiredCount).toBeLessThanOrEqual(10);

      // Verify deployment configuration
      expect(service.deploymentConfiguration?.maximumPercent).toBe(200);
      expect(service.deploymentConfiguration?.minimumHealthyPercent).toBe(100);

      // Verify circuit breaker
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.enable).toBe(true);
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker?.rollback).toBe(true);

      // Verify network configuration
      expect(service.networkConfiguration?.awsvpcConfiguration?.assignPublicIp).toBe('DISABLED');
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets?.length).toBe(3);
    });

    skipIfNoOutputs('should have load balancer configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterArn,
        services: [outputs.ECSServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.loadBalancers).toBeDefined();
      expect(service.loadBalancers?.length).toBeGreaterThan(0);

      const lb = service.loadBalancers![0];
      expect(lb.targetGroupArn).toBeDefined();
      expect(lb.containerName).toBe('fraud-detector');
      expect(lb.containerPort).toBe(80);
    });

    skipIfNoOutputs('should have health check grace period configured', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterArn,
        services: [outputs.ECSServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      expect(service.healthCheckGracePeriodSeconds).toBe(60);
    });
  });

  describe('Task Definition', () => {
    skipIfNoOutputs('should have task definition with correct specifications', async () => {
      expect(outputs.TaskDefinitionArn).toBeDefined();

      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: outputs.TaskDefinitionArn,
        include: ['TAGS'],
      });

      const response = await ecsClient.send(command);
      expect(response.taskDefinition).toBeDefined();

      const taskDef = response.taskDefinition!;
      expect(taskDef.family).toContain(environmentSuffix);
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.cpu).toBe('2048');
      expect(taskDef.memory).toBe('4096');

      // Verify IAM roles
      expect(taskDef.executionRoleArn).toBeDefined();
      expect(taskDef.taskRoleArn).toBeDefined();
      expect(taskDef.executionRoleArn).toContain(environmentSuffix);
      expect(taskDef.taskRoleArn).toContain(environmentSuffix);
    });

    skipIfNoOutputs('should have container with correct configuration', async () => {
      const command = new DescribeTaskDefinitionCommand({
        taskDefinition: outputs.TaskDefinitionArn,
      });

      const response = await ecsClient.send(command);
      const taskDef = response.taskDefinition!;

      expect(taskDef.containerDefinitions).toBeDefined();
      expect(taskDef.containerDefinitions?.length).toBeGreaterThan(0);

      const container = taskDef.containerDefinitions![0];
      expect(container.name).toBe('fraud-detector');
      expect(container.essential).toBe(true);

      // Verify port mappings
      expect(container.portMappings).toBeDefined();
      const port80 = container.portMappings?.find(pm => pm.containerPort === 80);
      expect(port80).toBeDefined();
      expect(port80?.protocol).toBe('tcp');

      // Verify health check
      expect(container.healthCheck).toBeDefined();
      expect(container.healthCheck?.interval).toBe(30);
      expect(container.healthCheck?.timeout).toBe(5);
      expect(container.healthCheck?.retries).toBe(3);
      expect(container.healthCheck?.startPeriod).toBe(60);

      // Verify logging configuration
      expect(container.logConfiguration).toBeDefined();
      expect(container.logConfiguration?.logDriver).toBe('awslogs');
      expect(container.logConfiguration?.options?.['awslogs-group']).toContain(environmentSuffix);
      expect(container.logConfiguration?.options?.['awslogs-region']).toBe(region);
    });
  });

  describe('Application Load Balancer', () => {
    skipIfNoOutputs('should have ALB with correct configuration', async () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBArn).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ALBArn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.LoadBalancerName).toContain(environmentSuffix);
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
      expect(alb.DNSName).toBe(outputs.ALBDNSName);

      // Verify availability zones (should be 3)
      expect(alb.AvailabilityZones?.length).toBe(3);
    });

    skipIfNoOutputs('should have target group with correct health check', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.ALBArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups!.find(tg =>
        tg.TargetGroupName?.includes(environmentSuffix)
      );
      expect(targetGroup).toBeDefined();

      expect(targetGroup?.TargetType).toBe('ip');
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckPath).toBe('/');
      expect(targetGroup?.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup?.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup?.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup?.HealthyThresholdCount).toBe(2);
      expect(targetGroup?.UnhealthyThresholdCount).toBe(3);

      // Note: Load balancing algorithm is verified in target group attributes
      // which requires a separate API call - tested in unit tests
    });

    skipIfNoOutputs('should have listener configured', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.ALBArn,
      });

      const response = await elbClient.send(command);
      expect(response.Listeners).toBeDefined();
      expect(response.Listeners?.length).toBeGreaterThan(0);

      const httpListener = response.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions).toBeDefined();
      expect(httpListener?.DefaultActions?.[0].Type).toBe('forward');
    });
  });

  describe('CloudWatch Logs', () => {
    skipIfNoOutputs('should have log group with correct configuration', async () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.CloudWatchLogGroup,
      });

      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === outputs.CloudWatchLogGroup
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toContain(environmentSuffix);
      expect(logGroup?.retentionInDays).toBe(30);

      // Verify KMS encryption is configured
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('Auto Scaling', () => {
    skipIfNoOutputs('should have scaling target configured', async () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();

      const resourceId = `service/${outputs.ECSClusterName}/${outputs.ECSServiceName}`;

      const command = new DescribeScalableTargetsCommand({
        ServiceNamespace: 'ecs',
        ResourceIds: [resourceId],
      });

      const response = await autoScalingClient.send(command);
      expect(response.ScalableTargets).toBeDefined();
      expect(response.ScalableTargets?.length).toBeGreaterThan(0);

      const target = response.ScalableTargets![0];
      expect(target.MinCapacity).toBe(2);
      expect(target.MaxCapacity).toBe(10);
      expect(target.ScalableDimension).toBe('ecs:service:DesiredCount');
      expect(target.ServiceNamespace).toBe('ecs');
    });

    skipIfNoOutputs('should have CPU-based scaling policy', async () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();

      const resourceId = `service/${outputs.ECSClusterName}/${outputs.ECSServiceName}`;

      const command = new DescribeScalingPoliciesCommand({
        ServiceNamespace: 'ecs',
        ResourceId: resourceId,
      });

      const response = await autoScalingClient.send(command);
      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies?.length).toBeGreaterThan(0);

      const cpuPolicy = response.ScalingPolicies!.find(
        p => p.PolicyType === 'TargetTrackingScaling'
      );
      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy?.PolicyName).toContain(environmentSuffix);

      const config = cpuPolicy?.TargetTrackingScalingPolicyConfiguration;
      expect(config?.TargetValue).toBe(70.0);
      expect(config?.PredefinedMetricSpecification?.PredefinedMetricType).toBe(
        'ECSServiceAverageCPUUtilization'
      );
      expect(config?.ScaleInCooldown).toBe(120);
      expect(config?.ScaleOutCooldown).toBe(120);
    });
  });

  describe('Resource Naming', () => {
    skipIfNoOutputs('all resource names should include environment suffix', () => {
      expect(outputs.ECSClusterName).toContain(environmentSuffix);
      expect(outputs.ECSServiceName).toContain(environmentSuffix);
      expect(outputs.CloudWatchLogGroup).toContain(environmentSuffix);
    });
  });

  describe('Outputs Validation', () => {
    skipIfNoOutputs('should have all required outputs', () => {
      const requiredOutputs = [
        'ECSClusterArn',
        'ECSClusterName',
        'ALBDNSName',
        'ALBArn',
        'ECSServiceName',
        'TaskDefinitionArn',
        'CloudWatchLogGroup',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    skipIfNoOutputs('environment suffix output should match environment variable', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    skipIfNoOutputs('ALB DNS name should be valid', () => {
      expect(outputs.ALBDNSName).toMatch(/^fraud-detection-alb-.*\.elb\.amazonaws\.com$/);
    });
  });

  describe('High Availability', () => {
    skipIfNoOutputs('service should be distributed across multiple AZs', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterArn,
        services: [outputs.ECSServiceName],
      });

      const response = await ecsClient.send(command);
      const service = response.services![0];

      // Verify service is configured with 3 subnets (one per AZ)
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets?.length).toBe(3);
    });

    skipIfNoOutputs('ALB should span multiple availability zones', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ALBArn],
      });

      const response = await elbClient.send(command);
      const alb = response.LoadBalancers![0];

      // Verify ALB spans 3 availability zones
      expect(alb.AvailabilityZones?.length).toBe(3);

      const zones = alb.AvailabilityZones?.map(az => az.ZoneName);
      expect(zones).toContain(`${region}a`);
      expect(zones).toContain(`${region}b`);
      expect(zones).toContain(`${region}c`);
    });
  });
});
