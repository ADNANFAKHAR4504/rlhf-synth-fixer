import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

export interface EcsConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ecrRepositoryUrl: string;
  environmentName: string;
  desiredCount: number;
  cpu: string;
  memory: string;
  environmentSuffix: string;
  certificateArn?: string; // Optional ACM certificate ARN for HTTPS
}

export class EcsConstruct extends Construct {
  public readonly clusterName: string;

  public readonly clusterArn: string;

  public readonly albArn: string;

  public readonly albDnsName: string;

  public readonly serviceArn: string;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // CloudWatch Log Group for ECS tasks
    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/ecs/${props.environmentName}-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Environment: props.environmentName,
      },
    });

    // ECS Cluster
    const cluster = new EcsCluster(this, 'cluster', {
      name: `app-cluster-${props.environmentName}-${props.environmentSuffix}`,
      tags: {
        Name: `app-cluster-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    // ALB Security Group
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: 'Security group for ALB',
      vpcId: props.vpcId,
      tags: {
        Name: `alb-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    // ECS Task Security Group
    const taskSg = new SecurityGroup(this, 'task-sg', {
      name: `ecs-task-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: props.vpcId,
      tags: {
        Name: `ecs-task-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new SecurityGroupRule(this, 'task-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSg.id,
      securityGroupId: taskSg.id,
    });

    new SecurityGroupRule(this, 'task-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: taskSg.id,
    });

    // IAM Roles
    const executionRole = new IamRole(this, 'execution-role', {
      name: `ecs-execution-${props.environmentName}-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Environment: props.environmentName,
      },
    });

    new IamRolePolicyAttachment(this, 'execution-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    const taskRole = new IamRole(this, 'task-role', {
      name: `ecs-task-${props.environmentName}-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Environment: props.environmentName,
      },
    });

    const taskPolicy = new IamPolicy(this, 'task-policy', {
      name: `ecs-task-policy-${props.environmentName}-${props.environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:::app-bucket-${props.environmentName}-${props.environmentSuffix}/*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'task-policy-attachment', {
      role: taskRole.name,
      policyArn: taskPolicy.arn,
    });

    // Task Definition
    const taskDef = new EcsTaskDefinition(this, 'task-def', {
      family: `app-task-${props.environmentName}-${props.environmentSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: props.cpu,
      memory: props.memory,
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'app',
          image: `${props.ecrRepositoryUrl}:latest`,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [{ name: 'ENVIRONMENT', value: props.environmentName }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'app',
            },
          },
        },
      ]),
      tags: {
        Environment: props.environmentName,
      },
    });

    // ALB
    const alb = new Lb(this, 'alb', {
      name: `alb-${props.environmentName}-${props.environmentSuffix}`,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: props.publicSubnetIds,
      tags: {
        Name: `alb-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `tg-${props.environmentName}-${props.environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
      },
      tags: {
        Environment: props.environmentName,
      },
    });

    // HTTP Listener - redirect to HTTPS if certificate provided, otherwise forward
    const httpListener = new LbListener(this, 'listener-http', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: props.certificateArn
        ? [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ]
        : [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
      dependsOn: [alb, targetGroup],
    });

    // HTTPS Listener - only create if certificate ARN is provided
    if (props.certificateArn) {
      new LbListener(this, 'listener-https', {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        certificateArn: props.certificateArn,
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        dependsOn: [alb, targetGroup, httpListener],
      });
    }

    // ECS Service
    // Note: For initial deployment without container image, set desiredCount to 0
    // in environment config to prevent task failures. After pushing container image
    // to ECR, update the environment config desiredCount and redeploy.
    const service = new EcsService(this, 'service', {
      name: `app-service-${props.environmentName}-${props.environmentSuffix}`,
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      desiredCount: props.desiredCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: props.privateSubnetIds,
        securityGroups: [taskSg.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'app',
          containerPort: 8080,
        },
      ],
      tags: {
        Environment: props.environmentName,
      },
      dependsOn: [httpListener, targetGroup],
    });

    this.clusterName = cluster.name;
    this.clusterArn = cluster.arn;
    this.albArn = alb.arn;
    this.albDnsName = alb.dnsName;
    this.serviceArn = service.id;
  }
}
