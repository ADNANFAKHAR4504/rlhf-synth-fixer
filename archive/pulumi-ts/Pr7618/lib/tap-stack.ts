/**
 * tap-stack.ts
 *
 * Optimized ECS Fargate service deployment with proper configuration management,
 * monitoring, and resource lifecycle policies.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
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
   * Container configuration
   */
  containerName?: string;
  containerImage?: string;
  containerMemory?: number;
  containerCpu?: number;
  logRetentionDays?: number;
  stopTimeout?: number;

  /**
   * Alarm thresholds
   */
  cpuAlarmThreshold?: number;
  memoryAlarmThreshold?: number;

  /**
   * Health check configuration
   */
  healthCheckInterval?: number;
  healthCheckTimeout?: number;
  healthCheckHealthyThreshold?: number;
  healthCheckUnhealthyThreshold?: number;
}

/**
 * Represents the main Pulumi component resource for the optimized ECS Fargate deployment.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly taskDefinitionArn: pulumi.Output<string>;
  public readonly repositoryUrl: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Configuration with defaults
    const containerName = args.containerName || 'app-container';
    const containerImage = args.containerImage || 'nginx:latest';
    const containerMemory = args.containerMemory || 512;
    const containerCpu = args.containerCpu || 256;
    const logRetentionDays = args.logRetentionDays || 7;
    const stopTimeout = args.stopTimeout || 30;
    const cpuAlarmThreshold = args.cpuAlarmThreshold || 80;
    const memoryAlarmThreshold = args.memoryAlarmThreshold || 80;
    const healthCheckInterval = args.healthCheckInterval || 30;
    const healthCheckTimeout = args.healthCheckTimeout || 5;
    const healthCheckHealthyThreshold = args.healthCheckHealthyThreshold || 2;

    // ECR Repository with lifecycle policy for cleanup
    const repository = new aws.ecr.Repository(
      `tap-repository-${environmentSuffix}`,
      {
        name: `tap-app-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: tags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy for cleanup
    new aws.ecr.LifecyclePolicy(
      `tap-lifecycle-policy-${environmentSuffix}`,
      {
        repository: repository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep last 10 images',
              selection: {
                tagStatus: 'any',
                countType: 'imageCountMoreThan',
                countNumber: 10,
              },
              action: {
                type: 'expire',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // CloudWatch Log Group with 7-day retention
    const logGroup = new aws.cloudwatch.LogGroup(
      `tap-log-group-${environmentSuffix}`,
      {
        name: `/ecs/tap-service-${environmentSuffix}`,
        retentionInDays: logRetentionDays,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Task Execution Role with minimal required permissions
    const taskExecutionRole = new aws.iam.Role(
      `tap-task-execution-role-${environmentSuffix}`,
      {
        name: `tap-task-execution-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach minimal required policies
    new aws.iam.RolePolicyAttachment(
      `tap-task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for ECR access
    new aws.iam.RolePolicy(
      `tap-ecr-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi.jsonStringify({
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
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: logGroup.arn,
            },
          ],
        }),
      },
      { parent: this }
    );

    // IAM Task Role for application permissions
    const taskRole = new aws.iam.Role(
      `tap-task-role-${environmentSuffix}`,
      {
        name: `tap-task-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `tap-cluster-${environmentSuffix}`,
      {
        name: `tap-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Task Definition with proper memory and CPU configurations
    const taskDefinition = new aws.ecs.TaskDefinition(
      `tap-task-def-${environmentSuffix}`,
      {
        family: `tap-service-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: containerCpu.toString(),
        memory: containerMemory.toString(),
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: containerName,
            image: containerImage,
            memory: containerMemory,
            cpu: containerCpu,
            essential: true,
            stopTimeout: stopTimeout,
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroup.name,
                'awslogs-region': aws.config.region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            healthCheck: {
              command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
              interval: healthCheckInterval,
              timeout: healthCheckTimeout,
              retries: healthCheckHealthyThreshold,
              startPeriod: 60,
            },
          },
        ]),
        tags: tags,
      },
      { parent: this }
    );

    // Create VPC for ECS Service
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `tap-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets in two availability zones
    const subnet1 = new aws.ec2.Subnet(
      `tap-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-subnet-1-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const subnet2 = new aws.ec2.Subnet(
      `tap-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `tap-subnet-2-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route table for public subnets
    const routeTable = new aws.ec2.RouteTable(
      `tap-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to internet gateway
    new aws.ec2.Route(
      `tap-route-${environmentSuffix}`,
      {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate route table with subnets
    new aws.ec2.RouteTableAssociation(
      `tap-rta-1-${environmentSuffix}`,
      {
        subnetId: subnet1.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `tap-rta-2-${environmentSuffix}`,
      {
        subnetId: subnet2.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    // Security Group for ECS Service
    const securityGroup = new aws.ec2.SecurityGroup(
      `tap-sg-${environmentSuffix}`,
      {
        name: `tap-service-sg-${environmentSuffix}`,
        description: 'Security group for ECS Fargate service',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
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
        tags: tags,
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `tap-service-${environmentSuffix}`,
      {
        name: `tap-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 1,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [subnet1.id, subnet2.id],
          securityGroups: [securityGroup.id],
          assignPublicIp: true,
        },
        healthCheckGracePeriodSeconds: 60,
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Alarms for CPU utilization
    new aws.cloudwatch.MetricAlarm(
      `tap-cpu-alarm-${environmentSuffix}`,
      {
        name: `tap-cpu-utilization-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: cpuAlarmThreshold,
        datapointsToAlarm: 2,
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
        alarmDescription: `CPU utilization above ${cpuAlarmThreshold}% for ECS service`,
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Alarms for Memory utilization
    new aws.cloudwatch.MetricAlarm(
      `tap-memory-alarm-${environmentSuffix}`,
      {
        name: `tap-memory-utilization-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: memoryAlarmThreshold,
        datapointsToAlarm: 2,
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
        alarmDescription: `Memory utilization above ${memoryAlarmThreshold}% for ECS service`,
        tags: tags,
      },
      { parent: this }
    );

    // Set outputs
    this.clusterArn = cluster.arn;
    this.serviceArn = service.id;
    this.taskDefinitionArn = taskDefinition.arn;
    this.repositoryUrl = repository.repositoryUrl;
    this.logGroupName = logGroup.name;

    // Register the outputs of this component.
    this.registerOutputs({
      clusterArn: this.clusterArn,
      serviceArn: this.serviceArn,
      taskDefinitionArn: this.taskDefinitionArn,
      repositoryUrl: this.repositoryUrl,
      logGroupName: this.logGroupName,
    });
  }
}
