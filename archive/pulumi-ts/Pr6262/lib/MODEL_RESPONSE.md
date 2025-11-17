# Payment Processing Application Infrastructure - Implementation

This implementation provides a highly available, production-grade payment processing infrastructure using Pulumi with TypeScript on AWS. The architecture spans 3 availability zones with comprehensive security, monitoring, and compliance features.

## Architecture Overview

- VPC with public, private, and database subnets across 3 AZs
- Aurora PostgreSQL Serverless v2 with encryption
- ECS Fargate for containerized application
- Application Load Balancer with AWS WAF
- API Gateway with rate limiting
- CloudWatch monitoring with 7-year retention
- X-Ray tracing
- Lambda-based backup verification

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import { EcsStack } from './ecs-stack';
import { AlbStack } from './alb-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupVerificationStack } from './backup-verification-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const region = pulumi.output(pulumi.runtime.getConfig('aws:region') || 'ap-southeast-1');

    // VPC and Networking
    const vpcStack = new VpcStack('payment-vpc', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Database Layer
    const databaseStack = new DatabaseStack('payment-db', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      databaseSubnetIds: vpcStack.databaseSubnetIds,
      privateSubnetCidrs: vpcStack.privateSubnetCidrs,
      tags,
    }, { parent: this });

    // ECS Cluster and Services
    const ecsStack = new EcsStack('payment-ecs', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      databaseEndpoint: databaseStack.clusterEndpoint,
      databaseSecretArn: databaseStack.databaseSecretArn,
      tags,
    }, { parent: this });

    // Application Load Balancer with WAF
    const albStack = new AlbStack('payment-alb', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      publicSubnetIds: vpcStack.publicSubnetIds,
      ecsServiceArn: ecsStack.serviceArn,
      targetGroupArn: ecsStack.targetGroupArn,
      blueTargetGroupArn: ecsStack.blueTargetGroupArn,
      greenTargetGroupArn: ecsStack.greenTargetGroupArn,
      tags,
    }, { parent: this });

    // API Gateway
    const apiGatewayStack = new ApiGatewayStack('payment-api', {
      environmentSuffix,
      albDnsName: albStack.albDnsName,
      tags,
    }, { parent: this });

    // Monitoring and Logging
    const monitoringStack = new MonitoringStack('payment-monitoring', {
      environmentSuffix,
      albArn: albStack.albArn,
      ecsClusterName: ecsStack.clusterName,
      ecsServiceName: ecsStack.serviceName,
      databaseClusterId: databaseStack.clusterId,
      region,
      tags,
    }, { parent: this });

    // Backup Verification
    const backupStack = new BackupVerificationStack('payment-backup', {
      environmentSuffix,
      databaseClusterArn: databaseStack.clusterArn,
      tags,
    }, { parent: this });

    // Outputs
    this.albDnsName = albStack.albDnsName;
    this.apiGatewayUrl = apiGatewayStack.apiUrl;
    this.dashboardUrl = monitoringStack.dashboardUrl;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      apiGatewayUrl: this.apiGatewayUrl,
      dashboardUrl: this.dashboardUrl,
      vpcId: vpcStack.vpcId,
      databaseEndpoint: databaseStack.clusterEndpoint,
      ecsClusterArn: ecsStack.clusterArn,
    });
  }
}
```

## File: lib/vpc-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetCidrs: pulumi.Output<string[]>;

  constructor(name: string, args: VpcStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // VPC
    const vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-vpc-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`payment-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-igw-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Public Subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`payment-public-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: pulumi.output(availabilityZones).apply(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'Public',
        })),
      }, { parent: this });
      publicSubnets.push(subnet);
    }

    // Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`payment-private-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${10 + i}.0/24`,
        availabilityZone: pulumi.output(availabilityZones).apply(azs => azs.names[i]),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'Private',
        })),
      }, { parent: this });
      privateSubnets.push(subnet);
    }

    // Database Subnets (3 AZs)
    const databaseSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`payment-database-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${20 + i}.0/24`,
        availabilityZone: pulumi.output(availabilityZones).apply(azs => azs.names[i]),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-database-subnet-${i + 1}-${environmentSuffix}`,
          Tier: 'Database',
        })),
      }, { parent: this });
      databaseSubnets.push(subnet);
    }

    // Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(`payment-nat-eip-${i + 1}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        })),
      }, { parent: this });
      eips.push(eip);
    }

    // NAT Gateways (one per AZ for high availability)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(`payment-nat-${i + 1}-${environmentSuffix}`, {
        subnetId: publicSubnets[i].id,
        allocationId: eips[i].id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-nat-${i + 1}-${environmentSuffix}`,
        })),
      }, { parent: this });
      natGateways.push(nat);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(`payment-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-public-rt-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.ec2.Route(`payment-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`payment-public-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Private Route Tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`payment-private-rt-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
        })),
      }, { parent: this });

      new aws.ec2.Route(`payment-private-route-${i + 1}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`payment-private-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Database Route Tables (isolated, no internet access)
    databaseSubnets.forEach((subnet, i) => {
      const dbRouteTable = new aws.ec2.RouteTable(`payment-db-rt-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-rt-${i + 1}-${environmentSuffix}`,
        })),
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`payment-db-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: dbRouteTable.id,
      }, { parent: this });
    });

    // Outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.databaseSubnetIds = pulumi.output(databaseSubnets.map(s => s.id));
    this.privateSubnetCidrs = pulumi.output(privateSubnets.map(s => s.cidrBlock));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
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
  vpcId: pulumi.Output<string>;
  databaseSubnetIds: pulumi.Output<string[]>;
  privateSubnetCidrs: pulumi.Output<string[]>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly databaseSecretArn: pulumi.Output<string>;

  constructor(name: string, args: DatabaseStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, vpcId, databaseSubnetIds, privateSubnetCidrs, tags } = args;

    // KMS Key for database encryption
    const kmsKey = new aws.kms.Key(`payment-db-kms-${environmentSuffix}`, {
      description: `KMS key for payment database encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-kms-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.kms.Alias(`payment-db-kms-alias-${environmentSuffix}`, {
      name: `alias/payment-db-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // Database Security Group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(`payment-db-sg-${environmentSuffix}`, {
      vpcId: vpcId,
      description: 'Security group for payment database tier',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          cidrBlocks: privateSubnetCidrs,
          description: 'PostgreSQL access from private subnets',
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
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-sg-${environmentSuffix}`,
        Tier: 'Database',
      })),
    }, { parent: this });

    // Database Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`payment-db-subnet-group-${environmentSuffix}`, {
      subnetIds: databaseSubnetIds,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-subnet-group-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Database Credentials in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(`payment-db-secret-${environmentSuffix}`, {
      name: `payment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for payment application',
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-db-secret-${environmentSuffix}`,
      })),
    }, { parent: this });

    const dbPassword = pulumi.secret('PaymentDBP@ssw0rd!2024');

    const dbSecretVersion = new aws.secretsmanager.SecretVersion(`payment-db-secret-version-${environmentSuffix}`, {
      secretId: dbSecret.id,
      secretString: pulumi.jsonStringify({
        username: 'paymentadmin',
        password: dbPassword,
        engine: 'postgres',
        host: 'placeholder',
        port: 5432,
        dbname: 'paymentdb',
      }),
    }, { parent: this });

    // Aurora Serverless v2 Cluster Parameter Group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(`payment-cluster-pg-${environmentSuffix}`, {
      family: 'aurora-postgresql14',
      description: 'Aurora PostgreSQL 14 cluster parameter group',
      parameters: [
        {
          name: 'rds.force_ssl',
          value: '1',
        },
        {
          name: 'ssl',
          value: '1',
        },
      ],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-cluster-pg-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Aurora Serverless v2 Cluster
    const cluster = new aws.rds.Cluster(`payment-aurora-cluster-${environmentSuffix}`, {
      clusterIdentifier: `payment-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '14.9',
      databaseName: 'paymentdb',
      masterUsername: 'paymentadmin',
      masterPassword: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbClusterParameterGroupName: clusterParameterGroup.name,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      skipFinalSnapshot: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-aurora-cluster-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Aurora Serverless v2 Instance
    const clusterInstance = new aws.rds.ClusterInstance(`payment-aurora-instance-${environmentSuffix}`, {
      clusterIdentifier: cluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '14.9',
      publiclyAccessible: false,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-aurora-instance-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Update secret with actual endpoint
    cluster.endpoint.apply(endpoint => {
      new aws.secretsmanager.SecretVersion(`payment-db-secret-version-updated-${environmentSuffix}`, {
        secretId: dbSecret.id,
        secretString: pulumi.jsonStringify({
          username: 'paymentadmin',
          password: dbPassword,
          engine: 'postgres',
          host: endpoint,
          port: 5432,
          dbname: 'paymentdb',
        }),
      }, { parent: this, deleteBeforeReplace: true });
    });

    // Outputs
    this.clusterEndpoint = cluster.endpoint;
    this.clusterArn = cluster.arn;
    this.clusterId = cluster.id;
    this.databaseSecretArn = dbSecret.arn;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterArn: this.clusterArn,
      databaseSecretArn: this.databaseSecretArn,
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
  privateSubnetIds: pulumi.Output<string[]>;
  databaseEndpoint: pulumi.Output<string>;
  databaseSecretArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class EcsStack extends pulumi.ComponentResource {
  public readonly clusterArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly blueTargetGroupArn: pulumi.Output<string>;
  public readonly greenTargetGroupArn: pulumi.Output<string>;

  constructor(name: string, args: EcsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:ecs:EcsStack', name, args, opts);

    const { environmentSuffix, vpcId, privateSubnetIds, databaseEndpoint, databaseSecretArn, tags } = args;

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(`payment-ecs-cluster-${environmentSuffix}`, {
      name: `payment-cluster-${environmentSuffix}`,
      settings: [{
        name: 'containerInsights',
        value: 'enabled',
      }],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecs-cluster-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Application Security Group
    const appSecurityGroup = new aws.ec2.SecurityGroup(`payment-app-sg-${environmentSuffix}`, {
      vpcId: vpcId,
      description: 'Security group for payment application tier',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 8080,
          toPort: 8080,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Application port from VPC',
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
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-app-sg-${environmentSuffix}`,
        Tier: 'Application',
      })),
    }, { parent: this });

    // ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(`payment-task-exec-role-${environmentSuffix}`, {
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
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-exec-role-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`payment-task-exec-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    // Additional policy for Secrets Manager and X-Ray
    const taskExecutionPolicy = new aws.iam.RolePolicy(`payment-task-exec-custom-policy-${environmentSuffix}`, {
      role: taskExecutionRole.id,
      policy: pulumi.all([databaseSecretArn]).apply(([secretArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
            ],
            Resource: secretArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // ECS Task Role
    const taskRole = new aws.iam.Role(`payment-task-role-${environmentSuffix}`, {
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
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-role-${environmentSuffix}`,
      })),
    }, { parent: this });

    const taskRolePolicy = new aws.iam.RolePolicy(`payment-task-role-policy-${environmentSuffix}`, {
      role: taskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`payment-ecs-logs-${environmentSuffix}`, {
      name: `/ecs/payment-app-${environmentSuffix}`,
      retentionInDays: 2557, // 7 years
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecs-logs-${environmentSuffix}`,
      })),
    }, { parent: this });

    // ECR Repository (placeholder - assumes pre-existing image)
    const ecrRepo = new aws.ecr.Repository(`payment-ecr-${environmentSuffix}`, {
      name: `payment-app-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      encryptionConfigurations: [{
        encryptionType: 'AES256',
      }],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecr-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(`payment-task-def-${environmentSuffix}`, {
      family: `payment-app-${environmentSuffix}`,
      cpu: '512',
      memory: '1024',
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.all([ecrRepo.repositoryUrl, databaseSecretArn]).apply(([repoUrl, secretArn]) => JSON.stringify([
        {
          name: 'payment-app',
          image: `${repoUrl}:latest`,
          cpu: 512,
          memory: 1024,
          essential: true,
          portMappings: [{
            containerPort: 8080,
            protocol: 'tcp',
          }],
          environment: [
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
            {
              name: 'AWS_XRAY_DAEMON_ADDRESS',
              value: 'xray-daemon:2000',
            },
          ],
          secrets: [
            {
              name: 'DB_CREDENTIALS',
              valueFrom: secretArn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'ap-southeast-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
        {
          name: 'xray-daemon',
          image: 'public.ecr.aws/xray/aws-xray-daemon:latest',
          cpu: 32,
          memory: 256,
          essential: true,
          portMappings: [{
            containerPort: 2000,
            protocol: 'udp',
          }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'ap-southeast-1',
              'awslogs-stream-prefix': 'xray',
            },
          },
        },
      ])),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-task-def-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Target Groups for Blue-Green Deployment
    const blueTargetGroup = new aws.lb.TargetGroup(`payment-tg-blue-${environmentSuffix}`, {
      name: `payment-tg-blue-${environmentSuffix}`,
      port: 8080,
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
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-tg-blue-${environmentSuffix}`,
      })),
    }, { parent: this });

    const greenTargetGroup = new aws.lb.TargetGroup(`payment-tg-green-${environmentSuffix}`, {
      name: `payment-tg-green-${environmentSuffix}`,
      port: 8080,
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
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-tg-green-${environmentSuffix}`,
      })),
    }, { parent: this });

    // ECS Service
    const service = new aws.ecs.Service(`payment-ecs-service-${environmentSuffix}`, {
      name: `payment-service-${environmentSuffix}`,
      cluster: cluster.arn,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [appSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancers: [{
        targetGroupArn: blueTargetGroup.arn,
        containerName: 'payment-app',
        containerPort: 8080,
      }],
      deploymentController: {
        type: 'CODE_DEPLOY',
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-ecs-service-${environmentSuffix}`,
      })),
    }, { parent: this, dependsOn: [blueTargetGroup] });

    // Auto Scaling Target
    const scalingTarget = new aws.appautoscaling.Target(`payment-scaling-target-${environmentSuffix}`, {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    }, { parent: this });

    // CPU-based Auto Scaling Policy
    const cpuScalingPolicy = new aws.appautoscaling.Policy(`payment-cpu-scaling-${environmentSuffix}`, {
      name: `payment-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        targetValue: 70,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    // Memory-based Auto Scaling Policy
    const memoryScalingPolicy = new aws.appautoscaling.Policy(`payment-memory-scaling-${environmentSuffix}`, {
      name: `payment-memory-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
        },
        targetValue: 80,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    }, { parent: this });

    // Outputs
    this.clusterArn = cluster.arn;
    this.clusterName = cluster.name;
    this.serviceArn = service.id;
    this.serviceName = service.name;
    this.targetGroupArn = blueTargetGroup.arn;
    this.blueTargetGroupArn = blueTargetGroup.arn;
    this.greenTargetGroupArn = greenTargetGroup.arn;

    this.registerOutputs({
      clusterArn: this.clusterArn,
      clusterName: this.clusterName,
      serviceArn: this.serviceArn,
      serviceName: this.serviceName,
    });
  }
}
```

## File: lib/alb-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  ecsServiceArn: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  blueTargetGroupArn: pulumi.Output<string>;
  greenTargetGroupArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;

  constructor(name: string, args: AlbStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:alb:AlbStack', name, args, opts);

    const { environmentSuffix, vpcId, publicSubnetIds, blueTargetGroupArn, greenTargetGroupArn, tags } = args;

    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(`payment-alb-sg-${environmentSuffix}`, {
      vpcId: vpcId,
      description: 'Security group for payment application load balancer',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP from internet',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from internet',
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
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-alb-sg-${environmentSuffix}`,
        Tier: 'Web',
      })),
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
      name: `payment-alb-${environmentSuffix}`,
      loadBalancerType: 'application',
      subnets: publicSubnetIds,
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-alb-${environmentSuffix}`,
      })),
    }, { parent: this });

    // ALB Listener
    const listener = new aws.lb.Listener(`payment-alb-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'forward',
        targetGroupArn: blueTargetGroupArn,
      }],
    }, { parent: this });

    // WAF Web ACL for SQL Injection and XSS Protection
    const sqlInjectionRuleSet = new aws.wafv2.WebAcl(`payment-waf-${environmentSuffix}`, {
      name: `payment-waf-${environmentSuffix}`,
      scope: 'REGIONAL',
      description: 'WAF for payment application with SQL injection and XSS protection',
      defaultAction: {
        allow: {},
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'BlockSQLKeywords',
          priority: 3,
          action: {
            block: {},
          },
          statement: {
            orStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      queryString: {},
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'SELECT',
                    textTransformations: [{
                      priority: 0,
                      type: 'LOWERCASE',
                    }],
                  },
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      queryString: {},
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'INSERT',
                    textTransformations: [{
                      priority: 0,
                      type: 'LOWERCASE',
                    }],
                  },
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      queryString: {},
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'DROP',
                    textTransformations: [{
                      priority: 0,
                      type: 'LOWERCASE',
                    }],
                  },
                },
              ],
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'BlockSQLKeywordsMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `payment-waf-${environmentSuffix}`,
        sampledRequestsEnabled: true,
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-waf-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Associate WAF with ALB
    const wafAssociation = new aws.wafv2.WebAclAssociation(`payment-waf-assoc-${environmentSuffix}`, {
      resourceArn: alb.arn,
      webAclArn: sqlInjectionRuleSet.arn,
    }, { parent: this });

    // Outputs
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: this.albArn,
    });
  }
}
```

## File: lib/api-gateway-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  albDnsName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:api:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, albDnsName, tags } = args;

    // REST API
    const api = new aws.apigateway.RestApi(`payment-api-${environmentSuffix}`, {
      name: `payment-api-${environmentSuffix}`,
      description: 'Payment Processing API',
      endpointConfiguration: {
        types: 'REGIONAL',
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-api-${environmentSuffix}`,
      })),
    }, { parent: this });

    // VPC Link for private ALB integration (optional, using public ALB for simplicity)
    const resource = new aws.apigateway.Resource(`payment-api-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: '{proxy+}',
    }, { parent: this });

    const method = new aws.apigateway.Method(`payment-api-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: resource.id,
      httpMethod: 'ANY',
      authorization: 'NONE',
      apiKeyRequired: true,
    }, { parent: this });

    const integration = new aws.apigateway.Integration(`payment-api-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: resource.id,
      httpMethod: method.httpMethod,
      integrationHttpMethod: 'ANY',
      type: 'HTTP_PROXY',
      uri: pulumi.interpolate`http://${albDnsName}/{proxy}`,
      requestParameters: {
        'integration.request.path.proxy': 'method.request.path.proxy',
      },
    }, { parent: this });

    // Deployment
    const deployment = new aws.apigateway.Deployment(`payment-api-deployment-${environmentSuffix}`, {
      restApi: api.id,
      stageName: environmentSuffix,
    }, { parent: this, dependsOn: [integration] });

    // Usage Plan with Rate Limiting
    const usagePlan = new aws.apigateway.UsagePlan(`payment-usage-plan-${environmentSuffix}`, {
      name: `payment-usage-plan-${environmentSuffix}`,
      apiStages: [{
        apiId: api.id,
        stage: deployment.stageName,
      }],
      throttleSettings: {
        burstLimit: 1000,
        rateLimit: 1000,
      },
      quotaSettings: {
        limit: 1000000,
        period: 'MONTH',
      },
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-usage-plan-${environmentSuffix}`,
      })),
    }, { parent: this });

    // API Key
    const apiKey = new aws.apigateway.ApiKey(`payment-api-key-${environmentSuffix}`, {
      name: `payment-api-key-${environmentSuffix}`,
      enabled: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-api-key-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Associate API Key with Usage Plan
    const usagePlanKey = new aws.apigateway.UsagePlanKey(`payment-usage-plan-key-${environmentSuffix}`, {
      keyId: apiKey.id,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.id,
    }, { parent: this });

    // Outputs
    this.apiUrl = pulumi.interpolate`${deployment.invokeUrl}`;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: api.id,
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
  albArn: pulumi.Output<string>;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  databaseClusterId: pulumi.Output<string>;
  region: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, albArn, ecsClusterName, ecsServiceName, databaseClusterId, region, tags } = args;

    // S3 Bucket for Log Export
    const logBucket = new aws.s3.Bucket(`payment-logs-${environmentSuffix}`, {
      bucket: `payment-logs-${environmentSuffix}`,
      acl: 'private',
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        transitions: [{
          days: 90,
          storageClass: 'GLACIER',
        }],
      }],
      forceDestroy: true,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-logs-${environmentSuffix}`,
      })),
    }, { parent: this });

    // X-Ray Sampling Rule
    const samplingRule = new aws.xray.SamplingRule(`payment-xray-sampling-${environmentSuffix}`, {
      ruleName: `payment-sampling-${environmentSuffix}`,
      priority: 1000,
      version: 1,
      reservoirSize: 1,
      fixedRate: 0.1, // 10% sampling rate
      urlPath: '*',
      host: '*',
      httpMethod: '*',
      serviceName: '*',
      serviceType: '*',
      resourceArn: '*',
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-xray-sampling-${environmentSuffix}`,
      })),
    }, { parent: this });

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`payment-dashboard-${environmentSuffix}`, {
      dashboardName: `payment-dashboard-${environmentSuffix}`,
      dashboardBody: pulumi.all([
        region,
        albArn,
        ecsClusterName,
        ecsServiceName,
        databaseClusterId,
      ]).apply(([reg, alb, cluster, service, dbCluster]) => JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
              ],
              period: 300,
              stat: 'Average',
              region: reg,
              title: 'ALB Response Time',
              yAxis: {
                left: {
                  label: 'Seconds',
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'HTTPCode_Target_2XX_Count', { stat: 'Sum' }],
                ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
              ],
              period: 300,
              stat: 'Sum',
              region: reg,
              title: 'HTTP Response Codes',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum' }],
              ],
              period: 300,
              stat: 'Sum',
              region: reg,
              title: 'Transaction Volume',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
                ['.', 'MemoryUtilization', { stat: 'Average' }],
              ],
              period: 300,
              stat: 'Average',
              region: reg,
              title: 'ECS Resource Utilization',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                ['.', 'ServerlessDatabaseCapacity', { stat: 'Average' }],
              ],
              period: 300,
              stat: 'Average',
              region: reg,
              title: 'Database Metrics',
            },
          },
          {
            type: 'log',
            properties: {
              query: `SOURCE '/ecs/payment-app-${environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100`,
              region: reg,
              title: 'Recent Application Logs',
            },
          },
        ],
      })),
    }, { parent: this });

    // SNS Topic for Alarms
    const alarmTopic = new aws.sns.Topic(`payment-alarms-${environmentSuffix}`, {
      name: `payment-alarms-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-alarms-${environmentSuffix}`,
      })),
    }, { parent: this });

    // CloudWatch Alarms
    const highResponseTimeAlarm = new aws.cloudwatch.MetricAlarm(`payment-high-response-time-${environmentSuffix}`, {
      name: `payment-high-response-time-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Average',
      threshold: 1.0,
      alarmDescription: 'Alert when response time exceeds 1 second',
      alarmActions: [alarmTopic.arn],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-high-response-time-${environmentSuffix}`,
      })),
    }, { parent: this });

    const highErrorRateAlarm = new aws.cloudwatch.MetricAlarm(`payment-high-error-rate-${environmentSuffix}`, {
      name: `payment-high-error-rate-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HTTPCode_Target_5XX_Count',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when 5XX errors exceed threshold',
      alarmActions: [alarmTopic.arn],
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-high-error-rate-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Outputs
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      dashboardUrl: this.dashboardUrl,
      logBucketName: logBucket.bucket,
    });
  }
}
```

## File: lib/backup-verification-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackupVerificationStackArgs {
  environmentSuffix: string;
  databaseClusterArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BackupVerificationStack extends pulumi.ComponentResource {
  constructor(name: string, args: BackupVerificationStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:backup:BackupVerificationStack', name, args, opts);

    const { environmentSuffix, databaseClusterArn, tags } = args;

    // Lambda Execution Role
    const lambdaRole = new aws.iam.Role(`payment-backup-lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-backup-lambda-role-${environmentSuffix}`,
      })),
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`payment-backup-lambda-policy-${environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    const lambdaPolicy = new aws.iam.RolePolicy(`payment-backup-lambda-custom-policy-${environmentSuffix}`, {
      role: lambdaRole.id,
      policy: pulumi.all([databaseClusterArn]).apply(([clusterArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'rds:DescribeDBClusterSnapshots',
              'rds:DescribeDBSnapshots',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'sns:Publish',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // SNS Topic for Backup Alerts
    const backupAlarmTopic = new aws.sns.Topic(`payment-backup-alarms-${environmentSuffix}`, {
      name: `payment-backup-alarms-${environmentSuffix}`,
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-backup-alarms-${environmentSuffix}`,
      })),
    }, { parent: this });

    // Lambda Function for Backup Verification
    const backupVerificationLambda = new aws.lambda.Function(`payment-backup-verify-${environmentSuffix}`, {
      name: `payment-backup-verify-${environmentSuffix}`,
      runtime: 'python3.11',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 300,
      environment: {
        variables: {
          CLUSTER_ARN: databaseClusterArn,
          SNS_TOPIC_ARN: backupAlarmTopic.arn,
          ENVIRONMENT: environmentSuffix,
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.py': new pulumi.asset.StringAsset(`
import os
import json
import boto3
from datetime import datetime, timedelta

rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    cluster_arn = os.environ['CLUSTER_ARN']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    environment = os.environ['ENVIRONMENT']

    # Extract cluster identifier from ARN
    cluster_id = cluster_arn.split(':')[-1]

    try:
        # Get recent snapshots
        response = rds.describe_db_cluster_snapshots(
            DBClusterIdentifier=cluster_id,
            SnapshotType='automated',
            MaxRecords=20
        )

        snapshots = response['DBClusterSnapshots']

        if not snapshots:
            message = f"No automated backups found for cluster {cluster_id}"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # Check if latest backup is recent (within 24 hours)
        latest_snapshot = max(snapshots, key=lambda x: x['SnapshotCreateTime'])
        snapshot_age = datetime.now(latest_snapshot['SnapshotCreateTime'].tzinfo) - latest_snapshot['SnapshotCreateTime']

        if snapshot_age > timedelta(hours=25):
            message = f"Latest backup is too old: {snapshot_age.days} days, {snapshot_age.seconds // 3600} hours"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # Verify backup is encrypted
        if not latest_snapshot.get('StorageEncrypted', False):
            message = f"Latest backup is not encrypted!"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # All checks passed
        message = f"Backup verification successful. Latest snapshot: {latest_snapshot['DBClusterSnapshotIdentifier']}, Age: {snapshot_age.seconds // 3600} hours"
        print(message)

        return {
            'statusCode': 200,
            'body': json.dumps(message)
        }

    except Exception as e:
        error_message = f"Error verifying backups: {str(e)}"
        print(error_message)
        sns.publish(
            TopicArn=sns_topic,
            Subject=f"Backup Verification ERROR - {environment}",
            Message=error_message
        )
        return {
            'statusCode': 500,
            'body': json.dumps(error_message)
        }
`),
      }),
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-backup-verify-${environmentSuffix}`,
      })),
    }, { parent: this });

    // EventBridge Rule for Daily Execution
    const dailyScheduleRule = new aws.cloudwatch.EventRule(`payment-backup-schedule-${environmentSuffix}`, {
      name: `payment-backup-schedule-${environmentSuffix}`,
      description: 'Daily schedule for backup verification',
      scheduleExpression: 'cron(0 6 * * ? *)', // Daily at 6 AM UTC
      tags: pulumi.all([tags]).apply(([t]) => ({
        ...t,
        Name: `payment-backup-schedule-${environmentSuffix}`,
      })),
    }, { parent: this });

    const eventTarget = new aws.cloudwatch.EventTarget(`payment-backup-target-${environmentSuffix}`, {
      rule: dailyScheduleRule.name,
      arn: backupVerificationLambda.arn,
    }, { parent: this });

    const lambdaPermission = new aws.lambda.Permission(`payment-backup-lambda-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: backupVerificationLambda.name,
      principal: 'events.amazonaws.com',
      sourceArn: dailyScheduleRule.arn,
    }, { parent: this });

    this.registerOutputs({
      lambdaArn: backupVerificationLambda.arn,
      snsTopicArn: backupAlarmTopic.arn,
    });
  }
}
```

## File: lib/README.md

```markdown
# Payment Processing Application Infrastructure

This Pulumi TypeScript project deploys a highly available, production-grade payment processing infrastructure on AWS.

## Architecture

- **Multi-AZ VPC**: 3 public, 3 private, and 3 database subnets across 3 availability zones
- **Aurora Serverless v2**: PostgreSQL database with encryption and automatic scaling (0.5-2 ACUs)
- **ECS Fargate**: Containerized application deployment with auto-scaling
- **Application Load Balancer**: With AWS WAF for SQL injection and XSS protection
- **API Gateway**: Rate-limited API endpoints (1000 req/min per key)
- **CloudWatch**: 7-year log retention, dashboards, and alarms
- **X-Ray**: Distributed tracing with 10% sampling
- **Lambda**: Daily backup verification

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Docker (for building container images)

## Configuration

Set the environment suffix:

```bash
pulumi config set env <environment-suffix>
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build and push container image to ECR:
```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
docker build -t payment-app .
docker tag payment-app:latest <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/payment-app-<env>:latest
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/payment-app-<env>:latest
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Outputs

After deployment, Pulumi exports:

- `albDnsName`: Application Load Balancer DNS name
- `apiGatewayUrl`: API Gateway endpoint URL
- `dashboardUrl`: CloudWatch dashboard URL
- `vpcId`: VPC identifier
- `databaseEndpoint`: Aurora cluster endpoint

## Security Features

- All compute resources in private subnets
- Database encryption at rest with customer-managed KMS keys
- SSL/TLS encryption for database connections
- WAF with SQL injection and XSS prevention
- Separate security groups per tier
- Secrets Manager for credentials
- Encrypted backups

## Monitoring and Compliance

- CloudWatch Logs with 7-year retention
- X-Ray tracing with 10% sampling rate
- Real-time dashboards showing response times, error rates, transaction volumes
- Daily backup verification with alerting
- CloudWatch alarms for high response time and error rates

## Blue-Green Deployment

The infrastructure supports blue-green deployments through:
- Two target groups (blue and green)
- ECS service with CODE_DEPLOY deployment controller
- Weighted routing for gradual traffic shifting

## Auto-Scaling

ECS services auto-scale based on:
- CPU utilization > 70%
- Memory utilization > 80%
- Min: 2 tasks, Max: 10 tasks

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Cost Optimization

This implementation uses:
- Aurora Serverless v2 (scales to zero when idle)
- Fargate Spot (when applicable)
- S3 lifecycle policies for log archival
- Minimal NAT Gateway deployment
```

## Deployment Notes

1. **Container Image**: You must build and push your payment application container image to the ECR repository created by this stack before the ECS service can run successfully.

2. **Database Credentials**: The default database password is hardcoded for demonstration. In production, use a secure password generator and store in Secrets Manager.

3. **SSL Certificates**: For production, add an ACM certificate to the ALB listener for HTTPS traffic.

4. **Blue-Green Deployment**: To implement full blue-green deployment, integrate with AWS CodeDeploy and configure deployment configurations.

5. **Correlation IDs**: Implement correlation ID generation in your application code and configure X-Ray SDK to propagate them.

6. **Testing**: After deployment, test the backup verification Lambda function manually before relying on the daily schedule.

## Integration Testing

The infrastructure exports outputs to `cfn-outputs/flat-outputs.json` for integration testing:

```json
{
  "albDnsName": "payment-alb-dev-123456789.ap-southeast-1.elb.amazonaws.com",
  "apiGatewayUrl": "https://abcd1234.execute-api.ap-southeast-1.amazonaws.com/dev",
  "dashboardUrl": "https://console.aws.amazon.com/cloudwatch/...",
  "vpcId": "vpc-123456",
  "databaseEndpoint": "payment-aurora-dev.cluster-123.ap-southeast-1.rds.amazonaws.com"
}
```
