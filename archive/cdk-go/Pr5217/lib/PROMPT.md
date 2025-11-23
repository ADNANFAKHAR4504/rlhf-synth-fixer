We need to build a real-time e-commerce order processing pipeline for a major online retail platform that handles significant transaction volumes daily. The business team has requested a high-throughput, fault-tolerant system that can process orders reliably while scaling to meet demand during peak shopping periods.

The current system struggles with order processing bottlenecks during high-traffic events like flash sales and holiday shopping. We've been asked to design a modern serverless architecture that can handle concurrent order processing, maintain data consistency, and provide visibility into the entire order lifecycle.

This is a critical system that needs to be production-ready from day one. The business expects near-instant order confirmation, reliable payment processing coordination, inventory updates, and order fulfillment notifications. Any downtime or data loss could directly impact revenue and customer trust.

## What we need to build

Build a serverless order processing pipeline using **AWS CDK with Go** for an e-commerce platform. The system must handle order ingestion, validation, payment processing coordination, inventory management, and customer notifications. The infrastructure needs to be deployed in the eu-west-2 region and must be completely destroyable for testing purposes.

### Core Requirements

1. **Order Ingestion**
   - Create an API Gateway REST API to accept incoming order requests
   - Validate order structure and customer information at the entry point
   - Support high request rates during peak shopping periods
   - Return order confirmation immediately to customers

2. **Order Processing Pipeline**
   - Use SQS queues to decouple order processing stages
   - Implement Lambda functions for order validation, payment coordination, and inventory checks
   - Process orders asynchronously to handle high volumes
   - Include dead letter queues for failed order handling
   - Support order retry logic with exponential backoff

3. **Data Storage**
   - Store order details in DynamoDB tables with proper indexing
   - Track order status throughout the processing lifecycle
   - Maintain order history for customer service and analytics
   - Support fast lookups by order ID and customer ID

4. **Event Processing and Notifications**
   - Use SNS topics for order status change notifications
   - Send notifications for order confirmation, payment status, and shipment updates
   - Support multiple notification channels (email, SMS, mobile push)
   - Include event logging for audit trails

5. **Monitoring and Observability**
   - CloudWatch Logs for all Lambda function execution
   - CloudWatch Metrics for order processing throughput and latency
   - CloudWatch Alarms for error rates and queue depth thresholds
   - X-Ray tracing for end-to-end request visibility

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go**
- Deploy to **eu-west-2** region (MANDATORY)
- Use **API Gateway** for order ingestion endpoint
- Use **Lambda functions** (Node.js or Python runtime) for processing logic
- Use **SQS** for asynchronous order processing queues
- Use **DynamoDB** for order data storage with proper capacity modes
- Use **SNS** for event notifications and status updates
- Use **CloudWatch** for logging, metrics, and alarms
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies, no DeletionProtection)
- Include proper IAM roles with least privilege access
- Enable encryption at rest for DynamoDB tables
- Configure appropriate timeout and retry settings for Lambda functions

### Constraints

- Must handle at least 100 concurrent order requests during peak periods
- Order processing latency should be under 5 seconds for standard orders
- All components must be serverless to minimize operational overhead
- System must be cost-effective with pay-per-use pricing model
- Must support graceful degradation if downstream services are unavailable
- All resources must include proper error handling and logging
- No hardcoded credentials or sensitive data in code
- All resources must be tagged with Environment and Application identifiers

## Success Criteria

- **Functionality**: Complete order flow from ingestion to notification
- **Performance**: Handles high-volume concurrent requests without throttling
- **Reliability**: Failed orders are captured and can be retried or investigated
- **Security**: Proper IAM roles, encryption, and no exposed credentials
- **Resource Naming**: All named resources include environmentSuffix
- **Observability**: Full visibility into order processing with metrics and logs
- **Destroyability**: All resources can be cleanly removed after testing
- **Code Quality**: Well-structured Go code, properly commented, follows CDK patterns

## What to deliver

- Complete **AWS CDK with Go** implementation in lib/tap_stack.go
- Lambda function code for order processing handlers in lib/lambda/ or lib/functions/
- API Gateway REST API configuration with proper integration
- SQS queues for order processing stages with DLQ configuration
- DynamoDB tables for order storage with appropriate indexes
- SNS topics for order notifications and status updates
- CloudWatch Logs, Metrics, and Alarms for system monitoring
- IAM roles and policies following least privilege principle
- Unit tests covering stack synthesis and resource creation
- Integration tests validating end-to-end order processing flow
- Documentation with deployment instructions and architecture overview