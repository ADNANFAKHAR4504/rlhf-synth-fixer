import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface RegionalStackProps {
  vpc: ec2.Vpc;
  isMainRegion: boolean;
  environmentSuffix: string;
}

export class RegionalStack extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly tradingService: ecs.FargateService;
  public readonly orderManagementService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create ECS Cluster
    this.ecsCluster = new ecs.Cluster(
      this,
      `TradingECSCluster${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        containerInsights: true,
        clusterName: `TradingPlatform-${stack.region}${props.environmentSuffix}`,
      }
    );

    // Create ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `TradingALB${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        internetFacing: true,
        loadBalancerName: `Trading-${stack.region}${props.environmentSuffix}`,
      }
    );

    // Create a default listener
    const listener = this.loadBalancer.addListener(
      `Listener${props.environmentSuffix}`,
      {
        port: 80,
        defaultAction: elbv2.ListenerAction.fixedResponse(200, {
          contentType: 'text/plain',
          messageBody: 'OK',
        }),
      }
    );

    // Create log groups for the services
    const tradingLogGroup = new logs.LogGroup(
      this,
      `TradingLogGroup${props.environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/trading-service-${stack.region}${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const orderManagementLogGroup = new logs.LogGroup(
      this,
      `OrderManagementLogGroup${props.environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/order-management-service-${stack.region}${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ECS Task Execution Role
    const executionRole = new iam.Role(
      this,
      `ECSTaskExecutionRole${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
      }
    );

    // Task role for the services
    const taskRole = new iam.Role(
      this,
      `ECSTaskRole${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }
    );

    // Trading Engine Service
    const tradingTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TradingTaskDef${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    tradingTaskDefinition.addContainer(
      `TradingContainer${props.environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'trading-engine',
          logGroup: tradingLogGroup,
        }),
        portMappings: [
          {
            containerPort: 80,
            protocol: ecs.Protocol.TCP,
          },
        ],
        environment: {
          REGION: stack.region,
          IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
        },
      }
    );

    // Trading Service Target Group
    const tradingTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TradingTargetGroup${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction(`TradingRoute${props.environmentSuffix}`, {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/trading/*'])],
      action: elbv2.ListenerAction.forward([tradingTargetGroup]),
    });

    // Deploy Trading Service
    this.tradingService = new ecs.FargateService(
      this,
      `TradingService${props.environmentSuffix}`,
      {
        cluster: this.ecsCluster,
        taskDefinition: tradingTaskDefinition,
        desiredCount: 1,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(
            this,
            `TradingServiceSG${props.environmentSuffix}`,
            {
              vpc: props.vpc,
              description: 'Security group for the Trading Service',
              allowAllOutbound: true,
            }
          ),
        ],
      }
    );

    this.tradingService.attachToApplicationTargetGroup(tradingTargetGroup);

    // Order Management Service
    const orderManagementTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `OrderManagementTaskDef${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    orderManagementTaskDefinition.addContainer(
      `OrderManagementContainer${props.environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'order-management',
          logGroup: orderManagementLogGroup,
        }),
        portMappings: [
          {
            containerPort: 80,
            protocol: ecs.Protocol.TCP,
          },
        ],
        environment: {
          REGION: stack.region,
          IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
        },
      }
    );

    // Order Management Service Target Group
    const orderManagementTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `OrderManagementTargetGroup${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction(`OrderManagementRoute${props.environmentSuffix}`, {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/orders/*'])],
      action: elbv2.ListenerAction.forward([orderManagementTargetGroup]),
    });

    // Deploy Order Management Service
    this.orderManagementService = new ecs.FargateService(
      this,
      `OrderManagementService${props.environmentSuffix}`,
      {
        cluster: this.ecsCluster,
        taskDefinition: orderManagementTaskDefinition,
        desiredCount: 1,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(
            this,
            `OrderManagementServiceSG${props.environmentSuffix}`,
            {
              vpc: props.vpc,
              description: 'Security group for the Order Management Service',
              allowAllOutbound: true,
            }
          ),
        ],
      }
    );

    this.orderManagementService.attachToApplicationTargetGroup(
      orderManagementTargetGroup
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, `ALBDnsName${props.environmentSuffix}`, {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `ALBDnsName-${stack.region}${props.environmentSuffix}`,
      description: `ALB DNS Name for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `ALBArn${props.environmentSuffix}`, {
      value: this.loadBalancer.loadBalancerArn,
      exportName: `ALBArn-${stack.region}${props.environmentSuffix}`,
      description: `ALB ARN for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `ECSClusterName${props.environmentSuffix}`, {
      value: this.ecsCluster.clusterName,
      exportName: `ECSClusterName-${stack.region}${props.environmentSuffix}`,
      description: `ECS Cluster Name for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `ECSClusterArn${props.environmentSuffix}`, {
      value: this.ecsCluster.clusterArn,
      exportName: `ECSClusterArn-${stack.region}${props.environmentSuffix}`,
      description: `ECS Cluster ARN for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `TradingServiceName${props.environmentSuffix}`, {
      value: this.tradingService.serviceName,
      exportName: `TradingServiceName-${stack.region}${props.environmentSuffix}`,
      description: `Trading Service Name for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `TradingServiceArn${props.environmentSuffix}`, {
      value: this.tradingService.serviceArn,
      exportName: `TradingServiceArn-${stack.region}${props.environmentSuffix}`,
      description: `Trading Service ARN for ${stack.region}`,
    });

    new cdk.CfnOutput(
      this,
      `OrderManagementServiceName${props.environmentSuffix}`,
      {
        value: this.orderManagementService.serviceName,
        exportName: `OrderManagementServiceName-${stack.region}${props.environmentSuffix}`,
        description: `Order Management Service Name for ${stack.region}`,
      }
    );

    new cdk.CfnOutput(
      this,
      `OrderManagementServiceArn${props.environmentSuffix}`,
      {
        value: this.orderManagementService.serviceArn,
        exportName: `OrderManagementServiceArn-${stack.region}${props.environmentSuffix}`,
        description: `Order Management Service ARN for ${stack.region}`,
      }
    );

    new cdk.CfnOutput(this, `ALBHealthCheckUrl${props.environmentSuffix}`, {
      value: `http://${this.loadBalancer.loadBalancerDnsName}/`,
      exportName: `ALBHealthCheckUrl-${stack.region}${props.environmentSuffix}`,
      description: `ALB Health Check URL for ${stack.region}`,
    });

    new cdk.CfnOutput(
      this,
      `TradingServiceEndpoint${props.environmentSuffix}`,
      {
        value: `http://${this.loadBalancer.loadBalancerDnsName}/trading/`,
        exportName: `TradingServiceEndpoint-${stack.region}${props.environmentSuffix}`,
        description: `Trading Service Endpoint for ${stack.region}`,
      }
    );

    new cdk.CfnOutput(
      this,
      `OrderManagementEndpoint${props.environmentSuffix}`,
      {
        value: `http://${this.loadBalancer.loadBalancerDnsName}/orders/`,
        exportName: `OrderManagementEndpoint-${stack.region}${props.environmentSuffix}`,
        description: `Order Management Endpoint for ${stack.region}`,
      }
    );
  }
}
