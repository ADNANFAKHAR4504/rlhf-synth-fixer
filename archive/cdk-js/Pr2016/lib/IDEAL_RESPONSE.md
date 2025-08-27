I'll create a production-ready AWS CDK stack for a serverless notification service. Here's the complete implementation:

## Core CDK Stack Implementation

### `bin/tap.mjs`

```javascript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

### `lambda/task-processor.py`

```python
import json
import boto3
import os
import uuid
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

# Environment variables
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
REGION = os.environ['REGION']

def lambda_handler(event, context):
    """
    Main Lambda handler for processing async tasks.
    Saves results to S3 and publishes completion notifications to SNS.
    """
    try:
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        logger.info(f"Processing task {task_id}")

        # Process the task (placeholder logic)
        task_result = process_task(event, task_id)

        # Save results to S3
        s3_key = save_results_to_s3(task_result, task_id, timestamp)

        # Publish completion notification
        notification_result = publish_completion_notification(task_id, s3_key, task_result['status'])

        # Return success response
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Task processed successfully',
                'taskId': task_id,
                's3Key': s3_key,
                'notificationMessageId': notification_result['MessageId']
            })
        }

        logger.info(f"Task {task_id} completed successfully")
        return response

    except Exception as e:
        logger.error(f"Error processing task: {str(e)}")

        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Task processing failed',
                'message': str(e)
            })
        }

def process_task(event, task_id):
    """
    Process the async task (placeholder implementation).
    In production, this would contain your actual business logic.
    """
    logger.info(f"Processing business logic for task {task_id}")

    # Placeholder task processing
    task_data = event.get('taskData', {})

    # Simulate task processing
    result = {
        'taskId': task_id,
        'status': 'completed',
        'inputData': task_data,
        'processedAt': datetime.utcnow().isoformat(),
        'result': {
            'processedItems': len(task_data.get('items', [])),
            'summary': 'Task completed successfully'
        }
    }

    return result

def save_results_to_s3(task_result, task_id, timestamp):
    """
    Save task results to S3 bucket.
    """
    try:
        # Create S3 key with organized structure
        s3_key = f"task-results/{timestamp[:10]}/{task_id}/result.json"

        # Convert result to JSON
        result_json = json.dumps(task_result, indent=2)

        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=result_json,
            ContentType='application/json',
            ServerSideEncryption='AES256',
            Metadata={
                'taskId': task_id,
                'processedAt': timestamp,
                'status': task_result['status']
            }
        )

        logger.info(f"Results saved to S3: s3://{S3_BUCKET_NAME}/{s3_key}")
        return s3_key

    except ClientError as e:
        logger.error(f"Failed to save results to S3: {e}")
        raise

def publish_completion_notification(task_id, s3_key, status):
    """
    Publish task completion notification to SNS topic.
    """
    try:
        # Create notification message
        notification_message = {
            'taskId': task_id,
            'status': status,
            'completedAt': datetime.utcnow().isoformat(),
            's3Location': f"s3://{S3_BUCKET_NAME}/{s3_key}",
            'region': REGION
        }

        # Publish to SNS
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(notification_message, indent=2),
            Subject=f'Task Completion: {task_id}',
            MessageAttributes={
                'taskId': {
                    'DataType': 'String',
                    'StringValue': task_id
                },
                'status': {
                    'DataType': 'String',
                    'StringValue': status
                }
            }
        )

        logger.info(f"Notification published: {response['MessageId']}")
        return response

    except ClientError as e:
        logger.error(f"Failed to publish notification: {e}")
        raise
```

### `lib/tap-stack.mjs`

```javascript
import * as cdk from 'aws-cdk-lib';
import { ServerlessNotificationStack } from './serverless-notification-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the serverless notification service stack
    const serverlessNotificationStack = new ServerlessNotificationStack(
      scope,
      `ServerlessNotificationStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: `Serverless Notification Service for async task processing - ${environmentSuffix}`,
      }
    );

    // Store reference for potential use
    this.serverlessNotificationStack = serverlessNotificationStack;

    // Main orchestrator stack outputs
    new cdk.CfnOutput(this, `OrchestratorStatus${environmentSuffix}`, {
      value: 'ORCHESTRATOR_DEPLOYED',
      description: `Serverless notification service orchestrator status - ${environmentSuffix}`,
    });
  }
}

export { TapStack };

```

### `lib/serverless-notification-stack.mjs`

```javascript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';

export class ServerlessNotificationStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket for storing task results and output files - Private bucket as required
    const taskResultsBucket = new s3.Bucket(
      this,
      `TaskResultsBucket${environmentSuffix}`,
      {
        bucketName: `task-results-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed from RETAIN to DESTROY for deployability
        autoDeleteObjects: true, // Added to ensure clean destruction
        enforceSSL: true,
      }
    );

    // SNS Topic for completion notifications from Lambda
    const completionTopic = new sns.Topic(
      this,
      `TaskCompletionTopic${environmentSuffix}`,
      {
        topicName: `task-completion-notifications-${environmentSuffix}`,
        displayName: `Task Completion Notifications - ${environmentSuffix}`,
      }
    );

    // Lambda function for task processing with Python runtime
    const taskProcessorFunction = new lambda.Function(
      this,
      `TaskProcessorFunction${environmentSuffix}`,
      {
        functionName: `task-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'task-processor.lambda_handler',
        code: lambda.Code.fromAsset('lib/lambda'), // Fixed path to match project structure
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          S3_BUCKET_NAME: taskResultsBucket.bucketName,
          SNS_TOPIC_ARN: completionTopic.topicArn,
          REGION: cdk.Aws.REGION,
        },
        deadLetterQueueEnabled: true,
        retryAttempts: 2,
        description: `Processes async tasks and notifies completion - ${environmentSuffix}`,
      }
    );

    // Grant permissions using CDK grant methods (least privilege as required)
    taskResultsBucket.grantWrite(taskProcessorFunction);
    completionTopic.grantPublish(taskProcessorFunction);

    // Apply required resource tagging as specified in PROMPT.md
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Department', 'IT');

    // CloudFormation Outputs for integration tests
    new cdk.CfnOutput(this, `TaskResultsBucketName${environmentSuffix}`, {
      value: taskResultsBucket.bucketName,
      description: 'S3 Bucket name for task results',
      exportName: `TaskResultsBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskCompletionTopicArn${environmentSuffix}`, {
      value: completionTopic.topicArn,
      description: 'SNS Topic ARN for completion notifications',
      exportName: `TaskCompletionTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskProcessorFunctionArn${environmentSuffix}`, {
      value: taskProcessorFunction.functionArn,
      description: 'Lambda Function ARN for task processing',
      exportName: `TaskProcessorFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TaskProcessorFunctionName${environmentSuffix}`, {
      value: taskProcessorFunction.functionName,
      description: 'Lambda Function name for task processing',
      exportName: `TaskProcessorFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `StackStatus${environmentSuffix}`, {
      value: 'DEPLOYED',
      description: `Serverless notification service deployment status - ${environmentSuffix}`,
      exportName: `ServerlessNotificationStackStatus-${environmentSuffix}`,
    });
  }
}
```
