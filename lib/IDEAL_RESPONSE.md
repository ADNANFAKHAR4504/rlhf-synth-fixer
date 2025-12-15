# Enhanced Serverless Architecture with Security and Authentication

This solution implements a production-ready serverless API with comprehensive security features, building on the original MODEL_RESPONSE requirements.

## Architecture Overview

The final implementation includes all original features plus enhanced security:

### Core Infrastructure (from MODEL_RESPONSE.md)

- **API Gateway** with regional endpoint and CORS
- **Lambda Function** (Python 3.9, 512 MB, X-Ray tracing)
- **S3 Buckets** for code deployment and logs (KMS encrypted)
- **SQS Dead Letter Queue** for failed executions
- **IAM Roles** with least-privilege permissions
- **CloudWatch Logs** and monitoring alarms
- **KMS Key** for encryption with key rotation

### Security Enhancements (from MODEL_RESPONSE3.md)

- **API Key Authentication** with usage plans
  - Rate limiting: 1000 requests/sec, burst 2000
  - Daily quota: 10,000 requests
- **WAF Protection** with multiple rule sets:
  - IP-based rate limiting (2000 requests per 5 minutes)
  - AWS Managed Rules for common attacks
  - Protection against known bad inputs
- **Fixed CORS Policy**:
  - Specific allowed origins instead of wildcard
  - Credential support enabled
  - Dynamic origin handling in Lambda
- **Dedicated Log Group** (fixes deprecation warning)

## Project Structure

```
serverless-api/
├── bin/
│   └── tap.ts
├── lib/
│   ├── tap-stack.ts
│   └── lambda/
│       └── api-handler.py
├── test/
│   ├── tap-stack.unit.test.ts
│   └── tap-stack.int.test.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## CDK Implementation

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

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
  projectName: 'MyProject',
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const { projectName } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: projectName,
      DeploymentDate: environmentSuffix,
    };

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `${projectName} encryption key`,
      enableKeyRotation: true,
    });

    cdk.Tags.of(kmsKey).add('Name', `${projectName}-KMS-${environmentSuffix}`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(kmsKey).add(key, value);
    });

    // S3 bucket for Lambda code deployment
    const codeBucket = new s3.Bucket(this, 'CodeBucket', {
      bucketName: `${projectName.toLowerCase()}-code-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(codeBucket).add(key, value);
    });

    // S3 bucket for logs storage
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${projectName.toLowerCase()}-logs-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(logsBucket).add(key, value);
    });

    // Dead Letter Queue
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `${projectName}-DLQ-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(deadLetterQueue).add(key, value);
    });

    // IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${projectName}-Lambda-Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Add permissions for DLQ and KMS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Add permissions for logs bucket
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${logsBucket.bucketArn}/*`],
      })
    );

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(lambdaRole).add(key, value);
    });

    // Create dedicated log group for Lambda (fixes deprecation)
    const lambdaLogGroup = new logs.LogGroup(this, 'ApiLambdaLogGroup', {
      logGroupName: `/aws/lambda/${projectName}-API-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(lambdaLogGroup).add(key, value);
    });

    // Lambda function (updated to use logGroup instead of logRetention)
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `${projectName}-API-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'api-handler.lambda_handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        STAGE: 'production',
        LOGS_BUCKET: logsBucket.bucketName,
      },
      deadLetterQueue: deadLetterQueue,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: lambdaLogGroup,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(apiFunction).add(key, value);
    });

    // API Key for authentication
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${projectName}-API-Key-${environmentSuffix}`,
      description: `API Key for ${projectName} Production API`,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(apiKey).add(key, value);
    });

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${projectName}-Usage-Plan-${environmentSuffix}`,
      description: `Usage plan for ${projectName} API`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(usagePlan).add(key, value);
    });

    // WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
      name: `${projectName}-WAF-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${projectName}WebAcl`,
      },
    });

    // API Gateway with improved CORS and authentication
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${projectName}-API-${environmentSuffix}`,
      description: `${projectName} Production API`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://yourdomain.com', 'https://app.yourdomain.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: webAcl.attrArn,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(api).add(key, value);
    });

    // Lambda integration with API Key requirement
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction, {
      proxy: true,
    });

    // Add proxy resource with API Key requirement
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

    // Associate API Key with Usage Plan and API
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${projectName}-Lambda-Errors-${environmentSuffix}`,
      alarmDescription: 'Lambda function error rate',
      metric: apiFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `${projectName}-Lambda-Throttles-${environmentSuffix}`,
      alarmDescription: 'Lambda function throttle rate',
      metric: apiFunction.metricThrottles({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(errorAlarm).add(key, value);
      cdk.Tags.of(throttleAlarm).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID - retrieve value from AWS Console',
    });

    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'CodeBucketName', {
      value: codeBucket.bucketName,
      description: 'S3 Bucket for Lambda Code',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Bucket for Logs',
    });
  }
}
```

### lib/lambda/api-handler.py

```python
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients lazily to avoid import issues
s3_client = None

