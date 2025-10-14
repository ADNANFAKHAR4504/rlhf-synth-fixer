import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface CostMonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  costBudgetThreshold?: number;
  notificationEmails?: string[];
}

export class CostMonitoringStack extends cdk.Stack {
  public readonly costMonitoringFunction: lambda.Function;
  public readonly costAlertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: CostMonitoringStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const costBudgetThreshold = props.costBudgetThreshold || 100; // Default $100
    const notificationEmails = props.notificationEmails || [];

    // Apply standard tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Project', 'EmailCostMonitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // SNS Topic for cost alerts
    this.costAlertTopic = new sns.Topic(this, 'CostAlertTopic', {
      topicName: `email-cost-alerts-${environmentSuffix}`,
      displayName: 'Email System Cost Alerts',
    });

    // Subscribe notification emails
    notificationEmails.forEach(email => {
      this.costAlertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(email)
      );
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'CostMonitoringLogGroup', {
      logGroupName: `/aws/lambda/cost-monitoring-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Cost Monitoring Lambda
    const costMonitoringRole = new iam.Role(this, 'CostMonitoringRole', {
      roleName: `cost-monitoring-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions for cost monitoring
    costMonitoringRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ce:GetCostAndUsage',
          'ce:GetUsageReport',
          'ce:GetReservationCoverage',
          'ce:GetReservationPurchaseRecommendation',
          'ce:GetReservationUtilization',
          'budgets:ViewBudget',
          'budgets:DescribeBudgets',
        ],
        resources: ['*'],
      })
    );

    // Grant CloudWatch permissions
    costMonitoringRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics',
        ],
        resources: ['*'],
      })
    );

    // Grant SNS permissions
    this.costAlertTopic.grantPublish(costMonitoringRole);

    // Cost Monitoring Lambda Function
    this.costMonitoringFunction = new lambda.Function(
      this,
      'CostMonitoringFunction',
      {
        functionName: `cost-monitoring-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.lambda_handler',
        role: costMonitoringRole,
        code: lambda.Code.fromInline(`
import json
import boto3
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ce_client = boto3.client('ce')  # Cost Explorer
cloudwatch = boto3.client('cloudwatch')
sns_client = boto3.client('sns')

# Environment variables
COST_THRESHOLD = ${costBudgetThreshold}
ALERT_TOPIC_ARN = '${this.costAlertTopic.topicArn}'
ENVIRONMENT = '${environmentSuffix}'

def lambda_handler(event, context):
    """
    Monitor costs for email notification system components.
    This function runs daily to check costs and alert if thresholds are exceeded.
    """
    try:
        logger.info("Starting cost monitoring analysis")
        
        # Get current month costs
        current_costs = get_current_month_costs()
        
        # Get previous month costs for comparison
        previous_costs = get_previous_month_costs()
        
        # Calculate cost per email (estimated)
        cost_per_email = calculate_cost_per_email(current_costs)
        
        # Publish metrics to CloudWatch
        publish_cost_metrics(current_costs, cost_per_email)
        
        # Check for cost alerts
        check_cost_alerts(current_costs, previous_costs)
        
        # Generate cost report
        cost_report = generate_cost_report(current_costs, previous_costs, cost_per_email)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Cost monitoring completed successfully',
                'currentCosts': current_costs,
                'costPerEmail': cost_per_email,
                'report': cost_report
            })
        }
        
    except Exception as e:
        logger.error(f"Error in cost monitoring: {str(e)}")
        
        # Send error alert
        send_alert(
            "Cost Monitoring Error",
            f"Error occurred during cost monitoring: {str(e)}"
        )
        
        raise

def get_current_month_costs():
    """Get costs for current month by service."""
    now = datetime.now()
    start_date = now.replace(day=1).strftime('%Y-%m-%d')
    end_date = now.strftime('%Y-%m-%d')
    
    try:
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': [
                        'Amazon Simple Email Service',
                        'AWS Lambda',
                        'Amazon Simple Notification Service',
                        'Amazon DynamoDB',
                        'Amazon CloudWatch'
                    ]
                }
            }
        )
        
        costs = {}
        total_cost = 0
        
        for result in response['ResultsByTime']:
            for group in result['Groups']:
                service = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                costs[service] = cost
                total_cost += cost
        
        costs['Total'] = total_cost
        logger.info(f"Current month costs: {costs}")
        
        return costs
        
    except Exception as e:
        logger.error(f"Error getting current month costs: {str(e)}")
        return {}

