/**
 * ECS Stack - Creates ECS Fargate cluster, task definitions, and services
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {
  EnvironmentConfig,
  VpcOutputs,
  AlbOutputs,
  RdsOutputs,
  EcsOutputs,
} from './types';

export interface EcsStackArgs {
  config: EnvironmentConfig;
  vpcOutputs: VpcOutputs;
  albOutputs: AlbOutputs;
  rdsOutputs: RdsOutputs;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly outputs: EcsOutputs;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, {}, opts);

    const { config, vpcOutputs, albOutputs, rdsOutputs } = args;

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `${config.environment}-cluster-${config.environmentSuffix}`,
      {
        name: `${config.environment}-payment-cluster-${config.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: config.enableMonitoring ? 'enabled' : 'disabled',
          },
        ],
        tags: {
          ...config.tags,
          Name: `${config.environment}-payment-cluster-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `${config.environment}-ecs-task-execution-role-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-task-execution-role-${config.environmentSuffix}`,
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
          ...config.tags,
          Name: `${config.environment}-ecs-task-execution-role-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach managed policy
    new aws.iam.RolePolicyAttachment(
      `${config.environment}-ecs-task-execution-policy-${config.environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Add policy to read secrets
    new aws.iam.RolePolicy(
      `${config.environment}-ecs-secrets-policy-${config.environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi.all([rdsOutputs.secretArn]).apply(([secretArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'secretsmanager:GetSecretValue',
                  'secretsmanager:DescribeSecret',
                ],
                Resource: secretArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create ECS Task Role (for application permissions)
    const taskRole = new aws.iam.Role(
      `${config.environment}-ecs-task-role-${config.environmentSuffix}`,
      {
        name: `${config.environment}-ecs-task-role-${config.environmentSuffix}`,
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
          ...config.tags,
          Name: `${config.environment}-ecs-task-role-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `${config.environment}-ecs-logs-${config.environmentSuffix}`,
      {
        name: `/ecs/${config.environment}-payment-api-${config.environmentSuffix}`,
        retentionInDays: config.environment === 'prod' ? 30 : 7,
        tags: {
          ...config.tags,
          Name: `${config.environment}-ecs-logs-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `${config.environment}-task-${config.environmentSuffix}`,
      {
        family: `${config.environment}-payment-api-${config.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([rdsOutputs.endpoint, rdsOutputs.secretArn, logGroup.name])
          .apply(([dbEndpoint, secretArn, logGroupName]) =>
            JSON.stringify([
              {
                name: 'payment-api',
                image: 'nginx:latest', // Replace with actual payment API image
                essential: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    hostPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  { name: 'ENVIRONMENT', value: config.environment },
                  { name: 'DB_HOST', value: dbEndpoint.split(':')[0] },
                  { name: 'DB_PORT', value: '5432' },
                  { name: 'DB_NAME', value: 'paymentdb' },
                  {
                    name: 'NODE_ENV',
                    value:
                      config.environment === 'prod'
                        ? 'production'
                        : 'development',
                  },
                ],
                secrets: [
                  {
                    name: 'DB_PASSWORD',
                    valueFrom: secretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
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
        tags: {
          ...config.tags,
          Name: `${config.environment}-payment-api-task-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS Service Security Group
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `${config.environment}-ecs-sg-${config.environmentSuffix}`,
      {
        vpcId: vpcOutputs.vpcId,
        description: `Security group for ${config.environment} ECS tasks`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albOutputs.securityGroupId],
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
          ...config.tags,
          Name: `${config.environment}-ecs-sg-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Update RDS security group to allow traffic from ECS
    new aws.ec2.SecurityGroupRule(
      `${config.environment}-rds-from-ecs-${config.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroupId: rdsOutputs.securityGroupId,
        sourceSecurityGroupId: ecsSecurityGroup.id,
        description: 'Allow PostgreSQL traffic from ECS tasks',
      },
      { parent: this }
    );

    // Create ECS Service
    const service = new aws.ecs.Service(
      `${config.environment}-service-${config.environmentSuffix}`,
      {
        name: `${config.environment}-payment-service-${config.environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: config.ecsTaskCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: vpcOutputs.privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: albOutputs.targetGroupArn,
            containerName: 'payment-api',
            containerPort: 3000,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...config.tags,
          Name: `${config.environment}-payment-service-${config.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.outputs = {
      clusterId: cluster.id,
      serviceArn: service.id,
      taskDefinitionArn: taskDefinition.arn,
      securityGroupId: ecsSecurityGroup.id,
    };

    this.registerOutputs({
      clusterId: this.outputs.clusterId,
      serviceArn: this.outputs.serviceArn,
      taskDefinitionArn: this.outputs.taskDefinitionArn,
      securityGroupId: this.outputs.securityGroupId,
    });
  }
}
