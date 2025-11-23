/**
 * ecs.ts
 *
 * ECS Fargate cluster and service for payment processing application
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  rdsSecurityGroupId: pulumi.Output<string>;
  taskExecutionRoleArn: pulumi.Output<string>;
  taskRoleArn: pulumi.Output<string>;
  rdsClusterEndpoint: pulumi.Output<string>;
  tags?: { [key: string]: string };
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  private service: aws.ecs.Service;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `payment-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `payment-ecs-cluster-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.clusterName = cluster.name;

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpc.id,
        description: 'Security group for ECS Fargate tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Application port',
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
          Name: `payment-ecs-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.securityGroupId = ecsSecurityGroup.id;

    // Allow ECS to access RDS
    new aws.ec2.SecurityGroupRule(
      `ecs-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: ecsSecurityGroup.id,
        securityGroupId: args.rdsSecurityGroupId,
        description: 'Allow ECS to access RDS',
      },
      { parent: this }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${args.environmentSuffix}`,
      {
        name: `/ecs/payment-app-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${args.environmentSuffix}`,
      {
        family: `payment-task-${args.environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: args.taskExecutionRoleArn,
        taskRoleArn: args.taskRoleArn,
        containerDefinitions: pulumi.interpolate`[
        {
          "name": "payment-app",
          "image": "public.ecr.aws/nginx/nginx:latest",
          "cpu": 512,
          "memory": 1024,
          "essential": true,
          "portMappings": [
            {
              "containerPort": 8080,
              "protocol": "tcp"
            }
          ],
          "environment": [
            {
              "name": "DB_ENDPOINT",
              "value": "${args.rdsClusterEndpoint}"
            },
            {
              "name": "DB_NAME",
              "value": "paymentdb"
            },
            {
              "name": "ENVIRONMENT",
              "value": "${args.environmentSuffix}"
            }
          ],
          "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
              "awslogs-group": "${logGroup.name}",
              "awslogs-region": "us-east-1",
              "awslogs-stream-prefix": "payment"
            }
          }
        }
      ]`,
        tags: {
          Name: `payment-task-def-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `payment-tg-${args.environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: args.vpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200-399',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `payment-target-group-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.targetGroupArn = targetGroup.arn;

    // ECS Service
    this.service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `payment-service-${args.environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: args.privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'payment-app',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `payment-service-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.serviceName = this.service.name;

    this.registerOutputs({
      securityGroupId: this.securityGroupId,
      targetGroupArn: this.targetGroupArn,
      clusterName: this.clusterName,
      serviceName: this.serviceName,
    });
  }

  public attachLoadBalancer(_listenerArn: pulumi.Output<string>): void {
    // This is handled by the loadBalancers configuration in the service
    // No additional action needed
  }
}
