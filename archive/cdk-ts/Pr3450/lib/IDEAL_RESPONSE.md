# Ideal CDK Multi-Region Infrastructure Solution

## Overview

This is the production-ready CDK TypeScript implementation for a fully resilient, multi-region active-passive setup across eu-west-2 (primary) and eu-west-3 (standby). The solution survives full regional outages with automatic failover using Route 53.

## Architecture Components

- **Primary Region (eu-west-2)**: Full infrastructure with Multi-AZ RDS, Auto Scaling groups, ALB, EFS
- **Standby Region (eu-west-3)**: Replica infrastructure with cross-region RDS read replica
- **VPC Peering**: Private cross-region communication between VPCs
- **Route 53 Failover**: Automatic DNS-based failover with health checks
- **AWS FIS**: Fault injection testing for resilience validation
- **AWS Resilience Hub**: Continuous assessment against recovery objectives

## Main CDK Entry Point

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## Core Infrastructure Stacks

### lib/tap-stack.ts (Main Orchestrator)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { VpcPeeringStack } from './vpc-peering-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { DnsStack } from './dns-stack';
import { ResilienceStack } from './resilience-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true,
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Define regions
    const primaryRegion = 'eu-west-2';
    const standbyRegion = 'eu-west-3';
    const domainName = this.node.tryGetContext('domainName');

    // Primary region stacks
    const primaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: primaryRegion,
    };

    // Standby region stacks
    const standbyEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: standbyRegion,
    };

    // Create VPC stacks
    const primaryVpcStack = new VpcStack(this, `VpcStack-Primary`, {
      env: primaryEnv,
      cidr: '10.0.0.0/16',
      description: 'VPC in primary region (eu-west-2)',
      stackName: `${this.stackName}-VpcStack-Primary`,
      crossRegionReferences: true,
    });

    const standbyVpcStack = new VpcStack(this, `VpcStack-Standby`, {
      env: standbyEnv,
      cidr: '10.1.0.0/16',
      description: 'VPC in standby region (eu-west-3)',
      stackName: `${this.stackName}-VpcStack-Standby`,
      crossRegionReferences: true,
    });

    // Create security stacks with KMS keys and security groups
    const primarySecurityStack = new SecurityStack(this, `SecurityPrimary`, {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      description: 'Security resources in primary region',
      stackName: `${this.stackName}-SecurityPrimary`,
      crossRegionReferences: true,
    });

    const standbySecurityStack = new SecurityStack(this, `SecurityStandby`, {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      description: 'Security resources in standby region',
      stackName: `${this.stackName}-SecurityStandby`,
      crossRegionReferences: true,
    });

    // Create VPC peering between regions
    const peeringStack = new VpcPeeringStack(this, `VpcPeering`, {
      env: primaryEnv,
      primaryVpc: primaryVpcStack.vpc,
      standbyVpc: standbyVpcStack.vpc,
      primaryRegion: primaryRegion,
      standbyRegion: standbyRegion,
      description: 'VPC Peering between primary and standby regions',
      stackName: `${this.stackName}-VpcPeering`,
      crossRegionReferences: true,
    });
    peeringStack.addDependency(primaryVpcStack);
    peeringStack.addDependency(standbyVpcStack);

    // Create storage stacks (EFS)
    const primaryStorageStack = new StorageStack(this, `StoragePrimary`, {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      kmsKey: primarySecurityStack.kmsKey,
      description: 'Storage resources in primary region',
      stackName: `${this.stackName}-StoragePrimary`,
      crossRegionReferences: true,
    });
    primaryStorageStack.addDependency(primaryVpcStack);
    primaryStorageStack.addDependency(primarySecurityStack);

    const standbyStorageStack = new StorageStack(this, `StorageStandby`, {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      kmsKey: standbySecurityStack.kmsKey,
      description: 'Storage resources in standby region',
      stackName: `${this.stackName}-StorageStandby`,
      crossRegionReferences: true,
    });
    standbyStorageStack.addDependency(standbyVpcStack);
    standbyStorageStack.addDependency(standbySecurityStack);

    // Create database stacks
    const primaryDatabaseStack = new DatabaseStack(this, `DatabasePrimary`, {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      kmsKey: primarySecurityStack.kmsKey,
      isReplica: false,
      description: 'Primary database resources',
      stackName: `${this.stackName}-DatabasePrimary`,
      crossRegionReferences: true,
    });
    primaryDatabaseStack.addDependency(primaryVpcStack);
    primaryDatabaseStack.addDependency(primarySecurityStack);

    const standbyDatabaseStack = new DatabaseStack(this, `DatabaseStandby`, {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      kmsKey: standbySecurityStack.kmsKey,
      isReplica: true,
      replicationSourceIdentifier: `db-primary-${environmentSuffix}`,
      sourceDatabaseInstance: primaryDatabaseStack.dbInstance,
      description: 'Standby database resources (read replica)',
      stackName: `${this.stackName}-DatabaseStandby`,
      crossRegionReferences: true,
    });
    standbyDatabaseStack.addDependency(standbyVpcStack);
    standbyDatabaseStack.addDependency(standbySecurityStack);
    standbyDatabaseStack.addDependency(primaryDatabaseStack);

    // Create compute stacks (ALB + ASG)
    const primaryComputeStack = new ComputeStack(this, `ComputePrimary`, {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      fileSystem: primaryStorageStack.fileSystem,
      dbInstance: primaryDatabaseStack.dbInstance,
      securityGroups: primarySecurityStack.securityGroups,
      description: 'Compute resources in primary region',
      stackName: `${this.stackName}-ComputePrimary`,
      crossRegionReferences: true,
    });
    primaryComputeStack.addDependency(primaryVpcStack);
    primaryComputeStack.addDependency(primaryStorageStack);
    primaryComputeStack.addDependency(primaryDatabaseStack);

    const standbyComputeStack = new ComputeStack(this, `ComputeStandby`, {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      fileSystem: standbyStorageStack.fileSystem,
      dbInstance: standbyDatabaseStack.dbInstance,
      securityGroups: standbySecurityStack.securityGroups,
      description: 'Compute resources in standby region',
      stackName: `${this.stackName}-ComputeStandby`,
      crossRegionReferences: true,
    });
    standbyComputeStack.addDependency(standbyVpcStack);
    standbyComputeStack.addDependency(standbyStorageStack);
    standbyComputeStack.addDependency(standbyDatabaseStack);

    // Create DNS stack with Route 53 failover
    const dnsStack = new DnsStack(this, `Dns`, {
      env: primaryEnv,
      primaryAlb: primaryComputeStack.loadBalancer,
      standbyAlb: standbyComputeStack.loadBalancer,
      domainName: domainName,
      description: 'DNS and failover routing resources',
      stackName: `${this.stackName}-Dns`,
      crossRegionReferences: true,
    });
    dnsStack.addDependency(primaryComputeStack);
    dnsStack.addDependency(standbyComputeStack);

    // Create resilience stack with FIS experiment and Resilience Hub
    const resilienceStack = new ResilienceStack(this, `Resilience`, {
      env: primaryEnv,
      primaryVpc: primaryVpcStack.vpc,
      primaryAlb: primaryComputeStack.loadBalancer,
      primaryAsg: primaryComputeStack.autoScalingGroup,
      primaryDatabase: primaryDatabaseStack.dbInstance,
      standbyVpc: standbyVpcStack.vpc,
      standbyAlb: standbyComputeStack.loadBalancer,
      standbyAsg: standbyComputeStack.autoScalingGroup,
      standbyDatabase: standbyDatabaseStack.dbInstance,
      description: 'Resilience testing and assessment resources',
      stackName: `${this.stackName}-Resilience`,
      crossRegionReferences: true,
    });
    resilienceStack.addDependency(dnsStack);
  }
}
```

### lib/vpc-stack.ts (Network Foundation)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface VpcStackProps extends cdk.StackProps {
  cidr: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly routeTableIds: string[] = [];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // Create a VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 3,
      cidr: props.cidr,
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
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Reduced to 1 to avoid EIP quota issues
    });

    // Collect route table IDs for VPC peering
    const cfnVpc = this.vpc.node.defaultChild as ec2.CfnVPC;

    // Store route table IDs for peering setup
    this.vpc.publicSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    this.vpc.privateSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    this.vpc.isolatedSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}:VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      exportName: `${this.stackName}:VpcCidr`,
    });
  }
}
```

