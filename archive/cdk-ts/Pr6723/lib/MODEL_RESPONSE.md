# Multi-Service ECS Orchestration Platform

Complete AWS CDK TypeScript implementation for orchestrating containerized microservices on Amazon ECS with comprehensive monitoring and service discovery.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
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
    const namespace = new servicediscovery.PrivateDnsNamespace(this, `ServiceNamespace-${environmentSuffix}`, {
      name: `services-${environmentSuffix}.local`,
      vpc,
      description: 'Private DNS namespace for service discovery',
    });

    // ECR Repositories with lifecycle policies
    const repositories = this.createECRRepositories(environmentSuffix);

    // Task execution role
    const taskExecutionRole = this.createTaskExecutionRole(environmentSuffix);

    // Task roles for each service
    const taskRoles = {
      apiGateway: this.createTaskRole('api-gateway', environmentSuffix),
      orderProcessor: this.createTaskRole('order-processor', environmentSuffix),
      marketData: this.createTaskRole('market-data', environmentSuffix),
    };

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `ALB-${environmentSuffix}`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `alb-${environmentSuffix}`,
    });

    const listener = alb.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, `AlbSg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

    const ecsSecurityGroup = new ec2.SecurityGroup(this, `EcsSg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(8080), 'Allow ALB traffic');
    ecsSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.allTcp(), 'Allow inter-service traffic');

    // Task Definitions
    const apiGatewayTask = this.createTaskDefinition(
      'api-gateway',
      environmentSuffix,
      repositories.apiGateway,
      taskExecutionRole,
      taskRoles.apiGateway
    );

    const orderProcessorTask = this.createTaskDefinition(
      'order-processor',
      environmentSuffix,
      repositories.orderProcessor,
      taskExecutionRole,
      taskRoles.orderProcessor
    );

    const marketDataTask = this.createTaskDefinition(
      'market-data',
      environmentSuffix,
      repositories.marketData,
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
      false
    );

    const marketDataService = this.createService(
      'market-data',
      environmentSuffix,
      cluster,
      marketDataTask,
      ecsSecurityGroup,
      namespace,
      false
    );

    // Target Group for API Gateway
    const apiTargetGroup = new elbv2.ApplicationTargetGroup(this, `ApiTg-${environmentSuffix}`, {
      vpc,
      port: 8080,
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

    apiGatewayService.attachToApplicationTargetGroup(apiTargetGroup);

    // Path-based routing
    listener.addAction(`ApiAction-${environmentSuffix}`, {
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*', '/'])],
      action: elbv2.ListenerAction.forward([apiTargetGroup]),
    });

    // Auto-scaling for all services
    this.configureAutoScaling(apiGatewayService, 'api-gateway', environmentSuffix);
    this.configureAutoScaling(orderProcessorService, 'order-processor', environmentSuffix);
    this.configureAutoScaling(marketDataService, 'market-data', environmentSuffix);

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

  private createECRRepositories(environmentSuffix: string): {
    apiGateway: ecr.Repository;
    orderProcessor: ecr.Repository;
    marketData: ecr.Repository;
  } {
    const createRepo = (serviceName: string): ecr.Repository => {
      return new ecr.Repository(this, `${serviceName}-repo-${environmentSuffix}`, {
        repositoryName: `ecr-repo-${serviceName}-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        emptyOnDelete: true,
        imageScanOnPush: true,
        lifecycleRules: [
          {
            maxImageCount: 10,
            description: 'Keep only last 10 images',
          },
        ],
      });
    };

    return {
      apiGateway: createRepo('api-gateway'),
      orderProcessor: createRepo('order-processor'),
      marketData: createRepo('market-data'),
    };
  }

  private createTaskExecutionRole(environmentSuffix: string): iam.Role {
    const role = new iam.Role(this, `TaskExecutionRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'ECS Task Execution Role',
      roleName: `ecs-task-execution-${environmentSuffix}`,
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    // Secrets Manager permissions
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`],
    }));

    return role;
  }

  private createTaskRole(serviceName: string, environmentSuffix: string): iam.Role {
    const role = new iam.Role(this, `TaskRole-${serviceName}-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Task role for ${serviceName}`,
      roleName: `ecs-task-${serviceName}-${environmentSuffix}`,
    });

    // X-Ray permissions
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
      ],
      resources: ['*'],
    }));

    // CloudWatch metrics
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
      ],
      resources: ['*'],
    }));

    return role;
  }

  private createTaskDefinition(
    serviceName: string,
    environmentSuffix: string,
    repository: ecr.Repository,
    taskExecutionRole: iam.Role,
    taskRole: iam.Role
  ): ecs.FargateTaskDefinition {
    const taskDef = new ecs.FargateTaskDefinition(this, `TaskDef-${serviceName}-${environmentSuffix}`, {
      family: `task-${serviceName}-${environmentSuffix}`,
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Main application container
    const appContainer = taskDef.addContainer(`Container-${serviceName}`, {
      containerName: serviceName,
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: serviceName,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        SERVICE_NAME: serviceName,
        AWS_XRAY_DAEMON_ADDRESS: 'localhost:2000',
      },
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // X-Ray daemon sidecar
    taskDef.addContainer(`XRayDaemon-${serviceName}`, {
      containerName: 'xray-daemon',
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon:latest'),
      cpu: 32,
      memoryLimitMiB: 128,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `xray-${serviceName}`,
        logRetention: logs.RetentionDays.THREE_DAYS,
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
    publicService: boolean
  ): ecs.FargateService {
    const service = new ecs.FargateService(this, `Service-${serviceName}-${environmentSuffix}`, {
      cluster,
      taskDefinition,
      serviceName: `svc-${serviceName}-${environmentSuffix}`,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [securityGroup],
      assignPublicIp: true,
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
      cloudMapOptions: {
        name: serviceName,
        cloudMapNamespace: namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(30),
      },
    });

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
    scaling.scaleOnCpuUtilization(`CpuScaling-${serviceName}-${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Memory-based scaling
    scaling.scaleOnMemoryUtilization(`MemoryScaling-${serviceName}-${environmentSuffix}`, {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }

  private createDashboard(
    environmentSuffix: string,
    cluster: ecs.Cluster,
    services: ecs.FargateService[],
    alb: elbv2.ApplicationLoadBalancer,
    targetGroup: elbv2.ApplicationTargetGroup
  ): void {
    const dashboard = new cloudwatch.Dashboard(this, `Dashboard-${environmentSuffix}`, {
      dashboardName: `ecs-services-${environmentSuffix}`,
    });

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
    services.forEach((service, index) => {
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
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or generate default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || `dev-${Date.now()}`;

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  description: 'Multi-service ECS orchestration platform with ALB, CloudMap, and X-Ray',
});

app.synth();
```

## File: lib/README.md

```markdown
# Multi-Service ECS Orchestration Platform

AWS CDK TypeScript implementation for orchestrating containerized microservices on Amazon ECS with comprehensive monitoring, service discovery, and distributed tracing.

## Architecture Overview

This solution deploys a complete microservices platform with:

- ECS Cluster with Fargate and Fargate Spot capacity providers
- Three microservices: api-gateway, order-processor, market-data
- Application Load Balancer with path-based routing
- AWS Cloud Map for service discovery
- Auto-scaling based on CPU and memory utilization
- ECR repositories with lifecycle policies
- CloudWatch Container Insights
- X-Ray distributed tracing
- Comprehensive CloudWatch dashboards

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`
- Docker (for building and pushing container images)

## Project Structure

```
.
├── bin/
│   └── tap.ts                 # CDK app entry point
├── lib/
│   ├── tap-stack.ts           # Main stack implementation
│   ├── PROMPT.md              # Original requirements
│   ├── MODEL_RESPONSE.md      # This file
│   └── README.md              # Documentation
└── test/
    ├── tap-stack.unit.test.ts # Unit tests
    └── tap-stack.int.test.ts  # Integration tests
```

## Deployment Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Container Images

Before deploying, you need to build and push container images for each microservice:

```bash
# Example for api-gateway service
docker build -t api-gateway:latest ./path/to/api-gateway
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag api-gateway:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-repo-api-gateway-<suffix>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecr-repo-api-gateway-<suffix>:latest

# Repeat for order-processor and market-data services
```

### Step 3: Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Step 4: Deploy the Stack

```bash
# With custom environment suffix
cdk deploy --context environmentSuffix=dev123

# Or let it auto-generate suffix
cdk deploy
```

### Step 5: Verify Deployment

```bash
# Get ALB DNS name from outputs
aws cloudformation describe-stacks --stack-name TapStack-<suffix> --query 'Stacks[0].Outputs'

# Test API gateway endpoint
curl http://<alb-dns-name>/api/health
```

## Configuration

### Environment Suffix

The `environmentSuffix` parameter is required for resource naming uniqueness:

```bash
cdk deploy --context environmentSuffix=prod-v1
```

### Capacity Providers

The stack uses a mix of Fargate and Fargate Spot:
- Base capacity: 1 task on Fargate (always available)
- Additional capacity: 80% on Fargate Spot (cost-optimized)

### Auto-Scaling Configuration

Each service auto-scales based on:
- CPU utilization: target 70%
- Memory utilization: target 80%
- Min tasks: 1
- Max tasks: 10

## Service Discovery

Services communicate using AWS Cloud Map DNS:

- Namespace: `services-<suffix>.local`
- API Gateway: `api-gateway.services-<suffix>.local:8080`
- Order Processor: `order-processor.services-<suffix>.local:8080`
- Market Data: `market-data.services-<suffix>.local:8080`

## Monitoring

### CloudWatch Container Insights

Cluster-level metrics automatically collected:
- Task CPU and memory utilization
- Network metrics
- Storage metrics

### CloudWatch Dashboard

Access the dashboard: `ecs-services-<suffix>`

Metrics include:
- ALB request count and response time
- Target group health
- Per-service CPU and memory utilization

### X-Ray Tracing

Each task includes X-Ray daemon sidecar. Configure your application to use AWS X-Ray SDK:

```typescript
// Example Node.js configuration
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests (requires AWS credentials):

```bash
npm run test:int
```

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=<your-suffix>
```

All resources are configured with `RemovalPolicy.DESTROY` for complete cleanup.

## Troubleshooting

### Services not starting

Check CloudWatch Logs:
```bash
aws logs tail /aws/ecs/api-gateway --follow
```

### Auto-scaling not working

Verify CloudWatch metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=svc-api-gateway-<suffix> \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

### Service discovery not resolving

Verify Cloud Map service registration:
```bash
aws servicediscovery list-services --namespace-id <namespace-id>
```

## Cost Optimization

- Uses Fargate Spot for 80% of capacity (up to 70% cost savings)
- No NAT Gateways (public subnets only)
- Log retention set to 1 week (3 days for X-Ray)
- ECR lifecycle policies keep only 10 images

## Security Considerations

- Task execution roles have minimal required permissions
- Task roles scoped per service
- Security groups follow least-privilege
- Container image scanning enabled
- All secrets should use AWS Secrets Manager

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [AWS Cloud Map Documentation](https://docs.aws.amazon.com/cloud-map/)
```