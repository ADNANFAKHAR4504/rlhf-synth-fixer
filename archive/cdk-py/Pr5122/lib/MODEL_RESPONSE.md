### Reasoning Trace
---

The user is asking for a comprehensive SMS notification system for an e-commerce platform. Let me break down the requirements:

1. Send SMS to 4,000 daily customers
2. Must be reliable with delivery tracking
3. Cost optimization
4. Integration with existing systems
5. Use specific AWS services: SNS, Lambda, DynamoDB, CloudWatch, SES, IAM

I'll create a CDK Python implementation that includes:
- SNS for SMS notifications
- Lambda functions for processing orders and handling notifications
- DynamoDB for storing notification logs
- CloudWatch for monitoring and metrics
- SES for fallback email notifications
- IAM roles and policies for secure access

The architecture will be:
1. Order event triggers Lambda
2. Lambda sends SMS via SNS
3. Track delivery status in DynamoDB
4. Monitor with CloudWatch
5. Fallback to SES email if SMS fails
6. Cost optimization strategies
### Answer 
---

I'll help you implement a comprehensive SMS notification system for your e-commerce platform using AWS CDK with Python. This solution will handle 4,000 daily customers efficiently while minimizing costs and ensuring reliability.

## Architecture Overview

The system will use:
- **SNS** for SMS delivery
- **Lambda** for order processing and notification handling
- **DynamoDB** for notification logs and delivery tracking
- **CloudWatch** for monitoring and metrics
- **SES** for email fallback
- **IAM** for secure access control

## Complete CDK Implementation

### 1. Project Structure

```
sms-notification-system/
├── app.py
├── requirements.txt
├── cdk.json
├── lambda/
│   ├── order_processor/
│   │   └── handler.py
│   ├── sms_sender/
│   │   └── handler.py
│   ├── delivery_tracker/
│   │   └── handler.py
│   └── email_fallback/
│       └── handler.py
└── stacks/
    └── notification_stack.py
```

### 2. CDK Stack Implementation

