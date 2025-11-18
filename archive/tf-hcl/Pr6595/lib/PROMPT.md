# Payment Processing Workflow Orchestration System

## Business Context

Hey, we're building a payment processing workflow orchestration system for our fintech startup that handles 2,000 daily transactions with proper retry logic and complete visibility into each payment's lifecycle. The system needs to validate payments, process them sequentially, handle failures gracefully with automatic retries, and alert us when issues require manual intervention. **We'll use Terraform with HCL** to create this serverless workflow infrastructure in us-east-1.

## Technical Requirements

### Step Functions State Machine

Create a Standard workflow state machine that orchestrates the complete payment lifecycle through sequential validation and processing stages. The state machine definition should use Task states to invoke the validation Lambda function first, then the processing Lambda function upon successful validation. Include Retry blocks with exponential backoff (IntervalSeconds of two seconds, MaxAttempts of three, BackoffRate of two) on both Lambda task states to handle transient failures automatically. Add Catch blocks that transition to a failure notification state when retries are exhausted, publishing details to the SNS topic. Use a Pass state for successful completion that updates the transaction status. Configure the state machine with CloudWatch Logs integration and set a reasonable execution timeout. The IAM role for Step Functions needs permissions to invoke both Lambda functions, publish to SNS, and write to CloudWatch Logs.

### Lambda Functions

Create two Python 3.11 Lambda functions—one for payment validation and one for payment processing. The validation function receives transaction details, validates payment method information, checks for fraud indicators, and updates the DynamoDB table with validation results. The processing function executes the actual payment transaction, handles payment gateway communication, and records the final transaction state. Configure both functions with 256 MB memory and 300-second timeout to accommodate potential payment gateway delays. Set environment variables for the DynamoDB table name and SNS topic ARN. Package both functions using the archive_file data source with proper handler configuration (lambda_function.lambda_handler). Don't place Lambda functions in a VPC since DynamoDB and SNS are accessible via public AWS endpoints. Add explicit depends_on to both the IAM role and policy attachments to handle eventual consistency.

### DynamoDB Table

Set up a DynamoDB table for transaction state management using on-demand billing mode to handle unpredictable startup traffic patterns. Define transaction_id as the partition key (String type) to uniquely identify each payment transaction. Include attributes for payment_amount, payment_method, customer_id, validation_status, processing_status, and timestamps. Enable point_in_time_recovery since this is financial data requiring comprehensive backup capabilities. Configure server-side encryption using a customer-managed KMS key with the key policy allowing the DynamoDB service principal to generate data keys and decrypt. Set deletion_protection_enabled to false for testing teardown. The table stores the complete transaction lifecycle from initial submission through validation, processing, and final state.

### SNS Notifications

Create an SNS topic for payment processing failure notifications that alerts the operations team when workflows fail after exhausting retry attempts. Configure KMS encryption for message security using a dedicated SNS encryption key. Don't create email subscriptions since those require manual confirmation—tests will verify the topic configuration only. The Step Functions state machine publishes detailed failure information including transaction_id, error type, and failure timestamp to this topic. Set up a topic policy allowing the Step Functions execution role to publish messages.

### CloudWatch Monitoring

Create separate log groups for the validation Lambda, processing Lambda, and Step Functions state machine with retention_in_days set to one for testing. Implement CloudWatch alarms monitoring Step Functions ExecutionsFailed metric that triggers when failures exceed two in a five-minute period. Add alarms for both Lambda functions monitoring Errors and Throttles metrics. Configure alarm actions to publish to the SNS topic for operational visibility. Set up a custom metric filter on the Step Functions log group to track payment processing duration and create an alarm if average duration exceeds 120 seconds indicating payment gateway performance issues.

### IAM Roles and Policies

Create three IAM roles following least privilege—one for the Step Functions state machine and one for each Lambda function. The Step Functions role needs permissions to invoke both Lambda functions (lambda:InvokeFunction), publish to SNS (sns:Publish), and write to CloudWatch Logs. The validation Lambda role requires DynamoDB permissions (dynamodb:PutItem, dynamodb:UpdateItem, dynamodb:GetItem) scoped to the transactions table, KMS decrypt permissions for the DynamoDB encryption key, and CloudWatch Logs permissions. The processing Lambda role needs identical DynamoDB and KMS permissions plus SNS publish permissions for failure notifications. Define all policies using aws_iam_policy_document data sources referencing specific resource ARNs rather than wildcards. Attach the AWSLambdaBasicExecutionRole managed policy to both Lambda roles for CloudWatch Logs integration.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0). Include random provider for generating unique suffixes and archive provider for Lambda function packaging. Deploy all resources to us-east-1 with default_tags applying Environment, Owner, CostCenter, and DataClassification tags automatically. Define an environment variable with type string and default "dev" for resource naming consistency.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "sfn-payment-workflow-dev", "lambda-payment-validation-dev", "lambda-payment-processing-dev", and "dynamodb-transactions-dev". The DynamoDB table name should append the environment suffix for uniqueness. Don't use random_string resources in naming since that causes integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for account ID, data.aws_region.current for region name, and data.archive_file for Lambda packaging. Define IAM policies using aws_iam_policy_document data sources for proper resource references. Don't use data sources referencing existing infrastructure—create all resources fresh.

## File Organization

Structure with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags, variable definitions, and data sources for caller identity and region. The lib/main.tf file contains KMS keys for DynamoDB/SNS/CloudWatch encryption, the DynamoDB table, SNS topic, CloudWatch log groups and alarms, IAM roles and policies with proper dependencies, both Lambda functions with archive packaging, the Step Functions state machine definition using jsonencode(), and comprehensive outputs. Create lib/lambda_validation.py with the payment validation handler that checks transaction details and updates DynamoDB. Create lib/lambda_processing.py with the payment processing handler that executes transactions and records final state.

## Cleanup Configuration

Set deletion_window_in_days to seven on all KMS keys, deletion_protection_enabled to false on the DynamoDB table, and retention_in_days to one on all CloudWatch log groups. All other resources including Lambda functions, Step Functions state machine, SNS topic, and IAM roles delete cleanly without special configuration.

## Integration Testing Outputs

Provide comprehensive outputs including the Step Functions state machine ARN and name, both Lambda function names and ARNs, both Lambda IAM role ARNs, DynamoDB table name and ARN, SNS topic ARN, all CloudWatch log group names, all CloudWatch alarm names and ARNs, and all KMS key IDs and ARNs. Tests require outputs for the state machine to trigger test executions, Lambda functions for configuration validation, DynamoDB table for state verification, and CloudWatch resources for monitoring validation with minimum 30 total outputs.