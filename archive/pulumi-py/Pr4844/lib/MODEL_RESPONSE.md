### Reasoning Trace

---

This is a comprehensive request for a Pulumi program in Python that creates an event-driven architecture for a logistics application. Let me break down what's needed:

1. **Amazon EventBridge** - Central event bus for routing shipment update events
2. **AWS Lambda Functions** - Process events (Python 3.10 runtime)
3. **Amazon DynamoDB** - Store event logs and tracking data
4. **Amazon CloudWatch** - Logs and metrics collection
5. **Amazon SNS** - Real-time error notifications
6. **IAM Roles and Policies** - Least-privilege access

The solution needs to:

- Process ~1,500 shipment updates per day (relatively low volume, ~63/hour, ~1/minute)
- Be serverless and cost-efficient
- Have good observability
- Follow best practices
- Be maintainable and easy to deploy

I'll create a well-structured Pulumi program with:

- Configuration management
- Multiple Lambda functions for different processing tasks
- Proper IAM roles and policies
- CloudWatch alarms and logging
- DynamoDB tables for persistence
- SNS topics for notifications
- EventBridge rules for routing

Let me structure this properly with clear Python code.

### Answer

---

I'll help you create a comprehensive Pulumi program for an event-driven logistics application. This solution will implement a serverless architecture that processes shipment updates efficiently while maintaining reliability and observability.

## Project Structure

First, let's organize the project structure:

```
logistics-event-processor/
├── __main__.py           # Main Pulumi program
├── Pulumi.yaml           # Pulumi project file
├── Pulumi.dev.yaml       # Development configuration
├── requirements.txt      # Python dependencies
├── lambdas/
│   ├── shipment_processor.py
│   ├── status_updater.py
│   └── notification_handler.py
└── utils/
    └── iam_policies.py
```

## Main Pulumi Program (`__main__.py`)

