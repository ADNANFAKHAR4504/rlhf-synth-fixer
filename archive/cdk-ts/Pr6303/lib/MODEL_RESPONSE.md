### Reasoning Trace
---

This is a comprehensive AWS CDK project that requires implementing a service mesh with App Mesh on ECS Fargate. Let me break down the requirements:

1. **VPC & ECS Cluster**
   - VPC across 3 AZs
   - Private subnets for tasks
   - Public subnets for ALB
   - NAT gateways for egress
   - ECS cluster with Fargate capacity
   - Container Insights enabled

2. **Three Microservices**
   - payment-api
   - fraud-detection
   - notification-service
   - Each with 2 tasks, 1 vCPU, 2GB memory
   - Envoy sidecar (0.25 vCPU, 512MB)
   - X-Ray daemon
   - Dedicated IAM task roles

3. **App Mesh Configuration**
   - Mesh named "payment-mesh"
   - Virtual nodes for each service with mTLS
   - Virtual services pointing to nodes
   - Virtual gateway with path-based routing
   - Connection pool: max 50 concurrent connections
   - Circuit breaker: 5 consecutive 5xx errors

4. **Service Discovery**
   - Cloud Map private namespace "payments.local"
   - Register each service

5. **Ingress**
   - ALB in public subnets
   - Forward to App Mesh Virtual Gateway
   - Path-based routing:
     - /api/payments/* → payment-api
     - /api/fraud/* → fraud-detection
     - /api/notify/* → notification-service

6. **Observability**
   - X-Ray tracing
   - CloudWatch dashboards
   - Container Insights
   - Metrics: request rate, error rate, latency percentiles

Let me create the two files:
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

// 🔹 Initialize main stack with production configuration
new TapStack(app, 'PaymentServiceMeshStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Production service mesh for payment processing microservices with AWS App Mesh',
  tags: {
    Environment: 'production',
    ManagedBy: 'CDK',
    ServiceMesh: 'payment-mesh',
    Application: 'payment-processing'
  }
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as appmesh from 'aws-cdk-lib/aws-appmesh';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 VPC Configuration - 3 AZs with public/private subnets
    const vpc = new ec2.Vpc(this, 'ServiceMeshVpc', {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 3,
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
      clusterName: 'payment-mesh-cluster',
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: 'payments.local',
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        vpc,
      },
    });

    // 🔹 Cloud Map Namespace
    const cloudMapNamespace = cluster.defaultCloudMapNamespace!;

    // 🔹 App Mesh - Main mesh configuration
    const mesh = new appmesh.Mesh(this, 'PaymentMesh', {
      meshName: 'payment-mesh',
      egressFilter: appmesh.MeshFilterType.DROP_ALL,
      serviceDiscovery: {
        ipPreference: appmesh.IpPreference.IPV4_ONLY,
      },
    });

    // 🔹 Security Groups
    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc,
      description: 'Security group for ECS services',
      allowAllOutbound: true,
    });
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
      loadBalancerName: 'payment-mesh-alb',
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

    // 🔹 ACM Certificate for mTLS (self-signed for demo)
    const tlsCertificate = new certificatemanager.Certificate(this, 'TlsCertificate', {
      domainName: '*.payments.local',
      validation: certificatemanager.CertificateValidation.fromDns(),
    });

    // 🔹 Virtual Gateway configuration
    const virtualGateway = new appmesh.VirtualGateway(this, 'PaymentVirtualGateway', {
      mesh,
      virtualGatewayName: 'payment-gateway',
      listeners: [
        appmesh.VirtualGatewayListener.http({
          port: 8080,
          connectionPool: {
            maxConnections: 100,
            maxPendingRequests: 10,
          },
          healthCheck: appmesh.HealthCheck.http({
            path: '/health',
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          }),
        }),
      ],
      accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
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
        port: 8080,
        healthCheckPath: '/health',
        pathPattern: '/api/payments/*',
      },
      {
        name: 'fraud-detection',
        containerImage: 'public.ecr.aws/docker/library/nginx:latest',
        port: 8080,
        healthCheckPath: '/health',
        pathPattern: '/api/fraud/*',
      },
      {
        name: 'notification-service',
        containerImage: 'public.ecr.aws/docker/library/nginx:latest',
        port: 8080,
        healthCheckPath: '/health',
        pathPattern: '/api/notify/*',
      },
    ];

    // 🔹 Create services, virtual nodes, and virtual services
    const deployedServices: {
      [key: string]: {
        service: ecs.FargateService;
        virtualNode: appmesh.VirtualNode;
        virtualService: appmesh.VirtualService;
        targetGroup: elbv2.ApplicationTargetGroup;
      };
    } = {};

    services.forEach((serviceConfig) => {
      // Task Role with X-Ray permissions
      const taskRole = new iam.Role(this, `${serviceConfig.name}TaskRole`, {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        roleName: `${serviceConfig.name}-task-role`,
        inlinePolicies: {
          XRayPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'xray:PutTraceSegments',
                  'xray:PutTelemetryRecords',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      // Task Execution Role
      const executionRole = new iam.Role(this, `${serviceConfig.name}ExecutionRole`, {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        roleName: `${serviceConfig.name}-execution-role`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        ],
      });

      // Log Groups
      const logGroup = new logs.LogGroup(this, `${serviceConfig.name}LogGroup`, {
        logGroupName: `/ecs/${serviceConfig.name}`,
        retention: logs.RetentionDays.SEVEN_DAYS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      const envoyLogGroup = new logs.LogGroup(this, `${serviceConfig.name}EnvoyLogGroup`, {
        logGroupName: `/ecs/${serviceConfig.name}/envoy`,
        retention: logs.RetentionDays.SEVEN_DAYS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      const xrayLogGroup = new logs.LogGroup(this, `${serviceConfig.name}XRayLogGroup`, {
        logGroupName: `/ecs/${serviceConfig.name}/xray`,
        retention: logs.RetentionDays.SEVEN_DAYS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Task Definition
      const taskDefinition = new ecs.FargateTaskDefinition(this, `${serviceConfig.name}TaskDef`, {
        family: serviceConfig.name,
        cpu: 1024,
        memoryLimitMiB: 2048,
        taskRole,
        executionRole,
        proxyConfiguration: new ecs.AppMeshProxyConfiguration({
          containerName: 'envoy',
          properties: {
            appPorts: [serviceConfig.port],
            proxyEgressPort: 15001,
            proxyIngressPort: 15000,
            egressIgnoredIPs: ['169.254.170.2', '169.254.169.254'],
            ignoredUID: 1337,
          },
        }),
      });

      // Application Container
      const appContainer = taskDefinition.addContainer(serviceConfig.name, {
        image: ecs.ContainerImage.fromRegistry(serviceConfig.containerImage),
        memoryLimitMiB: 1024,
        cpu: 512,
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: serviceConfig.name,
          logGroup,
        }),
        environment: {
          SERVICE_NAME: serviceConfig.name,
          PORT: serviceConfig.port.toString(),
          ENABLE_XRAY: 'true',
        },
        portMappings: [{
          containerPort: serviceConfig.port,
          protocol: ecs.Protocol.TCP,
        }],
        healthCheck: {
          command: ['CMD-SHELL', `curl -f http://localhost:${serviceConfig.port}${serviceConfig.healthCheckPath} || exit 1`],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(60),
        },
      });

      // X-Ray Daemon Container
      taskDefinition.addContainer('xray-daemon', {
        image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
        memoryLimitMiB: 256,
        cpu: 128,
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: 'xray',
          logGroup: xrayLogGroup,
        }),
        portMappings: [{
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        }],
      });

      // Envoy Proxy Container
      const envoyContainer = taskDefinition.addContainer('envoy', {
        image: ecs.ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.27.0.0-prod'),
        memoryLimitMiB: 512,
        cpu: 256,
        essential: true,
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: 'envoy',
          logGroup: envoyLogGroup,
        }),
        environment: {
          APPMESH_VIRTUAL_NODE_NAME: `mesh/${mesh.meshName}/virtualNode/${serviceConfig.name}-vn`,
          ENVOY_LOG_LEVEL: 'info',
          ENABLE_ENVOY_XRAY_TRACING: '1',
          ENABLE_ENVOY_STATS_TAGS: '1',
          XRAY_DAEMON_PORT: '2000',
        },
        user: '1337',
        healthCheck: {
          command: ['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'],
          interval: cdk.Duration.seconds(5),
          timeout: cdk.Duration.seconds(2),
          retries: 3,
          startPeriod: cdk.Duration.seconds(10),
        },
      });

      envoyContainer.addContainerDependencies({
        container: appContainer,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });

      // Virtual Node
      const virtualNode = new appmesh.VirtualNode(this, `${serviceConfig.name}VirtualNode`, {
        mesh,
        virtualNodeName: `${serviceConfig.name}-vn`,
        serviceDiscovery: appmesh.ServiceDiscovery.cloudMap({
          service: servicediscovery.Service.fromServiceAttributes(this, `${serviceConfig.name}CloudMapRef`, {
            dnsName: `${serviceConfig.name}.payments.local`,
            namespace: cloudMapNamespace,
            routingPolicy: servicediscovery.RoutingPolicy.MULTIVALUE,
            serviceName: serviceConfig.name,
            serviceId: cdk.Lazy.string({ produce: () => ecsService.cloudMapService!.serviceId }),
            serviceArn: cdk.Lazy.string({ produce: () => ecsService.cloudMapService!.serviceArn }),
          }),
        }),
        listeners: [
          appmesh.VirtualNodeListener.http({
            port: serviceConfig.port,
            connectionPool: {
              maxConnections: 50,
            },
            outlierDetection: {
              baseEjectionDuration: cdk.Duration.seconds(30),
              interval: cdk.Duration.seconds(30),
              maxEjectionPercent: 50,
              maxServerErrors: 5,
            },
            tls: {
              mode: appmesh.TlsMode.STRICT,
              certificate: appmesh.TlsCertificate.acm({
                certificate: tlsCertificate,
              }),
            },
          }),
        ],
        accessLog: appmesh.AccessLog.fromFilePath('/dev/stdout'),
      });

      // Virtual Service
      const virtualService = new appmesh.VirtualService(this, `${serviceConfig.name}VirtualService`, {
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(virtualNode),
        virtualServiceName: `${serviceConfig.name}.payments.local`,
      });

      // ECS Service
      const ecsService = new ecs.FargateService(this, `${serviceConfig.name}Service`, {
        cluster,
        serviceName: serviceConfig.name,
        taskDefinition,
        desiredCount: 2,
        assignPublicIp: false,
        securityGroups: [serviceSecurityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        enableECSManagedTags: true,
        propagateTags: ecs.PropagatedTagSource.SERVICE,
        cloudMapOptions: {
          name: serviceConfig.name,
          cloudMapNamespace,
          dnsRecordType: servicediscovery.DnsRecordType.A,
        },
        enableExecuteCommand: true,
      });

      // Grant App Mesh permissions to task role
      mesh.grantStreamAggregatedResources(taskRole);
      virtualNode.grantStreamAggregatedResources(taskRole);

      // Target Group
      const targetGroup = new elbv2.ApplicationTargetGroup(this, `${serviceConfig.name}TargetGroup`, {
        vpc,
        port: serviceConfig.port,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: serviceConfig.healthCheckPath,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200-299',
        },
        targets: [ecsService],
        targetGroupName: `${serviceConfig.name}-tg`,
      });

      // Store references
      deployedServices[serviceConfig.name] = {
        service: ecsService,
        virtualNode,
        virtualService,
        targetGroup,
      };

      // Gateway Route
      new appmesh.GatewayRoute(this, `${serviceConfig.name}GatewayRoute`, {
        mesh,
        virtualGateway,
        gatewayRouteName: `${serviceConfig.name}-route`,
        routeSpec: appmesh.GatewayRouteSpec.http({
          routeTarget: virtualService,
          match: {
            path: appmesh.HttpGatewayRoutePathMatch.startsWith(serviceConfig.pathPattern.replace('*', '')),
          },
        }),
      });
    });

    // 🔹 Virtual Gateway Service for ALB integration
    const gatewayTaskDefinition = new ecs.FargateTaskDefinition(this, 'GatewayTaskDef', {
      family: 'virtual-gateway',
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole: new iam.Role(this, 'GatewayTaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        inlinePolicies: {
          XRayPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                resources: ['*'],
              }),
            ],
          }),
        },
      }),
    });

    const gatewayEnvoyContainer = gatewayTaskDefinition.addContainer('envoy', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.27.0.0-prod'),
      memoryLimitMiB: 512,
      essential: true,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'gateway-envoy',
        logGroup: new logs.LogGroup(this, 'GatewayEnvoyLogGroup', {
          logGroupName: '/ecs/virtual-gateway/envoy',
          retention: logs.RetentionDays.SEVEN_DAYS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${mesh.meshName}/virtualGateway/${virtualGateway.virtualGatewayName}`,
        ENVOY_LOG_LEVEL: 'info',
        ENABLE_ENVOY_XRAY_TRACING: '1',
      },
      portMappings: [{
        containerPort: 8080,
        protocol: ecs.Protocol.TCP,
      }],
      user: '1337',
    });

    mesh.grantStreamAggregatedResources(gatewayTaskDefinition.taskRole);
    virtualGateway.grantStreamAggregatedResources(gatewayTaskDefinition.taskRole);

    const gatewayService = new ecs.FargateService(this, 'GatewayService', {
      cluster,
      serviceName: 'virtual-gateway',
      taskDefinition: gatewayTaskDefinition,
      desiredCount: 2,
      assignPublicIp: false,
      securityGroups: [serviceSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      enableExecuteCommand: true,
    });

    // ALB to Gateway Target Group
    const gatewayTargetGroup = httpListener.addTargets('GatewayTargets', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      targets: [gatewayService],
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
    });

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServiceMeshDashboard', {
      dashboardName: 'payment-mesh-dashboard',
      defaultInterval: cdk.Duration.hours(1),
    });

    // Add widgets for each service
    services.forEach((serviceConfig) => {
      const service = deployedServices[serviceConfig.name].service;

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

      // Target Group metrics
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Target Health`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'HealthyHostCount',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'UnHealthyHostCount',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Request Count & Errors`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'RequestCount',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
              statistic: 'Sum',
            }),
          ],
          right: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'HTTPCode_Target_5XX_Count',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
              statistic: 'Sum',
            }),
          ],
          width: 8,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceConfig.name} - Response Time Percentiles`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'TargetResponseTime',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
              statistic: 'p50',
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'TargetResponseTime',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
              statistic: 'p90',
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'TargetResponseTime',
              dimensionsMap: {
                TargetGroup: deployedServices[serviceConfig.name].targetGroup.targetGroupFullName,
                LoadBalancer: alb.loadBalancerFullName,
              },
              statistic: 'p99',
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

    new cdk.CfnOutput(this, 'MeshArn', {
      value: mesh.meshArn,
      description: 'App Mesh ARN',
      exportName: 'PaymentMeshArn',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
      exportName: 'PaymentMeshClusterName',
    });
  }
}
```