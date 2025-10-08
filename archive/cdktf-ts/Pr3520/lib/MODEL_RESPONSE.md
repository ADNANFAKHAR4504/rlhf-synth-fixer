# CDKTF TypeScript Infrastructure for CI/CD Artifact Management

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ArtifactStorageStack } from './artifact-storage-stack';
import { ArtifactMetadataStack } from './artifact-metadata-stack';
import { ArtifactCleanupStack } from './artifact-cleanup-stack';
import { PackageManagementStack } from './package-management-stack';
import { MonitoringStack } from './monitoring-stack';
import { AccessControlStack } from './access-control-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const accessControlStack = new AccessControlStack(this, 'access-control', {
      environmentSuffix,
    });

    const artifactStorageStack = new ArtifactStorageStack(this, 'artifact-storage', {
      environmentSuffix,
      buildSystemRole: accessControlStack.buildSystemRole,
    });

    const artifactMetadataStack = new ArtifactMetadataStack(this, 'artifact-metadata', {
      environmentSuffix,
    });

    const packageManagementStack = new PackageManagementStack(this, 'package-management', {
      environmentSuffix,
      buildSystemRole: accessControlStack.buildSystemRole,
    });

    const artifactCleanupStack = new ArtifactCleanupStack(this, 'artifact-cleanup', {
      environmentSuffix,
      artifactBucket: artifactStorageStack.artifactBucket,
      artifactBucketExpressOneZone: artifactStorageStack.artifactBucketExpressOneZone,
      metadataTable: artifactMetadataStack.metadataTable,
    });

    new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      artifactBucket: artifactStorageStack.artifactBucket,
      cleanupFunction: artifactCleanupStack.cleanupFunction,
      metadataTable: artifactMetadataStack.metadataTable,
    });
  }
}
```

## File: lib/artifact-storage-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketAccelerateConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-accelerate-configuration';
import { S3BucketIntelligentTieringConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-intelligent-tiering-configuration';
import { S3BucketObjectLockConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-object-lock-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3DirectoryBucket } from '@cdktf/provider-aws/lib/s3-directory-bucket';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface ArtifactStorageStackProps {
  environmentSuffix: string;
  buildSystemRole: IamRole;
}

export class ArtifactStorageStack extends Construct {
  public readonly artifactBucket: S3Bucket;
  public readonly artifactBucketExpressOneZone: S3DirectoryBucket;

  constructor(scope: Construct, id: string, props: ArtifactStorageStackProps) {
    super(scope, id);

    const { environmentSuffix, buildSystemRole } = props;

    this.artifactBucket = new S3Bucket(this, 'artifact-bucket', {
      bucket: `cicd-artifacts-${environmentSuffix}-${Date.now()}`,
      objectLockEnabled: true,
      tags: {
        Name: `cicd-artifacts-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'CI/CD Build Artifacts',
      },
    });

    new S3BucketVersioningA(this, 'artifact-bucket-versioning', {
      bucket: this.artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'artifact-bucket-encryption', {
      bucket: this.artifactBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      }],
    });

    new S3BucketLifecycleConfiguration(this, 'artifact-bucket-lifecycle', {
      bucket: this.artifactBucket.id,
      rule: [
        {
          id: 'delete-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
          },
        },
        {
          id: 'delete-old-artifacts',
          status: 'Enabled',
          expiration: {
            days: 90,
          },
        },
        {
          id: 'intelligent-tiering',
          status: 'Enabled',
          transition: [{
            days: 7,
            storageClass: 'INTELLIGENT_TIERING',
          }],
        },
      ],
    });

    new S3BucketAccelerateConfiguration(this, 'artifact-bucket-acceleration', {
      bucket: this.artifactBucket.id,
      status: 'Enabled',
    });

    new S3BucketIntelligentTieringConfiguration(this, 'artifact-bucket-intelligent-tiering', {
      bucket: this.artifactBucket.id,
      name: 'archive-old-artifacts',
      tiering: [
        {
          accessTier: 'ARCHIVE_ACCESS',
          days: 60,
        },
        {
          accessTier: 'DEEP_ARCHIVE_ACCESS',
          days: 180,
        },
      ],
    });

    new S3BucketObjectLockConfiguration(this, 'artifact-bucket-object-lock', {
      bucket: this.artifactBucket.id,
      rule: {
        defaultRetention: {
          mode: 'GOVERNANCE',
          days: 90,
        },
      },
    });

    this.artifactBucketExpressOneZone = new S3DirectoryBucket(this, 'artifact-bucket-express', {
      bucket: `cicd-artifacts-express-${environmentSuffix}-${Date.now()}--usw2-az1--x-s3`,
      location: {
        name: 'usw2-az1',
        type: 'AvailabilityZone',
      },
      forceDestroy: true,
      dataRedundancy: 'SingleAvailabilityZone',
    });

    const bucketPolicyDocument = new DataAwsIamPolicyDocument(this, 'bucket-policy-document', {
      statement: [
        {
          sid: 'AllowBuildSystemAccess',
          effect: 'Allow',
          principals: [{
            type: 'AWS',
            identifiers: [buildSystemRole.arn],
          }],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
            's3:GetBucketVersioning',
            's3:GetObjectVersion',
          ],
          resources: [
            this.artifactBucket.arn,
            `${this.artifactBucket.arn}/*`,
          ],
        },
        {
          sid: 'DenyInsecureTransport',
          effect: 'Deny',
          principals: [{
            type: '*',
            identifiers: ['*'],
          }],
          actions: ['s3:*'],
          resources: [
            this.artifactBucket.arn,
            `${this.artifactBucket.arn}/*`,
          ],
          condition: [{
            test: 'Bool',
            variable: 'aws:SecureTransport',
            values: ['false'],
          }],
        },
      ],
    });

    new S3BucketPolicy(this, 'artifact-bucket-policy', {
      bucket: this.artifactBucket.id,
      policy: bucketPolicyDocument.json,
    });
  }
}
```

## File: lib/artifact-metadata-stack.ts

```typescript
import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