```python
"""
Event-Driven Logistics Application Infrastructure
Processes ~1,500 daily shipment updates using AWS serverless services
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output
from datetime import datetime
from utils.iam_policies import create_lambda_role, create_eventbridge_role

# Load configuration
config = Config()
environment = config.get("environment") or "dev"
retention_days = config.get_int("log_retention_days") or 7
alert_email = config.require("alert_email")
enable_xray = config.get_bool("enable_xray") or False

# Tags for all resources
common_tags = {
    "Environment": environment,
    "Application": "logistics-event-processor",
    "ManagedBy": "Pulumi",
    "CreatedAt": datetime.utcnow().isoformat()
}

# ============================================================================
# DynamoDB Tables
# ============================================================================

# Table for shipment events and tracking
shipment_events_table = aws.dynamodb.Table(
    "shipment-events-table",
    name=f"logistics-shipment-events-{environment}",
    billing_mode="PAY_PER_REQUEST",  # Suitable for 1,500 events/day
    hash_key="event_id",
    range_key="timestamp",
    attributes=[
        {
            "name": "event_id",
            "type": "S"
        },
        {
            "name": "timestamp",
            "type": "N"
        },
        {
            "name": "shipment_id",
            "type": "S"
        },
        {
            "name": "status",
            "type": "S"
        }
    ],
    global_secondary_indexes=[
        {
            "name": "shipment-index",
            "hash_key": "shipment_id",
            "range_key": "timestamp",
            "projection_type": "ALL"
        },
        {
            "name": "status-index",
            "hash_key": "status",
            "range_key": "timestamp",
            "projection_type": "ALL"
        }
    ],
    point_in_time_recovery={
        "enabled": True  # Enable backup for production data
    },
    server_side_encryption={
        "enabled": True,
        "sse_type": "KMS"
    },
    tags=common_tags
)

# Table for processing errors and dead letter events
error_events_table = aws.dynamodb.Table(
    "error-events-table",
    name=f"logistics-error-events-{environment}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="error_id",
    range_key="timestamp",
    attributes=[
        {
            "name": "error_id",
            "type": "S"
        },
        {
            "name": "timestamp",
            "type": "N"
        }
    ],
    ttl={
        "enabled": True,
        "attribute_name": "ttl"  # Auto-delete old errors after 30 days
    },
    tags=common_tags
)

# ============================================================================
# SNS Topics for Notifications
# ============================================================================

# Topic for critical alerts
alert_topic = aws.sns.Topic(
    "alert-topic",
    name=f"logistics-alerts-{environment}",
    kms_master_key_id="alias/aws/sns",
    tags=common_tags
)

# Email subscription for alerts
alert_subscription = aws.sns.TopicSubscription(
    "alert-email-subscription",
    topic=alert_topic.arn,
    protocol="email",
    endpoint=alert_email
)

# Topic for processing notifications
processing_topic = aws.sns.Topic(
    "processing-topic",
    name=f"logistics-processing-{environment}",
    kms_master_key_id="alias/aws/sns",
    tags=common_tags
)

# ============================================================================
# EventBridge Event Bus
# ============================================================================

# Custom event bus for logistics events
event_bus = aws.cloudwatch.EventBus(
    "logistics-event-bus",
    name=f"logistics-events-{environment}",
    tags=common_tags
)

# Archive for event replay capability
event_archive = aws.cloudwatch.EventArchive(
    "logistics-event-archive",
    name=f"logistics-archive-{environment}",
    event_source_arn=event_bus.arn,
    retention_days=7,  # Keep events for 7 days for replay
    description="Archive of all logistics events for replay and audit"
)

# ============================================================================
# Lambda Functions
# ============================================================================

# Create IAM role for Lambda functions
lambda_role = create_lambda_role(
    "logistics-lambda-role",
    environment,
    [
        shipment_events_table.arn,
        error_events_table.arn,
        alert_topic.arn,
        processing_topic.arn
    ]
)

# Lambda Layer for shared dependencies
lambda_layer = aws.lambda_.LayerVersion(
    "logistics-common-layer",
    layer_name=f"logistics-common-{environment}",
    compatible_runtimes=["python3.10"],
    code=pulumi.FileArchive("./layers/common.zip"),  # Pre-built layer with boto3, etc.
    description="Common libraries for logistics Lambda functions"
)

# Shipment Processor Lambda
shipment_processor = aws.lambda_.Function(
    "shipment-processor",
    name=f"logistics-shipment-processor-{environment}",
    runtime="python3.10",
    handler="shipment_processor.handler",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambdas")
    }),
    role=lambda_role.arn,
    timeout=30,  # 30 seconds timeout
    memory_size=256,  # 256MB memory
    environment={
        "variables": {
            "ENVIRONMENT": environment,
            "EVENTS_TABLE": shipment_events_table.name,
            "ERROR_TABLE": error_events_table.name,
            "SNS_TOPIC": processing_topic.arn,
            "ENABLE_XRAY": str(enable_xray).lower()
        }
    },
    tracing_config={
        "mode": "Active" if enable_xray else "PassThrough"
    },
    dead_letter_config={
        "target_arn": alert_topic.arn
    },
    reserved_concurrent_executions=10,  # Limit concurrency for cost control
    tags=common_tags
)

# Status Updater Lambda
status_updater = aws.lambda_.Function(
    "status-updater",
    name=f"logistics-status-updater-{environment}",
    runtime="python3.10",
    handler="status_updater.handler",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambdas")
    }),
    role=lambda_role.arn,
    timeout=15,
    memory_size=128,
    environment={
        "variables": {
            "ENVIRONMENT": environment,
            "EVENTS_TABLE": shipment_events_table.name,
            "ERROR_TABLE": error_events_table.name
        }
    },
    tracing_config={
        "mode": "Active" if enable_xray else "PassThrough"
    },
    tags=common_tags
)

# Notification Handler Lambda
notification_handler = aws.lambda_.Function(
    "notification-handler",
    name=f"logistics-notification-handler-{environment}",
    runtime="python3.10",
    handler="notification_handler.handler",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambdas")
    }),
    role=lambda_role.arn,
    timeout=10,
    memory_size=128,
    environment={
        "variables": {
            "ENVIRONMENT": environment,
            "ALERT_TOPIC": alert_topic.arn,
            "PROCESSING_TOPIC": processing_topic.arn
        }
    },
    tags=common_tags
)

# ============================================================================
# EventBridge Rules
# ============================================================================

# Rule for shipment creation events
shipment_create_rule = aws.cloudwatch.EventRule(
    "shipment-create-rule",
    name=f"logistics-shipment-create-{environment}",
    event_bus_name=event_bus.name,
    event_pattern=json.dumps({
        "source": ["logistics.shipment"],
        "detail-type": ["Shipment Created"]
    }),
    state="ENABLED",
    tags=common_tags
)

# Target shipment processor for creation events
aws.cloudwatch.EventTarget(
    "shipment-create-target",
    rule=shipment_create_rule.name,
    event_bus_name=event_bus.name,
    arn=shipment_processor.arn,
    retry_policy={
        "maximum_event_age": 3600,  # 1 hour
        "maximum_retry_attempts": 2
    },
    dead_letter_config={
        "arn": error_events_table.arn
    }
)

# Permission for EventBridge to invoke Lambda
aws.lambda_.Permission(
    "shipment-processor-eventbridge-permission",
    statement_id="AllowEventBridgeInvoke",
    action="lambda:InvokeFunction",
    function=shipment_processor.name,
    principal="events.amazonaws.com",
    source_arn=shipment_create_rule.arn
)

# Rule for status update events
status_update_rule = aws.cloudwatch.EventRule(
    "status-update-rule",
    name=f"logistics-status-update-{environment}",
    event_bus_name=event_bus.name,
    event_pattern=json.dumps({
        "source": ["logistics.shipment"],
        "detail-type": ["Shipment Status Updated"]
    }),
    state="ENABLED",
    tags=common_tags
)

# Target status updater for status events
aws.cloudwatch.EventTarget(
    "status-update-target",
    rule=status_update_rule.name,
    event_bus_name=event_bus.name,
    arn=status_updater.arn,
    retry_policy={
        "maximum_event_age": 1800,  # 30 minutes
        "maximum_retry_attempts": 1
    }
)

# Permission for EventBridge to invoke status updater
aws.lambda_.Permission(
    "status-updater-eventbridge-permission",
    statement_id="AllowEventBridgeInvoke",
    action="lambda:InvokeFunction",
    function=status_updater.name,
    principal="events.amazonaws.com",
    source_arn=status_update_rule.arn
)

# Rule for error events
error_rule = aws.cloudwatch.EventRule(
    "error-event-rule",
    name=f"logistics-errors-{environment}",
    event_bus_name=event_bus.name,
    event_pattern=json.dumps({
        "source": ["logistics.error"],
        "detail-type": ["Processing Error", "Critical Error"]
    }),
    state="ENABLED",
    tags=common_tags
)

# Target notification handler for errors
aws.cloudwatch.EventTarget(
    "error-notification-target",
    rule=error_rule.name,
    event_bus_name=event_bus.name,
    arn=notification_handler.arn
)

# ============================================================================
# CloudWatch Monitoring
# ============================================================================

# Log groups for Lambda functions
shipment_processor_logs = aws.cloudwatch.LogGroup(
    "shipment-processor-logs",
    name=f"/aws/lambda/{shipment_processor.name}",
    retention_in_days=retention_days,
    tags=common_tags
)

status_updater_logs = aws.cloudwatch.LogGroup(
    "status-updater-logs",
    name=f"/aws/lambda/{status_updater.name}",
    retention_in_days=retention_days,
    tags=common_tags
)

# Metric filters for error tracking
error_metric_filter = aws.cloudwatch.LogMetricFilter(
    "error-metric-filter",
    name=f"logistics-errors-{environment}",
    log_group_name=shipment_processor_logs.name,
    pattern="[ERROR]",
    metric_transformation={
        "name": "ProcessingErrors",
        "namespace": f"Logistics/{environment}",
        "value": "1",
        "default_value": 0
    }
)

# CloudWatch Dashboard
dashboard_body = Output.all(
    shipment_processor.name,
    status_updater.name,
    shipment_events_table.name
).apply(lambda args: json.dumps({
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                    [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                    [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": aws.get_region().name,
                "title": "Lambda Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                    [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": aws.get_region().name,
                "title": "DynamoDB Usage",
                "period": 300
            }
        }
    ]
}))

dashboard = aws.cloudwatch.Dashboard(
    "logistics-dashboard",
    dashboard_name=f"logistics-overview-{environment}",
    dashboard_body=dashboard_body
)

# CloudWatch Alarms
high_error_alarm = aws.cloudwatch.MetricAlarm(
    "high-error-alarm",
    name=f"logistics-high-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="Alert when Lambda errors exceed threshold",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "FunctionName": shipment_processor.name
    },
    tags=common_tags
)

# DynamoDB throttle alarm
dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
    "dynamodb-throttle-alarm",
    name=f"logistics-dynamodb-throttles-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="UserErrors",
    namespace="AWS/DynamoDB",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="Alert when DynamoDB throttling occurs",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "TableName": shipment_events_table.name
    },
    tags=common_tags
)

# ============================================================================
# Outputs
# ============================================================================

pulumi.export("event_bus_name", event_bus.name)
pulumi.export("event_bus_arn", event_bus.arn)
pulumi.export("shipment_table_name", shipment_events_table.name)
pulumi.export("error_table_name", error_events_table.name)
pulumi.export("alert_topic_arn", alert_topic.arn)
pulumi.export("dashboard_url", Output.concat(
    "https://console.aws.amazon.com/cloudwatch/home?region=",
    aws.get_region().name,
    "#dashboards:name=",
    dashboard.dashboard_name
))
pulumi.export("lambda_functions", {
    "shipment_processor": shipment_processor.name,
    "status_updater": status_updater.name,
    "notification_handler": notification_handler.name
})
```

