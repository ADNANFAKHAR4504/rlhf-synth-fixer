# Payment Webhook Processing System - Infrastructure Code

This implementation provides a serverless payment webhook processing pipeline using AWS CDK with Python.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_kms as kms,
    aws_iam as iam,
    CfnOutput,
)
from constructs import Construct
import os

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Customer-managed KMS key for encryption
        encryption_key = kms.Key(
            self, f"webhook-encryption-key-{environment_suffix}",
            description="KMS key for webhook processing encryption",
            enable_key_rotation=True,
        )

        # Lambda Layer for shared dependencies
        shared_layer = _lambda.LayerVersion(
            self, f"shared-dependencies-layer-{environment_suffix}",
            code=_lambda.Code.from_asset("lib/lambda/layers/shared"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11],
            compatible_architectures=[_lambda.Architecture.ARM_64],
            description="Shared boto3 and cryptography libraries",
        )

        # DynamoDB table with on-demand billing and streams
        webhooks_table = dynamodb.Table(
            self, f"payment-webhooks-table-{environment_suffix}",
            table_name=f"PaymentWebhooks-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="webhookId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=encryption_key,
        )

        # Dead Letter Queue for failed webhook processing
        webhook_dlq = sqs.Queue(
            self, f"webhook-dlq-{environment_suffix}",
            queue_name=f"webhook-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=encryption_key,
        )

        # SNS Topic for critical alerts
        alert_topic = sns.Topic(
            self, f"webhook-alerts-{environment_suffix}",
            topic_name=f"webhook-alerts-{environment_suffix}",
            master_key=encryption_key,
        )

        # Create CloudWatch alarm for DLQ messages
        webhook_dlq.metric_approximate_number_of_messages_visible().create_alarm(
            self, f"webhook-dlq-alarm-{environment_suffix}",
            threshold=1,
            evaluation_periods=1,
        )

        # Webhook Receiver Lambda
        webhook_receiver = _lambda.Function(
            self, f"webhook-receiver-{environment_suffix}",
            function_name=f"webhook-receiver-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/webhook_receiver"),
            handler="index.handler",
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=100,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
                "PROCESSOR_QUEUE": "processor-queue",
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
        )

        # Grant permissions
        webhooks_table.grant_write_data(webhook_receiver)
        encryption_key.grant_encrypt_decrypt(webhook_receiver)

        # Payment Processor Lambda
        processor_dlq = sqs.Queue(
            self, f"processor-dlq-{environment_suffix}",
            queue_name=f"processor-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=encryption_key,
        )

        payment_processor = _lambda.Function(
            self, f"payment-processor-{environment_suffix}",
            function_name=f"payment-processor-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/payment_processor"),
            handler="index.handler",
            timeout=Duration.minutes(5),
            reserved_concurrent_executions=50,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
            dead_letter_queue=webhook_dlq,
        )

        # Grant permissions
        webhooks_table.grant_read_write_data(payment_processor)
        encryption_key.grant_encrypt_decrypt(payment_processor)
        webhook_dlq.grant_send_messages(payment_processor)

        # Audit Logger Lambda (triggered by DynamoDB Streams)
        audit_logger = _lambda.Function(
            self, f"audit-logger-{environment_suffix}",
            function_name=f"audit-logger-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/audit_logger"),
            handler="index.handler",
            timeout=Duration.seconds(60),
            reserved_concurrent_executions=20,
            environment={
                "ALERT_TOPIC_ARN": alert_topic.topic_arn,
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
        )

        # Add DynamoDB Stream as event source
        from aws_cdk import aws_lambda_event_sources as event_sources
        audit_logger.add_event_source(
            event_sources.DynamoEventSource(
                webhooks_table,
                starting_position=_lambda.StartingPosition.LATEST,
                batch_size=100,
                retry_attempts=3,
            )
        )

        # Grant permissions
        webhooks_table.grant_stream_read(audit_logger)
        alert_topic.grant_publish(audit_logger)
        encryption_key.grant_encrypt_decrypt(audit_logger)

        # API Gateway REST API
        api = apigw.RestApi(
            self, f"webhook-api-{environment_suffix}",
            rest_api_name=f"webhook-api-{environment_suffix}",
            description="Payment webhook processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                tracing_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
            ),
        )

        # Add /webhook resource
        webhook_resource = api.root.add_resource("webhook")

        # Add {provider} path parameter
        provider_resource = webhook_resource.add_resource("{provider}")

        # Add POST method with Lambda integration
        webhook_integration = apigw.LambdaIntegration(
            webhook_receiver,
            proxy=True,
        )

        provider_resource.add_method(
            "POST",
            webhook_integration,
            method_responses=[
                apigw.MethodResponse(status_code="200"),
                apigw.MethodResponse(status_code="400"),
                apigw.MethodResponse(status_code="500"),
            ],
        )

        # WAF Web ACL for rate limiting
        from aws_cdk import aws_wafv2 as wafv2

        web_acl = wafv2.CfnWebACL(
            self, f"webhook-waf-{environment_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"webhook-waf-{environment_suffix}",
                sampled_requests_enabled=True,
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name=f"rate-limit-rule-{environment_suffix}",
                    priority=1,
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block={}
                    ),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBased StatementProperty(
                            limit=10,
                            aggregate_key_type="IP",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"rate-limit-{environment_suffix}",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
        )

        # Associate WAF with API Gateway
        wafv2.CfnWebACLAssociation(
            self, f"waf-api-association-{environment_suffix}",
            resource_arn=f"arn:aws:apigateway:{self.region}::/restapis/{api.rest_api_id}/stages/prod",
            web_acl_arn=web_acl.attr_arn,
        )

        # Outputs
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self, "WebhooksTableName",
            value=webhooks_table.table_name,
            description="DynamoDB table name",
        )

        CfnOutput(
            self, "DLQUrl",
            value=webhook_dlq.queue_url,
            description="Dead Letter Queue URL",
        )
