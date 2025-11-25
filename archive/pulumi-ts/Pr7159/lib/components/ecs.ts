import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsComponentArgs {
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  taskCount: number;
  taskCpu: string;
  taskMemory: string;
  enableAutoScaling: boolean;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class EcsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly taskExecutionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;
  public readonly targetGroup: aws.lb.TargetGroup;

  constructor(
    name: string,
    args: EcsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:EcsComponent', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // ECS Cluster
    this.cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        tags: {
          ...args.tags,
          Name: `ecs-cluster-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Task Execution Role
    this.taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${args.environmentSuffix}`,
      {
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
          ...args.tags,
          Name: `ecs-task-execution-role-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${args.environmentSuffix}`,
      {
        role: this.taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      defaultResourceOptions
    );

    // Task Role
    this.taskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
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
          ...args.tags,
          Name: `ecs-task-role-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // CloudWatch Logs Group
    // CloudWatch log group names must start with '/' and can only contain letters, numbers, hyphens, underscores, forward slashes, and periods
    // Sanitize environment suffix to remove any invalid characters
    const sanitizedSuffix = args.environmentSuffix.replace(
      /[^a-zA-Z0-9-_]/g,
      '-'
    );
    const logGroupName = `/ecs/trading-app-${sanitizedSuffix}`;
    new aws.cloudwatch.LogGroup(
      `ecs-log-group-${args.environmentSuffix}`,
      {
        name: logGroupName,
        retentionInDays: 7,
        tags: {
          ...args.tags,
          Name: `ecs-log-group-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Task Definition
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-${args.environmentSuffix}`,
      {
        family: `trading-app-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: args.taskCpu,
        memory: args.taskMemory,
        executionRoleArn: this.taskExecutionRole.arn,
        taskRoleArn: this.taskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: 'trading-app',
            image: 'nginx:latest',
            portMappings: [
              {
                containerPort: 8080,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': aws.config.region || 'us-east-1',
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          ...args.tags,
          Name: `ecs-task-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `ecs-tg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200-399',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: {
          ...args.tags,
          Name: `ecs-tg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // ECS Service
    this.service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        cluster: this.cluster.arn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: args.taskCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: args.subnetIds,
          securityGroups: [args.securityGroupId],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: this.targetGroup.arn,
            containerName: 'trading-app',
            containerPort: 8080,
          },
        ],
        tags: {
          ...args.tags,
          Name: `ecs-service-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Auto Scaling (if enabled)
    if (args.enableAutoScaling) {
      const scalingTarget = new aws.appautoscaling.Target(
        `ecs-scaling-target-${args.environmentSuffix}`,
        {
          maxCapacity: args.taskCount * 2,
          minCapacity: args.taskCount,
          resourceId: pulumi.interpolate`service/${this.cluster.name}/${this.service.name}`,
          scalableDimension: 'ecs:service:DesiredCount',
          serviceNamespace: 'ecs',
        },
        defaultResourceOptions
      );

      new aws.appautoscaling.Policy(
        `ecs-scaling-policy-${args.environmentSuffix}`,
        {
          policyType: 'TargetTrackingScaling',
          resourceId: scalingTarget.resourceId,
          scalableDimension: scalingTarget.scalableDimension,
          serviceNamespace: scalingTarget.serviceNamespace,
          targetTrackingScalingPolicyConfiguration: {
            predefinedMetricSpecification: {
              predefinedMetricType: 'ECSServiceAverageCPUUtilization',
            },
            targetValue: 70.0,
          },
        },
        defaultResourceOptions
      );
    }

    this.registerOutputs({
      clusterId: this.cluster.id,
      serviceId: this.service.id,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
