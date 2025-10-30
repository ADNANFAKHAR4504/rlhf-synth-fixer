# ECS Fargate Web Application Deployment

This implementation creates a complete containerized application deployment using Pulumi with TypeScript on AWS ECS Fargate.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi stack for deploying a containerized web application on AWS ECS Fargate.
 * This stack creates a complete infrastructure including VPC, ALB, ECS cluster, and auto-scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
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
}

/**
 * Main stack component that orchestrates the ECS Fargate deployment.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'production',
      ManagedBy: 'pulumi',
      ...(args.tags as any || {}),
    };

    // Create network infrastructure
    const networkStack = new NetworkStack(
      'network',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create ECS infrastructure
    const ecsStack = new EcsStack(
      'ecs',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Expose outputs
    this.albDnsName = ecsStack.albDnsName;
    this.ecsClusterName = ecsStack.clusterName;
    this.vpcId = networkStack.vpcId;

    // Register outputs
    this.registerOutputs({
      albDnsName: this.albDnsName,
      ecsClusterName: this.ecsClusterName,
      vpcId: this.vpcId,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
/**
 * network-stack.ts
 *
 * Creates VPC infrastructure with public and private subnets across multiple AZs.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly vpcCidr: string;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;
    this.vpcCidr = '10.0.0.0/16';

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: this.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: pulumi.output(availabilityZones).apply(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create NAT Gateway in first public subnet
    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `nat-gateway-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create private subnets (2 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: pulumi.output(availabilityZones).apply(azs => azs.names[i]),
          tags: {
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
            ...tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Create private route table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Route to NAT Gateway
    new aws.ec2.Route(
      `private-route-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/ecs-stack.ts

```typescript
/**
 * ecs-stack.ts
 *
 * Creates ECS Fargate cluster, ALB, task definition, service, and auto-scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  tags?: { [key: string]: string };
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

  constructor(
    name: string,
    args: EcsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:ecs:EcsStack', name, args, opts);

    const { environmentSuffix, vpcId, publicSubnetIds, privateSubnetIds, tags } = args;

    // Create ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
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
          Name: `alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Task Security Group
    const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP from ALB',
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
          Name: `ecs-task-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        stickiness: {
          enabled: true,
          type: 'app_cookie',
          cookieName: 'APPCOOKIE',
          cookieDuration: 86400,
        },
        tags: {
          Name: `tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ALB Listener
    new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: {
          Name: `ecs-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `cluster-${environmentSuffix}`,
      {
        tags: {
          Name: `cluster-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.clusterName = cluster.name;

    // Create ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `task-execution-role-${environmentSuffix}`,
      {
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
          Name: `task-execution-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create ECS Task Role
    const taskRole = new aws.iam.Role(
      `task-role-${environmentSuffix}`,
      {
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
          Name: `task-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get ECR repository
    const ecrRepo = aws.ecr.getRepositoryOutput({
      name: 'product-catalog-api',
    });

    const accountId = aws.getCallerIdentity().then(id => id.accountId);
    const region = aws.getRegion().then(r => r.name);

    // Create Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${environmentSuffix}`,
      {
        family: `product-catalog-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.all([accountId, region]).apply(([accId, reg]) =>
          JSON.stringify([
            {
              name: 'product-catalog-api',
              image: `${accId}.dkr.ecr.${reg}.amazonaws.com/product-catalog-api:latest`,
              portMappings: [
                {
                  containerPort: 80,
                  protocol: 'tcp',
                },
              ],
              healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost/health || exit 1'],
                interval: 30,
                timeout: 5,
                retries: 3,
                startPeriod: 60,
              },
              logConfiguration: {
                logDriver: 'awslogs',
                options: {
                  'awslogs-group': logGroup.name,
                  'awslogs-region': reg,
                  'awslogs-stream-prefix': 'ecs',
                },
              },
              essential: true,
            },
          ])
        ),
        tags: {
          Name: `task-def-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ECS Service with Fargate Spot
    const service = new aws.ecs.Service(
      `service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 50,
            base: 2,
          },
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 50,
            base: 0,
          },
        ],
        networkConfiguration: {
          subnets: privateSubnetIds,
          securityGroups: [ecsTaskSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'product-catalog-api',
            containerPort: 80,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          Name: `service-${environmentSuffix}`,
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [alb]
      }
    );

    // Create Auto Scaling Target
    const scalableTarget = new aws.appautoscaling.Target(
      `scaling-target-${environmentSuffix}`,
      {
        serviceNamespace: 'ecs',
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        minCapacity: 3,
        maxCapacity: 10,
      },
      { parent: this }
    );

    // Create Auto Scaling Policy
    new aws.appautoscaling.Policy(
      `scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: scalableTarget.resourceId,
        scalableDimension: scalableTarget.scalableDimension,
        serviceNamespace: scalableTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70.0,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterName: this.clusterName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define default tags to apply to all resources.
const defaultTags = {
  Environment: 'production',
  ManagedBy: 'pulumi',
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const ecsClusterName = stack.ecsClusterName;
export const vpcId = stack.vpcId;
```

## Architecture Overview

This implementation creates:

1. **VPC Infrastructure**: A VPC with 2 public and 2 private subnets across different availability zones, with Internet Gateway and NAT Gateway for connectivity.

2. **Application Load Balancer**: Deployed in public subnets with health checks on the `/health` endpoint and sticky sessions using application-based cookies.

3. **ECS Fargate Cluster**: Managed container orchestration service with task definition specifying 512 CPU units and 1024 MB memory.

4. **Security Groups**: Configured to allow HTTP traffic on port 80 from internet to ALB, and from ALB to ECS tasks.

5. **Auto Scaling**: Service auto-scaling between 3-10 tasks based on 70% CPU utilization target.

6. **Fargate Spot**: 50% base capacity on standard Fargate, 50% weight on Fargate Spot for cost optimization.

7. **CloudWatch Logs**: Log group with 7-day retention for container logs.

8. **Outputs**: ALB DNS name for accessing the deployed application.

All resources include the `environmentSuffix` for uniqueness and are tagged with `Environment=production` and `ManagedBy=pulumi`.