```python
# stacks/notification_stack.py

from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_sns as sns,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_events as events,
    aws_events_targets as targets,
    aws_ses as ses,
    aws_sqs as sqs,
    aws_lambda_event_sources as lambda_events,
    CfnOutput
)
from constructs import Construct
import os

class NotificationStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Environment configuration
        environment = os.getenv('ENVIRONMENT', 'dev')
        
        # DynamoDB Tables
        self.create_dynamodb_tables()
        
        # SNS Topic for SMS
        self.create_sns_topics()
        
        # SQS Queues for reliability
        self.create_sqs_queues()
        
        # IAM Roles
        self.create_iam_roles()
        
        # Lambda Functions
        self.create_lambda_functions()
        
        # CloudWatch Alarms and Dashboards
        self.create_monitoring()
        
        # SES Configuration for fallback
        self.setup_ses_fallback()
        
    def create_dynamodb_tables(self):
        """Create DynamoDB tables for notification logs and customer preferences"""
        
        # Notification logs table
        self.notification_logs_table = dynamodb.Table(
            self, "NotificationLogsTable",
            table_name=f"notification-logs-{self.stack_name}",
            partition_key=dynamodb.Attribute(
                name="notification_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            time_to_live_attribute="ttl"
        )
        
        # Add GSI for querying by customer_id
        self.notification_logs_table.add_global_secondary_index(
            index_name="customer-index",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        # Customer preferences table
        self.customer_preferences_table = dynamodb.Table(
            self, "CustomerPreferencesTable",
            table_name=f"customer-preferences-{self.stack_name}",
            partition_key=dynamodb.Attribute(
                name="customer_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )
        
        # Delivery status table
        self.delivery_status_table = dynamodb.Table(
            self, "DeliveryStatusTable",
            table_name=f"delivery-status-{self.stack_name}",
            partition_key=dynamodb.Attribute(
                name="message_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            time_to_live_attribute="ttl"
        )
        
    def create_sns_topics(self):
        """Create SNS topics for SMS notifications"""
        
        # Main SMS topic
        self.sms_topic = sns.Topic(
            self, "SMSTopic",
            topic_name=f"order-updates-sms-{self.stack_name}",
            display_name="Order Update SMS Notifications"
        )
        
        # Add SMS subscription attributes for cost optimization
        self.sms_subscription_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    actions=["SNS:Subscribe", "SNS:Receive"],
                    principals=[iam.ServicePrincipal("lambda.amazonaws.com")],
                    resources=[self.sms_topic.topic_arn]
                )
            ]
        )
        
    def create_sqs_queues(self):
        """Create SQS queues for reliable message processing"""
        
        # Main notification queue
        self.notification_dlq = sqs.Queue(
            self, "NotificationDLQ",
            queue_name=f"notification-dlq-{self.stack_name}",
            retention_period=Duration.days(14)
        )
        
        self.notification_queue = sqs.Queue(
            self, "NotificationQueue",
            queue_name=f"notification-queue-{self.stack_name}",
            visibility_timeout=Duration.minutes(5),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=self.notification_dlq
            ),
            retention_period=Duration.days(7)
        )
        
    def create_iam_roles(self):
        """Create IAM roles for Lambda functions"""
        
        # Base Lambda execution role
        self.lambda_execution_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add permissions for SNS
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "sns:Publish",
                    "sns:SetSMSAttributes",
                    "sns:GetSMSAttributes",
                    "sns:CheckIfPhoneNumberIsOptedOut"
                ],
                resources=["*"]
            )
        )
        
        # Add permissions for DynamoDB
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchWriteItem"
                ],
                resources=[
                    self.notification_logs_table.table_arn,
                    f"{self.notification_logs_table.table_arn}/index/*",
                    self.customer_preferences_table.table_arn,
                    self.delivery_status_table.table_arn
                ]
            )
        )
        
        # Add permissions for SES
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                ],
                resources=["*"]
            )
        )
        
        # Add permissions for CloudWatch
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        )
        
        # Add permissions for SQS
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                ],
                resources=[
                    self.notification_queue.queue_arn,
                    self.notification_dlq.queue_arn
                ]
            )
        )
        
    def create_lambda_functions(self):
        """Create Lambda functions for processing notifications"""
        
        # Environment variables for all Lambda functions
        common_env = {
            "NOTIFICATION_LOGS_TABLE": self.notification_logs_table.table_name,
            "CUSTOMER_PREFERENCES_TABLE": self.customer_preferences_table.table_name,
            "DELIVERY_STATUS_TABLE": self.delivery_status_table.table_name,
            "SMS_TOPIC_ARN": self.sms_topic.topic_arn,
            "NOTIFICATION_QUEUE_URL": self.notification_queue.queue_url,
            "ENVIRONMENT": self.stack_name
        }
        
        # Order Processor Lambda
        self.order_processor_lambda = lambda_.Function(
            self, "OrderProcessorLambda",
            function_name=f"order-processor-{self.stack_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda/order_processor"),
            role=self.lambda_execution_role,
            timeout=Duration.minutes(5),
            memory_size=512,
            environment=common_env,
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=100
        )
        
        # SMS Sender Lambda
        self.sms_sender_lambda = lambda_.Function(
            self, "SMSSenderLambda",
            function_name=f"sms-sender-{self.stack_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda/sms_sender"),
            role=self.lambda_execution_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                **common_env,
                "SMS_SPENDING_LIMIT": "1000",  # Monthly spending limit in USD
                "DEFAULT_SENDER_ID": "ECOMMERCE",
                "SMS_TYPE": "Transactional"  # or "Promotional"
            },
            tracing=lambda_.Tracing.ACTIVE,
            reserved_concurrent_executions=50
        )
        
        # Add SQS trigger to SMS Sender Lambda
        self.sms_sender_lambda.add_event_source(
            lambda_events.SqsEventSource(
                self.notification_queue,
                batch_size=10,
                max_batching_window_in_seconds=5
            )
        )
        
        # Delivery Tracker Lambda
        self.delivery_tracker_lambda = lambda_.Function(
            self, "DeliveryTrackerLambda",
            function_name=f"delivery-tracker-{self.stack_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda/delivery_tracker"),
            role=self.lambda_execution_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment=common_env,
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Email Fallback Lambda
        self.email_fallback_lambda = lambda_.Function(
            self, "EmailFallbackLambda",
            function_name=f"email-fallback-{self.stack_name}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda/email_fallback"),
            role=self.lambda_execution_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                **common_env,
                "FROM_EMAIL": "noreply@yourdomain.com",
                "EMAIL_TEMPLATE": "order-update-template"
            },
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Add DLQ trigger to Email Fallback Lambda
        self.email_fallback_lambda.add_event_source(
            lambda_events.SqsEventSource(
                self.notification_dlq,
                batch_size=10
            )
        )
        
    def create_monitoring(self):
        """Create CloudWatch dashboards and alarms"""
        
        # Create custom metrics namespace
        namespace = f"SMSNotifications/{self.stack_name}"
        
        # Dashboard for monitoring
        dashboard = cloudwatch.Dashboard(
            self, "NotificationDashboard",
            dashboard_name=f"sms-notifications-{self.stack_name}"
        )
        
        # SMS Success Rate Metric
        sms_success_metric = cloudwatch.Metric(
            namespace=namespace,
            metric_name="SMSSuccessRate",
            statistic="Average",
            period=Duration.minutes(5)
        )
        
        # SMS Failure Rate Metric
        sms_failure_metric = cloudwatch.Metric(
            namespace=namespace,
            metric_name="SMSFailureRate",
            statistic="Sum",
            period=Duration.minutes(5)
        )
        
        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SMS Delivery Success Rate",
                left=[sms_success_metric],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="SMS Failures",
                left=[sms_failure_metric],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[self.sms_sender_lambda.metric_invocations()],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Lambda Errors",
                left=[self.sms_sender_lambda.metric_errors()],
                width=12,
                height=6
            ),
            cloudwatch.SingleValueWidget(
                title="Queue Messages",
                metrics=[self.notification_queue.metric_approximate_number_of_messages_visible()],
                width=6,
                height=4
            ),
            cloudwatch.SingleValueWidget(
                title="DLQ Messages",
                metrics=[self.notification_dlq.metric_approximate_number_of_messages_visible()],
                width=6,
                height=4
            )
        )
        
        # Alarms
        cloudwatch.Alarm(
            self, "HighSMSFailureRateAlarm",
            metric=sms_failure_metric,
            threshold=100,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alert when SMS failure rate is high"
        )
        
        cloudwatch.Alarm(
            self, "DLQMessagesAlarm",
            metric=self.notification_dlq.metric_approximate_number_of_messages_visible(),
            threshold=50,
            evaluation_periods=1,
            alarm_description="Alert when messages are in DLQ"
        )
        
        cloudwatch.Alarm(
            self, "LambdaErrorsAlarm",
            metric=self.sms_sender_lambda.metric_errors(),
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alert when Lambda function has errors"
        )
        
    def setup_ses_fallback(self):
        """Setup SES for email fallback"""
        
        # Create SES configuration set for tracking
        ses_config_set = ses.ConfigurationSet(
            self, "SESConfigSet",
            configuration_set_name=f"sms-fallback-{self.stack_name}",
            reputation_tracking=True,
            suppression_reasons=ses.SuppressionReasons.COMPLAINTS_ONLY,
            tls_policy=ses.ConfigurationSetTlsPolicy.REQUIRE
        )
        
        # Output configuration
        CfnOutput(
            self, "SESConfigurationSet",
            value=ses_config_set.configuration_set_name,
            description="SES Configuration Set for email fallback"
        )
```

