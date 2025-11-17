import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  databaseEndpoint: pulumi.Output<string>;
  databaseSecretArn: pulumi.Output<string>;
  region?: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly blueTargetGroupArn: pulumi.Output<string>;
  public readonly greenTargetGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      databaseSecretArn,
      region,
      tags,
    } = args;

    // Get region from args or default to us-east-1
    const awsRegion = region || pulumi.output('us-east-1');

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `payment-ecs-cluster-${environmentSuffix}`,
      {
        name: `payment-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Application Security Group
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-app-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for payment application tier',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Application port from VPC',
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-app-sg-${environmentSuffix}`,
          Tier: 'Application',
        })),
      },
      { parent: this }
    );

    // ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `payment-task-exec-role-${environmentSuffix}`,
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-exec-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-task-exec-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for Secrets Manager and X-Ray
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _taskExecutionPolicy = new aws.iam.RolePolicy(
      `payment-task-exec-custom-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi.all([databaseSecretArn]).apply(([secretArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: secretArn,
              },
              {
                Effect: 'Allow',
                Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ECS Task Role
    const taskRole = new aws.iam.Role(
      `payment-task-role-${environmentSuffix}`,
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _taskRolePolicy = new aws.iam.RolePolicy(
      `payment-task-role-policy-${environmentSuffix}`,
      {
        role: taskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/payment-app-${environmentSuffix}`,
        retentionInDays: 2557, // 7 years
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECR Repository (placeholder - assumes pre-existing image)
    const ecrRepo = new aws.ecr.Repository(
      `payment-ecr-${environmentSuffix}`,
      {
        name: `payment-app-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecr-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-def-${environmentSuffix}`,
      {
        family: `payment-app-${environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([
            ecrRepo.repositoryUrl,
            databaseSecretArn,
            logGroup.name,
            awsRegion,
          ])
          .apply(([repoUrl, secretArn, logGroupName, region]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                image: `${repoUrl}:latest`,
                cpu: 480,
                memory: 768,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'ENVIRONMENT',
                    value: environmentSuffix,
                  },
                  {
                    name: 'AWS_XRAY_DAEMON_ADDRESS',
                    value: 'xray-daemon:2000',
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: secretArn,
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
              },
              {
                name: 'xray-daemon',
                image: 'public.ecr.aws/xray/aws-xray-daemon:latest',
                cpu: 32,
                memory: 256,
                essential: true,
                portMappings: [
                  {
                    containerPort: 2000,
                    protocol: 'udp',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'xray',
                  },
                },
              },
            ])
          ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-def-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Target Groups for Blue-Green Deployment
    const blueTargetGroup = new aws.lb.TargetGroup(
      `payment-tg-blue-${environmentSuffix}`,
      {
        name: `payment-tg-blue-${environmentSuffix}`,
        port: 8080,
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
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-tg-blue-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const greenTargetGroup = new aws.lb.TargetGroup(
      `payment-tg-green-${environmentSuffix}`,
      {
        name: `payment-tg-green-${environmentSuffix}`,
        port: 8080,
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
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-tg-green-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `payment-ecs-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [appSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: blueTargetGroup.arn,
            containerName: 'payment-app',
            containerPort: 8080,
          },
        ],
        deploymentController: {
          type: 'CODE_DEPLOY',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-service-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [blueTargetGroup] }
    );

    // Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `payment-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // CPU-based Auto Scaling Policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cpuScalingPolicy = new aws.appautoscaling.Policy(
      `payment-cpu-scaling-${environmentSuffix}`,
      {
        name: `payment-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Memory-based Auto Scaling Policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _memoryScalingPolicy = new aws.appautoscaling.Policy(
      `payment-memory-scaling-${environmentSuffix}`,
      {
        name: `payment-memory-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          targetValue: 80,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Outputs
    this.clusterArn = cluster.arn;
    this.clusterName = cluster.name;
    this.serviceArn = service.id;
    this.serviceName = service.name;
    this.targetGroupArn = blueTargetGroup.arn;
    this.blueTargetGroupArn = blueTargetGroup.arn;
    this.greenTargetGroupArn = greenTargetGroup.arn;

    this.registerOutputs({
      clusterArn: this.clusterArn,
      clusterName: this.clusterName,
      serviceArn: this.serviceArn,
      serviceName: this.serviceName,
    });
  }
}
