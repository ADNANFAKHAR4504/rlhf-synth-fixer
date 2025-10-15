import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface EmailNotificationStackProps extends cdk.StackProps {
  environmentSuffix: string;
  verifiedDomain?: string;
  notificationEmails?: string[];
}

export class EmailNotificationStack extends cdk.Stack {
  public readonly orderEventsTopic: sns.Topic;
  public readonly deliveryTrackingTable: dynamodb.Table;
  public readonly emailProcessorFunction: lambda.Function;
  public readonly feedbackProcessorFunction: lambda.Function;
  public readonly emailQueue: sqs.Queue;
  public readonly emailDeadLetterQueue: sqs.Queue;

  constructor(
    scope: Construct,
    id: string,
    props: EmailNotificationStackProps
  ) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const verifiedDomain = props.verifiedDomain || 'orders@yourcompany.com';
    const notificationEmails = props.notificationEmails || [];

    // Apply standard tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Project', 'EmailNotificationSystem');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // SNS Topic for Order Events
    this.orderEventsTopic = new sns.Topic(this, 'OrderEventsTopic', {
      topicName: `email-order-events-${environmentSuffix}`,
      displayName: 'E-commerce Order Events Topic',
    });

    // SQS Dead Letter Queue for failed email processing
    this.emailDeadLetterQueue = new sqs.Queue(this, 'EmailDeadLetterQueue', {
      queueName: `email-processing-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue for reliable email processing (PROMPT.md requirement)
    this.emailQueue = new sqs.Queue(this, 'EmailQueue', {
      queueName: `email-processing-queue-${environmentSuffix}`,
      deadLetterQueue: {
        queue: this.emailDeadLetterQueue,
        maxReceiveCount: 3, // Retry failed messages 3 times before sending to DLQ
      },
      visibilityTimeout: cdk.Duration.minutes(5), // Give Lambda time to process
      receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
    });

    // Subscribe SQS Queue to SNS Topic (PROMPT.md: Use SQS for reliable message processing)
    this.orderEventsTopic.addSubscription(
      new snsSubscriptions.SqsSubscription(this.emailQueue)
    );

    // DynamoDB Table for Email Delivery Tracking
    this.deliveryTrackingTable = new dynamodb.Table(
      this,
      'DeliveryTrackingTable',
      {
        tableName: `email-delivery-tracking-${environmentSuffix}-temp`,
        partitionKey: { name: 'emailId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        timeToLiveAttribute: 'ttl', // Auto-cleanup after 90 days
      }
    );

    // GSI for querying by order ID
    this.deliveryTrackingTable.addGlobalSecondaryIndex({
      indexName: 'OrderIdIndex',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'EmailProcessorLogGroup', {
      logGroupName: `/aws/lambda/email-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Email Processor Lambda
    const emailProcessorRole = new iam.Role(this, 'EmailProcessorRole', {
      roleName: `email-processor-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant SES permissions
    emailProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:GetSendQuota',
          'ses:GetSendStatistics',
        ],
        resources: ['*'],
      })
    );

    // Grant DynamoDB permissions
    this.deliveryTrackingTable.grantReadWriteData(emailProcessorRole);

    // Email Processor Lambda Function
    this.emailProcessorFunction = new lambda.Function(
      this,
      'EmailProcessorFunction',
      {
        functionName: `email-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.lambda_handler',
        role: emailProcessorRole,
        code: lambda.Code.fromInline(`
import json
import boto3
import uuid
import time
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ses_client = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = '${this.deliveryTrackingTable.tableName}'
VERIFIED_DOMAIN = '${verifiedDomain}'

def lambda_handler(event, context):
    """
    Process order events from SQS and send confirmation emails.
    
    Expected SQS message format (from SNS):
    {
        "orderId": "ORDER123",
        "customerEmail": "customer@example.com",
        "customerName": "John Doe",
        "orderItems": [...],
        "orderTotal": "99.99",
        "orderTimestamp": "2024-01-01T12:00:00Z"
    }
    """
    try:
        # Process each SQS record
        for record in event['Records']:
            # SQS records contain SNS messages in the body
            if 'body' in record:
                # Parse the SQS message body which contains the SNS message
                body = json.loads(record['body'])
                
                # Check if this is an SNS message wrapped in SQS
                if 'Message' in body:
                    # This is an SNS message delivered via SQS
                    message = json.loads(body['Message'])
                else:
                    # Direct SQS message
                    message = body
                
                # Validate required fields
                required_fields = ['orderId', 'customerEmail', 'customerName', 'orderTotal']
                if not all(field in message for field in required_fields):
                    logger.error(f"Missing required fields in message: {message}")
                    continue
                
                # Check for duplicate processing
                if is_duplicate_order(message['orderId']):
                    logger.info(f"Duplicate order detected: {message['orderId']}")
                    continue
                
                # Send confirmation email
                email_id = send_order_confirmation(message)
                
                # Track email delivery
                track_email_delivery(email_id, message)
                
                # Publish metrics
                publish_metrics('EmailSent', 1)
                
        return {
            'statusCode': 200,
            'body': json.dumps('Emails processed successfully')
        }
        
    except Exception as e:
        logger.error(f"Error processing emails: {str(e)}")
        publish_metrics('EmailError', 1)
        raise

def is_duplicate_order(order_id):
    """Check if email has already been sent for this order."""
    table = dynamodb.Table(TABLE_NAME)
    
    try:
        response = table.query(
            IndexName='OrderIdIndex',
            KeyConditionExpression='orderId = :order_id',
            ExpressionAttributeValues={':order_id': order_id}
        )
        return len(response['Items']) > 0
    except Exception as e:
        logger.error(f"Error checking for duplicate: {str(e)}")
        return False

def send_order_confirmation(order_data):
    """Send order confirmation email using SES."""
    email_id = str(uuid.uuid4())
    
    try:
        # Create email content
        subject = f"Order Confirmation - {order_data['orderId']}"
        
        body_text = f"""
        Dear {order_data['customerName']},
        
        Thank you for your order! Your order confirmation details:
        
        Order ID: {order_data['orderId']}
        Total: USD {order_data['orderTotal']}
        Order Date: {order_data.get('orderTimestamp', datetime.utcnow().isoformat())}
        
        Items:
        {format_order_items(order_data.get('orderItems', []))}
        
        We'll send you tracking information once your order ships.
        
        Thank you for your business!
        
        Best regards,
        Your Company Team
        """
        
        body_html = f"""
        <html>
        <head></head>
        <body>
            <h2>Order Confirmation</h2>
            <p>Dear {order_data['customerName']},</p>
            
            <p>Thank you for your order! Your order confirmation details:</p>
            
            <table style="border-collapse: collapse; width: 100%;">
                <tr><td><strong>Order ID:</strong></td><td>{order_data['orderId']}</td></tr>
                <tr><td><strong>Total:</strong></td><td>USD {order_data['orderTotal']}</td></tr>
                <tr><td><strong>Order Date:</strong></td><td>{order_data.get('orderTimestamp', datetime.utcnow().isoformat())}</td></tr>
            </table>
            
            <h3>Items Ordered:</h3>
            {format_order_items_html(order_data.get('orderItems', []))}
            
            <p>We'll send you tracking information once your order ships.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>Your Company Team</p>
        </body>
        </html>
        """
        
        # Send email via SES
        response = ses_client.send_email(
            Source=VERIFIED_DOMAIN,
            Destination={'ToAddresses': [order_data['customerEmail']]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {'Data': body_text, 'Charset': 'UTF-8'},
                    'Html': {'Data': body_html, 'Charset': 'UTF-8'}
                }
            },
            Tags=[
                {'Name': 'EmailType', 'Value': 'OrderConfirmation'},
                {'Name': 'OrderId', 'Value': order_data['orderId']}
            ]
        )
        
        logger.info(f"Email sent successfully. MessageId: {response['MessageId']}")
        return email_id
        
    except ClientError as e:
        logger.error(f"Error sending email: {e.response['Error']['Message']}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending email: {str(e)}")
        raise

def format_order_items(items):
    """Format order items for text email."""
    if not items:
        return "No items listed"
    
    formatted = []
    for item in items:
        formatted.append(f"- {item.get('name', 'Unknown Item')} x{item.get('quantity', 1)} - USD {item.get('price', '0.00')}")
    
    return "\\n".join(formatted)

def format_order_items_html(items):
    """Format order items for HTML email."""
    if not items:
        return "<p>No items listed</p>"
    
    html = "<ul>"
    for item in items:
        html += f"<li>{item.get('name', 'Unknown Item')} x{item.get('quantity', 1)} - USD {item.get('price', '0.00')}</li>"
    html += "</ul>"
    
    return html

def track_email_delivery(email_id, order_data):
    """Store email delivery tracking information."""
    table = dynamodb.Table(TABLE_NAME)
    
    try:
        # Calculate TTL (90 days from now)
        ttl = int((datetime.now() + timedelta(days=90)).timestamp())
        
        table.put_item(
            Item={
                'emailId': email_id,
                'timestamp': datetime.utcnow().isoformat(),
                'orderId': order_data['orderId'],
                'customerEmail': order_data['customerEmail'],
                'status': 'SENT',
                'emailType': 'ORDER_CONFIRMATION',
                'ttl': ttl
            }
        )
        
        logger.info(f"Email tracking recorded for email ID: {email_id}")
        
    except Exception as e:
        logger.error(f"Error tracking email delivery: {str(e)}")
        # Don't raise here - email was sent successfully

def publish_metrics(metric_name, value):
    """Publish custom metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace='EmailNotification',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count'
                }
            ]
        )
    except Exception as e:
        logger.error(f"Error publishing metrics: {str(e)}")
`),
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        environment: {
          TABLE_NAME: this.deliveryTrackingTable.tableName,
          VERIFIED_DOMAIN: verifiedDomain,
        },
        logGroup: logGroup,
      }
    );

    // Subscribe Lambda to SQS Queue (PROMPT.md: SQS for reliable message processing)
    this.emailProcessorFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(this.emailQueue, {
        batchSize: 10, // Process up to 10 messages at once
        maxBatchingWindow: cdk.Duration.seconds(5), // Wait up to 5 seconds to batch messages
      })
    );

    // SES Feedback Processing Lambda for delivery tracking
    const feedbackProcessorRole = new iam.Role(this, 'FeedbackProcessorRole', {
      roleName: `ses-feedback-processor-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    this.deliveryTrackingTable.grantReadWriteData(feedbackProcessorRole);

    this.feedbackProcessorFunction = new lambda.Function(
      this,
      'FeedbackProcessorFunction',
      {
        functionName: `ses-feedback-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.lambda_handler',
        role: feedbackProcessorRole,
        code: lambda.Code.fromInline(`
import json
import boto3
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

TABLE_NAME = '${this.deliveryTrackingTable.tableName}'

def lambda_handler(event, context):
    """Process SES delivery, bounce, and complaint notifications."""
    try:
        for record in event['Records']:
            if record['EventSource'] == 'aws:sns':
                message = json.loads(record['Sns']['Message'])
                
                if message['notificationType'] == 'Delivery':
                    process_delivery(message)
                elif message['notificationType'] == 'Bounce':
                    process_bounce(message)
                elif message['notificationType'] == 'Complaint':
                    process_complaint(message)
                
        return {'statusCode': 200, 'body': 'Feedback processed successfully'}
        
    except Exception as e:
        logger.error(f"Error processing SES feedback: {str(e)}")
        raise

def process_delivery(message):
    """Process successful delivery notification."""
    delivery = message['delivery']
    
    for recipient in delivery['recipients']:
        update_delivery_status(recipient, 'DELIVERED', message)
        publish_metrics('EmailDelivered', 1)

def process_bounce(message):
    """Process bounce notification."""
    bounce = message['bounce']
    
    for recipient in bounce['bouncedRecipients']:
        update_delivery_status(recipient['emailAddress'], 'BOUNCED', message)
        publish_metrics('EmailBounced', 1)
        
        # Check bounce rate and alert if too high
        check_bounce_rate()

def process_complaint(message):
    """Process complaint notification."""
    complaint = message['complaint']
    
    for recipient in complaint['complainedRecipients']:
        update_delivery_status(recipient['emailAddress'], 'COMPLAINED', message)
        publish_metrics('EmailComplaint', 1)

def update_delivery_status(email_address, status, message):
    """Update delivery status in DynamoDB."""
    table = dynamodb.Table(TABLE_NAME)
    
    try:
        # Query for emails sent to this address
        response = table.scan(
            FilterExpression='customerEmail = :email AND #status = :sent_status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':email': email_address,
                ':sent_status': 'SENT'
            }
        )
        
        # Update the most recent email
        if response['Items']:
            latest_item = max(response['Items'], key=lambda x: x['timestamp'])
            
            table.update_item(
                Key={
                    'emailId': latest_item['emailId'],
                    'timestamp': latest_item['timestamp']
                },
                UpdateExpression='SET #status = :status, deliveryTimestamp = :delivery_time',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': status,
                    ':delivery_time': datetime.utcnow().isoformat()
                }
            )
            
    except Exception as e:
        logger.error(f"Error updating delivery status: {str(e)}")

def check_bounce_rate():
    """Check if bounce rate exceeds threshold and alert."""
    try:
        # This is a simplified version - in production, you'd calculate over a time window
        table = dynamodb.Table(TABLE_NAME)
        
        # Get recent emails (last 100)
        response = table.scan(Limit=100)
        items = response['Items']
        
        if len(items) >= 10:  # Only check if we have enough data
            bounced = len([item for item in items if item.get('status') == 'BOUNCED'])
            bounce_rate = (bounced / len(items)) * 100
            
            if bounce_rate > 5:  # Alert if bounce rate > 5%
                publish_metrics('HighBounceRate', bounce_rate)
                logger.warning(f"High bounce rate detected: {bounce_rate:.2f}%")
                
    except Exception as e:
        logger.error(f"Error checking bounce rate: {str(e)}")

def publish_metrics(metric_name, value):
    """Publish custom metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace='EmailNotification',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count'
                }
            ]
        )
    except Exception as e:
        logger.error(f"Error publishing metrics: {str(e)}")
`),
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        environment: {
          TABLE_NAME: this.deliveryTrackingTable.tableName,
        },
      }
    );

    // SNS Topics for SES feedback
    const sesBouncesTopic = new sns.Topic(this, 'SESBouncesTopic', {
      topicName: `ses-bounces-${environmentSuffix}`,
    });

    const sesComplaintsTopic = new sns.Topic(this, 'SESComplaintsTopic', {
      topicName: `ses-complaints-${environmentSuffix}`,
    });

    const sesDeliveryTopic = new sns.Topic(this, 'SESDeliveryTopic', {
      topicName: `ses-delivery-${environmentSuffix}`,
    });

    // Subscribe feedback processor to SES feedback topics
    sesBouncesTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(this.feedbackProcessorFunction)
    );
    sesComplaintsTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(this.feedbackProcessorFunction)
    );
    sesDeliveryTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(this.feedbackProcessorFunction)
    );

    // CloudWatch Monitoring and Alerting
    this.createMonitoring(environmentSuffix, notificationEmails);

    // Outputs
    new cdk.CfnOutput(this, 'OrderEventsTopicArn', {
      value: this.orderEventsTopic.topicArn,
      description: 'SNS Topic ARN for publishing order events',
      exportName: `email-order-events-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeliveryTrackingTableName', {
      value: this.deliveryTrackingTable.tableName,
      description: 'DynamoDB table for email delivery tracking',
      exportName: `email-delivery-table-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailProcessorFunctionArn', {
      value: this.emailProcessorFunction.functionArn,
      description: 'Lambda function ARN for email processing',
      exportName: `email-processor-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailQueueUrl', {
      value: this.emailQueue.queueUrl,
      description: 'SQS Queue URL for email processing (PROMPT.md requirement)',
      exportName: `email-processing-queue-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailDeadLetterQueueUrl', {
      value: this.emailDeadLetterQueue.queueUrl,
      description: 'SQS Dead Letter Queue URL for failed email processing',
      exportName: `email-processing-dlq-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailProcessorCpuAlarmName', {
      value: `email-processor-cpu-${environmentSuffix}`,
      description: 'CloudWatch alarm name for email processor CPU utilization',
      exportName: `email-processor-cpu-alarm-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FeedbackProcessorCpuAlarmName', {
      value: `ses-feedback-processor-cpu-${environmentSuffix}`,
      description:
        'CloudWatch alarm name for SES feedback processor CPU utilization',
      exportName: `ses-feedback-processor-cpu-alarm-${environmentSuffix}`,
    });
  }

  private createMonitoring(
    environmentSuffix: string,
    notificationEmails: string[]
  ): void {
    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'EmailNotificationDashboard',
      {
        dashboardName: `email-notifications-${environmentSuffix}`,
      }
    );

    // Metrics
    const emailsSentMetric = new cloudwatch.Metric({
      namespace: 'EmailNotification',
      metricName: 'EmailSent',
      statistic: 'Sum',
    });

    const emailsDeliveredMetric = new cloudwatch.Metric({
      namespace: 'EmailNotification',
      metricName: 'EmailDelivered',
      statistic: 'Sum',
    });

    const emailsBouncedMetric = new cloudwatch.Metric({
      namespace: 'EmailNotification',
      metricName: 'EmailBounced',
      statistic: 'Sum',
    });

    const bounceRateMetric = new cloudwatch.MathExpression({
      expression: '(bounced / sent) * 100',
      usingMetrics: {
        sent: emailsSentMetric,
        bounced: emailsBouncedMetric,
      },
      label: 'Bounce Rate (%)',
    });

    // Lambda error metrics
    const lambdaErrorsMetric = this.emailProcessorFunction.metricErrors({
      statistic: 'Sum',
    });

    const lambdaDurationMetric = this.emailProcessorFunction.metricDuration({
      statistic: 'Average',
    });

    // Cost monitoring
    const costMetric = new cloudwatch.Metric({
      namespace: 'AWS/Billing',
      metricName: 'EstimatedCharges',
      dimensionsMap: {
        Currency: 'USD',
        ServiceName: 'AmazonSES',
      },
      statistic: 'Maximum',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Email Volume',
        left: [emailsSentMetric, emailsDeliveredMetric],
        right: [emailsBouncedMetric],
        period: cdk.Duration.hours(1),
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Email Delivery Rate',
        left: [bounceRateMetric],
        period: cdk.Duration.hours(1),
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [lambdaDurationMetric],
        right: [lambdaErrorsMetric],
        period: cdk.Duration.minutes(5),
        width: 12,
      })
    );

    // Alarms
    const highBounceRateAlarm = new cloudwatch.Alarm(
      this,
      'HighBounceRateAlarm',
      {
        alarmName: `email-high-bounce-rate-${environmentSuffix}`,
        metric: bounceRateMetric,
        threshold: 5, // 5% bounce rate threshold
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Email bounce rate is above 5%',
      }
    );

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `email-processor-errors-${environmentSuffix}`,
      metric: lambdaErrorsMetric,
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Email processor Lambda is experiencing errors',
    });

    // Lambda CPU utilization alarms
    const emailProcessorCpuAlarm = new cloudwatch.Alarm(
      this,
      'EmailProcessorCpuAlarm',
      {
        alarmName: `email-processor-cpu-${environmentSuffix}`,
        metric: this.emailProcessorFunction.metric('CPUUtilization'),
        threshold: 80, // 80% CPU utilization threshold
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Email processor Lambda CPU utilization is above 80%',
      }
    );

    const feedbackProcessorCpuAlarm = new cloudwatch.Alarm(
      this,
      'FeedbackProcessorCpuAlarm',
      {
        alarmName: `ses-feedback-processor-cpu-${environmentSuffix}`,
        metric: this.feedbackProcessorFunction.metric('CPUUtilization'),
        threshold: 80, // 80% CPU utilization threshold
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'SES feedback processor Lambda CPU utilization is above 80%',
      }
    );

    // Notification topic for alerts
    if (notificationEmails.length > 0) {
      const alertTopic = new sns.Topic(this, 'AlertTopic', {
        topicName: `email-alerts-${environmentSuffix}`,
        displayName: 'Email System Alerts',
      });

      // Subscribe email addresses to alerts
      notificationEmails.forEach(email => {
        alertTopic.addSubscription(
          new snsSubscriptions.EmailSubscription(email)
        );
      });

      // Add alert actions to alarms
      highBounceRateAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      lambdaErrorAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      emailProcessorCpuAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
      feedbackProcessorCpuAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alertTopic)
      );
    }

    const costAlarm = new cloudwatch.Alarm(this, 'CostAlarm', {
      alarmName: `email-cost-alert-${environmentSuffix}`,
      metric: costMetric,
      threshold: 50, // Alert if SES costs exceed $50
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Email system costs are exceeding budget',
    });

    // Add alarm actions if alerting is enabled
    if (notificationEmails.length > 0) {
      // Re-create alertTopic for cost alarm use
      const costAlertTopic = new sns.Topic(this, 'CostAlertTopic', {
        topicName: `email-cost-alerts-${environmentSuffix}`,
        displayName: 'Email System Cost Alerts',
      });

      notificationEmails.forEach(email => {
        costAlertTopic.addSubscription(
          new snsSubscriptions.EmailSubscription(email)
        );
      });

      costAlarm.addAlarmAction(new cloudwatchActions.SnsAction(costAlertTopic));
    }

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Email System Costs (USD)',
        left: [costMetric],
        period: cdk.Duration.days(1),
        width: 24,
      })
    );
  }
}
