import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CostMonitoringStack } from './cost-monitoring-stack';
import { EmailNotificationStack } from './email-notification-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply standard tags to the main stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Project', 'EcommerceEmailNotifications');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Configuration from environment variables
    const verifiedDomain =
      process.env.VERIFIED_DOMAIN || 'orders@yourcompany.com';
    const notificationEmails =
      process.env.NOTIFICATION_EMAILS?.split(',') || [];
    const costBudgetThreshold = parseInt(
      process.env.COST_BUDGET_THRESHOLD || '100',
      10
    );

    // Email Notification System Stack
    const emailNotificationStack = new EmailNotificationStack(
      scope,
      `EmailNotificationStack${environmentSuffix}`,
      {
        stackName: `email-notifications-${environmentSuffix}`,
        environmentSuffix,
        verifiedDomain,
        notificationEmails,
        env: props?.env,
      }
    );

    // Cost Monitoring Stack
    const costMonitoringStack = new CostMonitoringStack(
      scope,
      `CostMonitoringStack${environmentSuffix}`,
      {
        stackName: `email-cost-monitoring-${environmentSuffix}`,
        environmentSuffix,
        costBudgetThreshold,
        notificationEmails,
        env: props?.env,
      }
    );

    // Stack Dependencies
    costMonitoringStack.addDependency(emailNotificationStack);

    // Main Stack Outputs - Export key resources for integration
    new cdk.CfnOutput(this, 'OrderEventsTopicArn', {
      value: emailNotificationStack.orderEventsTopic.topicArn,
      description:
        'SNS Topic ARN for publishing order events from e-commerce system',
      exportName: `TapStack-OrderEventsTopic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeliveryTrackingTableName', {
      value: emailNotificationStack.deliveryTrackingTable.tableName,
      description: 'DynamoDB table name for querying email delivery status',
      exportName: `TapStack-DeliveryTrackingTable-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailProcessorFunctionName', {
      value: emailNotificationStack.emailProcessorFunction.functionName,
      description: 'Lambda function name for email processing',
      exportName: `TapStack-EmailProcessorFunction-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailQueueUrl', {
      value: emailNotificationStack.emailQueue.queueUrl,
      description: 'SQS queue URL for email processing',
      exportName: `TapStack-EmailQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailDeadLetterQueueUrl', {
      value: emailNotificationStack.emailDeadLetterQueue.queueUrl,
      description: 'SQS dead letter queue URL for failed email processing',
      exportName: `TapStack-EmailDeadLetterQueueUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailProcessorCpuAlarmName', {
      value: `email-processor-cpu-${environmentSuffix}`,
      description: 'CloudWatch alarm name for email processor CPU utilization',
      exportName: `TapStack-EmailProcessorCpuAlarm-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FeedbackProcessorCpuAlarmName', {
      value: `ses-feedback-processor-cpu-${environmentSuffix}`,
      description:
        'CloudWatch alarm name for SES feedback processor CPU utilization',
      exportName: `TapStack-FeedbackProcessorCpuAlarm-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SystemSetupInstructions', {
      value: JSON.stringify({
        integration: {
          orderEventsTopic: emailNotificationStack.orderEventsTopic.topicArn,
          messageFormat: {
            orderId: 'string - unique order identifier',
            customerEmail: 'string - customer email address',
            customerName: 'string - customer full name',
            orderItems:
              'array - list of order items with name, quantity, price',
            orderTotal: 'string - total order amount',
            orderTimestamp: 'string - ISO 8601 timestamp',
          },
        },
        monitoring: {
          deliveryTracking:
            emailNotificationStack.deliveryTrackingTable.tableName,
          costDashboard: `email-costs-${environmentSuffix}`,
          emailDashboard: `email-notifications-${environmentSuffix}`,
        },
        configuration: {
          verifiedDomain: verifiedDomain,
          costThreshold: costBudgetThreshold,
          alertEmails: notificationEmails,
        },
      }),
      description:
        'JSON configuration for integrating with the email notification system',
      exportName: `TapStack-SetupInstructions-${environmentSuffix}`,
    });
  }
}
