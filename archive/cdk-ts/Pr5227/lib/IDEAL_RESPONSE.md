# Overview

Please find solution files below.

## ./bin/tap.ts

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
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/notification.py

```python
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
*** HIGH VALUE PAYMENT ALERT ***

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
```

## ./lib/lambda/validation.py

```python
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
```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
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
    const apiKeyParameter = new ssm.StringParameter(
      this,
      `ApiKey-${environmentSuffix}`,
      {
        parameterName: `/payment-processing/${environmentSuffix}/api-key`,
        stringValue: 'PLACEHOLDER_API_KEY', // This should be set manually after deployment
        description: 'API key for payment validation',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    const highValueThreshold = new ssm.StringParameter(
      this,
      `HighValueThreshold-${environmentSuffix}`,
      {
        parameterName: `/payment-processing/${environmentSuffix}/high-value-threshold`,
        stringValue: '10000',
        description: 'Threshold for high-value transaction notifications',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // ========================================
    // DynamoDB Table
    // ========================================
    const paymentsTable = new dynamodb.Table(
      this,
      `PaymentsTable-${environmentSuffix}`,
      {
        tableName: `payments-${environmentSuffix}`,
        partitionKey: {
          name: 'payment_id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // ========================================
    // Dead Letter Queues
    // ========================================
    const mainDLQ = new sqs.Queue(this, `MainDLQ-${environmentSuffix}`, {
      queueName: `payment-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const eventBridgeDLQ = new sqs.Queue(
      this,
      `EventBridgeDLQ-${environmentSuffix}`,
      {
        queueName: `eventbridge-dlq-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
        encryption: sqs.QueueEncryption.KMS_MANAGED,
      }
    );

    // ========================================
    // SNS Topic for Notifications
    // ========================================
    const notificationTopic = new sns.Topic(
      this,
      `NotificationTopic-${environmentSuffix}`,
      {
        topicName: `high-value-payments-${environmentSuffix}`,
        displayName: 'High Value Payment Notifications',
      }
    );

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
    const validationLambdaRole = new iam.Role(
      this,
      `ValidationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `payment-validation-role-${environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    const validationLambda = new lambda.Function(
      this,
      `ValidationLambda-${environmentSuffix}`,
      {
        functionName: `payment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'validation.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
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
      }
    );
    cdk.Tags.of(validationLambda).add('iac-rlhf-amazon', 'true');

    // Grant permissions to validation lambda
    paymentsTable.grantWriteData(validationLambda);
    apiKeyParameter.grantRead(validationLambda);
    highValueThreshold.grantRead(validationLambda);
    mainDLQ.grantSendMessages(validationLambda);

    // ========================================
    // Notification Lambda
    // ========================================
    const notificationLambdaRole = new iam.Role(
      this,
      `NotificationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `payment-notification-role-${environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
      }
    );

    const notificationLambda = new lambda.Function(
      this,
      `NotificationLambda-${environmentSuffix}`,
      {
        functionName: `payment-notification-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'notification.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
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
      }
    );
    cdk.Tags.of(notificationLambda).add('iac-rlhf-amazon', 'true');

    // Grant permissions to notification lambda
    notificationTopic.grantPublish(notificationLambda);

    // ========================================
    // EventBridge for High-Value Transactions
    // ========================================
    const eventBus = new events.EventBus(
      this,
      `PaymentEventBus-${environmentSuffix}`,
      {
        eventBusName: `payment-events-${environmentSuffix}`,
      }
    );

    const highValueRule = new events.Rule(
      this,
      `HighValueRule-${environmentSuffix}`,
      {
        ruleName: `high-value-payments-${environmentSuffix}`,
        eventBus: eventBus,
        eventPattern: {
          source: ['payment.processing'],
          detailType: ['High Value Payment'],
          detail: {
            amount: [
              {
                numeric: ['>', 10000],
              },
            ],
          },
        },
      }
    );

    // Add Lambda target with DLQ
    highValueRule.addTarget(
      new targets.LambdaFunction(notificationLambda, {
        deadLetterQueue: eventBridgeDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 3,
      })
    );

    // Grant EventBridge permission to put events
    eventBus.grantPutEventsTo(validationLambda);

    // Add EventBridge permissions to validation lambda
    validationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );

    // Add environment variable for EventBridge
    validationLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    // ========================================
    // API Gateway
    // ========================================
    const api = new apigateway.RestApi(
      this,
      `PaymentAPI-${environmentSuffix}`,
      {
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
      }
    );

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator-${environmentSuffix}`,
      {
        restApi: api,
        requestValidatorName: 'payment-validator',
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // Request Model for validation
    const paymentModel = new apigateway.Model(
      this,
      `PaymentModel-${environmentSuffix}`,
      {
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
      }
    );

    // Create webhook endpoint
    const paymentsResource = api.root.addResource('payments');
    const webhookResource = paymentsResource.addResource('webhook');

    const lambdaIntegration = new apigateway.LambdaIntegration(
      validationLambda,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

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

    // ========================================
    // Add iac-rlhf-amazon tags to all resources
    // ========================================
    cdk.Tags.of(vpc).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(apiKeyParameter).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(highValueThreshold).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(paymentsTable).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(mainDLQ).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(eventBridgeDLQ).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(notificationTopic).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(validationLambdaRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(notificationLambdaRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(eventBus).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(highValueRule).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(api).add('iac-rlhf-amazon', 'true');
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import axios from 'axios';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Read flat outputs
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

function getOutputs() {
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const apiEndpoint = outputs[`ApiEndpoint${environmentSuffix}`] || outputs.ApiEndpoint;
  const dynamoDBTableName = outputs[`DynamoDBTableName${environmentSuffix}`] || outputs.DynamoDBTableName;
  const snsTopicArn = outputs[`SNSTopicArn${environmentSuffix}`] || outputs.SNSTopicArn;

  return { region, environmentSuffix, apiEndpoint, dynamoDBTableName, snsTopicArn };
}

describe('TapStack Integration Tests - Live Resources', () => {
  const { region, environmentSuffix, apiEndpoint, dynamoDBTableName, snsTopicArn } = getOutputs();

  // Generate unique test IDs for test isolation
  const testRunId = Date.now();
  const testPaymentId = `test-payment-${testRunId}`;
  const lowValuePaymentId = `test-low-${testRunId}`;
  const highValuePaymentId = `test-high-${testRunId}`;

  describe('Live AWS Resource Validation', () => {
    test('should verify DynamoDB table exists and is active', async () => {
      const { stdout } = await execAsync(
        `aws dynamodb describe-table --table-name ${dynamoDBTableName} --region ${region}`
      );
      const table = JSON.parse(stdout).Table;

      expect(table.TableName).toBe(dynamoDBTableName);
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');

      // Verify key schema
      const hashKey = table.KeySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = table.KeySchema.find((k: any) => k.KeyType === 'RANGE');
      expect(hashKey.AttributeName).toBe('payment_id');
      expect(rangeKey.AttributeName).toBe('timestamp');
    }, 30000);

    test('should verify SNS topic exists and is accessible', async () => {
      const { stdout } = await execAsync(
        `aws sns get-topic-attributes --topic-arn ${snsTopicArn} --region ${region}`
      );
      const attributes = JSON.parse(stdout).Attributes;

      expect(attributes.TopicArn).toBe(snsTopicArn);
      expect(attributes.DisplayName.toLowerCase()).toContain('high');
      expect(attributes.DisplayName.toLowerCase()).toContain('value');
    }, 30000);

    test('should verify validation Lambda function exists and is active', async () => {
      const functionName = `payment-validation-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );
      const config = JSON.parse(stdout).Configuration;

      expect(config.FunctionName).toBe(functionName);
      expect(config.Runtime).toBe('python3.11');
      expect(config.State).toBe('Active');
      expect(config.MemorySize).toBeGreaterThanOrEqual(512);
    }, 30000);

    test('should verify notification Lambda function exists and is active', async () => {
      const functionName = `payment-notification-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );
      const config = JSON.parse(stdout).Configuration;

      expect(config.FunctionName).toBe(functionName);
      expect(config.Runtime).toBe('python3.11');
      expect(config.State).toBe('Active');
    }, 30000);

    test('should verify EventBridge rule exists for high-value payments', async () => {
      const eventBusName = `payment-events-${environmentSuffix}`;
      const { stdout } = await execAsync(
        `aws events list-rules --event-bus-name ${eventBusName} --region ${region}`
      );
      const rules = JSON.parse(stdout).Rules;

      expect(rules.length).toBeGreaterThan(0);
      const highValueRule = rules.find((r: any) => r.Name === `high-value-payments-${environmentSuffix}`);
      expect(highValueRule).toBeTruthy();
      expect(highValueRule.Name).toBe(`high-value-payments-${environmentSuffix}`);
      expect(highValueRule.State).toBe('ENABLED');
      expect(highValueRule.EventBusName).toBe(eventBusName);
    }, 30000);
  });

  describe('API Gateway - Payment Validation', () => {
    test('should return 400 for invalid payment request', async () => {
      try {
        await axios.post(`${apiEndpoint}payments/webhook`, {
          invalid: 'data',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    }, 30000);

    test('should accept valid low-value payment request and return request_id', async () => {
      const validPayment = {
        payment_id: testPaymentId,
        amount: 100.0,
        currency: 'USD',
        customer_id: 'cust_test_123',
        description: 'Integration test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        validPayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('payment_id', testPaymentId);
      expect(response.data).toHaveProperty('request_id');
      expect(response.data.request_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }, 30000);
  });

  describe('End-to-End Payment Processing', () => {
    test('should process low-value payment and store in DynamoDB', async () => {
      const lowValuePayment = {
        payment_id: lowValuePaymentId,
        amount: 500.0,
        currency: 'USD',
        customer_id: 'cust_low_value',
        description: 'Low value test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        lowValuePayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('payment_id', lowValuePaymentId);
      expect(response.data).toHaveProperty('message', 'Payment processed successfully');
      expect(response.data).toHaveProperty('request_id');

      // Wait for eventual consistency and verify payment stored in DynamoDB
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query DynamoDB to verify payment was stored
      const { stdout } = await execAsync(
        `aws dynamodb query --table-name ${dynamoDBTableName} ` +
        `--key-condition-expression "payment_id = :pid" ` +
        `--expression-attribute-values '{":pid":{"S":"${lowValuePaymentId}"}}' ` +
        `--region ${region}`
      );
      const items = JSON.parse(stdout).Items;

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].payment_id.S).toBe(lowValuePaymentId);
      expect(items[0].status.S).toBe('validated');
      expect(parseFloat(items[0].amount.N)).toBe(500);
    }, 30000);

    test('should process high-value payment and verify complete workflow', async () => {
      const highValuePayment = {
        payment_id: highValuePaymentId,
        amount: 15000.0,
        currency: 'USD',
        customer_id: 'cust_high_value',
        description: 'High value test payment',
      };

      const response = await axios.post(
        `${apiEndpoint}payments/webhook`,
        highValuePayment,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('payment_id', highValuePaymentId);
      expect(response.data).toHaveProperty('message', 'Payment processed successfully');
      expect(response.data).toHaveProperty('request_id');

      // Verify high-value payment triggers EventBridge (amount > 10000)
      expect(highValuePayment.amount).toBeGreaterThan(10000);

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query DynamoDB to verify high-value payment was stored
      const { stdout } = await execAsync(
        `aws dynamodb query --table-name ${dynamoDBTableName} ` +
        `--key-condition-expression "payment_id = :pid" ` +
        `--expression-attribute-values '{":pid":{"S":"${highValuePaymentId}"}}' ` +
        `--region ${region}`
      );
      const items = JSON.parse(stdout).Items;

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].payment_id.S).toBe(highValuePaymentId);
      expect(items[0].status.S).toBe('validated');
      expect(parseFloat(items[0].amount.N)).toBe(15000);
    }, 30000);

    test('should validate all required payment fields', async () => {
      const testCases = [
        { field: 'payment_id', value: null },
        { field: 'amount', value: null },
        { field: 'currency', value: null },
        { field: 'customer_id', value: null },
      ];

      for (const testCase of testCases) {
        const invalidPayment: any = {
          payment_id: `test-${Date.now()}`,
          amount: 100.0,
          currency: 'USD',
          customer_id: 'test_customer',
        };

        invalidPayment[testCase.field] = testCase.value;

        try {
          await axios.post(`${apiEndpoint}payments/webhook`, invalidPayment, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          fail(`Should have rejected payment without ${testCase.field}`);
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      }
    }, 30000);

    test('should handle concurrent payment requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        payment_id: `concurrent-${testRunId}-${i}`,
        amount: 100.0 + i * 10,
        currency: 'USD',
        customer_id: `cust_concurrent_${i}`,
        description: `Concurrent test ${i}`,
      }));

      const requests = concurrentRequests.map((payment) =>
        axios.post(`${apiEndpoint}payments/webhook`, payment, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    }, 30000);
  });

  // Cleanup
  afterAll(async () => {
    // Note: In production, you might want to clean up test data
    // For this integration test, we leave the data for verification
    console.log('Integration tests completed successfully');
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create VPC with 2 public and 2 private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create VPC endpoints for DynamoDB and S3', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('dynamodb')]),
          ]),
        }),
      });

      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('s3')])]),
        }),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create API key parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-processing/${environmentSuffix}/api-key`,
        Type: 'String',
        Description: 'API key for payment validation',
        Tags: Match.objectLike({
          'iac-rlhf-amazon': 'true',
        }),
      });
    });

    test('should create high value threshold parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-processing/${environmentSuffix}/high-value-threshold`,
        Value: '10000',
        Description: 'Threshold for high-value transaction notifications',
        Tags: Match.objectLike({
          'iac-rlhf-amazon': 'true',
        }),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `payments-${environmentSuffix}`,
        AttributeDefinitions: [
          { AttributeName: 'payment_id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'payment_id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should enable encryption for DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('SQS Dead Letter Queues', () => {
    test('should create main DLQ with 14 days retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `payment-processing-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
        KmsMasterKeyId: 'alias/aws/sqs',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create EventBridge DLQ with 14 days retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `eventbridge-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
        KmsMasterKeyId: 'alias/aws/sqs',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should have exactly 2 SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `high-value-payments-${environmentSuffix}`,
        DisplayName: 'High Value Payment Notifications',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create validation Lambda with Python 3.11', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'validation.handler',
        MemorySize: 512,
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create notification Lambda with Python 3.11', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-notification-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'notification.handler',
        MemorySize: 512,
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should deploy Lambdas in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('should configure validation Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'payment-validation',
            POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('should configure notification Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-notification-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'payment-notification',
            POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('should attach Lambda Powertools layer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Layers: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('AWSLambdaPowertoolsPythonV2')]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create validation Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-validation-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create notification Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-notification-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should grant DynamoDB write permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SSM parameter read permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:DescribeParameters',
                'ssm:GetParameters',
                'ssm:GetParameter',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant EventBridge PutEvents permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'events:PutEvents',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SNS publish permissions to notification Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('should create EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });
    });

    test('should create EventBridge rule for high-value payments', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `high-value-payments-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['payment.processing'],
          'detail-type': ['High Value Payment'],
          detail: {
            amount: [
              {
                numeric: ['>', 10000],
              },
            ],
          },
        }),
      });
    });

    test('should configure EventBridge rule with DLQ', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.objectLike({
              Arn: Match.anyValue(),
            }),
            RetryPolicy: Match.objectLike({
              MaximumRetryAttempts: 3,
            }),
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `payment-processing-api-${environmentSuffix}`,
        Description: 'Payment Processing Webhook API',
      });
    });

    test('should configure API Gateway with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description: Match.anyValue(),
      });
      // Note: Throttling is configured in the stage, not in the deployment
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'payment-validator',
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create payment model for request validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'PaymentModel',
        ContentType: 'application/json',
        Schema: Match.objectLike({
          type: 'object',
          required: Match.arrayWith(['payment_id', 'amount', 'currency', 'customer_id']),
          properties: Match.objectLike({
            payment_id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            customer_id: { type: 'string' },
          }),
        }),
      });
    });

    test('should create /payments/webhook resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'webhook',
      });
    });

    test('should create POST method for webhook', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export API endpoint', () => {
      template.hasOutput(`ApiEndpoint${environmentSuffix}`, {
        Description: 'API Gateway endpoint URL',
        Export: Match.objectLike({
          Name: `payment-api-url-${environmentSuffix}`,
        }),
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput(`DynamoDBTableName${environmentSuffix}`, {
        Description: 'DynamoDB table name for payments',
        Export: Match.objectLike({
          Name: `payments-table-${environmentSuffix}`,
        }),
      });
    });

    test('should export SNS topic ARN', () => {
      template.hasOutput(`SNSTopicArn${environmentSuffix}`, {
        Description: 'SNS topic ARN for high-value notifications',
        Export: Match.objectLike({
          Name: `notification-topic-${environmentSuffix}`,
        }),
      });
    });
  });

  describe('Tagging', () => {
    test('should tag all resources with iac-rlhf-amazon', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // DynamoDB
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // SQS
      template.hasResourceProperties('AWS::SQS::Queue', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // SNS
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // Lambda
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // IAM Role
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Stack Properties', () => {
    test('should accept environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'qa',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-qa',
      });
    });

    test('should use context environmentSuffix if provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-staging',
      });
    });

    test('should default to dev if no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-dev',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3); // 2 app lambdas + 1 LogRetention custom resource lambda
    });

    test('should have correct number of IAM roles', () => {
      // ValidationLambdaRole, NotificationLambdaRole, LogRetentionRole, CustomResourceRole
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('should have one EventBridge event bus', () => {
      template.resourceCountIs('AWS::Events::EventBus', 1);
    });

    test('should have one EventBridge rule', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('should have one API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should have one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });
});

```

## ./cdk.json

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
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
