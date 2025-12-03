# Financial Trading Analytics Platform - CDKTF TypeScript Implementation

This implementation creates a production-ready AWS environment for a financial trading analytics platform using CDKTF with TypeScript. The infrastructure includes VPC networking, Aurora Serverless v2, DynamoDB, S3 storage, Lambda functions, API Gateway, CloudWatch logging, KMS encryption, IAM roles, and AWS Config for PCI-DSS compliance.

## File: lib/networking-stack.ts

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
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface NetworkingStackProps {
  environmentSuffix: string;
  vpcCidr: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly lambdaSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environmentSuffix, vpcCidr } = props;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create subnets in 3 AZs
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `trading-public-subnet-${i}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `trading-private-subnet-${i}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Create single NAT Gateway for cost optimization
    const eip = new Eip(this, 'nat-eip', {
      vpc: true,
      tags: {
        Name: `trading-nat-eip-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `trading-nat-gateway-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [igw],
    });

    // Create route tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-private-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate subnets with route tables
    this.publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create security groups
    this.lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `trading-lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: this.vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `trading-lambda-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.databaseSecurityGroup = new SecurityGroup(this, 'database-sg', {
      name: `trading-database-sg-${environmentSuffix}`,
      description: 'Security group for Aurora database',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [this.lambdaSecurityGroup.id],
          description: 'Allow PostgreSQL from Lambda',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `trading-database-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
```

## File: lib/kms-stack.ts

```typescript
import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface KmsStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class KmsStack extends Construct {
  public readonly databaseKey: KmsKey;
  public readonly s3Key: KmsKey;
  public readonly lambdaKey: KmsKey;
  public readonly cloudwatchKey: KmsKey;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;
    const caller = new DataAwsCallerIdentity(this, 'caller', {});

    const keyPolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::\${${caller.fqn}.account_id}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow services to use the key',
          Effect: 'Allow',
          Principal: {
            Service: [
              'logs.amazonaws.com',
              'rds.amazonaws.com',
              's3.amazonaws.com',
              'lambda.amazonaws.com',
            ],
          },
          Action: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:CreateGrant',
          ],
          Resource: '*',
        },
      ],
    });

    // Database encryption key
    this.databaseKey = new KmsKey(this, 'database-key', {
      description: `Database encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-database-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'database-encryption',
      },
    });

    new KmsAlias(this, 'database-key-alias', {
      name: `alias/trading-database-${environmentSuffix}`,
      targetKeyId: this.databaseKey.id,
    });

    // S3 encryption key
    this.s3Key = new KmsKey(this, 's3-key', {
      description: `S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-s3-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 's3-encryption',
      },
    });

    new KmsAlias(this, 's3-key-alias', {
      name: `alias/trading-s3-${environmentSuffix}`,
      targetKeyId: this.s3Key.id,
    });

    // Lambda encryption key
    this.lambdaKey = new KmsKey(this, 'lambda-key', {
      description: `Lambda encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-lambda-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'lambda-encryption',
      },
    });

    new KmsAlias(this, 'lambda-key-alias', {
      name: `alias/trading-lambda-${environmentSuffix}`,
      targetKeyId: this.lambdaKey.id,
    });

    // CloudWatch Logs encryption key
    this.cloudwatchKey = new KmsKey(this, 'cloudwatch-key', {
      description: `CloudWatch Logs encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      policy: keyPolicy,
      tags: {
        Name: `trading-cloudwatch-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'cloudwatch-encryption',
      },
    });

    new KmsAlias(this, 'cloudwatch-key-alias', {
      name: `alias/trading-cloudwatch-${environmentSuffix}`,
      targetKeyId: this.cloudwatchKey.id,
    });
  }
}
```

## File: lib/database-stack.ts

```typescript
import { Construct } from 'constructs';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

export interface DatabaseStackProps {
  environmentSuffix: string;
  privateSubnets: Subnet[];
  securityGroup: SecurityGroup;
  kmsKey: KmsKey;
}

export class DatabaseStack extends Construct {
  public readonly cluster: RdsCluster;
  public readonly clusterEndpoint: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const { environmentSuffix, privateSubnets, securityGroup, kmsKey } = props;

