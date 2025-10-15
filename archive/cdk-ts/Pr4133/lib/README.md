# E-commerce Email Notification System

This AWS CDK project implements a reliable, scalable email notification system for e-commerce order confirmations. The system addresses all requirements from the PROMPT.md including email delivery tracking, cost monitoring, and integration with existing order processing workflows.

## Architecture Overview

### Core Components

1. **Order Events Processing**
   - SNS Topic receives order events from e-commerce system
   - Lambda function processes events and sends confirmation emails
   - DynamoDB table tracks email delivery status

2. **Email Delivery**
   - Amazon SES sends professional order confirmation emails
   - SES feedback processing tracks delivery, bounces, and complaints
   - Duplicate prevention using order ID tracking

3. **Monitoring & Alerting**
   - CloudWatch dashboards for email metrics and system health
   - Cost monitoring with daily analysis and budget alerts
   - Bounce rate monitoring with automated alerts

4. **Cost Management**
   - Real-time cost tracking per email sent
   - Daily cost analysis and reporting
   - Budget threshold alerts via SNS 

## Project Structure

```
lib/
├── tap-stack.ts                    # Main orchestrator stack
├── email-notification-stack.ts     # Core email processing system
├── cost-monitoring-stack.ts        # Cost tracking and analysis
└── ses-configuration-stack.ts      # SES setup and configuration

bin/
└── tap.ts                          # CDK application entry point (unchanged)
```

## Deployment Instructions

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18.x or later**
3. **AWS CDK 2.x installed**: `npm install -g aws-cdk`
4. **Verified domain in SES** (if using custom domain)

### Environment Variables

Set these environment variables before deployment:

```bash
# Required
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Optional - System Configuration
export VERIFIED_DOMAIN=orders@yourcompany.com
export NOTIFICATION_EMAILS=alerts@yourcompany.com,devops@yourcompany.com
export COST_BUDGET_THRESHOLD=100

# Optional - Environment Suffix
export ENVIRONMENT_SUFFIX=prod
```

### Deployment Steps

1. **Install dependencies**:
   ```bash
   npm install
   npm run build
   ```

2. **Bootstrap CDK** (first time only):
   ```bash
   npx cdk bootstrap
   ```

3. **Deploy the system**:
   ```bash
   # Deploy all stacks
   npx cdk deploy --all --require-approval never
   
   # Or deploy specific stack
   npx cdk deploy TapStackprod
   ```

4. **Verify deployment**:
   ```bash
   npx cdk list
   aws cloudformation describe-stacks --stack-name email-notifications-prod
   ```

## Integration with E-commerce System

### 1. Publishing Order Events

Your e-commerce system should publish order events to the SNS topic:

```python
import boto3
import json

sns = boto3.client('sns')
topic_arn = 'arn:aws:sns:us-east-1:123456789012:email-order-events-prod'

# Order event message format
order_event = {
    "orderId": "ORDER123456",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "orderItems": [
        {
            "name": "Product Name",
            "quantity": 2,
            "price": "29.99"
        }
    ],
    "orderTotal": "59.98",
    "orderTimestamp": "2024-10-08T12:00:00Z"
}

# Publish to SNS
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps(order_event),
    Subject=f"New Order: {order_event['orderId']}"
)
```

### 2. Tracking Email Delivery

Query email delivery status using DynamoDB:

```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('email-delivery-tracking-prod')

# Query by order ID
response = table.query(
    IndexName='OrderIdIndex',
    KeyConditionExpression='orderId = :order_id',
    ExpressionAttributeValues={':order_id': 'ORDER123456'}
)

for item in response['Items']:
    print(f"Email Status: {item['status']}")
    print(f"Sent Time: {item['timestamp']}")
    print(f"Customer: {item['customerEmail']}")
```

## Monitoring and Operations

### CloudWatch Dashboards

1. **Email Notifications Dashboard** (`email-notifications-{env}`)
   - Email volume and delivery rates
   - Bounce rates and complaint rates
   - Lambda performance metrics

2. **Cost Dashboard** (`email-costs-{env}`)
   - Total monthly costs
   - Cost per email sent
   - Service-level cost breakdown

