# Serverless Transaction Processing Pipeline

## Business Context

Hey, we need to build a serverless data processing pipeline for our financial services platform that handles transaction file uploads in near real-time with comprehensive error handling and audit trails for GDPR compliance. The system must validate incoming CSV and JSON files against schemas, store processed transactions securely, and maintain complete observability across the entire processing workflow. **We'll use Terraform with HCL** to implement this event-driven architecture in eu-central-1.

## Technical Requirements

### S3 Storage with Event Notifications

Create an S3 bucket for transaction file uploads using the naming pattern "s3-transactions-dev-ACCOUNT_ID" for global uniqueness. Enable versioning and configure server-side encryption using a customer-managed KMS key. Implement all four public access block settings and add bucket policies with root account access first, then enforce encryption in transit by denying unencrypted uploads. Configure S3 event notifications that trigger Lambda processing only for objects with .csv and .json suffixes, and set up lifecycle rules with the required filter block to transition objects to Glacier after 90 days. Set force_destroy to true for testing cleanup and ensure the event notification depends on Lambda permission to prevent creation failures.

### Lambda Transaction Processor

Create a Lambda function in Python 3.11 that validates uploaded transaction files against predefined schemas, processes valid records by extracting transaction details, and writes processed data to DynamoDB with proper error handling for invalid records. Configure 512 MB memory, 300-second timeout, and ARM architecture (arm64) for cost optimization using Graviton2 processors. Set reserved concurrent executions to 100 to prevent throttling while leaving unreserved capacity for other functions, and enable X-Ray tracing for distributed request tracking. Package using the archive_file data source with filename processor_function.py, define environment variables for the DynamoDB table name and SQS queue URL encrypted with KMS, and add explicit depends_on to both the IAM role and all policy attachments to handle eventual consistency. The IAM role must use least privilege with specific permissions for S3 GetObject on the transactions bucket only, DynamoDB PutItem on the transactions table ARN, SQS SendMessage to the DLQ ARN, CloudWatch Logs creation, and X-Ray trace segments, plus explicit deny statements for s3:DeleteBucket and dynamodb:DeleteTable actions.

### DynamoDB Transaction Storage

Create a DynamoDB table for processed transaction records using on-demand billing mode with partition key "transaction_id" of type String and sort key "timestamp" of type Number. Enable point-in-time recovery for data protection, configure server-side encryption using a dedicated customer-managed KMS key, and set deletion_protection_enabled to false for testing cleanup. Add a global secondary index on "status" attribute for querying transactions by processing status, and ensure the table name is exposed as an environment variable to the Lambda processor function.

### SQS Error Handling with Dead Letter Queue

Set up a primary SQS queue for failed processing attempts with a dead letter queue for messages that fail repeatedly after retry attempts. Configure the main queue with 300-second visibility timeout matching Lambda timeout, 14-day message retention, and KMS encryption using a dedicated customer-managed key. Create the DLQ first with the same encryption and retention settings, then configure the main queue's redrive policy with maxReceiveCount set to 3 allowing three retry attempts before moving messages to the DLQ. Both queues need KMS key policies allowing SQS service principal to use GenerateDataKey and Decrypt permissions.

### Lambda DLQ Processor

Create a second Lambda function in Python 3.11 that consumes messages from the dead letter queue, extracts error details and original transaction data, and stores comprehensive error records in a separate DynamoDB errors table for audit and analysis. Configure 512 MB memory, 300-second timeout, ARM architecture, and X-Ray tracing identical to the transaction processor. Set reserved concurrent executions to 50 since DLQ processing is lower volume, package using archive_file with filename dlq_processor_function.py, and define environment variables for the errors table name encrypted with KMS. Create an SQS event source mapping connecting the DLQ to this Lambda with batch size 10 for efficient processing. The IAM role needs least privilege permissions for SQS ReceiveMessage and DeleteMessage on the DLQ ARN only, DynamoDB PutItem on the errors table ARN, CloudWatch Logs creation, and X-Ray permissions, with explicit deny for s3:DeleteBucket and dynamodb:DeleteTable.

### DynamoDB Errors Table

Create a DynamoDB table for error records using on-demand billing with partition key "error_id" of type String and sort key "timestamp" of type Number. Enable point-in-time recovery, configure server-side encryption using the same DynamoDB KMS key as the transactions table, and set deletion_protection_enabled to false for testing. Add a global secondary index on "transaction_id" attribute to correlate errors with original transactions across both tables.

### CloudWatch Monitoring and Alarming

Create separate log groups for the transaction processor and DLQ processor Lambda functions with retention_in_days set to 30 and KMS encryption enabled using a dedicated CloudWatch KMS key. Implement CloudWatch alarms that trigger when the transaction processor Lambda error rate exceeds 1 percent over a five-minute evaluation period, and when DLQ message depth exceeds 100 messages indicating significant processing failures. Configure both alarms to transition to ALARM state after two consecutive breaches and publish notifications to an SNS topic for operational alerting. Create a CloudWatch dashboard displaying key metrics including transaction processing rate, Lambda invocation counts, error rates by function, DLQ message depth over time, DynamoDB consumed capacity units, and average processing latency with five-minute granularity for real-time operational visibility.

