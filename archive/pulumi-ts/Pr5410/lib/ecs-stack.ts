import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  ecrImageUri: string;
  dbSecretArn?: string;
  dbEndpoint: pulumi.Output<string>;
  logGroupName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const region = pulumi.output(aws.getRegion()).name;

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `payment-cluster-${args.environmentSuffix}`,
      {
        name: `payment-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-cluster-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(
      `payment-task-exec-role-${args.environmentSuffix}`,
      {
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
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-exec-role-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-task-exec-policy-${args.environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Add policy for Secrets Manager access
    if (args.dbSecretArn) {
      new aws.iam.RolePolicy(
        `payment-task-exec-secrets-policy-${args.environmentSuffix}`,
        {
          role: taskExecutionRole.id,
          policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:GetSecretValue"
              ],
              "Resource": "${args.dbSecretArn}"
            }
          ]
        }`,
        },
        { parent: this }
      );
    }

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `payment-task-role-${args.environmentSuffix}`,
      {
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
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-role-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create task definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-${args.environmentSuffix}`,
      {
        family: `payment-task-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,

        containerDefinitions: pulumi
          .all([args.logGroupName, args.dbEndpoint, region])
          .apply(([logGroup, dbEndpoint, reg]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                image: args.ecrImageUri,
                essential: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'PORT',
                    value: '3000',
                  },
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': reg,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:3000/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
              },
            ])
          ),

        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create ECS Service
    const service = new aws.ecs.Service(
      `payment-service-${args.environmentSuffix}`,
      {
        name: `payment-service-${args.environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',

        networkConfiguration: {
          subnets: args.subnetIds,
          securityGroups: [args.securityGroupId],
          assignPublicIp: false,
        },

        loadBalancers: [
          {
            targetGroupArn: args.targetGroupArn,
            containerName: 'payment-app',
            containerPort: 3000,
          },
        ],

        healthCheckGracePeriodSeconds: 60,

        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-service-${args.environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [taskDefinition] }
    );

    // Create Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `payment-scaling-target-${args.environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create Auto Scaling Policy based on CPU
    new aws.appautoscaling.Policy(
      `payment-scaling-policy-${args.environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,

        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.clusterName = cluster.name;
    this.serviceName = service.name;

    this.registerOutputs({
      clusterName: this.clusterName,
      serviceName: this.serviceName,
    });
  }
}
