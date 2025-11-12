# Multi-Environment Infrastructure with CDKTF TypeScript

This implementation creates consistent infrastructure across dev, staging, and production environments with environment-specific configurations using CDKTF with TypeScript.

## File: lib/environment-config.ts

```typescript
export interface EnvironmentConfig {
  environment: string;
  bucketLifecycleDays: number;
  dynamodbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
  alarmThresholdMultiplier: number;
  snsEmail: string;
  enableCrossRegionReplication: boolean;
  replicationRegion?: string;
  costCenter: string;
}

export function getEnvironmentConfig(environment: string): EnvironmentConfig {
  const configs: { [key: string]: EnvironmentConfig } = {
    dev: {
      environment: 'dev',
      bucketLifecycleDays: 7,
      dynamodbBillingMode: 'PAY_PER_REQUEST',
      alarmThresholdMultiplier: 0.5,
      snsEmail: 'dev-alerts@example.com',
      enableCrossRegionReplication: false,
      costCenter: 'development',
    },
    staging: {
      environment: 'staging',
      bucketLifecycleDays: 30,
      dynamodbBillingMode: 'PAY_PER_REQUEST',
      alarmThresholdMultiplier: 0.75,
      snsEmail: 'staging-alerts@example.com',
      enableCrossRegionReplication: false,
      costCenter: 'staging',
    },
    prod: {
      environment: 'prod',
      bucketLifecycleDays: 90,
      dynamodbBillingMode: 'PROVISIONED',
      dynamodbReadCapacity: 5,
      dynamodbWriteCapacity: 5,
      alarmThresholdMultiplier: 1.0,
      snsEmail: 'prod-alerts@example.com',
      enableCrossRegionReplication: true,
      replicationRegion: 'ap-northeast-2',
      costCenter: 'production',
    },
  };

  const config = configs[environment];
  if (!config) {
    throw new Error(
      `Invalid environment: ${environment}. Must be one of: dev, staging, prod`
    );
  }

  return config;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Prevent production settings in non-production environments
  if (config.environment !== 'prod') {
    if (config.dynamodbBillingMode === 'PROVISIONED') {
      throw new Error(
        `PROVISIONED billing mode is only allowed in production environment`
      );
    }
    if (config.enableCrossRegionReplication) {
      throw new Error(
        `Cross-region replication is only allowed in production environment`
      );
    }
  }

  // Validate production has required settings
  if (config.environment === 'prod') {
    if (config.dynamodbBillingMode === 'PROVISIONED') {
      if (!config.dynamodbReadCapacity || !config.dynamodbWriteCapacity) {
        throw new Error(
          `Production environment with PROVISIONED billing must specify read and write capacity`
        );
      }
    }
    if (
      config.enableCrossRegionReplication &&
      !config.replicationRegion
    ) {
      throw new Error(
        `Production environment with cross-region replication must specify replication region`
      );
    }
  }
}
```

## File: lib/s3-bucket-construct.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EnvironmentConfig } from './environment-config';

export interface S3BucketConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  region: string;
}

export class S3BucketConstruct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketArn: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: S3BucketConstructProps) {
    super(scope, id);

    const { environmentSuffix, config, region } = props;

    // Create S3 bucket with environment-specific naming
    this.bucket = new S3Bucket(this, 'DataBucket', {
      bucket: `data-bucket-${environmentSuffix}`,
      tags: {
        Name: `data-bucket-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.bucketArn = this.bucket.arn;
    this.bucketName = this.bucket.bucket;

    // Enable versioning
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption with AWS managed keys
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Configure lifecycle policy
    new S3BucketLifecycleConfiguration(this, 'BucketLifecycle', {
      bucket: this.bucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          transition: [
            {
              days: config.bucketLifecycleDays,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: config.bucketLifecycleDays * 2,
          },
        },
      ],
    });

    // Configure cross-region replication for production
    if (config.enableCrossRegionReplication && config.replicationRegion) {
      // Create IAM role for replication
      const replicationRole = new IamRole(this, 'ReplicationRole', {
        name: `s3-replication-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `s3-replication-role-${environmentSuffix}`,
          Environment: config.environment,
          CostCenter: config.costCenter,
        },
      });

      // Create destination bucket in replication region
      const replicationProvider = new AwsProvider(this, 'ReplicationProvider', {
        alias: 'replication',
        region: config.replicationRegion,
      });

      const destinationBucket = new S3Bucket(this, 'DestinationBucket', {
        provider: replicationProvider,
        bucket: `data-bucket-replica-${environmentSuffix}`,
        tags: {
          Name: `data-bucket-replica-${environmentSuffix}`,
          Environment: config.environment,
          CostCenter: config.costCenter,
        },
      });