def get_previous_month_costs():
    """Get costs for previous month for comparison."""
    now = datetime.now()
    # Get first day of previous month
    first_day_current = now.replace(day=1)
    last_day_previous = first_day_current - timedelta(days=1)
    first_day_previous = last_day_previous.replace(day=1)
    
    start_date = first_day_previous.strftime('%Y-%m-%d')
    end_date = last_day_previous.strftime('%Y-%m-%d')
    
    try:
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': [
                        'Amazon Simple Email Service',
                        'AWS Lambda',
                        'Amazon Simple Notification Service',
                        'Amazon DynamoDB',
                        'Amazon CloudWatch'
                    ]
                }
            }
        )
        
        costs = {}
        total_cost = 0
        
        for result in response['ResultsByTime']:
            for group in result['Groups']:
                service = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                costs[service] = cost
                total_cost += cost
        
        costs['Total'] = total_cost
        logger.info(f"Previous month costs: {costs}")
        
        return costs
        
    except Exception as e:
        logger.error(f"Error getting previous month costs: {str(e)}")
        return {}

def calculate_cost_per_email(costs):
    """Calculate estimated cost per email sent."""
    try:
        # Get email volume from CloudWatch metrics
        response = cloudwatch.get_metric_statistics(
            Namespace='EmailNotification',
            MetricName='EmailSent',
            Dimensions=[],
            StartTime=datetime.now() - timedelta(days=30),
            EndTime=datetime.now(),
            Period=2592000,  # 30 days in seconds
            Statistics=['Sum']
        )
        
        total_emails = 0
        if response['Datapoints']:
            total_emails = response['Datapoints'][0]['Sum']
        
        total_cost = costs.get('Total', 0)
        
        if total_emails > 0:
            cost_per_email = total_cost / total_emails
        else:
            cost_per_email = 0
        
        logger.info(f"Total emails: {total_emails}, Cost per email: USD {cost_per_email:.4f}")
        
        return {
            'totalEmails': total_emails,
            'costPerEmail': cost_per_email,
            'totalCost': total_cost
        }
        
    except Exception as e:
        logger.error(f"Error calculating cost per email: {str(e)}")
        return {'totalEmails': 0, 'costPerEmail': 0, 'totalCost': 0}

def publish_cost_metrics(costs, cost_per_email):
    """Publish cost metrics to CloudWatch."""
    try:
        metrics = []
        
        # Publish individual service costs
        for service, cost in costs.items():
            if service != 'Total':
                metrics.append({
                    'MetricName': 'ServiceCost',
                    'Dimensions': [
                        {'Name': 'Service', 'Value': service},
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ],
                    'Value': cost,
                    'Unit': 'None'
                })
        
        # Publish total cost
        metrics.append({
            'MetricName': 'TotalCost',
            'Dimensions': [
                {'Name': 'Environment', 'Value': ENVIRONMENT}
            ],
            'Value': costs.get('Total', 0),
            'Unit': 'None'
        })
        
        # Publish cost per email
        metrics.append({
            'MetricName': 'CostPerEmail',
            'Dimensions': [
                {'Name': 'Environment', 'Value': ENVIRONMENT}
            ],
            'Value': cost_per_email['costPerEmail'],
            'Unit': 'None'
        })
        
        # Send metrics in batches (max 20 per call)
        for i in range(0, len(metrics), 20):
            batch = metrics[i:i+20]
            cloudwatch.put_metric_data(
                Namespace='EmailNotification/Costs',
                MetricData=batch
            )
        
        logger.info(f"Published {len(metrics)} cost metrics")
        
    except Exception as e:
        logger.error(f"Error publishing cost metrics: {str(e)}")

def check_cost_alerts(current_costs, previous_costs):
    """Check if costs exceed thresholds and send alerts."""
    total_current = current_costs.get('Total', 0)
    total_previous = previous_costs.get('Total', 0)
    
    # Check if current month costs exceed threshold
    if total_current > COST_THRESHOLD:
        send_alert(
            "Monthly Cost Threshold Exceeded",
            f"Email system costs for {ENVIRONMENT} environment have exceeded the threshold.\\n"
            f"Current month cost: USD {total_current:.2f}\\n"
            f"Threshold: USD {COST_THRESHOLD:.2f}\\n"
            f"Previous month cost: USD {total_previous:.2f}"
        )
    
    # Check for significant cost increase (>50% increase)
    if total_previous > 0 and total_current > total_previous * 1.5:
        increase_percent = ((total_current - total_previous) / total_previous) * 100
        send_alert(
            "Significant Cost Increase Detected",
            f"Email system costs have increased significantly.\\n"
            f"Current month: USD {total_current:.2f}\\n"
            f"Previous month: USD {total_previous:.2f}\\n"
            f"Increase: {increase_percent:.1f}%"
        )

