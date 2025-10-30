/**
 * ECS Stack Component
 *
 * Creates an ECS cluster with Fargate support, task definitions, and ECS service
 * with auto-scaling capabilities based on CPU utilization.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  targetGroupArn: pulumi.Output<string>;
  ecsTaskSecurityGroupId: pulumi.Output<string>;
  containerImage: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  albListener: aws.lb.Listener;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(name: string, args: EcsStackArgs, opts?: ResourceOptions) {
    super('tap:ecs:EcsStack', name, args, opts);

    // Create CloudWatch Log Group for container logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${args.environmentSuffix}`,
      {
        name: `/ecs/payment-api-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-logs-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create ECS Cluster with Container Insights enabled
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `payment-api-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const executionRole = new aws.iam.Role(
      `ecs-execution-role-${args.environmentSuffix}`,
      {
        name: `ecs-execution-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-execution-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-execution-policy-${args.environmentSuffix}`,
      {
        role: executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
        name: `ecs-task-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-task-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Define container configuration after log group is created
    const containerDefinitions = pulumi
      .all([logGroup.name])
      .apply(([logGroupName]) =>
        JSON.stringify([
          {
            name: `payment-api-container-${args.environmentSuffix}`,
            image: args.containerImage,
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': aws.config.region!,
                'awslogs-stream-prefix': 'ecs',
              },
            },
            environment: [
              {
                name: 'ENVIRONMENT',
                value: args.environmentSuffix,
              },
            ],
          },
        ])
      );

    // Create Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${args.environmentSuffix}`,
      {
        family: `payment-api-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions,
        tags: {
          Name: `task-def-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create ECS Service
    const service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `payment-api-service-${args.environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: args.privateSubnetIds,
          securityGroups: [args.ecsTaskSecurityGroupId],
        },
        loadBalancers: [
          {
            targetGroupArn: args.targetGroupArn,
            containerName: `payment-api-container-${args.environmentSuffix}`,
            containerPort: 80,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `ecs-service-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [taskDefinition, args.albListener] }
    );

    // Create Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `ecs-scaling-target-${args.environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create Auto Scaling Policy based on CPU utilization
    new aws.appautoscaling.Policy(
      `ecs-scaling-policy-${args.environmentSuffix}`,
      {
        name: `ecs-cpu-scaling-${args.environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 60,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.clusterArn = cluster.arn;
    this.clusterName = cluster.name;
    this.serviceArn = service.id;
    this.serviceName = service.name;

    this.registerOutputs({
      clusterArn: this.clusterArn,
      clusterName: this.clusterName,
      serviceArn: this.serviceArn,
      serviceName: this.serviceName,
    });
  }
}