### 3. Lambda Function Implementations

#### Order Processor Lambda

```python
# lambda/order_processor/handler.py

import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

NOTIFICATION_QUEUE_URL = os.environ['NOTIFICATION_QUEUE_URL']
CUSTOMER_PREFERENCES_TABLE = os.environ['CUSTOMER_PREFERENCES_TABLE']
NOTIFICATION_LOGS_TABLE = os.environ['NOTIFICATION_LOGS_TABLE']

preferences_table = dynamodb.Table(CUSTOMER_PREFERENCES_TABLE)
logs_table = dynamodb.Table(NOTIFICATION_LOGS_TABLE)

def lambda_handler(event, context):
    """
    Process order events and queue notifications
    """
    try:
        # Parse order event
        order = json.loads(event['Records'][0]['body']) if 'Records' in event else event
        
        customer_id = order['customer_id']
        order_id = order['order_id']
        order_status = order['status']
        
        # Get customer preferences
        preferences = get_customer_preferences(customer_id)
        
        if not preferences or not preferences.get('phone_number'):
            print(f"No phone number for customer {customer_id}")
            return handle_missing_contact(order)
        
        # Check notification throttling
        if is_throttled(customer_id):
            print(f"Customer {customer_id} is throttled")
            return {
                'statusCode': 429,
                'body': 'Rate limited'
            }
        
        # Prepare notification message
        notification = {
            'notification_id': str(uuid.uuid4()),
            'customer_id': customer_id,
            'order_id': order_id,
            'phone_number': preferences['phone_number'],
            'email': preferences.get('email'),
            'message': format_message(order),
            'type': 'order_update',
            'status': order_status,
            'timestamp': int(datetime.utcnow().timestamp()),
            'retry_count': 0,
            'priority': get_priority(order)
        }
        
        # Log notification attempt
        log_notification(notification)
        
        # Queue notification for sending
        response = sqs.send_message(
            QueueUrl=NOTIFICATION_QUEUE_URL,
            MessageBody=json.dumps(notification),
            MessageAttributes={
                'priority': {
                    'StringValue': str(notification['priority']),
                    'DataType': 'Number'
                }
            },
            MessageDeduplicationId=f"{order_id}-{order_status}",
            MessageGroupId=customer_id
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'notification_id': notification['notification_id'],
                'message_id': response['MessageId']
            })
        }
        
    except Exception as e:
        print(f"Error processing order: {str(e)}")
        raise

def get_customer_preferences(customer_id):
    """Get customer notification preferences"""
    try:
        response = preferences_table.get_item(
            Key={'customer_id': customer_id}
        )
        return response.get('Item', {})
    except Exception as e:
        print(f"Error getting preferences: {str(e)}")
        return {}

def is_throttled(customer_id):
    """Check if customer has hit rate limits"""
    try:
        # Check notifications sent in last hour
        one_hour_ago = int((datetime.utcnow() - timedelta(hours=1)).timestamp())
        
        response = logs_table.query(
            IndexName='customer-index',
            KeyConditionExpression='customer_id = :cid AND #ts > :time',
            ExpressionAttributeValues={
                ':cid': customer_id,
                ':time': one_hour_ago
            },
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            Select='COUNT'
        )
        
        # Allow max 10 notifications per hour per customer
        return response['Count'] >= 10
        
    except Exception as e:
        print(f"Error checking throttle: {str(e)}")
        return False

def format_message(order):
    """Format SMS message based on order status"""
    templates = {
        'confirmed': "Your order #{order_id} has been confirmed. Track: {tracking_url}",
        'shipped': "Your order #{order_id} has been shipped! Track: {tracking_url}",
        'delivered': "Your order #{order_id} has been delivered. Thank you!",
        'cancelled': "Your order #{order_id} has been cancelled. Refund will be processed."
    }
    
    template = templates.get(order['status'], "Order #{order_id} status: {status}")
    return template.format(
        order_id=order['order_id'][:8],
        status=order['status'],
        tracking_url=f"https://track.example.com/{order['order_id'][:8]}"
    )

def get_priority(order):
    """Determine message priority"""
    high_priority_statuses = ['cancelled', 'refunded', 'failed']
    return 1 if order['status'] in high_priority_statuses else 5

def log_notification(notification):
    """Log notification to DynamoDB"""
    try:
        notification_copy = notification.copy()
        notification_copy['ttl'] = int((datetime.utcnow() + timedelta(days=30)).timestamp())
        
        logs_table.put_item(Item=notification_copy)
    except Exception as e:
        print(f"Error logging notification: {str(e)}")

def handle_missing_contact(order):
    """Handle orders with missing contact information"""
    # Log to CloudWatch for manual review
    print(json.dumps({
        'event': 'missing_contact',
        'order_id': order['order_id'],
        'customer_id': order['customer_id']
    }))
    
    return {
        'statusCode': 400,
        'body': 'Missing contact information'
    }
```

