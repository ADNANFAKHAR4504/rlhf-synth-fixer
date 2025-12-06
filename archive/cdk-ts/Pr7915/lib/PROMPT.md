# IaC Program Optimization Task

## Task Description

Generate an Infrastructure optimization script for ECS Fargate infrastructure. The file should be called optimize.py and should use boto3 to apply optimizations. Enhance the following resources for better scalability and observability:

- **ECS Fargate Service**: Expand autoscaling capacity from 5 to 10 max tasks
- **Autoscaling Policies**: Add memory-based autoscaling (in addition to CPU)
- **Monitoring**: Enable Container Insights on ECS cluster
- **CloudWatch Alarms**: Create alarms for high CPU (>75%) and Memory (>85%) utilization
- **CloudWatch Dashboard**: Create operational dashboard with key metrics

## Baseline Infrastructure Code

### File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsFargateStack } from './ecs-fargate-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * Main stack that orchestrates all infrastructure
 * This is a BASELINE deployment for IaC optimization demonstration
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create ECS Fargate infrastructure with baseline configuration
    new EcsFargateStack(this, 'EcsFargateStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}
```

### File: lib/ecs-fargate-stack.ts

```typescript
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

    // Create Task Execution Role, Task Role, Task Definition
    // ... (details omitted for brevity)

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
        healthCheckGracePeriod: cdk.Duration.seconds(60),
        assignPublicIp: true, // Using public subnets
      }
    );

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
```

## Expected Optimizations

The optimization script should:

1. Enable Container Insights on the ECS cluster
2. Expand autoscaling max capacity from 5 to 10 tasks
3. Add memory-based target tracking scaling policy (80% target)
4. Create CloudWatch alarm for high CPU utilization (>75%)
5. Create CloudWatch alarm for high memory utilization (>85%)
6. Create CloudWatch dashboard with CPU, Memory, Request Count, and Task Count metrics
7. Optionally add ALB request count per target scaling policy

## Environment Variables

- `ENVIRONMENT_SUFFIX`: The environment suffix for resource identification (e.g., "dev", "prod")
- `AWS_REGION`: AWS region (default: us-east-1)

## Usage

```bash
export ENVIRONMENT_SUFFIX=dev
python3 lib/optimize.py
```