## IAM Policies (`utils/iam_policies.py`)

```python
"""
IAM roles and policies for least-privilege access
"""

import pulumi
import pulumi_aws as aws
import json
from typing import List

def create_lambda_role(name: str, environment: str, resource_arns: List[str]) -> aws.iam.Role:
    """
    Creates an IAM role for Lambda functions with least-privilege access
    """

    # Assume role policy for Lambda
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    })

    # Create the role
    role = aws.iam.Role(
        name,
        name=f"{name}-{environment}",
        assume_role_policy=assume_role_policy,
        tags={
            "Environment": environment,
            "Purpose": "Lambda execution role"
        }
    )

    # Attach basic Lambda execution policy
    aws.iam.RolePolicyAttachment(
        f"{name}-lambda-basic",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Attach X-Ray tracing policy
    aws.iam.RolePolicyAttachment(
        f"{name}-xray",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
    )

    # Custom policy for DynamoDB and SNS access
    custom_policy = aws.iam.Policy(
        f"{name}-custom-policy",
        name=f"{name}-custom-{environment}",
        policy=pulumi.Output.all(*resource_arns).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:BatchWriteItem"
                        ],
                        "Resource": [arn for arn in arns if "dynamodb" in arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": [arn for arn in arns if "sns" in arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": [
                                    f"dynamodb.{aws.get_region().name}.amazonaws.com",
                                    f"sns.{aws.get_region().name}.amazonaws.com"
                                ]
                            }
                        }
                    }
                ]
            })
        )
    )

    # Attach custom policy to role
    aws.iam.RolePolicyAttachment(
        f"{name}-custom-attachment",
        role=role.name,
        policy_arn=custom_policy.arn
    )

    return role

def create_eventbridge_role(name: str, environment: str, target_arns: List[str]) -> aws.iam.Role:
    """
    Creates an IAM role for EventBridge to invoke targets
    """

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    })

    role = aws.iam.Role(
        name,
        name=f"{name}-{environment}",
        assume_role_policy=assume_role_policy
    )

    # Policy to invoke Lambda functions
    invoke_policy = aws.iam.Policy(
        f"{name}-invoke-policy",
        name=f"{name}-invoke-{environment}",
        policy=pulumi.Output.all(*target_arns).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": "lambda:InvokeFunction",
                        "Resource": [arn for arn in arns if "lambda" in arn]
                    }
                ]
            })
        )
    )

    aws.iam.RolePolicyAttachment(
        f"{name}-invoke-attachment",
        role=role.name,
        policy_arn=invoke_policy.arn
    )

    return role
```