      // Enable versioning on destination bucket
      new S3BucketVersioningA(this, 'DestinationBucketVersioning', {
        provider: replicationProvider,
        bucket: destinationBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // Enable encryption on destination bucket
      new S3BucketServerSideEncryptionConfigurationA(
        this,
        'DestinationBucketEncryption',
        {
          provider: replicationProvider,
          bucket: destinationBucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

      // Replication policy
      new IamRolePolicy(this, 'ReplicationPolicy', {
        name: `s3-replication-policy-${environmentSuffix}`,
        role: replicationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: this.bucket.arn,
            },
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
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: `${destinationBucket.arn}/*`,
            },
          ],
        }),
      });

      // Configure replication
      new S3BucketReplicationConfiguration(this, 'BucketReplication', {
        bucket: this.bucket.id,
        role: replicationRole.arn,
        rule: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            priority: 1,
            filter: {},
            destination: {
              bucket: destinationBucket.arn,
              replicationTime: {
                status: 'Enabled',
                time: {
                  minutes: 15,
                },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: {
                  minutes: 15,
                },
              },
            },
            deleteMarkerReplication: {
              status: 'Enabled',
            },
          },
        ],
      });
    }
  }
}
```

## File: lib/dynamodb-table-construct.ts

```typescript
import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { EnvironmentConfig } from './environment-config';

export interface DynamodbTableConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class DynamodbTableConstruct extends Construct {
  public readonly table: DynamodbTable;
  public readonly tableArn: string;
  public readonly tableName: string;

  constructor(
    scope: Construct,
    id: string,
    props: DynamodbTableConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, config } = props;

