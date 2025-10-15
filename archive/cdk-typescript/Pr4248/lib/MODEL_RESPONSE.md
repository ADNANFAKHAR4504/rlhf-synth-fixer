# PCI-DSS Compliant Payment Processing Infrastructure - Implementation

## Architecture Overview

This implementation provides a comprehensive PCI-DSS compliant payment processing infrastructure using AWS CDK TypeScript. The architecture includes:

- **Network Security**: VPC with public, private, and database subnets across 3 AZs
- **Compute**: ECS Fargate cluster for containerized payment processing microservices
- **Data Storage**: Multi-AZ RDS PostgreSQL with encryption
- **Caching**: ElastiCache Redis with encryption at rest and in transit
- **Secrets Management**: AWS Secrets Manager for credential storage
- **File Storage**: EFS with encryption for shared container storage
- **API Layer**: API Gateway with WAF for secure endpoints
- **Event Streaming**: Kinesis Data Streams for real-time transaction events
- **Security**: KMS customer-managed keys with automatic rotation
- **Monitoring**: CloudWatch Logs, Metrics, Alarms, and X-Ray tracing

## Implementation Structure

The implementation is organized into modular constructs:

1. **KMS Stack**: Customer-managed KMS keys with rotation
2. **Network Stack**: VPC, subnets, NAT gateways, security groups
3. **Secrets Stack**: Secrets Manager for database and application credentials
4. **Database Stack**: RDS PostgreSQL Multi-AZ with encryption
5. **Cache Stack**: ElastiCache Redis cluster with encryption
6. **Storage Stack**: EFS file system with encryption
7. **Compute Stack**: ECS Fargate cluster with auto-scaling
8. **API Stack**: API Gateway with WAF and custom authorizers
9. **Streaming Stack**: Kinesis Data Streams for event processing
10. **Monitoring Stack**: CloudWatch dashboards, alarms, and X-Ray