```

## File: lib/lambda/webhook_receiver/index.py

```python
import json
import os
import boto3
import uuid
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('webhook_receiver')
def handler(event, context):
    """
    Receives webhook from payment providers and stores in DynamoDB
    """
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider', 'unknown')

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Store webhook in DynamoDB
        item = {
            'webhookId': webhook_id,
            'timestamp': timestamp,
            'provider': provider,
            'payload': json.dumps(body),
            'status': 'received',
            'processed': False,
        }

        table.put_item(Item=item)

        # Log receipt
        print(f"Webhook received: {webhook_id} from {provider}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received successfully',
                'webhookId': webhook_id,
            }),
            'headers': {
                'Content-Type': 'application/json',
            },
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e),
            }),
            'headers': {
                'Content-Type': 'application/json',
            },
        }
```

## File: lib/lambda/payment_processor/index.py

```python
import json
import os
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('payment_processor')
def handler(event, context):
    """
    Processes payment webhooks asynchronously
    """
    try:
        # Process webhook (placeholder for actual business logic)
        webhook_id = event.get('webhookId')
        provider = event.get('provider')
        payload = event.get('payload')

        print(f"Processing webhook: {webhook_id} from {provider}")

        # Simulate payment processing
        # In production, this would validate signatures, process payments, etc.

        # Update webhook status
        table.update_item(
            Key={
                'webhookId': webhook_id,
                'timestamp': event.get('timestamp'),
            },
            UpdateExpression='SET #status = :status, processed = :processed',
            ExpressionAttributeNames={
                '#status': 'status',
            },
            ExpressionAttributeValues={
                ':status': 'processed',
                ':processed': True,
            },
        )

        print(f"Webhook processed successfully: {webhook_id}")

        return {
            'statusCode': 200,
            'message': 'Webhook processed successfully',
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        raise e
```

## File: lib/lambda/audit_logger/index.py

```python
import json
import os
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

sns = boto3.client('sns')
alert_topic_arn = os.environ['ALERT_TOPIC_ARN']

@xray_recorder.capture('audit_logger')
def handler(event, context):
    """
    Logs all DynamoDB stream events for audit purposes
    """
    try:
        print(f"Processing {len(event['Records'])} DynamoDB stream records")

        for record in event['Records']:
            event_name = record['eventName']
            webhook_id = record['dynamodb'].get('Keys', {}).get('webhookId', {}).get('S', 'unknown')

            # Log the event
            log_entry = {
                'eventName': event_name,
                'webhookId': webhook_id,
                'eventTime': record.get('dynamodb', {}).get('ApproximateCreationDateTime'),
            }

            print(f"Audit log: {json.dumps(log_entry)}")

            # Send alert for critical events
            if event_name == 'REMOVE':
                sns.publish(
                    TopicArn=alert_topic_arn,
                    Subject='Webhook Deleted - Audit Alert',
                    Message=json.dumps(log_entry),
                )

        return {
            'statusCode': 200,
            'message': f'Processed {len(event["Records"])} audit records',
        }

    except Exception as e:
        print(f"Error in audit logger: {str(e)}")
        raise e
```

## File: lib/lambda/layers/shared/python/requirements.txt

```txt
boto3==1.34.0
cryptography==41.0.7
aws-xray-sdk==2.12.1
```

## File: requirements.txt

```txt
aws-cdk-lib==2.120.0
constructs>=10.0.0,<11.0.0
```

## File: app.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

environment_suffix = app.node.try_get_context("environment_suffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(
    app,
    f"TapStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-east-1'
    ),
)

app.synth()
```

## File: cdk.json

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "**/.venv",
      "**/.pytest_cache"
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: lib/README.md

```markdown
# Payment Webhook Processing System

A serverless payment webhook processing pipeline built with AWS CDK and Python for handling webhooks from multiple payment providers (Stripe, PayPal, Square).

## Architecture

The system consists of:

- **API Gateway REST API**: Entry point for webhooks with /webhook/{provider} endpoint
- **Lambda Functions**: Three functions for receiving, processing, and auditing webhooks
- **DynamoDB**: Table for storing webhook data with streams enabled
- **SQS**: Dead letter queues for failed processing
- **SNS**: Alert topic for critical events
- **KMS**: Customer-managed encryption key
- **WAF**: Rate-based rules to protect API (10 req/sec per IP)
- **X-Ray**: Distributed tracing across all services

## Requirements

- Python 3.11+
- AWS CDK 2.120.0+
- AWS CLI configured
- Node.js 18+ (for CDK)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Lambda layer dependencies:
```bash
cd lib/lambda/layers/shared/python
pip install -r requirements.txt -t .
cd ../../../../..
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Deploy with environment suffix:

```bash
export ENVIRONMENT_SUFFIX=dev
cdk deploy
```

Or pass via context:

```bash
cdk deploy -c environment_suffix=prod
```

## Testing

Test the webhook endpoint:

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", "amount": 1000}'
```

## Configuration

All resources include the `environment_suffix` parameter for multi-environment deployments:

- Lambda functions: Reserved concurrent executions configured
- DynamoDB: On-demand billing mode
- API Gateway: 1000 req/sec throttling
- WAF: 10 req/sec per IP rate limiting
- X-Ray: Enabled on all services
- KMS: Customer-managed key for all encryption

## Monitoring

- CloudWatch Logs: Lambda function logs
- CloudWatch Metrics: API Gateway, DynamoDB, Lambda metrics
- X-Ray: Distributed tracing
- CloudWatch Alarms: DLQ message alerts

## Security

- All Lambda environment variables encrypted with customer-managed KMS key
- DynamoDB encrypted at rest with customer-managed KMS key
- SQS queues encrypted with KMS
- SNS topic encrypted with KMS
- IAM roles with least privilege
- WAF rate limiting to prevent abuse

## Clean Up

```bash
cdk destroy
```

## Architecture Diagram

```
Internet
   |
   v
API Gateway (+ WAF) --> Lambda (Webhook Receiver) --> DynamoDB
   |                                                      |
   |                                                      v
   |                                           DynamoDB Streams
   |                                                      |
   |                                                      v
   +------------------------------------> Lambda (Audit Logger) --> SNS Alerts

Failed Webhooks --> SQS DLQ --> CloudWatch Alarm --> SNS Alerts
```

## Lambda Functions

1. **webhook_receiver**: Receives webhooks and stores in DynamoDB (30s timeout, 100 concurrent)
2. **payment_processor**: Processes webhooks asynchronously (5min timeout, 50 concurrent)
3. **audit_logger**: Logs all DynamoDB changes for compliance (triggered by streams)

## Compliance

- PCI DSS: Encryption at rest and in transit
- Audit logging: All changes tracked via DynamoDB streams
- Retention: 14-day DLQ retention for investigation