#### SMS Sender Lambda

```python
# lambda/sms_sender/handler.py

import json
import boto3
import os
from datetime import datetime
from typing import Dict, List
import time

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

DELIVERY_STATUS_TABLE = os.environ['DELIVERY_STATUS_TABLE']
NOTIFICATION_LOGS_TABLE = os.environ['NOTIFICATION_LOGS_TABLE']
SMS_TYPE = os.environ.get('SMS_TYPE', 'Transactional')
DEFAULT_SENDER_ID = os.environ.get('DEFAULT_SENDER_ID', 'ECOMMERCE')

status_table = dynamodb.Table(DELIVERY_STATUS_TABLE)
logs_table = dynamodb.Table(NOTIFICATION_LOGS_TABLE)

def lambda_handler(event, context):
    """
    Send SMS notifications via SNS
    """
    results = []
    
    # Set SMS attributes for cost optimization
    set_sms_attributes()
    
    for record in event['Records']:
        try:
            notification = json.loads(record['body'])
            result = send_sms(notification)
            results.append(result)
            
            # Add delay for rate limiting (100 SMS/second limit)
            time.sleep(0.01)
            
        except Exception as e:
            print(f"Error processing record: {str(e)}")
            # Return failure to move message to DLQ after retries
            raise
    
    # Publish metrics to CloudWatch
    publish_metrics(results)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'successful': len([r for r in results if r['success']])
        })
    }

def set_sms_attributes():
    """Configure SMS attributes for cost optimization"""
    try:
        sns.set_sms_attributes(
            attributes={
                'MonthlySpendLimit': os.environ.get('SMS_SPENDING_LIMIT', '1000'),
                'DeliveryStatusIAMRole': os.environ.get('LAMBDA_EXECUTION_ROLE_ARN', ''),
                'DeliveryStatusSuccessSamplingRate': '100',  # Track all deliveries
                'DefaultSenderID': DEFAULT_SENDER_ID,
                'DefaultSMSType': SMS_TYPE,
                'UsageReportS3Bucket': ''  # Set if you want usage reports
            }
        )
    except Exception as e:
        print(f"Error setting SMS attributes: {str(e)}")

def send_sms(notification: Dict) -> Dict:
    """Send individual SMS message"""
    try:
        # Validate phone number
        phone_number = normalize_phone_number(notification['phone_number'])
        
        # Check if phone number is opted out
        if is_opted_out(phone_number):
            return handle_opted_out(notification)
        
        # Send SMS
        response = sns.publish(
            PhoneNumber=phone_number,
            Message=notification['message'][:160],  # SMS limit
            MessageAttributes={
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': DEFAULT_SENDER_ID
                },
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': SMS_TYPE
                }
            }
        )
        
        # Log successful send
        log_delivery_status({
            'message_id': response['MessageId'],
            'notification_id': notification['notification_id'],
            'customer_id': notification['customer_id'],
            'phone_number': phone_number,
            'status': 'sent',
            'timestamp': int(datetime.utcnow().timestamp()),
            'response': response
        })
        
        # Update notification log
        update_notification_status(notification['notification_id'], 'sent')
        
        return {
            'success': True,
            'message_id': response['MessageId'],
            'notification_id': notification['notification_id']
        }
        
    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        
        # Log failure
        log_delivery_status({
            'message_id': f"failed-{notification['notification_id']}",
            'notification_id': notification['notification_id'],
            'customer_id': notification['customer_id'],
            'phone_number': notification.get('phone_number', 'unknown'),
            'status': 'failed',
            'error': str(e),
            'timestamp': int(datetime.utcnow().timestamp())
        })
        
        # Update notification log
        update_notification_status(notification['notification_id'], 'failed', str(e))
        
        return {
            'success': False,
            'notification_id': notification['notification_id'],
            'error': str(e)
        }

def normalize_phone_number(phone: str) -> str:
    """Normalize phone number to E.164 format"""
    # Remove non-numeric characters
    phone = ''.join(filter(str.isdigit, phone))
    
    # Add country code if not present (assuming US)
    if not phone.startswith('1') and len(phone) == 10:
        phone = '1' + phone
    
    # Add + prefix
    if not phone.startswith('+'):
        phone = '+' + phone
    
    return phone

def is_opted_out(phone_number: str) -> bool:
    """Check if phone number has opted out of SMS"""
    try:
        response = sns.check_if_phone_number_is_opted_out(
            phoneNumber=phone_number
        )
        return response['isOptedOut']
    except Exception as e:
        print(f"Error checking opt-out status: {str(e)}")
        return False

def handle_opted_out(notification: Dict) -> Dict:
    """Handle opted-out phone numbers"""
    log_delivery_status({
        'message_id': f"opted-out-{notification['notification_id']}",
        'notification_id': notification['notification_id'],
        'customer_id': notification['customer_id'],
        'phone_number': notification.get('phone_number', 'unknown'),
        'status': 'opted_out',
        'timestamp': int(datetime.utcnow().timestamp())
    })
    
    return {
        'success': False,
        'notification_id': notification['notification_id'],
        'error': 'Phone number opted out'
    }

def log_delivery_status(status: Dict):
    """Log delivery status to DynamoDB"""
    try:
        status['ttl'] = int(datetime.utcnow().timestamp()) + (30 * 24 * 60 * 60)  # 30 days
        status_table.put_item(Item=status)
    except Exception as e:
        print(f"Error logging delivery status: {str(e)}")

def update_notification_status(notification_id: str, status: str, error: str = None):
    """Update notification status in logs table"""
    try:
        update_expr = "SET #status = :status, updated_at = :timestamp"
        expr_values = {
            ':status': status,
            ':timestamp': int(datetime.utcnow().timestamp())
        }
        
        if error:
            update_expr += ", error_message = :error"
            expr_values[':error'] = error
        
        logs_table.update_item(
            Key={'notification_id': notification_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues=expr_values
        )
    except Exception as e:
        print(f"Error updating notification status: {str(e)}")

def publish_metrics(results: List[Dict]):
    """Publish custom metrics to CloudWatch"""
    try:
        namespace = f"SMSNotifications/{os.environ['ENVIRONMENT']}"
        
        successful = len([r for r in results if r['success']])
        failed = len([r for r in results if not r['success']])
        
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': 'SMSSuccessRate',
                    'Value': (successful / len(results) * 100) if results else 0,
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'SMSFailureRate',
                    'Value': failed,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Error publishing metrics: {str(e)}")
```

