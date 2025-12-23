# Serverless ETL Pipeline for Financial Transaction Processing

Hey team,

We've been asked to build a serverless ETL pipeline for a financial analytics company that processes daily transaction files from partner banks. The files come in at unpredictable times throughout the day, and we need to validate, transform, and store them for downstream analytics within 15 minutes of upload. This is critical for our SLA commitments.

The business wants a fully event-driven architecture that can handle variable loads without provisioning servers. Files arrive in CSV or JSON format and need schema validation before transformation. We need to track processing status for audit compliance and send alerts when things go wrong.

I've been asked to create this using **AWS CDK with Python** to leverage infrastructure-as-code best practices. The platform team prefers CDK for its type safety and ability to use familiar Python patterns.

## What we need to build

Create a production-ready serverless ETL pipeline using **AWS CDK with Python** that processes financial transaction files uploaded to S3, validates and transforms them, and tracks processing status for audit compliance.

### Core Requirements

1. **File Storage and Event Triggering**
   - Create S3 bucket for raw transaction file uploads
   - Create S3 bucket for processed/transformed data
   - Configure S3 event notifications to trigger processing workflow
   - Enable versioning on both buckets for audit trail
   - Implement lifecycle policies for 90-day archival to Glacier

2. **Workflow Orchestration**
   - Implement Step Functions state machine with parallel processing branches
   - Support CSV and JSON file formats with proper routing
   - Implement exponential backoff retry logic with maximum 3 attempts
   - Handle workflow execution triggered by EventBridge rules

3. **Data Processing Functions**
   - Deploy Lambda function for file validation checking schema compliance
   - Deploy Lambda function for data transformation applying business rules
   - Use Python 3.11 runtime for all Lambda functions
   - Configure 3GB memory allocation for processing large files
   - Set 5-minute timeout limit for Lambda execution

4. **Metadata and Status Tracking**
   - Create DynamoDB table to track processing status
   - Use file_id as partition key for efficient lookups
   - Configure on-demand billing mode for cost efficiency
   - Enable point-in-time recovery for data protection

5. **Event Routing**
   - Configure EventBridge rules to route S3 events to Step Functions
   - Filter events for .csv and .json file extensions only
   - Ensure proper event transformation and targeting

6. **Monitoring and Logging**
   - Implement CloudWatch Logs with 30-day retention for all Lambda functions
   - Create CloudWatch alarms for Lambda errors exceeding 5% threshold
   - Enable detailed execution logging for Step Functions

7. **Optional Enhancements** (if time permits)
   - Add SNS topic for failure notifications to enable real-time alerting
   - Implement SQS queue for batch processing to improve throughput
   - Add AWS Glue crawler for automated schema discovery

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python** (CDK 2.x)
- Deploy to **us-east-1** region
- Python 3.8+ required for CDK application
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{purpose}-environment-suffix`
- All resources tagged with Environment=Production and Project=ETL-Pipeline

### Constraints

- Lambda functions must use Python 3.11 runtime with 3GB memory allocation
- Lambda timeout must be 5 minutes maximum
- DynamoDB must use on-demand billing mode with point-in-time recovery
- S3 buckets must have versioning enabled and 90-day lifecycle policies
- Step Functions must implement exponential backoff with max 3 retry attempts
- EventBridge rules must filter for .csv and .json extensions only
- All IAM roles must follow least privilege principle with no wildcard resource permissions
- All resources must be destroyable (no Retain policies or deletion protection)
- No VPC required as all services are AWS managed
- Processing must complete within 15-minute SLA from file upload

## Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resource names MUST include an environmentSuffix parameter to enable multiple deployments in the same account. This is critical for testing and multi-environment support.
- **Destroyability**: All resources must be fully destroyable. Do NOT use RemovalPolicy.RETAIN, deletion protection, or any setting that prevents complete stack deletion. This is required for automated testing and cleanup.
- **IAM Policies**: Use specific resource ARNs in IAM policies. Avoid wildcard permissions except where AWS service requirements mandate them (like CloudWatch Logs resource creation).

## Success Criteria

- **Functionality**: Files uploaded to S3 trigger automated validation and transformation workflow
- **Performance**: Processing completes within 15-minute SLA for files up to 100MB
- **Reliability**: Failed processing attempts retry with exponential backoff up to 3 times
- **Monitoring**: CloudWatch alarms trigger when error rate exceeds 5%
- **Audit**: DynamoDB tracks complete processing history with timestamps and status
- **Security**: All IAM roles follow least privilege with no wildcard permissions
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: Python code follows PEP 8 standards, includes type hints, comprehensive error handling

## What to deliver

- Complete AWS CDK Python application with CDK 2.x
- S3 buckets for raw and processed data with event notifications
- Step Functions state machine with parallel processing branches
- Lambda functions for validation and transformation (Python 3.11)
- DynamoDB table for processing metadata with on-demand billing
- EventBridge rules for event routing with file extension filtering
- CloudWatch Logs and alarms for monitoring
- Optional: SNS topic for failure notifications
- Optional: SQS queue for batch processing
- Optional: AWS Glue crawler for schema discovery
- Unit tests for Lambda function logic
- README with deployment instructions and architecture overview
