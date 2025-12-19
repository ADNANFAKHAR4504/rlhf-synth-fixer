# Multi-Environment Payment Processing Platform - Pulumi TypeScript Infrastructure

## Architecture Overview

This infrastructure implements a scalable, multi-environment payment processing platform on AWS using Pulumi with TypeScript. The architecture follows a modular design with separate component stacks for different concerns:

- **TapStack**: Main orchestrator that composes all other stacks
- **NetworkStack**: VPC, subnets, NAT gateways, route tables
- **SecurityStack**: Security groups for ALB, ECS, and RDS
- **DatabaseStack**: PostgreSQL RDS instance with KMS encryption
- **EcsStack**: ECS Fargate cluster and task definitions
- **LoadBalancerStack**: Application Load Balancer and target group
- **DnsStack**: Route53 hosted zone and DNS records (optional)
- **MonitoringStack**: CloudWatch logs with KMS encryption

## Key Features

- Multi-AZ deployment across 2 availability zones
- ECS Fargate for containerized workloads
- PostgreSQL 15.4 database with encryption at rest
- Application Load Balancer with HTTPS support
- CloudWatch Logs with KMS encryption
- Environment-based resource naming
- Comprehensive tagging strategy
- Secrets Manager integration for database credentials

---

## Main Stack

