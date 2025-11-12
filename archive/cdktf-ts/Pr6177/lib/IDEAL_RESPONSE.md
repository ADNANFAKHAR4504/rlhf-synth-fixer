# Serverless CSV Processing Pipeline - CDKTF TypeScript Implementation (IDEAL)

This is the corrected implementation with improvements and fixes applied to the MODEL_RESPONSE.

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { CsvProcessingStack } from './csv-processing-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'ap-southeast-1';

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

    new CsvProcessingStack(this, 'csv-processing', {
      environmentSuffix,
    });
  }
}
```

## File: lib/csv-processing-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { TerraformOutput } from 'cdktf';

interface CsvProcessingStackProps {
  environmentSuffix: string;
}

export class CsvProcessingStack extends Construct {
  constructor(scope: Construct, id: string, props: CsvProcessingStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    new ArchiveProvider(this, 'archive', {});

    // Create DynamoDB table for storing processing results
    const dynamoTable = new DynamodbTable(this, 'processing-results-table', {
      name: `processing-results-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'fileId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'fileId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
    });

    // Create S3 bucket for CSV files
    const csvBucket = new S3Bucket(this, 'csv-data-bucket', {
      bucket: `csv-data-${environmentSuffix}`,
      forceDestroy: true,
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'csv-bucket-versioning', {
      bucket: csvBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable SSE-S3 encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'csv-bucket-encryption',
      {
        bucket: csvBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'csv-bucket-public-access-block', {
      bucket: csvBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create SQS dead letter queue
    const deadLetterQueue = new SqsQueue(this, 'csv-processing-dlq', {
      name: `csv-processing-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
    });

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'csv-processor-logs', {
      name: `/aws/lambda/csv-processor-${environmentSuffix}`,
      retentionInDays: 7,
    });

    // Create IAM role for Lambda
    const lambdaRole = new IamRole(this, 'csv-processor-role', {
      name: `csv-processor-role-${environmentSuffix}`,
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
    });

    // Create IAM policy for Lambda
    const lambdaPolicy = new IamPolicy(this, 'csv-processor-policy', {
      name: `csv-processor-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [csvBucket.arn, `${csvBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:GetItem',
            ],
            Resource: dynamoTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${logGroup.arn}:*`,
          },
          {
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: deadLetterQueue.arn,
          },
        ],
      }),
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Create Lambda deployment package
    const lambdaArchive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda/csv-processor`,
      outputPath: `${__dirname}/lambda/csv-processor.zip`,
    });

    // Create Lambda function
    const lambdaFunction = new LambdaFunction(this, 'csv-processor', {
      functionName: `csv-processor-${environmentSuffix}`,
      runtime: 'python3.9',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      timeout: 300, // 5 minutes
      memorySize: 512,
      environment: {
        variables: {
          DYNAMODB_TABLE_NAME: dynamoTable.name,
          S3_BUCKET_NAME: csvBucket.bucket,
          PROCESSING_CONFIG: 'standard',
        },
      },
      deadLetterConfig: {
        targetArn: deadLetterQueue.arn,
      },
    });

    // Grant S3 permission to invoke Lambda
    new LambdaPermission(this, 'allow-s3-invoke', {
      statementId: 'AllowS3Invoke',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: csvBucket.arn,
    });

    // Configure S3 bucket notification
    new S3BucketNotification(this, 'csv-bucket-notification', {
      bucket: csvBucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: lambdaFunction.arn,
          events: ['s3:ObjectCreated:*'],
          filterPrefix: 'raw-data/',
          filterSuffix: '.csv',
        },
      ],
    });

    // Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: csvBucket.bucket,
      description: 'Name of the S3 bucket for CSV files',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaFunction.arn,
      description: 'ARN of the Lambda function',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: dynamoTable.name,
      description: 'Name of the DynamoDB table',
    });
  }
}
```

## File: lib/lambda/csv-processor/index.py

```python
import json
import csv
import boto3
import os
from datetime import datetime
from io import StringIO
from urllib.parse import unquote_plus

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def handler(event, context):
    """
    Process CSV files uploaded to S3.
    Extract transaction summaries and data quality metrics.
    """
    try:
        # Get bucket and key from S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])

            print(f"Processing file: {bucket}/{key}")

            # Download CSV file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')

            # Process CSV file
            csv_reader = csv.DictReader(StringIO(csv_content))
            rows = list(csv_reader)

            # Extract metrics
            total_rows = len(rows)
            file_id = key.split('/')[-1].replace('.csv', '')
            timestamp = int(datetime.now().timestamp())

            # Calculate data quality metrics
            complete_rows = sum(1 for row in rows if all(row.values()))
            completeness_rate = (complete_rows / total_rows * 100) if total_rows > 0 else 0

            # Extract transaction summary (example: sum of amounts if present)
            transaction_summary = {
                'total_records': total_rows,
                'complete_records': complete_rows,
                'completeness_percentage': round(completeness_rate, 2),
                'columns': list(rows[0].keys()) if rows else [],
            }

            # Store results in DynamoDB
            table.put_item(
                Item={
                    'fileId': file_id,
                    'timestamp': timestamp,
                    'bucket': bucket,
                    'key': key,
                    'metrics': transaction_summary,
                    'status': 'completed',
                    'processedAt': datetime.now().isoformat(),
                }
            )

            print(f"Successfully processed {key}")
            print(f"Metrics: {json.dumps(transaction_summary)}")

        return {
            'statusCode': 200,
            'body': json.dumps('Processing completed successfully')
        }

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise
```

## File: lib/lambda/csv-processor/requirements.txt

```
boto3>=1.26.0
```

## Key Improvements in IDEAL_RESPONSE

1. Added TerraformOutput constructs to expose S3 bucket name, Lambda function ARN, and DynamoDB table name as required
2. Removed unnecessary LambdaEventSourceMapping import (was not used)
3. Removed dependsOn from S3BucketNotification (implicit dependency through LambdaPermission is sufficient)
4. All other aspects of the implementation are correct and complete
