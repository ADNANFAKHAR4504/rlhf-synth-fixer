/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of all AWS resources including VPC, ECS cluster,
 * ALB, security groups, and auto-scaling configuration.
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
   * Optional cost center for billing purposes.
   */
  costCenter?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of all AWS resources
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  // VPC and networking outputs
  public readonly vpcId: pulumi.Output<string>;

  // ECS Cluster outputs
  public readonly clusterId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;

  // ALB outputs
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  // ECS Service outputs
  public readonly serviceArn: pulumi.Output<string>;
  public readonly taskDefinitionArn: pulumi.Output<string>;

  // Auto-scaling outputs
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly capacityProviderName: pulumi.Output<string>;

  // CloudWatch outputs
  public readonly lowCpuAlarmArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  // Instance configuration
  public readonly instanceType: pulumi.Output<string>;

  // Service name output
  public readonly serviceName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Configuration management - use Pulumi config with defaults
    const config = new pulumi.Config();
    const environment = config.get('environment') || 'dev';
    const region = config.get('awsRegion') || 'us-east-1';
    const containerPort = config.getNumber('containerPort') || 3000;
    const desiredCount = config.getNumber('desiredCount') || 2;

    // Standard tags for all resources
    const commonTags = {
      Environment: environment,
      Project: 'ecs-optimization',
      ManagedBy: 'Pulumi',
      Team: 'platform-engineering',
      ...tags,
    };

    // Create VPC and networking
    const vpc = new aws.ec2.Vpc(
      `ecs-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...commonTags, Name: `ecs-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    const subnet1 = new aws.ec2.Subnet(
      `ecs-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${region}a`,
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `ecs-subnet-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    const subnet2 = new aws.ec2.Subnet(
      `ecs-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${region}b`,
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `ecs-subnet-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    const igw = new aws.ec2.InternetGateway(
      `ecs-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...commonTags, Name: `ecs-igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    const routeTable = new aws.ec2.RouteTable(
      `ecs-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: { ...commonTags, Name: `ecs-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `ecs-rta-1-${environmentSuffix}`,
      {
        subnetId: subnet1.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `ecs-rta-2-${environmentSuffix}`,
      {
        subnetId: subnet2.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    // Security groups - cleaned up, no unused rules
    const albSg = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
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
            description: 'All outbound traffic',
          },
        ],
        tags: { ...commonTags, Name: `alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    const ecsSg = new aws.ec2.SecurityGroup(
      `ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: containerPort,
            toPort: containerPort,
            securityGroups: [albSg.id],
            description: 'Container port from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...commonTags, Name: `ecs-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // CloudWatch log group with retention policy
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/app-${environmentSuffix}`,
        retentionInDays: environment === 'production' ? 30 : 7,
        tags: commonTags,
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `app-cluster-${environmentSuffix}`,
      {
        name: `app-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM role for ECS task execution - no hardcoded ARN
    const executionRole = new aws.iam.Role(
      `ecs-execution-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-execution-policy-${environmentSuffix}`,
      {
        role: executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Task definition with proper resource reservations
    const taskDefinition = new aws.ecs.TaskDefinition(
      `app-task-${environmentSuffix}`,
      {
        family: `app-task-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: executionRole.arn,
        containerDefinitions: pulumi.interpolate`[{
        "name": "app",
        "image": "nginx:latest",
        "cpu": 256,
        "memory": 512,
        "memoryReservation": 256,
        "essential": true,
        "portMappings": [{
            "containerPort": ${containerPort},
            "protocol": "tcp"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${logGroup.name}",
                "awslogs-region": "${region}",
                "awslogs-stream-prefix": "app"
            }
        },
        "environment": [{
            "name": "ENVIRONMENT",
            "value": "${environment}"
        }]
    }]`,
        tags: commonTags,
      },
      { parent: this, dependsOn: [logGroup, executionRole] }
    );

    // ALB with optimized health checks
    const alb = new aws.lb.LoadBalancer(
      `app-alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [subnet1.id, subnet2.id],
        enableDeletionProtection: false,
        tags: commonTags,
      },
      { parent: this, dependsOn: [igw] }
    );

    const targetGroup = new aws.lb.TargetGroup(
      `app-tg-${environmentSuffix}`,
      {
        port: containerPort,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          path: '/health',
          matcher: '200-299',
        },
        tags: commonTags,
      },
      { parent: this }
    );

    const listener = new aws.lb.Listener(
      `app-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Create ECS service
    const service = new aws.ecs.Service(
      `app-service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: desiredCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [subnet1.id, subnet2.id],
          securityGroups: [ecsSg.id],
          assignPublicIp: true,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'app',
            containerPort: containerPort,
          },
        ],
        // Note: Placement strategies are not supported with FARGATE launch type
        // FARGATE automatically optimizes placement across availability zones
        tags: commonTags,
      },
      { parent: this, dependsOn: [listener] }
    );

    // CPU-based auto-scaling instead of request count
    const target = new aws.appautoscaling.Target(
      `app-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: desiredCount,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const scalingPolicy = new aws.appautoscaling.Policy(
      `app-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: target.resourceId,
        scalableDimension: target.scalableDimension,
        serviceNamespace: target.serviceNamespace,
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

    // Create CloudWatch alarm for low CPU utilization
    const lowCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `low-cpu-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 20,
        alarmDescription: 'Low CPU utilization alarm for cost optimization',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.name,
        },
        tags: commonTags,
      },
      { parent: this }
    );

    // Assign outputs
    this.vpcId = vpc.id;
    this.clusterId = cluster.id;
    this.clusterName = cluster.name;
    this.clusterArn = cluster.arn;
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.targetGroupArn = targetGroup.arn;
    this.serviceArn = service.id;
    this.serviceName = service.name;
    this.taskDefinitionArn = taskDefinition.arn;
    this.logGroupName = logGroup.name;
    this.lowCpuAlarmArn = lowCpuAlarm.arn;

    // For FARGATE, we don't have launch templates or ASGs, but provide placeholder outputs
    this.launchTemplateId = pulumi.output('fargate-managed');
    this.autoScalingGroupName = pulumi.output('fargate-managed');
    this.capacityProviderName = pulumi.output('FARGATE');
    this.instanceType = pulumi.output('FARGATE');

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      clusterId: this.clusterId,
      clusterName: this.clusterName,
      clusterArn: this.clusterArn,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      targetGroupArn: this.targetGroupArn,
      serviceArn: this.serviceArn,
      serviceName: this.serviceName,
      taskDefinitionArn: this.taskDefinitionArn,
      logGroupName: this.logGroupName,
      lowCpuAlarmArn: this.lowCpuAlarmArn,
      launchTemplateId: this.launchTemplateId,
      autoScalingGroupName: this.autoScalingGroupName,
      capacityProviderName: this.capacityProviderName,
      instanceType: this.instanceType,
    });
  }
}

// Reusable function for creating ECS services - consolidation
export function createECSService(
  name: string,
  cluster: aws.ecs.Cluster,
  taskDef: aws.ecs.TaskDefinition,
  tg: aws.lb.TargetGroup,
  subnets: pulumi.Input<string>[],
  sg: aws.ec2.SecurityGroup,
  count: number,
  containerPort: number,
  commonTags: { [key: string]: string },
  listener: aws.lb.Listener,
  parent?: pulumi.Resource
): aws.ecs.Service {
  return new aws.ecs.Service(
    name,
    {
      cluster: cluster.arn,
      taskDefinition: taskDef.arn,
      desiredCount: count,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnets,
        securityGroups: [sg.id],
        assignPublicIp: true,
      },
      loadBalancers: [
        {
          targetGroupArn: tg.arn,
          containerName: 'app',
          containerPort: containerPort,
        },
      ],
      // Note: Placement strategies are not supported with FARGATE launch type
      // FARGATE automatically optimizes placement across availability zones
      tags: commonTags,
    },
    { parent, dependsOn: [listener] }
  );
}