def send_alert(subject, message):
    """Send cost alert via SNS."""
    try:
        full_message = f"Environment: {ENVIRONMENT}\\n\\n{message}"
        
        sns_client.publish(
            TopicArn=ALERT_TOPIC_ARN,
            Subject=f"[Cost Alert] {subject}",
            Message=full_message
        )
        
        logger.info(f"Cost alert sent: {subject}")
        
    except Exception as e:
        logger.error(f"Error sending cost alert: {str(e)}")

def generate_cost_report(current_costs, previous_costs, cost_per_email):
    """Generate a detailed cost report."""
    report = {
        'timestamp': datetime.now().isoformat(),
        'environment': ENVIRONMENT,
        'currentMonth': current_costs,
        'previousMonth': previous_costs,
        'costAnalysis': {
            'totalCurrent': current_costs.get('Total', 0),
            'totalPrevious': previous_costs.get('Total', 0),
            'costPerEmail': cost_per_email['costPerEmail'],
            'totalEmailsSent': cost_per_email['totalEmails']
        }
    }
    
    # Calculate month-over-month change
    if previous_costs.get('Total', 0) > 0:
        change_percent = ((current_costs.get('Total', 0) - previous_costs.get('Total', 0)) / previous_costs.get('Total', 0)) * 100
        report['costAnalysis']['monthOverMonthChange'] = change_percent
    
    return report
`),
        timeout: cdk.Duration.minutes(10),
        memorySize: 512,
        environment: {
          COST_THRESHOLD: costBudgetThreshold.toString(),
          ENVIRONMENT: environmentSuffix,
        },
        logGroup: logGroup,
      }
    );

    // Schedule the cost monitoring to run daily
    const costMonitoringRule = new events.Rule(this, 'CostMonitoringSchedule', {
      ruleName: `cost-monitoring-schedule-${environmentSuffix}`,
      description: 'Daily cost monitoring for email notification system',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '9', // Run at 9 AM UTC daily
        day: '*',
        month: '*',
        year: '*',
      }),
    });

    costMonitoringRule.addTarget(
      new eventsTargets.LambdaFunction(this.costMonitoringFunction)
    );

    // Create CloudWatch Dashboard for costs
    const costDashboard = new cloudwatch.Dashboard(this, 'CostDashboard', {
      dashboardName: `email-costs-${environmentSuffix}`,
    });

    // Cost metrics
    const totalCostMetric = new cloudwatch.Metric({
      namespace: 'EmailNotification/Costs',
      metricName: 'TotalCost',
      dimensionsMap: {
        Environment: environmentSuffix,
      },
      statistic: 'Average',
    });

    const costPerEmailMetric = new cloudwatch.Metric({
      namespace: 'EmailNotification/Costs',
      metricName: 'CostPerEmail',
      dimensionsMap: {
        Environment: environmentSuffix,
      },
      statistic: 'Average',
    });

    // Add widgets to cost dashboard
    costDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Total Monthly Costs',
        left: [totalCostMetric],
        period: cdk.Duration.days(1),
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Cost Per Email',
        left: [costPerEmailMetric],
        period: cdk.Duration.days(1),
        width: 12,
      })
    );

    // Cost threshold alarm
    const costThresholdAlarm = new cloudwatch.Alarm(
      this,
      'CostThresholdAlarm',
      {
        alarmName: `email-cost-threshold-${environmentSuffix}`,
        metric: totalCostMetric,
        threshold: costBudgetThreshold,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Email system costs exceed $${costBudgetThreshold} threshold`,
      }
    );

    costThresholdAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.costAlertTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, 'CostMonitoringFunctionArn', {
      value: this.costMonitoringFunction.functionArn,
      description: 'Lambda function ARN for cost monitoring',
      exportName: `cost-monitoring-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CostAlertTopicArn', {
      value: this.costAlertTopic.topicArn,
      description: 'SNS Topic ARN for cost alerts',
      exportName: `cost-alert-topic-${environmentSuffix}`,
    });
  }
}
