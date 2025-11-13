import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
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

    // 🔹 VPC Configuration - 3 AZs with public/private subnets
    const vpc = new ec2.Vpc(this, 'ServiceMeshVpc', {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1, // Reduced from 3 to 1 to avoid EIP limit (1 NAT Gateway is sufficient for dev/test)
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // 🔹 ECS Cluster with Container Insights
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      clusterName: `payment-mesh-cluster-${environmentSuffix}`,
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: 'payments.local',
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        vpc,
      },
    });

    const cloudMapNamespace = cluster.defaultCloudMapNamespace!;

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
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
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
          cpu: 512,
          memoryLimitMiB: 1024,
          taskRole,
          executionRole,
        }
      );

      // Application Container - simplified (single container, no X-Ray/Envoy)
      taskDefinition.addContainer(serviceConfig.name, {
        image: ecs.ContainerImage.fromRegistry(serviceConfig.containerImage),
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: serviceConfig.name,
          logGroup,
        }),
        portMappings: [{ containerPort: serviceConfig.port }],
        healthCheck: {
          command: [
            'CMD-SHELL',
            `wget --no-verbose --tries=1 --spider http://localhost:${serviceConfig.port}/ || exit 1`,
          ],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(60), // Give nginx time to start
        },
      });

      // ECS Service - simplified (public subnets, direct ALB attachment)
      const ecsService = new ecs.FargateService(
        this,
        `${serviceConfig.name}Service`,
        {
          cluster,
          serviceName: `${serviceConfig.name}-${environmentSuffix}`,
          taskDefinition,
          desiredCount: 2,
          assignPublicIp: true, // Use public subnets for simplified deployment
          securityGroups: [serviceSecurityGroup],
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
          enableECSManagedTags: true,
          propagateTags: ecs.PropagatedTagSource.SERVICE,
          enableExecuteCommand: true,
          healthCheckGracePeriod: cdk.Duration.seconds(120), // Give tasks time to pass health checks
        }
      );

      // Attach service directly to ALB listener
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
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
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
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name for external access',
      exportName: 'PaymentMeshAlbDns',
    });

    new cdk.CfnOutput(this, 'CloudMapNamespaceArn', {
      value: cloudMapNamespace.namespaceArn,
      description: 'Cloud Map namespace ARN for service discovery',
      exportName: 'PaymentMeshCloudMapArn',
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
