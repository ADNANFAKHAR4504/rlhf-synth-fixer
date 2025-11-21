import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsServiceArgs {
  environmentSuffix: string;
  environment: string;
  cluster: aws.ecs.Cluster;
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  albSubnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  imageTag: string;
  databaseEndpoint: pulumi.Output<string>;
  databaseSecretArn: pulumi.Output<string>;
}

export class EcsService extends pulumi.ComponentResource {
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsServiceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:EcsService', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(
      `ecs-execution-role-${args.environmentSuffix}`,
      {
        name: `ecs-execution-role-${args.environmentSuffix}`,
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
          Name: `ecs-execution-role-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-execution-policy-${args.environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      defaultResourceOptions
    );

    // Add policy to read secrets
    new aws.iam.RolePolicy(
      `ecs-secrets-policy-${args.environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "secretsmanager:GetSecretValue",
            "kms:Decrypt"
          ],
          "Resource": ["${args.databaseSecretArn}", "${args.databaseSecretArn}*"]
        }]
      }`,
      },
      defaultResourceOptions
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
        name: `ecs-task-role-${args.environmentSuffix}`,
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
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Add S3 access policy
    new aws.iam.RolePolicy(
      `ecs-s3-policy-${args.environmentSuffix}`,
      {
        role: taskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Resource: ['*'],
            },
          ],
        }),
      },
      defaultResourceOptions
    );

    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${args.environmentSuffix}`,
      {
        name: `/ecs/trading-app-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-logs-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create task definition
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-${args.environmentSuffix}`,
      {
        family: `trading-app-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.interpolate`[{
        "name": "trading-app",
        "image": "public.ecr.aws/docker/library/nginx:${args.imageTag}",
        "essential": true,
        "portMappings": [{
          "containerPort": 80,
          "protocol": "tcp"
        }],
        "environment": [{
          "name": "ENVIRONMENT",
          "value": "${args.environment}"
        }, {
          "name": "DATABASE_ENDPOINT",
          "value": "${args.databaseEndpoint}"
        }],
        "secrets": [{
          "name": "DATABASE_PASSWORD",
          "valueFrom": "${args.databaseSecretArn}"
        }],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "${logGroup.name}",
            "awslogs-region": "${aws.getRegionOutput().name}",
            "awslogs-stream-prefix": "ecs"
          }
        }
      }]`,
        tags: {
          Name: `ecs-task-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create Application Load Balancer
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `alb-sg-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `alb-${args.environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: args.albSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `tg-${args.environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: args.vpcId,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `tg-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    new aws.lb.Listener(
      `alb-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: {
          Name: `alb-listener-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    // Create ECS service
    this.service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `trading-service-${args.environmentSuffix}`,
        cluster: args.cluster.arn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: args.subnetIds,
          securityGroups: [args.securityGroupId],
        },
        loadBalancers: [
          {
            targetGroupArn: this.targetGroup.arn,
            containerName: 'trading-app',
            containerPort: 80,
          },
        ],
        tags: {
          Name: `ecs-service-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.targetGroup] }
    );

    this.albDnsName = this.alb.dnsName;
    this.albArn = this.alb.arn;
    this.serviceName = this.service.name;

    this.registerOutputs({
      serviceName: this.serviceName,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
    });
  }
}
