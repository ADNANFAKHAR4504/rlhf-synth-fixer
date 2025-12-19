### 1. main.py

```python
"""
Main entry point for deploying the financial trading platform infrastructure.
"""

import pulumi
import regions
from event_bus import create_event_buses
from lambda_functions import create_lambda_functions
from dynamodb import create_dynamodb_tables
from monitoring import create_monitoring
from iam import create_iam_roles

# Configuration
config = pulumi.Config()
app_name = config.get("app_name") or "financial-trading-platform"
environment = config.get("environment") or "prod"

# Define regions for deployment
primary_region = regions.PRIMARY_REGION
secondary_region = regions.SECONDARY_REGION

# Create IAM roles (these will be passed to other resources)
lambda_role, eventbridge_role = create_iam_roles(app_name, environment)

# Create DynamoDB Global Tables
transactions_table = create_dynamodb_tables(app_name, environment, [primary_region, secondary_region])

# Create Lambda functions for processing events
lambda_functions = create_lambda_functions(
    app_name,
    environment,
    lambda_role,
    transactions_table,
    [primary_region, secondary_region]
)

# Create EventBridge event buses and rules
event_buses = create_event_buses(
    app_name,
    environment,
    eventbridge_role,
    lambda_functions,
    [primary_region, secondary_region]
)

# Set up monitoring and alerting
monitoring = create_monitoring(
    app_name,
    environment,
    lambda_functions,
    transactions_table,
    event_buses,
    [primary_region, secondary_region]
)

# Export important resources
pulumi.export("primary_region", primary_region)
pulumi.export("secondary_region", secondary_region)
pulumi.export("primary_event_bus_arn", event_buses[primary_region].event_bus_arn)
pulumi.export("secondary_event_bus_arn", event_buses[secondary_region].event_bus_arn)
pulumi.export("transactions_table_name", transactions_table.name)
pulumi.export("lambda_function_names", {region: fn.name for region, fn in lambda_functions.items()})
```

### 2. regions.py

```python
"""
Region configuration for multi-region deployment.
"""

# Define regions
PRIMARY_REGION = "us-east-1"
SECONDARY_REGION = "us-west-2"

# AWS provider configurations for each region
def get_provider(region):
    """
    Get the AWS provider for a specific region.
    """
    import pulumi_aws as aws

    if region == PRIMARY_REGION:
        return aws
    else:
        return aws.Provider(f"aws-{region}", region=region)
```

### 3. event_bus.py

```python
"""
EventBridge event buses and rules for routing trading events.
"""

import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_event_buses(app_name, environment, eventbridge_role, lambda_functions, regions):
    """
    Create EventBridge event buses and rules in multiple regions.
    """
    event_buses = {}

    for region in regions:
        provider = get_provider(region)

        # Create an event bus for trading events in each region
        event_bus = aws.cloudwatch.EventBus(
            f"{app_name}-event-bus-{region}",
            name=f"{app_name}-{environment}-bus",
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Create a rule for order creation events
        order_created_rule = aws.cloudwatch.EventRule(
            f"{app_name}-order-created-rule-{region}",
            name=f"{app_name}-{environment}-order-created",
            description="Rule for order creation events",
            event_bus_name=event_bus.name,
            event_pattern="""
            {
                "source": ["com.financial-trading-platform"],
                "detail-type": ["OrderCreated"]
            }
            """,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Create a rule for trade execution events
        trade_executed_rule = aws.cloudwatch.EventRule(
            f"{app_name}-trade-executed-rule-{region}",
            name=f"{app_name}-{environment}-trade-executed",
            description="Rule for trade execution events",
            event_bus_name=event_bus.name,
            event_pattern="""
            {
                "source": ["com.financial-trading-platform"],
                "detail-type": ["TradeExecuted"]
            }
            """,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Connect rules to Lambda targets
        order_target = aws.cloudwatch.EventTarget(
            f"{app_name}-order-target-{region}",
            rule=order_created_rule.name,
            arn=lambda_functions[region]["order_processor"].arn,
            event_bus_name=event_bus.name,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        trade_target = aws.cloudwatch.EventTarget(
            f"{app_name}-trade-target-{region}",
            rule=trade_executed_rule.name,
            arn=lambda_functions[region]["trade_processor"].arn,
            event_bus_name=event_bus.name,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Allow EventBridge to invoke Lambda functions
        order_lambda_permission = aws.lambda_.Permission(
            f"order-lambda-permission-{region}",
            action="lambda:InvokeFunction",
            function=lambda_functions[region]["order_processor"].name,
            principal="events.amazonaws.com",
            source_arn=order_created_rule.arn,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        trade_lambda_permission = aws.lambda_.Permission(
            f"trade-lambda-permission-{region}",
            action="lambda:InvokeFunction",
            function=lambda_functions[region]["trade_processor"].name,
            principal="events.amazonaws.com",
            source_arn=trade_executed_rule.arn,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Store resources for each region
        event_buses[region] = {
            "event_bus": event_bus,
            "order_created_rule": order_created_rule,
            "trade_executed_rule": trade_executed_rule,
            "order_target": order_target,
            "trade_target": trade_target,
            "order_lambda_permission": order_lambda_permission,
            "trade_lambda_permission": trade_lambda_permission,
        }

    return event_buses
```

