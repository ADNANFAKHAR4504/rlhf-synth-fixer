import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, `EcsVpc-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 0, // Cost optimization - using public subnets for Fargate
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // ECS Cluster with Container Insights
    const cluster = new ecs.Cluster(this, `EcsCluster-${environmentSuffix}`, {
      vpc,
      clusterName: `ecs-cluster-${environmentSuffix}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // AWS Cloud Map namespace for service discovery
    const namespace = new servicediscovery.PrivateDnsNamespace(
      this,
      `ServiceNamespace-${environmentSuffix}`,
      {
        name: `services-${environmentSuffix}.local`,
        vpc,
        description: 'Private DNS namespace for service discovery',
      }
    );

    // Task execution role
    const taskExecutionRole = this.createTaskExecutionRole(environmentSuffix);

    // Task roles for each service
    const taskRoles = {
      apiGateway: this.createTaskRole('api-gateway', environmentSuffix),
      orderProcessor: this.createTaskRole('order-processor', environmentSuffix),
      marketData: this.createTaskRole('market-data', environmentSuffix),
    };

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        loadBalancerName: `alb-${environmentSuffix}`,
      }
    );

    const listener = alb.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSg-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for ALB',
        allowAllOutbound: true,
      }
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `EcsSg-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for ECS tasks',
        allowAllOutbound: true,
      }
    );
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB traffic'
    );
    ecsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.allTcp(),
      'Allow inter-service traffic'
    );

    // Task Definitions
    const apiGatewayTask = this.createTaskDefinition(
      'api-gateway',
      environmentSuffix,
      taskExecutionRole,
      taskRoles.apiGateway
    );

    const orderProcessorTask = this.createTaskDefinition(
      'order-processor',
      environmentSuffix,
      taskExecutionRole,
      taskRoles.orderProcessor
    );

    const marketDataTask = this.createTaskDefinition(
      'market-data',
      environmentSuffix,
      taskExecutionRole,
      taskRoles.marketData
    );

    // ECS Services
    const apiGatewayService = this.createService(
      'api-gateway',
      environmentSuffix,
      cluster,
      apiGatewayTask,
      ecsSecurityGroup,
      namespace,
      true
    );

    const orderProcessorService = this.createService(
      'order-processor',
      environmentSuffix,
      cluster,
      orderProcessorTask,
      ecsSecurityGroup,
      namespace,
      true
    );

    const marketDataService = this.createService(
      'market-data',
      environmentSuffix,
      cluster,
      marketDataTask,
      ecsSecurityGroup,
      namespace,
      true
    );

    // Target Group for API Gateway
    const apiTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `ApiTg-${environmentSuffix}`,
      {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    apiGatewayService.attachToApplicationTargetGroup(apiTargetGroup);

    // Path-based routing
    listener.addAction(`ApiAction-${environmentSuffix}`, {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*', '/'])],
      action: elbv2.ListenerAction.forward([apiTargetGroup]),
    });

    // Auto-scaling for all services
    this.configureAutoScaling(
      apiGatewayService,
      'api-gateway',
      environmentSuffix
    );
    this.configureAutoScaling(
      orderProcessorService,
      'order-processor',
      environmentSuffix
    );
    this.configureAutoScaling(
      marketDataService,
      'market-data',
      environmentSuffix
    );

    // CloudWatch Dashboard
    this.createDashboard(
      environmentSuffix,
      cluster,
      [apiGatewayService, orderProcessorService, marketDataService],
      alb,
      apiTargetGroup
    );

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS name',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
    });

    new cdk.CfnOutput(this, 'NamespaceName', {
      value: namespace.namespaceName,
      description: 'Service Discovery namespace',
    });
  }

  private createTaskExecutionRole(environmentSuffix: string): iam.Role {
    const role = new iam.Role(this, `TaskExecutionRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS Task Execution Role',
      roleName: `ecs-task-execution-${environmentSuffix}`,
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      )
    );

    // Secrets Manager permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    return role;
  }

  private createTaskRole(
    serviceName: string,
    environmentSuffix: string
  ): iam.Role {
    const role = new iam.Role(
      this,
      `TaskRole-${serviceName}-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description: `Task role for ${serviceName}`,
        roleName: `ecs-task-${serviceName}-${environmentSuffix}`,
      }
    );

    // X-Ray permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // CloudWatch metrics
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    return role;
  }

  private createTaskDefinition(
    serviceName: string,
    environmentSuffix: string,
    taskExecutionRole: iam.Role,
    taskRole: iam.Role
  ): ecs.FargateTaskDefinition {
    // Create log group for application container with explicit name
    const appLogGroup = new logs.LogGroup(
      this,
      `AppLogGroup-${serviceName}-${environmentSuffix}`,
      {
        logGroupName: `/ecs/task-${serviceName}-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: for easier cleanup
      }
    );

    // Create log group for X-Ray daemon with explicit name
    const xrayLogGroup = new logs.LogGroup(
      this,
      `XRayLogGroup-${serviceName}-${environmentSuffix}`,
      {
        logGroupName: `/ecs/xray-${serviceName}-${environmentSuffix}`,
        retention: logs.RetentionDays.THREE_DAYS,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: for easier cleanup
      }
    );

    const taskDef = new ecs.FargateTaskDefinition(
      this,
      `TaskDef-${serviceName}-${environmentSuffix}`,
      {
        family: `task-${serviceName}-${environmentSuffix}`,
        cpu: 256,
        memoryLimitMiB: 512,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
      }
    );

    // Main application container - using nginx from public registry
    taskDef.addContainer(`Container-${serviceName}`, {
      containerName: serviceName,
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/nginx/nginx:1.25-alpine'
      ),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: appLogGroup, // Use explicit log group
        streamPrefix: serviceName,
      }),
      environment: {
        SERVICE_NAME: serviceName,
      },
      command: [
        'sh',
        '-c',
        'sed -i "s/listen       80;/listen       8080;/" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"',
      ],
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'pgrep nginx > /dev/null || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(90),
      },
    });

    // X-Ray daemon sidecar
    taskDef.addContainer(`XRayDaemon-${serviceName}`, {
      containerName: 'xray-daemon',
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon:latest'),
      cpu: 32,
      memoryLimitMiB: 128,
      logging: ecs.LogDrivers.awsLogs({
        logGroup: xrayLogGroup, // Use explicit log group
        streamPrefix: `xray-${serviceName}`,
      }),
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
    });

    return taskDef;
  }

  private createService(
    serviceName: string,
    environmentSuffix: string,
    cluster: ecs.Cluster,
    taskDefinition: ecs.FargateTaskDefinition,
    securityGroup: ec2.SecurityGroup,
    namespace: servicediscovery.PrivateDnsNamespace,
    _publicService: boolean
  ): ecs.FargateService {
    const service = new ecs.FargateService(
      this,
      `Service-${serviceName}-${environmentSuffix}`,
      {
        cluster,
        taskDefinition,
        serviceName: `svc-${serviceName}-${environmentSuffix}`,
        desiredCount: 2,
        // FIXED: Allow 0% healthy during initial deployment to prevent circuit breaker
        minHealthyPercent: 0, // Changed from 50 to 0 for initial deployment
        maxHealthyPercent: 200,
        securityGroups: [securityGroup],
        assignPublicIp: _publicService,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 1,
            base: 1,
          },
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 4,
          },
        ],
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
        // FIXED: Increased grace period to allow containers to start
        healthCheckGracePeriod: cdk.Duration.seconds(180), // Increased from 120 to 180
        cloudMapOptions: {
          name: serviceName,
          cloudMapNamespace: namespace,
          dnsRecordType: servicediscovery.DnsRecordType.A,
          dnsTtl: cdk.Duration.seconds(30),
        },
      }
    );

    // Add node dependency to ensure service is deleted before capacity providers
    // This prevents the "capacity provider in use" error during rollback
    service.node.addDependency(cluster);

    return service;
  }

  private configureAutoScaling(
    service: ecs.FargateService,
    serviceName: string,
    environmentSuffix: string
  ): void {
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // CPU-based scaling
    scaling.scaleOnCpuUtilization(
      `CpuScaling-${serviceName}-${environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      }
    );

    // Memory-based scaling
    scaling.scaleOnMemoryUtilization(
      `MemoryScaling-${serviceName}-${environmentSuffix}`,
      {
        targetUtilizationPercent: 80,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      }
    );
  }

  private createDashboard(
    environmentSuffix: string,
    cluster: ecs.Cluster,
    services: ecs.FargateService[],
    alb: elbv2.ApplicationLoadBalancer,
    targetGroup: elbv2.ApplicationTargetGroup
  ): void {
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${environmentSuffix}`,
      {
        dashboardName: `ecs-services-${environmentSuffix}`,
      }
    );

    // ALB metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [
          alb.metricRequestCount({
            statistic: 'sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Target Response Time',
        left: [
          alb.metricTargetResponseTime({
            statistic: 'avg',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // Target group health
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Target Group Healthy Hosts',
        left: [
          targetGroup.metricHealthyHostCount({
            statistic: 'avg',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Target Group Unhealthy Hosts',
        left: [
          targetGroup.metricUnhealthyHostCount({
            statistic: 'avg',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // Service metrics
    services.forEach(service => {
      const serviceName = service.serviceName;

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${serviceName} - CPU Utilization`,
          left: [
            service.metricCpuUtilization({
              statistic: 'avg',
              period: cdk.Duration.minutes(1),
            }),
          ],
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceName} - Memory Utilization`,
          left: [
            service.metricMemoryUtilization({
              statistic: 'avg',
              period: cdk.Duration.minutes(1),
            }),
          ],
        })
      );
    });
  }
}
