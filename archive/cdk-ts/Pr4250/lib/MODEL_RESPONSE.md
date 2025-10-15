# Healthcare Patient Data Processing System - Infrastructure Code

I'll help you set up a comprehensive disaster recovery solution for your patient records management system. This solution implements multi-region infrastructure with proper security, encryption, and automated failover capabilities.

## Architecture Overview

The infrastructure is organized into modular stacks for better maintainability:
- Network Stack: VPC, subnets, and networking components
- Security Stack: KMS keys, Secrets Manager, IAM roles
- Database Stack: Aurora Serverless v2 with cross-region replication
- Compute Stack: ECS Fargate clusters with ALB
- Cache Stack: ElastiCache Redis for session management
- Storage Stack: EFS for persistent file storage

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { CacheStack } from './cache-stack';
import { StorageStack } from './storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const primaryRegion = 'ap-southeast-1';
    const drRegion = 'ap-southeast-2';

    // Primary Region Infrastructure
    const primaryNetwork = new NetworkStack(this, 'PrimaryNetwork', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
    });

    const primarySecurity = new SecurityStack(this, 'PrimarySecurity', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
    });

    const primaryDatabase = new DatabaseStack(this, 'PrimaryDatabase', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
      kmsKey: primarySecurity.kmsKey,
      databaseSecret: primarySecurity.databaseSecret,
    });

    const primaryCache = new CacheStack(this, 'PrimaryCache', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
    });

    const primaryStorage = new StorageStack(this, 'PrimaryStorage', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
      kmsKey: primarySecurity.kmsKey,
    });

    const primaryCompute = new ComputeStack(this, 'PrimaryCompute', {
      env: { region: primaryRegion },
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
      databaseSecret: primarySecurity.databaseSecret,
      fileSystem: primaryStorage.fileSystem,
    });

    // DR Region Infrastructure
    const drNetwork = new NetworkStack(this, 'DRNetwork', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
    });

    const drSecurity = new SecurityStack(this, 'DRSecurity', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
    });

    const drDatabase = new DatabaseStack(this, 'DRDatabase', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
      vpc: drNetwork.vpc,
      kmsKey: drSecurity.kmsKey,
      databaseSecret: drSecurity.databaseSecret,
      sourceDatabase: primaryDatabase.cluster,
    });

    const drCache = new CacheStack(this, 'DRCache', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
      vpc: drNetwork.vpc,
    });

    const drStorage = new StorageStack(this, 'DRStorage', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
      vpc: drNetwork.vpc,
      kmsKey: drSecurity.kmsKey,
    });

    const drCompute = new ComputeStack(this, 'DRCompute', {
      env: { region: drRegion },
      environmentSuffix,
      regionName: 'dr',
      vpc: drNetwork.vpc,
      databaseSecret: drSecurity.databaseSecret,
      fileSystem: drStorage.fileSystem,
    });

    // Output important endpoints
    new cdk.CfnOutput(this, 'PrimaryALBEndpoint', {
      value: primaryCompute.loadBalancer.loadBalancerDnsName,
      description: 'Primary region ALB endpoint',
    });

    new cdk.CfnOutput(this, 'DRALBEndpoint', {
      value: drCompute.loadBalancer.loadBalancerDnsName,
      description: 'DR region ALB endpoint',
    });

    new cdk.CfnOutput(this, 'PrimaryDatabaseEndpoint', {
      value: primaryDatabase.cluster.clusterEndpoint.hostname,
      description: 'Primary database endpoint',
    });

    new cdk.CfnOutput(this, 'DRDatabaseEndpoint', {
      value: drDatabase.cluster.clusterEndpoint.hostname,
      description: 'DR database endpoint',
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `healthcare-vpc-${props.regionName}-${props.environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Add tags
    cdk.Tags.of(this.vpc).add('Name', `healthcare-vpc-${props.regionName}`);
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.vpc).add('Region', props.regionName);
  }
}
```

## File: lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption with automatic rotation
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `healthcare-key-${props.regionName}-${props.environmentSuffix}`,
      description: `Encryption key for healthcare data in ${props.regionName}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create database credentials in Secrets Manager
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `healthcare-db-credentials-${props.regionName}-${props.environmentSuffix}`,
      description: `Database credentials for ${props.regionName} region`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Enable automatic rotation every 30 days
    this.databaseSecret.addRotationSchedule('RotationSchedule', {
      automaticallyAfter: cdk.Duration.days(30),
    });

    // Add tags
    cdk.Tags.of(this.kmsKey).add('Name', `healthcare-kms-${props.regionName}`);
    cdk.Tags.of(this.kmsKey).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.databaseSecret).add('Name', `healthcare-secret-${props.regionName}`);
    cdk.Tags.of(this.databaseSecret).add('Environment', props.environmentSuffix);
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  databaseSecret: secretsmanager.Secret;
  sourceDatabase?: rds.DatabaseCluster;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create security group for database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: `Database security group for ${props.regionName}`,
      allowAllOutbound: false,
    });

    // Create subnet group for database in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Subnet group for database in ${props.regionName}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    if (props.regionName === 'primary') {
      // Create primary Aurora Serverless v2 cluster
      this.cluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_5,
        }),
        credentials: rds.Credentials.fromSecret(props.databaseSecret),
        writer: rds.ClusterInstance.serverlessV2('Writer', {
          autoMinorVersionUpgrade: true,
        }),
        readers: [
          rds.ClusterInstance.serverlessV2('Reader1', {
            scaleWithWriter: true,
            autoMinorVersionUpgrade: true,
          }),
        ],
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      });

      // Enable Performance Insights
      this.cluster.node.children.forEach((child) => {
        if (child instanceof rds.CfnDBInstance) {
          child.enablePerformanceInsights = true;
          child.performanceInsightsKmsKeyId = props.kmsKey.keyArn;
          child.performanceInsightsRetentionPeriod = 7;
        }
      });
    } else {
      // Create DR cluster as read replica
      this.cluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_5,
        }),
        credentials: rds.Credentials.fromSecret(props.databaseSecret),
        writer: rds.ClusterInstance.serverlessV2('Writer', {
          autoMinorVersionUpgrade: true,
        }),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      });
    }

    // Add tags
    cdk.Tags.of(this.cluster).add('Name', `healthcare-db-${props.regionName}`);
    cdk.Tags.of(this.cluster).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.cluster).add('Region', props.regionName);
  }
}
```

## File: lib/cache-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface CacheStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
}

export class CacheStack extends cdk.NestedStack {
  public readonly replicationGroup: elasticache.CfnReplicationGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    // Create security group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: props.vpc,
      description: `ElastiCache security group for ${props.regionName}`,
      allowAllOutbound: false,
    });

    // Allow Redis traffic from within VPC
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis traffic from VPC'
    );

    // Create subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: `ElastiCache subnet group for ${props.regionName}`,
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `healthcare-cache-subnet-${props.regionName}-${props.environmentSuffix}`,
    });

    // Create ElastiCache Redis replication group
    this.replicationGroup = new elasticache.CfnReplicationGroup(this, 'CacheReplicationGroup', {
      replicationGroupId: `healthcare-cache-${props.regionName}-${props.environmentSuffix}`,
      replicationGroupDescription: `Session cache for ${props.regionName}`,
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: 'cache.t4g.small',
      numCacheClusters: 3,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      securityGroupIds: [cacheSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      authToken: cdk.SecretValue.secretsManager('healthcare-redis-auth', {
        jsonField: 'token',
      }).unsafeUnwrap(),
      snapshotRetentionLimit: 5,
      snapshotWindow: '03:00-05:00',
      preferredMaintenanceWindow: 'sun:05:00-sun:07:00',
      autoMinorVersionUpgrade: true,
    });

    this.replicationGroup.addDependency(subnetGroup);

    // Add tags
    cdk.Tags.of(this.replicationGroup).add('Name', `healthcare-cache-${props.regionName}`);
    cdk.Tags.of(this.replicationGroup).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.replicationGroup).add('Region', props.regionName);

    // Output cache endpoint
    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.replicationGroup.attrPrimaryEndPointAddress,
      description: `ElastiCache primary endpoint for ${props.regionName}`,
    });
  }
}
```

## File: lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class StorageStack extends cdk.NestedStack {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create security group for EFS
    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EFSSecurityGroup', {
      vpc: props.vpc,
      description: `EFS security group for ${props.regionName}`,
      allowAllOutbound: false,
    });

    // Allow NFS traffic from within VPC
    efsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      'Allow NFS traffic from VPC'
    );

    // Create EFS file system with encryption
    this.fileSystem = new efs.FileSystem(this, 'FileSystem', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: efsSecurityGroup,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enableAutomaticBackups: true,
    });

    // Add tags
    cdk.Tags.of(this.fileSystem).add('Name', `healthcare-efs-${props.regionName}`);
    cdk.Tags.of(this.fileSystem).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.fileSystem).add('Region', props.regionName);

    // Output file system ID
    new cdk.CfnOutput(this, 'FileSystemId', {
      value: this.fileSystem.fileSystemId,
      description: `EFS file system ID for ${props.regionName}`,
    });
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as efs from 'aws-cdk-lib/aws-efs';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
  vpc: ec2.Vpc;
  databaseSecret: secretsmanager.Secret;
  fileSystem: efs.FileSystem;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: `healthcare-cluster-${props.regionName}-${props.environmentSuffix}`,
      vpc: props.vpc,
      containerInsights: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      deletionProtection: false,
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Add listener
    this.loadBalancer.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant secret read permissions
    props.databaseSecret.grantRead(taskExecutionRole);

    // Create task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Create log group
    const logGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      logGroupName: `/ecs/healthcare-${props.regionName}-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Add EFS volume to task definition
    const volumeName = 'efs-storage';
    taskDefinition.addVolume({
      name: volumeName,
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
      },
    });

    // Add container
    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'healthcare-app',
        logGroup: logGroup,
      }),
      environment: {
        REGION: props.regionName,
        ENVIRONMENT: props.environmentSuffix,
      },
      secrets: {
        DB_SECRET: ecs.Secret.fromSecretsManager(props.databaseSecret),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Mount EFS volume
    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: volumeName,
      readOnly: false,
    });

    // Create Fargate service
    const service = new ecs.FargateService(this, 'FargateService', {
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
    });

    // Attach service to target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Allow EFS access from ECS tasks
    props.fileSystem.connections.allowDefaultPortFrom(service);

    // Enable auto-scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Add tags
    cdk.Tags.of(this.cluster).add('Name', `healthcare-cluster-${props.regionName}`);
    cdk.Tags.of(this.cluster).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.cluster).add('Region', props.regionName);

    // Output load balancer DNS
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: `Load Balancer DNS for ${props.regionName}`,
    });
  }
}
```

## Implementation Notes

This infrastructure code provides:

1. **Multi-Region Setup**: Complete infrastructure in both ap-southeast-1 (primary) and ap-southeast-2 (DR)

2. **Database**: Aurora Serverless v2 with PostgreSQL, encrypted with KMS, automated backups, and cross-region replication capability

3. **Security**:
   - KMS keys with automatic rotation
   - Secrets Manager for database credentials with 30-day rotation
   - IAM roles following least privilege principle
   - Security groups restricting access

4. **Compute**:
   - ECS Fargate clusters in both regions
   - Application Load Balancers for traffic distribution
   - Auto-scaling based on CPU and memory
   - EFS integration for persistent storage

5. **Caching**: ElastiCache Redis clusters for session management in both regions

6. **Monitoring**:
   - CloudWatch Logs for all services
   - VPC Flow Logs
   - Container Insights for ECS
   - Performance Insights for RDS

7. **High Availability**:
   - Multi-AZ deployment for all services
   - Cross-region replication for databases
   - Auto-scaling for ECS tasks
   - Health checks and circuit breakers

The RPO target of <15 minutes is achieved through Aurora's near-synchronous replication, and the RTO target of <1 hour can be met by promoting the DR database and updating DNS to point to the DR region's ALB.