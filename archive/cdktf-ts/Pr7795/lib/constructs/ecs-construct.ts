import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface EcsConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  ecrRepositoryUrl: string;
  imageTag: string;
  containerPort: number;
  desiredCount: number;
  cpu: string;
  memory: string;
  targetGroupArn: string;
  tags?: Record<string, string>;
}

export class EcsConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;
  public readonly taskDefinition: EcsTaskDefinition;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      subnetIds,
      ecrRepositoryUrl,
      imageTag,
      containerPort,
      desiredCount,
      cpu,
      memory,
      targetGroupArn,
      tags = {},
    } = props;

    // Create ECS cluster
    this.cluster = new EcsCluster(this, 'cluster', {
      name: `ecs-cluster-${environmentSuffix}`,
      tags: {
        Name: `ecs-cluster-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create CloudWatch log group
    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/ecs/trading-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create ECS task execution role
    const executionRole = new IamRole(this, 'execution-role', {
      name: `ecs-execution-role-${environmentSuffix}`,
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
        Name: `ecs-execution-role-${environmentSuffix}`,
        ...tags,
      },
    });

    new IamRolePolicyAttachment(this, 'execution-role-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create ECS task role
    const taskRole = new IamRole(this, 'task-role', {
      name: `ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'aws:SourceAccount':
                  '${data.aws_caller_identity.current.account_id}',
              },
            },
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create task definition
    this.taskDefinition = new EcsTaskDefinition(this, 'task-def', {
      family: `trading-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu,
      memory,
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'trading-app',
          image: `${ecrRepositoryUrl}:${imageTag}`,
          essential: true,
          portMappings: [
            {
              containerPort,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          environment: [
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
          ],
        },
      ]),
      tags: {
        Name: `ecs-task-def-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create security group for ECS tasks
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `ecs-sg-${environmentSuffix}`,
      description: `Security group for ECS tasks ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `ecs-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    new SecurityGroupRule(this, 'sg-rule-ingress', {
      type: 'ingress',
      fromPort: containerPort,
      toPort: containerPort,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Create ECS service
    this.service = new EcsService(this, 'service', {
      name: `ecs-service-${environmentSuffix}`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnetIds,
        securityGroups: [this.securityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn,
          containerName: 'trading-app',
          containerPort,
        },
      ],
      tags: {
        Name: `ecs-service-${environmentSuffix}`,
        ...tags,
      },
    });
  }
}