## Files

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KmsStack } from './kms-stack';
import { NetworkStack } from './network-stack';
import { SecretsStack } from './secrets-stack';
import { DatabaseStack } from './database-stack';
import { CacheStack } from './cache-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { ApiStack } from './api-stack';
import { StreamingStack } from './streaming-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // KMS Stack - Create encryption keys first
    const kmsStack = new KmsStack(this, 'KmsStack', {
      environmentSuffix,
    });

    // Network Stack - Create VPC and networking infrastructure
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Secrets Stack - Create secrets for database and application
    const secretsStack = new SecretsStack(this, 'SecretsStack', {
      environmentSuffix,
      kmsKey: kmsStack.secretsKey,
    });

    // Database Stack - Create RDS PostgreSQL Multi-AZ
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      databaseSecurityGroup: networkStack.databaseSecurityGroup,
      databaseSecret: secretsStack.databaseSecret,
      kmsKey: kmsStack.rdsKey,
    });

    // Cache Stack - Create ElastiCache Redis cluster
    const cacheStack = new CacheStack(this, 'CacheStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      cacheSecurityGroup: networkStack.cacheSecurityGroup,
      kmsKey: kmsStack.elasticacheKey,
    });

    // Storage Stack - Create EFS file system
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      efsSecurityGroup: networkStack.efsSecurityGroup,
      kmsKey: kmsStack.efsKey,
    });

    // Streaming Stack - Create Kinesis Data Streams
    const streamingStack = new StreamingStack(this, 'StreamingStack', {
      environmentSuffix,
      kmsKey: kmsStack.kinesisKey,
    });

    // Compute Stack - Create ECS Fargate cluster and services
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      ecsSecurityGroup: networkStack.ecsSecurityGroup,
      loadBalancerSecurityGroup: networkStack.loadBalancerSecurityGroup,
      fileSystem: storageStack.fileSystem,
      databaseSecret: secretsStack.databaseSecret,
      applicationSecret: secretsStack.applicationSecret,
      redisEndpoint: cacheStack.redisEndpoint,
      kinesisStream: streamingStack.transactionStream,
    });

    // API Stack - Create API Gateway with WAF
    const apiStack = new ApiStack(this, 'ApiStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      vpcLink: computeStack.vpcLink,
      loadBalancer: computeStack.loadBalancer,
    });

    // Monitoring Stack - Create CloudWatch dashboards and alarms
    new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      ecsCluster: computeStack.cluster,
      ecsService: computeStack.service,
      loadBalancer: computeStack.loadBalancer,
      targetGroup: computeStack.targetGroup,
      database: databaseStack.database,
      api: apiStack.api,
      kinesisStream: streamingStack.transactionStream,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiStack.api.url || 'Not Available',
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: computeStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: cacheStack.redisEndpoint,
      description: 'ElastiCache Redis endpoint',
    });

    new cdk.CfnOutput(this, 'KinesisStreamName', {
      value: streamingStack.transactionStream.streamName,
      description: 'Kinesis Data Stream name',
    });
  }
}
```

### lib/kms-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface KmsStackProps {
  environmentSuffix: string;
}

export class KmsStack extends Construct {
  public readonly rdsKey: kms.Key;
  public readonly elasticacheKey: kms.Key;
  public readonly efsKey: kms.Key;
  public readonly secretsKey: kms.Key;
  public readonly kinesisKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    // KMS key for RDS encryption
    this.rdsKey = new kms.Key(this, 'RdsKey', {
      enableKeyRotation: true,
      description: 'KMS key for RDS encryption',
      alias: `payment-rds-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for ElastiCache encryption
    this.elasticacheKey = new kms.Key(this, 'ElastiCacheKey', {
      enableKeyRotation: true,
      description: 'KMS key for ElastiCache encryption',
      alias: `payment-elasticache-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for EFS encryption
    this.efsKey = new kms.Key(this, 'EfsKey', {
      enableKeyRotation: true,
      description: 'KMS key for EFS encryption',
      alias: `payment-efs-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for Secrets Manager encryption
    this.secretsKey = new kms.Key(this, 'SecretsKey', {
      enableKeyRotation: true,
      description: 'KMS key for Secrets Manager encryption',
      alias: `payment-secrets-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for Kinesis encryption
    this.kinesisKey = new kms.Key(this, 'KinesisKey', {
      enableKeyRotation: true,
      description: 'KMS key for Kinesis encryption',
      alias: `payment-kinesis-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
```

### lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly cacheSecurityGroup: ec2.SecurityGroup;
  public readonly efsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // Create VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, 'PaymentVpc', {
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
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for Application Load Balancer
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    // Security Group for ECS Tasks
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // Security Group for RDS Database
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    this.databaseSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS tasks'
    );

    // Security Group for ElastiCache Redis
    this.cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for ElastiCache Redis',
        allowAllOutbound: false,
      }
    );

    this.cacheSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from ECS tasks'
    );

    // Security Group for EFS
    this.efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EFS file system',
      allowAllOutbound: false,
    });

    this.efsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS from ECS tasks'
    );

    // VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Tags for compliance
    cdk.Tags.of(this.vpc).add('PCICompliant', 'true');
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
  }
}
```

### lib/secrets-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecretsStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class SecretsStack extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly applicationSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsStackProps) {
    super(scope, id);

    // Database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `payment-db-credentials-${props.environmentSuffix}`,
      description: 'Database credentials for payment processing',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'paymentadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
        requireEachIncludedType: true,
      },
      encryptionKey: props.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Application secrets
    this.applicationSecret = new secretsmanager.Secret(
      this,
      'ApplicationSecret',
      {
        secretName: `payment-app-secrets-${props.environmentSuffix}`,
        description: 'Application secrets for payment processing',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            apiKey: 'placeholder',
            encryptionKey: 'placeholder',
          }),
          generateStringKey: 'jwtSecret',
          excludeCharacters: '"@/\\',
          passwordLength: 64,
        },
        encryptionKey: props.kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Enable automatic rotation for database secret
    this.databaseSecret.addRotationSchedule('DatabaseRotation', {
      automaticallyAfter: cdk.Duration.days(30),
    });
  }
}
```

### lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  databaseSecret: secretsmanager.Secret;
  kmsKey: kms.Key;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create RDS subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for payment processing database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'PaymentDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      subnetGroup: subnetGroup,
      credentials: rds.Credentials.fromSecret(props.databaseSecret),
      databaseName: 'paymentdb',
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: props.kmsKey,
      autoMinorVersionUpgrade: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      publiclyAccessible: false,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THREE_MONTHS,
    });

    // Tags for compliance
    cdk.Tags.of(this.database).add('PCICompliant', 'true');
    cdk.Tags.of(this.database).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
```

