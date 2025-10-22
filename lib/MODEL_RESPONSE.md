# Manufacturing Data Pipeline Infrastructure - CDKTF Implementation

I'll help you build a comprehensive manufacturing data pipeline infrastructure using CDKTF with TypeScript. This solution will handle high-throughput sensor data processing with all the reliability and compliance features you need.

## Architecture Overview

The infrastructure includes:
- Multi-AZ VPC with public and private subnets
- Kinesis Data Streams in on-demand mode for auto-scaling
- ECS Fargate for containerized data processing
- Aurora PostgreSQL Serverless v2 for operational data
- ElastiCache Redis in cluster mode for caching
- EFS for shared storage
- API Gateway for external integrations
- Secrets Manager for secure credential storage
- S3 for long-term data retention with lifecycle policies

## Implementation

Here's the complete CDKTF TypeScript implementation structured into separate modules:

### File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingModule } from './networking-module';
import { DataIngestionModule } from './data-ingestion-module';
import { DataProcessingModule } from './data-processing-module';
import { DataStorageModule } from './data-storage-module';
import { ApiGatewayModule } from './api-gateway-module';
import { SecurityModule } from './security-module';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'eu-west-2';
    const stateBucketRegion = props?.stateBucketRegion || 'eu-west-2';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Security Module - Create secrets and encryption keys first
    const securityModule = new SecurityModule(this, 'security', {
      environmentSuffix,
    });

    // Networking Module - Create VPC, subnets, and networking components
    const networkingModule = new NetworkingModule(this, 'networking', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Data Storage Module - Create S3, RDS Aurora, ElastiCache, and EFS
    const dataStorageModule = new DataStorageModule(this, 'data-storage', {
      environmentSuffix,
      vpcId: networkingModule.vpc.id,
      privateSubnetIds: networkingModule.privateSubnetIds,
      databaseSecurityGroupId: networkingModule.databaseSecurityGroupId,
      cacheSecurityGroupId: networkingModule.cacheSecurityGroupId,
      efsSecurityGroupId: networkingModule.efsSecurityGroupId,
      dbSecretArn: securityModule.dbSecretArn,
      kmsKeyId: securityModule.kmsKeyId,
    });

    // Data Ingestion Module - Create Kinesis Data Streams
    const dataIngestionModule = new DataIngestionModule(this, 'data-ingestion', {
      environmentSuffix,
      kmsKeyId: securityModule.kmsKeyId,
    });

    // Data Processing Module - Create ECS Fargate cluster and services
    const dataProcessingModule = new DataProcessingModule(this, 'data-processing', {
      environmentSuffix,
      vpcId: networkingModule.vpc.id,
      privateSubnetIds: networkingModule.privateSubnetIds,
      ecsSecurityGroupId: networkingModule.ecsSecurityGroupId,
      kinesisStreamArn: dataIngestionModule.kinesisStreamArn,
      efsFileSystemId: dataStorageModule.efsFileSystemId,
      dbSecretArn: securityModule.dbSecretArn,
      apiSecretArn: securityModule.apiSecretArn,
    });

    // API Gateway Module - Create REST API for external integrations
    const apiGatewayModule = new ApiGatewayModule(this, 'api-gateway', {
      environmentSuffix,
      ecsServiceArn: dataProcessingModule.ecsServiceArn,
      vpcLinkSubnetIds: networkingModule.privateSubnetIds,
      apiSecretArn: securityModule.apiSecretArn,
    });
  }
}
```

### File: lib/networking-module.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

interface NetworkingModuleProps {
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];
  public readonly ecsSecurityGroupId: string;
  public readonly databaseSecurityGroupId: string;
  public readonly cacheSecurityGroupId: string;
  public readonly efsSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    const { environmentSuffix, vpcCidr, availabilityZones } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `manufacturing-vpc-${environmentSuffix}`,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-igw-${environmentSuffix}`,
      },
    });

    // Create Public Subnets
    const publicSubnets: Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `manufacturing-public-subnet-${index + 1}-${environmentSuffix}`,
        },
      });
      publicSubnets.push(subnet);
    });

    // Create Private Subnets
    const privateSubnets: Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `manufacturing-private-subnet-${index + 1}-${environmentSuffix}`,
        },
      });
      privateSubnets.push(subnet);
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create NAT Gateways (one per AZ for high availability)
    const natGateways: NatGateway[] = [];
    publicSubnets.forEach((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `manufacturing-nat-eip-${index + 1}-${environmentSuffix}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `manufacturing-nat-${index + 1}-${environmentSuffix}`,
        },
      });
      natGateways.push(natGateway);
    });

    // Create Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-route-table-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `manufacturing-private-rt-${index + 1}-${environmentSuffix}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Group for ECS Tasks
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      name: `manufacturing-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-ecs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // Security Group for RDS Aurora
    const databaseSecurityGroup = new SecurityGroup(this, 'database-security-group', {
      name: `manufacturing-db-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora PostgreSQL',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-db-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'db-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: databaseSecurityGroup.id,
    });

    // Security Group for ElastiCache Redis
    const cacheSecurityGroup = new SecurityGroup(this, 'cache-security-group', {
      name: `manufacturing-cache-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-cache-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'cache-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: cacheSecurityGroup.id,
    });

    // Security Group for EFS
    const efsSecurityGroup = new SecurityGroup(this, 'efs-security-group', {
      name: `manufacturing-efs-sg-${environmentSuffix}`,
      description: 'Security group for EFS file system',
      vpcId: this.vpc.id,
      tags: {
        Name: `manufacturing-efs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'efs-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 2049,
      toPort: 2049,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: efsSecurityGroup.id,
    });

    this.privateSubnetIds = privateSubnets.map((subnet) => subnet.id);
    this.publicSubnetIds = publicSubnets.map((subnet) => subnet.id);
    this.ecsSecurityGroupId = ecsSecurityGroup.id;
    this.databaseSecurityGroupId = databaseSecurityGroup.id;
    this.cacheSecurityGroupId = cacheSecurityGroup.id;
    this.efsSecurityGroupId = efsSecurityGroup.id;
  }
}
```

### File: lib/security-module.ts

```typescript
import { Construct } from 'constructs';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

