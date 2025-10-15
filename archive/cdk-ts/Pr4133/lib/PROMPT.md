Hey team,

We need to build an email notification system for our e-commerce platform. I've been asked to create this in TypeScript using AWS CDK. The business wants automated emails sent when customers place orders, and we need to make sure everything is secure and follows our naming standards.

The system should handle different types of notifications and be able to scale during busy periods like Black Friday. Make sure to add a unique suffix to resource names so we don't have conflicts when deploying multiple environments.

## What we need to build

Create an email notification service using **AWS CDK and TypeScript** for our e-commerce order system.

### Core Requirements

1. **Order Email Notifications**
   - Send confirmation emails when customers place orders
   - Include order details, shipping info, and estimated delivery
   - Support different email templates for different product categories

2. **Email Templates**
   - Professional HTML email templates with our branding
   - Mobile-responsive design
   - Support for both plain text and HTML versions

3. **Reliability & Scalability**
   - Handle peak traffic during sales events
   - Retry failed email sends with exponential backoff
   - Dead letter queue for failed notifications

4. **Security**
   - Use IAM roles with minimal required permissions
   - Encrypt sensitive customer data in transit and at rest
   - Email content should not contain sensitive payment information

5. **Monitoring**
   - Track email delivery success rates
   - Monitor bounce and complaint rates
   - CloudWatch dashboards for operational visibility

6. **Customer Management**
   - Handle email bounces and complaints appropriately
   - Maintain suppression lists for unsubscribed customers
   - Support for customer preference management

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Amazon SES** for email sending
- **Lambda functions** for processing order events
- **SQS** for reliable message processing
- **DynamoDB** for storing email templates and customer preferences
- Resource names must include a **string suffix** for uniqueness
- Follow naming convention: `ecommerce-purpose-environment-suffix`

### Constraints

- No hardcoded email addresses or credentials
- All resources must be properly tagged for cost tracking
- Email sending must comply with CAN-SPAM requirements
- System must be deployable across multiple AWS regions
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: Emails sent successfully for all order types
- **Performance**: Handle at least 1000 emails per minute during peak periods
- **Reliability**: 99.9% email delivery success rate
- **Security**: No exposure of sensitive customer data, proper IAM permissions
- **Scalability**: Auto-scale to handle traffic spikes
- **Compliance**: CAN-SPAM compliant with proper unsubscribe handling
- **Resource Naming**: All resources include string suffix for uniqueness
- **Code Quality**: TypeScript, well-tested, and properly documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- Email processing Lambda functions
- SES configuration and templates
- DynamoDB tables for preferences and templates
- SQS queues for reliable processing
- CloudWatch monitoring and alarms
- Unit tests for all Lambda functions
- Documentation and deployment instructions