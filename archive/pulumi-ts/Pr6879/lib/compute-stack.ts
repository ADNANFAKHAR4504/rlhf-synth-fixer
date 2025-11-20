/**
 * Compute Stack - ECS Fargate, ALB, and related resources
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  databaseEndpoint: pulumi.Output<string>;
  databaseSecurityGroupId: pulumi.Output<string>;
  tags: { [key: string]: string };
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:ComputeStack', name, {}, opts);

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...args.tags,
          Name: `alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for ECS Fargate tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Application port from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...args.tags,
          Name: `ecs-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Allow ECS tasks to access RDS
    new aws.ec2.SecurityGroupRule(
      `ecs-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: ecsSecurityGroup.id,
        securityGroupId: args.databaseSecurityGroupId,
        description: 'PostgreSQL access from ECS tasks',
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `alb-${args.environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false, // Required for destroyability
        tags: {
          ...args.tags,
          Name: `alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `tg-${args.environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...args.tags,
          Name: `tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `alb-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          ...args.tags,
          Name: `alb-listener-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS cluster
    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `ecs-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          ...args.tags,
          Name: `ecs-cluster-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.clusterName = ecsCluster.name;

    // Create IAM role for ECS task execution
    const ecsTaskExecutionRole = new aws.iam.Role(
      `ecs-task-exec-role-${args.environmentSuffix}`,
      {
        name: `ecs-task-exec-role-${args.environmentSuffix}`,
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
          ...args.tags,
          Name: `ecs-task-exec-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-exec-policy-${args.environmentSuffix}`,
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const ecsTaskRole = new aws.iam.Role(
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
          ...args.tags,
          Name: `ecs-task-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${args.environmentSuffix}`,
      {
        name: `/ecs/payment-app-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...args.tags,
          Name: `ecs-logs-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS task definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${args.environmentSuffix}`,
      {
        family: `payment-app-${args.environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsTaskExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: `payment-app-${args.environmentSuffix}`,
            image: 'nginx:latest', // Replace with actual Java application image
            essential: true,
            portMappings: [
              {
                containerPort: 8080,
                protocol: 'tcp',
              },
            ],
            environment: [
              {
                name: 'DB_ENDPOINT',
                value: args.databaseEndpoint,
              },
              {
                name: 'DB_PORT',
                value: '5432',
              },
              {
                name: 'DB_NAME',
                value: 'paymentdb',
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
          },
        ]),
        tags: {
          ...args.tags,
          Name: `task-def-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ECS service
    const ecsService = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `payment-app-service-${args.environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        platformVersion: '1.4.0',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: args.privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: `payment-app-${args.environmentSuffix}`,
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...args.tags,
          Name: `ecs-service-${args.environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [alb] }
    );

    this.serviceName = ecsService.name;

    this.registerOutputs({
      clusterName: this.clusterName,
      serviceName: this.serviceName,
      albDnsName: this.albDnsName,
    });
  }
}