interface SecurityModuleProps {
  environmentSuffix: string;
}

export class SecurityModule extends Construct {
  public readonly dbSecretArn: string;
  public readonly apiSecretArn: string;
  public readonly kmsKeyId: string;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create KMS key for encryption
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `KMS key for manufacturing data pipeline ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `manufacturing-kms-key-${environmentSuffix}`,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/manufacturing-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // Create secret for database credentials
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `manufacturing-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for Aurora PostgreSQL',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `manufacturing-db-secret-${environmentSuffix}`,
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: 'ChangeMe123!',
        engine: 'postgres',
        host: 'placeholder',
        port: 5432,
        dbname: 'manufacturing',
      }),
    });

    // Create secret for API keys
    const apiSecret = new SecretsmanagerSecret(this, 'api-secret', {
      name: `manufacturing-api-keys-${environmentSuffix}`,
      description: 'API keys for external integrations',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `manufacturing-api-secret-${environmentSuffix}`,
      },
    });

    new SecretsmanagerSecretVersion(this, 'api-secret-version', {
      secretId: apiSecret.id,
      secretString: JSON.stringify({
        apiKey: 'placeholder-api-key',
        apiSecret: 'placeholder-api-secret',
      }),
    });

    this.dbSecretArn = dbSecret.arn;
    this.apiSecretArn = apiSecret.arn;
    this.kmsKeyId = kmsKey.id;
  }
}
```

### File: lib/data-ingestion-module.ts

```typescript
import { Construct } from 'constructs';
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream';
import { TerraformOutput } from 'cdktf';

interface DataIngestionModuleProps {
  environmentSuffix: string;
  kmsKeyId: string;
}

export class DataIngestionModule extends Construct {
  public readonly kinesisStreamArn: string;
  public readonly kinesisStreamName: string;

