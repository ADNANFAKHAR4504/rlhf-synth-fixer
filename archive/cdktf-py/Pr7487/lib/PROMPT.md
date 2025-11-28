# Cryptocurrency Price Processing System

Hey team,

We've got an exciting MVP to build for a fintech startup that's entering the cryptocurrency trading space. They need a real-time price processing system that can handle webhook traffic from multiple exchanges, enrich the data with technical indicators, and store everything for their trading algorithms to consume. The business is laser-focused on keeping costs low during this initial phase while ensuring the system can scale when they gain traction.

I've been asked to build this serverless architecture using **CDKTF with Python**. The approach here is event-driven and fully serverless to minimize operational overhead and optimize costs. We're leveraging Lambda functions for compute, DynamoDB for storage with streams for reactive processing, and a comprehensive monitoring setup to catch issues before they impact the business.

The architecture needs to handle two main workflows. First, when exchange webhooks arrive, they hit our webhook processor Lambda which validates and normalizes the price data before writing to DynamoDB. Second, DynamoDB Streams triggers our enrichment Lambda to add moving averages and volatility metrics. This decoupled design means we can scale each component independently and add new processing steps without touching the ingestion path.

Security is critical since we're dealing with financial data and external API integrations. All sensitive configuration like exchange API endpoints must be encrypted using a customer-managed KMS key. We need proper IAM roles with least-privilege access, dead letter queues for failure handling, and CloudWatch monitoring to detect anomalies. The business wants visibility into system health from day one.

## What we need to build

Create a serverless cryptocurrency price processing pipeline using **CDKTF with Python** that handles real-time webhook ingestion, data enrichment, and storage with comprehensive monitoring and error handling.

### Core Requirements

1. **Webhook Ingestion Lambda**
   - Lambda function named 'webhook-processor'
   - 1GB memory allocation
   - 60-second timeout
   - ARM64 architecture for cost optimization
   - Receives price updates from exchange webhooks
   - Validates and normalizes incoming data
   - Writes to DynamoDB table

2. **Data Enrichment Lambda**
   - Lambda function named 'price-enricher'
   - 512MB memory allocation
   - ARM64 architecture
   - Triggered by DynamoDB Streams
   - Calculates moving averages and volatility metrics
   - Event source mapping configuration

3. **Data Storage**
   - DynamoDB table named 'crypto-prices'
   - Partition key: 'symbol' (string)
   - Sort key: 'timestamp' (number)
   - On-demand billing mode
   - Point-in-time recovery enabled
   - DynamoDB Streams enabled for triggering enrichment

4. **Error Handling**
   - SQS dead letter queues for both Lambda functions
   - 4-day message retention period
   - Proper retry configuration

5. **Success Routing**
   - Lambda destinations configured
   - SNS topic 'price-updates-success' for successful executions
   - Integration point for downstream services

6. **Security and Encryption**
   - Customer-managed KMS key for Lambda environment variables
   - Encrypt exchange API endpoints configuration
   - IAM roles with least-privilege policies
   - DynamoDB read/write permissions only where needed
   - KMS decrypt permissions for Lambda functions

7. **Monitoring and Logging**
   - CloudWatch Log groups for both Lambda functions
   - 3-day log retention (cost optimization)
   - Subscription filters to detect error patterns
   - CloudWatch alarms for critical metrics

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS Lambda** for serverless compute
- Use **Amazon DynamoDB** with streams for data storage and event triggers
- Use **AWS KMS** for encryption of sensitive configuration
- Use **Amazon SQS** for dead letter queues
- Use **Amazon SNS** for success notifications
- Use **Amazon CloudWatch** for logging and monitoring
- Deploy to **us-east-1** region
- Lambda functions must use ARM64 architecture
- Python 3.9 or higher for Lambda runtime
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All Lambda environment variables containing API endpoints must be KMS encrypted

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resource names MUST include an environmentSuffix parameter to ensure uniqueness across deployments. This is NON-NEGOTIABLE. Examples: webhook-processor-{environmentSuffix}, crypto-prices-{environmentSuffix}
- **Destroyability**: All resources must be fully destroyable with no Retain policies. Use DESTROY removal policies for all resources
- **Reserved Concurrency**: Lambda functions must have reserved concurrent executions configured to prevent throttling
- **Log Retention**: CloudWatch Logs retention must be exactly 3 days to minimize storage costs
- **Billing Mode**: DynamoDB must use on-demand billing mode with point-in-time recovery enabled
- **Lambda Code**: Include placeholder Python code for both Lambda functions demonstrating the expected functionality

### Constraints

- Lambda functions must use ARM64 architecture for cost savings
- DynamoDB must use on-demand billing mode
- Point-in-time recovery must be enabled for DynamoDB
- Reserved concurrent executions must be set for Lambda functions
- CloudWatch Logs retention exactly 3 days
- Customer-managed KMS key required (not AWS managed)
- No VPC required - all services publicly accessible
- Lambda functions need internet access for external API calls
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging in Lambda code
- IAM policies must follow least-privilege principle

## Success Criteria

- **Functionality**: Complete event-driven pipeline from webhook ingestion through enrichment to storage
- **Performance**: Lambda functions optimized with ARM64, appropriate memory allocations, and reserved concurrency
- **Reliability**: Dead letter queues configured, retry logic implemented, DynamoDB streams for reliable event processing
- **Security**: KMS encryption for sensitive data, least-privilege IAM roles, secure credential handling
- **Monitoring**: CloudWatch Logs with subscription filters, alarms for error detection, Lambda destinations for success tracking
- **Resource Naming**: All resources include environmentSuffix parameter with consistent naming convention
- **Cost Optimization**: Serverless architecture, on-demand billing, 3-day log retention, ARM64 Lambda architecture
- **Destroyability**: Clean stack deletion without retained resources
- **Code Quality**: Well-structured Python code, proper error handling, comprehensive documentation

## What to deliver

- Complete CDKTF Python implementation with main.py or equivalent entry point
- Both Lambda function implementations with Python code
- IAM roles and policies with least-privilege access
- DynamoDB table with streams configuration
- Event source mapping for stream processing
- KMS key for environment variable encryption
- SQS dead letter queues for both Lambda functions
- SNS topic for success notifications
- Lambda destinations configuration
- CloudWatch Log groups with subscription filters
- Stack outputs for Lambda ARNs, DynamoDB table name, and SNS topic ARN
- README with deployment instructions and architecture overview
- Resource tagging for cost allocation
- Configuration using environmentSuffix parameter throughout