### lib/security-stack.ts (Security Resources)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly appRole: iam.Role;
  public readonly securityGroups: {
    albSg: ec2.SecurityGroup;
    ec2Sg: ec2.SecurityGroup;
    efsSg: ec2.SecurityGroup;
    dbSg: ec2.SecurityGroup;
  };

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create a KMS key for data encryption
    this.kmsKey = new kms.Key(this, 'DataEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for encrypting data at rest in EFS and RDS',
      alias: `multi-region-app-key-${props?.env?.region}`,
    });

    // Create an IAM role for the application
    this.appRole = new iam.Role(this, 'AppRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for the application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For SSM Session Manager
      ],
    });

    // Grant the app role permission to use the KMS key
    this.kmsKey.grantEncryptDecrypt(this.appRole);

    // Create security groups
    this.securityGroups = {
      albSg: new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for Application Load Balancers',
        allowAllOutbound: true,
      }),
      ec2Sg: new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }),
      efsSg: new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for EFS file systems',
        allowAllOutbound: false,
      }),
      dbSg: new ec2.SecurityGroup(this, 'DbSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for RDS instances',
        allowAllOutbound: false,
      }),
    };

    // The actual security group rules will be added in the compute stack
    // once we have the VPC properly created
  }
}
```

### lib/storage-stack.ts (EFS File Systems)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as kms from 'aws-cdk-lib/aws-kms';

interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class StorageStack extends cdk.Stack {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create a security group for the EFS mount targets
    const efsSg = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow NFS traffic to EFS from EC2 instances',
      allowAllOutbound: false,
    });

    // Allow NFS traffic from EC2 instances
    efsSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      'Allow NFS traffic from within the VPC'
    );

    // Create the EFS file system
    this.fileSystem = new efs.FileSystem(this, 'AppFileSystem', {
      vpc: props.vpc,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS, // Move files to infrequent access after 30 days
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      securityGroup: efsSg,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable for testing
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Enable automatic backups
    const cfnFileSystem = this.fileSystem.node
      .defaultChild as efs.CfnFileSystem;
    cfnFileSystem.backupPolicy = {
      status: 'ENABLED',
    };

    // Output the EFS DNS name and ID
    new cdk.CfnOutput(this, 'EfsId', {
      value: this.fileSystem.fileSystemId,
      description: 'The ID of the EFS file system',
    });

    new cdk.CfnOutput(this, 'EfsDnsName', {
      value: `${this.fileSystem.fileSystemId}.efs.${this.region}.amazonaws.com`,
      description: 'The DNS name of the EFS file system',
    });
  }
}
```

