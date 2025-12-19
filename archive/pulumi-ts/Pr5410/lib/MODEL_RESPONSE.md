# Payment Processing Platform Infrastructure - Pulumi TypeScript Implementation

This implementation provides a complete production-ready infrastructure for deploying a payment processing web application using AWS ECS Fargate, Application Load Balancer, RDS PostgreSQL, and supporting services.

## Architecture Overview

- VPC with public and private subnets across 2 availability zones
- Application Load Balancer for HTTPS traffic distribution
- ECS Fargate cluster running containerized application
- RDS PostgreSQL Multi-AZ for database persistence
- Auto-scaling based on CPU utilization
- CloudWatch logging and monitoring
- Route53 DNS management
- Secrets Manager integration for database credentials

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { EcsStack } from './ecs-stack';
import { LoadBalancerStack } from './load-balancer-stack';
import { DnsStack } from './dns-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  ecrImageUri?: string;
  domainName?: string;
  certificateArn?: string;
  dbSecretArn?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = pulumi.output(aws.getRegion()).name;

    const defaultTags = pulumi.output(args.tags).apply(t => ({
      ...t,
      Environment: 'production',
      ManagedBy: 'pulumi',
    }));

    // 1. Create VPC and network infrastructure
    const networkStack = new NetworkStack('payment-network', {
      environmentSuffix,
      tags: defaultTags,
    }, { parent: this });

    // 2. Create security groups
    const securityStack = new SecurityStack('payment-security', {
      environmentSuffix,
      vpcId: networkStack.vpcId,
      tags: defaultTags,
    }, { parent: this });

    // 3. Create CloudWatch logging
    const monitoringStack = new MonitoringStack('payment-monitoring', {
      environmentSuffix,
      tags: defaultTags,
    }, { parent: this });

    // 4. Create RDS database
    const databaseStack = new DatabaseStack('payment-database', {
      environmentSuffix,
      subnetIds: networkStack.privateSubnetIds,
      securityGroupId: securityStack.dbSecurityGroupId,
      dbSecretArn: args.dbSecretArn,
      tags: defaultTags,
    }, { parent: this });

    // 5. Create Application Load Balancer
    const loadBalancerStack = new LoadBalancerStack('payment-alb', {
      environmentSuffix,
      vpcId: networkStack.vpcId,
      subnetIds: networkStack.publicSubnetIds,
      securityGroupId: securityStack.albSecurityGroupId,
      certificateArn: args.certificateArn,
      tags: defaultTags,
    }, { parent: this });

    // 6. Create ECS cluster and service
    const ecsStack = new EcsStack('payment-ecs', {
      environmentSuffix,
      vpcId: networkStack.vpcId,
      subnetIds: networkStack.privateSubnetIds,
      securityGroupId: securityStack.ecsSecurityGroupId,
      targetGroupArn: loadBalancerStack.targetGroupArn,
      ecrImageUri: args.ecrImageUri || 'nginx:latest',
      dbSecretArn: args.dbSecretArn,
      dbEndpoint: databaseStack.dbEndpoint,
      logGroupName: monitoringStack.ecsLogGroupName,
      tags: defaultTags,
    }, { parent: this });

    // 7. Create Route53 DNS (optional)
    if (args.domainName) {
      new DnsStack('payment-dns', {
        environmentSuffix,
        domainName: args.domainName,
        albDnsName: loadBalancerStack.albDnsName,
        albZoneId: loadBalancerStack.albZoneId,
        tags: defaultTags,
      }, { parent: this });
    }

    // Export key outputs
    this.albDnsName = loadBalancerStack.albDnsName;
    this.dbEndpoint = databaseStack.dbEndpoint;
    this.ecsClusterName = ecsStack.clusterName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      dbEndpoint: this.dbEndpoint,
      ecsClusterName: this.ecsClusterName,
      region: region,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly availabilityZones: pulumi.Output<string[]>;

  constructor(name: string, args: NetworkStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:network:NetworkStack', name, args, opts);

    const vpcCidr = args.vpcCidr || '10.0.0.0/16';

    // Get availability zones
    const availableAzs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(`payment-vpc-${args.environmentSuffix}`, {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-vpc-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`payment-igw-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-igw-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < 2; i++) {
      const az = pulumi.output(availableAzs).then(azs => azs.names[i]);

      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(`payment-public-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-subnet-${i}-${args.environmentSuffix}`,
          Type: 'public',
        })),
      }, { parent: this });
      publicSubnets.push(publicSubnet);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(`payment-nat-eip-${i}-${args.environmentSuffix}`, {
        domain: 'vpc',
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-eip-${i}-${args.environmentSuffix}`,
        })),
      }, { parent: this });

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(`payment-nat-${i}-${args.environmentSuffix}`, {
        subnetId: publicSubnet.id,
        allocationId: eip.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-${i}-${args.environmentSuffix}`,
        })),
      }, { parent: this, dependsOn: [igw] });
      natGateways.push(natGateway);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(`payment-private-subnet-${i}-${args.environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${10 + i}.0/24`,
        availabilityZone: az,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-subnet-${i}-${args.environmentSuffix}`,
          Type: 'private',
        })),
      }, { parent: this });
      privateSubnets.push(privateSubnet);
    }

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(`payment-public-rt-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-public-rt-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.ec2.Route(`payment-public-route-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`payment-public-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Private route tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`payment-private-rt-${i}-${args.environmentSuffix}`, {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-rt-${i}-${args.environmentSuffix}`,
        })),
      }, { parent: this });

      new aws.ec2.Route(`payment-private-route-${i}-${args.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`payment-private-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.availabilityZones = pulumi.output(availableAzs).then(azs => azs.names.slice(0, 2));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      availabilityZones: this.availabilityZones,
    });
  }
}
```

## File: lib/security-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ecsSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: SecurityStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:security:SecurityStack', name, args, opts);

    // ALB Security Group
    const albSg = new aws.ec2.SecurityGroup(`payment-alb-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from internet',
        },
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
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-alb-sg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // ECS Security Group
    const ecsSg = new aws.ec2.SecurityGroup(`payment-ecs-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: 'Security group for ECS tasks',
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecs-sg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Allow ALB to communicate with ECS on port 3000
    new aws.ec2.SecurityGroupRule(`payment-ecs-ingress-from-alb-${args.environmentSuffix}`, {
      type: 'ingress',
      securityGroupId: ecsSg.id,
      sourceSecurityGroupId: albSg.id,
      protocol: 'tcp',
      fromPort: 3000,
      toPort: 3000,
      description: 'Allow traffic from ALB',
    }, { parent: this });

    // Database Security Group
    const dbSg = new aws.ec2.SecurityGroup(`payment-db-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: 'Security group for RDS PostgreSQL',
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-sg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Allow ECS to communicate with RDS on PostgreSQL port
    new aws.ec2.SecurityGroupRule(`payment-db-ingress-from-ecs-${args.environmentSuffix}`, {
      type: 'ingress',
      securityGroupId: dbSg.id,
      sourceSecurityGroupId: ecsSg.id,
      protocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      description: 'Allow PostgreSQL traffic from ECS',
    }, { parent: this });

    this.albSecurityGroupId = albSg.id;
    this.ecsSecurityGroupId = ecsSg.id;
    this.dbSecurityGroupId = dbSg.id;

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroupId,
      ecsSecurityGroupId: this.ecsSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
    });
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  dbSecretArn?: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbInstanceId: pulumi.Output<string>;

  constructor(name: string, args: DatabaseStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:database:DatabaseStack', name, args, opts);

    // Create KMS key for RDS encryption
    const kmsKey = new aws.kms.Key(`payment-db-kms-${args.environmentSuffix}`, {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-kms-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.kms.Alias(`payment-db-kms-alias-${args.environmentSuffix}`, {
      name: `alias/payment-db-${args.environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`payment-db-subnet-group-${args.environmentSuffix}`, {
      subnetIds: args.subnetIds,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-subnet-group-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Fetch database credentials from Secrets Manager
    let dbUsername = 'postgres';
    let dbPassword = pulumi.output(pulumi.secret('temporarypassword123'));

    if (args.dbSecretArn) {
      const dbSecret = pulumi.output(aws.secretsmanager.getSecretVersion({
        secretId: args.dbSecretArn,
      }));

      const secretString = dbSecret.apply(s => JSON.parse(s.secretString));
      dbUsername = secretString.apply(s => s.username || 'postgres');
      dbPassword = pulumi.secret(secretString.apply(s => s.password));
    }

    // Create RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(`payment-db-${args.environmentSuffix}`, {
      identifier: `payment-db-${args.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.7',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,

      dbName: 'paymentdb',
      username: dbUsername,
      password: dbPassword,

      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [args.securityGroupId],

      multiAz: true,
      publiclyAccessible: false,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'mon:04:00-mon:05:00',

      skipFinalSnapshot: true,
      deletionProtection: false, // Must be destroyable for testing

      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],

      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    this.dbEndpoint = dbInstance.endpoint;
    this.dbInstanceId = dbInstance.id;

    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbInstanceId: this.dbInstanceId,
    });
  }
}
```

## File: lib/load-balancer-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LoadBalancerStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  certificateArn?: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albZoneId: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  constructor(name: string, args: LoadBalancerStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`payment-alb-${args.environmentSuffix}`, {
      loadBalancerType: 'application',
      subnets: args.subnetIds,
      securityGroups: [args.securityGroupId],
      enableDeletionProtection: false, // Must be destroyable
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-alb-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(`payment-tg-${args.environmentSuffix}`, {
      port: 3000,
      protocol: 'HTTP',
      vpcId: args.vpcId,
      targetType: 'ip',

      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },

      deregistrationDelay: 30,

      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-tg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create HTTP listener (redirect to HTTPS if cert available)
    const httpListener = new aws.lb.Listener(`payment-http-listener-${args.environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: args.certificateArn ? [
        {
          type: 'redirect',
          redirect: {
            port: '443',
            protocol: 'HTTPS',
            statusCode: 'HTTP_301',
          },
        },
      ] : [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    }, { parent: this });

    // Create HTTPS listener if certificate is provided
    if (args.certificateArn) {
      new aws.lb.Listener(`payment-https-listener-${args.environmentSuffix}`, {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: args.certificateArn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      }, { parent: this });
    }

    this.albArn = alb.arn;
    this.albDnsName = alb.dnsName;
    this.albZoneId = alb.zoneId;
    this.targetGroupArn = targetGroup.arn;

    this.registerOutputs({
      albArn: this.albArn,
      albDnsName: this.albDnsName,
      albZoneId: this.albZoneId,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
```

## File: lib/ecs-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EcsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  ecrImageUri: string;
  dbSecretArn?: string;
  dbEndpoint: pulumi.Output<string>;
  logGroupName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(name: string, args: EcsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:ecs:EcsStack', name, args, opts);

    const region = pulumi.output(aws.getRegion()).name;
    const accountId = pulumi.output(aws.getCallerIdentity()).accountId;

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(`payment-cluster-${args.environmentSuffix}`, {
      name: `payment-cluster-${args.environmentSuffix}`,
      settings: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-cluster-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(`payment-task-exec-role-${args.environmentSuffix}`, {
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
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-exec-role-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(`payment-task-exec-policy-${args.environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    // Add policy for Secrets Manager access
    if (args.dbSecretArn) {
      new aws.iam.RolePolicy(`payment-task-exec-secrets-policy-${args.environmentSuffix}`, {
        role: taskExecutionRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:GetSecretValue"
              ],
              "Resource": "${args.dbSecretArn}"
            }
          ]
        }`,
      }, { parent: this });
    }

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(`payment-task-role-${args.environmentSuffix}`, {
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
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-role-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create task definition
    const taskDefinition = new aws.ecs.TaskDefinition(`payment-task-${args.environmentSuffix}`, {
      family: `payment-task-${args.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,

      containerDefinitions: pulumi.all([args.logGroupName, args.dbEndpoint, region]).apply(
        ([logGroup, dbEndpoint, reg]) => JSON.stringify([
          {
            name: 'payment-app',
            image: args.ecrImageUri,
            essential: true,
            portMappings: [
              {
                containerPort: 3000,
                protocol: 'tcp',
              },
            ],
            environment: [
              {
                name: 'DB_ENDPOINT',
                value: dbEndpoint,
              },
              {
                name: 'PORT',
                value: '3000',
              },
              {
                name: 'NODE_ENV',
                value: 'production',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroup,
                'awslogs-region': reg,
                'awslogs-stream-prefix': 'ecs',
              },
            },
            healthCheck: {
              command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
          },
        ])
      ),

      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create ECS Service
    const service = new aws.ecs.Service(`payment-service-${args.environmentSuffix}`, {
      name: `payment-service-${args.environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: taskDefinition.arn,
      desiredCount: 3,
      launchType: 'FARGATE',

      networkConfiguration: {
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId],
        assignPublicIp: false,
      },

      loadBalancers: [
        {
          targetGroupArn: args.targetGroupArn,
          containerName: 'payment-app',
          containerPort: 3000,
        },
      ],

      healthCheckGracePeriodSeconds: 60,

      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-service-${args.environmentSuffix}`,
      })),
    }, { parent: this, dependsOn: [taskDefinition] });

    // Create Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(`payment-scaling-target-${args.environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 3,
      resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    }, { parent: this });

    // Create Auto Scaling Policy based on CPU
    new aws.appautoscaling.Policy(`payment-scaling-policy-${args.environmentSuffix}`, {
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,

      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    this.clusterName = cluster.name;
    this.serviceName = service.name;

    this.registerOutputs({
      clusterName: this.clusterName,
      serviceName: this.serviceName,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly ecsLogGroupName: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    // Create KMS key for CloudWatch Logs encryption
    const kmsKey = new aws.kms.Key(`payment-logs-kms-${args.environmentSuffix}`, {
      description: 'KMS key for CloudWatch Logs encryption',
      enableKeyRotation: true,
      policy: pulumi.output(aws.getCallerIdentity()).accountId.apply(accountId => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${aws.getRegion().then(r => r.name)}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${aws.getRegion().then(r => r.name)}:${accountId}:*`,
              },
            },
          },
        ],
      })),
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-logs-kms-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.kms.Alias(`payment-logs-kms-alias-${args.environmentSuffix}`, {
      name: `alias/payment-logs-${args.environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // Create CloudWatch Log Group for ECS
    const ecsLogGroup = new aws.cloudwatch.LogGroup(`payment-ecs-logs-${args.environmentSuffix}`, {
      name: `/aws/ecs/payment-${args.environmentSuffix}`,
      retentionInDays: 7,
      kmsKeyId: kmsKey.arn,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecs-logs-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    this.ecsLogGroupName = ecsLogGroup.name;

    this.registerOutputs({
      ecsLogGroupName: this.ecsLogGroupName,
    });
  }
}
```

## File: lib/dns-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DnsStackArgs {
  environmentSuffix: string;
  domainName: string;
  albDnsName: pulumi.Output<string>;
  albZoneId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DnsStack extends pulumi.ComponentResource {
  public readonly hostedZoneId: pulumi.Output<string>;
  public readonly recordName: pulumi.Output<string>;

  constructor(name: string, args: DnsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:dns:DnsStack', name, args, opts);

    // Create Route53 hosted zone
    const hostedZone = new aws.route53.Zone(`payment-zone-${args.environmentSuffix}`, {
      name: args.domainName,
      comment: `Hosted zone for payment processing platform - ${args.environmentSuffix}`,
      tags: pulumi.all([args.tags]).apply(([t]) => ({
        ...t,
        Name: `payment-zone-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create A record pointing to ALB
    const record = new aws.route53.Record(`payment-record-${args.environmentSuffix}`, {
      zoneId: hostedZone.zoneId,
      name: args.domainName,
      type: 'A',
      aliases: [
        {
          name: args.albDnsName,
          zoneId: args.albZoneId,
          evaluateTargetHealth: true,
        },
      ],
    }, { parent: this });

    this.hostedZoneId = hostedZone.zoneId;
    this.recordName = record.name;

    this.registerOutputs({
      hostedZoneId: this.hostedZoneId,
      recordName: this.recordName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Optional configurations
const ecrImageUri = config.get('ecrImageUri') || 'nginx:latest';
const domainName = config.get('domainName');
const certificateArn = config.get('certificateArn');
const dbSecretArn = config.get('dbSecretArn');

const defaultTags = {
  Environment: 'production',
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'pulumi',
};

const stack = new TapStack('payment-platform', {
  environmentSuffix,
  tags: defaultTags,
  ecrImageUri,
  domainName,
  certificateArn,
  dbSecretArn,
});

// Export outputs
export const albDnsName = stack.albDnsName;
export const dbEndpoint = stack.dbEndpoint;
export const ecsClusterName = stack.ecsClusterName;
```

## File: test/payment-platform.test.ts

```typescript
import * as pulumi from '@pulumi/pulumi';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-northeast-2a', 'ap-northeast-2b', 'ap-northeast-2c'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-northeast-2',
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
      };
    }
    return args.inputs;
  },
});

describe('Payment Platform Infrastructure', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    stack = require('../lib/tap-stack');
  });

  describe('TapStack', () => {
    it('should create TapStack with default environment suffix', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      const albDnsName = await tapStack.albDnsName;
      const dbEndpoint = await tapStack.dbEndpoint;
      const ecsClusterName = await tapStack.ecsClusterName;

      expect(albDnsName).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(ecsClusterName).toBeDefined();
    });

    it('should use provided environmentSuffix in resource naming', async () => {
      const envSuffix = 'prod';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: envSuffix,
        tags: { Environment: 'production' },
      });

      const clusterName = await tapStack.ecsClusterName;
      expect(clusterName).toContain(envSuffix);
    });
  });
});
```

## Configuration and Deployment

### Pulumi.yaml

The project root should already contain Pulumi.yaml configuration. Ensure it specifies TypeScript runtime.

### Required Pulumi Configuration

Set these configuration values before deployment:

```bash
pulumi config set aws:region ap-northeast-2
pulumi config set ecrImageUri <your-ecr-repository-uri>:<tag>
pulumi config set dbSecretArn <your-secrets-manager-secret-arn>
pulumi config set certificateArn <your-acm-certificate-arn> # Optional
pulumi config set domainName <your-domain-name> # Optional
```

### Deployment Commands

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output

# Destroy infrastructure
pulumi destroy
```

## Architecture Notes

This implementation follows AWS best practices:

1. **High Availability**: Multi-AZ deployment for RDS and ECS tasks distributed across 2 AZs
2. **Security**: Private subnets for compute and database, security groups with least privilege
3. **Encryption**: KMS encryption for RDS and CloudWatch Logs, TLS for data in transit
4. **Scalability**: Auto-scaling for ECS tasks based on CPU utilization (3-10 tasks)
5. **Monitoring**: CloudWatch Logs with 7-day retention, Container Insights enabled
6. **Cost Optimization**: db.t3.micro for RDS, Fargate for ECS (pay-per-use)

All resources include the environmentSuffix for multi-environment support and are fully destroyable for testing purposes.