### 4. lambda_functions.py

```python
"""
Lambda functions for processing trading events.
"""

import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_lambda_functions(app_name, environment, lambda_role, transactions_table, regions):
    """
    Create Lambda functions for processing trading events in multiple regions.
    """
    lambda_functions = {}

    for region in regions:
        provider = get_provider(region)

        # Common environment variables for Lambda functions
        lambda_env_vars = {
            "ENVIRONMENT": environment,
            "REGION": region,
            "TRANSACTIONS_TABLE": transactions_table.name,
        }

        # Order processor Lambda
        order_processor = aws.lambda_.Function(
            f"{app_name}-order-processor-{region}",
            name=f"{app_name}-{environment}-order-processor",
            runtime="python3.9",
            handler="order_processor.handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=lambda_env_vars
            ),
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda/order_processor")
            }),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Trade processor Lambda
        trade_processor = aws.lambda_.Function(
            f"{app_name}-trade-processor-{region}",
            name=f"{app_name}-{environment}-trade-processor",
            runtime="python3.9",
            handler="trade_processor.handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=lambda_env_vars
            ),
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda/trade_processor")
            }),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Dead letter queue for failed Lambda invocations
        dlq = aws.sqs.Queue(
            f"{app_name}-lambda-dlq-{region}",
            name=f"{app_name}-{environment}-lambda-dlq",
            message_retention_seconds=1209600,  # 14 days
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Configure Lambda DLQ
        order_processor_event_invoke_config = aws.lambda_.EventInvokeConfig(
            f"order-processor-event-invoke-config-{region}",
            function_name=order_processor.name,
            qualifier="$LATEST",
            maximum_event_age_in_seconds=60 * 60,  # 1 hour
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.EventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.EventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn,
                )
            ),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        trade_processor_event_invoke_config = aws.lambda_.EventInvokeConfig(
            f"trade-processor-event-invoke-config-{region}",
            function_name=trade_processor.name,
            qualifier="$LATEST",
            maximum_event_age_in_seconds=60 * 60,  # 1 hour
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.EventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.EventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn,
                )
            ),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Store resources for each region
        lambda_functions[region] = {
            "order_processor": order_processor,
            "trade_processor": trade_processor,
            "dlq": dlq,
            "order_processor_event_invoke_config": order_processor_event_invoke_config,
            "trade_processor_event_invoke_config": trade_processor_event_invoke_config,
        }

    return lambda_functions
```

### 5. dynamodb.py

