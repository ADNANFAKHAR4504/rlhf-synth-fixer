# Document Management Infrastructure - CDKTF Implementation

This implementation provides a multi-environment document management system using CDKTF with TypeScript. The infrastructure includes S3 for storage, DynamoDB for metadata, Lambda for processing, and CloudWatch for monitoring.

## File: lib/document-management-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';

export interface DocumentManagementStackProps {
  environment: string;
  environmentSuffix: string;
}

export class DocumentManagementStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: DocumentManagementStackProps) {
    super(scope, id);

    const { environment, environmentSuffix } = props;

    // Environment-specific configurations
    const lifecycleArchiveDays = environment === 'dev' ? 30 : 90;
    const lambdaTimeout = environment === 'dev' ? 30 : environment === 'staging' ? 60 : 120;
    const lambdaMemory = environment === 'dev' ? 256 : environment === 'staging' ? 512 : 1024;

    // DynamoDB capacity configuration
    let dynamodbBillingMode = 'PROVISIONED';
    let readCapacity = 5;
    let writeCapacity = 5;

    if (environment === 'dev') {
      dynamodbBillingMode = 'PAY_PER_REQUEST';
    } else if (environment === 'staging') {
      readCapacity = 10;
      writeCapacity = 10;
    } else if (environment === 'prod') {
      readCapacity = 25;
      writeCapacity = 25;
    }

    // S3 Bucket for document storage
    const documentBucket = new S3Bucket(this, 'DocumentBucket', {
      bucket: `company-docs-${environment}`,
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    // Enable versioning for staging and prod
    if (environment !== 'dev') {
      new S3BucketVersioningA(this, 'BucketVersioning', {
        bucket: documentBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: documentBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    });

    // Lifecycle rules
    new S3BucketLifecycleConfiguration(this, 'BucketLifecycle', {
      bucket: documentBucket.id,
      rule: [{
        id: 'archive-old-documents',
        status: 'Enabled',
        transition: [{
          days: lifecycleArchiveDays,
          storageClass: 'GLACIER',
        }],
      }],
    });

    // DynamoDB table for metadata
    const metadataTable = new DynamodbTable(this, 'MetadataTable', {
      name: `document-metadata-${environment}`,
      billingMode: dynamodbBillingMode,
      hashKey: 'documentId',
      attribute: [{
        name: 'documentId',
        type: 'S',
      }],
      ...(dynamodbBillingMode === 'PROVISIONED' ? {
        readCapacity,
        writeCapacity,
      } : {}),
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, 'LambdaRole', {
      name: `document-processor-role-${environmentSuffix}`,
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
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Package Lambda code
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/../lambda-package.zip`,
    });

    // Lambda function
    const processorFunction = new LambdaFunction(this, 'ProcessorFunction', {
      functionName: `document-processor-${environmentSuffix}`,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      timeout: lambdaTimeout,
      memorySize: lambdaMemory,
      environment: {
        variables: {
          BUCKET_NAME: documentBucket.bucket,
          TABLE_NAME: metadataTable.name,
          ENVIRONMENT: environment,
        },
      },
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    // SNS Topic for alarms
    const alarmTopic = new SnsTopic(this, 'AlarmTopic', {
      name: `dynamodb-alarms-${environmentSuffix}`,
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    // CloudWatch Alarms for DynamoDB throttling
    const readThrottleThreshold = environment === 'dev' ? 5 : environment === 'staging' ? 10 : 20;
    const writeThrottleThreshold = environment === 'dev' ? 5 : environment === 'staging' ? 10 : 20;

    new CloudwatchMetricAlarm(this, 'ReadThrottleAlarm', {
      alarmName: `${metadataTable.name}-read-throttle`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ReadThrottleEvents',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: readThrottleThreshold,
      alarmDescription: 'Alert when DynamoDB read throttle events exceed threshold',
      dimensions: {
        TableName: metadataTable.name,
      },
      alarmActions: [alarmTopic.arn],
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    new CloudwatchMetricAlarm(this, 'WriteThrottleAlarm', {
      alarmName: `${metadataTable.name}-write-throttle`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'WriteThrottleEvents',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: writeThrottleThreshold,
      alarmDescription: 'Alert when DynamoDB write throttle events exceed threshold',
      dimensions: {
        TableName: metadataTable.name,
      },
      alarmActions: [alarmTopic.arn],
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });
  }
}
```

## File: lib/lambda/index.ts

```typescript
import { S3Event } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Processing document event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const key = record.s3.object.key;
    const size = record.s3.object.size;

    try {
      // Store metadata in DynamoDB
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          documentId: key,
          uploadedAt: new Date().toISOString(),
          size: size,
          status: 'processed',
        },
      }).promise();

      console.log(`Metadata stored for document: ${key}`);
    } catch (error) {
      console.error(`Error processing document ${key}:`, error);
      throw error;
    }
  }
};
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DocumentManagementStack } from './document-management-stack';

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
      : props?.awsRegion || 'ap-southeast-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate document management stack
    new DocumentManagementStack(this, 'DocumentManagement', {
      environment: environmentSuffix,
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Deploy for different environments:
```bash
# Dev environment
cdktf deploy --var="environmentSuffix=dev"

# Staging environment
cdktf deploy --var="environmentSuffix=staging"

# Production environment
cdktf deploy --var="environmentSuffix=prod"
```

3. The infrastructure creates:
   - S3 bucket with environment-specific naming
   - DynamoDB table with appropriate capacity
   - Lambda function for processing
   - CloudWatch alarms for monitoring

## Notes

- All resources are tagged with Environment and Project tags
- Resources are named with environment suffixes for easy identification
- DynamoDB uses on-demand billing for dev, provisioned capacity for staging/prod
- S3 versioning is enabled only for staging and production
- Lifecycle rules archive objects based on environment (30 days for dev, 90 days for others)