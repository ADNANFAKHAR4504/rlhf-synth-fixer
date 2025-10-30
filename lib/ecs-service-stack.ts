import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsServiceStackArgs {
  environmentSuffix: string;
  serviceName: string;
  clusterArn: pulumi.Input<string>;
  executionRoleArn: pulumi.Input<string>;
  taskRoleArn: pulumi.Input<string>;
  ecrRepositoryUrl: pulumi.Input<string>;
  containerPort: number;
  desiredCount: number;
  minCapacity: number;
  maxCapacity: number;
  cpu: string;
  memory: string;
  targetGroupArn: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  securityGroupId: pulumi.Input<string>;
  logGroupName: string;
  containerEnvironment?: Array<{ name: string; value: string }>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsServiceStack extends pulumi.ComponentResource {
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly autoScalingTarget: aws.appautoscaling.Target;

  constructor(
    name: string,
    args: EcsServiceStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:ecs:ServiceStack', name, args, opts);

    // Create CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-logs-${args.environmentSuffix}`,
      {
        name: args.logGroupName,
        retentionInDays: 7,
        tags: {
          ...args.tags,
          Name: `${name}-logs-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Task Definition
    // Note: Using public nginx image since ECR URL + :latest exceeds 255 char limit
    // Note: Container definitions must be resolved as string for Pulumi Outputs
    const containerDefinitions = pulumi
      .all([this.logGroup.name, args.containerEnvironment || []])
      .apply(([logGroupName, env]) =>
        JSON.stringify([
          {
            name: args.serviceName,
            image: 'public.ecr.aws/nginx/nginx:alpine',
            cpu: parseInt(args.cpu),
            memory: parseInt(args.memory),
            essential: true,
            portMappings: [
              {
                containerPort: args.containerPort,
                protocol: 'tcp',
              },
            ],
            environment: env,
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': aws.config.region!,
                'awslogs-stream-prefix': args.serviceName,
              },
            },
          },
        ])
      );

    this.taskDefinition = new aws.ecs.TaskDefinition(
      `${name}-task-${args.environmentSuffix}`,
      {
        family: `${name}-task-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: args.cpu,
        memory: args.memory,
        executionRoleArn: args.executionRoleArn,
        taskRoleArn: args.taskRoleArn,
        containerDefinitions: containerDefinitions,
        tags: {
          ...args.tags,
          Name: `${name}-task-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS Service
    this.service = new aws.ecs.Service(
      `${name}-service-${args.environmentSuffix}`,
      {
        name: `${name}-service-${args.environmentSuffix}`,
        cluster: args.clusterArn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: args.desiredCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: true,
          subnets: args.privateSubnetIds,
          securityGroups: [args.securityGroupId],
        },
        loadBalancers: [
          {
            targetGroupArn: args.targetGroupArn,
            containerName: args.serviceName,
            containerPort: args.containerPort,
          },
        ],
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        tags: {
          ...args.tags,
          Name: `${name}-service-${args.environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [this.taskDefinition] }
    );

    // Create Auto Scaling Target
    const clusterName = pulumi
      .output(args.clusterArn)
      .apply((arn: string) => arn.split('/').pop()!);
    const resourceId = pulumi.interpolate`service/${clusterName}/${this.service.name}`;

    this.autoScalingTarget = new aws.appautoscaling.Target(
      `${name}-scaling-target-${args.environmentSuffix}`,
      {
        serviceNamespace: 'ecs',
        resourceId: resourceId,
        scalableDimension: 'ecs:service:DesiredCount',
        minCapacity: args.minCapacity,
        maxCapacity: args.maxCapacity,
      },
      { parent: this }
    );

    // Create Auto Scaling Policy - CPU Based
    new aws.appautoscaling.Policy(
      `${name}-cpu-scaling-policy-${args.environmentSuffix}`,
      {
        name: `${name}-cpu-scaling-${args.environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: this.autoScalingTarget.resourceId,
        scalableDimension: this.autoScalingTarget.scalableDimension,
        serviceNamespace: this.autoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70.0,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      serviceArn: this.service.id,
      taskDefinitionArn: this.taskDefinition.arn,
    });
  }
}