```python
"""
DynamoDB Global Tables for transaction consistency across regions.
"""

import pulumi
import pulumi_aws as aws
from regions import get_provider, PRIMARY_REGION

def create_dynamodb_tables(app_name, environment, regions):
    """
    Create DynamoDB Global Tables for transactions across multiple regions.
    """
    # Use the primary region provider for the global table
    provider = get_provider(PRIMARY_REGION)

    # Create the base DynamoDB table in the primary region
    transactions_table = aws.dynamodb.Table(
        f"{app_name}-transactions-table",
        name=f"{app_name}-{environment}-transactions",
        billing_mode="PAY_PER_REQUEST",
        hash_key="transaction_id",
        range_key="timestamp",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="transaction_id",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="timestamp",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="order_id",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="trade_id",
                type="S",
            ),
        ],
        global_secondary_indexes=[
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="OrderIdIndex",
                hash_key="order_id",
                projection_type="ALL",
            ),
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="TradeIdIndex",
                hash_key="trade_id",
                projection_type="ALL",
            ),
        ],
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,
        ),
        stream_enabled=True,
        stream_view_type="NEW_AND_OLD_IMAGES",
        replica=[
            aws.dynamodb.TableReplicaArgs(
                region_name=region
            ) for region in regions if region != PRIMARY_REGION
        ],
    )

    return transactions_table
```

### 6. monitoring.py

```python
"""
CloudWatch alarms and monitoring for the trading platform.
"""

import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_monitoring(app_name, environment, lambda_functions, transactions_table, event_buses, regions):
    """
    Create CloudWatch alarms and dashboards for monitoring the trading platform.
    """
    monitoring_resources = {}

    for region in regions:
        provider = get_provider(region)
        region_resources = {}

        # Lambda function error rate alarms
        for function_name, function in lambda_functions[region].items():
            if function_name in ["order_processor", "trade_processor"]:
                lambda_error_alarm = aws.cloudwatch.MetricAlarm(
                    f"{app_name}-{function_name}-errors-{region}",
                    alarm_name=f"{app_name}-{environment}-{function_name}-errors-{region}",
                    comparison_operator="GreaterThanThreshold",
                    evaluation_periods=1,
                    metric_name="Errors",
                    namespace="AWS/Lambda",
                    period=60,
                    statistic="Sum",
                    threshold=1,
                    alarm_description=f"Alarm when {function_name} errors exceed threshold",
                    dimensions={
                        "FunctionName": function.name,
                    },
                    treat_missing_data="notBreaching",
                    opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
                )

                lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
                    f"{app_name}-{function_name}-throttles-{region}",
                    alarm_name=f"{app_name}-{environment}-{function_name}-throttles-{region}",
                    comparison_operator="GreaterThanThreshold",
                    evaluation_periods=1,
                    metric_name="Throttles",
                    namespace="AWS/Lambda",
                    period=60,
                    statistic="Sum",
                    threshold=1,
                    alarm_description=f"Alarm when {function_name} throttles exceed threshold",
                    dimensions={
                        "FunctionName": function.name,
                    },
                    treat_missing_data="notBreaching",
                    opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
                )

                region_resources[f"{function_name}_error_alarm"] = lambda_error_alarm
                region_resources[f"{function_name}_throttle_alarm"] = lambda_throttle_alarm

        # DynamoDB read/write capacity alarms
        dynamodb_read_alarm = aws.cloudwatch.MetricAlarm(
            f"{app_name}-dynamodb-read-throttle-{region}",
            alarm_name=f"{app_name}-{environment}-dynamodb-read-throttle-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alarm when DynamoDB read throttle events occur",
            dimensions={
                "TableName": transactions_table.name,
            },
            treat_missing_data="notBreaching",
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        dynamodb_write_alarm = aws.cloudwatch.MetricAlarm(
            f"{app_name}-dynamodb-write-throttle-{region}",
            alarm_name=f"{app_name}-{environment}-dynamodb-write-throttle-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alarm when DynamoDB write throttle events occur",
            dimensions={
                "TableName": transactions_table.name,
            },
            treat_missing_data="notBreaching",
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        region_resources["dynamodb_read_alarm"] = dynamodb_read_alarm
        region_resources["dynamodb_write_alarm"] = dynamodb_write_alarm

        # EventBridge failed invocations alarm
        event_bridge_failed_invocations_alarm = aws.cloudwatch.MetricAlarm(
            f"{app_name}-eventbridge-failed-invocations-{region}",
            alarm_name=f"{app_name}-{environment}-eventbridge-failed-invocations-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="FailedInvocations",
            namespace="AWS/Events",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alarm when EventBridge fails to invoke targets",
            dimensions={
                "EventBusName": event_buses[region]["event_bus"].name,
            },
            treat_missing_data="notBreaching",
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        region_resources["event_bridge_failed_invocations_alarm"] = event_bridge_failed_invocations_alarm

        # Create a CloudWatch Dashboard for each region
        dashboard = aws.cloudwatch.Dashboard(
            f"{app_name}-dashboard-{region}",
            dashboard_name=f"{app_name}-{environment}-dashboard-{region}",
            dashboard_body=pulumi.Output.all(
                transactions_table.name,
                lambda_functions[region]["order_processor"].name,
                lambda_functions[region]["trade_processor"].name,
                event_buses[region]["event_bus"].name,
            ).apply(lambda args: f"""{{
                "widgets": [
                    {{
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", "{args[1]}"],
                                ["AWS/Lambda", "Errors", "FunctionName", "{args[1]}"],
                                ["AWS/Lambda", "Duration", "FunctionName", "{args[1]}"],
                                ["AWS/Lambda", "Throttles", "FunctionName", "{args[1]}"]
                            ],
                            "region": "{region}",
                            "title": "Order Processor Metrics",
                            "view": "timeSeries",
                            "stacked": false
                        }}
                    }},
                    {{
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", "{args[2]}"],
                                ["AWS/Lambda", "Errors", "FunctionName", "{args[2]}"],
                                ["AWS/Lambda", "Duration", "FunctionName", "{args[2]}"],
                                ["AWS/Lambda", "Throttles", "FunctionName", "{args[2]}"]
                            ],
                            "region": "{region}",
                            "title": "Trade Processor Metrics",
                            "view": "timeSeries",
                            "stacked": false
                        }}
                    }},
                    {{
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "{args[0]}"]
                            ],
                            "region": "{region}",
                            "title": "DynamoDB Metrics",
                            "view": "timeSeries",
                            "stacked": false
                        }}
                    }},
                    {{
                        "type": "metric",
                        "x": 12,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/Events", "Invocations", "EventBusName", "{args[3]}"],
                                ["AWS/Events", "FailedInvocations", "EventBusName", "{args[3]}"],
                                ["AWS/Events", "TriggeredRules", "EventBusName", "{args[3]}"],
                                ["AWS/Events", "MatchedEvents", "EventBusName", "{args[3]}"]
                            ],
                            "region": "{region}",
                            "title": "EventBridge Metrics",
                            "view": "timeSeries",
                            "stacked": false
                        }}
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        region_resources["dashboard"] = dashboard
        monitoring_resources[region] = region_resources

    return monitoring_resources
```