### lib/database-stack.ts (RDS with Cross-Region Replication)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  isReplica: boolean;
  replicationSourceIdentifier?: string;
  sourceDatabaseInstance?: rds.IDatabaseInstance;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance:
    | rds.DatabaseInstance
    | rds.DatabaseInstanceReadReplica;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create a security group for the RDS instance
    const dbSg = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow database access from EC2 instances',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL traffic from EC2 instances in the VPC
    dbSg.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow database traffic from within the VPC'
    );

    // Also allow from all private subnets explicitly
    props.vpc.privateSubnets.forEach((subnet, index) => {
      dbSg.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        `Allow database traffic from private subnet ${index + 1}`
      );
    });

    // Create a parameter group
    const parameterGroup = new rds.ParameterGroup(this, 'DbParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8,
      }),
      description: 'Parameter group for PostgreSQL 15.8',
      parameters: {
        log_statement: 'all', // Log all SQL statements for debugging
        log_min_duration_statement: '1000', // Log statements running longer than 1s
      },
    });

    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    if (props.isReplica && props.sourceDatabaseInstance) {
      // Create a read replica in the standby region
      this.dbInstance = new rds.DatabaseInstanceReadReplica(
        this,
        'DbReadReplica',
        {
          sourceDatabaseInstance: props.sourceDatabaseInstance,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MEDIUM
          ),
          vpc: props.vpc,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          securityGroups: [dbSg],
          parameterGroup,
          storageEncrypted: true,
          storageEncryptionKey: props.kmsKey,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          instanceIdentifier: `db-replica-${environmentSuffix}`,
        }
      );
    } else {
      // Create the primary database instance
      this.dbInstance = new rds.DatabaseInstance(this, 'DbInstance', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_8,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSg],
        parameterGroup,
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        multiAz: true,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        databaseName: 'appdb',
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        instanceIdentifier: `db-primary-${environmentSuffix}`,
      });
    }

    // Output the database endpoint
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.instanceEndpoint.hostname,
      description: 'The endpoint of the database',
    });

    // Output the database credentials secret ARN
    if (!props.isReplica && this.dbInstance instanceof rds.DatabaseInstance) {
      new cdk.CfnOutput(this, 'DbCredentialsSecret', {
        value: this.dbInstance.secret?.secretArn || 'No secret available',
        description: 'The ARN of the secret containing database credentials',
      });
    }
  }
}
```

### lib/compute-stack.ts (ALB + Auto Scaling + EC2)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  fileSystem: efs.FileSystem;
  dbInstance: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
  securityGroups: {
    albSg: ec2.SecurityGroup;
    ec2Sg: ec2.SecurityGroup;
    efsSg: ec2.SecurityGroup;
    dbSg: ec2.SecurityGroup;
  };
}

export class ComputeStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create a security group for the ALB
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS traffic from anywhere to the ALB
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from the internet'
    );

    // Create a security group for the EC2 instances
    const ec2Sg = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for the EC2 instances',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from the ALB to the EC2 instances
    ec2Sg.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the ALB'
    );

    // Get environment suffix
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // Create the ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'AppLoadBalancer',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: albSg,
        loadBalancerName: `alb-${this.region}-${environmentSuffix}`,
      }
    );

    // Create a target group for the ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'AppTargetGroup',
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyHttpCodes: '200',
        },
      }
    );

    // Add listener to the ALB
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    listener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [targetGroup],
    });

    // Create a role for the EC2 instances
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create a user data script to mount EFS and configure the application
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -e',
      'exec > >(tee /var/log/user-data.log) 2>&1',
      'echo "Starting user data script at $(date)"',
      '# Instance template updated: 2025-10-07T09:30:00Z - EFS mount fixed',
      '',
      '# Update system and install packages',
      'yum update -y',
      'yum install -y amazon-efs-utils httpd postgresql15',
      '',
      '# Mount EFS',
      'mkdir -p /mnt/efs',
      `mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport ${props.fileSystem.fileSystemId}.efs.${this.region}.amazonaws.com:/ /mnt/efs`,
      'echo "EFS mounted successfully"',
      '',
      '# Create index page',
      'cat > /var/www/html/index.html << "INDEXEOF"',
      '<!DOCTYPE html>',
      '<html>',
      '<head><title>Multi-Region Web App</title></head>',
      '<body>',
      `<h1>Hello from ${this.region}</h1>`,
      '<p>This is a multi-region resilient application</p>',
      `<p>Region: ${this.region}</p>`,
      '<p>EFS Mounted: /mnt/efs</p>',
      '<p>Timestamp: ' + new Date().toISOString() + '</p>',
      '</body>',
      '</html>',
      'INDEXEOF',
      '',
      '# Create health check endpoint',
      'cat > /var/www/html/health << "HEALTHEOF"',
      '{"status":"healthy","region":"' +
        this.region +
        '","timestamp":"' +
        new Date().toISOString() +
        '"}',
      'HEALTHEOF',
      '',
      '# Set proper permissions',
      'chmod 644 /var/www/html/index.html',
      'chmod 644 /var/www/html/health',
      'chown apache:apache /var/www/html/index.html',
      'chown apache:apache /var/www/html/health',
      '',
      '# Start and enable Apache',
      'systemctl start httpd',
      'systemctl enable httpd',
      'systemctl status httpd',
      '',
      '# Verify httpd is running',
      'sleep 5',
      'curl -f http://localhost/health || echo "Health check failed"',
      '',
      '# Write test data to EFS',
      'echo "Test data from ' + this.region + '" > /mnt/efs/test.txt',
      'date >> /mnt/efs/test.txt',
      '',
      'echo "User data script completed successfully at $(date)"'
    );

    // Create the Auto Scaling group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AppAutoScalingGroup',
      {
        vpc: props.vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2Sg,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        role: instanceRole,
        userData,
        healthCheck: autoscaling.HealthCheck.ec2(),
        cooldown: cdk.Duration.seconds(300),
      }
    );

    // Add the ASG to the target group
    this.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Add step scaling for more granular control
    const highCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    // Scale out policy
    this.autoScalingGroup.scaleOnMetric('ScaleOutPolicy', {
      metric: highCpuMetric,
      scalingSteps: [
        { upper: 50, change: 0 },
        { lower: 50, upper: 70, change: +1 },
        { lower: 70, upper: 85, change: +2 },
        { lower: 85, change: +3 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.seconds(300),
    });

    // Scale in policy
    this.autoScalingGroup.scaleOnMetric('ScaleInPolicy', {
      metric: highCpuMetric,
      scalingSteps: [
        { upper: 40, change: -1 },
        { lower: 40, change: 0 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.seconds(300),
    });

    // Output the load balancer DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
    });
  }
}
```

