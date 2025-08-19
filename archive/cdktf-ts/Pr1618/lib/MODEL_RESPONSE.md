I'll create a comprehensive CDKTF TypeScript solution for your multi-environment AWS setup with PCI DSS compliance. This will be a production-ready infrastructure with proper separation of concerns.

## Project Structure

```
├── main.ts
│   ├── vpc
│   ├── rds
│   ├── dynamodb
│   ├── s3
│   ├── cloudfront
│   ├── route53
│   ├── iam
├── cdktf.json
└── package.json
```

## 1. Package Configuration

**package.json**

```json
{
  "name": "multi-region-aws-cdktf",
  "version": "1.0.0",
  "main": "main.js",
  "types": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "upgrade": "npm i cdktf@latest cdktf-cli@latest",
    "upgrade:next": "npm i cdktf@next cdktf-cli@next"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0",
    "@cdktf/provider-aws": "^19.0.0"
  }
}
```

**cdktf.json**

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "multi-region-aws-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## 2. VPC

```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
} from '@cdktf/provider-aws/lib/vpc';

export interface VpcConfig {
  region: string;
  environment: string;
  cidrBlock: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly databaseSubnets: Subnet[];
  public readonly securityGroups: { [key: string]: SecurityGroup };

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.environment}-vpc-${config.region}`,
        Environment: config.environment,
        Region: config.region,
        'PCI-DSS': 'true',
      },
    });

    // Availability Zones
    const azs = [`${config.region}a`, `${config.region}b`, `${config.region}c`];

    // Public Subnets
    this.publicSubnets = azs.map(
      (az, index) =>
        new Subnet(this, `public-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: this.calculateSubnetCidr(config.cidrBlock, index),
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${config.environment}-public-subnet-${az}`,
            Type: 'Public',
            Environment: config.environment,
            'PCI-DSS': 'true',
          },
        })
    );

    // Private Subnets
    this.privateSubnets = azs.map(
      (az, index) =>
        new Subnet(this, `private-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: this.calculateSubnetCidr(config.cidrBlock, index + 3),
          availabilityZone: az,
          tags: {
            Name: `${config.environment}-private-subnet-${az}`,
            Type: 'Private',
            Environment: config.environment,
            'PCI-DSS': 'true',
          },
        })
    );

    // Database Subnets
    this.databaseSubnets = azs.map(
      (az, index) =>
        new Subnet(this, `database-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: this.calculateSubnetCidr(config.cidrBlock, index + 6),
          availabilityZone: az,
          tags: {
            Name: `${config.environment}-database-subnet-${az}`,
            Type: 'Database',
            Environment: config.environment,
            'PCI-DSS': 'true',
          },
        })
    );

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-igw-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    // NAT Gateways (one per AZ for HA)
    const natGateways = this.publicSubnets.map((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `${config.environment}-nat-eip-${azs[index]}`,
          Environment: config.environment,
          'PCI-DSS': 'true',
        },
      });

      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `${config.environment}-nat-gateway-${azs[index]}`,
          Environment: config.environment,
          'PCI-DSS': 'true',
        },
      });
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-public-rt-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables (one per AZ for HA)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${config.environment}-private-rt-${azs[index]}`,
            Environment: config.environment,
            'PCI-DSS': 'true',
          },
        }
      );

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

    // Security Groups
    this.securityGroups = this.createSecurityGroups(config);
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const baseIp = vpcCidr.split('/')[0];
    const baseOctets = baseIp.split('.').map(Number);
    baseOctets[2] = subnetIndex;
    return `${baseOctets.join('.')}/24`;
  }

  private createSecurityGroups(config: VpcConfig): {
    [key: string]: SecurityGroup;
  } {
    const webSg = new SecurityGroup(this, 'web-sg', {
      name: `${config.environment}-web-sg-${config.region}`,
      description: 'Security group for web servers',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${config.environment}-web-sg-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    const dbSg = new SecurityGroup(this, 'database-sg', {
      name: `${config.environment}-database-sg-${config.region}`,
      description: 'Security group for database servers',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [webSg.id],
          description: 'PostgreSQL from web servers',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${config.environment}-database-sg-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    return {
      web: webSg,
      database: dbSg,
    };
  }
}
```

## 3. RDS