### 7. iam.py

```python
"""
IAM roles and policies for the trading platform.
"""

import pulumi
import pulumi_aws as aws

def create_iam_roles(app_name, environment):
    """
    Create IAM roles for Lambda functions and EventBridge with least privilege.
    """
    # Create IAM role for Lambda functions
    lambda_role = aws.iam.Role(
        f"{app_name}-lambda-role",
        name=f"{app_name}-{environment}-lambda-role",
        assume_role_policy="""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
        """
    )

    # Create Lambda execution policy
    lambda_policy = aws.iam.Policy(
        f"{app_name}-lambda-policy",
        name=f"{app_name}-{environment}-lambda-policy",
        policy=pulumi.Output.all(aws.get_caller_identity().account_id).apply(
            lambda args: f"""
            {{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:{args[0]}:log-group:/aws/lambda/{app_name}-{environment}-*:*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*",
                            "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*/index/*"
                        ]
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": "arn:aws:sqs:*:{args[0]}:{app_name}-{environment}-lambda-dlq"
                    }}
                ]
            }}
            """
        )
    )

    # Attach policy to Lambda role
    lambda_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{app_name}-lambda-policy-attachment",
        role=lambda_role.name,
        policy_arn=lambda_policy.arn
    )

    # Create IAM role for EventBridge
    eventbridge_role = aws.iam.Role(
        f"{app_name}-eventbridge-role",
        name=f"{app_name}-{environment}-eventbridge-role",
        assume_role_policy="""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                }
            }]
        }
        """
    )

    # Create EventBridge policy
    eventbridge_policy = aws.iam.Policy(
        f"{app_name}-eventbridge-policy",
        name=f"{app_name}-{environment}-eventbridge-policy",
        policy=pulumi.Output.all(aws.get_caller_identity().account_id).apply(
            lambda args: f"""
            {{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": "arn:aws:lambda:*:{args[0]}:function:{app_name}-{environment}-*"
                    }}
                ]
            }}
            """
        )
    )

    # Attach policy to EventBridge role
    eventbridge_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{app_name}-eventbridge-policy-attachment",
        role=eventbridge_role.name,
        policy_arn=eventbridge_policy.arn
    )

    return lambda_role, eventbridge_role
```

