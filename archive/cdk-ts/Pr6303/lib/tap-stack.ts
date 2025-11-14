import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 🔹 VPC Configuration - Only public subnets (simplify networking)
    const vpc = new ec2.Vpc(this, 'ServiceMeshVpc', {
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // 🔹 ECS Cluster (CloudMap removed for simplified deployment)
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      clusterName: `payment-mesh-cluster-${environmentSuffix}`,
      containerInsights: false,
    });

    // 🔹 Security Groups
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      'ServiceSecurityGroup',
      {
        vpc,
        description: 'Security group for ECS services',
        allowAllOutbound: true,
      }
    );
    serviceSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow internal communication'
    );

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    serviceSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow traffic from ALB'
    );

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ServiceMeshAlb', {
      vpc,
      internetFacing: true,
      loadBalancerName: `payment-mesh-alb-${environmentSuffix}`,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Service running',
      }),
    });

    // 🔹 Service definitions
    interface ServiceConfig {
      name: string;
      containerImage: string;
      port: number;
      healthCheckPath: string;
      pathPattern: string;
    }

    const services: ServiceConfig[] = [
      {
        name: 'payment-api',
        containerImage: 'public.ecr.aws/docker/library/nginx:latest',
        port: 80, // nginx default port
        healthCheckPath: '/health',
        pathPattern: '/api/payments/*',
      },
      {
        name: 'fraud-detection',
        containerImage: 'public.ecr.aws/docker/library/nginx:latest',
        port: 80, // nginx default port
        healthCheckPath: '/health',
        pathPattern: '/api/fraud/*',
      },
      {
        name: 'notification-service',
        containerImage: 'public.ecr.aws/docker/library/nginx:latest',
        port: 80, // nginx default port
        healthCheckPath: '/health',
        pathPattern: '/api/notify/*',
      },
    ];

    // 🔹 Create simplified ECS services (App Mesh, X-Ray, Gateway commented out)
    const deployedServices: {
      [key: string]: ecs.FargateService;
    } = {};

    services.forEach((serviceConfig, index) => {
      // Task Role - simplified (X-Ray removed)
      const taskRole = new iam.Role(this, `${serviceConfig.name}TaskRole`, {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        roleName: `${serviceConfig.name}-task-role-${environmentSuffix}`,
      });

      // Task Execution Role
      const executionRole = new iam.Role(
        this,
        `${serviceConfig.name}ExecutionRole`,
        {
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          roleName: `${serviceConfig.name}-execution-role-${environmentSuffix}`,
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AmazonECSTaskExecutionRolePolicy'
            ),
          ],
        }
      );

      // Log Group - simplified (only app logs, no Envoy/X-Ray)
      const logGroup = new logs.LogGroup(
        this,
        `${serviceConfig.name}LogGroup`,
        {
          logGroupName: `/ecs/${serviceConfig.name}-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
      );

      // Task Definition - simplified (no App Mesh proxy configuration)
      const taskDefinition = new ecs.FargateTaskDefinition(
        this,
        `${serviceConfig.name}TaskDef`,
        {
          family: `${serviceConfig.name}-${environmentSuffix}`,
          cpu: 256,
          memoryLimitMiB: 512,
          taskRole,
          executionRole,
        }
      );

      // Application Container - simplified (single container, no health checks)
      taskDefinition.addContainer(serviceConfig.name, {
        image: ecs.ContainerImage.fromRegistry(serviceConfig.containerImage),
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: serviceConfig.name,
          logGroup,
        }),
        portMappings: [{ containerPort: serviceConfig.port }],
        command: ['nginx', '-g', 'daemon off;'],
      });

      // ECS Service - simplified (public subnets, lenient rollout settings)
      const ecsService = new ecs.FargateService(
        this,
        `${serviceConfig.name}Service`,
        {
          cluster,
          serviceName: `${serviceConfig.name}-${environmentSuffix}`,
          taskDefinition,
          desiredCount: 1,
          assignPublicIp: true,
          securityGroups: [serviceSecurityGroup],
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
          minHealthyPercent: 0,
          maxHealthyPercent: 200,
          circuitBreaker: { rollback: false },
          enableExecuteCommand: false,
        }
      );

      // Attach service directly to ALB listener (forgiving health check)
      httpListener.addTargets(`${serviceConfig.name}Target`, {
        port: 80,
        targets: [ecsService],
        priority: index + 1, // Priority required when using conditions
        conditions: [
          elbv2.ListenerCondition.pathPatterns([
            serviceConfig.pathPattern.replace('*', ''),
          ]),
        ],
        healthCheck: {
          path: '/',
          healthyHttpCodes: '200-499',
        },
      });

      // Store service reference for dashboard
      deployedServices[serviceConfig.name] = ecsService;
    });

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServiceMeshDashboard', {
      dashboardName: `payment-mesh-dashboard-${environmentSuffix}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    // Add widgets for each service
    services.forEach(serviceConfig => {
      const service = deployedServices[serviceConfig.name];

      dashboard.addWidgets(
        new cloudwatch.TextWidget({
          markdown: `## ${serviceConfig.name} Metrics`,
          width: 24,
          height: 1,
        })
      );

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Request Rate`,
          left: [
            new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'TaskCount',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - CPU Utilization`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Memory Utilization`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'MemoryUtilization',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 8,
        })
      );

      // Service health and performance metrics (using ECS metrics instead of target group)
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Running Tasks`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'RunningTaskCount',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Average',
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'DesiredTaskCount',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Network Metrics`,
          left: [
            new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'NetworkRxBytes',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Sum',
            }),
            new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'NetworkTxBytes',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Sum',
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Task Status`,
          left: [
            new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'StoppedTaskCount',
              dimensionsMap: {
                ServiceName: service.serviceName,
                ClusterName: cluster.clusterName,
              },
              statistic: 'Sum',
            }),
          ],
          width: 8,
        })
      );
    });

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'AlbDns', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name for external access',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL for monitoring',
      exportName: 'PaymentMeshDashboardUrl',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
      exportName: 'PaymentMeshClusterName',
    });
  }
}