## Lambda Function Example (`lambdas/shipment_processor.py`)

```python
"""
Shipment processor Lambda function
Processes shipment creation and update events
"""

import json
import os
import boto3
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
EVENTS_TABLE = os.environ['EVENTS_TABLE']
ERROR_TABLE = os.environ['ERROR_TABLE']
SNS_TOPIC = os.environ.get('SNS_TOPIC')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

# DynamoDB tables
events_table = dynamodb.Table(EVENTS_TABLE)
error_table = dynamodb.Table(ERROR_TABLE)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing shipment events
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")

        # Extract event details
        detail = event.get('detail', {})
        shipment_id = detail.get('shipment_id')
        status = detail.get('status', 'pending')
        metadata = detail.get('metadata', {})

        if not shipment_id:
            raise ValueError("Missing shipment_id in event")

        # Generate event ID and timestamp
        event_id = str(uuid.uuid4())
        timestamp = int(datetime.utcnow().timestamp())

        # Process the shipment event
        process_result = process_shipment(
            event_id=event_id,
            shipment_id=shipment_id,
            status=status,
            metadata=metadata,
            timestamp=timestamp
        )

        # Store event in DynamoDB
        store_event(
            event_id=event_id,
            shipment_id=shipment_id,
            status=status,
            metadata=metadata,
            timestamp=timestamp,
            process_result=process_result
        )

        # Send notification for important status changes
        if status in ['delivered', 'failed', 'cancelled']:
            send_notification(shipment_id, status, metadata)

        logger.info(f"Successfully processed shipment {shipment_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'event_id': event_id,
                'shipment_id': shipment_id,
                'status': 'processed'
            })
        }

    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)

        # Store error in error table
        store_error(event, str(e))

        # Re-raise to trigger retry or DLQ
        raise

def process_shipment(event_id: str, shipment_id: str, status: str,
                    metadata: Dict, timestamp: int) -> Dict[str, Any]:
    """
    Business logic for processing shipment updates
    """
    result = {
        'processed_at': timestamp,
        'validations': []
    }

    # Validate shipment status transition
    if status in ['in_transit', 'delivered']:
        result['validations'].append('status_valid')

    # Check for required metadata
    required_fields = ['origin', 'destination', 'carrier']
    for field in required_fields:
        if field in metadata:
            result['validations'].append(f'{field}_present')

    # Calculate estimated delivery if in transit
    if status == 'in_transit' and 'estimated_days' in metadata:
        estimated_delivery = datetime.utcnow() + timedelta(
            days=metadata['estimated_days']
        )
        result['estimated_delivery'] = estimated_delivery.isoformat()

    return result

def store_event(event_id: str, shipment_id: str, status: str,
                metadata: Dict, timestamp: int, process_result: Dict) -> None:
    """
    Store processed event in DynamoDB
    """
    try:
        events_table.put_item(
            Item={
                'event_id': event_id,
                'timestamp': timestamp,
                'shipment_id': shipment_id,
                'status': status,
                'metadata': metadata,
                'process_result': process_result,
                'environment': ENVIRONMENT,
                'ttl': timestamp + (90 * 24 * 3600)  # 90 days TTL
            }
        )
    except Exception as e:
        logger.error(f"Failed to store event: {str(e)}")
        raise

def store_error(event: Dict, error_message: str) -> None:
    """
    Store error event for analysis
    """
    try:
        error_table.put_item(
            Item={
                'error_id': str(uuid.uuid4()),
                'timestamp': int(datetime.utcnow().timestamp()),
                'event': event,
                'error_message': error_message,
                'environment': ENVIRONMENT,
                'ttl': int(datetime.utcnow().timestamp()) + (30 * 24 * 3600)  # 30 days
            }
        )
    except Exception as e:
        logger.error(f"Failed to store error: {str(e)}")

def send_notification(shipment_id: str, status: str, metadata: Dict) -> None:
    """
    Send SNS notification for important status changes
    """
    if not SNS_TOPIC:
        return

    try:
        message = {
            'shipment_id': shipment_id,
            'status': status,
            'metadata': metadata,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT
        }

        sns.publish(
            TopicArn=SNS_TOPIC,
            Subject=f'Shipment {status.upper()}: {shipment_id}',
            Message=json.dumps(message, indent=2)
        )

        logger.info(f"Notification sent for shipment {shipment_id}")

    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
```

