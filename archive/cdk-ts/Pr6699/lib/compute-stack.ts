import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  redisCluster: elasticache.CfnCacheCluster;
  alertTopic: sns.ITopic;
}

export class ComputeStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'TradingCluster', {
      clusterName: `trading-cluster-${props.environmentSuffix}`,
      vpc: props.vpc,
      containerInsights: true,
    });

    // ECS Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `ecs-task-exec-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // ECS Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `ecs-task-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant access to specific RDS instance
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rds:DescribeDBInstances'],
        resources: [props.database.instanceArn],
      })
    );

    // Grant access to Secrets Manager for DB credentials
    if (props.database.secret) {
      props.database.secret.grantRead(taskRole);
    }

    // CloudWatch Log Group for ECS
    const logGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: `/ecs/trading-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `trading-api-${props.environmentSuffix}`,
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container Definition
    const container = taskDefinition.addContainer('ApiContainer', {
      containerName: 'trading-api',
      image: ecs.ContainerImage.fromRegistry('nginxdemos/hello'), // Placeholder - replace with actual Java API image
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
      environment: {
        DB_ENDPOINT: props.database.dbInstanceEndpointAddress,
        REDIS_ENDPOINT: props.redisCluster.attrRedisEndpointAddress,
        ENVIRONMENT: props.environmentSuffix,
      },
      secrets: props.database.secret
        ? {
            DB_PASSWORD: ecs.Secret.fromSecretsManager(
              props.database.secret,
              'password'
            ),
            DB_USERNAME: ecs.Secret.fromSecretsManager(
              props.database.secret,
              'username'
            ),
          }
        : undefined,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      securityGroupName: `alb-sg-${props.environmentSuffix}`,
      vpc: props.vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      securityGroupName: `ecs-sg-${props.environmentSuffix}`,
      vpc: props.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `trading-alb-${props.environmentSuffix}`,
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: albSecurityGroup,
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `trading-tg-${props.environmentSuffix}`,
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargate Service
    this.fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: `trading-service-${props.environmentSuffix}`,
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Attach service to target group
    this.fargateService.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling
    const scaling = this.fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // CloudWatch Alarms
    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostAlarm',
      {
        metric: targetGroup.metrics.unhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        alarmDescription: 'Unhealthy hosts detected in target group',
      }
    );
    unhealthyHostAlarm.addAlarmAction(
      new cw_actions.SnsAction(props.alertTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `ALBDnsName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.fargateService.serviceName,
      description: 'ECS Service Name',
      exportName: `ServiceName-${props.environmentSuffix}`,
    });
  }
}