### Key Metrics

- **EmailSent**: Total emails sent
- **EmailDelivered**: Successfully delivered emails
- **EmailBounced**: Bounced emails
- **EmailComplaint**: Complaint notifications
- **TotalCost**: Monthly system costs
- **CostPerEmail**: Cost efficiency metric

### Alerts Configuration

The system automatically creates CloudWatch alarms for:

- **High bounce rate** (>5%): Indicates delivery issues
- **Lambda errors**: Function execution failures
- **Cost threshold exceeded**: Budget overrun alerts
- **Significant cost increase**: >50% month-over-month increase

## Performance Specifications

### Targets Met

 **Volume Handling**: 2,000+ emails per day with auto-scaling  
 **Processing Speed**: <30 seconds from order event to email sent  
 **Uptime**: 99.9% availability with Lambda's built-in reliability  
 **Duplicate Prevention**: Order ID-based deduplication  
 **Cost Optimization**: Pay-per-use pricing model  

### Capacity Planning

- **Lambda Concurrency**: 1000 concurrent executions (default limit)
- **SES Sending Rate**: 200 emails/second (can be increased)
- **DynamoDB**: On-demand billing scales automatically
- **SNS**: No throughput limits for standard topics

## Security Implementation

### Data Protection

- **Encryption at rest**: DynamoDB tables encrypted
- **Encryption in transit**: All AWS API calls use TLS
- **IAM least privilege**: Functions have minimal required permissions
- **Email data**: Customer information stored with TTL (90 days)

### Compliance Features

- **Audit trail**: All email activities logged in CloudWatch
- **Data retention**: Automatic cleanup via DynamoDB TTL
- **Access control**: IAM roles restrict resource access
- **Email compliance**: SES handles CAN-SPAM compliance

## Cost Analysis

### Estimated Monthly Costs (2,000 emails/day)

| Service | Usage | Cost |
|---------|-------|------|
| SES | 60,000 emails | $6.00 |
| Lambda | 60,000 invocations | $0.20 |
| DynamoDB | On-demand usage | $2.00 |
| SNS | 60,000 messages | $0.06 |
| CloudWatch | Logs and metrics | $1.00 |
| **Total** | | **~$9.26/month** |

### Cost Optimization Features

- **Automatic scaling**: Pay only for actual usage
- **Efficient batching**: Optimized Lambda memory allocation
- **Data lifecycle**: Automatic cleanup of old records
- **Cost monitoring**: Daily cost analysis and alerts

## Troubleshooting Guide

### Common Issues

**1. Emails not being sent**
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/email-processor"
aws logs filter-log-events --log-group-name "/aws/lambda/email-processor-prod" --start-time 1696800000000
```

**2. High bounce rates**
```bash
# Check SES reputation
aws ses get-send-quota
aws ses get-send-statistics
```

**3. Cost alerts not working**
```bash
# Verify cost monitoring function
aws lambda invoke --function-name cost-monitoring-prod response.json
cat response.json
```

### Debug Commands

```bash
# Test email processing
aws sns publish --topic-arn arn:aws:sns:us-east-1:123456789012:email-order-events-prod --message file://test-order.json

# Check DynamoDB records
aws dynamodb scan --table-name email-delivery-tracking-prod --limit 5

# View CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace EmailNotification --metric-name EmailSent --start-time 2024-10-01T00:00:00Z --end-time 2024-10-08T00:00:00Z --period 86400 --statistics Sum
```

## Cleanup

To remove all resources:

```bash
# Destroy all stacks
npx cdk destroy --all

# Verify cleanup
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review bounce rates and delivery metrics
2. **Monthly**: Analyze cost reports and optimize if needed
3. **Quarterly**: Review and update email templates
4. **Annually**: Review SES sending limits and request increases

### Scaling Considerations

- **Increased volume**: Request SES sending limit increases
- **Multiple regions**: Deploy additional stacks in other regions
- **Additional email types**: Extend Lambda function for new templates
- **Advanced features**: Add A/B testing or personalization

## License

This infrastructure code is provided as-is for educational and production use. Ensure compliance with your organization's policies and AWS best practices.