#### Email Fallback Lambda

```python
# lambda/email_fallback/handler.py

import json
import boto3
import os
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

ses = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')

NOTIFICATION_LOGS_TABLE = os.environ['NOTIFICATION_LOGS_TABLE']
FROM_EMAIL = os.environ['FROM_EMAIL']

logs_table = dynamodb.Table(NOTIFICATION_LOGS_TABLE)

def lambda_handler(event, context):
    """
    Send email notifications as fallback for failed SMS
    """
    for record in event['Records']:
        try:
            notification = json.loads(record['body'])
            
            # Only process if email is available
            if not notification.get('email'):
                print(f"No email for notification {notification['notification_id']}")
                continue
            
            send_email_notification(notification)
            
        except Exception as e:
            print(f"Error processing email fallback: {str(e)}")
            # Don't raise to prevent infinite retries
    
    return {'statusCode': 200}

def send_email_notification(notification):
    """Send email using SES"""
    try:
        # Create HTML and text versions
        html_body = create_html_body(notification)
        text_body = notification['message']
        
        response = ses.send_email(
            Source=FROM_EMAIL,
            Destination={
                'ToAddresses': [notification['email']]
            },
            Message={
                'Subject': {
                    'Data': f"Order Update - {notification['order_id']}"
                },
                'Body': {
                    'Text': {'Data': text_body},
                    'Html': {'Data': html_body}
                }
            },
            ConfigurationSetName=f"sms-fallback-{os.environ['ENVIRONMENT']}"
        )
        
        # Log successful email send
        logs_table.update_item(
            Key={'notification_id': notification['notification_id']},
            UpdateExpression="SET fallback_email = :email, fallback_status = :status",
            ExpressionAttributeValues={
                ':email': response['MessageId'],
                ':status': 'email_sent'
            }
        )
        
        print(f"Email sent: {response['MessageId']}")
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")

def create_html_body(notification):
    """Create HTML email body"""
    return f"""
    <html>
        <body>
            <h2>Order Update</h2>
            <p>{notification['message']}</p>
            <hr>
            <p><small>You received this email because SMS delivery failed. 
            To update your preferences, please visit your account settings.</small></p>
        </body>
    </html>
    """
```