def get_s3_client():
    """Lazy initialization of S3 client"""
    global s3_client
    if s3_client is None:
        try:
            import boto3
            s3_client = boto3.client('s3')
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {e}")
            s3_client = False  # Mark as failed to avoid retrying
    return s3_client if s3_client is not False else None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for API Gateway proxy integration.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response format
    """

    # Log the incoming event (truncated for security)
    try:
        event_summary = {
            'httpMethod': event.get('httpMethod'),
            'path': event.get('path'),
            'hasHeaders': bool(event.get('headers')),
            'hasBody': bool(event.get('body')),
            'stage': event.get('requestContext', {}).get('stage')
        }
        logger.info(f"Received event summary: {json.dumps(event_summary)}")
    except Exception as e:
        logger.warning(f"Failed to log event summary: {e}")

    # Validate event structure
    if not isinstance(event, dict):
        logger.error(f"Invalid event type: {type(event)}")
        return create_error_response("Invalid event format", 400)

    # Get headers safely
    headers = event.get('headers') or {}
    if not isinstance(headers, dict):
        logger.warning("Headers is not a dict, creating empty dict")
        headers = {}

    # Get origin from request headers for CORS (case-insensitive)
    origin = None
    for key, value in headers.items():
        if key and key.lower() == 'origin':
            origin = value
            break

    allowed_origins = ['https://yourdomain.com', 'https://app.yourdomain.com']

    # Determine CORS origin
    cors_origin = origin if origin in allowed_origins else 'https://yourdomain.com'

    try:
        # Extract request information safely
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        body = event.get('body')

        logger.info(f"Processing {http_method} request to {path}")

        # Parse body if present
        request_body = None
        if body:
            try:
                request_body = json.loads(body)
            except json.JSONDecodeError as e:
                logger.info(f"Body is not JSON, treating as string: {e}")
                request_body = body

        # Log request details to S3 (optional, non-blocking)
        try:
            log_request_to_s3(event, context)
        except Exception as s3_error:
            logger.warning(f"S3 logging failed (non-critical): {s3_error}")

        # Handle different HTTP methods
        if http_method == 'GET':
            response_data = handle_get_request(path, query_params)
        elif http_method == 'POST':
            response_data = handle_post_request(path, request_body)
        elif http_method == 'PUT':
            response_data = handle_put_request(path, request_body)
        elif http_method == 'DELETE':
            response_data = handle_delete_request(path)
        else:
            response_data = {
                'error': f'Method {http_method} not supported',
                'supported_methods': ['GET', 'POST', 'PUT', 'DELETE']
            }

        # Prepare successful response with improved CORS
        response = {
            'statusCode': 200,
            'headers': create_cors_headers(cors_origin),
            'body': json.dumps({
                'success': True,
                'data': response_data,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown'),
                'request_id': getattr(context, 'aws_request_id', 'unknown')
            })
        }

        logger.info(f"Returning successful response: {response['statusCode']}")
        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)

        # Return detailed error for debugging (but sanitized)
        error_message = str(e) if len(str(e)) < 200 else "Internal server error"

        return {
            'statusCode': 500,
            'headers': create_cors_headers(cors_origin),
            'body': json.dumps({
                'success': False,
                'error': error_message,
                'error_type': type(e).__name__,
                'timestamp': datetime.utcnow().isoformat(),
                'stage': os.environ.get('STAGE', 'unknown'),
                'request_id': getattr(context, 'aws_request_id', 'unknown')
            })
        }

def create_cors_headers(cors_origin: str) -> Dict[str, str]:
    """Create consistent CORS headers"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
    }

def create_error_response(error_message: str, status_code: int = 500) -> Dict[str, Any]:
    """Create a standardized error response"""
    return {
        'statusCode': status_code,
        'headers': create_cors_headers('https://yourdomain.com'),
        'body': json.dumps({
            'success': False,
            'error': error_message,
            'timestamp': datetime.utcnow().isoformat(),
            'stage': os.environ.get('STAGE', 'unknown')
        })
    }

