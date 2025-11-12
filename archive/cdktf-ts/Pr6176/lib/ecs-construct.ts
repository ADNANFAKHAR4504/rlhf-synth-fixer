import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Construct } from 'constructs';

export interface EcsConstructProps {
  environment: string;
  subnetIds: string[];
  securityGroupIds: string[];
  targetGroupArn: string;
  awsRegion: string;
  operationsAccountId: string;
  containerImage?: string;
  containerPort?: number;
}

export class EcsConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      environment,
      subnetIds,
      securityGroupIds,
      targetGroupArn,
      awsRegion,
      operationsAccountId,
      containerImage = 'nginx:latest',
      containerPort = 80,
    } = props;

    // Create ECS Cluster
    this.cluster = new EcsCluster(this, 'cluster', {
      name: `ecs-cluster-${environment}`,
      tags: {
        Name: `ecs-cluster-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Create CloudWatch Log Group for ECS tasks
    new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/${environment}/app`,
      retentionInDays: 7,
      tags: {
        Name: `/ecs/${environment}/app`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Create Task Execution Role
    const executionRole = new IamRole(this, 'execution-role', {
      name: `ecs-execution-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `ecs-execution-role-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    new IamRolePolicyAttachment(this, 'execution-role-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Add ECR permissions for cross-account access
    new IamRolePolicy(this, 'ecr-policy', {
      name: `ecs-ecr-policy-${environment}`,
      role: executionRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ecr:GetAuthorizationToken',
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
            ],
            Resource: [
              `arn:aws:ecr:${awsRegion}:${operationsAccountId}:repository/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['ecr:GetAuthorizationToken'],
            Resource: '*',
          },
        ],
      }),
    });

    // Create Task Role
    const taskRole = new IamRole(this, 'task-role', {
      name: `ecs-task-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Create Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `app-task-${environment}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'app',
          image: containerImage,
          portMappings: [
            {
              containerPort: containerPort,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': `/ecs/${environment}/app`,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
    });

    // Create ECS Service
    this.service = new EcsService(this, 'service', {
      name: `app-service-${environment}`,
      cluster: this.cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnetIds,
        securityGroups: securityGroupIds,
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroupArn,
          containerName: 'app',
          containerPort: containerPort,
        },
      ],
    });
  }
}