### 4. Main Application

```python
# app.py

#!/usr/bin/env python3
import os
from aws_cdk import App, Environment, Tags
from stacks.notification_stack import NotificationStack

app = App()

# Get environment from context or environment variable
env_name = app.node.try_get_context("environment") or os.getenv("CDK_ENV", "dev")

# Define AWS environment
env = Environment(
    account=os.getenv("CDK_DEFAULT_ACCOUNT"),
    region=os.getenv("CDK_DEFAULT_REGION", "us-east-1")
)

# Create stack
notification_stack = NotificationStack(
    app, 
    f"SMSNotificationStack-{env_name}",
    env=env,
    description="SMS Notification System for E-commerce Platform"
)

# Add tags for cost tracking
Tags.of(notification_stack).add("Environment", env_name)
Tags.of(notification_stack).add("Project", "SMS-Notifications")
Tags.of(notification_stack).add("ManagedBy", "CDK")
Tags.of(notification_stack).add("CostCenter", "Operations")

app.synth()
```

### 5. Requirements and Configuration Files

```txt
# requirements.txt

aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
boto3>=1.26.0
```

```json
// cdk.json

{
  "app": "python3 app.py",
  "context": {
    "@aws-cdk/core:stackRelativePaths": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "environment": "dev"
  }
}
```