interface ArtifactMetadataStackProps {
  environmentSuffix: string;
}

export class ArtifactMetadataStack extends Construct {
  public readonly metadataTable: DynamodbTable;

  constructor(scope: Construct, id: string, props: ArtifactMetadataStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    this.metadataTable = new DynamodbTable(this, 'artifact-metadata-table', {
      name: `artifact-metadata-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'artifact_id',
      rangeKey: 'build_number',
      pointInTimeRecovery: {
        enabled: true,
      },
      attribute: [
        {
          name: 'artifact_id',
          type: 'S',
        },
        {
          name: 'build_number',
          type: 'N',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      globalSecondaryIndex: [{
        name: 'timestamp-index',
        hashKey: 'timestamp',
        projectionType: 'ALL',
      }],
      tags: {
        Name: `artifact-metadata-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Artifact Metadata Storage',
      },
    });
  }
}
```

## File: lib/artifact-cleanup-stack.ts

```typescript
import { Construct } from 'constructs';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3DirectoryBucket } from '@cdktf/provider-aws/lib/s3-directory-bucket';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { TerraformAsset, AssetType } from 'cdktf';
import * as path from 'path';

interface ArtifactCleanupStackProps {
  environmentSuffix: string;
  artifactBucket: S3Bucket;
  artifactBucketExpressOneZone: S3DirectoryBucket;
  metadataTable: DynamodbTable;
}

export class ArtifactCleanupStack extends Construct {
  public readonly cleanupFunction: LambdaFunction;