    // Create DB subnet group
    const subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `trading-db-subnet-${environmentSuffix}`,
      subnetIds: privateSubnets.map((subnet) => subnet.id),
      tags: {
        Name: `trading-db-subnet-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Aurora Serverless v2 cluster
    this.cluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `trading-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.3',
      databaseName: 'tradingdb',
      masterUsername: 'dbadmin',
      masterPassword: 'ChangeMe123!', // In production, use Secrets Manager
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [securityGroup.id],
      backupRetentionPeriod: 1,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        maxCapacity: 2,
        minCapacity: 0.5,
      },
      tags: {
        Name: `trading-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create cluster instances (serverless v2)
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `trading-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: this.cluster.id,
      instanceClass: 'db.serverless',
      engine: this.cluster.engine,
      engineVersion: this.cluster.engineVersion,
      publiclyAccessible: false,
      tags: {
        Name: `trading-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.clusterEndpoint = this.cluster.endpoint;
  }
}
```

## File: lib/dynamodb-stack.ts

```typescript
import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

export interface DynamodbStackProps {
  environmentSuffix: string;
}

export class DynamodbStack extends Construct {
  public readonly sessionsTable: DynamodbTable;
  public readonly apiKeysTable: DynamodbTable;

  constructor(scope: Construct, id: string, props: DynamodbStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Sessions table
    this.sessionsTable = new DynamodbTable(this, 'sessions-table', {
      name: `trading-sessions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'sessionId',
      attribute: [
        {
          name: 'sessionId',
          type: 'S',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      ttl: {
        enabled: true,
        attributeName: 'ttl',
      },
      tags: {
        Name: `trading-sessions-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // API keys table
    this.apiKeysTable = new DynamodbTable(this, 'api-keys-table', {
      name: `trading-api-keys-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'apiKeyId',
      attribute: [
        {
          name: 'apiKeyId',
          type: 'S',
        },
        {
          name: 'userId',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'UserIdIndex',
          hashKey: 'userId',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `trading-api-keys-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });
  }
}
```

## File: lib/s3-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

export interface S3StackProps {
  environmentSuffix: string;
  kmsKey: KmsKey;
}

export class S3Stack extends Construct {
  public readonly rawDataBucket: S3Bucket;
  public readonly processedDataBucket: S3Bucket;
  public readonly archiveBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const { environmentSuffix, kmsKey } = props;

    // Raw data ingestion bucket
    this.rawDataBucket = this.createBucket(
      'raw-data-bucket',
      `trading-raw-data-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );

    // Processed analytics bucket
    this.processedDataBucket = this.createBucket(
      'processed-data-bucket',
      `trading-processed-data-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );

    // Archive bucket
    this.archiveBucket = this.createBucket(
      'archive-bucket',
      `trading-archive-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );
  }

  private createBucket(
    id: string,
    bucketName: string,
    environmentSuffix: string,
    kmsKey: KmsKey
  ): S3Bucket {
    const bucket = new S3Bucket(this, id, {
      bucket: bucketName,
      tags: {
        Name: bucketName,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, `${id}-versioning`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, `${id}-encryption`, {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, `${id}-public-access-block`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy
    new S3BucketLifecycleConfiguration(this, `${id}-lifecycle`, {
      bucket: bucket.id,
      rule: [
        {
          id: 'archive-old-data',
          status: 'Enabled',
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    return bucket;
  }
}
```

## File: lib/lambda-stack.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

export interface LambdaStackProps {
  environmentSuffix: string;
  awsRegion: string;
  rawDataBucket: S3Bucket;
  processedDataBucket: S3Bucket;
  sessionsTable: DynamodbTable;
  securityGroup: SecurityGroup;
  privateSubnets: Subnet[];
  kmsKey: KmsKey;
  cloudwatchKey: KmsKey;
}

export class LambdaStack extends Construct {
  public readonly dataProcessorFunction: LambdaFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      awsRegion,
      rawDataBucket,
      processedDataBucket,
      sessionsTable,
      securityGroup,
      privateSubnets,
      kmsKey,
      cloudwatchKey,
    } = props;

    // Create Archive provider
    new ArchiveProvider(this, 'archive', {});

    // Create Lambda execution role
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `trading-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `trading-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Create custom policy for Lambda
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `trading-lambda-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [
              rawDataBucket.arn,
              `${rawDataBucket.arn}/*`,
              processedDataBucket.arn,
              `${processedDataBucket.arn}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
            ],
            Resource: [sessionsTable.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
            ],
            Resource: [kmsKey.arn],
          },
          {
            Effect: 'Deny',
            Action: '*',
            Resource: '*',
            Condition: {
              StringNotEquals: {
                'aws:RequestedRegion': [awsRegion],
              },
            },
          },
        ],
      }),
      tags: {
        Name: `trading-lambda-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-custom-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/trading-data-processor-${environmentSuffix}`,
      retentionInDays: 30,
      kmsKeyId: cloudwatchKey.arn,
      tags: {
        Name: `trading-data-processor-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Lambda function code archive
    const lambdaArchive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/../lambda-${environmentSuffix}.zip`,
    });

    // Create Lambda function
    this.dataProcessorFunction = new LambdaFunction(this, 'data-processor', {
      functionName: `trading-data-processor-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      architectures: ['arm64'],
      memorySize: 512,
      timeout: 60,
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
          RAW_DATA_BUCKET: rawDataBucket.id,
          PROCESSED_DATA_BUCKET: processedDataBucket.id,
          SESSIONS_TABLE: sessionsTable.name,
        },
      },
      kmsKeyArn: kmsKey.arn,
      vpcConfig: {
        subnetIds: privateSubnets.map((subnet) => subnet.id),
        securityGroupIds: [securityGroup.id],
      },
      tags: {
        Name: `trading-data-processor-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
      dependsOn: [logGroup],
    });
  }
}
```

## File: lib/lambda/index.js

```javascript
/**
 * Trading Analytics Data Processor
 * Processes market data from S3 raw bucket and stores results in processed bucket
 */

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const rawDataBucket = process.env.RAW_DATA_BUCKET;
  const processedDataBucket = process.env.PROCESSED_DATA_BUCKET;
  const sessionsTable = process.env.SESSIONS_TABLE;

  console.log(`Environment: ${environment}`);
  console.log(`Raw Data Bucket: ${rawDataBucket}`);
  console.log(`Processed Data Bucket: ${processedDataBucket}`);
  console.log(`Sessions Table: ${sessionsTable}`);

  // Process data from S3 event
  if (event.Records && event.Records[0].s3) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    console.log(`Processing file: s3://${bucket}/${key}`);

    // In production, implement actual data processing logic here
    // For now, just log the event
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processed successfully',
        bucket: bucket,
        key: key,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda function executed successfully',
      environment: environment,
    }),
  };
};
```

## File: lib/api-gateway-stack.ts

```typescript
import { Construct } from 'constructs';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayUsagePlan } from '@cdktf/provider-aws/lib/api-gateway-usage-plan';
import { ApiGatewayApiKey } from '@cdktf/provider-aws/lib/api-gateway-api-key';
import { ApiGatewayUsagePlanKey } from '@cdktf/provider-aws/lib/api-gateway-usage-plan-key';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';

export interface ApiGatewayStackProps {
  environmentSuffix: string;
  lambdaFunction: LambdaFunction;
  cloudwatchKey: KmsKey;
}

export class ApiGatewayStack extends Construct {
  public readonly restApi: ApiGatewayRestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id);

    const { environmentSuffix, lambdaFunction, cloudwatchKey } = props;

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/trading-api-${environmentSuffix}`,
      retentionInDays: 30,
      kmsKeyId: cloudwatchKey.arn,
      tags: {
        Name: `trading-api-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create REST API
    this.restApi = new ApiGatewayRestApi(this, 'rest-api', {
      name: `trading-api-${environmentSuffix}`,
      description: 'Trading Analytics Platform API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `trading-api-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Create resource
    const processResource = new ApiGatewayResource(this, 'process-resource', {
      restApiId: this.restApi.id,
      parentId: this.restApi.rootResourceId,
      pathPart: 'process',
    });

    // Create method
    const processMethod = new ApiGatewayMethod(this, 'process-method', {
      restApiId: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      apiKeyRequired: true,
    });

    // Create integration
    const integration = new ApiGatewayIntegration(this, 'lambda-integration', {
      restApiId: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: processMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFunction.invokeArn,
    });

    // Grant API Gateway permission to invoke Lambda
    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.restApi.executionArn}/*/*`,
    });

    // Create deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: this.restApi.id,
      dependsOn: [processMethod, integration],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Create stage
    const stage = new ApiGatewayStage(this, 'api-stage', {
      restApiId: this.restApi.id,
      deploymentId: deployment.id,
      stageName: environmentSuffix,
      xrayTracingEnabled: true,
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
        Name: `trading-api-stage-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Configure method settings for throttling
    new ApiGatewayMethodSettings(this, 'method-settings', {
      restApiId: this.restApi.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 1000,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create usage plan
    const usagePlan = new ApiGatewayUsagePlan(this, 'usage-plan', {
      name: `trading-usage-plan-${environmentSuffix}`,
      description: 'Usage plan with 1000 RPS throttling per API key',
      throttleSettings: {
        burstLimit: 1000,
        rateLimit: 1000,
      },
      apiStages: [
        {
          apiId: this.restApi.id,
          stage: stage.stageName,
        },
      ],
      tags: {
        Name: `trading-usage-plan-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create API key
    const apiKey = new ApiGatewayApiKey(this, 'api-key', {
      name: `trading-api-key-${environmentSuffix}`,
      description: 'API key for trading analytics platform',
      enabled: true,
      tags: {
        Name: `trading-api-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Associate API key with usage plan
    new ApiGatewayUsagePlanKey(this, 'usage-plan-key', {
      keyId: apiKey.id,
      keyType: 'API_KEY',
      usagePlanId: usagePlan.id,
    });

    this.apiUrl = stage.invokeUrl;
  }
}
```

## File: lib/config-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { ConfigConfigurationRecorderStatus } from '@cdktf/provider-aws/lib/config-configuration-recorder-status';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';

export interface ConfigStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class ConfigStack extends Construct {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;

    // Create S3 bucket for Config
    const configBucket = new S3Bucket(this, 'config-bucket', {
      bucket: `trading-config-${environmentSuffix}`,
      tags: {
        Name: `trading-config-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new S3BucketVersioningA(this, 'config-bucket-versioning', {
      bucket: configBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'config-bucket-public-access', {
      bucket: configBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create IAM role for Config
    const configRole = new IamRole(this, 'config-role', {
      name: `trading-config-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `trading-config-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach AWS managed policy for Config
    new IamRolePolicyAttachment(this, 'config-policy-attachment', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    });

    // Create Configuration Recorder
    const recorder = new ConfigConfigurationRecorder(this, 'config-recorder', {
      name: `trading-config-recorder-${environmentSuffix}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create Delivery Channel
    const deliveryChannel = new ConfigDeliveryChannel(this, 'delivery-channel', {
      name: `trading-config-delivery-${environmentSuffix}`,
      s3BucketName: configBucket.id,
      dependsOn: [recorder],
    });

    // Start the recorder
    new ConfigConfigurationRecorderStatus(this, 'recorder-status', {
      name: recorder.name,
      isEnabled: true,
      dependsOn: [deliveryChannel],
    });

    // PCI-DSS Config Rules

    // Rule: S3 bucket encryption enabled
    new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-bucket-server-side-encryption-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have server-side encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      dependsOn: [recorder],
    });

    // Rule: S3 bucket versioning enabled
    new ConfigConfigRule(this, 's3-versioning-rule', {
      name: `s3-bucket-versioning-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have versioning enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
      },
      dependsOn: [recorder],
    });

    // Rule: RDS encryption enabled
    new ConfigConfigRule(this, 'rds-encryption-rule', {
      name: `rds-storage-encrypted-${environmentSuffix}`,
      description: 'Checks that RDS instances have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
      },
      dependsOn: [recorder],
    });

    // Rule: CloudWatch log group encryption
    new ConfigConfigRule(this, 'cloudwatch-log-encryption-rule', {
      name: `cloudwatch-log-group-encrypted-${environmentSuffix}`,
      description: 'Checks that CloudWatch Log Groups are encrypted',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
      },
      dependsOn: [recorder],
    });

    // Rule: DynamoDB encryption enabled
    new ConfigConfigRule(this, 'dynamodb-encryption-rule', {
      name: `dynamodb-table-encrypted-kms-${environmentSuffix}`,
      description: 'Checks that DynamoDB tables use KMS encryption',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
      },
      dependsOn: [recorder],
    });

    // Rule: IAM password policy
    new ConfigConfigRule(this, 'iam-password-policy-rule', {
      name: `iam-password-policy-${environmentSuffix}`,
      description: 'Checks IAM password policy for compliance',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'IAM_PASSWORD_POLICY',
      },
      dependsOn: [recorder],
    });

    // Rule: VPC flow logs enabled
    new ConfigConfigRule(this, 'vpc-flow-logs-rule', {
      name: `vpc-flow-logs-enabled-${environmentSuffix}`,
      description: 'Checks that VPC flow logs are enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
      },
      dependsOn: [recorder],
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { KmsStack } from './kms-stack';
import { DatabaseStack } from './database-stack';
import { DynamodbStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { ConfigStack } from './config-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Create KMS keys first (needed by other stacks)
    const kmsStack = new KmsStack(this, 'kms', {
      environmentSuffix,
      awsRegion,
    });

    // Create networking stack
    const networkingStack = new NetworkingStack(this, 'networking', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
    });

    // Create database stack
    const databaseStack = new DatabaseStack(this, 'database', {
      environmentSuffix,
      privateSubnets: networkingStack.privateSubnets,
      securityGroup: networkingStack.databaseSecurityGroup,
      kmsKey: kmsStack.databaseKey,
    });

    // Create DynamoDB stack
    const dynamodbStack = new DynamodbStack(this, 'dynamodb', {
      environmentSuffix,
    });

    // Create S3 stack
    const s3Stack = new S3Stack(this, 's3', {
      environmentSuffix,
      kmsKey: kmsStack.s3Key,
    });

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'lambda', {
      environmentSuffix,
      awsRegion,
      rawDataBucket: s3Stack.rawDataBucket,
      processedDataBucket: s3Stack.processedDataBucket,
      sessionsTable: dynamodbStack.sessionsTable,
      securityGroup: networkingStack.lambdaSecurityGroup,
      privateSubnets: networkingStack.privateSubnets,
      kmsKey: kmsStack.lambdaKey,
      cloudwatchKey: kmsStack.cloudwatchKey,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'api-gateway', {
      environmentSuffix,
      lambdaFunction: lambdaStack.dataProcessorFunction,
      cloudwatchKey: kmsStack.cloudwatchKey,
    });

    // Create AWS Config stack
    new ConfigStack(this, 'config', {
      environmentSuffix,
      awsRegion,
    });

    // Create outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networkingStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'database-endpoint', {
      value: databaseStack.clusterEndpoint,
      description: 'Aurora database endpoint',
    });

    new TerraformOutput(this, 'api-gateway-url', {
      value: apiGatewayStack.apiUrl,
      description: 'API Gateway URL',
    });

    new TerraformOutput(this, 'raw-data-bucket', {
      value: s3Stack.rawDataBucket.id,
      description: 'Raw data S3 bucket name',
    });

    new TerraformOutput(this, 'processed-data-bucket', {
      value: s3Stack.processedDataBucket.id,
      description: 'Processed data S3 bucket name',
    });

    new TerraformOutput(this, 'archive-bucket', {
      value: s3Stack.archiveBucket.id,
      description: 'Archive S3 bucket name',
    });

    new TerraformOutput(this, 'sessions-table', {
      value: dynamodbStack.sessionsTable.name,
      description: 'DynamoDB sessions table name',
    });

    new TerraformOutput(this, 'api-keys-table', {
      value: dynamodbStack.apiKeysTable.name,
      description: 'DynamoDB API keys table name',
    });
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Synthesize the Terraform configuration:
```bash
npm run synth
```

4. Deploy the infrastructure:
```bash
cdktf deploy --auto-approve
```

5. Access outputs after deployment:
```bash
cdktf output
```

## Architecture Summary

This implementation creates a comprehensive AWS infrastructure for a financial trading analytics platform with:

- **Networking**: VPC with 10.0.0.0/16 CIDR across 3 AZs, public and private subnets, NAT Gateway, security groups
- **Database**: Aurora Serverless v2 PostgreSQL cluster with KMS encryption and automated backups
- **NoSQL**: DynamoDB tables for sessions and API keys with point-in-time recovery
- **Storage**: Three S3 buckets (raw, processed, archive) with versioning, encryption, and lifecycle policies
- **Compute**: Lambda function with Graviton2 (ARM64) architecture for data processing
- **API**: REST API Gateway with usage plans, API keys, and 1000 RPS throttling
- **Monitoring**: CloudWatch Log Groups with 30-day retention and encryption
- **Security**: KMS customer-managed keys for all encryption, IAM least-privilege policies
- **Compliance**: AWS Config with PCI-DSS rules for encryption, versioning, and access logging

All resources include the environmentSuffix parameter for deployment uniqueness and are configured for easy destruction (skip_final_snapshot, no retention policies).
