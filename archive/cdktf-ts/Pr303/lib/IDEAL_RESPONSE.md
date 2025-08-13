# Serverless Image Processing Infrastructure with CDKTF

## Overview

This document provides a comprehensive solution for deploying a serverless image processing pipeline on AWS using CDKTF (Cloud Development Kit for Terraform) in TypeScript. The infrastructure includes an S3 bucket that triggers a Python Lambda function, which processes events and publishes notifications to an SNS topic, with an SQS queue serving as a dead-letter queue for error handling.

## Architecture

The solution implements the following architecture:

1. **S3 Bucket** - Stores images and triggers processing events
2. **Lambda Function** - Processes S3 events using Python 3.8 runtime
3. **SNS Topic** - Receives success notifications from Lambda
4. **SQS Dead Letter Queue** - Handles failed Lambda invocations
5. **CloudWatch Log Group** - Stores Lambda execution logs
6. **IAM Roles & Policies** - Provides least-privilege access control

## File Structure

```
.
├── bin/
│   └── tap.ts                          # CDKTF app entry point
├── lib/
│   ├── tap-stack.ts                    # Main infrastructure stack
│   ├── lambda/
│   │   └── index.py                    # Python Lambda function
│   ├── PROMPT.md                       # Original requirements
│   └── IDEAL_RESPONSE.md               # This documentation
├── test/
│   ├── tap-stack.unit.test.ts          # Unit tests
│   └── tap-stack.int.test.ts           # Integration tests
├── cdktf.json                          # CDKTF configuration
├── package.json                        # Node.js dependencies
└── tsconfig.json                       # TypeScript configuration
```

## Implementation Files

### bin/tap.ts
```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();
new TapStack(app, 'TapStack', {
  environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
  stateBucket: process.env.STATE_BUCKET || 'tap-state-bucket',
  stateBucketRegion: process.env.STATE_BUCKET_REGION || 'us-east-1',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: {
      Environment: 'Production',
      Repository: process.env.REPOSITORY || 'iac-test-automations',
      Author: process.env.COMMIT_AUTHOR || 'system',
    }
  }
});
app.synth();
```