  constructor(scope: Construct, id: string, props: ArtifactCleanupStackProps) {
    super(scope, id);

    const { environmentSuffix, artifactBucket, artifactBucketExpressOneZone, metadataTable } = props;

    const lambdaAssumeRolePolicy = new DataAwsIamPolicyDocument(this, 'lambda-assume-role-policy', {
      statement: [{
        actions: ['sts:AssumeRole'],
        principals: [{
          type: 'Service',
          identifiers: ['lambda.amazonaws.com'],
        }],
      }],
    });

    const cleanupLambdaRole = new IamRole(this, 'cleanup-lambda-role', {
      name: `artifact-cleanup-lambda-${environmentSuffix}`,
      assumeRolePolicy: lambdaAssumeRolePolicy.json,
    });

    const cleanupLambdaPolicy = new DataAwsIamPolicyDocument(this, 'cleanup-lambda-policy', {
      statement: [
        {
          actions: [
            's3:ListBucket',
            's3:GetObject',
            's3:DeleteObject',
            's3:ListBucketVersions',
            's3:DeleteObjectVersion',
          ],
          resources: [
            artifactBucket.arn,
            `${artifactBucket.arn}/*`,
            artifactBucketExpressOneZone.arn,
            `${artifactBucketExpressOneZone.arn}/*`,
          ],
        },
        {
          actions: [
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:DeleteItem',
          ],
          resources: [metadataTable.arn],
        },
        {
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['arn:aws:logs:*:*:*'],
        },
      ],
    });

    new IamRolePolicy(this, 'cleanup-lambda-role-policy', {
      name: `artifact-cleanup-policy-${environmentSuffix}`,
      role: cleanupLambdaRole.id,
      policy: cleanupLambdaPolicy.json,
    });

    const lambdaCode = new TerraformAsset(this, 'lambda-code', {
      path: path.join(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    this.cleanupFunction = new LambdaFunction(this, 'cleanup-function', {
      functionName: `artifact-cleanup-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'cleanup.handler',
      role: cleanupLambdaRole.arn,
      filename: lambdaCode.path,
      sourceCodeHash: lambdaCode.assetHash,
      timeout: 300,
      memorySize: 512,
      snapStart: {
        applyOn: 'PublishedVersions',
      },
      environment: {
        variables: {
          ARTIFACT_BUCKET: artifactBucket.id,
          EXPRESS_BUCKET: artifactBucketExpressOneZone.id,
          METADATA_TABLE: metadataTable.name,
          RETENTION_DAYS: '90',
        },
      },
      tags: {
        Name: `artifact-cleanup-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Artifact Cleanup',
      },
    });

    const cleanupSchedule = new CloudwatchEventRule(this, 'cleanup-schedule', {
      name: `artifact-cleanup-schedule-${environmentSuffix}`,
      description: 'Daily artifact cleanup schedule',
      scheduleExpression: 'rate(1 day)',
    });

    new CloudwatchEventTarget(this, 'cleanup-schedule-target', {
      rule: cleanupSchedule.name,
      targetId: 'cleanup-lambda',
      arn: this.cleanupFunction.arn,
    });

    new LambdaPermission(this, 'cleanup-schedule-permission', {
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: this.cleanupFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: cleanupSchedule.arn,
    });
  }
}
```

## File: lib/package-management-stack.ts

```typescript
import { Construct } from 'constructs';
import { CodeartifactDomain } from '@cdktf/provider-aws/lib/codeartifact-domain';
import { CodeartifactRepository } from '@cdktf/provider-aws/lib/codeartifact-repository';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface PackageManagementStackProps {
  environmentSuffix: string;
  buildSystemRole: IamRole;
}

export class PackageManagementStack extends Construct {
  public readonly domain: CodeartifactDomain;
  public readonly repository: CodeartifactRepository;

  constructor(scope: Construct, id: string, props: PackageManagementStackProps) {
    super(scope, id);

    const { environmentSuffix, buildSystemRole } = props;

    this.domain = new CodeartifactDomain(this, 'artifact-domain', {
      domain: `cicd-domain-${environmentSuffix}`,
      tags: {
        Name: `cicd-domain-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Package Management Domain',
      },
    });

    this.repository = new CodeartifactRepository(this, 'artifact-repository', {
      repository: `cicd-repo-${environmentSuffix}`,
      domain: this.domain.domain,
      upstreams: [
        {
          repositoryName: 'npm-store',
        },
        {
          repositoryName: 'pypi-store',
        },
      ],
      externalConnections: {
        externalConnectionName: 'public:npmjs',
      },
      tags: {
        Name: `cicd-repo-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Package Repository',
      },
    });

    const codeArtifactPolicy = new DataAwsIamPolicyDocument(this, 'codeartifact-policy', {
      statement: [{
        actions: [
          'codeartifact:GetAuthorizationToken',
          'codeartifact:GetRepositoryEndpoint',
          'codeartifact:ReadFromRepository',
          'codeartifact:PublishPackageVersion',
          'codeartifact:PutPackageMetadata',
          'codeartifact:DescribePackageVersion',
          'codeartifact:DescribeRepository',
          'codeartifact:ListPackages',
          'codeartifact:ListPackageVersions',
        ],
        resources: [
          this.domain.arn,
          this.repository.arn,
          `${this.repository.arn}/*`,
        ],
      }],
    });

    new IamRolePolicy(this, 'codeartifact-build-policy', {
      name: `codeartifact-access-${environmentSuffix}`,
      role: buildSystemRole.id,
      policy: codeArtifactPolicy.json,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

interface MonitoringStackProps {
  environmentSuffix: string;
  artifactBucket: S3Bucket;
  cleanupFunction: LambdaFunction;
  metadataTable: DynamodbTable;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environmentSuffix, artifactBucket, cleanupFunction, metadataTable } = props;

    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/S3', 'BucketSizeBytes', { stat: 'Average', label: 'Bucket Size' }],
              ['.', 'NumberOfObjects', { stat: 'Average', label: 'Number of Objects' }],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-west-2',
            title: 'S3 Artifact Storage Metrics',
            dimensions: {
              BucketName: artifactBucket.id,
              StorageType: 'StandardStorage',
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/Lambda', 'Duration', { stat: 'Average', label: 'Average Duration' }],
              ['.', '.', { stat: 'Maximum', label: 'Max Duration' }],
              ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
              ['.', 'Invocations', { stat: 'Sum', label: 'Invocations' }],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-west-2',
            title: 'Lambda Cleanup Function Metrics',
            dimensions: {
              FunctionName: cleanupFunction.functionName,
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { stat: 'Sum', label: 'Read Capacity' }],
              ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum', label: 'Write Capacity' }],
              ['.', 'UserErrors', { stat: 'Sum', label: 'User Errors' }],
              ['.', 'SystemErrors', { stat: 'Sum', label: 'System Errors' }],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-west-2',
            title: 'DynamoDB Metadata Table Metrics',
            dimensions: {
              TableName: metadataTable.name,
            },
          },
        },
      ],
    });

    new CloudwatchDashboard(this, 'artifact-dashboard', {
      dashboardName: `artifact-management-${environmentSuffix}`,
      dashboardBody: dashboardBody,
    });

    new CloudwatchMetricAlarm(this, 's3-storage-alarm', {
      alarmName: `s3-storage-threshold-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'BucketSizeBytes',
      namespace: 'AWS/S3',
      period: 86400,
      statistic: 'Average',
      threshold: 4000000000000,
      alarmDescription: 'Alert when S3 bucket size exceeds 4TB (80% of 5TB quota)',
      treatMissingData: 'notBreaching',
      dimensions: {
        BucketName: artifactBucket.id,
        StorageType: 'StandardStorage',
      },
    });

    new CloudwatchMetricAlarm(this, 'lambda-errors-alarm', {
      alarmName: `lambda-cleanup-errors-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      alarmDescription: 'Alert on Lambda cleanup function errors',
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: cleanupFunction.functionName,
      },
    });

