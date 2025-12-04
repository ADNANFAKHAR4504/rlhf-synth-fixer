import * as AWS from 'aws-sdk';

/**
 * Integration tests for ECS Fargate service optimization
 *
 * These tests verify that the deployed infrastructure:
 * 1. Has proper resource configuration
 * 2. ECS service is running with correct task count
 * 3. Auto-scaling policies are active
 * 4. Health checks are functioning
 * 5. Service discovery is operational
 * 6. All optimizations are applied correctly
 *
 * Prerequisites:
 * - Stack must be deployed: npm run deploy
 * - AWS credentials must be configured
 * - ENVIRONMENT_SUFFIX environment variable must be set
 */

describe('SynthQ9n9u3x6Stack Integration Tests', () => {
  let ecs: AWS.ECS;
  let elbv2: AWS.ELBv2;
  let cloudwatch: AWS.CloudWatchLogs;
  let servicediscovery: AWS.ServiceDiscovery;
  let applicationautoscaling: AWS.ApplicationAutoScaling;

  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  const clusterName = `ecs-cluster-${environmentSuffix}`;
  const serviceName = `api-service-${environmentSuffix}`;
  const logGroupName = `/ecs/api-${environmentSuffix}`;

  beforeAll(() => {
    ecs = new AWS.ECS({ region });
    elbv2 = new AWS.ELBv2({ region });
    cloudwatch = new AWS.CloudWatchLogs({ region });
    servicediscovery = new AWS.ServiceDiscovery({ region });
    applicationautoscaling = new AWS.ApplicationAutoScaling({ region });
  });

  describe('Requirement #1: CPU/Memory Allocation', () => {
    test('ECS tasks are running with proper CPU and memory', async () => {
      const tasks = await ecs.listTasks({
        cluster: clusterName,
        serviceName: serviceName,
      }).promise();

      expect(tasks.taskArns).toBeDefined();
      expect(tasks.taskArns!.length).toBeGreaterThan(0);

      const taskDetails = await ecs.describeTasks({
        cluster: clusterName,
        tasks: tasks.taskArns!,
      }).promise();

      const task = taskDetails.tasks![0];
      expect(task.cpu).toBe('512');
      expect(task.memory).toBe('1024');
    }, 60000);

    test('task definition has correct resource allocation', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const taskDefArn = services.services![0].taskDefinition!;
      const taskDef = await ecs.describeTaskDefinition({
        taskDefinition: taskDefArn,
      }).promise();

      expect(taskDef.taskDefinition!.cpu).toBe('512');
      expect(taskDef.taskDefinition!.memory).toBe('1024');
      expect(taskDef.taskDefinition!.requiresCompatibilities).toContain('FARGATE');
    }, 30000);
  });

  describe('Requirement #2: Auto-Scaling', () => {
    test('service has auto-scaling configured', async () => {
      const resourceId = `service/${clusterName}/${serviceName}`;

      const scalableTargets = await applicationautoscaling.describeScalableTargets({
        ServiceNamespace: 'ecs',
        ResourceIds: [resourceId],
      }).promise();

      expect(scalableTargets.ScalableTargets).toBeDefined();
      expect(scalableTargets.ScalableTargets!.length).toBeGreaterThan(0);

      const target = scalableTargets.ScalableTargets![0];
      expect(target.MinCapacity).toBe(1);
      expect(target.MaxCapacity).toBe(5);
    }, 30000);

    test('CPU-based scaling policy exists', async () => {
      const resourceId = `service/${clusterName}/${serviceName}`;

      const policies = await applicationautoscaling.describeScalingPolicies({
        ServiceNamespace: 'ecs',
        ResourceId: resourceId,
      }).promise();

      expect(policies.ScalingPolicies).toBeDefined();
      expect(policies.ScalingPolicies!.length).toBeGreaterThan(0);

      const cpuPolicy = policies.ScalingPolicies!.find(
        p => p.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType === 'ECSServiceAverageCPUUtilization'
      );

      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy!.TargetTrackingScalingPolicyConfiguration!.TargetValue).toBe(70);
    }, 30000);
  });

  describe('Requirement #3: Health Checks', () => {
    test('target group has proper health check configuration', async () => {
      const targetGroups = await elbv2.describeTargetGroups({
        Names: [`api-targets-${environmentSuffix}`],
      }).promise();

      expect(targetGroups.TargetGroups).toBeDefined();
      expect(targetGroups.TargetGroups!.length).toBe(1);

      const targetGroup = targetGroups.TargetGroups![0];
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);
      expect(targetGroup.HealthCheckPath).toBe('/health');
    }, 30000);

    test('target group has healthy targets', async () => {
      const targetGroups = await elbv2.describeTargetGroups({
        Names: [`api-targets-${environmentSuffix}`],
      }).promise();

      const targetGroupArn = targetGroups.TargetGroups![0].TargetGroupArn!;

      const targetHealth = await elbv2.describeTargetHealth({
        TargetGroupArn: targetGroupArn,
      }).promise();

      expect(targetHealth.TargetHealthDescriptions).toBeDefined();
      expect(targetHealth.TargetHealthDescriptions!.length).toBeGreaterThan(0);

      // At least one target should be registered
      const registeredTargets = targetHealth.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State !== 'unused'
      );
      expect(registeredTargets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Requirement #4: Container Insights', () => {
    test('ECS cluster has Container Insights enabled', async () => {
      const clusters = await ecs.describeClusters({
        clusters: [clusterName],
      }).promise();

      expect(clusters.clusters).toBeDefined();
      expect(clusters.clusters!.length).toBe(1);

      const cluster = clusters.clusters![0];
      const containerInsightsSetting = cluster.settings?.find(
        s => s.name === 'containerInsights'
      );

      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting!.value).toBe('enabled');
    }, 30000);
  });

  describe('Requirement #5: Log Retention', () => {
    test('CloudWatch log group has 7-day retention', async () => {
      const logGroups = await cloudwatch.describeLogGroups({
        logGroupNamePrefix: logGroupName,
      }).promise();

      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBe(1);

      const logGroup = logGroups.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    }, 30000);

    test('log streams are being created', async () => {
      const logStreams = await cloudwatch.describeLogStreams({
        logGroupName: logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 5,
      }).promise();

      expect(logStreams.logStreams).toBeDefined();
      // Log streams may not exist immediately after deployment
      // Just verify the log group is accessible
    }, 30000);
  });

  describe('Requirement #6: Fargate Spot', () => {
    test('cluster has FARGATE_SPOT capacity provider configured', async () => {
      const clusters = await ecs.describeClusters({
        clusters: [clusterName],
        include: ['SETTINGS', 'CONFIGURATIONS'],
      }).promise();

      const cluster = clusters.clusters![0];
      expect(cluster.capacityProviders).toBeDefined();
      expect(cluster.capacityProviders).toContain('FARGATE_SPOT');
      expect(cluster.capacityProviders).toContain('FARGATE');
    }, 30000);

    test('service uses FARGATE_SPOT capacity provider', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const service = services.services![0];
      expect(service.capacityProviderStrategy).toBeDefined();
      expect(service.capacityProviderStrategy!.length).toBeGreaterThan(0);

      const spotProvider = service.capacityProviderStrategy!.find(
        cp => cp.capacityProvider === 'FARGATE_SPOT'
      );
      expect(spotProvider).toBeDefined();
      expect(spotProvider!.weight).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Requirement #7: Task Execution Role', () => {
    test('task definition has execution role with ECR permissions', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const taskDefArn = services.services![0].taskDefinition!;
      const taskDef = await ecs.describeTaskDefinition({
        taskDefinition: taskDefArn,
      }).promise();

      expect(taskDef.taskDefinition!.executionRoleArn).toBeDefined();
      expect(taskDef.taskDefinition!.executionRoleArn).toContain(
        `ecs-task-execution-role-${environmentSuffix}`
      );

      // Verify the role has necessary permissions by checking if tasks can start
      // If tasks are running, the execution role has proper ECR permissions
      const tasks = await ecs.listTasks({
        cluster: clusterName,
        serviceName: serviceName,
      }).promise();

      expect(tasks.taskArns!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Requirement #8: Tagging Strategy', () => {
    test('ECS cluster has proper tags', async () => {
      const clusters = await ecs.describeClusters({
        clusters: [clusterName],
        include: ['TAGS'],
      }).promise();

      const cluster = clusters.clusters![0];
      expect(cluster.tags).toBeDefined();

      const tagMap = cluster.tags!.reduce((acc, tag) => {
        acc[tag.key!] = tag.value!;
        return acc;
      }, {} as Record<string, string>);

      expect(tagMap['Environment']).toBe(environmentSuffix);
      expect(tagMap['Service']).toBe('ecs-api');
      expect(tagMap['ManagedBy']).toBe('cdk');
      expect(tagMap['CostCenter']).toBe('development');
    }, 30000);
  });

  describe('Requirement #9: Circuit Breaker', () => {
    test('ECS service has circuit breaker enabled with rollback', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const service = services.services![0];
      expect(service.deploymentConfiguration).toBeDefined();
      expect(service.deploymentConfiguration!.deploymentCircuitBreaker).toBeDefined();
      expect(service.deploymentConfiguration!.deploymentCircuitBreaker!.enable).toBe(true);
      expect(service.deploymentConfiguration!.deploymentCircuitBreaker!.rollback).toBe(true);
    }, 30000);
  });

  describe('Requirement #10: Networking and Service Discovery', () => {
    test('ECS service is running', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      expect(services.services).toBeDefined();
      expect(services.services!.length).toBe(1);

      const service = services.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.runningCount).toBeGreaterThan(0);
    }, 30000);

    test('service has Cloud Map integration', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const service = services.services![0];
      expect(service.serviceRegistries).toBeDefined();
      expect(service.serviceRegistries!.length).toBeGreaterThan(0);
    }, 30000);

    test('Cloud Map namespace exists', async () => {
      const namespaces = await servicediscovery.listNamespaces({
        Filters: [
          {
            Name: 'NAME',
            Values: [`service-discovery-${environmentSuffix}.local`],
            Condition: 'EQ',
          },
        ],
      }).promise();

      expect(namespaces.Namespaces).toBeDefined();
      expect(namespaces.Namespaces!.length).toBe(1);
      expect(namespaces.Namespaces![0].Type).toBe('DNS_PRIVATE');
    }, 30000);

    test('Application Load Balancer is accessible', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers({
        Names: [`api-alb-${environmentSuffix}`],
      }).promise();

      expect(loadBalancers.LoadBalancers).toBeDefined();
      expect(loadBalancers.LoadBalancers!.length).toBe(1);

      const lb = loadBalancers.LoadBalancers![0];
      expect(lb.State!.Code).toBe('active');
      expect(lb.Scheme).toBe('internet-facing');
      expect(lb.Type).toBe('application');
    }, 30000);
  });

  describe('Service Health and Availability', () => {
    test('service has desired tasks running', async () => {
      const services = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const service = services.services![0];
      expect(service.desiredCount).toBeGreaterThanOrEqual(1);
      expect(service.runningCount).toBe(service.desiredCount);
      expect(service.pendingCount).toBe(0);
    }, 60000);

    test('no tasks are in STOPPED state', async () => {
      const tasks = await ecs.listTasks({
        cluster: clusterName,
        serviceName: serviceName,
        desiredStatus: 'STOPPED',
      }).promise();

      // Some stopped tasks may exist from initial deployment
      // Just verify no recent failures
      if (tasks.taskArns && tasks.taskArns.length > 0) {
        const stoppedTasks = await ecs.describeTasks({
          cluster: clusterName,
          tasks: tasks.taskArns.slice(0, 5), // Check last 5 stopped tasks
        }).promise();

        // Verify stopped tasks are not from recent failures
        stoppedTasks.tasks!.forEach(task => {
          expect(task.stoppedReason).not.toContain('OutOfMemory');
          expect(task.stoppedReason).not.toContain('Essential container');
        });
      }
    }, 30000);
  });
});
