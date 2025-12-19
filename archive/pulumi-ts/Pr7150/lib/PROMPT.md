Hey team,

We've got a fintech startup that's hitting the limits of their monolithic cryptocurrency price tracking system. They're getting hammered with volume from multiple exchanges and need to move to a serverless event-driven architecture. I've been tasked with building this in **Pulumi with TypeScript** to handle real-time price alerts that can scale automatically.

The current system just can't keep up with the incoming price change events anymore. Every time a major crypto movement happens, their alerts get delayed or lost. They need something that processes events as they come in, maintains historical price data for trend analysis, and sends alerts when thresholds get crossed. The business is pushing hard on this because delayed alerts directly impact their customer trust and platform reputation.

We need a clean serverless design that uses EventBridge for event routing, Lambda for processing, DynamoDB for state, and SNS for notification distribution. Everything needs to be cost-optimized with ARM64 Lambda functions and on-demand DynamoDB billing. The architecture should be resilient with dead letter queues and proper error handling throughout.

## What we need to build

Create a serverless cryptocurrency price alert system using **Pulumi with TypeScript** that processes price events from exchanges and generates alerts when thresholds are exceeded.

### Core Requirements

1. **Event Processing Infrastructure**
   - Create EventBridge custom event bus named 'crypto-events' to receive price updates from exchanges
   - Deploy Lambda function 'price-processor' to validate incoming price events and calculate percentage changes
   - Configure EventBridge rules to route price events to the price-processor function

2. **Data Storage and History**
   - Create DynamoDB table 'price-history' with partition key 'symbol' and sort key 'timestamp'
   - Use on-demand billing mode for DynamoDB
   - Store historical prices for trend analysis and alert generation

3. **Alert Generation**
   - Deploy Lambda function 'alert-generator' that queries price history and generates alerts when thresholds are exceeded
   - Configure EventBridge rule with cron expression to schedule alert-generator execution every 5 minutes
   - Create SNS topic 'price-alerts' for distributing notifications to subscribers

4. **Reliability and Error Handling**
   - Implement SQS dead letter queues for both Lambda functions
   - Configure CloudWatch Log groups with 14-day retention for all Lambda functions
   - Set Lambda timeout to 30 seconds maximum
   - Configure reserved concurrent executions to 100 for each Lambda function

5. **Security and Access Control**
   - Set up IAM roles with minimal permissions for each Lambda function
   - Follow least privilege principle with no wildcard actions
   - Grant price-processor access to DynamoDB write and EventBridge publish
   - Grant alert-generator access to DynamoDB read and SNS publish

6. **Stack Outputs**
   - Export EventBridge bus ARN
   - Export both Lambda function names
   - Export DynamoDB table name
   - Export SNS topic ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon EventBridge** for event routing with custom event bus
- Use **AWS Lambda** for serverless compute with Node.js 18+ runtime
- Use **Amazon DynamoDB** for price history storage
- Use **Amazon SNS** for alert notifications
- Use **Amazon SQS** for dead letter queues
- Use **Amazon CloudWatch Logs** for monitoring
- Use **AWS IAM** for roles and policies
- Lambda functions must use ARM64 architecture for cost optimization
- Lambda functions must have 512MB memory allocation
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must be tagged with Environment and CostCenter tags

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names for uniqueness across deployments
- NO RemovalPolicy.RETAIN or deletion protection - all resources must be destroyable
- Lambda functions using Node.js 18+ must use AWS SDK v3 (not v2) or include aws-sdk as dependency
- IAM policies must use specific service actions, not wildcard permissions
- All taggable resources must include Environment and CostCenter tags

### Constraints

- Lambda reserved concurrent executions must be set to 100
- DynamoDB must use on-demand billing mode
- Lambda memory allocation must be 512MB
- Lambda timeout must be 30 seconds maximum
- Dead letter queues required for all asynchronous Lambda invocations
- EventBridge rules must use cron expressions for scheduling
- IAM roles must follow least privilege principle
- CloudWatch Log groups must have 14-day retention
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging in all Lambda functions

## Success Criteria

- Functionality: System receives events on EventBridge bus, processes them through Lambda, stores in DynamoDB, and generates alerts via SNS
- Performance: Lambda functions execute within 30 seconds, DynamoDB responds with single-digit millisecond latency
- Reliability: Dead letter queues capture failed events, CloudWatch logs capture all execution details
- Security: IAM roles grant minimal required permissions, no wildcard actions
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Code Quality: TypeScript with proper types, well-tested, documented deployment instructions
- Cost Optimization: ARM64 Lambda, on-demand DynamoDB, no unnecessary resource over-provisioning

## What to deliver

- Complete Pulumi TypeScript implementation in index.ts or similar entry point
- Lambda function code for price-processor (validates events, calculates changes)
- Lambda function code for alert-generator (queries history, generates alerts)
- EventBridge custom event bus 'crypto-events' with routing rules
- DynamoDB table 'price-history' with symbol and timestamp keys
- SNS topic 'price-alerts' for notification distribution
- SQS dead letter queues for both Lambda functions
- CloudWatch Log groups with 14-day retention
- IAM roles and policies following least privilege
- Stack outputs for EventBridge ARN, Lambda names, DynamoDB name, SNS ARN
- Unit tests for all components
- Documentation and deployment instructions