    new CloudwatchMetricAlarm(this, 'lambda-duration-alarm', {
      alarmName: `lambda-cleanup-duration-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Duration',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Average',
      threshold: 240000,
      alarmDescription: 'Alert when Lambda cleanup duration exceeds 4 minutes',
      treatMissingData: 'notBreaching',
      dimensions: {
        FunctionName: cleanupFunction.functionName,
      },
    });
  }
}
```

## File: lib/access-control-stack.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface AccessControlStackProps {
  environmentSuffix: string;
}

export class AccessControlStack extends Construct {
  public readonly buildSystemRole: IamRole;

  constructor(scope: Construct, id: string, props: AccessControlStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    const buildSystemAssumeRolePolicy = new DataAwsIamPolicyDocument(this, 'build-system-assume-role-policy', {
      statement: [{
        actions: ['sts:AssumeRole'],
        principals: [{
          type: 'Service',
          identifiers: [
            'ec2.amazonaws.com',
            'codebuild.amazonaws.com',
            'ecs-tasks.amazonaws.com',
          ],
        }],
      }],
    });

    this.buildSystemRole = new IamRole(this, 'build-system-role', {
      name: `cicd-build-system-${environmentSuffix}`,
      assumeRolePolicy: buildSystemAssumeRolePolicy.json,
      tags: {
        Name: `cicd-build-system-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Build System Access',
      },
    });

    const buildSystemPolicy = new DataAwsIamPolicyDocument(this, 'build-system-policy', {
      statement: [
        {
          sid: 'S3ArtifactAccess',
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
            's3:GetBucketLocation',
            's3:GetBucketVersioning',
            's3:GetObjectVersion',
          ],
          resources: [
            'arn:aws:s3:::cicd-artifacts-*',
            'arn:aws:s3:::cicd-artifacts-*/*',
          ],
        },
        {
          sid: 'DynamoDBMetadataAccess',
          actions: [
            'dynamodb:PutItem',
            'dynamodb:GetItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:UpdateItem',
          ],
          resources: ['arn:aws:dynamodb:*:*:table/artifact-metadata-*'],
        },
        {
          sid: 'CloudWatchMetrics',
          actions: [
            'cloudwatch:PutMetricData',
            'cloudwatch:GetMetricData',
            'cloudwatch:GetMetricStatistics',
          ],
          resources: ['*'],
        },
      ],
    });

    new IamRolePolicy(this, 'build-system-role-policy', {
      name: `build-system-policy-${environmentSuffix}`,
      role: this.buildSystemRole.id,
      policy: buildSystemPolicy.json,
    });
  }
}
```

## File: lib/lambda/cleanup.js

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET;
const EXPRESS_BUCKET = process.env.EXPRESS_BUCKET;
const METADATA_TABLE = process.env.METADATA_TABLE;
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '90');

exports.handler = async (event) => {
  console.log('Starting artifact cleanup process');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoffTimestamp = cutoffDate.getTime();

  try {
    // Clean up S3 artifacts
    await cleanupS3Bucket(ARTIFACT_BUCKET, cutoffTimestamp);

    // Clean up Express One Zone bucket
    if (EXPRESS_BUCKET) {
      await cleanupS3Bucket(EXPRESS_BUCKET, cutoffTimestamp);
    }

    // Clean up DynamoDB metadata
    await cleanupDynamoDB(cutoffTimestamp);

    console.log('Artifact cleanup completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cleanup completed successfully',
        cutoffDate: cutoffDate.toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

async function cleanupS3Bucket(bucketName, cutoffTimestamp) {
  console.log(`Cleaning up bucket: ${bucketName}`);

  try {
    const listParams = {
      Bucket: bucketName,
      MaxKeys: 1000,
    };

    let continuationToken = null;
    let deletedCount = 0;

    do {
      if (continuationToken) {
        listParams.ContinuationToken = continuationToken;
      }

      const listResponse = await s3.listObjectsV2(listParams).promise();

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break;
      }

      const objectsToDelete = listResponse.Contents
        .filter(obj => new Date(obj.LastModified).getTime() < cutoffTimestamp)
        .map(obj => ({ Key: obj.Key }));

      if (objectsToDelete.length > 0) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        };

        const deleteResponse = await s3.deleteObjects(deleteParams).promise();
        deletedCount += objectsToDelete.length;

        if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
          console.error('Errors deleting objects:', deleteResponse.Errors);
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    console.log(`Deleted ${deletedCount} objects from ${bucketName}`);
  } catch (error) {
    console.error(`Error cleaning up bucket ${bucketName}:`, error);
    throw error;
  }
}

async function cleanupDynamoDB(cutoffTimestamp) {
  console.log('Cleaning up DynamoDB metadata');

  try {
    const scanParams = {
      TableName: METADATA_TABLE,
      FilterExpression: '#ts < :cutoff',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':cutoff': cutoffTimestamp,
      },
    };

    let deletedCount = 0;
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const scanResponse = await dynamodb.scan(scanParams).promise();

      if (!scanResponse.Items || scanResponse.Items.length === 0) {
        break;
      }

      for (const item of scanResponse.Items) {
        const deleteParams = {
          TableName: METADATA_TABLE,
          Key: {
            artifact_id: item.artifact_id,
            build_number: item.build_number,
          },
        };

        await dynamodb.delete(deleteParams).promise();
        deletedCount++;
      }

      lastEvaluatedKey = scanResponse.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`Deleted ${deletedCount} metadata records from DynamoDB`);
  } catch (error) {
    console.error('Error cleaning up DynamoDB:', error);
    throw error;
  }
}
```