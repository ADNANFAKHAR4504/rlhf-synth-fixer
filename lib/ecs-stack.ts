/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */


/**
 * ecs-stack.ts
 *
 * Creates ECS cluster, ALB, ECS services, task definitions, and auto-scaling policies.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  apiEcrUrl: pulumi.Output<string>;
  workerEcrUrl: pulumi.Output<string>;
  schedulerEcrUrl: pulumi.Output<string>;
  dbSecretArn: pulumi.Output<string>;
  apiKeySecretArn: pulumi.Output<string>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      apiEcrUrl,
      workerEcrUrl,
      schedulerEcrUrl,
      dbSecretArn,
      apiKeySecretArn,
    } = args;

    // Create ECS Cluster with Container Insights enabled
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        name: `ecs-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Groups
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-service-logs-${environmentSuffix}`,
      {
        name: `/ecs/api-service-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `api-service-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const workerLogGroup = new aws.cloudwatch.LogGroup(
      `worker-service-logs-${environmentSuffix}`,
      {
        name: `/ecs/worker-service-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `worker-service-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const schedulerLogGroup = new aws.cloudwatch.LogGroup(
      `scheduler-service-logs-${environmentSuffix}`,
      {
        name: `/ecs/scheduler-service-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `scheduler-service-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${environmentSuffix}`,
      {
        name: `ecs-task-execution-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `ecs-task-execution-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create custom policy for Secrets Manager access
    const secretsPolicy = new aws.iam.Policy(
      `ecs-secrets-policy-${environmentSuffix}`,
      {
        name: `ecs-secrets-policy-${environmentSuffix}`,
        policy: pulumi
          .all([dbSecretArn, apiKeySecretArn])
          .apply(([dbArn, apiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: [dbArn, apiArn],
                },
              ],
            })
          ),
        tags: {
          Name: `ecs-secrets-policy-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-secrets-policy-attach-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn: secretsPolicy.arn,
      },
      { parent: this }
    );

    // Create IAM role for ECS tasks
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
      {
        name: `ecs-task-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `ecs-task-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        name: `alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-tasks-sg-${environmentSuffix}`,
      {
        name: `ecs-tasks-sg-${environmentSuffix}`,
        description: 'Security group for ECS tasks',
        vpcId: vpcId,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `ecs-tasks-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        name: `alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create target groups for each service
    const apiTargetGroup = new aws.lb.TargetGroup(
      `api-tg-${environmentSuffix}`,
      {
        name: `api-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 3,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          Name: `api-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const workerTargetGroup = new aws.lb.TargetGroup(
      `worker-tg-${environmentSuffix}`,
      {
        name: `worker-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 3,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          Name: `worker-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const schedulerTargetGroup = new aws.lb.TargetGroup(
      `scheduler-tg-${environmentSuffix}`,
      {
        name: `scheduler-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 3,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          Name: `scheduler-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ALB listener
    const listener = new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'fixed-response',
            fixedResponse: {
              contentType: 'text/plain',
              messageBody: 'Not Found',
              statusCode: '404',
            },
          },
        ],
        tags: {
          Name: `alb-listener-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create listener rules for path-based routing
    new aws.lb.ListenerRule(
      `api-rule-${environmentSuffix}`,
      {
        listenerArn: listener.arn,
        priority: 100,
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
        actions: [
          {
            type: 'forward',
            targetGroupArn: apiTargetGroup.arn,
          },
        ],
        tags: {
          Name: `api-rule-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.lb.ListenerRule(
      `worker-rule-${environmentSuffix}`,
      {
        listenerArn: listener.arn,
        priority: 200,
        conditions: [
          {
            pathPattern: {
              values: ['/worker/*'],
            },
          },
        ],
        actions: [
          {
            type: 'forward',
            targetGroupArn: workerTargetGroup.arn,
          },
        ],
        tags: {
          Name: `worker-rule-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.lb.ListenerRule(
      `scheduler-rule-${environmentSuffix}`,
      {
        listenerArn: listener.arn,
        priority: 300,
        conditions: [
          {
            pathPattern: {
              values: ['/scheduler/*'],
            },
          },
        ],
        actions: [
          {
            type: 'forward',
            targetGroupArn: schedulerTargetGroup.arn,
          },
        ],
        tags: {
          Name: `scheduler-rule-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get current AWS region
    const currentRegion = aws.getRegionOutput();

    // Create task definitions for each service
    // FIXED: Using pulumi.all to properly resolve all Output values including log group names and region
    const apiTaskDefinition = new aws.ecs.TaskDefinition(
      `api-task-${environmentSuffix}`,
      {
        family: `api-service-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([apiEcrUrl, dbSecretArn, apiKeySecretArn, apiLogGroup.name, currentRegion.name])
          .apply(([ecrUrl, dbArn, apiArn, logGroupName, region]) =>
            JSON.stringify([
              {
                name: 'api-service',
                image: `${ecrUrl}:latest`,
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  { name: 'SERVICE_NAME', value: 'api-service' },
                  { name: 'ENVIRONMENT', value: environmentSuffix },
                ],
                secrets: [
                  { name: 'DB_CREDENTIALS', valueFrom: dbArn },
                  { name: 'API_KEYS', valueFrom: apiArn },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          Name: `api-task-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const workerTaskDefinition = new aws.ecs.TaskDefinition(
      `worker-task-${environmentSuffix}`,
      {
        family: `worker-service-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([workerEcrUrl, dbSecretArn, apiKeySecretArn, workerLogGroup.name, currentRegion.name])
          .apply(([ecrUrl, dbArn, apiArn, logGroupName, region]) =>
            JSON.stringify([
              {
                name: 'worker-service',
                image: `${ecrUrl}:latest`,
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  { name: 'SERVICE_NAME', value: 'worker-service' },
                  { name: 'ENVIRONMENT', value: environmentSuffix },
                ],
                secrets: [
                  { name: 'DB_CREDENTIALS', valueFrom: dbArn },
                  { name: 'API_KEYS', valueFrom: apiArn },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          Name: `worker-task-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const schedulerTaskDefinition = new aws.ecs.TaskDefinition(
      `scheduler-task-${environmentSuffix}`,
      {
        family: `scheduler-service-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([schedulerEcrUrl, dbSecretArn, apiKeySecretArn, schedulerLogGroup.name, currentRegion.name])
          .apply(([ecrUrl, dbArn, apiArn, logGroupName, region]) =>
            JSON.stringify([
              {
                name: 'scheduler-service',
                image: `${ecrUrl}:latest`,
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  { name: 'SERVICE_NAME', value: 'scheduler-service' },
                  { name: 'ENVIRONMENT', value: environmentSuffix },
                ],
                secrets: [
                  { name: 'DB_CREDENTIALS', valueFrom: dbArn },
                  { name: 'API_KEYS', valueFrom: apiArn },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          Name: `scheduler-task-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS services
    const apiService = new aws.ecs.Service(
      `api-service-${environmentSuffix}`,
      {
        name: `api-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: apiTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: apiTargetGroup.arn,
            containerName: 'api-service',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `api-service-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    const workerService = new aws.ecs.Service(
      `worker-service-${environmentSuffix}`,
      {
        name: `worker-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: workerTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: workerTargetGroup.arn,
            containerName: 'worker-service',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `worker-service-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    const schedulerService = new aws.ecs.Service(
      `scheduler-service-${environmentSuffix}`,
      {
        name: `scheduler-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: schedulerTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: schedulerTargetGroup.arn,
            containerName: 'scheduler-service',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `scheduler-service-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    // Create auto-scaling targets
    const apiAutoScalingTarget = new aws.appautoscaling.Target(
      `api-autoscaling-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${apiService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    const workerAutoScalingTarget = new aws.appautoscaling.Target(
      `worker-autoscaling-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${workerService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    const schedulerAutoScalingTarget = new aws.appautoscaling.Target(
      `scheduler-autoscaling-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${schedulerService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create auto-scaling policies based on CPU utilization
    new aws.appautoscaling.Policy(
      `api-cpu-scaling-${environmentSuffix}`,
      {
        name: `api-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: apiAutoScalingTarget.resourceId,
        scalableDimension: apiAutoScalingTarget.scalableDimension,
        serviceNamespace: apiAutoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `worker-cpu-scaling-${environmentSuffix}`,
      {
        name: `worker-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: workerAutoScalingTarget.resourceId,
        scalableDimension: workerAutoScalingTarget.scalableDimension,
        serviceNamespace: workerAutoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `scheduler-cpu-scaling-${environmentSuffix}`,
      {
        name: `scheduler-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: schedulerAutoScalingTarget.resourceId,
        scalableDimension: schedulerAutoScalingTarget.scalableDimension,
        serviceNamespace: schedulerAutoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Expose outputs
    this.albDnsName = alb.dnsName;
    this.clusterName = cluster.name;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterName: this.clusterName,
    });
  }
}