### KMS Encryption Infrastructure

Create three customer-managed KMS keys for S3 bucket encryption, DynamoDB table encryption, and Lambda environment variable plus SQS plus CloudWatch Logs encryption. Each key must enable automatic rotation annually and include a key policy with root account access first to prevent lockouts, then grant service principals (s3.amazonaws.com, dynamodb.amazonaws.com, lambda.amazonaws.com, sqs.amazonaws.com, logs.amazonaws.com) the necessary GenerateDataKey and Decrypt permissions with conditions restricting usage to specific resource ARNs. Set deletion_window_in_days to seven for quick testing cleanup and create aliases like "alias/s3-transactions-dev", "alias/dynamodb-transactions-dev", "alias/lambda-encryption-dev" for easier reference in resource configurations.

### VPC Endpoints for Private Connectivity

Create VPC gateway endpoints for S3 and DynamoDB services to keep all traffic within the AWS network without traversing the public internet for enhanced security and reduced data transfer costs. The endpoints must be associated with route tables in private subnets where Lambda functions execute, though for this serverless architecture the Lambda functions themselves don't require VPC configuration since they access S3 and DynamoDB through these gateway endpoints automatically. Configure endpoint policies allowing full access to S3 and DynamoDB for simplicity in the development environment.

### SNS Notification Topic

Set up an SNS topic for CloudWatch alarm notifications with KMS encryption using the CloudWatch encryption key. Create an email subscription with address "devops-alerts@example.com" for manual confirmation which is acceptable for notification testing purposes. Configure the topic policy allowing CloudWatch service principal to publish alarm notifications and root account full access to prevent lockouts.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0). Include random provider for generating unique identifiers and archive provider for Lambda function packaging. Deploy all resources to eu-central-1 with default_tags applying Environment, DataClassification, Compliance, Owner, and ManagedBy tags automatically to all resources for cost allocation and governance. Define an environment variable with type string and default "dev" for resource naming and environment differentiation across workspaces.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "lambda-transaction-processor-dev" or "dynamodb-transactions-dev". S3 buckets need AWS account ID appended for global uniqueness like "s3-transactions-dev-ACCOUNT_ID" retrieved using data.aws_caller_identity.current. Don't use random_string resources in naming since that causes integration test failures and resource recreation on every apply.

## Data Source Restrictions

Only use data.aws_caller_identity.current for account ID retrieval, data.aws_region.current for region name, data.aws_availability_zones.available for availability zone selection, and data.archive_file.lambda_zip for Lambda function packaging with separate archives for processor_function.py and dlq_processor_function.py. Don't use data sources referencing existing infrastructure like data.aws_vpc, data.aws_subnet, or data.aws_security_group—create all resources fresh within this Terraform configuration for isolated testing.

## File Organization

Structure with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags, and variable definitions. The lib/main.tf file contains all data sources, KMS encryption keys with service principal permissions, S3 bucket with event notifications and lifecycle policy, two Lambda functions with IAM roles and reserved concurrency, two DynamoDB tables with GSI indexes, SQS main queue and DLQ with redrive policy, Lambda event source mapping for DLQ consumption, VPC endpoints for S3 and DynamoDB, CloudWatch log groups with 30-day retention, CloudWatch alarms for error rate and DLQ depth, CloudWatch dashboard with processing metrics, SNS topic with email subscription, and comprehensive outputs with minimum 37-40 total. Create lib/processor_function.py with the transaction validation and processing handler implementing schema validation, DynamoDB writes, and error handling with SQS publishing for invalid records. Create lib/dlq_processor_function.py with the DLQ message consumer implementing error extraction, analysis, and storage in the errors table with detailed failure context.

## Cleanup Configuration

Set force_destroy to true on the S3 bucket, deletion_window_in_days to seven on all three KMS keys, retention_in_days to 30 on both CloudWatch log groups, and deletion_protection_enabled to false on both DynamoDB tables. Configure SQS queues with standard settings that allow clean deletion, and ensure Lambda functions have no lifecycle prevent_destroy. All other resources delete cleanly without special configuration ensuring complete terraform destroy success for testing workflows.

## Integration Testing Outputs

Provide comprehensive outputs for all resources including KMS key IDs and ARNs (6 outputs for 3 keys), S3 bucket name and ARN (2 outputs), Lambda function names, ARNs, and role ARNs (6 outputs for 2 functions), DynamoDB table names and ARNs (4 outputs for 2 tables), SQS queue URLs and ARNs (4 outputs for main queue and DLQ), CloudWatch log group names (2 outputs), CloudWatch alarm names (2 outputs), CloudWatch dashboard name (1 output), SNS topic ARN (1 output), VPC endpoint IDs (2 outputs for S3 and DynamoDB). Mark Lambda environment variable outputs and DynamoDB table endpoints as sensitive. Tests require outputs for every created resource to validate configurations with minimum 37-40 total outputs covering all infrastructure components for end-to-end validation of the serverless processing pipeline.