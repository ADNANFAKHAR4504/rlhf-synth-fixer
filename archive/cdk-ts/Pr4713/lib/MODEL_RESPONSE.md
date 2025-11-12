### Reasoning Trace
---

The user wants me to update their existing TapStack file with a serverless infrastructure that includes:
1. S3 bucket with specific configuration
2. Lambda function triggered by S3 events
3. IAM roles with least privilege
4. CloudWatch monitoring
5. SQS dead-letter queue

They explicitly want everything in the single file, even though the comments say not to create resources directly in the stack. I need to respect their request and put everything in the TapStack class.

Let me create a comprehensive solution that includes all their requirements:
- S3 bucket with encryption, versioning, lifecycle policy, HTTPS-only policy
- Lambda function with proper configuration
- SQS DLQ for Lambda
- CloudWatch alarm
- Proper IAM roles and permissions
- CloudFormation outputs
- Stack tags

I'll use CDK v2 (aws-cdk-lib) as shown in their imports.
### Answer 
---

I'll update your `tap-stack.ts` file with all the required serverless infrastructure components. Here's the complete implementation:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  bucketName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add stack-level tags
    Tags.of(this).add('Environment', 'Production');

    // ==============================================
    // SQS Dead Letter Queue for Lambda
    // ==============================================
    const deadLetterQueue = new sqs.Queue(this, 'LambdaDLQ', {
      queueName: `lambda-dlq-${environmentSuffix}`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // ==============================================
    // S3 Bucket Configuration
    // ==============================================
    const bucketName = props?.bucketName || 
      `serverless-bucket-${this.account}-${environmentSuffix}`;

    const bucket = new s3.Bucket(this, 'ServerlessS3Bucket', {
      bucketName: bucketName,
      
      // Enable server-side encryption with AES-256
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Enable versioning
      versioned: true,
      
      // Configure lifecycle policy
      lifecycleRules: [
        {
          id: 'MoveToGlacierAfter30Days',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],
      
      // Block public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Enforce SSL/TLS
      enforceSSL: true,
      
      // Set removal policy (for non-production, you might want DESTROY)
      removalPolicy: RemovalPolicy.RETAIN,
      
      // Enable access logs (optional but recommended for production)
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Add bucket policy to enforce HTTPS-only connections
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          bucket.bucketArn,
          `${bucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // ==============================================
    // IAM Role for Lambda Function
    // ==============================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for S3 triggered Lambda function',
      roleName: `lambda-s3-processor-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add specific S3 permissions (least privilege)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
        ],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Add SQS permissions for DLQ
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sqs:SendMessage',
          'sqs:GetQueueAttributes',
        ],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // ==============================================
    // Lambda Function
    // ==============================================
    const lambdaFunction = new lambda.Function(this, 'S3ProcessorFunction', {
      functionName: `s3-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event, context) => {
          console.log('S3 Event:', JSON.stringify(event, null, 2));
          
          try {
            // Process each S3 record
            for (const record of event.Records) {
              const bucket = record.s3.bucket.name;
              const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
              
              console.log(\`Processing object: \${bucket}/\${key}\`);
              
              // Add your processing logic here
              // Example: validate file, transform data, trigger other services, etc.
              
              // Simulate processing
              await new Promise(resolve => setTimeout(resolve, 100));
              
              console.log(\`Successfully processed: \${key}\`);
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Objects processed successfully' }),
            };
          } catch (error) {
            console.error('Error processing S3 event:', error);
            
            // Log error details to CloudWatch
            console.error('Error Stack:', error.stack);
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            
            // Re-throw to trigger retry/DLQ
            throw error;
          }
        };
      `),
      timeout: Duration.seconds(15),
      memorySize: 256,
      role: lambdaRole,
      environment: {
        NODE_ENV: 'production',
        ENVIRONMENT: environmentSuffix,
      },
      deadLetterQueueEnabled: true,
      deadLetterQueue: deadLetterQueue,
      maxEventAge: Duration.hours(6),
      retryAttempts: 2,
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    // ==============================================
    // S3 Event Notification
    // ==============================================
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    );

    // Grant Lambda permission to read from bucket (using CDK helper)
    bucket.grantRead(lambdaFunction);

    // ==============================================
    // CloudWatch Alarm
    // ==============================================
    
    // Create SNS topic for alarm notifications (optional)
    const alarmTopic = new sns.Topic(this, 'LambdaAlarmTopic', {
      topicName: `lambda-errors-topic-${environmentSuffix}`,
      displayName: 'Lambda Error Notifications',
    });

    // Create CloudWatch alarm for Lambda errors
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-high-${environmentSuffix}`,
      alarmDescription: 'Triggered when Lambda function errors exceed threshold',
      metric: lambdaFunction.metricErrors({
        statistic: cloudwatch.Statistic.SUM,
        period: Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action to send notification
    errorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Additional alarm for DLQ messages
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `lambda-dlq-messages-${environmentSuffix}`,
      alarmDescription: 'Triggered when messages are sent to DLQ',
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        statistic: cloudwatch.Statistic.SUM,
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // ==============================================
    // CloudFormation Outputs
    // ==============================================
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: bucket.bucketArn,
      description: 'ARN of the S3 bucket',
      exportName: `${this.stackName}-S3BucketArn`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'URL of the Dead Letter Queue',
      exportName: `${this.stackName}-DLQUrl`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarm notifications',
      exportName: `${this.stackName}-AlarmTopicArn`,
    });
  }
}
```

## Key Features Implemented:

### 1. **S3 Bucket Configuration** ✅
- **Encryption**: Uses AES-256 server-side encryption
- **Versioning**: Enabled for data protection
- **Lifecycle Policy**: Moves objects to Glacier after 30 days
- **HTTPS-Only**: Bucket policy enforces secure transport
- **Parameterized Name**: Can be customized via props
- **Lambda Trigger**: Configured for object creation events

### 2. **Lambda Function** ✅
- **Handler**: Named `index.handler` as requested
- **Timeout**: Set to 15 seconds
- **Memory**: Allocated 256 MB
- **Error Logging**: Comprehensive error logging to CloudWatch
- **Dead Letter Queue**: Configured with SQS for failed invocations
- **X-Ray Tracing**: Enabled for better debugging

### 3. **IAM Roles** ✅
- **Least Privilege**: Only grants necessary permissions
- **S3 Permissions**: Limited to GetObject and GetObjectVersion
- **SQS Permissions**: Only for DLQ operations
- **CloudWatch Logs**: Basic execution role for logging

### 4. **CloudWatch Monitoring** ✅
- **Error Alarm**: Triggers when errors exceed 5 in 5 minutes
- **DLQ Alarm**: Additional alarm for DLQ messages
- **SNS Topic**: For alarm notifications

### 5. **Stack Configuration** ✅
- **Environment Tag**: Set to 'Production'
- **CloudFormation Outputs**: Exports S3 Bucket ARN and Lambda ARN
- **Export Names**: Can be referenced by other stacks

## Usage Example:

To deploy this stack, you can use:

```typescript
// In your app.ts or bin/tap.ts file
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new App();

new TapStack(app, 'TapStack', {
  environmentSuffix: 'prod',
  bucketName: 'my-custom-bucket-name', // Optional
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## Security Best Practices Included:

1. **Encryption at Rest**: Both S3 and SQS use encryption
2. **Encryption in Transit**: HTTPS-only bucket policy
3. **Least Privilege IAM**: Only necessary permissions granted
4. **No Public Access**: S3 bucket blocks all public access
5. **Monitoring**: CloudWatch alarms for proactive issue detection
6. **Audit Trail**: S3 access logging enabled
7. **Versioning**: Protects against accidental deletion

The implementation is production-ready and follows AWS best practices for serverless architectures.