### 6. Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Set environment
export CDK_ENV=${1:-dev}
export AWS_REGION=${2:-us-east-1}

# Install dependencies
pip install -r requirements.txt

# Install Lambda dependencies
pip install -t lambda/order_processor boto3
pip install -t lambda/sms_sender boto3
pip install -t lambda/delivery_tracker boto3
pip install -t lambda/email_fallback boto3

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy stack
cdk deploy SMSNotificationStack-${CDK_ENV} \
  --context environment=${CDK_ENV} \
  --require-approval never

# Output stack info
aws cloudformation describe-stacks \
  --stack-name SMSNotificationStack-${CDK_ENV} \
  --query "Stacks[0].Outputs"
```

## Cost Optimization Strategies

1. **SMS Type Configuration**: Use "Promotional" type for non-critical updates (cheaper)
2. **Message Batching**: Process multiple notifications in batches
3. **Spending Limits**: Set monthly spending limits to prevent bill shock
4. **DynamoDB On-Demand**: Pay-per-request pricing for variable workloads
5. **Lambda Reserved Concurrency**: Prevent runaway costs from concurrent executions
6. **TTL on DynamoDB**: Automatically delete old records
7. **SQS Long Polling**: Reduce API calls and costs

## Monitoring and Reliability Features

1. **Dead Letter Queues**: Capture failed messages for retry
2. **CloudWatch Dashboards**: Real-time visibility into system performance
3. **Custom Metrics**: Track business-specific KPIs
4. **X-Ray Tracing**: Debug performance issues
5. **Email Fallback**: Ensure message delivery even if SMS fails
6. **Rate Limiting**: Prevent customer fatigue and reduce costs
7. **Opt-out Handling**: Respect customer preferences

This implementation provides a production-ready SMS notification system that can handle 4,000+ daily customers efficiently while maintaining costs and ensuring reliability through fallback mechanisms and comprehensive monitoring.