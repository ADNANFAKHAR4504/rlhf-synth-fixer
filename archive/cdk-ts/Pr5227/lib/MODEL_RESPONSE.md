### Reasoning Trace
---

The user wants me to update an existing CDK TypeScript file (`lib/tap-stack.ts`) to create a serverless payment event processing pipeline. Let me break down all the requirements:

1. API Gateway REST API with `/payments/webhook` endpoint, throttling at 1000 rps
2. Payment Validation Lambda (Python 3.11, 512MB, 60s timeout, X-Ray, Powertools, VPC)
3. DynamoDB table (on-demand, payment_id/timestamp keys, point-in-time recovery)
4. SQS Dead Letter Queue (14 days retention)
5. EventBridge rule for high-value transactions (>$10,000)
6. Notification Lambda + SNS topic
7. SSM Parameter Store for config
8. Proper IAM roles with least privilege
9. Error handling with exponential backoff
10. Separate DLQ for EventBridge

The flow is:
API Gateway → Validation Lambda → DynamoDB
                              ↓ (if >$10k)
                         EventBridge → Notification Lambda → SNS

I need to:
1. Update the existing `lib/tap-stack.ts` file
2. Provide Python code for both Lambda functions
3. Ensure all resources are properly connected
4. Use the `environmentSuffix` variable for naming
5. Create VPC with private subnets for Lambdas
6. Include Lambda Powertools
7. Implement proper error handling and retry logic

Let me start writing the complete solution.
### Answer 
---

I'll help you build a complete serverless payment event processing pipeline using AWS CDK. Let me provide the updated `lib/tap-stack.ts` file and the Lambda function code.

