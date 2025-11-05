# Multi-Environment Infrastructure with CDKTF TypeScript - IDEAL RESPONSE

This implementation creates consistent infrastructure that accepts dynamic environmentSuffix values for deployment flexibility, using CDKTF with TypeScript.

## Key Architecture Decisions

### 1. Dynamic Environment Configuration
Unlike implementations that hardcode 'dev', 'staging', and 'prod' environments, this implementation accepts ANY environmentSuffix value for maximum deployment flexibility.

### 2. Cost-Optimized Configuration
All environments use:
- PAY_PER_REQUEST billing for DynamoDB (no ongoing costs when idle)
- No cross-region replication (disabled for cost optimization)
- No point-in-time recovery (disabled for cost optimization)
- Local Terraform state (S3 backend commented out for local state management)

### 3. Simplified Tag Management
Uses single `CostCenter: 'engineering'` tag for all environments instead of complex conditional logic.

## Implementation Files

### File: lib/tap-stack.ts

```ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { InfrastructureStack } from './infrastructure-stack';
import * as fs from 'fs';
import * as path from 'path';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

/**
 * Get AWS region from environment variable, fallback to lib/AWS_REGION file, then props, then default
 */
function getAwsRegion(props?: TapStackProps): string {
  // First priority: environment variable
  if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  }

  // Second priority: read from lib/AWS_REGION file
  const awsRegionFile = path.join(__dirname, 'AWS_REGION');
  if (fs.existsSync(awsRegionFile)) {
    try {
      const regionFromFile = fs.readFileSync(awsRegionFile, 'utf-8').trim();
      if (regionFromFile) {
        return regionFromFile;
      }
    } catch (error) {
      // Ignore file read errors and continue to next fallback
    }
  }

  // Third priority: props
  if (props?.awsRegion) {
    return props.awsRegion;
  }

  // Default: ap-northeast-2 as specified in PROMPT.md
  return 'ap-northeast-2';
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = getAwsRegion(props);
    const defaultTags = props?.defaultTags || [];

    // Merge default tags with environment-specific tags
    const baseTags = defaultTags[0]?.tags || {};
    const enhancedTags: AwsProviderDefaultTags[] = [
      {
        tags: {
          ...baseTags,
          Environment: environmentSuffix,
          CostCenter: 'engineering',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: enhancedTags,
    });

    // Note: S3 Backend commented out for local state management
    // Uncomment for production use with proper state bucket
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });

    // Instantiate the infrastructure stack
    new InfrastructureStack(this, 'Infrastructure', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
```

### File: lib/environment-config.ts

```ts
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

export function getEnvironmentConfig(
  environmentSuffix: string
): EnvironmentConfig {
  // Default to dev configuration for all environments
  const config: EnvironmentConfig = {
    environment: environmentSuffix,
    bucketLifecycleDays: 30,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
    alarmThresholdMultiplier: 0.75,
    snsEmail: `alerts-${environmentSuffix}@example.com`,
    enableCrossRegionReplication: false,
    costCenter: 'engineering',
  };

  return config;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Validate provisioned billing has required capacity settings
  if (config.dynamodbBillingMode === 'PROVISIONED') {
    if (!config.dynamodbReadCapacity || !config.dynamodbWriteCapacity) {
      throw new Error(
        'PROVISIONED billing mode must specify read and write capacity'
      );
    }
  }

  // Validate cross-region replication has replication region
  if (config.enableCrossRegionReplication && !config.replicationRegion) {
    throw new Error('Cross-region replication must specify replication region');
  }
}
```

### File: lib/s3-bucket-construct.ts

```ts
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
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

    const { environmentSuffix, config } = props;

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
          filter: [{}], // Empty filter applies to all objects
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
          filter: [{}], // Empty filter applies to all objects
          noncurrentVersionExpiration: [
            {
              noncurrentDays: config.bucketLifecycleDays * 2,
            },
          ],
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
              Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
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
      new S3BucketReplicationConfigurationA(this, 'BucketReplication', {
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

### File: lib/dynamodb-table-construct.ts

```ts
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        enabled: false, // Disabled for cost optimization
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

### File: lib/monitoring-construct.ts

```ts
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

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
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

### File: lib/iam-construct.ts

```ts
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

### File: lib/infrastructure-stack.ts

```ts
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

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
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

### File: lib/AWS_REGION

```
ap-northeast-2
```
