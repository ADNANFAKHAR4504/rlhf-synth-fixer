import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

export interface EcsConstructProps {
  environmentSuffix: string;
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  dbSecretArn: string;
  cacheEndpoint: string;
}

export class EcsConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;
  public readonly loadBalancer: Lb;
  public readonly taskDefinition: EcsTaskDefinition;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpc,
      publicSubnets,
      privateSubnets,
      dbSecretArn,
      cacheEndpoint,
    } = props;

    // Create ECS Cluster
    this.cluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `payment-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create CloudWatch Log Group for ECS tasks
    const logGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `payment-app-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create ECS Task Execution Role
    const executionRole = new IamRole(this, 'ecs-execution-role', {
      name: `payment-ecs-execution-role-${environmentSuffix}`,
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
        Name: `payment-ecs-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach ECS Task Execution policy
    new IamRolePolicyAttachment(this, 'ecs-execution-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create ECS Task Role
    const taskRole = new IamRole(this, 'ecs-task-role', {
      name: `payment-ecs-task-role-${environmentSuffix}`,
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
        Name: `payment-ecs-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Add policy to access Secrets Manager
    new IamRolePolicy(this, 'ecs-task-secrets-policy', {
      name: 'secrets-access',
      role: taskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: dbSecretArn,
          },
        ],
      }),
    });

    // Create Task Definition
    this.taskDefinition = new EcsTaskDefinition(this, 'ecs-task-def', {
      family: `payment-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'payment-app',
          image: 'nginx:latest',
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              hostPort: 80,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'CACHE_ENDPOINT',
              value: cacheEndpoint,
            },
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
          ],
          secrets: [
            {
              name: 'DB_SECRET',
              valueFrom: dbSecretArn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': process.env.AWS_REGION || 'us-west-2',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          mountPoints: [],
          volumesFrom: [],
          systemControls: [],
        },
      ]),
      tags: {
        Name: `payment-app-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Security Group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `payment-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `payment-alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow HTTP from internet
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP from internet',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create Security Group for ECS tasks
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `payment-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `payment-ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow traffic from ALB
    new SecurityGroupRule(this, 'ecs-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create Application Load Balancer
    this.loadBalancer = new Lb(this, 'alb', {
      name: `payment-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: false,
      tags: {
        Name: `payment-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [...publicSubnets, albSecurityGroup],
    });

    // Create Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `payment-tg-${environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
      },
      tags: {
        Name: `payment-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create ALB Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Create ECS Service
    this.service = new EcsService(this, 'ecs-service', {
      name: `payment-service-${environmentSuffix}`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnets.map(subnet => subnet.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'payment-app',
          containerPort: 80,
        },
      ],
      tags: {
        Name: `payment-service-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [this.loadBalancer, targetGroup, ecsSecurityGroup],
    });
  }
}
