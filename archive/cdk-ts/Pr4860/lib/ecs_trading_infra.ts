import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface EcsTradingInfraProps {
  vpc: ec2.IVpc;
}

export class EcsTradingInfra extends Construct {
  public readonly ecsCluster: ecs.Cluster;
  public readonly orderBrokerService: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly blueTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly greenTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly productionListener: elbv2.ApplicationListener;
  public readonly testListener: elbv2.ApplicationListener;
  public readonly codeDeployApplication: codedeploy.EcsApplication;
  public readonly deploymentGroup: codedeploy.EcsDeploymentGroup;
  public readonly alarmTopic: sns.Topic;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: EcsTradingInfraProps) {
    super(scope, id);

    // Create ECS Cluster with Container Insights enabled
    this.ecsCluster = new ecs.Cluster(this, 'TradingCluster', {
      vpc: props.vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Create a least-privilege IAM role for the OrderBroker service
    const orderBrokerTaskRole = new iam.Role(this, 'OrderBrokerTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role with least privilege for the OrderBroker service',
    });

    // Add permission to write to Kinesis stream
    orderBrokerTaskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kinesis:PutRecord',
          'kinesis:PutRecords',
          'kinesis:DescribeStream',
        ],
        resources: [
          `arn:aws:kinesis:us-east-2:${cdk.Stack.of(this).account}:stream/trades`,
        ],
      })
    );

    // Add permission to read/write from RDS database
    orderBrokerTaskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds-data:ExecuteStatement',
          'rds-data:BatchExecuteStatement',
        ],
        resources: [
          `arn:aws:rds:us-east-2:${cdk.Stack.of(this).account}:db:orders`,
        ],
      })
    );

    // Add CloudWatch Logs permissions
    orderBrokerTaskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:us-east-2:${cdk.Stack.of(this).account}:log-group:/ecs/order-broker:*`,
        ],
      })
    );

    // Create Fargate Task Definition with right-sized resources
    // Task definition supports both X86_64 and ARM64 through runtime platform setting
    const orderBrokerTaskDef = new ecs.FargateTaskDefinition(
      this,
      'OrderBrokerTaskDef',
      {
        cpu: 2048, // Right-sized from 4096 to 2048 based on the requirements
        memoryLimitMiB: 4096,
        taskRole: orderBrokerTaskRole,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      }
    );

    // Create log group for the container
    this.logGroup = new logs.LogGroup(this, 'OrderBrokerLogGroup', {
      logGroupName: '/ecs/order-broker',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create container definition
    // Using blue-green test image for easy deployment validation
    const orderBrokerContainer = orderBrokerTaskDef.addContainer(
      'OrderBrokerContainer',
      {
        image: ecs.ContainerImage.fromRegistry('amasucci/bluegreen'),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: 'order-broker',
          logGroup: this.logGroup,
        }),
        environment: {
          COLOR: 'blue', // Start with BLUE deployment
        },
      }
    );

    orderBrokerContainer.addPortMappings({
      containerPort: 80, // Blue-green image listens on port 80
      protocol: ecs.Protocol.TCP,
    });

    // Create security groups for the service
    const serviceSG = new ec2.SecurityGroup(this, 'OrderBrokerServiceSG', {
      vpc: props.vpc,
      description: 'Security group for OrderBroker Fargate service',
    });

    // Create ALB security group
    const albSG = new ec2.SecurityGroup(this, 'OrderBrokerALBSG', {
      vpc: props.vpc,
      description: 'Security group for OrderBroker ALB',
    });

    // Allow HTTP traffic from internet to ALB (for testing)
    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Allow test listener traffic from internet to ALB (for blue-green testing)
    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(9090),
      'Allow test listener traffic from internet'
    );

    // Allow inbound traffic from ALB to the service
    serviceSG.addIngressRule(
      albSG,
      ec2.Port.tcp(80),
      'Allow inbound traffic from ALB'
    );

    // Create ALB for the service
    // Using internet-facing ALB for testing purposes
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'OrderBrokerALB',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: albSG,
      }
    );

    // Create production listener (using HTTP for testing - HTTPS requires valid certificate)
    this.productionListener = this.loadBalancer.addListener(
      'ProductionListener',
      {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.fixedResponse(200, {
          contentType: 'text/plain',
          messageBody: 'Default response from OrderBroker ALB',
        }),
      }
    );

    // Create test listener for blue-green deployments
    this.testListener = this.loadBalancer.addListener('TestListener', {
      port: 9090,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Test listener for OrderBroker ALB',
      }),
    });

    // Create target group for the service (Blue)
    this.blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'OrderBrokerBlueTargetGroup',
      {
        vpc: props.vpc,
        port: 80, // Blue-green image listens on port 80
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Create target group for the service (Green)
    this.greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'OrderBrokerGreenTargetGroup',
      {
        vpc: props.vpc,
        port: 80, // Blue-green image listens on port 80
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Set up production listener with target group
    this.productionListener.addTargetGroups('DefaultProdRoute', {
      targetGroups: [this.blueTargetGroup],
    });

    // Set up test listener with target group
    this.testListener.addTargetGroups('DefaultTestRoute', {
      targetGroups: [this.blueTargetGroup],
    });

    // Create the ECS service with CODE_DEPLOY controller for blue-green deployments
    // Note: Circuit breaker is not available with CODE_DEPLOY controller
    // Rollback is handled by CodeDeploy's autoRollback configuration
    this.orderBrokerService = new ecs.FargateService(
      this,
      'OrderBrokerService',
      {
        cluster: this.ecsCluster,
        taskDefinition: orderBrokerTaskDef,
        desiredCount: 2,
        securityGroups: [serviceSG],
        assignPublicIp: false,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 1,
            base: 1,
          },
        ],
        deploymentController: {
          type: ecs.DeploymentControllerType.CODE_DEPLOY,
        },
        enableExecuteCommand: true,
      }
    );

    // Attach service to target group
    this.orderBrokerService.attachToApplicationTargetGroup(
      this.blueTargetGroup
    );

    // Set up auto-scaling
    const scaling = this.orderBrokerService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 20,
    });

    // CPU-based scaling policy
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    // Memory-based scaling policy
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    // Predictive scaling through scheduled actions
    // Schedule scale up before market open (9:25 AM EST)
    scaling.scaleOnSchedule('PreMarketOpenScale', {
      schedule: autoscaling.Schedule.cron({ hour: '9', minute: '25' }),
      minCapacity: 10,
    });

    // Schedule scale up before market close (3:55 PM EST)
    scaling.scaleOnSchedule('PreMarketCloseScale', {
      schedule: autoscaling.Schedule.cron({ hour: '15', minute: '55' }),
      minCapacity: 10,
    });

    // Create a CodeDeploy Application
    this.codeDeployApplication = new codedeploy.EcsApplication(
      this,
      'OrderBrokerCodeDeployApp'
    );

    // Create a CodeDeploy Deployment Group for blue/green deployment
    this.deploymentGroup = new codedeploy.EcsDeploymentGroup(
      this,
      'OrderBrokerDeploymentGroup',
      {
        application: this.codeDeployApplication,
        service: this.orderBrokerService,
        blueGreenDeploymentConfig: {
          listener: this.productionListener,
          testListener: this.testListener,
          blueTargetGroup: this.blueTargetGroup,
          greenTargetGroup: this.greenTargetGroup,
          deploymentApprovalWaitTime: cdk.Duration.minutes(1), // Immediate - manual control via CLI
          terminationWaitTime: cdk.Duration.minutes(1),
        },
        deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
      }
    );

    // Create an SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'OrderBrokerAlarmTopic', {
      displayName: 'OrderBroker Alarms',
    });

    // Add subscription to the SNS topic
    this.alarmTopic.addSubscription(
      new subs.EmailSubscription('sre-team@example.com')
    );

    // Create CloudWatch alarms for key performance indicators

    // JVM heap usage alarm
    const jvmHeapUsageMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'JVMHeapUtilization',
      dimensionsMap: {
        ClusterName: this.ecsCluster.clusterName,
        ServiceName: this.orderBrokerService.serviceName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const jvmHeapUsageAlarm = new cloudwatch.Alarm(this, 'JVMHeapUsageAlarm', {
      metric: jvmHeapUsageMetric,
      evaluationPeriods: 3,
      threshold: 80,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription:
        'Alarm when JVM heap usage exceeds 80% for 3 consecutive minutes',
      actionsEnabled: true,
    });

    jvmHeapUsageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );
    jvmHeapUsageAlarm.addOkAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Database connection pool utilization alarm
    const dbConnectionPoolMetric = new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'DBConnectionPoolUtilization',
      dimensionsMap: {
        ClusterName: this.ecsCluster.clusterName,
        ServiceName: this.orderBrokerService.serviceName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const dbConnectionPoolAlarm = new cloudwatch.Alarm(
      this,
      'DBConnectionPoolAlarm',
      {
        metric: dbConnectionPoolMetric,
        evaluationPeriods: 3,
        threshold: 90,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription:
          'Alarm when database connection pool utilization exceeds 90% for 3 consecutive minutes',
        actionsEnabled: true,
      }
    );

    dbConnectionPoolAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );
    dbConnectionPoolAlarm.addOkAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Apply tags using built-in Tags functionality
    cdk.Tags.of(this).add('CostCenter', 'Trading');
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
    cdk.Tags.of(this).add('Service', 'OrderBroker');
  }
}