    // Create DynamoDB table with environment-specific capacity settings
    const tableConfig: any = {
      name: `data-table-${environmentSuffix}`,
      billingMode: config.dynamodbBillingMode,
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
          name: 'status',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'StatusIndex',
          hashKey: 'status',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      tags: {
        Name: `data-table-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
      pointInTimeRecovery: {
        enabled: config.environment === 'prod',
      },
    };

    // Add capacity settings for provisioned mode
    if (config.dynamodbBillingMode === 'PROVISIONED') {
      tableConfig.readCapacity = config.dynamodbReadCapacity;
      tableConfig.writeCapacity = config.dynamodbWriteCapacity;
      tableConfig.globalSecondaryIndex[0].readCapacity =
        config.dynamodbReadCapacity;
      tableConfig.globalSecondaryIndex[0].writeCapacity =
        config.dynamodbWriteCapacity;
    }

    this.table = new DynamodbTable(this, 'DataTable', tableConfig);

    this.tableArn = this.table.arn;
    this.tableName = this.table.name;
  }
}
```

## File: lib/monitoring-construct.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { EnvironmentConfig } from './environment-config';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  tableName: string;
}

export class MonitoringConstruct extends Construct {
  public readonly snsTopic: SnsTopic;
  public readonly snsTopicArn: string;

  constructor(
    scope: Construct,
    id: string,
    props: MonitoringConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, config, tableName } = props;

    // Create SNS topic for alerts
    this.snsTopic = new SnsTopic(this, 'AlertTopic', {
      name: `infrastructure-alerts-${environmentSuffix}`,
      displayName: `Infrastructure Alerts - ${config.environment}`,
      tags: {
        Name: `infrastructure-alerts-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.snsTopicArn = this.snsTopic.arn;

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, 'AlertEmailSubscription', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: config.snsEmail,
    });

    // Base thresholds (will be multiplied by environment-specific multiplier)
    const baseReadThreshold = 100;
    const baseWriteThreshold = 100;

    // Create CloudWatch alarms for DynamoDB read capacity
    new CloudwatchMetricAlarm(this, 'ReadCapacityAlarm', {
      alarmName: `dynamodb-read-capacity-${environmentSuffix}`,
      alarmDescription: `DynamoDB read capacity alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ConsumedReadCapacityUnits',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: baseReadThreshold * config.alarmThresholdMultiplier,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-read-capacity-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    // Create CloudWatch alarms for DynamoDB write capacity
    new CloudwatchMetricAlarm(this, 'WriteCapacityAlarm', {
      alarmName: `dynamodb-write-capacity-${environmentSuffix}`,
      alarmDescription: `DynamoDB write capacity alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ConsumedWriteCapacityUnits',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: baseWriteThreshold * config.alarmThresholdMultiplier,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-write-capacity-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    // Create CloudWatch alarm for DynamoDB throttled requests
    new CloudwatchMetricAlarm(this, 'ThrottledRequestsAlarm', {
      alarmName: `dynamodb-throttled-requests-${environmentSuffix}`,
      alarmDescription: `DynamoDB throttled requests alarm for ${config.environment} environment`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'UserErrors',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      treatMissingData: 'notBreaching',
      dimensions: {
        TableName: tableName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `dynamodb-throttled-requests-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });
  }
}
```

## File: lib/iam-construct.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { EnvironmentConfig } from './environment-config';

export interface IamConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  bucketArn: string;
  tableArn: string;
}

export class IamConstruct extends Construct {
  public readonly dataAccessRole: IamRole;
  public readonly dataAccessRoleArn: string;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    const { environmentSuffix, config, bucketArn, tableArn } = props;

    // Create IAM role for data access with least-privilege
    this.dataAccessRole = new IamRole(this, 'DataAccessRole', {
      name: `data-access-role-${environmentSuffix}`,
      description: `Role for accessing ${config.environment} environment resources`,
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
        Name: `data-access-role-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.dataAccessRoleArn = this.dataAccessRole.arn;

    // Attach least-privilege policy for S3 access
    new IamRolePolicy(this, 'S3AccessPolicy', {
      name: `s3-access-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
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
            Resource: [bucketArn, `${bucketArn}/*`],
          },
        ],
      }),
    });

    // Attach least-privilege policy for DynamoDB access
    new IamRolePolicy(this, 'DynamoDBAccessPolicy', {
      name: `dynamodb-access-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [tableArn, `${tableArn}/index/*`],
          },
        ],
      }),
    });

    // Add CloudWatch Logs permissions for Lambda
    new IamRolePolicy(this, 'CloudWatchLogsPolicy', {
      name: `cloudwatch-logs-policy-${environmentSuffix}`,
      role: this.dataAccessRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });
  }
}
```

## File: lib/infrastructure-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
  getEnvironmentConfig,
  validateEnvironmentConfig,
  EnvironmentConfig,
} from './environment-config';
import { S3BucketConstruct } from './s3-bucket-construct';
import { DynamodbTableConstruct } from './dynamodb-table-construct';
import { MonitoringConstruct } from './monitoring-construct';
import { IamConstruct } from './iam-construct';

export interface InfrastructureStackProps {
  environmentSuffix: string;
  region: string;
}

export class InfrastructureStack extends Construct {
  private config: EnvironmentConfig;

  constructor(
    scope: Construct,
    id: string,
    props: InfrastructureStackProps
  ) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Get and validate environment configuration
    this.config = getEnvironmentConfig(environmentSuffix);
    validateEnvironmentConfig(this.config);

    // Create S3 bucket with environment-specific configuration
    const s3Bucket = new S3BucketConstruct(this, 'S3Bucket', {
      environmentSuffix,
      config: this.config,
      region,
    });

    // Create DynamoDB table with environment-specific capacity
    const dynamodbTable = new DynamodbTableConstruct(this, 'DynamoDBTable', {
      environmentSuffix,
      config: this.config,
    });

    // Create monitoring with environment-specific thresholds
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      config: this.config,
      tableName: dynamodbTable.tableName,
    });

    // Create IAM roles with least-privilege policies
    const iam = new IamConstruct(this, 'IAM', {
      environmentSuffix,
      config: this.config,
      bucketArn: s3Bucket.bucketArn,
      tableArn: dynamodbTable.tableArn,
    });

    // Create CloudFormation outputs for key resources
    new TerraformOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: 'ARN of the S3 bucket',
    });

    new TerraformOutput(this, 'DynamoDBTableName', {
      value: dynamodbTable.tableName,
      description: 'Name of the DynamoDB table',
    });

    new TerraformOutput(this, 'DynamoDBTableArn', {
      value: dynamodbTable.tableArn,
      description: 'ARN of the DynamoDB table',
    });

    new TerraformOutput(this, 'SNSTopicArn', {
      value: monitoring.snsTopicArn,
      description: 'ARN of the SNS topic for alerts',
    });

    new TerraformOutput(this, 'DataAccessRoleArn', {
      value: iam.dataAccessRoleArn,
      description: 'ARN of the IAM role for data access',
    });

    new TerraformOutput(this, 'Environment', {
      value: this.config.environment,
      description: 'Environment name',
    });

    new TerraformOutput(this, 'BillingMode', {
      value: this.config.dynamodbBillingMode,
      description: 'DynamoDB billing mode for this environment',
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
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'ap-northeast-2';

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

    // Add Environment and CostCenter tags to default tags
    const enhancedTags: AwsProviderDefaultTags[] = [
      ...defaultTags,
      {
        tags: {
          Environment: environmentSuffix,
          CostCenter: environmentSuffix === 'prod' ? 'production' : environmentSuffix === 'staging' ? 'staging' : 'development',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: enhancedTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate the infrastructure stack
    new InfrastructureStack(this, 'Infrastructure', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure with CDKTF

This project deploys consistent infrastructure across three environments (dev, staging, prod) with environment-specific configurations using CDKTF with TypeScript.

## Architecture

The infrastructure includes:

- **S3 Buckets**: Environment-specific buckets with versioning, encryption, and lifecycle policies
  - Production includes cross-region replication to ap-northeast-2
- **DynamoDB Tables**: Identical schemas with environment-appropriate billing modes
  - Dev/Staging: On-demand billing
  - Production: Provisioned capacity
- **CloudWatch Alarms**: Environment-specific thresholds for monitoring
  - Dev: 50% of baseline thresholds
  - Staging: 75% of baseline thresholds
  - Production: 100% of baseline thresholds
- **SNS Topics**: Environment-specific alert notifications
- **IAM Roles**: Least-privilege access policies

## Environment Configuration

Each environment has specific settings defined in `lib/environment-config.ts`:

### Dev Environment
- Bucket lifecycle: 7 days to IA
- DynamoDB: On-demand billing
- Alarm threshold: 50% of baseline
- No cross-region replication

### Staging Environment
- Bucket lifecycle: 30 days to IA
- DynamoDB: On-demand billing
- Alarm threshold: 75% of baseline
- No cross-region replication

### Production Environment
- Bucket lifecycle: 90 days to IA
- DynamoDB: Provisioned capacity (5 RCU/WCU)
- Alarm threshold: 100% of baseline
- Cross-region replication enabled to ap-northeast-2
- Point-in-time recovery enabled

## Prerequisites

- Node.js 18+
- CDKTF CLI installed
- AWS credentials configured
- Terraform installed

## Deployment

### Deploy to Development

```bash
export ENVIRONMENT_SUFFIX=dev
npm run build
cdktf deploy
```

### Deploy to Staging

```bash
export ENVIRONMENT_SUFFIX=staging
npm run build
cdktf deploy
```

### Deploy to Production

```bash
export ENVIRONMENT_SUFFIX=prod
npm run build
cdktf deploy
```

## Configuration Validation

The infrastructure includes parameter validation to prevent misconfigurations:

- Production settings (provisioned billing, cross-region replication) cannot be applied to non-production environments
- Production environment requires all capacity settings when using provisioned billing
- Environment names must be one of: dev, staging, prod

## Outputs

After deployment, the following outputs are available:

- `S3BucketName`: Name of the S3 bucket
- `S3BucketArn`: ARN of the S3 bucket
- `DynamoDBTableName`: Name of the DynamoDB table
- `DynamoDBTableArn`: ARN of the DynamoDB table
- `SNSTopicArn`: ARN of the SNS topic for alerts
- `DataAccessRoleArn`: ARN of the IAM role for data access
- `Environment`: Environment name
- `BillingMode`: DynamoDB billing mode

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environment-suffix}`

Examples:
- `data-bucket-dev`
- `data-table-staging`
- `infrastructure-alerts-prod`

## Security

- All S3 buckets use server-side encryption with AWS managed keys (AES256)
- IAM roles follow least-privilege principles
- All resources are tagged with Environment and CostCenter tags
- DynamoDB tables in production have point-in-time recovery enabled

## Cost Optimization

- Development and staging use on-demand DynamoDB billing for cost efficiency
- Lifecycle policies transition objects to cheaper storage classes
- Minimal provisioned capacity in production
- No NAT Gateways or expensive compute resources

## Cleanup

To destroy the infrastructure:

```bash
cdktf destroy
```

Note: Ensure S3 buckets are empty before destroying, or remove bucket contents manually.
```

## Summary

This implementation provides:

1. **Reusable S3 Bucket Constructs** with environment-specific naming, retention policies, versioning, and lifecycle configurations
2. **DynamoDB Tables** with identical schemas but environment-appropriate capacity settings (on-demand for dev/staging, provisioned for prod)
3. **Cross-Region Replication** for production S3 buckets only to ap-northeast-2
4. **CloudWatch Alarms** with proportional environment-specific thresholds (50%, 75%, 100%)
5. **SNS Topics** for environment-specific alerts with email subscriptions
6. **Consistent Tagging** with Environment and CostCenter tags across all resources
7. **S3 Security** with server-side encryption, versioning, and lifecycle policies
8. **IAM Roles** with least-privilege policies for each environment
9. **Parameter Validation** to prevent production settings in non-production environments
10. **CloudFormation Outputs** for key resource ARNs and endpoints

The infrastructure is deployable via CDKTF synth/deploy commands and generates environment-specific CloudFormation stacks.
