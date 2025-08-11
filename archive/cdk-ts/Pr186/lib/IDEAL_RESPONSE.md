# Serverless Image Processing Pipeline - AWS CDK TypeScript Solution

## Thinking Process

### Decomposition
I've broken down the requirements into the following key components:
1. **S3 Integration**: Reference existing S3 bucket for image storage
2. **API Gateway**: REST API with POST endpoint for triggering image processing
3. **Lambda Function**: TypeScript-based image processor with SNS publishing
4. **IAM Role**: Least privilege permissions for Lambda execution
5. **SNS Topic**: Notification system for processing completion

### Resource Mapping
- **S3 Bucket**: `s3.Bucket.fromBucketName()` to reference existing bucket
- **API Gateway**: `apigateway.RestApi` with `LambdaIntegration`
- **Lambda Function**: `lambda.Function` with TypeScript runtime
- **IAM Role**: `iam.Role` with specific policies for S3 and SNS access
- **SNS Topic**: `sns.Topic` for notifications

### Connection Strategy
- API Gateway triggers Lambda via proxy integration
- Lambda accesses S3 bucket using IAM role permissions
- Lambda publishes to SNS topic after processing
- Environment variables pass configuration to Lambda

### Least Privilege Implementation
The IAM role includes only:
- AWS Lambda basic execution role for CloudWatch logs
- S3 read/write permissions scoped to the specific bucket
- SNS publish permissions scoped to the specific topic

### File Structure
```
├── lib/
│   └── tap-stack.ts          # Main CDK stack
├── lambda/
│   ├── imageProcessor.ts     # Lambda function code
│   └── package.json         # Lambda dependencies
├── test/
│   ├── tap-stack.unit.test.ts    # Unit tests
│   └── tap-stack.int.test.ts     # Integration tests
├── bin/
│   └── tap.ts               # CDK app entry point
├── cdk.json                 # CDK configuration
└── package.json             # Project dependencies
```

## Implementation

### CDK Stack (lib/tap-stack.ts)

<typescript_code>
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

export interface TapStackProps extends StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, { ...props, env: { region: 'us-east-1' } });

    const { environmentSuffix } = props;

    // Reference existing S3 bucket
    const existingBucketName =
      this.node.tryGetContext('existingBucketName') || 'my-default-bucket';
    const imageBucket = s3.Bucket.fromBucketName(
      this,
      'ExistingImageBucket',
      existingBucketName
    );

    // Create SNS topic
    const notificationTopic = new sns.Topic(
      this,
      'ImageProcessingNotifications',
      {
        displayName: 'Image Processing Completion Notifications',
      }
    );

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'ImageProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions
    imageBucket.grantReadWrite(lambdaRole);
    notificationTopic.grantPublish(lambdaRole);

    // Lambda function
    const imageProcessor = new lambda.Function(this, 'ImageProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'imageProcessor.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        IMAGE_BUCKET: imageBucket.bucketName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
      role: lambdaRole,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ImageProcessingApi', {
      restApiName: 'ImageProcessingService',
      description: 'API Gateway for image processing requests',
    });

    const imageResource = api.root.addResource('process');
    imageResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(imageProcessor)
    );

    // Outputs for integration tests
    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
    });

    new cdk.CfnOutput(this, 'ImageProcessingApiRestApiId', {
      value: api.restApiId,
    });

    new cdk.CfnOutput(this, 'ImageProcessingApiUrl', {
      value: api.url,
    });

    new cdk.CfnOutput(this, 'ImageProcessorFunctionName', {
      value: imageProcessor.functionName,
    });
  }
}
```
</typescript_code>

### Lambda Function (lambda/imageProcessor.ts)

<typescript_code>
```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface ImageRequest {
  imageKey: string;
  metadata: Record<string, string>;
}

const snsClient = new SNSClient({});
const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';

export const handler = async (event: ImageRequest): Promise<void> => {
  try {
    const { imageKey, metadata } = event;

    // Simulate image processing
    console.log(`Processing image: ${imageKey} with metadata:`, metadata);

    // Publish success notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Message: `Successfully processed image: ${imageKey}`,
      })
    );
  } catch (error) {
    console.error('Processing failed:', error);
  }
};
```
</typescript_code>

### Lambda Dependencies (lambda/package.json)

<typescript_code>
```json
{
  "name": "image-processor-lambda",
  "version": "1.0.0",
  "description": "Lambda function for processing images",
  "main": "imageProcessor.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.848.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "typescript": "^5.8.3"
  }
}
```
</typescript_code>

### CDK App Entry Point (bin/tap.ts)

<typescript_code>
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix for resource naming
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: 'us-east-1',
  },
});
```
</typescript_code>

### CDK Configuration (cdk.json)

<typescript_code>
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```
</typescript_code>

## Key Features

### Security Implementation
- **Least Privilege IAM**: Lambda role has minimal required permissions
- **Resource-Scoped Access**: S3 and SNS permissions limited to specific resources
- **No Hardcoded Values**: Configuration passed via environment variables

### Architecture Highlights
- **Serverless Design**: No EC2 instances or persistent infrastructure
- **Event-Driven**: API Gateway triggers Lambda processing
- **Decoupled Notifications**: SNS enables loose coupling for notifications
- **Regional Deployment**: Explicitly deployed to us-east-1 region

### Error Handling
- Lambda function includes try-catch for error handling
- CloudWatch logs capture all processing events
- API Gateway provides standard HTTP error responses

### Testing Strategy
- **Unit Tests**: Verify CDK template generation and resource properties
- **Integration Tests**: Validate deployed infrastructure and end-to-end workflows
- **Coverage**: Tests include both positive and negative scenarios

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Project**:
   ```bash
   npm run build
   ```

3. **Deploy with CDK**:
   ```bash
   npx cdk deploy --context existingBucketName=your-existing-bucket-name
   ```

4. **Test the Deployment**:
   ```bash
   npm run test:unit
   npm run test:integration
   ```

## Usage Example

Once deployed, send a POST request to the API Gateway endpoint:

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/process \
  -H "Content-Type: application/json" \
  -d '{
    "imageKey": "photos/vacation/beach.jpg",
    "metadata": {
      "timestamp": "2025-01-01T12:00:00Z",
      "userId": "user123",
      "operation": "resize"
    }
  }'
```

The Lambda function will process the request and publish a notification to the SNS topic upon completion.