### lib/dns-stack.ts (Route 53 Failover)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface DnsStackProps extends cdk.StackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  standbyAlb: elbv2.ApplicationLoadBalancer;
  domainName?: string;
}

export class DnsStack extends cdk.Stack {
  public readonly primaryHealthCheck?: route53.CfnHealthCheck;
  public readonly standbyHealthCheck?: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    // Always create health checks for ALB monitoring (useful even without custom domain)
    this.primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: props.primaryAlb.loadBalancerDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: 'Primary ALB Health Check',
          },
        ],
      }
    );

    this.standbyHealthCheck = new route53.CfnHealthCheck(
      this,
      'StandbyHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: props.standbyAlb.loadBalancerDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: 'Standby ALB Health Check',
          },
        ],
      }
    );

    // Output health check IDs for testing
    new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
      value: this.primaryHealthCheck.attrHealthCheckId,
      description: 'Primary ALB Health Check ID',
    });

    new cdk.CfnOutput(this, 'StandbyHealthCheckId', {
      value: this.standbyHealthCheck.attrHealthCheckId,
      description: 'Standby ALB Health Check ID',
    });

    // Only create hosted zone and DNS records if a real domain is provided
    if (props.domainName && props.domainName !== 'example.com') {
      const domainName = props.domainName;

      // Create or import the hosted zone
      const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
        zoneName: domainName,
      });

      // Create failover record set for the application using CfnRecordSet
      new route53.CfnRecordSet(this, 'PrimaryFailoverRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `app.${domainName}`,
        type: 'A',
        aliasTarget: {
          dnsName: props.primaryAlb.loadBalancerDnsName,
          evaluateTargetHealth: true,
          hostedZoneId: props.primaryAlb.loadBalancerCanonicalHostedZoneId,
        },
        failover: 'PRIMARY',
        healthCheckId: this.primaryHealthCheck.attrHealthCheckId,
        setIdentifier: 'Primary',
      });

      new route53.CfnRecordSet(this, 'StandbyFailoverRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `app.${domainName}`,
        type: 'A',
        aliasTarget: {
          dnsName: props.standbyAlb.loadBalancerDnsName,
          evaluateTargetHealth: true,
          hostedZoneId: props.standbyAlb.loadBalancerCanonicalHostedZoneId,
        },
        failover: 'SECONDARY',
        healthCheckId: this.standbyHealthCheck.attrHealthCheckId,
        setIdentifier: 'Standby',
      });

      // Output the application URL
      new cdk.CfnOutput(this, 'ApplicationUrl', {
        value: `http://app.${domainName}`,
        description: 'The URL of the application with Route53 failover',
      });
    } else {
      // For testing without a real domain, output the ALB DNS names
      new cdk.CfnOutput(this, 'PrimaryAlbUrl', {
        value: `http://${props.primaryAlb.loadBalancerDnsName}`,
        description: 'Primary ALB DNS name',
      });

      new cdk.CfnOutput(this, 'StandbyAlbUrl', {
        value: `http://${props.standbyAlb.loadBalancerDnsName}`,
        description: 'Standby ALB DNS name',
      });
    }
  }
}
```

### lib/vpc-peering-stack.ts (Cross-Region VPC Peering)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';

interface VpcPeeringStackProps extends cdk.StackProps {
  primaryVpc: ec2.Vpc;
  standbyVpc: ec2.Vpc;
  primaryRegion: string;
  standbyRegion: string;
}

export class VpcPeeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    // Create a role that can be used for cross-region actions
    const crossRegionRole = new iam.Role(this, 'CrossRegionPeeringRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        VpcPeeringPermissions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ec2:CreateVpcPeeringConnection',
                'ec2:AcceptVpcPeeringConnection',
                'ec2:DescribeVpcPeeringConnections',
                'ec2:DeleteVpcPeeringConnection',
                'ec2:CreateRoute',
                'ec2:DeleteRoute',
                'ec2:DescribeRouteTables',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create VPC peering connection using a custom resource
    const peeringConnection = new cr.AwsCustomResource(
      this,
      'CreateVpcPeering',
      {
        onCreate: {
          service: 'EC2',
          action: 'createVpcPeeringConnection',
          parameters: {
            VpcId: props.primaryVpc.vpcId,
            PeerVpcId: props.standbyVpc.vpcId,
            PeerRegion: props.standbyRegion,
          },
          region: props.primaryRegion,
          physicalResourceId: cr.PhysicalResourceId.fromResponse(
            'VpcPeeringConnection.VpcPeeringConnectionId'
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteVpcPeeringConnection',
          parameters: {
            VpcPeeringConnectionId: new cr.PhysicalResourceIdReference(),
          },
          region: props.primaryRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      }
    );

    const peeringConnectionId = peeringConnection.getResponseField(
      'VpcPeeringConnection.VpcPeeringConnectionId'
    );

    // Accept the peering connection in the standby region
    const acceptPeering = new cr.AwsCustomResource(this, 'AcceptVpcPeering', {
      onCreate: {
        service: 'EC2',
        action: 'acceptVpcPeeringConnection',
        parameters: {
          VpcPeeringConnectionId: peeringConnectionId,
        },
        region: props.standbyRegion,
        physicalResourceId: cr.PhysicalResourceId.of(
          `${peeringConnectionId}-accepted`
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      role: crossRegionRole,
    });

    // Wait for the peering connection to be active
    const describePeering = new cr.AwsCustomResource(
      this,
      'DescribeVpcPeering',
      {
        onCreate: {
          service: 'EC2',
          action: 'describeVpcPeeringConnections',
          parameters: {
            VpcPeeringConnectionIds: [peeringConnectionId],
          },
          region: props.primaryRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `${peeringConnectionId}-describe`
          ),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      }
    );

    // Add routes between VPCs
    // Primary to standby
    props.primaryVpc.publicSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new ec2.CfnRoute(this, `PrimaryToStandbyRoute-Public${i}`, {
        routeTableId: routeTable.routeTableId,
        destinationCidrBlock: props.standbyVpc.vpcCidrBlock,
        vpcPeeringConnectionId: peeringConnectionId,
      });
    });

    props.primaryVpc.privateSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new ec2.CfnRoute(this, `PrimaryToStandbyRoute-Private${i}`, {
        routeTableId: routeTable.routeTableId,
        destinationCidrBlock: props.standbyVpc.vpcCidrBlock,
        vpcPeeringConnectionId: peeringConnectionId,
      });
    });

    // Standby to primary routes (must be created in standby region using custom resource)
    props.standbyVpc.publicSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new cr.AwsCustomResource(this, `StandbyToPrimaryRoutePublic${i}`, {
        onCreate: {
          service: 'EC2',
          action: 'createRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
            VpcPeeringConnectionId: peeringConnectionId,
          },
          region: props.standbyRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `standby-public-route-${i}`
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
          },
          region: props.standbyRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      });
    });

    props.standbyVpc.privateSubnets.forEach((subnet, i) => {
      const routeTable = subnet.routeTable;
      new cr.AwsCustomResource(this, `StandbyToPrimaryRoutePrivate${i}`, {
        onCreate: {
          service: 'EC2',
          action: 'createRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
            VpcPeeringConnectionId: peeringConnectionId,
          },
          region: props.standbyRegion,
          physicalResourceId: cr.PhysicalResourceId.of(
            `standby-private-route-${i}`
          ),
        },
        onDelete: {
          service: 'EC2',
          action: 'deleteRoute',
          parameters: {
            RouteTableId: routeTable.routeTableId,
            DestinationCidrBlock: props.primaryVpc.vpcCidrBlock,
          },
          region: props.standbyRegion,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: crossRegionRole,
      });
    });

    // Output the peering connection ID
    new cdk.CfnOutput(this, 'VpcPeeringConnectionId', {
      value: peeringConnectionId,
      description: 'The ID of the VPC peering connection',
    });
  }
}
```