### lib/tap-stack.ts
```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformAsset, AssetType } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import * as path from 'path';

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    props: {
      environmentSuffix: string;
      stateBucket: string;
      stateBucketRegion: string;
      awsRegion: string;
      defaultTags: { tags: Record<string, string> };
    }
  ) {
    super(scope, id);

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, 'AWS', {
      region: 'us-east-1',
    });

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
    };

    // Generate unique suffix for bucket name
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    // Create SQS Dead Letter Queue for Lambda function
    const dlqQueue = new SqsQueue(this, 'ImageProcessingDLQ', {
      name: 'image-processing-lambda-dlq',
      tags: commonTags,
    });

    // Create SNS Topic for success notifications
    const snsTopic = new SnsTopic(this, 'ImageProcessingTopic', {
      name: 'image-processing-completion-notifications',
      tags: commonTags,
    });

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
      name: '/aws/lambda/image-processing-function',
      retentionInDays: 14,
      tags: commonTags,
    });

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new IamRole(this, 'LambdaExecutionRole', {
      name: 'image-processing-lambda-role',
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
      tags: commonTags,
    });

    // Create IAM policy for Lambda function with specific permissions
    new IamRolePolicy(this, 'LambdaPolicy', {
      name: 'image-processing-lambda-policy',
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            // CloudWatch Logs permissions
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${logGroup.arn}:*`,
          },
          {
            // SNS publish permissions
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: snsTopic.arn,
          },
          {
            // SQS send message permissions for DLQ
            Effect: 'Allow',
            Action: ['sqs:SendMessage'],
            Resource: dlqQueue.arn,
          },
        ],
      }),
    });

    // Package Lambda function code
    const lambdaAsset = new TerraformAsset(this, 'LambdaAsset', {
      path: path.join(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    // Create Lambda function
    const lambdaFunction = new LambdaFunction(this, 'ImageProcessingFunction', {
      functionName: 'image-processing-function',
      role: lambdaRole.arn,
      handler: 'index.lambda_handler',
      runtime: 'python3.8',
      filename: lambdaAsset.path,
      sourceCodeHash: lambdaAsset.assetHash,
      timeout: 30,
      environment: {
        variables: {
          SNS_TOPIC_ARN: snsTopic.arn,
        },
      },
      deadLetterConfig: {
        targetArn: dlqQueue.arn,
      },
      dependsOn: [logGroup],
      tags: commonTags,
    });

    // Create S3 bucket for image processing
    const s3Bucket = new S3Bucket(this, 'ImageProcessingBucket', {
      bucket: `image-processing-source-bucket-${uniqueSuffix}`,
      tags: commonTags,
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Grant S3 permission to invoke Lambda function
    new LambdaPermission(this, 'S3InvokeLambdaPermission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: s3Bucket.arn,
    });

    // Configure S3 bucket notification to trigger Lambda
    new S3BucketNotification(this, 'BucketNotification', {
      bucket: s3Bucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: lambdaFunction.arn,
          events: ['s3:ObjectCreated:*'],
        },
      ],
      dependsOn: [lambdaFunction],
    });
  }
}
```

### lib/lambda/index.py
```python
import json
import os
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns_client = boto3.client('sns')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda function to process S3 ObjectCreated events.
    
    This function:
    1. Processes S3 event notifications
    2. Logs event details to CloudWatch
    3. Publishes success notifications to SNS topic
    4. Handles errors gracefully (failures will be sent to DLQ)
    
    Args:
        event: S3 event notification
        context: Lambda runtime context
        
    Returns:
        Dictionary with processing status
    """
    try:
        logger.info(f"Received S3 event: {json.dumps(event, indent=2)}")
        
        # Get SNS topic ARN from environment variables
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if not sns_topic_arn:
            raise ValueError("SNS_TOPIC_ARN environment variable not set")
        
        # Process each S3 record in the event
        processed_objects = []
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                # Extract S3 object information
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for object: s3://{bucket_name}/{object_key}")
                
                # Simulate image processing
                processing_result = {
                    'bucket': bucket_name,
                    'key': object_key,
                    'event': event_name,
                    'timestamp': record['eventTime'],
                    'status': 'processed_successfully'
                }
                processed_objects.append(processing_result)
                
                # Publish success notification to SNS
                message = {
                    'message': 'Image processing completed successfully',
                    'details': processing_result
                }
                
                response = sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(message, indent=2),
                    Subject=f'Image Processing Complete: {object_key}'
                )
                
                logger.info(f"Published SNS notification. MessageId: {response['MessageId']}")
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'processed_objects': processed_objects,
                'total_processed': len(processed_objects)
            }, indent=2)
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        # Re-raise the exception so Lambda will send the event to DLQ
        raise e
```

### cdktf.json
```json
{
  "language": "typescript",
  "app": "npx ts-node bin/tap.ts",
  "projectId": "tap-stack",
  "terraformProviders": ["aws@~> 6.0"],
  "terraformModules": [],
  "terraformVersion": "1.8",
  "codeMakerOutput": "cdktf.out",
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Deployment Instructions

### Prerequisites

1. **Node.js 22.17.0** - Exact version required
2. **Python 3.12.11** - For Lambda development
3. **AWS CLI** - Configured with appropriate credentials
4. **Terraform** - Version 1.8 or later

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Get CDKTF Providers**
   ```bash
   npm run cdktf:get
   ```

3. **Build TypeScript**
   ```bash
   npm run build
   ```

### Deployment

1. **Synthesize Infrastructure**
   ```bash
   npm run cdktf:synth
   ```

2. **Deploy Infrastructure**
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   npm run cdktf:deploy
   ```

3. **Verify Deployment**
   ```bash
   # Check if S3 bucket was created
   aws s3 ls | grep image-processing-source-bucket
   
   # Check if Lambda function exists
   aws lambda get-function --function-name image-processing-function
   
   # Check if SNS topic exists
   aws sns list-topics | grep image-processing-completion-notifications
   ```

### Testing

1. **Run Unit Tests**
   ```bash
   npm run test:unit
   ```

2. **Run Integration Tests**
   ```bash
   npm run test:integration
   ```

3. **Test End-to-End Workflow**
   ```bash
   # Upload test file to S3 bucket
   echo "test content" > test-image.txt
   aws s3 cp test-image.txt s3://<bucket-name>/test-image.txt
   
   # Check CloudWatch logs
   aws logs describe-log-streams --log-group-name /aws/lambda/image-processing-function
   ```

## Compliance Verification

### Requirements Checklist

- ✅ **AWS Region**: All resources deployed in us-east-1
- ✅ **CDKTF Version**: Terraform 1.8, AWS provider 6.0+
- ✅ **S3 Bucket**: Unique name with prefix `image-processing-source-bucket-`
- ✅ **S3 Encryption**: Server-side encryption with AES256
- ✅ **S3 Versioning**: Enabled for object tracking
- ✅ **S3 Trigger**: ObjectCreated events trigger Lambda
- ✅ **Lambda Runtime**: Python 3.8
- ✅ **Lambda Logging**: CloudWatch Log Group configured
- ✅ **Lambda SNS**: Publishes to SNS topic on success
- ✅ **Lambda DLQ**: SQS queue for failed invocations
- ✅ **SNS Topic**: Named `image-processing-completion-notifications`
- ✅ **SQS DLQ**: Named `image-processing-lambda-dlq`
- ✅ **IAM Policies**: Least privilege permissions
- ✅ **Tagging**: Environment: Production on all resources

### Security Features

1. **Least Privilege IAM**: Lambda role has minimal required permissions
2. **Server-Side Encryption**: S3 bucket encrypted with AES256
3. **Error Handling**: Dead letter queue for failed Lambda invocations
4. **Logging**: Comprehensive CloudWatch logging for observability
5. **Resource Isolation**: Dedicated CloudWatch log group per function

## Monitoring and Observability

### CloudWatch Metrics

- **Lambda Invocations**: Track function execution count
- **Lambda Errors**: Monitor failed executions
- **Lambda Duration**: Measure execution time
- **S3 Events**: Monitor bucket activity
- **SNS Messages**: Track notification delivery
- **SQS Messages**: Monitor DLQ for failures

### CloudWatch Logs

- **Lambda Logs**: `/aws/lambda/image-processing-function`
- **Log Retention**: 14 days for cost optimization

### Alarms (Recommended)

1. **Lambda Error Rate > 5%**: Alert on high failure rate
2. **DLQ Messages > 0**: Alert when messages land in DLQ
3. **Lambda Duration > 25s**: Alert on performance issues

## Cost Optimization

### Resource Sizing

- **Lambda Memory**: Default 128MB (adjust based on processing needs)
- **Lambda Timeout**: 30 seconds (sufficient for most image processing)
- **Log Retention**: 14 days (balance cost vs. troubleshooting needs)

### Estimated Monthly Costs (us-east-1)

- **S3 Storage**: $0.023/GB
- **Lambda Invocations**: $0.20 per 1M requests
- **Lambda Duration**: $0.00001667 per GB-second
- **SNS Messages**: $0.50 per 1M messages
- **SQS Messages**: $0.40 per 1M messages
- **CloudWatch Logs**: $0.50 per GB

## Cleanup

To destroy all resources:

```bash
npm run cdktf:destroy
```

## Troubleshooting

### Common Issues

1. **Lambda Package Size**: Ensure Python dependencies fit within limits
2. **IAM Permissions**: Verify least privilege permissions are sufficient
3. **S3 Notification**: Ensure Lambda permission allows S3 invocation
4. **DLQ Configuration**: Check queue ARN is correctly referenced

### Debugging Steps

1. **Check CloudWatch Logs**: Review Lambda execution logs
2. **Verify IAM Policies**: Ensure all required permissions are granted
3. **Test Lambda Locally**: Use AWS SAM for local testing
4. **Monitor CloudWatch Metrics**: Check invocation and error rates

This solution provides a production-ready, scalable, and secure serverless image processing pipeline that meets all specified requirements while following AWS best practices for cost optimization, security, and observability.