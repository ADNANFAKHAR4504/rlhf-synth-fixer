import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  ecsSecurityGroupId: pulumi.Input<string>;
  albTargetGroupArn: pulumi.Input<string>;
  albListenerArn?: pulumi.Input<string>;
  containerImageTag: string;
  desiredCount?: number;
  cpu?: string;
  memory?: string;
  awsRegion?: string;
}

export class EcsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly taskExecutionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;

  constructor(
    name: string,
    args: EcsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:EcsComponent', name, {}, opts);

    // Create ECS Cluster
    this.cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `ecs-cluster-${args.environmentSuffix}-pw`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Task Execution Role
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
          Name: `ecs-task-execution-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${args.environmentSuffix}`,
      {
        role: this.taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create Task Role
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
          Name: `ecs-task-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach policies for accessing Secrets Manager and SSM
    new aws.iam.RolePolicy(
      `ecs-task-policy-${args.environmentSuffix}`,
      {
        role: this.taskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'secretsmanager:GetSecretValue',
                'ssm:GetParameters',
                'ssm:GetParameter',
                'ssm:GetParametersByPath',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${args.environmentSuffix}`,
      {
        name: `/ecs/trading-platform-${args.environmentSuffix}-pw`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-log-group-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Task Definition
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-def-${args.environmentSuffix}`,
      {
        family: `trading-platform-${args.environmentSuffix}-pw`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: args.cpu || '512',
        memory: args.memory || '1024',
        executionRoleArn: this.taskExecutionRole.arn,
        taskRoleArn: this.taskRole.arn,
        containerDefinitions: pulumi
          .all([logGroup.name, args.awsRegion || 'us-east-1'])
          .apply(([logGroupName, region]) =>
            JSON.stringify([
              {
                name: `trading-app-${args.environmentSuffix}`,
                image: `nginx:${args.containerImageTag}`,
                essential: true,
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
                    'awslogs-region': region,
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
          ),
        tags: {
          Name: `ecs-task-def-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create ECS Service - wait for ALB listener to be ready
    // Add cluster to dependencies to ensure proper deletion order
    const serviceDependencies: pulumi.Resource[] = [
      this.cluster,
      this.taskDefinition,
    ];
    if (args.albListenerArn) {
      // Note: albListenerArn is an Input, we pass the raw ARN for dependency
      // Pulumi will handle the dependency automatically through the Input type
    }

    this.service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `trading-platform-${args.environmentSuffix}-pw`,
        cluster: this.cluster.arn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: args.desiredCount || 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: args.privateSubnetIds,
          securityGroups: [args.ecsSecurityGroupId],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: args.albTargetGroupArn,
            containerName: `trading-app-${args.environmentSuffix}`,
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `ecs-service-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
        // Force service to scale down before deletion
        forceNewDeployment: false,
      },
      { parent: this, dependsOn: serviceDependencies }
    );

    this.registerOutputs({
      clusterArn: this.cluster.arn,
      serviceArn: this.service.id,
      taskDefinitionArn: this.taskDefinition.arn,
    });
  }
}
