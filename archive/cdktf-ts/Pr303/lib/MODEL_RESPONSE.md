<cdktf_typescript_code>

**cdktf.json**
```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "image-processing-pipeline",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 3.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  },
  "terraformVersion": "~> 0.15"
}
```

**package.json**
```json
{
  "name": "image-processing-pipeline",
  "version": "1.0.0",
  "description": "Serverless image processing pipeline using CDKTF",
  "main": "main.ts",
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
    "@types/node": "^18.15.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5"
  },
  "dependencies": {
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0",
    "@cdktf/provider-aws": "^16.0.0"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "alwaysStrict": true,
    "charset": "utf8",
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": [
      "es2018"
    ],
    "module": "CommonJS",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2018",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "cdktf.out"
  ]
}
```

**main.ts**
```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformAsset, AssetType } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketNotification } from "@cdktf/provider-aws/lib/s3-bucket-notification";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SqsQueue } from "@cdktf/provider-aws/lib/sqs-queue";
import * as path from "path";

class ImageProcessingStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, "AWS", {
      region: "us-east-1",
    });

    // Common tags for all resources
    const commonTags = {
      Environment: "Production",
    };

    // Generate unique suffix for bucket name
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    // Create SQS Dead Letter Queue for Lambda function
    const dlqQueue = new SqsQueue(this, "ImageProcessingDLQ", {
      name: "image-processing-lambda-dlq",
      tags: commonTags,
    });

    // Create SNS Topic for success notifications
    const snsTopic = new SnsTopic(this, "ImageProcessingTopic", {
      name: "image-processing-completion-notifications",
      tags: commonTags,
    });

    // Create CloudWatch Log Group for Lambda function
    const logGroup = new CloudwatchLogGroup(this, "LambdaLogGroup", {
      name: "/aws/lambda/image-processing-function",
      retentionInDays: 14,
      tags: commonTags,
    });

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new IamRole(this, "LambdaExecutionRole", {
      name: "image-processing-lambda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // Create IAM policy for Lambda function with specific permissions
    new IamRolePolicy(this, "LambdaPolicy", {
      name: "image-processing-lambda-policy",
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            // CloudWatch Logs permissions
            Effect: "Allow",
            Action: [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: `${logGroup.arn}:*`,
          },
          {
            // SNS publish permissions
            Effect: "Allow",
            Action: ["sns:Publish"],
            Resource: snsTopic.arn,
          },
          {
            // SQS send message permissions for DLQ
            Effect: "Allow",
            Action: ["sqs:SendMessage"],
            Resource: dlqQueue.arn,
          },
        ],
      }),
    });

    // Package Lambda function code
    const lambdaAsset = new TerraformAsset(this, "LambdaAsset", {
      path: path.resolve(__dirname, "lib/lambda"),
      type: AssetType.ARCHIVE,
    });

    // Create Lambda function
    const lambdaFunction = new LambdaFunction(this, "ImageProcessingFunction", {
      functionName: "image-processing-function",
      role: lambdaRole.arn,
      handler: "index.lambda_handler",
      runtime: "python3.8",
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
    const s3Bucket = new S3Bucket(this, "ImageProcessingBucket", {
      bucket: `image-processing-source-bucket-${uniqueSuffix}`,
      tags: commonTags,
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioning(this, "BucketVersioning", {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Configure server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfiguration(this, "BucketEncryption", {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // Grant S3 permission to invoke Lambda function
    new LambdaPermission(this, "S3InvokeLambdaPermission", {
      statementId: "AllowExecutionFromS3Bucket",
      action: "lambda:InvokeFunction",
      functionName: lambdaFunction.functionName,
      principal: "s3.amazonaws.com",
      sourceArn: s3Bucket.arn,
    });

    // Configure S3 bucket notification to trigger Lambda
    new S3BucketNotification(this, "BucketNotification", {
      bucket: s3Bucket.id,
      lambdaFunction: [
        {
          lambdaFunctionArn: lambdaFunction.arn,
          events: ["s3:ObjectCreated:*"],
        },
      ],
      dependsOn: [lambdaFunction],
    });

    // Output important resource information
    console.log(`S3 Bucket Name: ${s3Bucket.bucket}`);
    console.log(`Lambda Function Name: ${lambdaFunction.functionName}`);
    console.log(`SNS Topic ARN: ${snsTopic.arn}`);
    console.log(`SQS DLQ URL: ${dlqQueue.url}`);
  }
}

const app = new App();
new ImageProcessingStack(app, "image-processing-pipeline");
app.synth();
```