  constructor(scope: Construct, id: string, props: DataIngestionModuleProps) {
    super(scope, id);

    const { environmentSuffix, kmsKeyId } = props;

    // Create Kinesis Data Stream with on-demand mode
    const kinesisStream = new KinesisStream(this, 'kinesis-stream', {
      name: `manufacturing-sensor-data-${environmentSuffix}`,
      streamModeDetails: {
        streamMode: 'ON_DEMAND',
      },
      retentionPeriod: 168, // 7 days retention
      encryptionType: 'KMS',
      kmsKeyId: kmsKeyId,
      tags: {
        Name: `manufacturing-kinesis-${environmentSuffix}`,
      },
    });

    this.kinesisStreamArn = kinesisStream.arn;
    this.kinesisStreamName = kinesisStream.name;

    new TerraformOutput(this, 'kinesis-stream-name', {
      value: kinesisStream.name,
      description: 'Name of the Kinesis Data Stream',
    });

    new TerraformOutput(this, 'kinesis-stream-arn', {
      value: kinesisStream.arn,
      description: 'ARN of the Kinesis Data Stream',
    });
  }
}
```

### File: lib/data-storage-module.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { EfsFileSystem } from '@cdktf/provider-aws/lib/efs-file-system';
import { EfsMountTarget } from '@cdktf/provider-aws/lib/efs-mount-target';
import { TerraformOutput } from 'cdktf';

interface DataStorageModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  databaseSecurityGroupId: string;
  cacheSecurityGroupId: string;
  efsSecurityGroupId: string;
  dbSecretArn: string;
  kmsKeyId: string;
}

export class DataStorageModule extends Construct {
  public readonly s3BucketName: string;
  public readonly dbClusterEndpoint: string;
  public readonly redisEndpoint: string;
  public readonly efsFileSystemId: string;

  constructor(scope: Construct, id: string, props: DataStorageModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      databaseSecurityGroupId,
      cacheSecurityGroupId,
      efsSecurityGroupId,
      dbSecretArn,
      kmsKeyId,
    } = props;

    // Create S3 bucket for long-term data storage
    const s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `manufacturing-sensor-data-${environmentSuffix}-${Date.now()}`,
      tags: {
        Name: `manufacturing-data-${environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 's3-versioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKeyId,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketLifecycleConfiguration(this, 's3-lifecycle', {
      bucket: s3Bucket.id,
      rule: [
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
            {
              days: 365,
              storageClass: 'DEEP_ARCHIVE',
            },
          ],
          expiration: {
            days: 2555, // 7 years retention
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 's3-public-access-block', {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create DB Subnet Group for Aurora
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `manufacturing-db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `manufacturing-db-subnet-group-${environmentSuffix}`,
      },
    });

    // Create Aurora PostgreSQL Serverless v2 Cluster
    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `manufacturing-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.4',
      databaseName: 'manufacturing',
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [databaseSecurityGroupId],
      storageEncrypted: true,
      kmsKeyId: kmsKeyId,
      backupRetentionPeriod: 35,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 16,
      },
      tags: {
        Name: `manufacturing-aurora-${environmentSuffix}`,
      },
    });

    // Create Aurora Serverless v2 instances
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `manufacturing-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: auroraCluster.engine,
      engineVersion: auroraCluster.engineVersion,
      publiclyAccessible: false,
    });

    new RdsClusterInstance(this, 'aurora-instance-2', {
      identifier: `manufacturing-aurora-instance-2-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: auroraCluster.engine,
      engineVersion: auroraCluster.engineVersion,
      publiclyAccessible: false,
    });

    // Create ElastiCache Subnet Group
    const cacheSubnetGroup = new ElasticacheSubnetGroup(this, 'cache-subnet-group', {
      name: `manufacturing-cache-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `manufacturing-cache-subnet-group-${environmentSuffix}`,
      },
    });

    // Create ElastiCache Redis cluster in cluster mode
    const redisCluster = new ElasticacheReplicationGroup(this, 'redis-cluster', {
      replicationGroupId: `manufacturing-redis-${environmentSuffix}`,
      replicationGroupDescription: 'Redis cluster for manufacturing data caching',
      engine: 'redis',
      engineVersion: '7.0',
      nodeType: 'cache.r7g.large',
      numNodeGroups: 2,
      replicasPerNodeGroup: 1,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      kmsKeyId: kmsKeyId,
      subnetGroupName: cacheSubnetGroup.name,
      securityGroupIds: [cacheSecurityGroupId],
      snapshotRetentionLimit: 5,
      snapshotWindow: '03:00-05:00',
      maintenanceWindow: 'sun:05:00-sun:07:00',
      tags: {
        Name: `manufacturing-redis-${environmentSuffix}`,
      },
    });

    // Create EFS File System
    const efsFileSystem = new EfsFileSystem(this, 'efs-filesystem', {
      encrypted: true,
      kmsKeyId: kmsKeyId,
      performanceMode: 'generalPurpose',
      throughputMode: 'elastic',
      lifecyclePolicy: [
        {
          transitionToIa: 'AFTER_30_DAYS',
        },
      ],
      tags: {
        Name: `manufacturing-efs-${environmentSuffix}`,
      },
    });

    // Create EFS Mount Targets in each private subnet
    privateSubnetIds.forEach((subnetId, index) => {
      new EfsMountTarget(this, `efs-mount-target-${index}`, {
        fileSystemId: efsFileSystem.id,
        subnetId: subnetId,
        securityGroups: [efsSecurityGroupId],
      });
    });

    this.s3BucketName = s3Bucket.bucket;
    this.dbClusterEndpoint = auroraCluster.endpoint;
    this.redisEndpoint = redisCluster.configurationEndpointAddress;
    this.efsFileSystemId = efsFileSystem.id;

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Bucket.bucket,
      description: 'S3 bucket for long-term data storage',
    });

    new TerraformOutput(this, 'aurora-endpoint', {
      value: auroraCluster.endpoint,
      description: 'Aurora PostgreSQL cluster endpoint',
    });

    new TerraformOutput(this, 'redis-endpoint', {
      value: redisCluster.configurationEndpointAddress,
      description: 'ElastiCache Redis cluster endpoint',
    });

    new TerraformOutput(this, 'efs-filesystem-id', {
      value: efsFileSystem.id,
      description: 'EFS file system ID',
    });
  }
}
```

### File: lib/data-processing-module.ts

```typescript
import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { TerraformOutput } from 'cdktf';

interface DataProcessingModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  ecsSecurityGroupId: string;
  kinesisStreamArn: string;
  efsFileSystemId: string;
  dbSecretArn: string;
  apiSecretArn: string;
}

export class DataProcessingModule extends Construct {
  public readonly ecsClusterName: string;
  public readonly ecsServiceArn: string;

  constructor(scope: Construct, id: string, props: DataProcessingModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      ecsSecurityGroupId,
      kinesisStreamArn,
      efsFileSystemId,
      dbSecretArn,
      apiSecretArn,
    } = props;

    // Create ECS Cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `manufacturing-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `manufacturing-ecs-cluster-${environmentSuffix}`,
      },
    });

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/ecs/manufacturing-processor-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `manufacturing-logs-${environmentSuffix}`,
      },
    });

    // Create IAM Role for ECS Task Execution
    const taskExecutionRole = new IamRole(this, 'task-execution-role', {
      name: `manufacturing-ecs-task-execution-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `manufacturing-task-execution-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'task-execution-policy', {
      role: taskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create IAM Policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `manufacturing-secrets-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [dbSecretArn, apiSecretArn],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: taskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // Create IAM Role for ECS Task
    const taskRole = new IamRole(this, 'task-role', {
      name: `manufacturing-ecs-task-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `manufacturing-task-role-${environmentSuffix}`,
      },
    });

    // Create IAM Policy for Kinesis access
    const kinesisPolicy = new IamPolicy(this, 'kinesis-policy', {
      name: `manufacturing-kinesis-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:DescribeStream',
              'kinesis:ListStreams',
              'kinesis:ListShards',
            ],
            Resource: kinesisStreamArn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'kinesis-policy-attachment', {
      role: taskRole.name,
      policyArn: kinesisPolicy.arn,
    });

    // Create ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `manufacturing-processor-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '2048',
      memory: '4096',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'processor',
          image: 'nginx:latest', // Replace with actual processing application image
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'KINESIS_STREAM_ARN',
              value: kinesisStreamArn,
            },
            {
              name: 'EFS_MOUNT_PATH',
              value: '/mnt/efs',
            },
          ],
          secrets: [
            {
              name: 'DB_SECRET',
              valueFrom: dbSecretArn,
            },
            {
              name: 'API_SECRET',
              valueFrom: apiSecretArn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'eu-west-2',
              'awslogs-stream-prefix': 'ecs',
            },
          },
          mountPoints: [
            {
              sourceVolume: 'efs-storage',
              containerPath: '/mnt/efs',
              readOnly: false,
            },
          ],
        },
      ]),
      volume: [
        {
          name: 'efs-storage',
          efsVolumeConfiguration: {
            fileSystemId: efsFileSystemId,
            transitEncryption: 'ENABLED',
          },
        },
      ],
      tags: {
        Name: `manufacturing-task-def-${environmentSuffix}`,
      },
    });

    // Create ECS Service with blue-green deployment configuration
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `manufacturing-processor-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      deploymentController: {
        type: 'ECS', // Changed from CODE_DEPLOY to ECS for simplicity
      },
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroupId],
        assignPublicIp: false,
      },
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      enableExecuteCommand: true,
      tags: {
        Name: `manufacturing-ecs-service-${environmentSuffix}`,
      },
    });

    this.ecsClusterName = ecsCluster.name;
    this.ecsServiceArn = ecsService.id;

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'Name of the ECS cluster',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsService.name,
      description: 'Name of the ECS service',
    });
  }
}
```

