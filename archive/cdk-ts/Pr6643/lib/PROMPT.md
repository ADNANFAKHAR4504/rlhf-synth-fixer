# Serverless ETL Pipeline for Financial Transaction Processing

Hey team,

We need to build a production-grade serverless ETL pipeline to handle daily financial transaction data processing for a financial analytics company. I've been asked to create this infrastructure using **CDK with TypeScript**. The business receives CSV transaction logs from multiple retail partners daily, and we need to transform, enrich, and make this data available for real-time querying.

The current manual process is causing delays and data quality issues. We need an automated solution that can validate incoming data, transform it to a more efficient format, enrich it with relevant metadata, and provide APIs for querying processing status. The system also needs to run scheduled data quality checks every night.

The architecture needs to be fully serverless for cost optimization and scalability. We're targeting the us-east-1 region and need to ensure all components have proper error handling, monitoring, and follow AWS best practices for security and observability.

## What we need to build

Create a **CDK with TypeScript** application that deploys a complete serverless ETL pipeline for processing financial transaction data in the us-east-1 region.

### Core Requirements

1. **Data Ingestion Layer**
   - S3 bucket for storing raw and processed transaction files
   - Event notifications configured to trigger processing when CSV files are uploaded to 'raw/' prefix
   - Separate prefixes for raw, processed, and failed data

2. **ETL Orchestration**
   - Step Functions state machine that orchestrates the complete ETL workflow
   - Parallel processing capabilities to handle multiple files simultaneously
   - Error handling with retry logic and proper state transitions
   - Integration with Lambda functions for each processing step

3. **Data Processing Functions**
   - Validator Lambda function that checks CSV schema and data integrity
   - Transformer Lambda function that converts CSV data to Parquet format
   - Enricher Lambda function that adds metadata from DynamoDB
   - All functions using Node.js 18.x runtime
   - Each function with separate IAM execution role following least privilege

4. **Metadata Storage**
   - DynamoDB table for storing processing metadata and job status
   - Global secondary index on timestamp attribute for time-based queries
   - Attributes to track file name, processing status, start/end times, and error messages

5. **API Layer**
   - API Gateway REST API for external access
   - GET endpoint to query processing status by job ID
   - POST endpoint to manually trigger ETL workflows
   - Proper request validation and error responses

6. **Event-Driven Automation**
   - EventBridge scheduled rule to run daily data quality checks at 2 AM UTC
   - Integration with Lambda function for quality check execution

7. **Error Handling and Dead Letter Queues**
   - SQS dead letter queues for each asynchronous component
   - Proper error capture for failed Lambda invocations
   - DLQ for Step Functions failures

8. **Observability and Monitoring**
   - CloudWatch dashboards showing key metrics
   - Custom metrics for file processing latency
   - Custom metrics for success/failure rates
   - CloudWatch Logs with 7-day retention for cost optimization
   - Alarms for critical failures

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **S3** for data lake storage with lifecycle policies
- Use **Step Functions** for workflow orchestration
- Use **Lambda** functions (Node.js 18.x) for data processing
- Use **DynamoDB** for metadata storage
- Use **API Gateway** for REST endpoints
- Use **EventBridge** for scheduled triggers
- Use **SQS** for dead letter queues
- Use **CloudWatch** for monitoring and dashboards
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{purpose}-${environmentSuffix}
- All Lambda functions must have separate IAM roles with least privilege access
- No VPC required (all services are fully managed)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - use RemovalPolicy.DESTROY for S3, DynamoDB, and logs
- NO RetainPolicy configurations allowed
- NO DeletionProtection enabled on any resource
- S3 buckets must have autoDeleteObjects: true
- DynamoDB tables must have removalPolicy: RemovalPolicy.DESTROY
- CloudWatch Log Groups must have removalPolicy: RemovalPolicy.DESTROY
- This ensures clean teardown in test environments

### Lambda Runtime Considerations

- Node.js 18.x and later do NOT include AWS SDK v2 by default
- Must explicitly bundle AWS SDK v3 if using Lambda with Node.js 18.x
- Use Lambda layers or bundle dependencies with function code
- Consider using Lambda PowerTools for structured logging

### Constraints

- Deploy to us-east-1 region only
- Node.js 18.x runtime for all Lambda functions
- CloudWatch Logs retention set to 7 days for cost optimization
- No VPC networking required
- Each Lambda function must have separate execution role
- IAM policies must follow least privilege principle
- S3 bucket versioning enabled for compliance
- DynamoDB on-demand billing for cost predictability
- Step Functions Express workflow for lower latency
- All resources must include environmentSuffix for uniqueness
- Include proper error handling and logging in all Lambda functions

## Success Criteria

- Functionality: CSV files uploaded to S3 raw/ prefix automatically trigger ETL pipeline
- Orchestration: Step Functions successfully coordinates all processing steps with parallel execution
- Data Quality: Validator Lambda correctly identifies schema violations
- Transformation: Transformer Lambda converts CSV to Parquet format
- Enrichment: Enricher Lambda successfully retrieves and adds metadata from DynamoDB
- API Access: API Gateway endpoints return correct processing status and trigger workflows
- Automation: EventBridge rule triggers daily quality checks at 2 AM UTC
- Error Handling: Failed processes are captured in dead letter queues
- Monitoring: CloudWatch dashboard displays processing metrics in real-time
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be completely removed without manual intervention
- Security: IAM roles follow least privilege with separate roles per function
- Code Quality: TypeScript with proper type definitions, well-tested, documented

## What to deliver

- Complete CDK TypeScript application with all infrastructure
- S3 bucket with event notifications configured
- Step Functions state machine definition
- Three Lambda functions (validator, transformer, enricher) with source code
- DynamoDB table with global secondary index
- API Gateway REST API with GET and POST endpoints
- EventBridge scheduled rule for daily checks
- SQS dead letter queues for error handling
- CloudWatch dashboard with custom metrics
- IAM roles and policies for all components
- Unit tests for infrastructure and Lambda functions
- README with deployment instructions and architecture overview