### lib/resilience-stack.ts (FIS + Resilience Hub)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fis from 'aws-cdk-lib/aws-fis';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface ResilienceStackProps extends cdk.StackProps {
  primaryVpc: ec2.Vpc;
  primaryAlb: elbv2.ApplicationLoadBalancer;
  primaryAsg: autoscaling.AutoScalingGroup;
  primaryDatabase: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
  standbyVpc: ec2.Vpc;
  standbyAlb: elbv2.ApplicationLoadBalancer;
  standbyAsg: autoscaling.AutoScalingGroup;
  standbyDatabase: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
}

export class ResilienceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ResilienceStackProps) {
    super(scope, id, props);

    // Create IAM role for FIS
    const fisRole = new iam.Role(this, 'FisRole', {
      assumedBy: new iam.ServicePrincipal('fis.amazonaws.com'),
      description: 'Role for AWS FIS to perform fault injection experiments',
    });

    // Attach necessary permissions to the role
    fisRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:StopInstances',
          'ec2:StartInstances',
          'ec2:DescribeInstances',
          'ec2:DescribeTags',
        ],
        resources: ['*'],
      })
    );

    // Create a CloudWatch alarm as a stop condition for FIS experiments
    const stopConditionAlarm = new cloudwatch.Alarm(
      this,
      'FisStopConditionAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/FIS',
          metricName: 'ExperimentCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 100,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'Stop condition for FIS experiments',
      }
    );

    // Create an experiment template that simulates a failure by stopping primary EC2 instances
    // This will make the ALB unhealthy and trigger Route 53 failover
    new fis.CfnExperimentTemplate(this, 'AlbFailureExperiment', {
      description:
        'Experiment to test Route 53 failover by stopping primary region EC2 instances',
      roleArn: fisRole.roleArn,
      stopConditions: [
        {
          source: 'aws:cloudwatch:alarm',
          value: stopConditionAlarm.alarmArn,
        },
      ],
      targets: {
        Instances: {
          resourceType: 'aws:ec2:instance',
          resourceTags: {
            'aws:autoscaling:groupName': props.primaryAsg.autoScalingGroupName,
          },
          selectionMode: 'ALL',
        },
      },
      actions: {
        StopInstances: {
          actionId: 'aws:ec2:stop-instances',
          parameters: {
            startInstancesAfterDuration: 'PT10M', // Auto-restart after 10 minutes
          },
          targets: {
            Instances: 'Instances',
          },
        },
      },
    });

    // Create AWS Resilience Hub application using Custom Resource
    // Note: Resilience Hub is not yet fully supported in CDK, so we use a custom resource
    const resilienceHubApp = new cr.AwsCustomResource(
      this,
      'ResilienceHubApplication',
      {
        onCreate: {
          service: 'ResilienceHub',
          action: 'createApp',
          parameters: {
            name: 'MultiRegionWebApp',
            description:
              'Multi-region web application with active-passive failover',
            appAssessmentSchedule: 'Scheduled',
            assessmentSchedule: 'Daily',
            resiliencyPolicyArn:
              'arn:aws:resiliencehub:::resiliency-policy/AWSManagedPolicy',
            resourceMappings: [
              {
                mappingType: 'CfnStack',
                physicalResourceId: this.stackId,
              },
            ],
          },
          physicalResourceId: cr.PhysicalResourceId.fromResponse('app.appArn'),
        },
        onUpdate: {
          service: 'ResilienceHub',
          action: 'updateApp',
          parameters: {
            appArn: new cr.PhysicalResourceIdReference(),
            name: 'MultiRegionWebApp',
            description:
              'Multi-region web application with active-passive failover',
            appAssessmentSchedule: 'Scheduled',
            assessmentSchedule: 'Daily',
            resiliencyPolicyArn:
              'arn:aws:resiliencehub:::resiliency-policy/AWSManagedPolicy',
          },
          physicalResourceId: cr.PhysicalResourceId.fromResponse('app.appArn'),
        },
        onDelete: {
          service: 'ResilienceHub',
          action: 'deleteApp',
          parameters: {
            appArn: new cr.PhysicalResourceIdReference(),
          },
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );

    // Output Resilience Hub application ARN
    new cdk.CfnOutput(this, 'ResilienceHubAppArn', {
      value: resilienceHubApp.getResponseField('app.appArn'),
      description: 'The ARN of the Resilience Hub application',
    });
  }
}
```
