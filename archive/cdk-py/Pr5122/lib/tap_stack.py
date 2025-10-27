"""tap_stack.py
This module defines the TapStack class for an SMS notification system 
for e-commerce order updates. The stack includes SNS for SMS notifications,
Lambda for processing, DynamoDB for delivery logs, CloudWatch for monitoring,
and SES for email fallbacks.
"""

import os
import hashlib
import time
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_sns as sns,
    aws_ses as ses,
    aws_logs as logs,
    aws_iam as iam,
    aws_events as events,
    aws_events_targets as targets,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    SMS Notification System Stack for E-commerce Order Updates.

    This stack creates a complete notification system with:
    - SNS for SMS delivery
    - Lambda functions for order processing and notification logic
    - DynamoDB for delivery tracking and logs
    - SES for email fallback
    - CloudWatch for monitoring and alerting
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create unique suffix using timestamp to avoid resource conflicts
        timestamp = str(int(time.time()))
        unique_suffix = f"{environment_suffix}-{timestamp[-6:]}"

        # DynamoDB table for order notification logs and delivery tracking
        notification_logs_table = dynamodb.Table(
            self,
            "NotificationLogsTable",
            table_name=f"order-notification-logs-{unique_suffix}",
            partition_key=dynamodb.Attribute(
                name="orderId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # Add GSI for tracking by phone number and delivery status
        notification_logs_table.add_global_secondary_index(
            index_name="DeliveryStatusIndex",
            partition_key=dynamodb.Attribute(
                name="deliveryStatus",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            )
        )

        # DynamoDB table for customer preferences and contact info
        customer_preferences_table = dynamodb.Table(
            self,
            "CustomerPreferencesTable",
            table_name=f"customer-preferences-{unique_suffix}",
            partition_key=dynamodb.Attribute(
                name="customerId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # SNS Topic for SMS notifications
        sms_topic = sns.Topic(
            self,
            "OrderUpdatesSMSTopic",
            topic_name=f"order-updates-sms-{unique_suffix}",
            display_name="E-commerce Order Updates SMS"
        )

        # SNS Topic for email notifications (fallback)
        email_topic = sns.Topic(
            self,
            "OrderUpdatesEmailTopic",
            topic_name=f"order-updates-email-{unique_suffix}",
            display_name="E-commerce Order Updates Email"
        )

        # CloudWatch log group for Lambda functions
        lambda_log_group = logs.LogGroup(
            self,
            "NotificationLambdaLogGroup",
            log_group_name=f"/aws/lambda/order-notification-processor-{unique_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )

        # IAM role for notification processor Lambda
        notification_processor_role = iam.Role(
            self,
            "NotificationProcessorRole",
            role_name=f"notification-processor-role-{unique_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for order notification processor Lambda",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant permissions to DynamoDB tables
        notification_logs_table.grant_read_write_data(notification_processor_role)
        customer_preferences_table.grant_read_data(notification_processor_role)

        # Grant permissions to SNS topics
        sms_topic.grant_publish(notification_processor_role)
        email_topic.grant_publish(notification_processor_role)

        # Grant SES permissions for email sending
        notification_processor_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                ],
                resources=["*"]
            )
        )

        # Lambda function for processing order updates and sending notifications
        notification_processor_lambda = lambda_.Function(
            self,
            "NotificationProcessorLambda",
            function_name=f"order-notification-processor-{unique_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            role=notification_processor_role,
            timeout=Duration.minutes(5),
            memory_size=512,
            log_group=lambda_log_group,
            environment={
                "NOTIFICATION_LOGS_TABLE": notification_logs_table.table_name,
                "CUSTOMER_PREFERENCES_TABLE": customer_preferences_table.table_name,
                "SMS_TOPIC_ARN": sms_topic.topic_arn,
                "EMAIL_TOPIC_ARN": email_topic.topic_arn,
                "ENVIRONMENT": environment_suffix,
                "LOG_LEVEL": "INFO"
            },
            code=lambda_.Code.from_inline('''
import json
import logging
import os
import boto3
from datetime import datetime
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")
ses = boto3.client("ses")

# Get table references
notification_logs_table = dynamodb.Table(os.environ["NOTIFICATION_LOGS_TABLE"])
customer_preferences_table = dynamodb.Table(os.environ["CUSTOMER_PREFERENCES_TABLE"])

def lambda_handler(event, context):
    """
    Process order update events and send appropriate notifications.
    
    Expected event format:
    {
        "orderId": "ORDER123",
        "customerId": "CUST456", 
        "orderStatus": "shipped",
        "customerPhone": "+1234567890",
        "customerEmail": "customer@example.com",
        "orderDetails": {...}
    }
    """
    try:
        logger.info(f"Processing notification event: {json.dumps(event)}")
        
        # Extract order information
        order_id = event.get("orderId")
        customer_id = event.get("customerId")
        order_status = event.get("orderStatus")
        customer_phone = event.get("customerPhone")
        customer_email = event.get("customerEmail")
        
        if not all([order_id, customer_id, order_status]):
            raise ValueError("Missing required fields: orderId, customerId, orderStatus")
        
        # Get customer preferences
        preferences = get_customer_preferences(customer_id)
        
        # Create notification message
        message = create_notification_message(order_status, event.get("orderDetails", {}))
        
        # Initialize log entry
        log_entry = {
            "orderId": order_id,
            "timestamp": datetime.utcnow().isoformat(),
            "customerId": customer_id,
            "orderStatus": order_status,
            "message": message
        }
        
        # Determine notification method and send notification
        sms_enabled = preferences.get("smsEnabled", True)
        
        # Debug logging for customer preferences
        logger.info(f"Customer {customer_id} preferences: smsEnabled={sms_enabled}, has_phone={bool(customer_phone)}, has_email={bool(customer_email)}")
        
        # Try SMS first if customer has phone and SMS is enabled
        if customer_phone and sms_enabled:
            try:
                send_sms_notification(customer_phone, message, order_id)
                log_entry["notificationMethod"] = "sms"
                log_entry["deliveryStatus"] = "sent"
                logger.info(f"SMS sent successfully for order {order_id}")
            except Exception as sms_error:
                logger.warning(f"SMS failed for order {order_id}: {str(sms_error)}")
                # Fall back to email
                if customer_email:
                    try:
                        send_email_notification(customer_email, message, order_status, order_id)
                        log_entry["notificationMethod"] = "email_fallback"
                        log_entry["deliveryStatus"] = "sent"
                        logger.info(f"Email fallback sent for order {order_id}")
                    except Exception as email_error:
                        logger.error(f"Email fallback failed for order {order_id}: {str(email_error)}")
                        log_entry["notificationMethod"] = "sms"
                        log_entry["deliveryStatus"] = "failed"
                        log_entry["errorMessage"] = f"SMS failed: {str(sms_error)}, Email failed: {str(email_error)}"
                else:
                    log_entry["notificationMethod"] = "sms"
                    log_entry["deliveryStatus"] = "failed"
                    log_entry["errorMessage"] = f"SMS failed: {str(sms_error)}, No email available"
        elif customer_email:
            # Send email directly if SMS not enabled or not available
            try:
                send_email_notification(customer_email, message, order_status, order_id)
                log_entry["notificationMethod"] = "email"
                log_entry["deliveryStatus"] = "sent"
                logger.info(f"Email sent successfully for order {order_id}")
            except Exception as email_error:
                logger.error(f"Email failed for order {order_id}: {str(email_error)}")
                log_entry["notificationMethod"] = "email"
                log_entry["deliveryStatus"] = "failed"
                log_entry["errorMessage"] = str(email_error)
        else:
            log_entry["notificationMethod"] = "none"
            log_entry["deliveryStatus"] = "failed"
            log_entry["errorMessage"] = "No valid contact method available"
        
        # Save log entry to DynamoDB
        notification_logs_table.put_item(Item=log_entry)
        logger.info(f"Notification log saved for order {order_id}: method={log_entry['notificationMethod']}, status={log_entry['deliveryStatus']}")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "success": True,
                "orderId": order_id,
                "notificationMethod": log_entry["notificationMethod"],
                "deliveryStatus": log_entry["deliveryStatus"]
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing notification: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": str(e)
            })
        }

def get_customer_preferences(customer_id: str) -> Dict[str, Any]:
    """Get customer notification preferences from DynamoDB."""
    try:
        response = customer_preferences_table.get_item(
            Key={"customerId": customer_id}
        )
        preferences = response.get("Item", {})
        logger.info(f"Retrieved preferences for customer {customer_id}: {preferences}")
        return preferences
    except Exception as e:
        logger.warning(f"Could not get preferences for customer {customer_id}: {str(e)}")
        return {}

def create_notification_message(order_status: str, order_details: Dict[str, Any]) -> str:
    """Create appropriate notification message based on order status."""
    status_messages = {
        "confirmed": "Your order has been confirmed and is being processed.",
        "shipped": "Great news! Your order has been shipped and is on its way.",
        "out_for_delivery": "Your order is out for delivery and will arrive soon.",
        "delivered": "Your order has been delivered. Thank you for your business!"
    }
    
    base_message = status_messages.get(order_status, f"Your order status has been updated to: {order_status}")
    
    if order_details.get("trackingNumber"):
        base_message += f" Tracking: {order_details['trackingNumber']}"
    
    return base_message

def send_sms_notification(phone_number: str, message: str, order_id: str):
    """Send SMS notification via SNS."""
    try:
        response = sns.publish(
            TopicArn=os.environ["SMS_TOPIC_ARN"],
            Message=message,
            MessageAttributes={
                "order_id": {
                    "DataType": "String",
                    "StringValue": order_id
                }
            }
        )
        logger.info(f"SMS published to SNS: {response['MessageId']}")
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        raise

def send_email_notification(email: str, message: str, order_status: str, order_id: str):
    """Send email notification via SES."""
    try:
        subject = f"Order Update: {order_status.replace('_', ' ').title()}"
        
        response = ses.send_email(
            Source="noreply@example.com",  # Update with your verified domain
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": message},
                    "Html": {"Data": f"<p>{message}</p><p>Order ID: {order_id}</p>"}
                }
            }
        )
        logger.info(f"Email sent via SES: {response['MessageId']}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise
''')
        )

        # CloudWatch dashboard for monitoring
        dashboard = logs.MetricFilter(
            self,
            "NotificationMetrics",
            log_group=lambda_log_group,
            metric_namespace="OrderNotifications",
            metric_name="ProcessedNotifications",
            filter_pattern=logs.FilterPattern.literal("SMS sent successfully"),
            metric_value="1"
        )

        # EventBridge rule for scheduled monitoring (optional)
        monitoring_rule = events.Rule(
            self,
            "NotificationMonitoringRule",
            rule_name=f"notification-monitoring-{unique_suffix}",
            schedule=events.Schedule.rate(Duration.hours(1)),
            description="Periodic monitoring of notification system health"
        )

        # Outputs for integration
        CfnOutput(
            self,
            "NotificationProcessorLambdaArn",
            value=notification_processor_lambda.function_arn,
            description="ARN of the notification processor Lambda function"
        )

        CfnOutput(
            self,
            "SMSTopicArn",
            value=sms_topic.topic_arn,
            description="ARN of the SMS notification topic"
        )

        CfnOutput(
            self,
            "EmailTopicArn", 
            value=email_topic.topic_arn,
            description="ARN of the email notification topic"
        )

        CfnOutput(
            self,
            "NotificationLogsTableName",
            value=notification_logs_table.table_name,
            description="Name of the notification logs DynamoDB table"
        )

        CfnOutput(
            self,
            "CustomerPreferencesTableName",
            value=customer_preferences_table.table_name,
            description="Name of the customer preferences DynamoDB table"
        )

        CfnOutput(
            self,
            "EnvironmentSuffix",
            value=unique_suffix,
            description="Unique environment suffix used for this deployment"
        )
