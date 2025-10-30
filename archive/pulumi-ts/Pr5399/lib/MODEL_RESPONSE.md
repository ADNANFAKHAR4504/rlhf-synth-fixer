# ECS Web Application Deployment with Pulumi TypeScript

This implementation creates a complete containerized web application infrastructure on AWS using ECS Fargate with Application Load Balancer, auto-scaling, and comprehensive monitoring.

## Architecture Overview

The solution consists of three main component stacks:
1. **VpcStack**: Network infrastructure with public/private subnets and NAT gateways
2. **AlbStack**: Application Load Balancer with security groups and target groups
3. **EcsStack**: ECS cluster, task definitions, service, and auto-scaling

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the Payment API ECS infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration for deploying a containerized web application on ECS with auto-scaling
 * and load balancing capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from environment variable, Pulumi config, or default to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Get container image from config or use default nginx
const containerImage =
  config.get('containerImage') || 'public.ecr.aws/nginx/nginx:latest';

// Define default tags for all resources
const defaultTags = {
  Environment: 'production',
  Project: 'payment-api',
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

// Instantiate the main stack component
const stack = new TapStack('payment-api-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  containerImage: containerImage,
});

// Export stack outputs
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDns;
export const ecsClusterArn = stack.clusterArn;
export const ecsServiceArn = stack.serviceArn;
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Payment API ECS deployment.
 * Orchestrates VPC, ALB, and ECS components to create a complete containerized
 * web application infrastructure with auto-scaling and load balancing.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { AlbStack } from './alb-stack';
import { EcsStack } from './ecs-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Container image to deploy (ECR image URI).
   * Defaults to nginx for demo purposes.
   */
  containerImage?: string;
}

