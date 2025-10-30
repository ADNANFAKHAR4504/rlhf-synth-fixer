/**
 * ecs-stack.ts
 *
 * Creates ECS Fargate cluster, ALB, task definition, service, and auto-scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  tags?: { [key: string]: string };
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      tags,
    } = args;

    // Create ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
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
          Name: `alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Task Security Group
    const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP from ALB',
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
          Name: `ecs-task-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        stickiness: {
          enabled: true,
          type: 'app_cookie',
          cookieName: 'APPCOOKIE',
          cookieDuration: 86400,
        },
        tags: {
          Name: `tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ALB Listener
    new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
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
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: {
          Name: `ecs-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `cluster-${environmentSuffix}`,
      {
        tags: {
          Name: `cluster-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.clusterName = cluster.name;

    // Create ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `task-execution-role-${environmentSuffix}`,
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
        tags: {
          Name: `task-execution-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create ECS Task Role
    const taskRole = new aws.iam.Role(
      `task-role-${environmentSuffix}`,
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
        tags: {
          Name: `task-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get ECR repository reference (not directly used but validates repository exists)
    // const ecrRepo = aws.ecr.getRepositoryOutput({
    //   name: 'product-catalog-api',
    // });

    const accountId = aws.getCallerIdentity().then(id => id.accountId);
    const region = aws.getRegion().then(r => r.name);

    // Create Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${environmentSuffix}`,
      {
        family: `product-catalog-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([accountId, region, logGroup.name])
          .apply(([accId, reg, logGroupName]) =>
            JSON.stringify([
              {
                name: 'product-catalog-api',
                image: `${accId}.dkr.ecr.${reg}.amazonaws.com/product-catalog-api:latest`,
                portMappings: [
                  {
                    containerPort: 80,
                    protocol: 'tcp',
                  },
                ],
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': reg,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
                essential: true,
              },
            ])
          ),
        tags: {
          Name: `task-def-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Service with Fargate Spot
    const service = new aws.ecs.Service(
      `service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 50,
            base: 2,
          },
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 50,
            base: 0,
          },
        ],
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsTaskSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'product-catalog-api',
            containerPort: 80,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `service-${environmentSuffix}`,
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [alb],
      }
    );

    // Create Auto Scaling Target
    const scalableTarget = new aws.appautoscaling.Target(
      `scaling-target-${environmentSuffix}`,
      {
        serviceNamespace: 'ecs',
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        minCapacity: 3,
        maxCapacity: 10,
      },
      { parent: this }
    );

    // Create Auto Scaling Policy
    new aws.appautoscaling.Policy(
      `scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: scalableTarget.resourceId,
        scalableDimension: scalableTarget.scalableDimension,
        serviceNamespace: scalableTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70.0,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterName: this.clusterName,
    });
  }
}