### 8. Lambda function implementation examples

Here are examples of the Lambda function code that would be stored in the `./lambda/order_processor` and `./lambda/trade_processor` directories:

#### order_processor.py

```python
import json
import os
import boto3
import uuid
import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTIONS_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes order creation events and stores them in DynamoDB.
    """
    logger.info(f"Processing order event: {json.dumps(event)}")

    try:
        # Extract order details from the event
        detail = event.get('detail', {})
        order_id = detail.get('orderId', str(uuid.uuid4()))

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()

        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'order_id': order_id,
            'trade_id': 'N/A',  # Not applicable for orders
            'event_type': 'OrderCreated',
            'details': json.dumps(detail),
            'status': 'PENDING',
            'region': os.environ['REGION']
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        logger.info(f"Successfully processed order {order_id}, created transaction {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order processed successfully',
                'transactionId': transaction_id,
                'orderId': order_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing order event: {str(e)}")
        # For critical financial systems, we should never lose events
        raise
```

#### trade_processor.py

```python
import json
import os
import boto3
import uuid
import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTIONS_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes trade execution events and stores them in DynamoDB.
    """
    logger.info(f"Processing trade event: {json.dumps(event)}")

    try:
        # Extract trade details from the event
        detail = event.get('detail', {})
        trade_id = detail.get('tradeId', str(uuid.uuid4()))
        order_id = detail.get('orderId', 'N/A')

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()

        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'order_id': order_id,
            'trade_id': trade_id,
            'event_type': 'TradeExecuted',
            'details': json.dumps(detail),
            'status': 'COMPLETED',
            'region': os.environ['REGION']
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        logger.info(f"Successfully processed trade {trade_id}, created transaction {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Trade processed successfully',
                'transactionId': transaction_id,
                'tradeId': trade_id,
                'orderId': order_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing trade event: {str(e)}")
        # For critical financial systems, we should never lose events
        raise
```

## Implementation Details

### main.py

```python
"""
Main entry point for deploying the financial trading platform infrastructure.
"""
import pulumi
import regions
from event_bus import create_event_buses
from lambda_functions import create_lambda_functions
from dynamodb import create_dynamodb_tables
from monitoring import create_monitoring
from iam import create_iam_roles

# Configuration
config = pulumi.Config()
app_name = config.get("app_name") or "financial-trading-platform"
environment = config.get("environment") or "prod"

# Define regions for deployment
primary_region = regions.PRIMARY_REGION
secondary_region = regions.SECONDARY_REGION

# Create IAM roles
lambda_role, eventbridge_role = create_iam_roles(app_name, environment)

# Create DynamoDB Global Tables
transactions_table = create_dynamodb_tables(app_name, environment, [primary_region, secondary_region])

# Create Lambda functions for processing events
lambda_functions = create_lambda_functions(
    app_name,
    environment,
    lambda_role,
    transactions_table,
    [primary_region, secondary_region]
)

# Create EventBridge event buses and rules
event_buses = create_event_buses(
    app_name,
    environment,
    eventbridge_role,
    lambda_functions,
    [primary_region, secondary_region]
)

# Set up monitoring and alerting
monitoring = create_monitoring(
    app_name,
    environment,
    lambda_functions,
    transactions_table,
    event_buses,
    [primary_region, secondary_region]
)

# Export important resources
pulumi.export("primary_region", primary_region)
pulumi.export("secondary_region", secondary_region)
pulumi.export("primary_event_bus_arn", event_buses[primary_region]["event_bus"].arn)
pulumi.export("secondary_event_bus_arn", event_buses[secondary_region]["event_bus"].arn)
pulumi.export("transactions_table_name", transactions_table.name)
```

