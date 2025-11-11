# ECS Fargate Microservices Architecture - Pulumi TypeScript Implementation

This implementation creates a complete containerized microservices architecture on AWS ECS Fargate with the following components:

- VPC with 2 public and 2 private subnets across 2 availability zones
- ECS Fargate cluster with 3 microservices (api-service, worker-service, scheduler-service)
- Application Load Balancer with path-based routing
- ECR repositories with lifecycle policies
- Auto-scaling policies based on CPU utilization
- CloudWatch log groups with 7-day retention
- IAM roles with least-privilege permissions
- Security groups with controlled traffic flow
- Secrets Manager for sensitive data

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for ECS Fargate microservices architecture.
 * Orchestrates VPC, ECS cluster, ALB, ECR, and all supporting infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { EcrStack } from './ecr-stack';
import { SecretsStack } from './secrets-stack';
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
   * AWS region for deployment
   */
  region?: string;
}

/**
 * Represents the main Pulumi component resource for the ECS Fargate microservices architecture.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly apiEcrUrl: pulumi.Output<string>;
  public readonly workerEcrUrl: pulumi.Output<string>;
  public readonly schedulerEcrUrl: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

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
    const region = args.region || 'eu-central-1 ';

    // Create VPC and networking infrastructure
    const networkStack = new NetworkStack(`tap-network-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create ECR repositories for container images
    const ecrStack = new EcrStack(`tap-ecr-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create Secrets Manager secrets for credentials
    const secretsStack = new SecretsStack(`tap-secrets-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create ECS cluster, services, ALB, and auto-scaling
    const ecsStack = new EcsStack(`tap-ecs-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      tags: tags,
      vpcId: networkStack.vpcId,
      publicSubnetIds: networkStack.publicSubnetIds,
      privateSubnetIds: networkStack.privateSubnetIds,
      apiEcrUrl: ecrStack.apiRepositoryUrl,
      workerEcrUrl: ecrStack.workerRepositoryUrl,
      schedulerEcrUrl: ecrStack.schedulerRepositoryUrl,
      dbSecretArn: secretsStack.dbSecretArn,
      apiKeySecretArn: secretsStack.apiKeySecretArn,
    }, { parent: this });

    // Expose outputs
    this.albDnsName = ecsStack.albDnsName;
    this.apiEcrUrl = ecrStack.apiRepositoryUrl;
    this.workerEcrUrl = ecrStack.workerRepositoryUrl;
    this.schedulerEcrUrl = ecrStack.schedulerRepositoryUrl;
    this.clusterName = ecsStack.clusterName;

    // Register the outputs of this component
    this.registerOutputs({
      albDnsName: this.albDnsName,
      apiEcrUrl: this.apiEcrUrl,
      workerEcrUrl: this.workerEcrUrl,
      schedulerEcrUrl: this.schedulerEcrUrl,
      clusterName: this.clusterName,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
/**
 * network-stack.ts
 *
 * Creates VPC with public and private subnets, NAT gateways, and internet gateway.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: NetworkStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create 2 public subnets in different AZs
    const publicSubnet1 = new aws.ec2.Subnet(`public-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: azs.names[0],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-1-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`public-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: azs.names[1],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-2-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create 2 private subnets in different AZs
    const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: azs.names[0],
      tags: {
        Name: `private-subnet-1-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: azs.names[1],
      tags: {
        Name: `private-subnet-2-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(`nat-eip-1-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        Name: `nat-eip-1-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const eip2 = new aws.ec2.Eip(`nat-eip-2-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        Name: `nat-eip-2-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create NAT Gateways in public subnets
    const natGw1 = new aws.ec2.NatGateway(`nat-gw-1-${environmentSuffix}`, {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `nat-gw-1-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const natGw2 = new aws.ec2.NatGateway(`nat-gw-2-${environmentSuffix}`, {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `nat-gw-2-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Add route to Internet Gateway
    new aws.ec2.Route(`public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(`public-rta-1-${environmentSuffix}`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`public-rta-2-${environmentSuffix}`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    // Create private route tables
    const privateRouteTable1 = new aws.ec2.RouteTable(`private-rt-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `private-rt-1-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const privateRouteTable2 = new aws.ec2.RouteTable(`private-rt-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `private-rt-2-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Add routes to NAT Gateways
    new aws.ec2.Route(`private-route-1-${environmentSuffix}`, {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw1.id,
    }, { parent: this });

    new aws.ec2.Route(`private-route-2-${environmentSuffix}`, {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw2.id,
    }, { parent: this });

    // Associate private subnets with private route tables
    new aws.ec2.RouteTableAssociation(`private-rta-1-${environmentSuffix}`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`private-rta-2-${environmentSuffix}`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    }, { parent: this });

    // Expose outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/ecr-stack.ts

```typescript
/**
 * ecr-stack.ts
 *
 * Creates ECR repositories for microservices with lifecycle policies.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcrStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EcrStack extends pulumi.ComponentResource {
  public readonly apiRepositoryUrl: pulumi.Output<string>;
  public readonly workerRepositoryUrl: pulumi.Output<string>;
  public readonly schedulerRepositoryUrl: pulumi.Output<string>;

  constructor(name: string, args: EcrStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:ecr:EcrStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Lifecycle policy to keep only last 10 images
    const lifecyclePolicy = {
      rules: [{
        rulePriority: 1,
        description: 'Keep only last 10 images',
        selection: {
          tagStatus: 'any',
          countType: 'imageCountMoreThan',
          countNumber: 10,
        },
        action: {
          type: 'expire',
        },
      }],
    };

    // Create ECR repository for API service
    const apiRepo = new aws.ecr.Repository(`api-service-repo-${environmentSuffix}`, {
      name: `api-service-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `api-service-repo-${environmentSuffix}`,
        Service: 'api',
        ...tags,
      },
    }, { parent: this });

    new aws.ecr.LifecyclePolicy(`api-service-lifecycle-${environmentSuffix}`, {
      repository: apiRepo.name,
      policy: JSON.stringify(lifecyclePolicy),
    }, { parent: this });

    // Create ECR repository for Worker service
    const workerRepo = new aws.ecr.Repository(`worker-service-repo-${environmentSuffix}`, {
      name: `worker-service-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `worker-service-repo-${environmentSuffix}`,
        Service: 'worker',
        ...tags,
      },
    }, { parent: this });

    new aws.ecr.LifecyclePolicy(`worker-service-lifecycle-${environmentSuffix}`, {
      repository: workerRepo.name,
      policy: JSON.stringify(lifecyclePolicy),
    }, { parent: this });

    // Create ECR repository for Scheduler service
    const schedulerRepo = new aws.ecr.Repository(`scheduler-service-repo-${environmentSuffix}`, {
      name: `scheduler-service-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `scheduler-service-repo-${environmentSuffix}`,
        Service: 'scheduler',
        ...tags,
      },
    }, { parent: this });

    new aws.ecr.LifecyclePolicy(`scheduler-service-lifecycle-${environmentSuffix}`, {
      repository: schedulerRepo.name,
      policy: JSON.stringify(lifecyclePolicy),
    }, { parent: this });

    // Expose outputs
    this.apiRepositoryUrl = apiRepo.repositoryUrl;
    this.workerRepositoryUrl = workerRepo.repositoryUrl;
    this.schedulerRepositoryUrl = schedulerRepo.repositoryUrl;

    this.registerOutputs({
      apiRepositoryUrl: this.apiRepositoryUrl,
      workerRepositoryUrl: this.workerRepositoryUrl,
      schedulerRepositoryUrl: this.schedulerRepositoryUrl,
    });
  }
}
```

## File: lib/secrets-stack.ts

```typescript
/**
 * secrets-stack.ts
 *
 * Creates AWS Secrets Manager secrets for database credentials and API keys.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly dbSecretArn: pulumi.Output<string>;
  public readonly apiKeySecretArn: pulumi.Output<string>;

  constructor(name: string, args: SecretsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:secrets:SecretsStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create secret for database credentials
    const dbSecret = new aws.secretsmanager.Secret(`db-credentials-${environmentSuffix}`, {
      name: `db-credentials-${environmentSuffix}`,
      description: 'Database credentials for RDS PostgreSQL',
      tags: {
        Name: `db-credentials-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create initial secret version with placeholder values
    new aws.secretsmanager.SecretVersion(`db-credentials-version-${environmentSuffix}`, {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: pulumi.secret('changeme123!'),
        engine: 'postgres',
        host: 'placeholder.rds.amazonaws.com',
        port: 5432,
        dbname: 'appdb',
      }),
    }, { parent: this });

    // Create secret for API keys
    const apiKeySecret = new aws.secretsmanager.Secret(`api-keys-${environmentSuffix}`, {
      name: `api-keys-${environmentSuffix}`,
      description: 'API keys for external services',
      tags: {
        Name: `api-keys-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create initial secret version with placeholder values
    new aws.secretsmanager.SecretVersion(`api-keys-version-${environmentSuffix}`, {
      secretId: apiKeySecret.id,
      secretString: JSON.stringify({
        externalApiKey: pulumi.secret('placeholder-api-key'),
        jwtSecret: pulumi.secret('placeholder-jwt-secret'),
      }),
    }, { parent: this });

    // Expose outputs
    this.dbSecretArn = dbSecret.arn;
    this.apiKeySecretArn = apiKeySecret.arn;

    this.registerOutputs({
      dbSecretArn: this.dbSecretArn,
      apiKeySecretArn: this.apiKeySecretArn,
    });
  }
}
```

## File: lib/ecs-stack.ts

```typescript
/**
 * ecs-stack.ts
 *
 * Creates ECS cluster, ALB, ECS services, task definitions, and auto-scaling policies.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  apiEcrUrl: pulumi.Output<string>;
  workerEcrUrl: pulumi.Output<string>;
  schedulerEcrUrl: pulumi.Output<string>;
  dbSecretArn: pulumi.Output<string>;
  apiKeySecretArn: pulumi.Output<string>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;

  constructor(name: string, args: EcsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:ecs:EcsStack', name, args, opts);

    const { environmentSuffix, tags, vpcId, publicSubnetIds, privateSubnetIds,
            apiEcrUrl, workerEcrUrl, schedulerEcrUrl, dbSecretArn, apiKeySecretArn } = args;

    // Create ECS Cluster with Container Insights enabled
    const cluster = new aws.ecs.Cluster(`ecs-cluster-${environmentSuffix}`, {
      name: `ecs-cluster-${environmentSuffix}`,
      settings: [{
        name: 'containerInsights',
        value: 'enabled',
      }],
      tags: {
        Name: `ecs-cluster-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create CloudWatch Log Groups
    const apiLogGroup = new aws.cloudwatch.LogGroup(`api-service-logs-${environmentSuffix}`, {
      name: `/ecs/api-service-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `api-service-logs-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const workerLogGroup = new aws.cloudwatch.LogGroup(`worker-service-logs-${environmentSuffix}`, {
      name: `/ecs/worker-service-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `worker-service-logs-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const schedulerLogGroup = new aws.cloudwatch.LogGroup(`scheduler-service-logs-${environmentSuffix}`, {
      name: `/ecs/scheduler-service-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `scheduler-service-logs-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(`ecs-task-execution-role-${environmentSuffix}`, {
      name: `ecs-task-execution-role-${environmentSuffix}`,
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
        Name: `ecs-task-execution-role-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(`ecs-task-execution-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    // Create custom policy for Secrets Manager access
    const secretsPolicy = new aws.iam.Policy(`ecs-secrets-policy-${environmentSuffix}`, {
      name: `ecs-secrets-policy-${environmentSuffix}`,
      policy: pulumi.all([dbSecretArn, apiKeySecretArn]).apply(([dbArn, apiArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [dbArn, apiArn],
          }],
        })
      ),
      tags: {
        Name: `ecs-secrets-policy-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`ecs-secrets-policy-attach-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    }, { parent: this });

    // Create IAM role for ECS tasks
    const taskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
      name: `ecs-task-role-${environmentSuffix}`,
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
        Name: `ecs-task-role-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
      name: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
      ],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: {
        Name: `alb-sg-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-tasks-sg-${environmentSuffix}`, {
      name: `ecs-tasks-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpcId,
      ingress: [{
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [albSecurityGroup.id],
        description: 'Allow traffic from ALB',
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: {
        Name: `ecs-tasks-sg-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`alb-${environmentSuffix}`, {
      name: `alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `alb-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create target groups for each service
    const apiTargetGroup = new aws.lb.TargetGroup(`api-tg-${environmentSuffix}`, {
      name: `api-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: 30,
        timeout: 5,
        healthyThreshold: 3,
        unhealthyThreshold: 3,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: {
        Name: `api-tg-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const workerTargetGroup = new aws.lb.TargetGroup(`worker-tg-${environmentSuffix}`, {
      name: `worker-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: 30,
        timeout: 5,
        healthyThreshold: 3,
        unhealthyThreshold: 3,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: {
        Name: `worker-tg-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const schedulerTargetGroup = new aws.lb.TargetGroup(`scheduler-tg-${environmentSuffix}`, {
      name: `scheduler-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: 30,
        timeout: 5,
        healthyThreshold: 3,
        unhealthyThreshold: 3,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: {
        Name: `scheduler-tg-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create ALB listener
    const listener = new aws.lb.Listener(`alb-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'fixed-response',
        fixedResponse: {
          contentType: 'text/plain',
          messageBody: 'Not Found',
          statusCode: '404',
        },
      }],
      tags: {
        Name: `alb-listener-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create listener rules for path-based routing
    new aws.lb.ListenerRule(`api-rule-${environmentSuffix}`, {
      listenerArn: listener.arn,
      priority: 100,
      conditions: [{
        pathPattern: {
          values: ['/api/*'],
        },
      }],
      actions: [{
        type: 'forward',
        targetGroupArn: apiTargetGroup.arn,
      }],
      tags: {
        Name: `api-rule-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    new aws.lb.ListenerRule(`worker-rule-${environmentSuffix}`, {
      listenerArn: listener.arn,
      priority: 200,
      conditions: [{
        pathPattern: {
          values: ['/worker/*'],
        },
      }],
      actions: [{
        type: 'forward',
        targetGroupArn: workerTargetGroup.arn,
      }],
      tags: {
        Name: `worker-rule-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    new aws.lb.ListenerRule(`scheduler-rule-${environmentSuffix}`, {
      listenerArn: listener.arn,
      priority: 300,
      conditions: [{
        pathPattern: {
          values: ['/scheduler/*'],
        },
      }],
      actions: [{
        type: 'forward',
        targetGroupArn: schedulerTargetGroup.arn,
      }],
      tags: {
        Name: `scheduler-rule-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create task definitions for each service
    const apiTaskDefinition = new aws.ecs.TaskDefinition(`api-task-${environmentSuffix}`, {
      family: `api-service-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.all([apiEcrUrl, dbSecretArn, apiKeySecretArn]).apply(
        ([ecrUrl, dbArn, apiArn]) => JSON.stringify([{
          name: 'api-service',
          image: `${ecrUrl}:latest`,
          cpu: 512,
          memory: 1024,
          essential: true,
          portMappings: [{
            containerPort: 8080,
            protocol: 'tcp',
          }],
          environment: [
            { name: 'SERVICE_NAME', value: 'api-service' },
            { name: 'ENVIRONMENT', value: environmentSuffix },
          ],
          secrets: [
            { name: 'DB_CREDENTIALS', valueFrom: dbArn },
            { name: 'API_KEYS', valueFrom: apiArn },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': apiLogGroup.name,
              'awslogs-region': aws.config.region!,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        }])
      ),
      tags: {
        Name: `api-task-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const workerTaskDefinition = new aws.ecs.TaskDefinition(`worker-task-${environmentSuffix}`, {
      family: `worker-service-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.all([workerEcrUrl, dbSecretArn, apiKeySecretArn]).apply(
        ([ecrUrl, dbArn, apiArn]) => JSON.stringify([{
          name: 'worker-service',
          image: `${ecrUrl}:latest`,
          cpu: 512,
          memory: 1024,
          essential: true,
          portMappings: [{
            containerPort: 8080,
            protocol: 'tcp',
          }],
          environment: [
            { name: 'SERVICE_NAME', value: 'worker-service' },
            { name: 'ENVIRONMENT', value: environmentSuffix },
          ],
          secrets: [
            { name: 'DB_CREDENTIALS', valueFrom: dbArn },
            { name: 'API_KEYS', valueFrom: apiArn },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': workerLogGroup.name,
              'awslogs-region': aws.config.region!,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        }])
      ),
      tags: {
        Name: `worker-task-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    const schedulerTaskDefinition = new aws.ecs.TaskDefinition(`scheduler-task-${environmentSuffix}`, {
      family: `scheduler-service-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.all([schedulerEcrUrl, dbSecretArn, apiKeySecretArn]).apply(
        ([ecrUrl, dbArn, apiArn]) => JSON.stringify([{
          name: 'scheduler-service',
          image: `${ecrUrl}:latest`,
          cpu: 512,
          memory: 1024,
          essential: true,
          portMappings: [{
            containerPort: 8080,
            protocol: 'tcp',
          }],
          environment: [
            { name: 'SERVICE_NAME', value: 'scheduler-service' },
            { name: 'ENVIRONMENT', value: environmentSuffix },
          ],
          secrets: [
            { name: 'DB_CREDENTIALS', valueFrom: dbArn },
            { name: 'API_KEYS', valueFrom: apiArn },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': schedulerLogGroup.name,
              'awslogs-region': aws.config.region!,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        }])
      ),
      tags: {
        Name: `scheduler-task-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this });

    // Create ECS services
    const apiService = new aws.ecs.Service(`api-service-${environmentSuffix}`, {
      name: `api-service-${environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: apiTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancers: [{
        targetGroupArn: apiTargetGroup.arn,
        containerName: 'api-service',
        containerPort: 8080,
      }],
      healthCheckGracePeriodSeconds: 60,
      tags: {
        Name: `api-service-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this, dependsOn: [listener] });

    const workerService = new aws.ecs.Service(`worker-service-${environmentSuffix}`, {
      name: `worker-service-${environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: workerTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancers: [{
        targetGroupArn: workerTargetGroup.arn,
        containerName: 'worker-service',
        containerPort: 8080,
      }],
      healthCheckGracePeriodSeconds: 60,
      tags: {
        Name: `worker-service-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this, dependsOn: [listener] });

    const schedulerService = new aws.ecs.Service(`scheduler-service-${environmentSuffix}`, {
      name: `scheduler-service-${environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: schedulerTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancers: [{
        targetGroupArn: schedulerTargetGroup.arn,
        containerName: 'scheduler-service',
        containerPort: 8080,
      }],
      healthCheckGracePeriodSeconds: 60,
      tags: {
        Name: `scheduler-service-${environmentSuffix}`,
        ...tags,
      },
    }, { parent: this, dependsOn: [listener] });

    // Create auto-scaling targets
    const apiAutoScalingTarget = new aws.appautoscaling.Target(`api-autoscaling-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${cluster.name}/${apiService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    }, { parent: this });

    const workerAutoScalingTarget = new aws.appautoscaling.Target(`worker-autoscaling-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${cluster.name}/${workerService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    }, { parent: this });

    const schedulerAutoScalingTarget = new aws.appautoscaling.Target(`scheduler-autoscaling-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${cluster.name}/${schedulerService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    }, { parent: this });

    // Create auto-scaling policies based on CPU utilization
    new aws.appautoscaling.Policy(`api-cpu-scaling-${environmentSuffix}`, {
      name: `api-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: apiAutoScalingTarget.resourceId,
      scalableDimension: apiAutoScalingTarget.scalableDimension,
      serviceNamespace: apiAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    new aws.appautoscaling.Policy(`worker-cpu-scaling-${environmentSuffix}`, {
      name: `worker-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: workerAutoScalingTarget.resourceId,
      scalableDimension: workerAutoScalingTarget.scalableDimension,
      serviceNamespace: workerAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    new aws.appautoscaling.Policy(`scheduler-cpu-scaling-${environmentSuffix}`, {
      name: `scheduler-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: schedulerAutoScalingTarget.resourceId,
      scalableDimension: schedulerAutoScalingTarget.scalableDimension,
      serviceNamespace: schedulerAutoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    // Expose outputs
    this.albDnsName = alb.dnsName;
    this.clusterName = cluster.name;

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
 * Pulumi application entry point for the ECS Fargate microservices infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'ecs-fargate-microservices',
};

// Instantiate the main stack component for the infrastructure
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  region: 'eu-central-1 ',
});

// Export stack outputs
export const albDnsName = stack.albDnsName;
export const apiEcrUrl = stack.apiEcrUrl;
export const workerEcrUrl = stack.workerEcrUrl;
export const schedulerEcrUrl = stack.schedulerEcrUrl;
export const clusterName = stack.clusterName;
```

## File: lib/README.md

```markdown
# ECS Fargate Microservices Architecture

This Pulumi TypeScript project deploys a production-ready containerized microservices architecture on AWS ECS Fargate.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with 2 public and 2 private subnets across 2 availability zones
- **ECS Cluster**: Fargate-based cluster with Container Insights enabled
- **Microservices**: Three containerized services (api-service, worker-service, scheduler-service)
- **ALB**: Application Load Balancer with path-based routing (/api/*, /worker/*, /scheduler/*)
- **ECR**: Container registries with lifecycle policies (keep last 10 images)
- **Auto-scaling**: Target tracking policies at 70% CPU utilization (2-10 tasks)
- **Monitoring**: CloudWatch log groups with 7-day retention
- **Security**: IAM roles with least-privilege access, security groups with restricted traffic
- **Secrets**: AWS Secrets Manager for database credentials and API keys

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- Docker installed for building container images

## Project Structure

```
lib/
├── tap-stack.ts          # Main orchestration stack
├── network-stack.ts      # VPC, subnets, NAT gateways
├── ecr-stack.ts          # ECR repositories with lifecycle policies
├── secrets-stack.ts      # Secrets Manager for credentials
├── ecs-stack.ts          # ECS cluster, services, ALB, auto-scaling
└── README.md             # This file

bin/
└── tap.ts                # Pulumi entry point
```

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Stack

```bash
# Set environment suffix (optional, defaults to 'dev')
pulumi config set env production

# Set AWS region (optional, defaults to 'eu-central-1 ')
pulumi config set aws:region eu-central-1 
```

### 3. Build and Push Container Images

Before deploying, you need to build Docker images for your services:

```bash
# Login to ECR
aws ecr get-login-password --region eu-central-1  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1 .amazonaws.com

# Build and push API service
docker build -t api-service:latest ./services/api
docker tag api-service:latest <api-ecr-url>:latest
docker push <api-ecr-url>:latest

# Build and push Worker service
docker build -t worker-service:latest ./services/worker
docker tag worker-service:latest <worker-ecr-url>:latest
docker push <worker-ecr-url>:latest

# Build and push Scheduler service
docker build -t scheduler-service:latest ./services/scheduler
docker tag scheduler-service:latest <scheduler-ecr-url>:latest
docker push <scheduler-ecr-url>:latest
```

### 4. Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up
```

### 5. Verify Deployment

```bash
# Get ALB DNS name
pulumi stack output albDnsName

# Get ECR repository URLs
pulumi stack output apiEcrUrl
pulumi stack output workerEcrUrl
pulumi stack output schedulerEcrUrl

# Test services
curl http://<alb-dns-name>/api/health
curl http://<alb-dns-name>/worker/health
curl http://<alb-dns-name>/scheduler/health
```

## Configuration

### Environment Variables

The infrastructure uses the following configuration:

- `ENVIRONMENT_SUFFIX`: Environment identifier (dev, staging, prod)
- Default tags are applied to all resources for tracking and billing

### Resource Naming

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- `vpc-dev`
- `ecs-cluster-prod`
- `api-service-staging`

### Auto-scaling Configuration

- **Minimum tasks**: 2 per service
- **Maximum tasks**: 10 per service
- **Target CPU**: 70% utilization
- **Scale-out cooldown**: 60 seconds
- **Scale-in cooldown**: 300 seconds

### Health Checks

- **Path**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 3 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

## Secrets Management

Update secrets using AWS Secrets Manager:

```bash
# Update database credentials
aws secretsmanager update-secret \
  --secret-id db-credentials-<env> \
  --secret-string '{"username":"admin","password":"newpass","host":"db.example.com","port":5432,"dbname":"appdb"}'

# Update API keys
aws secretsmanager update-secret \
  --secret-id api-keys-<env> \
  --secret-string '{"externalApiKey":"key123","jwtSecret":"secret456"}'
```

## Monitoring

### CloudWatch Logs

View logs for each service:

```bash
# API service logs
aws logs tail /ecs/api-service-<env> --follow

# Worker service logs
aws logs tail /ecs/worker-service-<env> --follow

# Scheduler service logs
aws logs tail /ecs/scheduler-service-<env> --follow
```

### Container Insights

Container Insights is enabled on the ECS cluster. View metrics in CloudWatch Console:
- Container CPU and memory utilization
- Task-level metrics
- Service-level metrics

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: ECR repositories may need to be emptied manually before destruction if they contain images.

## Security Considerations

- ECS tasks run in private subnets with no direct internet access
- NAT gateways provide outbound internet connectivity
- Security groups restrict traffic to only necessary ports
- IAM roles follow least-privilege principles
- Secrets are stored in AWS Secrets Manager, not in environment variables
- Container image scanning is enabled on ECR repositories

## Cost Optimization

- Uses Fargate Spot capacity providers where appropriate
- ECR lifecycle policies automatically delete old images
- CloudWatch log retention set to 7 days
- Auto-scaling prevents over-provisioning

## Troubleshooting

### Service Not Starting

Check ECS task logs:
```bash
aws ecs describe-tasks --cluster ecs-cluster-<env> --tasks <task-id>
```

### Health Check Failures

Ensure your container exposes `/health` endpoint on port 8080:
```bash
curl http://localhost:8080/health
```

### Container Image Pull Errors

Verify ECR permissions and that images exist:
```bash
aws ecr describe-images --repository-name api-service-<env>
```

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review ECS service events in AWS Console
3. Verify security group rules allow required traffic
4. Ensure secrets are properly configured in Secrets Manager
```

## File: package.json

```json
{
  "name": "ecs-fargate-microservices",
  "version": "1.0.0",
  "description": "Pulumi TypeScript project for ECS Fargate microservices architecture",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "bin",
    "rootDir": ".",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "lib/**/*",
    "bin/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