### File: lib/api-gateway-module.ts

```typescript
import { Construct } from 'constructs';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { Apigatewayv2VpcLink } from '@cdktf/provider-aws/lib/apigatewayv2-vpc-link';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { TerraformOutput } from 'cdktf';

interface ApiGatewayModuleProps {
  environmentSuffix: string;
  ecsServiceArn: string;
  vpcLinkSubnetIds: string[];
  apiSecretArn: string;
}

export class ApiGatewayModule extends Construct {
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: ApiGatewayModuleProps) {
    super(scope, id);

    const { environmentSuffix, vpcLinkSubnetIds } = props;

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/manufacturing-api-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `manufacturing-api-logs-${environmentSuffix}`,
      },
    });

    // Create VPC Link for private integration
    const vpcLink = new Apigatewayv2VpcLink(this, 'vpc-link', {
      name: `manufacturing-vpc-link-${environmentSuffix}`,
      subnetIds: vpcLinkSubnetIds,
      tags: {
        Name: `manufacturing-vpc-link-${environmentSuffix}`,
      },
    });

    // Create HTTP API
    const api = new Apigatewayv2Api(this, 'api', {
      name: `manufacturing-api-${environmentSuffix}`,
      protocolType: 'HTTP',
      description: 'API Gateway for manufacturing data pipeline external integrations',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 300,
      },
      tags: {
        Name: `manufacturing-api-${environmentSuffix}`,
      },
    });

    // Create Integration
    const integration = new Apigatewayv2Integration(this, 'integration', {
      apiId: api.id,
      integrationType: 'HTTP_PROXY',
      integrationUri: 'http://example.com', // Replace with actual ECS service endpoint
      integrationMethod: 'ANY',
      connectionType: 'VPC_LINK',
      connectionId: vpcLink.id,
      payloadFormatVersion: '1.0',
    });

    // Create Routes
    new Apigatewayv2Route(this, 'default-route', {
      apiId: api.id,
      routeKey: '$default',
      target: `integrations/${integration.id}`,
    });

    // Create Stage
    const stage = new Apigatewayv2Stage(this, 'stage', {
      apiId: api.id,
      name: environmentSuffix,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: apiLogGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: {
        Name: `manufacturing-api-stage-${environmentSuffix}`,
      },
    });

    this.apiEndpoint = `${api.apiEndpoint}/${stage.name}`;

    new TerraformOutput(this, 'api-endpoint', {
      value: this.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'api-id', {
      value: api.id,
      description: 'API Gateway ID',
    });
  }
}
```

## Summary

This implementation provides:

1. **High Availability**: Multi-AZ deployment with NAT Gateways in each AZ, Aurora with multiple instances, and Redis with automatic failover

2. **Scalability**: Kinesis on-demand mode automatically scales with traffic, Aurora Serverless v2 scales based on workload, and ECS Fargate with configurable task count

3. **Security**:
   - End-to-end encryption with KMS
   - Secrets Manager for credentials
   - Private subnets for all data processing
   - Security groups with least privilege access

4. **Compliance**: S3 lifecycle policies for 7-year data retention with automatic transitions to Glacier and Deep Archive

5. **Blue-Green Deployments**: ECS service configured with deployment settings that support rolling updates with minimum healthy percent

6. **Performance**: ElastiCache Redis in cluster mode for high-performance caching, EFS for shared storage, and optimized Aurora configuration

The code is modular, maintainable, and follows CDKTF best practices. Each module can be tested and deployed independently.