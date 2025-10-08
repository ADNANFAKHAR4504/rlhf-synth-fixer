# E-commerce Email Notification System

## Architecture Overview

This solution implements a scalable email notification system for e-commerce order processing using AWS CDK with TypeScript. The system uses Amazon SES for email delivery, Lambda for processing, SNS for messaging, and DynamoDB for tracking - all with inline Lambda code embedded directly in the CDK stacks.

## Implementation Files

The system consists of four main TypeScript CDK stack files in the `lib/` directory:

### 1. Main Orchestration Stack

**tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EmailNotificationStack } from './email-notification-stack';
import { CostMonitoringStack } from './cost-monitoring-stack';

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
```

### 2. Email Notification Core Stack

**email-notification-stack.ts** - The main email processing stack with inline Lambda functions:

- **SNS Topic** for order events (`email-order-events-{suffix}`)
- **DynamoDB Table** for email delivery tracking with GSI for order lookups
- **Email Processor Lambda** (Python 3.11) with inline code for:
  - Processing SNS order events
  - Sending order confirmation emails via SES
  - Tracking email delivery status in DynamoDB
  - Duplicate order detection
  - Custom CloudWatch metrics
- **SES Feedback Processor Lambda** (Python 3.11) with inline code for:
  - Processing SES delivery, bounce, and complaint notifications
  - Updating delivery status in DynamoDB
  - Bounce rate monitoring and alerting
- **CloudWatch Dashboard** with email volume, delivery rate, and cost metrics
- **CloudWatch Alarms** for high bounce rates and Lambda errors
- **SNS Topics** for SES feedback (bounces, complaints, delivery)

### 3. Cost Monitoring Stack

**cost-monitoring-stack.ts** - Dedicated cost monitoring with inline Lambda:

- **Cost Monitoring Lambda** (Python 3.11) with inline code for:
  - Daily cost analysis using Cost Explorer API
  - Cost per email calculations
  - Month-over-month cost comparison
  - CloudWatch metrics publishing
  - Threshold breach alerting
- **EventBridge Rule** for daily cost monitoring execution (9 AM UTC)
- **SNS Topic** for cost alerts
- **CloudWatch Dashboard** for cost visualization
- **Cost Threshold Alarm** with configurable budget limits

### 4. SES Configuration Stack

**ses-configuration-stack.ts** - SES setup and configuration:

- **SES Configuration Set** for email tracking (`email-config-set-{suffix}`)
- **SES Email Identity** for domain verification
- **Event Destinations** for bounces, complaints, and delivery tracking
- **Setup Instructions** output for domain verification and production access

## Key Features

### Inline Lambda Implementation
- **No separate lambda/ directory needed** - all Lambda code is embedded inline in CDK
- **Python 3.11 runtime** for both email processing and cost monitoring
- **Proper error handling** and logging throughout
- **CloudWatch integration** for metrics and monitoring

### Resource Naming Convention
All resources follow the pattern: `{purpose}-{environment-suffix}`

Examples:
- `email-order-events-dev`
- `email-delivery-tracking-prod` 
- `cost-monitoring-prod`

### Email Processing Flow
1. **Order Event** → SNS Topic (`email-order-events-{suffix}`)
2. **Email Processor Lambda** processes SNS message
3. **SES sends** order confirmation email
4. **DynamoDB tracks** email delivery status
5. **SES Feedback** updates delivery status via separate Lambda
6. **CloudWatch** monitors metrics and alerts on issues

### Cost Monitoring
- **Daily analysis** of email system costs across all AWS services
- **Cost per email** calculations based on actual volume
- **Threshold alerts** when costs exceed budget
- **Month-over-month** cost trend analysis

### Security & Best Practices
- **IAM least privilege** roles for each Lambda function
- **Resource tagging** for cost allocation and management
- **Point-in-time recovery** enabled for DynamoDB
- **Log retention** policies to manage costs
- **TTL attributes** for automatic data cleanup

## Integration

To use this email notification system:

1. **Deploy the stacks** using CDK
2. **Verify your domain** in SES console
3. **Request production access** (move out of SES sandbox)
4. **Publish messages** to the SNS topic with this format:

```json
{
  "orderId": "ORDER123",
  "customerEmail": "customer@example.com", 
  "customerName": "John Doe",
  "orderItems": [
    {"name": "Product 1", "quantity": 2, "price": "29.99"}
  ],
  "orderTotal": "59.98",
  "orderTimestamp": "2024-01-01T12:00:00Z"
}
```

## Monitoring

- **Email Dashboard**: `email-notifications-{environmentSuffix}`
- **Cost Dashboard**: `email-costs-{environmentSuffix}`
- **Log Groups**: `/aws/lambda/email-processor-{suffix}` and `/aws/lambda/cost-monitoring-{suffix}`

This implementation demonstrates a production-ready email notification system with proper monitoring, cost controls, and scalability - all using inline Lambda code for simplicity and maintainability.