Hey team,

We need to build an automated transaction reconciliation pipeline for our financial services operations. The finance team processes CSV files daily from multiple payment providers, and they need a system that can automatically validate transactions, check for discrepancies, and notify them when something doesn't match up. Right now they're doing this manually and it's taking way too long.

The business wants this implemented as a serverless workflow that can handle up to 100,000 transactions per day. Files get uploaded to S3, and from there we need to orchestrate the entire reconciliation process including parsing, validation, and report generation.

I've been asked to create this infrastructure using Terraform with HCL for the us-east-1 region. The system needs to be production-ready with proper monitoring and error handling.

## What we need to build

Create a serverless transaction reconciliation pipeline using Terraform with HCL that processes CSV files uploaded to S3 and orchestrates validation workflows.

### Core Requirements

1. **S3 Event-Driven Processing**
   - Create S3 bucket with event notifications that trigger processing when CSV files are uploaded
   - Enable versioning on S3 bucket
   - Configure lifecycle policy to transition objects to Glacier after 90 days
   - All bucket names must include environmentSuffix for uniqueness

2. **Step Functions Orchestration**
   - Implement Step Functions state machine that orchestrates the reconciliation workflow
   - Implement exponential backoff retry logic with maximum 3 attempts
   - Configure proper error handling with catch blocks
   - State machine should coordinate the three Lambda functions in sequence

3. **Lambda Processing Functions**
   - Create file parser Lambda function using Python 3.9 runtime with 1024MB memory
   - Create transaction validator Lambda function using Python 3.9 runtime with 1024MB memory
   - Create report generator Lambda function using Python 3.9 runtime with 1024MB memory
   - All Lambda functions must have proper IAM roles following least privilege principle
   - Set CloudWatch Logs retention to 30 days for all Lambda functions

4. **DynamoDB State Storage**
   - Set up DynamoDB table for transaction records with on-demand billing mode
   - Set up DynamoDB table for reconciliation results with on-demand billing mode
   - Enable point-in-time recovery on both tables
   - Table names must include environmentSuffix

5. **SNS Notifications**
   - Configure SNS topic for email notifications when reconciliation completes or fails
   - Topic name must include environmentSuffix

6. **CloudWatch Monitoring**
   - Create CloudWatch dashboard with metrics for processing time and error rates
   - Dashboard should display Step Functions execution metrics
   - Include Lambda function duration and error metrics
   - Include DynamoDB read/write capacity metrics

7. **Tagging Strategy**
   - All components must be tagged with Environment=production and Project=reconciliation
   - Apply tags consistently across all component types

8. **Optional Enhancements** if time permits
   - Add SQS queue for batching multiple file uploads
   - Implement EventBridge rules for scheduling daily reports
   - Add X-Ray tracing to all Lambda functions

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use S3 for file storage with event notifications
- Use Step Functions for workflow orchestration
- Use Lambda for serverless compute with Python 3.9
- Use DynamoDB for data state storage
- Use SNS for notifications
- Use CloudWatch for monitoring and dashboards
- Component names must include environmentSuffix for uniqueness
- Follow naming convention: component-type-environment-suffix
- Deploy to us-east-1 region
- All IAM roles must follow least privilege principle with specific ARNs only
- All components must be destroyable with no Retain policies or deletion protection

### Deployment Requirements - CRITICAL

- Names must include environmentSuffix variable like bucket-name-${var.environment_suffix}
- All components must be destroyable after testing with no deletion_protection or lifecycle prevent_destroy
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Step Functions must implement exponential backoff retry with max 3 attempts
- Lambda CloudWatch Logs retention must be set to 30 days
- S3 lifecycle policy must transition to Glacier after 90 days
- All IAM policies must specify explicit ARNs only

### Constraints

- All Lambda functions must use Python 3.9 runtime with 1024MB memory allocation
- Step Functions state machine must implement exponential backoff retry logic with maximum 3 attempts
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- S3 buckets must have versioning enabled and lifecycle policies to transition objects to Glacier after 90 days
- All IAM roles must follow least privilege principle with explicit ARNs only
- CloudWatch Logs retention must be set to 30 days for all Lambda function logs
- Processing time target: Complete reconciliation within 5 minutes of file upload
- System must handle up to 100,000 items per daily CSV file

## Success Criteria

- Functionality: S3 event triggers Step Functions workflow which executes all three Lambda functions in sequence
- Performance: Complete processing within 5 minutes for files up to 100,000 items
- Reliability: Proper error handling with retry logic and notification on failures
- Security: IAM least privilege with explicit ARNs and encryption at rest for S3 and DynamoDB
- Naming Convention: All components include environmentSuffix for deployment uniqueness
- Destroyability: All components can be cleanly destroyed without manual intervention
- Monitoring: CloudWatch dashboard displays key metrics for processing time and errors
- Code Quality: Clean HCL code, well-structured, properly documented

## What to deliver

- Complete Terraform HCL implementation
- S3 bucket with event notification configuration
- Step Functions state machine with retry logic and error handling
- Three Lambda functions: file parser, validator, report generator
- Lambda function code in lib/lambda/ directory
- Two DynamoDB tables: records and reconciliation results
- SNS topic for notifications
- CloudWatch dashboard with processing metrics
- IAM roles and policies for all services
- All components tagged with Environment and Project tags
- Documentation and deployment instructions
