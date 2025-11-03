import { Construct } from 'constructs';
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

export class DocumentManagementStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: DocumentManagementStackProps
  ) {
    super(scope, id);

    const { environment, environmentSuffix } = props;

    // Environment-specific configurations
    const lifecycleArchiveDays = environment === 'dev' ? 30 : 90;
    const lambdaTimeout =
      environment === 'dev' ? 30 : environment === 'staging' ? 60 : 120;
    const lambdaMemory =
      environment === 'dev' ? 256 : environment === 'staging' ? 512 : 1024;

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
      bucket: `company-docs-${environmentSuffix}`,
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
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Lifecycle rules
    new S3BucketLifecycleConfiguration(this, 'BucketLifecycle', {
      bucket: documentBucket.id,
      rule: [
        {
          id: 'archive-old-documents',
          status: 'Enabled',
          transition: [
            {
              days: lifecycleArchiveDays,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // DynamoDB table for metadata
    const metadataTable = new DynamodbTable(this, 'MetadataTable', {
      name: `document-metadata-${environmentSuffix}`,
      billingMode: dynamodbBillingMode,
      hashKey: 'documentId',
      attribute: [
        {
          name: 'documentId',
          type: 'S',
        },
      ],
      ...(dynamodbBillingMode === 'PROVISIONED'
        ? {
            readCapacity,
            writeCapacity,
          }
        : {}),
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
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Environment: environment,
        Project: 'DocumentManagement',
      },
    });

    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Package Lambda code
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/../lambda-package.zip`,
    });

    // Lambda function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const readThrottleThreshold =
      environment === 'dev' ? 5 : environment === 'staging' ? 10 : 20;
    const writeThrottleThreshold =
      environment === 'dev' ? 5 : environment === 'staging' ? 10 : 20;

    new CloudwatchMetricAlarm(this, 'ReadThrottleAlarm', {
      alarmName: `${metadataTable.name}-read-throttle`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ReadThrottleEvents',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: readThrottleThreshold,
      alarmDescription:
        'Alert when DynamoDB read throttle events exceed threshold',
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
      alarmDescription:
        'Alert when DynamoDB write throttle events exceed threshold',
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
