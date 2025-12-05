import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface EcsFargateStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

/**
 * Baseline ECS Fargate stack with basic configuration
 * This is the BASELINE - optimization script will enhance it later
 */
export class EcsFargateStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: EcsFargateStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC for the ECS cluster
    const vpc = new ec2.Vpc(this, `ecs-vpc-${environmentSuffix}`, {
      vpcName: `ecs-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0, // Cost optimization: Use VPC endpoints instead
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, `ecs-cluster-${environmentSuffix}`, {
      clusterName: `ecs-cluster-${environmentSuffix}`,
      vpc: vpc,
      // Container Insights will be enabled by optimization script
      containerInsights: false,
    });

    // Create Task Execution Role
    const taskExecutionRole = new iam.Role(
      this,
      `task-execution-role-${environmentSuffix}`,
      {
        roleName: `ecs-task-execution-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
      }
    );

    // Create Task Role (for application code)
    const taskRole = new iam.Role(this, `task-role-${environmentSuffix}`, {
      roleName: `ecs-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      // Basic permissions - optimization script will add more if needed
      inlinePolicies: {
        BasicTaskPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create Log Group for container logs
    const logGroup = new logs.LogGroup(
      this,
      `ecs-log-group-${environmentSuffix}`,
      {
        logGroupName: `/ecs/fargate-service-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable
      }
    );

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `task-def-${environmentSuffix}`,
      {
        family: `fargate-task-${environmentSuffix}`,
        cpu: 1024, // 1 vCPU
        memoryLimitMiB: 2048, // 2 GB
        taskRole: taskRole,
        executionRole: taskExecutionRole,
      }
    );

    // Add container to task definition
    taskDefinition.addContainer(`app-container-${environmentSuffix}`, {
      containerName: `app-container-${environmentSuffix}`,
      // Using a simple nginx image for demonstration
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      `alb-${environmentSuffix}`,
      {
        loadBalancerName: `ecs-alb-${environmentSuffix}`,
        vpc: vpc,
        internetFacing: true,
        deletionProtection: false, // Must be destroyable
      }
    );

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `target-group-${environmentSuffix}`,
      {
        targetGroupName: `ecs-tg-${environmentSuffix}`,
        vpc: vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        deregistrationDelay: cdk.Duration.seconds(30), // Graceful shutdown
        healthCheck: {
          enabled: true,
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Add listener to ALB
    this.alb.addListener(`listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Fargate Service
    // BASELINE configuration - optimization script will enhance this
    this.service = new ecs.FargateService(
      this,
      `fargate-service-${environmentSuffix}`,
      {
        serviceName: `fargate-service-${environmentSuffix}`,
        cluster: this.cluster,
        taskDefinition: taskDefinition,
        desiredCount: 2, // Start with 2 tasks
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
        healthCheckGracePeriod: cdk.Duration.seconds(60), // As specified
        assignPublicIp: true, // Using public subnets
      }
    );

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // BASELINE Autoscaling - limited capacity
    // Optimization script will expand this and add better policies
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5, // Baseline max - will be increased to 10 by optimization
    });

    // Basic CPU-based scaling (optimization script will add more sophisticated policies)
    scaling.scaleOnCpuUtilization(`cpu-scaling-${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
      exportName: `alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service Name',
      exportName: `service-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS Service ARN',
      exportName: `service-arn-${environmentSuffix}`,
    });
  }
}