### regions.py

```python
"""
Region configuration for multi-region deployment.
"""
import pulumi_aws as aws

# Define regions
PRIMARY_REGION = "us-east-1"
SECONDARY_REGION = "us-west-2"

# AWS provider configurations for each region
def get_provider(region):
    """Get the AWS provider for a specific region."""
    if region == PRIMARY_REGION:
        return aws
    else:
        return aws.Provider(f"aws-{region}", region=region)
```

### dynamodb.py

```python
"""
DynamoDB Global Tables for transaction consistency across regions.
"""
import pulumi
import pulumi_aws as aws
from regions import get_provider, PRIMARY_REGION

def create_dynamodb_tables(app_name, environment, regions):
    """Create DynamoDB Global Tables for transactions across multiple regions."""
    # Use the primary region provider for the global table
    provider = get_provider(PRIMARY_REGION)

    # Create the base DynamoDB table with global table configuration
    transactions_table = aws.dynamodb.Table(
        f"{app_name}-transactions-table",
        name=f"{app_name}-{environment}-transactions",
        billing_mode="PAY_PER_REQUEST",
        hash_key="transaction_id",
        range_key="timestamp",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="transaction_id",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="timestamp",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="order_id",
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name="trade_id",
                type="S",
            ),
        ],
        global_secondary_indexes=[
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="OrderIdIndex",
                hash_key="order_id",
                projection_type="ALL",
            ),
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="TradeIdIndex",
                hash_key="trade_id",
                projection_type="ALL",
            ),
        ],
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,
        ),
        stream_enabled=True,
        stream_view_type="NEW_AND_OLD_IMAGES",
        replica=[
            aws.dynamodb.TableReplicaArgs(
                region_name=region
            ) for region in regions if region != PRIMARY_REGION
        ],
    )

    return transactions_table
```

### event_bus.py

```python
"""
EventBridge event buses and rules for routing trading events.
"""
import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_event_buses(app_name, environment, eventbridge_role, lambda_functions, regions):
    """Create EventBridge event buses and rules in multiple regions."""
    event_buses = {}

    for region in regions:
        provider = get_provider(region)

        # Create an event bus for trading events in each region
        event_bus = aws.cloudwatch.EventBus(
            f"{app_name}-event-bus-{region}",
            name=f"{app_name}-{environment}-bus",
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Create a rule for order creation events
        order_created_rule = aws.cloudwatch.EventRule(
            f"{app_name}-order-created-rule-{region}",
            name=f"{app_name}-{environment}-order-created",
            description="Rule for order creation events",
            event_bus_name=event_bus.name,
            event_pattern="""
            {
                "source": ["com.financial-trading-platform"],
                "detail-type": ["OrderCreated"]
            }
            """,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Create a rule for trade execution events
        trade_executed_rule = aws.cloudwatch.EventRule(
            f"{app_name}-trade-executed-rule-{region}",
            name=f"{app_name}-{environment}-trade-executed",
            description="Rule for trade execution events",
            event_bus_name=event_bus.name,
            event_pattern="""
            {
                "source": ["com.financial-trading-platform"],
                "detail-type": ["TradeExecuted"]
            }
            """,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Connect rules to Lambda targets
        order_target = aws.cloudwatch.EventTarget(
            f"{app_name}-order-target-{region}",
            rule=order_created_rule.name,
            arn=lambda_functions[region]["order_processor"].arn,
            event_bus_name=event_bus.name,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        trade_target = aws.cloudwatch.EventTarget(
            f"{app_name}-trade-target-{region}",
            rule=trade_executed_rule.name,
            arn=lambda_functions[region]["trade_processor"].arn,
            event_bus_name=event_bus.name,
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Store resources for each region
        event_buses[region] = {
            "event_bus": event_bus,
            "order_created_rule": order_created_rule,
            "trade_executed_rule": trade_executed_rule,
            "order_target": order_target,
            "trade_target": trade_target,
        }

    return event_buses
```

### lambda_functions.py