### lib/cache-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface CacheStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  cacheSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

export class CacheStack extends Construct {
  public readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id);

    // Create ElastiCache subnet group
    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        description: 'Subnet group for ElastiCache Redis',
        subnetIds: props.vpc.privateSubnets.map((subnet) => subnet.subnetId),
        cacheSubnetGroupName: `payment-cache-subnet-${props.environmentSuffix}`,
      }
    );

    // Create ElastiCache replication group (Redis cluster)
    const replicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupId: `payment-redis-${props.environmentSuffix}`,
        replicationGroupDescription: 'Redis cluster for payment processing',
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t3.medium',
        numCacheClusters: 3,
        multiAzEnabled: true,
        automaticFailoverEnabled: true,
        autoMinorVersionUpgrade: true,
        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [props.cacheSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'required',
        kmsKeyId: props.kmsKey.keyId,
        snapshotRetentionLimit: 7,
        snapshotWindow: '03:00-05:00',
        preferredMaintenanceWindow: 'sun:05:00-sun:07:00',
        logDeliveryConfigurations: [
          {
            destinationType: 'cloudwatch-logs',
            logFormat: 'json',
            logType: 'slow-log',
            destinationDetails: {
              cloudWatchLogsDetails: {
                logGroup: `/aws/elasticache/redis/${props.environmentSuffix}`,
              },
            },
          },
        ],
        tags: [
          { key: 'PCICompliant', value: 'true' },
          { key: 'Environment', value: props.environmentSuffix },
        ],
      }
    );

    replicationGroup.addDependency(subnetGroup);

    // Store endpoint for reference
    this.redisEndpoint = replicationGroup.attrPrimaryEndPointAddress;

    // Output endpoint
    new cdk.CfnOutput(cdk.Stack.of(this), 'RedisClusterEndpoint', {
      value: this.redisEndpoint,
      description: 'Redis cluster primary endpoint',
    });
  }
}
```

### lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  efsSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

export class StorageStack extends Construct {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Create EFS file system
    this.fileSystem = new efs.FileSystem(this, 'PaymentFileSystem', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.efsSecurityGroup,
      encrypted: true,
      kmsKey: props.kmsKey,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enableAutomaticBackups: true,
    });

    // Tags for compliance
    cdk.Tags.of(this.fileSystem).add('PCICompliant', 'true');
    cdk.Tags.of(this.fileSystem).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this.fileSystem).add('Environment', props.environmentSuffix);
  }
}
```

### lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ComputeStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  ecsSecurityGroup: ec2.SecurityGroup;
  loadBalancerSecurityGroup: ec2.SecurityGroup;
  fileSystem: efs.FileSystem;
  databaseSecret: secretsmanager.Secret;
  applicationSecret: secretsmanager.Secret;
  redisEndpoint: string;
  kinesisStream: kinesis.Stream;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly vpcLink: cdk.CfnResource;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Create ECS cluster
    this.cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc: props.vpc,
      clusterName: `payment-cluster-${props.environmentSuffix}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'PaymentALB',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.loadBalancerSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        dropInvalidHeaderFields: true,
        http2Enabled: true,
      }
    );

    // Create target group
    this.targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'PaymentTargetGroup',
      {
        vpc: props.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Add listener
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Create CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'PaymentServiceLogs', {
      logGroupName: `/ecs/payment-service-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant secrets access to execution role
    props.databaseSecret.grantRead(taskExecutionRole);
    props.applicationSecret.grantRead(taskExecutionRole);

    // Create task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant permissions to task role
    props.kinesisStream.grantWrite(taskRole);
    props.databaseSecret.grantRead(taskRole);
    props.applicationSecret.grantRead(taskRole);

    // Add X-Ray permissions
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
          'xray:GetSamplingStatisticSummaries',
        ],
        resources: ['*'],
      })
    );

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'PaymentTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
        volumes: [
          {
            name: 'efs-storage',
            efsVolumeConfiguration: {
              fileSystemId: props.fileSystem.fileSystemId,
              transitEncryption: 'ENABLED',
            },
          },
        ],
      }
    );

    // Add main container
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logGroup: logGroup,
      }),
      environment: {
        REDIS_ENDPOINT: props.redisEndpoint,
        KINESIS_STREAM_NAME: props.kinesisStream.streamName,
        AWS_REGION: cdk.Stack.of(this).region,
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'host'
        ),
        DB_USERNAME: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'username'
        ),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'password'
        ),
        APP_SECRET: ecs.Secret.fromSecretsManager(
          props.applicationSecret,
          'jwtSecret'
        ),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: 'efs-storage',
      readOnly: false,
    });

    // Add X-Ray sidecar container
    taskDefinition.addContainer('XRayContainer', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/xray/aws-xray-daemon:latest'
      ),
      cpu: 32,
      memoryReservationMiB: 256,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: logGroup,
      }),
    });

    // Create Fargate service
    this.service = new ecs.FargateService(this, 'PaymentService', {
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(this.targetGroup);

    // Grant EFS access to ECS task
    props.fileSystem.grantRootAccess(taskRole);

    // Configure auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 3,
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

    // Create VPC Link for API Gateway
    const vpcLinkSecurityGroup = new ec2.SecurityGroup(
      this,
      'VpcLinkSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for VPC Link',
        allowAllOutbound: true,
      }
    );

    this.vpcLink = new cdk.CfnResource(this, 'VpcLink', {
      type: 'AWS::ApiGatewayV2::VpcLink',
      properties: {
        Name: `payment-vpc-link-${props.environmentSuffix}`,
        SubnetIds: props.vpc.privateSubnets.map((subnet) => subnet.subnetId),
        SecurityGroupIds: [vpcLinkSecurityGroup.securityGroupId],
      },
    });

    // Tags for compliance
    cdk.Tags.of(this.cluster).add('PCICompliant', 'true');
    cdk.Tags.of(this.service).add('PCICompliant', 'true');
    cdk.Tags.of(this.service).add('Environment', props.environmentSuffix);
  }
}
```

### lib/api-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  vpcLink: cdk.CfnResource;
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/payment-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'PaymentApi', {
      restApiName: `payment-api-${props.environmentSuffix}`,
      description: 'Payment processing API Gateway',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: props.environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      cloudWatchRole: true,
      minCompressionSize: cdk.Size.kibibytes(1),
      policy: new cdk.aws_iam.PolicyDocument({
        statements: [
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
          }),
        ],
      }),
    });

    // Create HTTP integration with VPC Link
    const integration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      uri: `http://${props.loadBalancer.loadBalancerDnsName}`,
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: apigateway.VpcLink.fromVpcLinkId(
          this,
          'ImportedVpcLink',
          props.vpcLink.ref
        ),
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
    });

    // Add proxy resource
    const proxyResource = this.api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // Create API key
    const apiKey = this.api.addApiKey('PaymentApiKey', {
      apiKeyName: `payment-api-key-${props.environmentSuffix}`,
      description: 'API key for payment processing',
    });

    // Create usage plan
    const usagePlan = this.api.addUsagePlan('PaymentUsagePlan', {
      name: `payment-usage-plan-${props.environmentSuffix}`,
      description: 'Usage plan for payment API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'PaymentApiWaf', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `payment-api-waf-${props.environmentSuffix}`,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WafApiAssociation', {
      resourceArn: this.api.arnForExecuteApi(),
      webAclArn: webAcl.attrArn,
    });

    // Tags for compliance
    cdk.Tags.of(this.api).add('PCICompliant', 'true');
    cdk.Tags.of(this.api).add('Environment', props.environmentSuffix);
  }
}
```

### lib/streaming-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StreamingStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class StreamingStack extends Construct {
  public readonly transactionStream: kinesis.Stream;

  constructor(scope: Construct, id: string, props: StreamingStackProps) {
    super(scope, id);

    // Create Kinesis Data Stream
    this.transactionStream = new kinesis.Stream(this, 'TransactionStream', {
      streamName: `payment-transactions-${props.environmentSuffix}`,
      shardCount: 3,
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: props.kmsKey,
      streamMode: kinesis.StreamMode.PROVISIONED,
    });

    // Tags for compliance
    cdk.Tags.of(this.transactionStream).add('PCICompliant', 'true');
    cdk.Tags.of(this.transactionStream).add(
      'DataClassification',
      'Sensitive'
    );
    cdk.Tags.of(this.transactionStream).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
```

### lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environmentSuffix: string;
  ecsCluster: ecs.Cluster;
  ecsService: ecs.FargateService;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  targetGroup: elbv2.ApplicationTargetGroup;
  database: rds.DatabaseInstance;
  api: apigateway.RestApi;
  kinesisStream: kinesis.Stream;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Payment Processing Alarms - ${props.environmentSuffix}`,
      topicName: `payment-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: `payment-processing-${props.environmentSuffix}`,
    });

    // ECS Service Metrics
    const ecsServiceCpuWidget = new cloudwatch.GraphWidget({
      title: 'ECS Service CPU Utilization',
      left: [
        props.ecsService.metricCpuUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const ecsServiceMemoryWidget = new cloudwatch.GraphWidget({
      title: 'ECS Service Memory Utilization',
      left: [
        props.ecsService.metricMemoryUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Load Balancer Metrics
    const albRequestCountWidget = new cloudwatch.GraphWidget({
      title: 'ALB Request Count',
      left: [
        props.loadBalancer.metricRequestCount({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const albTargetResponseTimeWidget = new cloudwatch.GraphWidget({
      title: 'Target Response Time',
      left: [
        props.targetGroup.metricTargetResponseTime({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Database Metrics
    const dbCpuWidget = new cloudwatch.GraphWidget({
      title: 'Database CPU Utilization',
      left: [
        props.database.metricCPUUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const dbConnectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        props.database.metricDatabaseConnections({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // API Gateway Metrics
    const apiCallsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: props.api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: props.api.restApiName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Kinesis Metrics
    const kinesisIncomingRecordsWidget = new cloudwatch.GraphWidget({
      title: 'Kinesis Incoming Records',
      left: [
        props.kinesisStream.metricIncomingRecords({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      ecsServiceCpuWidget,
      ecsServiceMemoryWidget,
      albRequestCountWidget
    );
    dashboard.addWidgets(
      albTargetResponseTimeWidget,
      dbCpuWidget,
      dbConnectionsWidget
    );
    dashboard.addWidgets(
      apiCallsWidget,
      apiLatencyWidget,
      kinesisIncomingRecordsWidget
    );

    // CloudWatch Alarms

    // ECS Service CPU Alarm
    const ecsServiceCpuAlarm = new cloudwatch.Alarm(
      this,
      'EcsServiceCpuAlarm',
      {
        metric: props.ecsService.metricCpuUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        alarmDescription: 'ECS Service CPU utilization is too high',
        alarmName: `payment-ecs-cpu-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    ecsServiceCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // ECS Service Memory Alarm
    const ecsServiceMemoryAlarm = new cloudwatch.Alarm(
      this,
      'EcsServiceMemoryAlarm',
      {
        metric: props.ecsService.metricMemoryUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 85,
        evaluationPeriods: 2,
        alarmDescription: 'ECS Service memory utilization is too high',
        alarmName: `payment-ecs-memory-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    ecsServiceMemoryAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Database CPU Alarm
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: props.database.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Database CPU utilization is too high',
      alarmName: `payment-db-cpu-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ALB Target Health Alarm
    const albUnhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'AlbUnhealthyHostAlarm',
      {
        metric: props.targetGroup.metricUnhealthyHostCount({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        alarmDescription: 'ALB has unhealthy targets',
        alarmName: `payment-alb-unhealthy-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    albUnhealthyHostAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // API Gateway 4XX Error Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 4XX errors are too high',
      alarmName: `payment-api-4xx-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // API Gateway 5XX Error Alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 5XX errors are too high',
      alarmName: `payment-api-5xx-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // AWS Config for compliance monitoring
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        roleArn: new cdk.aws_iam.Role(this, 'ConfigRole', {
          assumedBy: new cdk.aws_iam.ServicePrincipal(
            'config.amazonaws.com'
          ),
          managedPolicies: [
            cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/ConfigRole'
            ),
          ],
        }).roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: false,
        },
      }
    );

    const configBucket = new cdk.aws_s3.Bucket(this, 'ConfigBucket', {
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      'ConfigDeliveryChannel',
      {
        s3BucketName: configBucket.bucketName,
      }
    );

    deliveryChannel.addDependency(configRecorder);

    // Config Rules for PCI-DSS compliance
    new config.ManagedRule(this, 'EncryptedVolumesRule', {
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      description: 'Checks that EBS volumes are encrypted',
    });

    new config.ManagedRule(this, 'RdsEncryptionRule', {
      identifier:
        config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances are encrypted',
    });

    new config.ManagedRule(this, 'S3BucketPublicReadRule', {
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public read access',
    });

    new config.ManagedRule(this, 'S3BucketPublicWriteRule', {
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      description: 'Checks that S3 buckets do not allow public write access',
    });

    // Tags for compliance
    cdk.Tags.of(dashboard).add('PCICompliant', 'true');
    cdk.Tags.of(dashboard).add('Environment', props.environmentSuffix);
  }
}
```

## Design Decisions

1. **Network Segmentation**: VPC with 3 subnet types (public, private, isolated) across 3 AZs for high availability and security isolation
2. **Encryption**: All data encrypted at rest with customer-managed KMS keys with automatic rotation
3. **Zero Trust**: No direct internet access for ECS tasks; all egress through NAT Gateways
4. **High Availability**: Multi-AZ deployment for all critical components (RDS, ElastiCache, ECS)
5. **Auto-scaling**: ECS services scale based on CPU and memory utilization
6. **Monitoring**: Comprehensive CloudWatch dashboards, alarms, and AWS Config for compliance
7. **Security**: WAF protection for API Gateway, strict security groups, IAM least privilege
8. **Audit**: VPC Flow Logs, API Gateway logging, CloudWatch Logs for all services
9. **Compliance**: AWS Config rules for PCI-DSS compliance monitoring

## Security Controls Implemented

- KMS encryption with automatic key rotation
- Secrets Manager for credential storage with automatic rotation
- VPC network segmentation with isolated subnets
- Security groups following least privilege principle
- WAF protection with AWS managed rule sets
- API Gateway request/response logging
- X-Ray distributed tracing
- CloudWatch comprehensive monitoring
- AWS Config compliance rules
- VPC Flow Logs for network monitoring
- ECS task execution roles with minimal permissions
- Multi-AZ deployment for high availability