/**
 * Represents the main Pulumi component resource for the Payment API ECS deployment.
 *
 * This component orchestrates VPC networking, Application Load Balancer,
 * and ECS Fargate service with auto-scaling capabilities.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const containerImage =
      args.containerImage ||
      'public.ecr.aws/nginx/nginx:latest'; // Default to public nginx for demo

    // Create VPC with public and private subnets, NAT gateways
    const vpcStack = new VpcStack(
      'vpc',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create Application Load Balancer with security groups and target group
    const albStack = new AlbStack(
      'alb',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        tags: tags,
      },
      { parent: this }
    );

    // Create ECS Cluster, Task Definition, and Service with auto-scaling
    const ecsStack = new EcsStack(
      'ecs',
      {
        environmentSuffix: environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        targetGroupArn: albStack.targetGroupArn,
        ecsTaskSecurityGroupId: albStack.ecsTaskSecurityGroupId,
        containerImage: containerImage,
        tags: tags,
      },
      { parent: this }
    );

    // Expose key outputs
    this.vpcId = vpcStack.vpcId;
    this.albDns = albStack.albDns;
    this.clusterArn = ecsStack.clusterArn;
    this.serviceArn = ecsStack.serviceArn;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDns: this.albDns,
      clusterArn: this.clusterArn,
      serviceArn: this.serviceArn,
    });
  }
}
```

## File: lib/vpc-stack.ts

```typescript
/**
 * VPC Stack Component
 *
 * Creates a VPC with public and private subnets across multiple availability zones,
 * NAT gateways for private subnet internet access, and an internet gateway for public access.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Get available AZs
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnets in 2 AZs
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.then((azs) => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
            ...args.tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets in 2 AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then((azs) => azs.names[i]),
          tags: {
            Name: `private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
            ...args.tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Add route to internet gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            Name: `nat-eip-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways in public subnets
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 2; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `nat-gw-${i}-${args.environmentSuffix}`,
        {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `nat-gw-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Create private route tables and associate with NAT Gateways
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `private-rt-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map((s) => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map((s) => s.id));
    this.internetGatewayId = internetGateway.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
```

## File: lib/alb-stack.ts

```typescript
/**
 * Application Load Balancer Stack Component
 *
 * Creates an Application Load Balancer with security groups, target groups,
 * listeners, and ACM certificate for HTTPS traffic.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly ecsTaskSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: AlbStackArgs, opts?: ResourceOptions) {
    super('tap:alb:AlbStack', name, args, opts);

    // Create Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        name: `alb-sg-${args.environmentSuffix}`,
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `alb-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Security Group for ECS Tasks
    const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${args.environmentSuffix}`,
      {
        name: `ecs-task-sg-${args.environmentSuffix}`,
        vpcId: args.vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `ecs-task-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `payment-api-tg-${args.environmentSuffix}`.substring(0, 32),
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: {
          Name: `tg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `payment-api-alb-${args.environmentSuffix}`.substring(0, 32),
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: {
          Name: `alb-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Get or create ACM certificate for HTTPS
    // Note: In production, you would reference an existing certificate
    // For this demo, we'll create a self-signed certificate placeholder
    const certificate = new aws.acm.Certificate(
      `cert-${args.environmentSuffix}`,
      {
        domainName: pulumi.interpolate`${alb.dnsName}`,
        validationMethod: 'DNS',
        tags: {
          Name: `cert-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create HTTPS Listener
    new aws.lb.Listener(
      `listener-https-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: certificate.arn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create HTTP Listener (redirect to HTTPS)
    new aws.lb.Listener(
      `listener-http-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'redirect',
            redirect: {
              port: '443',
              protocol: 'HTTPS',
              statusCode: 'HTTP_301',
            },
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.albArn = alb.arn;
    this.albDns = alb.dnsName;
    this.albSecurityGroupId = albSecurityGroup.id;
    this.targetGroupArn = targetGroup.arn;
    this.ecsTaskSecurityGroupId = ecsTaskSecurityGroup.id;

    this.registerOutputs({
      albArn: this.albArn,
      albDns: this.albDns,
      albSecurityGroupId: this.albSecurityGroupId,
      targetGroupArn: this.targetGroupArn,
      ecsTaskSecurityGroupId: this.ecsTaskSecurityGroupId,
    });
  }
}
```

## File: lib/ecs-stack.ts

```typescript
/**
 * ECS Stack Component
 *
 * Creates an ECS cluster with Fargate support, task definitions, and ECS service
 * with auto-scaling capabilities based on CPU utilization.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  targetGroupArn: pulumi.Output<string>;
  ecsTaskSecurityGroupId: pulumi.Output<string>;
  containerImage: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(name: string, args: EcsStackArgs, opts?: ResourceOptions) {
    super('tap:ecs:EcsStack', name, args, opts);

    // Create CloudWatch Log Group for container logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${args.environmentSuffix}`,
      {
        name: `/ecs/payment-api-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-logs-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create ECS Cluster with Container Insights enabled
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `payment-api-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `ecs-cluster-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const executionRole = new aws.iam.Role(
      `ecs-execution-role-${args.environmentSuffix}`,
      {
        name: `ecs-execution-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-execution-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-execution-policy-${args.environmentSuffix}`,
      {
        role: executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
        name: `ecs-task-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecs-task-role-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${args.environmentSuffix}`,
      {
        family: `payment-api-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: `payment-api-container-${args.environmentSuffix}`,
            image: args.containerImage,
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroup.name,
                'awslogs-region': aws.config.region!,
                'awslogs-stream-prefix': 'ecs',
              },
            },
            environment: [
              {
                name: 'ENVIRONMENT',
                value: args.environmentSuffix,
              },
            ],
          },
        ]),
        tags: {
          Name: `task-def-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create ECS Service
    const service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `payment-api-service-${args.environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: args.privateSubnetIds,
          securityGroups: [args.ecsTaskSecurityGroupId],
        },
        loadBalancers: [
          {
            targetGroupArn: args.targetGroupArn,
            containerName: `payment-api-container-${args.environmentSuffix}`,
            containerPort: 80,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `ecs-service-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [taskDefinition] }
    );

    // Create Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `ecs-scaling-target-${args.environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create Auto Scaling Policy based on CPU utilization
    new aws.appautoscaling.Policy(
      `ecs-scaling-policy-${args.environmentSuffix}`,
      {
        name: `ecs-cpu-scaling-${args.environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 60,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.clusterArn = cluster.arn;
    this.clusterName = cluster.name;
    this.serviceArn = service.id;
    this.serviceName = service.name;

    this.registerOutputs({
      clusterArn: this.clusterArn,
      clusterName: this.clusterName,
      serviceArn: this.serviceArn,
      serviceName: this.serviceName,
    });
  }
}
```

## Deployment Instructions

### Prerequisites
- Pulumi CLI installed
- AWS credentials configured
- Node.js and npm installed

### Deploy

```bash
# Install dependencies
npm install

# Configure stack
pulumi config set aws:region ap-southeast-1
pulumi config set containerImage <your-ecr-image-uri>

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Get outputs
pulumi stack output albDnsName
```

### Clean Up

```bash
pulumi destroy
```

## Key Features

- **Fargate Launch Type**: Serverless container execution without EC2 management
- **Auto-Scaling**: CPU-based scaling between 3-10 tasks at 70% target
- **Multi-AZ**: Resources distributed across multiple availability zones
- **Secure Networking**: Private subnets for tasks, public subnets for ALB
- **HTTPS Support**: ACM certificate with HTTPS listener on port 443
- **Health Checks**: ALB health checks on /health endpoint
- **Logging**: CloudWatch logs with 7-day retention
- **Container Insights**: Enhanced ECS monitoring enabled
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tags**: Consistent tagging with Environment=production and Project=payment-api