```python
"""
Lambda functions for processing trading events.
"""
import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_lambda_functions(app_name, environment, lambda_role, transactions_table, regions):
    """Create Lambda functions for processing trading events in multiple regions."""
    lambda_functions = {}

    for region in regions:
        provider = get_provider(region)

        # Common environment variables for Lambda functions
        lambda_env_vars = {
            "ENVIRONMENT": environment,
            "REGION": region,
            "TRANSACTIONS_TABLE": transactions_table.name,
        }

        # Order processor Lambda
        order_processor = aws.lambda_.Function(
            f"{app_name}-order-processor-{region}",
            name=f"{app_name}-{environment}-order-processor",
            runtime="python3.9",
            handler="order_processor.handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=lambda_env_vars
            ),
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda/order_processor")
            }),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Trade processor Lambda
        trade_processor = aws.lambda_.Function(
            f"{app_name}-trade-processor-{region}",
            name=f"{app_name}-{environment}-trade-processor",
            runtime="python3.9",
            handler="trade_processor.handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=lambda_env_vars
            ),
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda/trade_processor")
            }),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Dead letter queue for failed Lambda invocations
        dlq = aws.sqs.Queue(
            f"{app_name}-lambda-dlq-{region}",
            name=f"{app_name}-{environment}-lambda-dlq",
            message_retention_seconds=1209600,  # 14 days
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Configure DLQ for Lambda functions
        for func_name, func in [("order_processor", order_processor), ("trade_processor", trade_processor)]:
            aws.lambda_.EventInvokeConfig(
                f"{func_name}-event-invoke-config-{region}",
                function_name=func.name,
                qualifier="$LATEST",
                maximum_event_age_in_seconds=60 * 60,  # 1 hour
                maximum_retry_attempts=2,
                destination_config=aws.lambda_.EventInvokeConfigDestinationConfigArgs(
                    on_failure=aws.lambda_.EventInvokeConfigDestinationConfigOnFailureArgs(
                        destination=dlq.arn,
                    )
                ),
                opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
            )

        # Store resources for each region
        lambda_functions[region] = {
            "order_processor": order_processor,
            "trade_processor": trade_processor,
            "dlq": dlq,
        }

    return lambda_functions
```

### iam.py

```python
"""
IAM roles and policies for the trading platform.
"""
import pulumi
import pulumi_aws as aws

def create_iam_roles(app_name, environment):
    """Create IAM roles for Lambda functions and EventBridge with least privilege."""
    # Create IAM role for Lambda functions
    lambda_role = aws.iam.Role(
        f"{app_name}-lambda-role",
        name=f"{app_name}-{environment}-lambda-role",
        assume_role_policy="""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
        """
    )

    # Create Lambda execution policy
    lambda_policy = aws.iam.Policy(
        f"{app_name}-lambda-policy",
        name=f"{app_name}-{environment}-lambda-policy",
        policy=pulumi.Output.all(aws.get_caller_identity().account_id).apply(
            lambda args: f"""
            {{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:{args[0]}:log-group:/aws/lambda/{app_name}-{environment}-*:*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*",
                            "arn:aws:dynamodb:*:{args[0]}:table/{app_name}-{environment}-*/index/*"
                        ]
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": "arn:aws:sqs:*:{args[0]}:{app_name}-{environment}-lambda-dlq"
                    }}
                ]
            }}
            """
        )
    )

    # Attach policy to Lambda role
    aws.iam.RolePolicyAttachment(
        f"{app_name}-lambda-policy-attachment",
        role=lambda_role.name,
        policy_arn=lambda_policy.arn
    )

    # Create IAM role for EventBridge
    eventbridge_role = aws.iam.Role(
        f"{app_name}-eventbridge-role",
        name=f"{app_name}-{environment}-eventbridge-role",
        assume_role_policy="""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                }
            }]
        }
        """
    )

    return lambda_role, eventbridge_role
```

### monitoring.py