def handle_get_request(path: str, query_params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET requests."""
    return {
        'message': 'GET request processed successfully',
        'path': path,
        'query_parameters': query_params,
        'method': 'GET'
    }

def handle_post_request(path: str, body: Any) -> Dict[str, Any]:
    """Handle POST requests."""
    return {
        'message': 'POST request processed successfully',
        'path': path,
        'received_data': body,
        'method': 'POST'
    }

def handle_put_request(path: str, body: Any) -> Dict[str, Any]:
    """Handle PUT requests."""
    return {
        'message': 'PUT request processed successfully',
        'path': path,
        'received_data': body,
        'method': 'PUT'
    }

def handle_delete_request(path: str) -> Dict[str, Any]:
    """Handle DELETE requests."""
    return {
        'message': 'DELETE request processed successfully',
        'path': path,
        'method': 'DELETE'
    }

def log_request_to_s3(event: Dict[str, Any], context: Any) -> None:
    """
    Log request details to S3 bucket for audit purposes.
    This function is non-critical and should not cause the main function to fail.
    """
    try:
        logs_bucket = os.environ.get('LOGS_BUCKET')
        if not logs_bucket:
            logger.info("LOGS_BUCKET environment variable not set, skipping S3 logging")
            return

        # Get S3 client (may be None if initialization failed)
        client = get_s3_client()
        if not client:
            logger.info("S3 client not available, skipping S3 logging")
            return

        # Create simplified log entry (avoid including full event for security)
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': getattr(context, 'aws_request_id', 'unknown'),
            'function_name': getattr(context, 'function_name', 'unknown'),
            'http_method': event.get('httpMethod', 'unknown'),
            'path': event.get('path', '/'),
            'user_agent': event.get('headers', {}).get('User-Agent', 'unknown'),
            'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown'),
            'remaining_time_ms': getattr(context, 'get_remaining_time_in_millis', lambda: 0)()
        }

        # Create S3 key with date partitioning
        now = datetime.utcnow()
        request_id = getattr(context, 'aws_request_id', 'unknown')
        s3_key = f"api-logs/year={now.year}/month={now.month:02d}/day={now.day:02d}/{request_id}.json"

        # Upload to S3 with timeout
        client.put_object(
            Bucket=logs_bucket,
            Key=s3_key,
            Body=json.dumps(log_entry, default=str),
            ContentType='application/json'
        )

        logger.info(f"Request logged to S3: s3://{logs_bucket}/{s3_key}")

    except Exception as e:
        logger.warning(f"Failed to log request to S3 (non-critical): {str(e)}")
        # Don't raise exception as this is not critical to the main function
```

## Key Features Implemented

### ✅ **Enhanced Security & Authentication**

- **API Key Authentication** with usage plans and rate limiting
- **WAF Protection** with rate limiting and AWS managed rule sets
- **Fixed CORS Policy** with specific allowed origins and credential support
- **KMS Encryption** for all S3 buckets and SQS queues

### ✅ **Production-Ready Infrastructure**

- **Regional API Gateway** with X-Ray tracing enabled
- **Python 3.9 Lambda** with 512 MB memory and proper IAM roles
- **Dead Letter Queue** for failed executions
- **CloudWatch Alarms** for error and throttle monitoring

### ✅ **Enhanced Monitoring & Logging**

- **Dedicated Log Group** for Lambda (fixes deprecation warning)
- **Structured logging** with S3 audit trail
- **X-Ray tracing** on both API Gateway and Lambda
- **CloudWatch metrics** and alarms

### ✅ **Security Best Practices**

- **Least-privilege IAM** roles and policies
- **Blocked public access** on all S3 buckets
- **Encrypted storage** with KMS key rotation
- **Environment suffix** in all resource names for isolation

### ✅ **Cost Optimization**

- **S3 lifecycle rules** for log retention and cost management
- **API throttling** and quotas to prevent runaway costs
- **Resource tagging** for cost allocation and management

## Usage Instructions

After deployment, clients need to:

1. **Get API Key value:**

```bash
aws apigateway get-api-key --api-key <API_KEY_ID> --include-value
```

2. **Make authenticated requests:**

```bash
curl -H "X-API-Key: <API_KEY_VALUE>" \
     -H "Origin: https://yourdomain.com" \
     https://your-api-url/prod/your-endpoint
```

3. **Update allowed origins** in both CDK stack and Lambda function to match your actual domains.

## Deployment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Synthesize CloudFormation template
npm run cdk:synth

# Deploy the stack
npm run cdk:deploy
```

This architecture provides enterprise-grade security, authentication, monitoring, and cost optimization while meeting all original requirements for a production-ready serverless API platform.
