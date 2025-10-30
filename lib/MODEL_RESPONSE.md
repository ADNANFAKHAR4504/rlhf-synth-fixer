# Pulumi TypeScript Infrastructure for ECS Containerized Web Application

I'll help you create infrastructure for deploying a containerized web application on AWS ECS with Fargate, complete with load balancing, auto-scaling, and proper networking. Here's the complete solution organized into maintainable TypeScript modules.

## File Structure

The infrastructure is organized into the following files:
- `lib/network-stack.ts` - VPC, subnets, and networking components
- `lib/ecs-cluster-stack.ts` - ECS cluster and execution roles
- `lib/alb-stack.ts` - Application Load Balancer with target groups
- `lib/ecs-service-stack.ts` - Reusable ECS service with auto-scaling
- `lib/route53-stack.ts` - DNS records for the application
- `lib/tap-stack.ts` - Main orchestration component
- `index.ts` - Program entry point

## `lib/network-stack.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(name: string, args: NetworkStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('webapp:network:NetworkStack', name, args, opts);

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`${name}-vpc-${args.environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...args.tags,
        Name: `${name}-vpc-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`${name}-igw-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `${name}-igw-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create 2 public subnets for ALB
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...args.tags,
          Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
          Type: 'Public',
        },
      }, { parent: this });
      this.publicSubnets.push(publicSubnet);
    }

    // Create 2 private subnets for ECS tasks
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones.then(azs => azs.names[i]),
        tags: {
          ...args.tags,
          Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
          Type: 'Private',
        },
      }, { parent: this });
      this.privateSubnets.push(privateSubnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `${name}-public-rt-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create public route to internet gateway
    new aws.ec2.Route(`${name}-public-route-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    }, { parent: this });

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}-${args.environmentSuffix}`, {
        subnetId: this.publicSubnets[i].id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    }

    // Create private route table (no NAT gateway for cost optimization)
    const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `${name}-private-rt-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Associate private subnets with private route table
    for (let i = 0; i < this.privateSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i}-${args.environmentSuffix}`, {
        subnetId: this.privateSubnets[i].id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    }

    // Security Group for ALB - allows HTTPS inbound
    this.albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
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
        ...args.tags,
        Name: `${name}-alb-sg-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Security Group for ECS tasks - allows traffic from ALB only
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-ecs-sg-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: 'Security group for ECS tasks',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 3000,
          toPort: 3000,
          securityGroups: [this.albSecurityGroup.id],
          description: 'Allow traffic from ALB on port 3000 (frontend)',
        },
        {
          protocol: 'tcp',
          fromPort: 8080,
          toPort: 8080,
          securityGroups: [this.albSecurityGroup.id],
          description: 'Allow traffic from ALB on port 8080 (backend)',
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
        ...args.tags,
        Name: `${name}-ecs-sg-${args.environmentSuffix}`,
      },
    }, { parent: this });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: pulumi.output(this.publicSubnets).apply(subnets => subnets.map(s => s.id)),
      privateSubnetIds: pulumi.output(this.privateSubnets).apply(subnets => subnets.map(s => s.id)),
    });
  }
}
```

## `lib/ecs-cluster-stack.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsClusterStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsClusterStack extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly executionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;
  public readonly ecrRepositoryFrontend: aws.ecr.Repository;
  public readonly ecrRepositoryBackend: aws.ecr.Repository;

  constructor(name: string, args: EcsClusterStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('webapp:ecs:ClusterStack', name, args, opts);

    // Create ECS Cluster
    this.cluster = new aws.ecs.Cluster(`${name}-cluster-${args.environmentSuffix}`, {
      name: `${name}-cluster-${args.environmentSuffix}`,
      settings: [{
        name: 'containerInsights',
        value: 'enabled',
      }],
      tags: {
        ...args.tags,
        Name: `${name}-cluster-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create ECS Task Execution Role
    this.executionRole = new aws.iam.Role(`${name}-execution-role-${args.environmentSuffix}`, {
      name: `${name}-execution-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        }],
      }),
      tags: {
        ...args.tags,
        Name: `${name}-execution-role-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Attach minimal policies for ECS task execution
    new aws.iam.RolePolicyAttachment(`${name}-execution-policy-${args.environmentSuffix}`, {
      role: this.executionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    // Create inline policy for ECR access
    new aws.iam.RolePolicy(`${name}-ecr-policy-${args.environmentSuffix}`, {
      role: this.executionRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          Resource: '*',
        }],
      }),
    }, { parent: this });

    // Create Task Role (for container permissions)
    this.taskRole = new aws.iam.Role(`${name}-task-role-${args.environmentSuffix}`, {
      name: `${name}-task-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        }],
      }),
      tags: {
        ...args.tags,
        Name: `${name}-task-role-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create ECR repositories
    this.ecrRepositoryFrontend = new aws.ecr.Repository(`${name}-frontend-repo-${args.environmentSuffix}`, {
      name: `${name}-frontend-${args.environmentSuffix}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      tags: {
        ...args.tags,
        Name: `${name}-frontend-repo-${args.environmentSuffix}`,
      },
    }, { parent: this });

    this.ecrRepositoryBackend = new aws.ecr.Repository(`${name}-backend-repo-${args.environmentSuffix}`, {
      name: `${name}-backend-${args.environmentSuffix}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      tags: {
        ...args.tags,
        Name: `${name}-backend-repo-${args.environmentSuffix}`,
      },
    }, { parent: this });

    this.registerOutputs({
      clusterArn: this.cluster.arn,
      executionRoleArn: this.executionRole.arn,
      taskRoleArn: this.taskRole.arn,
    });
  }
}
```

## `lib/alb-stack.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string[]>;
  albSecurityGroupId: pulumi.Input<string>;
  certificateArn?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly httpsListener: aws.lb.Listener;
  public readonly frontendTargetGroup: aws.lb.TargetGroup;
  public readonly backendTargetGroup: aws.lb.TargetGroup;

  constructor(name: string, args: AlbStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('webapp:alb:AlbStack', name, args, opts);

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(`${name}-alb-${args.environmentSuffix}`, {
      name: `${name}-alb-${args.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [args.albSecurityGroupId],
      subnets: args.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        ...args.tags,
        Name: `${name}-alb-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create Target Group for Frontend (port 3000)
    this.frontendTargetGroup = new aws.lb.TargetGroup(`${name}-frontend-tg-${args.environmentSuffix}`, {
      name: `${name}-frontend-tg-${args.environmentSuffix}`,
      port: 3000,
      protocol: 'HTTP',
      vpcId: args.vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        matcher: '200-299',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: 30,
      tags: {
        ...args.tags,
        Name: `${name}-frontend-tg-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create Target Group for Backend (port 8080)
    this.backendTargetGroup = new aws.lb.TargetGroup(`${name}-backend-tg-${args.environmentSuffix}`, {
      name: `${name}-backend-tg-${args.environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: args.vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/api/health',
        protocol: 'HTTP',
        matcher: '200-299',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: 30,
      tags: {
        ...args.tags,
        Name: `${name}-backend-tg-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create HTTP Listener (redirects to HTTPS)
    const httpListener = new aws.lb.Listener(`${name}-http-listener-${args.environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'redirect',
        redirect: {
          port: '443',
          protocol: 'HTTPS',
          statusCode: 'HTTP_301',
        },
      }],
    }, { parent: this });

    // Create HTTPS Listener
    // Note: Certificate ARN should be provided or created via ACM
    const certificateArn = args.certificateArn || 'arn:aws:acm:eu-west-2:123456789012:certificate/example';

    this.httpsListener = new aws.lb.Listener(`${name}-https-listener-${args.environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificateArn,
      defaultActions: [{
        type: 'forward',
        targetGroupArn: this.frontendTargetGroup.arn,
      }],
    }, { parent: this });

    // Create Listener Rule for Backend API (path-based routing)
    new aws.lb.ListenerRule(`${name}-backend-rule-${args.environmentSuffix}`, {
      listenerArn: this.httpsListener.arn,
      priority: 100,
      actions: [{
        type: 'forward',
        targetGroupArn: this.backendTargetGroup.arn,
      }],
      conditions: [{
        pathPattern: {
          values: ['/api/*'],
        },
      }],
    }, { parent: this });

    // Frontend rule (default, already handled by listener default action)
    // But we can explicitly add it for clarity
    new aws.lb.ListenerRule(`${name}-frontend-rule-${args.environmentSuffix}`, {
      listenerArn: this.httpsListener.arn,
      priority: 200,
      actions: [{
        type: 'forward',
        targetGroupArn: this.frontendTargetGroup.arn,
      }],
      conditions: [{
        pathPattern: {
          values: ['/*'],
        },
      }],
    }, { parent: this });

    this.registerOutputs({
      albDnsName: this.alb.dnsName,
      albArn: this.alb.arn,
    });
  }
}
```

## `lib/ecs-service-stack.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface EcsServiceStackArgs {
  environmentSuffix: string;
  serviceName: string;
  clusterArn: pulumi.Input<string>;
  executionRoleArn: pulumi.Input<string>;
  taskRoleArn: pulumi.Input<string>;
  ecrRepositoryUrl: pulumi.Input<string>;
  containerPort: number;
  desiredCount: number;
  minCapacity: number;
  maxCapacity: number;
  cpu: string;
  memory: string;
  targetGroupArn: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  securityGroupId: pulumi.Input<string>;
  logGroupName: string;
  containerEnvironment?: Array<{ name: string; value: string }>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcsServiceStack extends pulumi.ComponentResource {
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly autoScalingTarget: aws.appautoscaling.Target;

  constructor(name: string, args: EcsServiceStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('webapp:ecs:ServiceStack', name, args, opts);

    // Create CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup(`${name}-logs-${args.environmentSuffix}`, {
      name: args.logGroupName,
      retentionInDays: 7,
      tags: {
        ...args.tags,
        Name: `${name}-logs-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create Task Definition
    const containerDef = {
      name: args.serviceName,
      image: pulumi.interpolate`${args.ecrRepositoryUrl}:latest`,
      cpu: parseInt(args.cpu),
      memory: parseInt(args.memory),
      essential: true,
      portMappings: [{
        containerPort: args.containerPort,
        protocol: 'tcp',
      }],
      environment: args.containerEnvironment || [],
      logConfiguration: {
        logDriver: 'awslogs',
        options: {
          'awslogs-group': this.logGroup.name,
          'awslogs-region': aws.config.region!,
          'awslogs-stream-prefix': args.serviceName,
        },
      },
    };

    this.taskDefinition = new aws.ecs.TaskDefinition(`${name}-task-${args.environmentSuffix}`, {
      family: `${name}-task-${args.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: args.cpu,
      memory: args.memory,
      executionRoleArn: args.executionRoleArn,
      taskRoleArn: args.taskRoleArn,
      containerDefinitions: JSON.stringify([containerDef]),
      tags: {
        ...args.tags,
        Name: `${name}-task-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create ECS Service
    this.service = new aws.ecs.Service(`${name}-service-${args.environmentSuffix}`, {
      name: `${name}-service-${args.environmentSuffix}`,
      cluster: args.clusterArn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: args.desiredCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        assignPublicIp: true,
        subnets: args.privateSubnetIds,
        securityGroups: [args.securityGroupId],
      },
      loadBalancers: [{
        targetGroupArn: args.targetGroupArn,
        containerName: args.serviceName,
        containerPort: args.containerPort,
      }],
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 100,
      },
      tags: {
        ...args.tags,
        Name: `${name}-service-${args.environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [this.taskDefinition] });

    // Create Auto Scaling Target
    this.autoScalingTarget = new aws.appautoscaling.Target(`${name}-scaling-target-${args.environmentSuffix}`, {
      serviceNamespace: 'ecs',
      resourceId: pulumi.interpolate`service/${args.clusterArn.apply(arn => arn.split('/').pop())}/${this.service.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      minCapacity: args.minCapacity,
      maxCapacity: args.maxCapacity,
    }, { parent: this });

    // Create Auto Scaling Policy - CPU Based
    new aws.appautoscaling.Policy(`${name}-cpu-scaling-policy-${args.environmentSuffix}`, {
      name: `${name}-cpu-scaling-${args.environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: this.autoScalingTarget.resourceId,
      scalableDimension: this.autoScalingTarget.scalableDimension,
      serviceNamespace: this.autoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        targetValue: 70.0,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    this.registerOutputs({
      serviceArn: this.service.id,
      taskDefinitionArn: this.taskDefinition.arn,
    });
  }
}
```

## `lib/route53-stack.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface Route53StackArgs {
  environmentSuffix: string;
  domainName: string;
  subdomain: string;
  albDnsName: pulumi.Input<string>;
  albZoneId: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Route53Stack extends pulumi.ComponentResource {
  public readonly hostedZone: aws.route53.Zone;
  public readonly aRecord: aws.route53.Record;
  public readonly fullDomainName: pulumi.Output<string>;

  constructor(name: string, args: Route53StackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('webapp:route53:Route53Stack', name, args, opts);

    // Get or create hosted zone for the domain
    this.hostedZone = new aws.route53.Zone(`${name}-zone-${args.environmentSuffix}`, {
      name: args.domainName,
      tags: {
        ...args.tags,
        Name: `${name}-zone-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create A record pointing to ALB
    const fullDomain = `${args.subdomain}.${args.domainName}`;
    this.fullDomainName = pulumi.output(fullDomain);

    this.aRecord = new aws.route53.Record(`${name}-a-record-${args.environmentSuffix}`, {
      zoneId: this.hostedZone.zoneId,
      name: fullDomain,
      type: 'A',
      aliases: [{
        name: args.albDnsName,
        zoneId: args.albZoneId,
        evaluateTargetHealth: true,
      }],
    }, { parent: this });

    this.registerOutputs({
      fullDomainName: this.fullDomainName,
      nameServers: this.hostedZone.nameServers,
    });
  }
}
```

## `lib/tap-stack.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { NetworkStack } from './network-stack';
import { EcsClusterStack } from './ecs-cluster-stack';
import { AlbStack } from './alb-stack';
import { EcsServiceStack } from './ecs-service-stack';
import { Route53Stack } from './route53-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly networkStack: NetworkStack;
  public readonly ecsClusterStack: EcsClusterStack;
  public readonly albStack: AlbStack;
  public readonly frontendService: EcsServiceStack;
  public readonly backendService: EcsServiceStack;
  public readonly route53Stack: Route53Stack;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('webapp:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'WebApp',
    };

    // Configure AWS provider for eu-west-2
    const awsProvider = new aws.Provider('aws-provider', {
      region: 'eu-west-2',
    }, { parent: this });

    const resourceOpts = { parent: this, provider: awsProvider };

    // Create Network Stack
    this.networkStack = new NetworkStack('webapp-network', {
      environmentSuffix,
      tags,
    }, resourceOpts);

    // Create ECS Cluster Stack
    this.ecsClusterStack = new EcsClusterStack('webapp-ecs', {
      environmentSuffix,
      tags,
    }, resourceOpts);

    // Create ALB Stack
    this.albStack = new AlbStack('webapp-alb', {
      environmentSuffix,
      vpcId: this.networkStack.vpc.id,
      publicSubnetIds: pulumi.output(this.networkStack.publicSubnets).apply(subnets => subnets.map(s => s.id)),
      albSecurityGroupId: this.networkStack.albSecurityGroup.id,
      tags,
    }, resourceOpts);

    // Create Frontend ECS Service
    this.frontendService = new EcsServiceStack('webapp-frontend', {
      environmentSuffix,
      serviceName: 'frontend',
      clusterArn: this.ecsClusterStack.cluster.arn,
      executionRoleArn: this.ecsClusterStack.executionRole.arn,
      taskRoleArn: this.ecsClusterStack.taskRole.arn,
      ecrRepositoryUrl: this.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl,
      containerPort: 3000,
      desiredCount: 2,
      minCapacity: 2,
      maxCapacity: 10,
      cpu: '512',
      memory: '1024',
      targetGroupArn: this.albStack.frontendTargetGroup.arn,
      privateSubnetIds: pulumi.output(this.networkStack.privateSubnets).apply(subnets => subnets.map(s => s.id)),
      securityGroupId: this.networkStack.ecsSecurityGroup.id,
      logGroupName: `/ecs/webapp-frontend-${environmentSuffix}`,
      containerEnvironment: [
        { name: 'NODE_ENV', value: 'production' },
        { name: 'PORT', value: '3000' },
      ],
      tags,
    }, resourceOpts);

    // Create Backend ECS Service
    this.backendService = new EcsServiceStack('webapp-backend', {
      environmentSuffix,
      serviceName: 'backend',
      clusterArn: this.ecsClusterStack.cluster.arn,
      executionRoleArn: this.ecsClusterStack.executionRole.arn,
      taskRoleArn: this.ecsClusterStack.taskRole.arn,
      ecrRepositoryUrl: this.ecsClusterStack.ecrRepositoryBackend.repositoryUrl,
      containerPort: 8080,
      desiredCount: 3,
      minCapacity: 3,
      maxCapacity: 15,
      cpu: '512',
      memory: '1024',
      targetGroupArn: this.albStack.backendTargetGroup.arn,
      privateSubnetIds: pulumi.output(this.networkStack.privateSubnets).apply(subnets => subnets.map(s => s.id)),
      securityGroupId: this.networkStack.ecsSecurityGroup.id,
      logGroupName: `/ecs/webapp-backend-${environmentSuffix}`,
      containerEnvironment: [
        { name: 'NODE_ENV', value: 'production' },
        { name: 'PORT', value: '8080' },
        { name: 'API_PREFIX', value: '/api' },
      ],
      tags,
    }, resourceOpts);

    // Create Route53 Stack
    this.route53Stack = new Route53Stack('webapp-dns', {
      environmentSuffix,
      domainName: 'example.com',
      subdomain: 'app',
      albDnsName: this.albStack.alb.dnsName,
      albZoneId: this.albStack.alb.zoneId,
      tags,
    }, resourceOpts);

    this.registerOutputs({
      vpcId: this.networkStack.vpc.id,
      clusterArn: this.ecsClusterStack.cluster.arn,
      albDnsName: this.albStack.alb.dnsName,
      applicationUrl: this.route53Stack.fullDomainName,
      frontendEcrUrl: this.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl,
      backendEcrUrl: this.ecsClusterStack.ecrRepositoryBackend.repositoryUrl,
    });
  }
}
```

## `index.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get configuration from Pulumi config
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();

// Create the main stack
const stack = new TapStack('webapp', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'WebApp',
  },
});

// Export outputs
export const vpcId = stack.networkStack.vpc.id;
export const clusterArn = stack.ecsClusterStack.cluster.arn;
export const albDnsName = stack.albStack.alb.dnsName;
export const applicationUrl = stack.route53Stack.fullDomainName;
export const frontendEcrRepositoryUrl = stack.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl;
export const backendEcrRepositoryUrl = stack.ecsClusterStack.ecrRepositoryBackend.repositoryUrl;
export const frontendServiceName = stack.frontendService.service.name;
export const backendServiceName = stack.backendService.service.name;
```

## `Pulumi.yaml`

```yaml
name: TapStack
runtime:
  name: nodejs
  options:
    typescript: true
description: Pulumi infrastructure for containerized web application on ECS
main: index.ts
```

## Deployment Instructions

1. **Prerequisites**:
   - Install Pulumi CLI 3.x
   - Install Node.js 16+
   - Configure AWS CLI with appropriate credentials
   - Have an ACM certificate for HTTPS (update certificate ARN in alb-stack.ts)

2. **Install Dependencies**:
   ```bash
   npm install @pulumi/pulumi @pulumi/aws
   ```

3. **Configure Stack**:
   ```bash
   pulumi config set aws:region eu-west-2
   pulumi config set environmentSuffix dev
   ```

4. **Build Container Images**:
   - Build and push frontend and backend Docker images to ECR repositories
   - The repositories will be created by this infrastructure

5. **Deploy**:
   ```bash
   pulumi up
   ```

6. **Access Application**:
   - The application will be available at `https://app.example.com`
   - Frontend routes: `/*`
   - Backend API routes: `/api/*`

## Architecture Overview

This solution implements:

1. **Network Layer**: VPC with 2 public subnets (ALB) and 2 private subnets (ECS tasks)
2. **ECS Cluster**: Fargate-based cluster with Container Insights enabled
3. **Load Balancer**: ALB with HTTPS listener and path-based routing rules
4. **Services**: Frontend (2-10 tasks) and Backend (3-15 tasks) with auto-scaling
5. **Security**: Security groups with least privilege access, IAM roles with minimal permissions
6. **Monitoring**: CloudWatch logs with 7-day retention
7. **DNS**: Route53 A record pointing to ALB

All resources follow naming conventions with environmentSuffix for uniqueness and proper resource management.
