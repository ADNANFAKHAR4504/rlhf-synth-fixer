/**
 * tap-stack.ts
 *
 * Optimized ECS deployment with proper resource allocation, autoscaling,
 * monitoring, and security best practices.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Container image URI (parameterized, not hard-coded)
   */
  containerImageUri?: pulumi.Input<string>;

  /**
   * S3 bucket name for application data access
   */
  s3BucketName?: pulumi.Input<string>;

  /**
   * VPC ID for ECS deployment
   */
  vpcId?: pulumi.Input<string>;

  /**
   * Subnet IDs for ECS tasks
   */
  subnetIds?: pulumi.Input<pulumi.Input<string>[]>;

  /**
   * Desired task count
   */
  desiredCount?: pulumi.Input<number>;
}

/**
 * Represents the optimized ECS deployment with monitoring and autoscaling
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly taskDefinitionArn: pulumi.Output<string>;
  public readonly cpuAlarmName: pulumi.Output<string>;
  public readonly memoryAlarmName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const resourceSuffix = `${environmentSuffix}-j7`;
    const tags = args.tags || {};
    const containerImageUri =
      args.containerImageUri || pulumi.output('nginx:latest');
    const s3BucketName =
      args.s3BucketName || pulumi.output(`tap-data-${environmentSuffix}`);
    const desiredCount = args.desiredCount || pulumi.output(2);

    // Get VPC information - use default VPC if not provided
    const vpcId =
      args.vpcId ||
      aws.ec2
        .getVpc({
          default: true,
        })
        .then(vpc => vpc.id);

    const subnetIds =
      args.subnetIds ||
      aws.ec2
        .getSubnets({
          filters: [
            {
              name: 'vpc-id',
              values: [vpcId as string],
            },
          ],
        })
        .then(subnets => subnets.ids);

    // ECS Cluster with Container Insights enabled
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${resourceSuffix}`,
      {
        name: `ecs-cluster-${resourceSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          ...tags,
          Name: `ecs-cluster-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for ECS tasks
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${resourceSuffix}`,
      {
        name: `/ecs/tap-${resourceSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `ecs-log-group-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Role for ECS Task Execution (used by ECS agent)
    const taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${resourceSuffix}`,
      {
        name: `ecs-task-execution-role-${resourceSuffix}`,
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
          ...tags,
          Name: `ecs-task-execution-role-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${resourceSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // IAM Role for ECS Task (used by application container)
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${resourceSuffix}`,
      {
        name: `ecs-task-role-${resourceSuffix}`,
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
          ...tags,
          Name: `ecs-task-role-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // Least privilege S3 policy - only GetObject permission
    const s3Policy = new aws.iam.Policy(
      `ecs-s3-policy-${resourceSuffix}`,
      {
        name: `ecs-s3-policy-${resourceSuffix}`,
        description: 'Least privilege S3 access for ECS tasks - GetObject only',
        policy: pulumi.all([s3BucketName]).apply(([bucketName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject'],
                Resource: `arn:aws:s3:::${bucketName}/*`,
              },
            ],
          })
        ),
        tags: {
          ...tags,
          Name: `ecs-s3-policy-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-s3-policy-attachment-${resourceSuffix}`,
      {
        role: taskRole.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    // Security Group for ECS tasks
    const securityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${resourceSuffix}`,
      {
        name: `ecs-sg-${resourceSuffix}`,
        description: 'Security group for ECS tasks',
        vpcId: vpcId,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `ecs-sg-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Task Definition with optimized CPU (512) and initial memory (1GB)
    const taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-def-${resourceSuffix}`,
      {
        family: `tap-${resourceSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512', // Optimized from 2048 to 512
        memory: '1024', // Initial 1GB, will autoscale to 4GB
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([containerImageUri, logGroup.name])
          .apply(([imageUri, logGroupName]) =>
            JSON.stringify([
              {
                name: 'app',
                image: imageUri,
                essential: true,
                portMappings: [
                  {
                    containerPort: 80,
                    protocol: 'tcp',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': aws.config.region!,
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
            ])
          ),
        tags: {
          ...tags,
          Name: `ecs-task-def-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `ecs-service-${resourceSuffix}`,
      {
        name: `ecs-service-${resourceSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: desiredCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: subnetIds,
          securityGroups: [securityGroup.id],
          assignPublicIp: true,
        },
        tags: {
          ...tags,
          Name: `ecs-service-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // Application Auto Scaling Target for Memory
    const scalableTarget = new aws.appautoscaling.Target(
      `ecs-autoscale-target-${resourceSuffix}`,
      {
        serviceNamespace: 'ecs',
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        minCapacity: 1,
        maxCapacity: 4, // Memory will scale between 1GB (1 task) and 4GB (4 tasks)
      },
      { parent: this }
    );

    // Auto Scaling Policy for Memory Usage
    new aws.appautoscaling.Policy(
      `ecs-memory-scaling-${resourceSuffix}`,
      {
        name: `ecs-memory-scaling-${resourceSuffix}`,
        serviceNamespace: scalableTarget.serviceNamespace,
        resourceId: scalableTarget.resourceId,
        scalableDimension: scalableTarget.scalableDimension,
        policyType: 'TargetTrackingScaling',
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for CPU Utilization (>80%)
    const cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-cpu-alarm-${resourceSuffix}`,
      {
        name: `ecs-cpu-alarm-${resourceSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when ECS CPU utilization exceeds 80%',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
        tags: {
          ...tags,
          Name: `ecs-cpu-alarm-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Memory Utilization (>90%)
    const memoryAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-memory-alarm-${resourceSuffix}`,
      {
        name: `ecs-memory-alarm-${resourceSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 90,
        alarmDescription: 'Alert when ECS memory utilization exceeds 90%',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
        tags: {
          ...tags,
          Name: `ecs-memory-alarm-${resourceSuffix}`,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.clusterArn = cluster.arn;
    this.serviceArn = service.id;
    this.taskDefinitionArn = taskDefinition.arn;
    this.cpuAlarmName = cpuAlarm.name;
    this.memoryAlarmName = memoryAlarm.name;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      clusterArn: this.clusterArn,
      serviceArn: this.serviceArn,
      taskDefinitionArn: this.taskDefinitionArn,
      cpuAlarmName: this.cpuAlarmName,
      memoryAlarmName: this.memoryAlarmName,
      logGroupName: this.logGroupName,
    });
  }
}
