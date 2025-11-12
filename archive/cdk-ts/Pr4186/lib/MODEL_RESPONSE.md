### Reasoning Trace
---

The user wants me to update their existing CDK stack file with specific infrastructure requirements. They are very clear that they want me to UPDATE the existing `lib/tap-stack.ts` file, not create new files or suggest a completely new implementation.

Looking at the requirements:
1. S3 bucket with encryption and versioning
2. IAM role with read-only access to the bucket
3. CloudWatch logging for S3 access
4. Lambda function that triggers on S3 object creation
5. All resources tagged with 'Environment: Production'

The existing code has a basic CDK stack structure with an environment suffix. I need to add all the required resources directly within this stack class.

Key points to address:
- S3 bucket named 'prod-data-bucket' with encryption and versioning
- IAM role with least privilege for S3 read-only access
- CloudWatch logging for S3 access (this would be S3 access logging)
- Lambda function that triggers on S3 PUT events
- Proper tagging for all resources
- Follow security best practices

I'll need to import the necessary CDK constructs and add the resources within the constructor of the TapStack class.
### Answer 
---

I'll help you update your existing `lib/tap-stack.ts` file with all the required infrastructure components. Here's the updated code that includes all your requirements while maintaining your existing structure:

## Updated lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // 1. S3 BUCKET SETUP
    // ========================================
    
    // Create S3 bucket for access logging
    const logBucket = new s3.Bucket(this, 'AccessLogBucket', {
      bucketName: `prod-data-bucket-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        expiration: cdk.Duration.days(90),
        id: 'delete-old-logs',
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create main S3 bucket with required configuration
    const dataBucket = new s3.Bucket(this, 'ProdDataBucket', {
      bucketName: 'prod-data-bucket',
      
      // Enable server-side encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Turn on object versioning
      versioned: true,
      
      // Enable CloudWatch access logging
      serverAccessLogsPrefix: 'access-logs/',
      serverAccessLogsBucket: logBucket,
      
      // Security best practices
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      
      // Lifecycle management for versioned objects
      lifecycleRules: [{
        noncurrentVersionExpiration: cdk.Duration.days(30),
        id: 'delete-old-versions',
      }],
      
      // Set removal policy to RETAIN for production
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add production tag to bucket
    cdk.Tags.of(dataBucket).add('Environment', 'Production');
    cdk.Tags.of(logBucket).add('Environment', 'Production');

    // ========================================
    // 2. IAM ROLE CONFIGURATION
    // ========================================
    
    // Create IAM role with read-only access to S3 bucket
    const s3ReadOnlyRole = new iam.Role(this, 'S3ReadOnlyRole', {
      roleName: 'prod-data-bucket-readonly-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Read-only access role for prod-data-bucket',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant minimal read permissions following least privilege principle
    dataBucket.grantRead(s3ReadOnlyRole);
    
    // Add specific permissions for listing bucket contents
    s3ReadOnlyRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:GetBucketVersioning',
        's3:ListBucketVersions',
      ],
      resources: [dataBucket.bucketArn],
    }));

    // Add production tag to role
    cdk.Tags.of(s3ReadOnlyRole).add('Environment', 'Production');

    // ========================================
    // 3. CLOUDWATCH LOGGING
    // ========================================
    
    // Create CloudWatch Log Group for Lambda function
    const logGroup = new logs.LogGroup(this, 'ObjectLoggerLogGroup', {
      logGroupName: '/aws/lambda/prod-object-logger',
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add production tag to log group
    cdk.Tags.of(logGroup).add('Environment', 'Production');

    // ========================================
    // 4. LAMBDA FUNCTION
    // ========================================
    
    // Create Lambda function for object logging
    const objectLoggerFunction = new lambda.Function(this, 'ProdObjectLogger', {
      functionName: 'prod-object-logger',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        exports.handler = async (event, context) => {
          console.log('Lambda function triggered');
          console.log('Event received:', JSON.stringify(event, null, 2));
          
          try {
            // Process each S3 event record
            for (const record of event.Records) {
              if (record.eventName && record.eventName.startsWith('ObjectCreated')) {
                const bucketName = record.s3.bucket.name;
                const objectKey = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
                const objectSize = record.s3.object.size;
                const eventTime = record.eventTime;
                const sourceIp = record.requestParameters?.sourceIPAddress || 'Unknown';
                
                // Log object details
                const logEntry = {
                  timestamp: new Date().toISOString(),
                  eventTime: eventTime,
                  action: 'OBJECT_CREATED',
                  bucket: bucketName,
                  key: objectKey,
                  size: objectSize,
                  sizeInMB: (objectSize / (1024 * 1024)).toFixed(2),
                  sourceIp: sourceIp,
                  region: record.awsRegion,
                  eventName: record.eventName,
                };
                
                console.log('Object Creation Detected:', JSON.stringify(logEntry, null, 2));
                
                // Optionally get additional object metadata
                try {
                  const metadata = await s3.headObject({
                    Bucket: bucketName,
                    Key: objectKey,
                  }).promise();
                  
                  console.log('Object Metadata:', {
                    contentType: metadata.ContentType,
                    lastModified: metadata.LastModified,
                    etag: metadata.ETag,
                    storageClass: metadata.StorageClass,
                    serverSideEncryption: metadata.ServerSideEncryption,
                    versionId: metadata.VersionId,
                  });
                } catch (metadataError) {
                  console.error('Error fetching object metadata:', metadataError);
                  // Continue processing even if metadata fetch fails
                }
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Successfully processed S3 events',
                recordsProcessed: event.Records.length,
              }),
            };
            
          } catch (error) {
            console.error('Error processing S3 event:', error);
            
            // Handle specific error cases
            if (error.code === 'AccessDenied') {
              console.error('Access denied to S3 object. Check IAM permissions.');
            } else if (error.code === 'NoSuchKey') {
              console.error('S3 object not found. It may have been deleted.');
            } else if (error.code === 'RequestTimeout') {
              console.error('Request timeout. Consider increasing Lambda timeout.');
            }
            
            // Re-throw to mark Lambda execution as failed
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
        BUCKET_NAME: dataBucket.bucketName,
      },
      logGroup: logGroup,
      description: 'Logs details about new objects added to prod-data-bucket',
      reservedConcurrentExecutions: 10, // Limit concurrent executions for cost control
      retryAttempts: 2,
      deadLetterQueueEnabled: false,
    });

    // Grant Lambda function read access to the S3 bucket
    dataBucket.grantRead(objectLoggerFunction);

    // Add S3 event notification to trigger Lambda
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(objectLoggerFunction),
      {
        // Optional: Add filters if needed
        // prefix: 'uploads/',
        // suffix: '.json',
      }
    );

    // Add production tag to Lambda function
    cdk.Tags.of(objectLoggerFunction).add('Environment', 'Production');

    // ========================================
    // 5. STACK OUTPUTS
    // ========================================
    
    // Output important resource information
    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'Name of the production data bucket',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: dataBucket.bucketArn,
      description: 'ARN of the production data bucket',
    });

    new cdk.CfnOutput(this, 'ReadOnlyRoleArn', {
      value: s3ReadOnlyRole.roleArn,
      description: 'ARN of the S3 read-only role',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: objectLoggerFunction.functionArn,
      description: 'ARN of the object logger Lambda function',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda function',
    });

    // Add global production tag to entire stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
  }
}
```

## Key Implementation Details

### 1. **S3 Bucket Configuration**
- ✅ Bucket named `prod-data-bucket` with server-side encryption (S3-managed)
- ✅ Versioning enabled for object history
- ✅ Access logging configured to a separate log bucket
- ✅ SSL enforced and public access blocked for security

### 2. **IAM Role with Least Privilege**
- ✅ Read-only permissions limited to specific S3 actions
- ✅ Can only assume role from Lambda service
- ✅ Includes basic Lambda execution permissions for CloudWatch Logs

### 3. **CloudWatch Logging**
- ✅ S3 access logs captured in dedicated log bucket
- ✅ Lambda function logs to CloudWatch with 3-month retention
- ✅ Structured logging for easy querying and analysis

### 4. **Lambda Function Features**
- ✅ Triggers on S3 object creation events
- ✅ Comprehensive error handling for edge cases
- ✅ Logs detailed object information including metadata
- ✅ 30-second timeout configured
- ✅ Handles multiple error scenarios (AccessDenied, NoSuchKey, RequestTimeout)

### 5. **Tagging Strategy**
- ✅ All resources tagged with `Environment: Production`
- ✅ Additional tags for management and tracking

## Security Best Practices Implemented

1. **Encryption**: S3-managed encryption enabled on both buckets
2. **Access Control**: Public access blocked, SSL enforced
3. **Least Privilege**: IAM role has minimal required permissions
4. **Versioning**: Enabled for data recovery and audit trail
5. **Retention Policies**: Log retention configured for compliance
6. **Resource Isolation**: Separate log bucket for access logs

## Deployment Instructions

1. **Install dependencies** (if not already installed):
```bash
npm install
```

2. **Deploy the stack**:
```bash
npx cdk deploy
```

3. **Verify deployment**:
- Check CloudFormation outputs for resource ARNs
- Test by uploading a file to the S3 bucket
- Monitor CloudWatch Logs for Lambda execution

This implementation provides a production-ready, secure data processing infrastructure that meets all your requirements while maintaining your existing stack structure.