```typescript
import { Construct } from 'constructs';
import {
  DbInstance,
  DbSubnetGroup,
  DbParameterGroup,
} from '@cdktf/provider-aws/lib/rds';
import { KmsKey, KmsAlias } from '@cdktf/provider-aws/lib/kms';
import { VpcConstruct } from './vpc';

export interface RdsConfig {
  region: string;
  environment: string;
  vpc: VpcConstruct;
  masterUsername: string;
  masterPassword: string;
  replicaRegion?: string;
}

export class RdsConstruct extends Construct {
  public readonly primaryInstance: DbInstance;
  public readonly readReplica?: DbInstance;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, config: RdsConfig) {
    super(scope, id);

    // KMS Key for encryption
    this.kmsKey = new KmsKey(this, 'rds-kms-key', {
      description: `RDS encryption key for ${config.environment} in ${config.region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.environment}-rds-kms-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    new KmsAlias(this, 'rds-kms-alias', {
      name: `alias/${config.environment}-rds-${config.region}`,
      targetKeyId: this.kmsKey.keyId,
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.environment}-db-subnet-group-${config.region}`,
      subnetIds: config.vpc.databaseSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${config.environment}-db-subnet-group-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    // DB Parameter Group
    const dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      family: 'postgres15',
      name: `${config.environment}-postgres-params-${config.region}`,
      description: 'PostgreSQL parameter group for PCI DSS compliance',
      parameter: [
        {
          name: 'log_statement',
          value: 'all',
        },
        {
          name: 'log_min_duration_statement',
          value: '1000',
        },
        {
          name: 'shared_preload_libraries',
          value: 'pg_stat_statements',
        },
        {
          name: 'ssl',
          value: 'on',
        },
        {
          name: 'ssl_ciphers',
          value: 'HIGH:!aNULL:!MD5',
        },
      ],
      tags: {
        Name: `${config.environment}-postgres-params-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    // Primary RDS Instance
    this.primaryInstance = new DbInstance(this, 'primary-instance', {
      identifier: `${config.environment}-postgres-primary-${config.region}`,
      engine: 'postgres',
      engineVersion: '15.4',
      instanceClass: 'db.r6g.large',
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,

      dbName: `${config.environment}db`,
      username: config.masterUsername,
      password: config.masterPassword,

      vpcSecurityGroupIds: [config.vpc.securityGroups.database.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      parameterGroupName: dbParameterGroup.name,

      // High Availability
      multiAz: true,
      availabilityZone: undefined, // Let AWS choose for Multi-AZ

      // Backup Configuration
      backupRetentionPeriod: 30,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Monitoring
      monitoringInterval: 60,
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      enabledCloudwatchLogsExports: ['postgresql'],

      // Security
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.environment}-postgres-final-snapshot-${config.region}-${Date.now()}`,

      // PCI DSS Compliance
      caCertIdentifier: 'rds-ca-2019',

      tags: {
        Name: `${config.environment}-postgres-primary-${config.region}`,
        Environment: config.environment,
        Role: 'Primary',
        'PCI-DSS': 'true',
      },
    });

    // Cross-region read replica (if specified)
    if (config.replicaRegion && config.replicaRegion !== config.region) {
      this.readReplica = new DbInstance(this, 'read-replica', {
        identifier: `${config.environment}-postgres-replica-${config.replicaRegion}`,
        replicateSourceDb: this.primaryInstance.identifier,
        instanceClass: 'db.r6g.large',

        // Replica-specific settings
        autoMinorVersionUpgrade: true,
        monitoringInterval: 60,
        performanceInsightsEnabled: true,

        tags: {
          Name: `${config.environment}-postgres-replica-${config.replicaRegion}`,
          Environment: config.environment,
          Role: 'ReadReplica',
          'PCI-DSS': 'true',
        },
      });
    }
  }
}
```

## 4. DynamoDB

```typescript
import { Construct } from 'constructs';
import {
  DynamodbTable,
  DynamodbGlobalTable,
} from '@cdktf/provider-aws/lib/dynamodb';
import { KmsKey, KmsAlias } from '@cdktf/provider-aws/lib/kms';

export interface DynamoDbConfig {
  region: string;
  environment: string;
  tableName: string;
  replicationRegions: string[];
}

export class DynamoDbConstruct extends Construct {
  public readonly table: DynamodbTable;
  public readonly globalTable: DynamodbGlobalTable;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, config: DynamoDbConfig) {
    super(scope, id);

    // KMS Key for DynamoDB encryption
    this.kmsKey = new KmsKey(this, 'dynamodb-kms-key', {
      description: `DynamoDB encryption key for ${config.environment} in ${config.region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.environment}-dynamodb-kms-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    new KmsAlias(this, 'dynamodb-kms-alias', {
      name: `alias/${config.environment}-dynamodb-${config.region}`,
      targetKeyId: this.kmsKey.keyId,
    });

    // DynamoDB Table
    this.table = new DynamodbTable(this, 'table', {
      name: `${config.environment}-${config.tableName}-${config.region}`,
      billingMode: 'PAY_PER_REQUEST',

      hashKey: 'id',
      rangeKey: 'timestamp',

      attribute: [
        {
          name: 'id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
        {
          name: 'gsi1pk',
          type: 'S',
        },
        {
          name: 'gsi1sk',
          type: 'S',
        },
      ],

      globalSecondaryIndex: [
        {
          name: 'GSI1',
          hashKey: 'gsi1pk',
          rangeKey: 'gsi1sk',
          projectionType: 'ALL',
        },
      ],

      // Encryption
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: this.kmsKey.arn,
      },

      // Point-in-time recovery
      pointInTimeRecovery: {
        enabled: true,
      },

      // Stream for cross-region replication
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',

      // Deletion protection
      deletionProtectionEnabled: true,

      tags: {
        Name: `${config.environment}-${config.tableName}-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    // Global Table for cross-region replication
    if (config.replicationRegions.length > 0) {
      const replicas = [config.region, ...config.replicationRegions].map(
        region => ({
          regionName: region,
          kmsKeyArn: this.kmsKey.arn,
          pointInTimeRecovery: true,
        })
      );

      this.globalTable = new DynamodbGlobalTable(this, 'global-table', {
        name: `${config.environment}-${config.tableName}-global`,
        billingMode: 'PAY_PER_REQUEST',

        replica: replicas,

        tags: {
          Name: `${config.environment}-${config.tableName}-global`,
          Environment: config.environment,
          'PCI-DSS': 'true',
        },
      });
    }
  }
}
```

## 5. S3

```typescript
import { Construct } from 'constructs';
import {
  S3Bucket,
  S3BucketVersioning,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketReplicationConfiguration,
  S3BucketPublicAccessBlock,
  S3BucketLogging,
  S3BucketNotification,
} from '@cdktf/provider-aws/lib/s3';
import { KmsKey, KmsAlias } from '@cdktf/provider-aws/lib/kms';
import { IamRole, IamRolePolicy } from '@cdktf/provider-aws/lib/iam';

export interface S3Config {
  region: string;
  environment: string;
  bucketName: string;
  replicationRegion?: string;
}

export class S3Construct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly replicationBucket?: S3Bucket;
  public readonly kmsKey: KmsKey;
  public readonly loggingBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3Config) {
    super(scope, id);

    // KMS Key for S3 encryption
    this.kmsKey = new KmsKey(this, 's3-kms-key', {
      description: `S3 encryption key for ${config.environment} in ${config.region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.environment}-s3-kms-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    new KmsAlias(this, 's3-kms-alias', {
      name: `alias/${config.environment}-s3-${config.region}`,
      targetKeyId: this.kmsKey.keyId,
    });

    // Logging bucket
    this.loggingBucket = new S3Bucket(this, 'logging-bucket', {
      bucket: `${config.environment}-${config.bucketName}-logs-${config.region}`,
      tags: {
        Name: `${config.environment}-${config.bucketName}-logs-${config.region}`,
        Environment: config.environment,
        Purpose: 'AccessLogs',
        'PCI-DSS': 'true',
      },
    });

    // Block public access for logging bucket
    new S3BucketPublicAccessBlock(this, 'logging-bucket-pab', {
      bucket: this.loggingBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Main S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `${config.environment}-${config.bucketName}-${config.region}`,
      tags: {
        Name: `${config.environment}-${config.bucketName}-${config.region}`,
        Environment: config.environment,
        'PCI-DSS': 'true',
      },
    });

    // Versioning
    new S3BucketVersioning(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: this.kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Access logging
    new S3BucketLogging(this, 'bucket-logging', {
      bucket: this.bucket.id,
      targetBucket: this.loggingBucket.id,
      targetPrefix: 'access-logs/',
    });

    // Cross-region replication
    if (
      config.replicationRegion &&
      config.replicationRegion !== config.region
    ) {
      // Replication bucket
      this.replicationBucket = new S3Bucket(this, 'replication-bucket', {
        bucket: `${config.environment}-${config.bucketName}-${config.replicationRegion}`,
        provider: `aws.${config.replicationRegion}`, // Assumes provider alias
        tags: {
          Name: `${config.environment}-${config.bucketName}-${config.replicationRegion}`,
          Environment: config.environment,
          Purpose: 'Replication',
          'PCI-DSS': 'true',
        },
      });

      // Replication role
      const replicationRole = new IamRole(this, 'replication-role', {
        name: `${config.environment}-s3-replication-role-${config.region}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 's3.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `${config.environment}-s3-replication-role-${config.region}`,
          Environment: config.environment,
          'PCI-DSS': 'true',
        },
      });

      new IamRolePolicy(this, 'replication-policy', {
        name: 'S3ReplicationPolicy',
        role: replicationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: `${this.bucket.arn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListBucket'],
              Resource: this.bucket.arn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: `${this.replicationBucket.arn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey'],
              Resource: this.kmsKey.arn,
            },
          ],
        }),
      });

      // Replication configuration
      new S3BucketReplicationConfiguration(this, 'bucket-replication', {
        role: replicationRole.arn,
        bucket: this.bucket.id,
        rule: [
          {
            id: 'ReplicateEverything',
            status: 'Enabled',
            priority: 1,
            destination: {
              bucket: this.replicationBucket.arn,
              storageClass: 'STANDARD_IA',
              encryptionConfiguration: {
                replicaKmsKeyId: this.kmsKey.arn,
              },
            },
          },
        ],
      });
    }
  }
}
```

## 6. CloudFront and WAF

```typescript
import { Construct } from 'constructs';
import { CloudfrontDistribution, CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront';
import { Wafv2WebAcl, Wafv2IpSet } from '@cdktf/provider-aws/lib/wafv2';
import { S3Construct } from './s3';

export interface CloudFrontConfig {
  environment: string;
  s3Construct: S3Construct;
  domainName?: string;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: CloudfrontDistribution;
  public readonly webAcl: Wafv2WebAcl;

  constructor(scope: Construct, id: string, config: CloudFrontConfig) {
    super(scope, id);

    // WAF IP Set for rate limiting
    const ipSet = new W
```