## Updated `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, `PaymentProcessingVPC-${environmentSuffix}`, {
      vpcName: `payment-processing-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Endpoints for AWS services (to reduce data transfer costs)
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ========================================
    // Systems Manager Parameter Store
    // ========================================
    const apiKeyParameter = new ssm.StringParameter(this, `ApiKey-${environmentSuffix}`, {
      parameterName: `/payment-processing/${environmentSuffix}/api-key`,
      stringValue: 'PLACEHOLDER_API_KEY', // This should be set manually after deployment
      description: 'API key for payment validation',
      tier: ssm.ParameterTier.STANDARD,
    });

    const highValueThreshold = new ssm.StringParameter(this, `HighValueThreshold-${environmentSuffix}`, {
      parameterName: `/payment-processing/${environmentSuffix}/high-value-threshold`,
      stringValue: '10000',
      description: 'Threshold for high-value transaction notifications',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ========================================
    // DynamoDB Table
    // ========================================
    const paymentsTable = new dynamodb.Table(this, `PaymentsTable-${environmentSuffix}`, {
      tableName: `payments-${environmentSuffix}`,
      partitionKey: { 
        name: 'payment_id', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'timestamp', 
        type: dynamodb.AttributeType.NUMBER 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // ========================================
    // Dead Letter Queues
    // ========================================
    const mainDLQ = new sqs.Queue(this, `MainDLQ-${environmentSuffix}`, {
      queueName: `payment-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const eventBridgeDLQ = new sqs.Queue(this, `EventBridgeDLQ-${environmentSuffix}`, {
      queueName: `eventbridge-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // ========================================
    // SNS Topic for Notifications
    // ========================================
    const notificationTopic = new sns.Topic(this, `NotificationTopic-${environmentSuffix}`, {
      topicName: `high-value-payments-${environmentSuffix}`,
      displayName: 'High Value Payment Notifications',
    });

    // Add email subscription (replace with your email)
    // notificationTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription('your-email@example.com')
    // );

    // ========================================
    // Lambda Layer for AWS Lambda Powertools
    // ========================================
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      `PowertoolsLayer-${environmentSuffix}`,
      `arn:aws:lambda:${this.region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:46`
    );

    // ========================================
    // Payment Validation Lambda
    // ========================================
    const validationLambdaRole = new iam.Role(this, `ValidationLambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `payment-validation-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    const validationLambda = new lambda.Function(this, `ValidationLambda-${environmentSuffix}`, {
      functionName: `payment-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'validation.handler',
      code: lambda.Code.fromInline(getValidationLambdaCode()),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      role: validationLambdaRole,
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        DYNAMODB_TABLE_NAME: paymentsTable.tableName,
        API_KEY_PARAMETER: apiKeyParameter.parameterName,
        HIGH_VALUE_THRESHOLD_PARAMETER: highValueThreshold.parameterName,
        ENVIRONMENT: environmentSuffix,
        POWERTOOLS_SERVICE_NAME: 'payment-validation',
        POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
        LOG_LEVEL: 'INFO',
      },
      deadLetterQueue: mainDLQ,
      deadLetterQueueEnabled: true,
      retryAttempts: 2,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to validation lambda
    paymentsTable.grantWriteData(validationLambda);
    apiKeyParameter.grantRead(validationLambda);
    highValueThreshold.grantRead(validationLambda);
    mainDLQ.grantSendMessages(validationLambda);

    // ========================================
    // Notification Lambda
    // ========================================
    const notificationLambdaRole = new iam.Role(this, `NotificationLambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `payment-notification-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    const notificationLambda = new lambda.Function(this, `NotificationLambda-${environmentSuffix}`, {
      functionName: `payment-notification-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'notification.handler',
      code: lambda.Code.fromInline(getNotificationLambdaCode()),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      role: notificationLambdaRole,
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        SNS_TOPIC_ARN: notificationTopic.topicArn,
        ENVIRONMENT: environmentSuffix,
        POWERTOOLS_SERVICE_NAME: 'payment-notification',
        POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
        LOG_LEVEL: 'INFO',
      },
      retryAttempts: 2,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions to notification lambda
    notificationTopic.grantPublish(notificationLambda);

    // ========================================
    // EventBridge for High-Value Transactions
    // ========================================
    const eventBus = new events.EventBus(this, `PaymentEventBus-${environmentSuffix}`, {
      eventBusName: `payment-events-${environmentSuffix}`,
    });

    const highValueRule = new events.Rule(this, `HighValueRule-${environmentSuffix}`, {
      ruleName: `high-value-payments-${environmentSuffix}`,
      eventBus: eventBus,
      eventPattern: {
        source: ['payment.processing'],
        detailType: ['High Value Payment'],
        detail: {
          amount: [{
            numeric: ['>', 10000]
          }]
        }
      },
    });

    // Add Lambda target with DLQ
    highValueRule.addTarget(new targets.LambdaFunction(notificationLambda, {
      deadLetterQueue: eventBridgeDLQ,
      maxEventAge: cdk.Duration.hours(2),
      retryAttempts: 3,
    }));

    // Grant EventBridge permission to put events
    eventBus.grantPutEventsTo(validationLambda);

    // Add EventBridge permissions to validation lambda
    validationLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: [eventBus.eventBusArn],
    }));

    // Add environment variable for EventBridge
    validationLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    // ========================================
    // API Gateway
    // ========================================
    const api = new apigateway.RestApi(this, `PaymentAPI-${environmentSuffix}`, {
      restApiName: `payment-processing-api-${environmentSuffix}`,
      description: 'Payment Processing Webhook API',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 1000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(this, `RequestValidator-${environmentSuffix}`, {
      restApi: api,
      requestValidatorName: 'payment-validator',
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    // Request Model for validation
    const paymentModel = new apigateway.Model(this, `PaymentModel-${environmentSuffix}`, {
      restApi: api,
      contentType: 'application/json',
      modelName: 'PaymentModel',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['payment_id', 'amount', 'currency', 'customer_id'],
        properties: {
          payment_id: { type: apigateway.JsonSchemaType.STRING },
          amount: { type: apigateway.JsonSchemaType.NUMBER },
          currency: { type: apigateway.JsonSchemaType.STRING },
          customer_id: { type: apigateway.JsonSchemaType.STRING },
          description: { type: apigateway.JsonSchemaType.STRING },
          metadata: { type: apigateway.JsonSchemaType.OBJECT },
        },
      },
    });

    // Create webhook endpoint
    const paymentsResource = api.root.addResource('payments');
    const webhookResource = paymentsResource.addResource('webhook');

    const lambdaIntegration = new apigateway.LambdaIntegration(validationLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    webhookResource.addMethod('POST', lambdaIntegration, {
      requestValidator,
      requestModels: {
        'application/json': paymentModel,
      },
    });

    // ========================================
    // CloudWatch Alarms (optional but recommended)
    // ========================================
    new cdk.CfnOutput(this, `ApiEndpoint-${environmentSuffix}`, {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `payment-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DynamoDBTableName-${environmentSuffix}`, {
      value: paymentsTable.tableName,
      description: 'DynamoDB table name for payments',
      exportName: `payments-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SNSTopicArn-${environmentSuffix}`, {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for high-value notifications',
      exportName: `notification-topic-${environmentSuffix}`,
    });
  }
}

// ========================================
// Lambda Function Code
// ========================================

function getValidationLambdaCode(): string {
  return `
import json
import os
import time
import boto3
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
events = boto3.client('events')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
API_KEY_PARAMETER = os.environ['API_KEY_PARAMETER']
HIGH_VALUE_THRESHOLD_PARAMETER = os.environ['HIGH_VALUE_THRESHOLD_PARAMETER']
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')

# Cache for SSM parameters
parameter_cache = {}
CACHE_TTL = 300  # 5 minutes

def get_parameter(parameter_name: str) -> str:
    """Get parameter from SSM with caching"""
    current_time = time.time()
    
    if parameter_name in parameter_cache:
        cached_value, cached_time = parameter_cache[parameter_name]
        if current_time - cached_time < CACHE_TTL:
            return cached_value
    
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
        value = response['Parameter']['Value']
        parameter_cache[parameter_name] = (value, current_time)
        return value
    except ClientError as e:
        logger.error(f"Error getting parameter {parameter_name}: {str(e)}")
        raise

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Implement exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            if e.response['Error']['Code'] in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Retry attempt {attempt + 1}/{max_retries} after {delay}s")
                    time.sleep(delay)
                else:
                    raise
            else:
                raise

def validate_payment_schema(payment_data: Dict[str, Any]) -> bool:
    """Validate payment data against schema"""
    required_fields = ['payment_id', 'amount', 'currency', 'customer_id']
    
    for field in required_fields:
        if field not in payment_data:
            logger.error(f"Missing required field: {field}")
            return False
    
    # Validate amount is positive
    if payment_data['amount'] <= 0:
        logger.error("Payment amount must be positive")
        return False
    
    # Validate currency format (ISO 4217)
    if len(payment_data['currency']) != 3:
        logger.error("Invalid currency format")
        return False
    
    return True

@tracer.capture_method
def enrich_payment_data(payment_data: Dict[str, Any], request_id: str) -> Dict[str, Any]:
    """Enrich payment data with metadata"""
    enriched = payment_data.copy()
    enriched['request_id'] = request_id
    enriched['processed_at'] = datetime.utcnow().isoformat()
    enriched['timestamp'] = int(time.time() * 1000)
    enriched['status'] = 'validated'
    
    # Convert float to Decimal for DynamoDB
    if isinstance(enriched['amount'], float):
        enriched['amount'] = Decimal(str(enriched['amount']))
    
    return enriched

@tracer.capture_method
def store_payment(payment_data: Dict[str, Any]) -> None:
    """Store payment in DynamoDB with retry logic"""
    table = dynamodb.Table(TABLE_NAME)
    
    def put_item():
        return table.put_item(Item=payment_data)
    
    exponential_backoff_retry(put_item)
    logger.info(f"Stored payment {payment_data['payment_id']} in DynamoDB")

@tracer.capture_method
def publish_high_value_event(payment_data: Dict[str, Any]) -> None:
    """Publish event to EventBridge for high-value payments"""
    try:
        # Convert Decimal to float for JSON serialization
        event_detail = json.loads(json.dumps(payment_data, default=str))
        
        response = events.put_events(
            Entries=[
                {
                    'Source': 'payment.processing',
                    'DetailType': 'High Value Payment',
                    'Detail': json.dumps(event_detail),
                    'EventBusName': EVENT_BUS_NAME
                }
            ]
        )
        
        if response['FailedEntryCount'] > 0:
            logger.error(f"Failed to publish event: {response['Entries']}")
        else:
            logger.info(f"Published high-value event for payment {payment_data['payment_id']}")
    except Exception as e:
        logger.error(f"Error publishing event: {str(e)}")
        # Don't fail the entire request if event publishing fails
        metrics.add_metric(name="EventPublishFailure", unit=MetricUnit.Count, value=1)

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler for payment validation"""
    try:
        # Parse request body
        if 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        logger.append_keys(request_id=request_id)
        
        # Validate API key (optional - implement your logic)
        # api_key = get_parameter(API_KEY_PARAMETER)
        
        # Validate payment schema
        if not validate_payment_schema(payment_data):
            metrics.add_metric(name="ValidationFailure", unit=MetricUnit.Count, value=1)
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid payment data'})
            }
        
        # Enrich payment data
        enriched_payment = enrich_payment_data(payment_data, request_id)
        
        # Store in DynamoDB
        store_payment(enriched_payment)
        
        # Check if high-value transaction
        high_value_threshold = float(get_parameter(HIGH_VALUE_THRESHOLD_PARAMETER))
        if float(enriched_payment['amount']) > high_value_threshold:
            logger.info(f"High-value payment detected: {enriched_payment['amount']}")
            publish_high_value_event(enriched_payment)
            metrics.add_metric(name="HighValuePayment", unit=MetricUnit.Count, value=1)
        
        # Record successful processing
        metrics.add_metric(name="PaymentProcessed", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="PaymentAmount", unit=MetricUnit.None, value=float(enriched_payment['amount']))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': enriched_payment['payment_id'],
                'request_id': request_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        metrics.add_metric(name="ProcessingError", unit=MetricUnit.Count, value=1)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
`;
}

function getNotificationLambdaCode(): string {
  return `
import json
import os
import time
import boto3
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
sns = boto3.client('sns')

# Environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def exponential_backoff_retry(func, max_retries=3, base_delay=1):
    """Implement exponential backoff retry logic"""
    for attempt in range(max_retries):
        try:
            return func()
        except ClientError as e:
            if e.response['Error']['Code'] in ['Throttled', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Retry attempt {attempt + 1}/{max_retries} after {delay}s")
                    time.sleep(delay)
                else:
                    raise
            else:
                raise

@tracer.capture_method
def format_notification_message(payment_data: Dict[str, Any]) -> str:
    """Format payment data into notification message"""
    amount = payment_data.get('amount', 'N/A')
    currency = payment_data.get('currency', 'USD')
    payment_id = payment_data.get('payment_id', 'Unknown')
    customer_id = payment_data.get('customer_id', 'Unknown')
    timestamp = payment_data.get('processed_at', 'Unknown')
    
    message = f"""
🚨 HIGH VALUE PAYMENT ALERT 🚨

Payment Details:
- Payment ID: {payment_id}
- Amount: {currency} {amount:,}
- Customer ID: {customer_id}
- Processed At: {timestamp}

This payment exceeds the high-value threshold and requires immediate attention.

Action Required:
1. Review the transaction in the payment dashboard
2. Verify customer identity if necessary
3. Check for any suspicious activity patterns

This is an automated notification from the Payment Processing System.
"""
    return message

@tracer.capture_method
def send_notification(message: str, subject: str, payment_id: str) -> None:
    """Send notification via SNS with retry logic"""
    def publish_message():
        return sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject=subject,
            MessageAttributes={
                'payment_id': {
                    'DataType': 'String',
                    'StringValue': payment_id
                },
                'notification_type': {
                    'DataType': 'String',
                    'StringValue': 'high_value_payment'
                }
            }
        )
    
    response = exponential_backoff_retry(publish_message)
    logger.info(f"Notification sent successfully. MessageId: {response['MessageId']}")

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler for sending notifications"""
    try:
        # Handle EventBridge event format
        if 'detail' in event:
            payment_data = event['detail']
        # Handle direct invocation
        elif 'body' in event:
            payment_data = json.loads(event['body'])
        else:
            payment_data = event
        
        payment_id = payment_data.get('payment_id', 'Unknown')
        logger.append_keys(payment_id=payment_id)
        
        # Format notification
        message = format_notification_message(payment_data)
        subject = f"High Value Payment Alert - {payment_id}"
        
        # Send notification
        send_notification(message, subject, payment_id)
        
        # Record metrics
        metrics.add_metric(name="NotificationSent", unit=MetricUnit.Count, value=1)
        
        logger.info(f"Successfully processed notification for payment {payment_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notification sent successfully',
                'payment_id': payment_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        metrics.add_metric(name="NotificationError", unit=MetricUnit.Count, value=1)
        
        # Re-raise to trigger retry/DLQ
        raise
`;
}
```

## Key Features Implemented

### 1. **Architecture Components**
- ✅ API Gateway with request validation and throttling (1000 rps)
- ✅ Two Lambda functions with Python 3.11 runtime
- ✅ DynamoDB table with on-demand billing and point-in-time recovery
- ✅ SQS Dead Letter Queues (main and EventBridge)
- ✅ EventBridge for high-value transaction routing
- ✅ SNS topic for notifications
- ✅ VPC with private subnets for Lambda functions

### 2. **Security & Best Practices**
- ✅ Least privilege IAM roles for each component
- ✅ VPC endpoints to reduce data transfer costs
- ✅ AWS Systems Manager Parameter Store for configuration
- ✅ Encryption at rest for DynamoDB and SQS
- ✅ X-Ray tracing enabled

### 3. **Reliability Features**
- ✅ Exponential backoff retry logic in Lambda functions
- ✅ Dead Letter Queues for failed processing
- ✅ Lambda Powertools for structured logging and metrics
- ✅ Request validation at API Gateway level
- ✅ Caching for SSM parameters to reduce API calls

### 4. **Monitoring & Observability**
- ✅ CloudWatch Logs with retention policies
- ✅ X-Ray tracing for distributed tracing
- ✅ Custom metrics via Lambda Powertools
- ✅ Stack outputs for easy resource discovery

## Deployment Instructions

1. **Install the Lambda functions code**:
   Create a `lambda` directory in your project root and save the Python code:
   ```bash
   mkdir -p lambda
   # Save validation lambda code to lambda/validation.py
   # Save notification lambda code to lambda/notification.py
   ```

2. **Deploy the stack**:
   ```bash
   npm run build
   cdk deploy --context environmentSuffix=dev
   ```

3. **Post-deployment configuration**:
   - Update the API key in Parameter Store with your actual key
   - Subscribe email addresses to the SNS topic for notifications
   - Test the webhook endpoint with sample payment data

## Testing the Pipeline

Test your webhook endpoint with this sample request:

```bash
curl -X POST https://your-api-gateway-url/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_123456",
    "amount": 15000,
    "currency": "USD",
    "customer_id": "cust_789",
    "description": "High value payment test"
  }'
```

The pipeline will:
1. Validate the payment data
2. Store it in DynamoDB
3. Trigger EventBridge (since amount > $10,000)
4. Send a notification via SNS

This implementation provides a production-ready, scalable, and secure payment processing pipeline with comprehensive error handling and monitoring capabilities.