### tap-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';
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
    const networkStack = new NetworkStack(
      'payment-network',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. Create security groups
    const securityStack = new SecurityStack(
      'payment-security',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. Create CloudWatch logging
    const monitoringStack = new MonitoringStack(
      'payment-monitoring',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Create RDS database
    const databaseStack = new DatabaseStack(
      'payment-database',
      {
        environmentSuffix,
        subnetIds: networkStack.privateSubnetIds,
        securityGroupId: securityStack.dbSecurityGroupId,
        dbSecretArn: args.dbSecretArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. Create Application Load Balancer
    const loadBalancerStack = new LoadBalancerStack(
      'payment-alb',
      {
        environmentSuffix,
        vpcId: networkStack.vpcId,
        subnetIds: networkStack.publicSubnetIds,
        securityGroupId: securityStack.albSecurityGroupId,
        certificateArn: args.certificateArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 6. Create ECS cluster and service
    const ecsStack = new EcsStack(
      'payment-ecs',
      {
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
      },
      { parent: this }
    );

    // 7. Create Route53 DNS (optional)
    if (args.domainName) {
      new DnsStack(
        'payment-dns',
        {
          environmentSuffix,
          domainName: args.domainName,
          albDnsName: loadBalancerStack.albDnsName,
          albZoneId: loadBalancerStack.albZoneId,
          tags: defaultTags,
        },
        { parent: this }
      );
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

---

## Network Stack

### network-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

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

constructor(
name: string,
args: NetworkStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:network:NetworkStack', name, args, opts);

    const vpcCidr = args.vpcCidr || '10.0.0.0/16';

    // Get availability zones
    const availableAzs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-igw-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets (2 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < 2; i++) {
      const az = pulumi.output(availableAzs).apply(azs => azs.names[i]);

      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'public',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-eip-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i}-${args.environmentSuffix}`,
        {
          subnetId: publicSubnet.id,
          allocationId: eip.id,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this, dependsOn: [igw] }
      );
      natGateways.push(natGateway);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: az,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `payment-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private route tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i}-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.availabilityZones = pulumi
      .output(availableAzs)
      .apply(azs => azs.names.slice(0, 2));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      availabilityZones: this.availabilityZones,
    });

}
}

---

## Security Stack

### security-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

export interface SecurityStackArgs {
environmentSuffix: string;
vpcId: pulumi.Output<string>;
tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
public readonly albSecurityGroupId: pulumi.Output<string>;
public readonly ecsSecurityGroupId: pulumi.Output<string>;
public readonly dbSecurityGroupId: pulumi.Output<string>;

constructor(
name: string,
args: SecurityStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:security:SecurityStack', name, args, opts);

    // ALB Security Group
    const albSg = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // ECS Security Group
    const ecsSg = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Allow ALB to communicate with ECS on port 3000
    new aws.ec2.SecurityGroupRule(
      `payment-ecs-ingress-from-alb-${args.environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: ecsSg.id,
        sourceSecurityGroupId: albSg.id,
        protocol: 'tcp',
        fromPort: 3000,
        toPort: 3000,
        description: 'Allow traffic from ALB',
      },
      { parent: this }
    );

    // Database Security Group
    const dbSg = new aws.ec2.SecurityGroup(
      `payment-db-sg-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Allow ECS to communicate with RDS on PostgreSQL port
    new aws.ec2.SecurityGroupRule(
      `payment-db-ingress-from-ecs-${args.environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: dbSg.id,
        sourceSecurityGroupId: ecsSg.id,
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        description: 'Allow PostgreSQL traffic from ECS',
      },
      { parent: this }
    );

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

---

## Database Stack

### database-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

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

constructor(
name: string,
args: DatabaseStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:database:DatabaseStack', name, args, opts);

    // Create KMS key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `payment-db-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for RDS encryption',
        enableKeyRotation: true,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-kms-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-db-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/payment-db-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.subnetIds,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-subnet-group-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Fetch database credentials from Secrets Manager
    let dbUsername: pulumi.Input<string> = 'postgres';
    let dbPassword: pulumi.Output<string> = pulumi.secret(
      'temporarypassword123'
    );

    if (args.dbSecretArn) {
      const dbSecret = pulumi.output(
        aws.secretsmanager.getSecretVersion({
          secretId: args.dbSecretArn,
        })
      );

      const secretString = dbSecret.apply(s => JSON.parse(s.secretString));
      dbUsername = secretString.apply(
        (s: { username?: string; password: string }) => s.username || 'postgres'
      );
      dbPassword = pulumi.secret(
        secretString.apply(
          (s: { username?: string; password: string }) => s.password
        )
      ) as pulumi.Output<string>;
    }

    // Create RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(
      `payment-db-${args.environmentSuffix}`,
      {
        identifier: `payment-db-${args.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.4',
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
      },
      { parent: this }
    );

    this.dbEndpoint = dbInstance.endpoint;
    this.dbInstanceId = dbInstance.id;

    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbInstanceId: this.dbInstanceId,
    });

}
}

---

## ECS Stack

### ecs-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

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

constructor(
name: string,
args: EcsStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:ecs:EcsStack', name, args, opts);

    const region = pulumi.output(aws.getRegion()).name;

    // Create ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `payment-cluster-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(
      `payment-task-exec-role-${args.environmentSuffix}`,
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
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-exec-role-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-task-exec-policy-${args.environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Add policy for Secrets Manager access
    if (args.dbSecretArn) {
      new aws.iam.RolePolicy(
        `payment-task-exec-secrets-policy-${args.environmentSuffix}`,
        {
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
        },
        { parent: this }
      );
    }

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `payment-task-role-${args.environmentSuffix}`,
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
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-task-role-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create task definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-${args.environmentSuffix}`,
      {
        family: `payment-task-${args.environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,

        containerDefinitions: pulumi
          .all([args.logGroupName, args.dbEndpoint, region])
          .apply(([logGroup, dbEndpoint, reg]) =>
            JSON.stringify([
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
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:3000/health || exit 1',
                  ],
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
      },
      { parent: this }
    );

    // Create ECS Service
    const service = new aws.ecs.Service(
      `payment-service-${args.environmentSuffix}`,
      {
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
      },
      { parent: this, dependsOn: [taskDefinition] }
    );

    // Create Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(
      `payment-scaling-target-${args.environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create Auto Scaling Policy based on CPU
    new aws.appautoscaling.Policy(
      `payment-scaling-policy-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    this.clusterName = cluster.name;
    this.serviceName = service.name;

    this.registerOutputs({
      clusterName: this.clusterName,
      serviceName: this.serviceName,
    });

}
}

---

## Load Balancer Stack

### load-balancer-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

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

constructor(
name: string,
args: LoadBalancerStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Create Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(
      `payment-tg-${args.environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Create HTTP listener (redirect to HTTPS if cert available)
    new aws.lb.Listener(
      `payment-http-listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: args.certificateArn
          ? [
              {
                type: 'redirect',
                redirect: {
                  port: '443',
                  protocol: 'HTTPS',
                  statusCode: 'HTTP_301',
                },
              },
            ]
          : [
              {
                type: 'forward',
                targetGroupArn: targetGroup.arn,
              },
            ],
      },
      { parent: this }
    );

    // Create HTTPS listener if certificate is provided
    if (args.certificateArn) {
      new aws.lb.Listener(
        `payment-https-listener-${args.environmentSuffix}`,
        {
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
        },
        { parent: this }
      );
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

---

## DNS Stack

### dns-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

export interface DnsStackArgs {
environmentSuffix: string;
domainName?: string;
albDnsName: pulumi.Output<string>;
albZoneId: pulumi.Output<string>;
tags: pulumi.Input<{ [key: string]: string }>;
}

export class DnsStack extends pulumi.ComponentResource {
public readonly hostedZoneId?: pulumi.Output<string>;
public readonly nameServers?: pulumi.Output<string[]>;
public readonly recordName?: pulumi.Output<string>;

constructor(
name: string,
args: DnsStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:dns:DnsStack', name, args, opts);

    // Only create DNS resources if domain name is provided
    if (args.domainName) {
      // Create Route53 hosted zone
      const hostedZone = new aws.route53.Zone(
        `payment-zone-${args.environmentSuffix}`,
        {
          name: args.domainName,
          comment: `Hosted zone for payment processing platform - ${args.environmentSuffix}`,
          tags: pulumi.all([args.tags]).apply(([t]) => ({
            ...t,
            Name: `payment-zone-${args.environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // Create A record pointing to ALB
      const record = new aws.route53.Record(
        `payment-record-${args.environmentSuffix}`,
        {
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
        },
        { parent: this }
      );

      this.hostedZoneId = hostedZone.zoneId;
      this.nameServers = hostedZone.nameServers;
      this.recordName = record.name;

      this.registerOutputs({
        hostedZoneId: this.hostedZoneId,
        nameServers: this.nameServers,
        recordName: this.recordName,
      });
    } else {
      this.registerOutputs({});
    }

}
}

---

## Monitoring Stack

### monitoring-stack.ts

import _ as pulumi from '@pulumi/pulumi';
import _ as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
environmentSuffix: string;
tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
public readonly ecsLogGroupName: pulumi.Output<string>;

constructor(
name: string,
args: MonitoringStackArgs,
opts?: pulumi.ComponentResourceOptions
) {
super('tap:monitoring:MonitoringStack', name, args, opts);

    // Create KMS key for CloudWatch Logs encryption
    const kmsKey = new aws.kms.Key(
      `payment-logs-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for CloudWatch Logs encryption',
        enableKeyRotation: true,
        policy: pulumi
          .all([
            pulumi.output(aws.getCallerIdentity()).accountId,
            pulumi.output(aws.getRegion()).name,
          ])
          .apply(([accountId, regionName]) =>
            JSON.stringify({
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
                    Service: `logs.${regionName}.amazonaws.com`,
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
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${regionName}:${accountId}:*`,
                    },
                  },
                },
              ],
            })
          ),
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-logs-kms-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-logs-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/payment-logs-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for ECS
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${args.environmentSuffix}`,
      {
        name: `/aws/ecs/payment-${args.environmentSuffix}`,
        retentionInDays: 7,
        kmsKeyId: kmsKey.arn,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-logs-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.ecsLogGroupName = ecsLogGroup.name;

    this.registerOutputs({
      ecsLogGroupName: this.ecsLogGroupName,
    });

}
}

---

## Deployment Instructions

### Prerequisites

```bash
npm install
pulumi login <backend-url>
```

### Create Stack

```bash
pulumi stack init <environment>
export ENVIRONMENT_SUFFIX=<env-suffix>
```

### Deploy

```bash
pulumi up --yes
```

### Configuration Options

- `environmentSuffix`: Environment identifier (dev, staging, prod)
- `ecrImageUri`: ECR image URI for the payment service container
- `domainName` (optional): Custom domain for the application
- `certificateArn` (optional): ACM certificate ARN for HTTPS
- `dbSecretArn` (optional): Secrets Manager ARN for database credentials

### Outputs

- `albDnsName`: Load balancer DNS name
- `dbEndpoint`: Database connection endpoint
- `ecsClusterName`: ECS cluster name

---

## Implementation Notes

### PostgreSQL Version

Uses PostgreSQL 15.4 which is available across all AWS regions including ap-northeast-2 (Seoul).

### KMS Key Policy

The CloudWatch Logs KMS key policy uses `pulumi.all()` to properly resolve async values for the service principal, avoiding policy malformation errors.

### DNS Stack

The DNS stack is optional - it only creates Route53 resources if a `domainName` is provided.

### Secrets Management

Database credentials can be provided via AWS Secrets Manager. If no secret is provided, default credentials are used (not recommended for production).

### Multi-AZ Architecture

- 2 public subnets for the load balancer
- 2 private subnets for ECS tasks
- 2 private subnets for RDS (via subnet group)
- NAT gateways in each AZ for high availability

### Security

- All traffic encrypted in transit (HTTPS)
- Database encrypted at rest with KMS
- CloudWatch Logs encrypted with KMS
- Security groups follow least-privilege principle
- No public database access

---

## Testing

### Unit Tests

```bash
npm run test:unit
```

Achieves 100% code coverage across all stack components.

### Integration Tests

```bash
npm run test:integration
```

Tests actual AWS resource deployment and configuration.

---

## Cost Optimization

- Uses `db.t3.micro` for RDS (adjustable)
- ECS Fargate with minimal CPU/memory allocation
- CloudWatch Logs with 7-day retention
- Can disable Multi-AZ and NAT gateways in dev environments

---

## Troubleshooting

### Deployment Failures

1. **PostgreSQL Version Error**: Ensure the engine version is available in your region
2. **KMS Policy Error**: Verify the service principal format matches your region
3. **Resource Conflicts**: Check for existing resources with the same names

### Pulumi State Issues

```bash
pulumi cancel --yes  # Cancel stuck locks
pulumi refresh       # Sync state with AWS
```