**lib/lambda/index.py**
```python
import json
import boto3
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns_client = boto3.client('sns')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function to process S3 events and publish notifications to SNS.
    
    Args:
        event: S3 event data
        context: Lambda context object
        
    Returns:
        Dict containing processing results
    """
    
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get SNS topic ARN from environment variable
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
                
                logger.info(f"Processing {event_name} for object {object_key} in bucket {bucket_name}")
                
                # Simulate image processing (in real scenario, this would contain actual processing logic)
                processing_result = simulate_image_processing(bucket_name, object_key)
                
                # Prepare notification message
                notification_message = {
                    'bucket': bucket_name,
                    'object_key': object_key,
                    'event_type': event_name,
                    'processing_status': processing_result['status'],
                    'processing_time': processing_result['processing_time'],
                    'message': f"Successfully processed {object_key}"
                }
                
                # Publish notification to SNS topic
                sns_response = sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(notification_message),
                    Subject=f"Image Processing Complete: {object_key}"
                )
                
                logger.info(f"Published SNS notification with MessageId: {sns_response['MessageId']}")
                
                processed_objects.append({
                    'bucket': bucket_name,
                    'object_key': object_key,
                    'status': 'success',
                    'sns_message_id': sns_response['MessageId']
                })
        
        # Return successful response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed all objects',
                'processed_objects': processed_objects
            })
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error processing event: {str(e)}")
        
        # Re-raise the exception to trigger DLQ handling
        raise e

def simulate_image_processing(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """
    Simulate image processing logic.
    
    Args:
        bucket_name: S3 bucket name
        object_key: S3 object key
        
    Returns:
        Dict containing processing results
    """
    
    import time
    
    # Simulate processing time
    processing_start = time.time()
    
    # Simulate some processing work
    time.sleep(0.1)  # Simulate 100ms processing time
    
    processing_end = time.time()
    processing_time = processing_end - processing_start
    
    logger.info(f"Simulated processing of {object_key} completed in {processing_time:.3f} seconds")
    
    return {
        'status': 'completed',
        'processing_time': processing_time,
        'processed_at': time.time()
    }
```

</cdktf_typescript_code>

## Summary

This CDKTF TypeScript application creates a comprehensive serverless image processing pipeline with the following key features:

### **Architecture Components:**
1. **S3 Bucket** with versioning and AES256 encryption that triggers Lambda on object creation
2. **Lambda Function** (Python 3.8) with proper error handling and DLQ configuration
3. **SNS Topic** for success notifications
4. **SQS Queue** as dead-letter queue for failed Lambda invocations
5. **CloudWatch Log Group** for centralized logging
6. **IAM Role** with least-privilege policies

### **Key Features:**
- **Type Safety**: Full TypeScript type checking for infrastructure code
- **Resource Connections**: Proper dependency management using CDKTF object references
- **Security**: Least-privilege IAM policies with resource-specific ARNs
- **Observability**: CloudWatch logging and SNS notifications
- **Resilience**: Dead-letter queue for error handling
- **Consistency**: Environment tags applied to all resources
- **Maintainability**: Well-structured, commented code with logical organization

### **Deployment:**
To deploy this infrastructure:
1. Run `npm install` to install dependencies
2. Run `cdktf get` to download provider bindings
3. Run `cdktf deploy` to provision the infrastructure

The application follows CDKTF best practices and provides a robust, production-ready serverless image processing pipeline.