## Configuration Files

### `Pulumi.yaml`

```yaml
name: logistics-event-processor
runtime: python
description: Event-driven logistics application for processing shipment updates
```

### `Pulumi.dev.yaml`

```yaml
config:
  logistics-event-processor:environment: dev
  logistics-event-processor:log_retention_days: 7
  logistics-event-processor:alert_email: devops@example.com
  logistics-event-processor:enable_xray: false
```

### `requirements.txt`

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
```

## Deployment Instructions

1. **Initialize the Pulumi stack:**

```bash
pulumi stack init dev
```

2. **Configure AWS credentials:**

```bash
export AWS_PROFILE=your-profile
# or
aws configure
```

3. **Set configuration values:**

```bash
pulumi config set alert_email your-email@example.com
pulumi config set environment dev
pulumi config set log_retention_days 7
```

4. **Deploy the infrastructure:**

```bash
pulumi up
```

## Key Features Implemented

### 1. **Scalability & Performance**

- Serverless architecture automatically scales with load
- DynamoDB with on-demand billing handles variable traffic
- Lambda concurrency limits prevent runaway costs
- Event replay capability via EventBridge archive

### 2. **Reliability & Error Handling**

- Dead letter queues for failed events
- Retry policies on EventBridge rules
- Error tracking in dedicated DynamoDB table
- CloudWatch alarms for proactive monitoring

### 3. **Security**

- Least-privilege IAM roles
- Encryption at rest for DynamoDB and SNS
- KMS key usage for sensitive data
- Environment-based resource isolation

### 4. **Observability**

- CloudWatch Logs with configurable retention
- Custom metrics and alarms
- Comprehensive dashboard
- X-Ray tracing support (optional)

### 5. **Cost Optimization**

- Pay-per-request DynamoDB billing
- Reserved concurrent executions for Lambda
- TTL on error records to auto-delete old data
- Minimal Lambda memory allocation where appropriate

## Testing the System

Send a test event to EventBridge:

```python
import boto3
import json
from datetime import datetime

client = boto3.client('events')

response = client.put_events(
    Entries=[
        {
            'Source': 'logistics.shipment',
            'DetailType': 'Shipment Created',
            'Detail': json.dumps({
                'shipment_id': 'SHIP-123456',
                'status': 'pending',
                'metadata': {
                    'origin': 'New York',
                    'destination': 'Los Angeles',
                    'carrier': 'FastShip',
                    'estimated_days': 3
                }
            }),
            'EventBusName': 'logistics-events-dev'
        }
    ]
)
```

This architecture provides a robust, scalable, and maintainable solution for processing shipment events with comprehensive monitoring and error handling capabilities.
