Hey team,

We need to build a serverless data processing pipeline for CSV file analysis for a financial analytics company. They're dealing with large transaction data files that arrive in S3 buckets at irregular intervals, and they need automated processing that can extract key metrics, validate data integrity, and store results for real-time dashboard queries. I've been asked to create this infrastructure using **CDKTF with TypeScript**. The business wants reliable, automated processing that triggers within 30 seconds of file upload and handles failures gracefully.

The company processes transaction CSV files up to 100MB in size, and these files need to be analyzed automatically when they land in S3. The processing pipeline needs to be fully serverless to keep costs down and scale automatically with demand. They also need strong audit capabilities, which means versioning on the storage bucket and detailed logging of all processing activities.

## What we need to build

Create a serverless data processing pipeline using **CDKTF with TypeScript** for automated CSV file analysis in the ap-southeast-1 region.

### Core Requirements

1. **S3 Storage with Event Notifications**
   - Create an S3 bucket with SSE-S3 encryption enabled
   - Enable versioning for audit purposes
   - Block all public access to the bucket
   - Configure S3 event notifications to trigger processing when .csv files are uploaded to the 'raw-data/' prefix
   - CSV files up to 100MB must trigger processing within 30 seconds

2. **Lambda Processing Function**
   - Define a Lambda function that processes CSV files
   - Extract transaction summaries and data quality metrics from the files
   - Use Python 3.9 runtime with maximum 5-minute timeout
   - Configure environment variables for DynamoDB table name, S3 bucket name, and processing configuration
   - Grant Lambda permission to read from S3, write to DynamoDB, and publish to CloudWatch Logs

3. **DynamoDB Storage**
   - Create a DynamoDB table with partition key 'fileId' and sort key 'timestamp'
   - Store processing results for real-time dashboard queries
   - Use on-demand billing mode
   - Enable point-in-time recovery

4. **Error Handling and Monitoring**
   - Implement an SQS dead letter queue for failed processing attempts
   - Configure dead letter queue with 14-day retention period
   - Send messages to DLQ after 3 failed Lambda invocation attempts
   - Set up CloudWatch Log Groups with 7-day retention for all Lambda function logs

5. **Security and Access Control**
   - Create IAM roles and policies following least privilege principle
   - Ensure Lambda has only necessary permissions for S3 read, DynamoDB write, and CloudWatch Logs
   - All resources must use secure configurations

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **S3** for file storage with encryption and versioning
- Use **Lambda** for serverless file processing
- Use **DynamoDB** for storing processing results
- Use **SQS** for dead letter queue functionality
- Use **CloudWatch Logs** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resourcetype-environmentSuffix
- Deploy to **ap-southeast-1** region
- Include proper terraform.tf for provider configuration
- Include variables.tf for input variables
- Include outputs.tf exposing S3 bucket name, Lambda function ARN, and DynamoDB table name

### Constraints

- Lambda functions must use Python 3.9 runtime
- Lambda timeout maximum 5 minutes
- S3 bucket must use SSE-S3 encryption
- S3 bucket must block all public access
- DynamoDB must use on-demand billing
- DynamoDB must have point-in-time recovery enabled
- Dead letter queue must have 14-day retention
- CloudWatch logs must have 7-day retention
- All resources must be destroyable (no Retain policies)
- IAM roles must follow least privilege principle
- Include proper error handling and logging
- All resource dependencies must be properly configured

## Success Criteria

- **Functionality**: Complete serverless pipeline that processes CSV files on upload, extracts metrics, stores results in DynamoDB, and handles failures with DLQ
- **Performance**: CSV files up to 100MB trigger processing within 30 seconds of upload
- **Reliability**: Failed processing attempts route to dead letter queue after 3 retries
- **Security**: S3 encryption enabled, public access blocked, IAM roles with least privilege
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Auditability**: S3 versioning enabled, CloudWatch logs retained for 7 days
- **Code Quality**: TypeScript code that is well-structured, properly typed, and documented

## What to deliver

- Complete CDKTF TypeScript implementation
- S3 bucket with encryption, versioning, and event notifications
- Lambda function with Python 3.9 runtime for CSV processing
- DynamoDB table with proper schema for storing results
- SQS dead letter queue for error handling
- CloudWatch Log Groups with retention policies
- IAM roles and policies with least privilege access
- terraform.tf with provider configuration
- variables.tf with input variables including environmentSuffix
- outputs.tf exposing bucket name, Lambda ARN, and table name
- All resources properly configured with dependencies
- Documentation and deployment instructions