```python
"""
CloudWatch alarms and monitoring for the trading platform.
"""
import pulumi
import pulumi_aws as aws
from regions import get_provider

def create_monitoring(app_name, environment, lambda_functions, transactions_table, event_buses, regions):
    """Create CloudWatch alarms and dashboards for monitoring the trading platform."""
    monitoring_resources = {}

    for region in regions:
        provider = get_provider(region)
        region_resources = {}

        # Lambda function error rate alarms
        for func_name in ["order_processor", "trade_processor"]:
            function = lambda_functions[region][func_name]

            # Error alarm
            lambda_error_alarm = aws.cloudwatch.MetricAlarm(
                f"{app_name}-{func_name}-errors-{region}",
                alarm_name=f"{app_name}-{environment}-{func_name}-errors-{region}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=60,
                statistic="Sum",
                threshold=1,
                alarm_description=f"Alarm when {func_name} errors exceed threshold",
                dimensions={
                    "FunctionName": function.name,
                },
                opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
            )

            region_resources[f"{func_name}_error_alarm"] = lambda_error_alarm

        # DynamoDB throttle alarms
        dynamodb_write_alarm = aws.cloudwatch.MetricAlarm(
            f"{app_name}-dynamodb-write-throttle-{region}",
            alarm_name=f"{app_name}-{environment}-dynamodb-write-throttle-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alarm when DynamoDB write throttle events occur",
            dimensions={
                "TableName": transactions_table.name,
            },
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        # Create a CloudWatch Dashboard for this region
        dashboard = aws.cloudwatch.Dashboard(
            f"{app_name}-dashboard-{region}",
            dashboard_name=f"{app_name}-{environment}-dashboard-{region}",
            dashboard_body=pulumi.Output.all(
                transactions_table.name,
                lambda_functions[region]["order_processor"].name,
                lambda_functions[region]["trade_processor"].name,
            ).apply(lambda args: f"""{{
                "widgets": [
                    {{
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", "{args[1]}"],
                                ["AWS/Lambda", "Errors", "FunctionName", "{args[1]}"],
                                ["AWS/Lambda", "Duration", "FunctionName", "{args[1]}"]
                            ],
                            "region": "{region}",
                            "title": "Order Processor Metrics"
                        }}
                    }},
                    {{
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {{
                            "metrics": [
                                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "{args[0]}"],
                                ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "{args[0]}"]
                            ],
                            "region": "{region}",
                            "title": "DynamoDB Metrics"
                        }}
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(provider=provider if region != "us-east-1" else None)
        )

        monitoring_resources[region] = region_resources

    return monitoring_resources
```

## Lambda Function Implementations

### lambda/order_processor/order_processor.py

```python
import json
import os
import boto3
import uuid
import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTIONS_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes order creation events and stores them in DynamoDB.
    """
    logger.info(f"Processing order event: {json.dumps(event)}")

    try:
        # Extract order details from the event
        detail = event.get('detail', {})
        order_id = detail.get('orderId', str(uuid.uuid4()))

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()

        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'order_id': order_id,
            'trade_id': 'N/A',  # Not applicable for orders
            'event_type': 'OrderCreated',
            'details': json.dumps(detail),
            'status': 'PENDING',
            'region': os.environ['REGION']
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        logger.info(f"Successfully processed order {order_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order processed successfully',
                'transactionId': transaction_id,
                'orderId': order_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing order event: {str(e)}")
        # For critical financial systems, we should never lose events
        raise
```

### lambda/trade_processor/trade_processor.py

```python
import json
import os
import boto3
import uuid
import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TRANSACTIONS_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes trade execution events and stores them in DynamoDB.
    """
    logger.info(f"Processing trade event: {json.dumps(event)}")

    try:
        # Extract trade details from the event
        detail = event.get('detail', {})
        trade_id = detail.get('tradeId', str(uuid.uuid4()))
        order_id = detail.get('orderId', 'N/A')

        # Create transaction record
        transaction_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()

        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'order_id': order_id,
            'trade_id': trade_id,
            'event_type': 'TradeExecuted',
            'details': json.dumps(detail),
            'status': 'COMPLETED',
            'region': os.environ['REGION']
        }

        # Store in DynamoDB
        table.put_item(Item=item)

        logger.info(f"Successfully processed trade {trade_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Trade processed successfully',
                'transactionId': transaction_id,
                'tradeId': trade_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing trade event: {str(e)}")
        # For critical financial systems, we should never lose events
        raise
```
