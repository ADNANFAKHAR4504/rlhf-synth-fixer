# Event-Driven Payment Processing Pipeline with SQS FIFO Queues

## Business Context

Hey, we're building an asynchronous payment processing system for a fintech startup that handles credit card transactions at scale. The business need is straightforward but critical: we need to process payment transactions through multiple validation stages without blocking the main payment API, and we need strict ordering guarantees to ensure that transactions from the same merchant are always processed in sequence. Right now, synchronous processing creates bottlenecks during peak traffic, and we're seeing timeout issues when fraud detection takes longer than expected.

## Technical Requirements

### SQS FIFO Queue Configuration

Create three primary SQS FIFO queues named transaction-validation, fraud-detection, and payment-notification. Each queue must be configured as a FIFO queue with content-based deduplication enabled so that duplicate transactions submitted within the five-minute deduplication window are automatically ignored. Set the maximum message size to exactly two hundred fifty-six kilobytes to accommodate detailed transaction payloads including metadata, merchant information, and customer details. Configure the visibility timeout to three hundred seconds since fraud detection processing can take up to four minutes in worst-case scenarios, and we need enough time for Lambda to complete processing before the message becomes visible again.

Set message retention period to exactly seven days for audit compliance requirements. This ensures we can investigate failed transactions and replay messages from dead letter queues even several days after the original processing attempt. Enable server-side encryption using AWS-managed SQS keys rather than customer-managed KMS keys to keep costs down while still encrypting data at rest. Configure each queue with a message group ID strategy where the group ID equals the merchant account number, ensuring all transactions from the same merchant are processed sequentially while transactions from different merchants can be processed in parallel.

Create three dead letter queues, also as FIFO queues, named transaction-validation-dlq, fraud-detection-dlq, and payment-notification-dlq. Attach a redrive policy to each primary queue with maxReceiveCount set to exactly three, meaning after three failed processing attempts the message automatically moves to the dead letter queue. This prevents poison messages from blocking queue processing while preserving failed messages for investigation. Dead letter queues need the same FIFO configuration as their primary queues to maintain message ordering even for failed messages.

Configure queue policies for each primary queue that allow the corresponding Lambda execution role to perform sqs:ReceiveMessage, sqs:DeleteMessage, and sqs:GetQueueAttributes actions. Include an explicit allow statement for the root account principal at the beginning of the policy to prevent lockout scenarios. Don't include conditions based on VPC endpoints or IP addresses since Lambda functions run in the standard AWS environment without VPC attachment. EventBridge Pipes also needs sqs:SendMessage permission on downstream queues, so the fraud-detection queue policy must allow the validation-to-fraud pipe to send messages, and the payment-notification queue policy must allow the fraud-to-notification pipe.

### EventBridge Pipes for Queue-to-Queue Forwarding

Create two EventBridge Pipes to handle automatic message forwarding between processing stages. The first pipe named validation-to-fraud connects the transaction-validation queue as the source to the fraud-detection queue as the target. The second pipe named fraud-to-notification connects the fraud-detection queue to the payment-notification queue. EventBridge Pipes provides native SQS-to-SQS integration without requiring custom Lambda code for message forwarding.

Configure each pipe with an IAM role that grants sqs:ReceiveMessage and sqs:DeleteMessage permissions on the source queue, plus sqs:SendMessage permission on the target queue. The pipe automatically polls the source queue, retrieves messages, and forwards them to the target queue while maintaining FIFO ordering by preserving the original message group ID. Don't configure any filtering or transformation in the pipes—messages should flow through unchanged so that each Lambda function receives the complete original payload.

Set the pipe's maximum batching window to zero seconds and batch size to one message since we're processing FIFO queues where ordering is critical. Larger batch sizes could introduce reordering within a batch. Each pipe needs its own IAM execution role since they access different queue combinations. Create explicit depends_on relationships so pipes are only created after their source and target queues exist.

### Lambda Functions for Message Processing

Create three Lambda functions named transaction-validator, fraud-detector, and notification-dispatcher, all using Python three point eleven runtime. Set memory allocation to five hundred twelve megabytes for each function since boto3 operations against DynamoDB and SNS require adequate memory. Configure timeout to three hundred seconds matching the queue visibility timeout, giving functions enough time to complete processing even during DynamoDB throttling or SNS delays.

Each Lambda function needs an IAM execution role with permissions scoped to only the resources it accesses. The transaction-validator role needs sqs:ReceiveMessage on the transaction-validation queue, dynamodb:PutItem on the payment-transactions table, and logs:CreateLogStream plus logs:PutLogEvents for CloudWatch Logs. The fraud-detector role needs the same SQS permission for its queue, dynamodb:UpdateItem for updating transaction state, and the same logging permissions. The notification-dispatcher role needs SQS access to its queue, dynamodb:GetItem to read transaction details, sns:Publish to send notifications, and logging permissions.

Create CloudWatch Log Groups for each function before creating the functions themselves, with retention set to exactly seven days to match the task constraints. Name the log groups using the AWS Lambda convention of slash aws slash lambda slash function-name. Creating log groups explicitly in Terraform lets us set retention, whereas if Lambda auto-creates them they default to infinite retention which becomes expensive. Add explicit depends_on from each Lambda function to its corresponding IAM role and role policy attachment to handle IAM eventual consistency.

Configure SQS event source mappings for each Lambda function connecting them to their respective queues. Set batch size to one message since we're using FIFO queues and want to maintain strict ordering. Enable function_response_types set to ReportBatchItemFailures so Lambda can selectively fail individual messages within a batch rather than failing the entire batch. Set maximum_batching_window_in_seconds to zero for immediate processing. The event source mapping automatically handles message deletion after successful processing and respects the queue's visibility timeout for retry logic.

Package each Lambda function's Python code into a zip file using the archive provider. Create three separate Python files named transaction_validator.py, fraud_detector.py, and notification_dispatcher.py in the lib directory. Each file must contain a function named lambda_handler that accepts event and context parameters. The archive data source for each function should specify the source file path and output path for the zip file, with output_file_mode set to preserve file permissions.

### DynamoDB Table for Transaction State

Create a DynamoDB table named payment-transactions with a partition key called transaction_id of type string. Add a global secondary index named customer-id-index with customer_id as the partition key, allowing queries by customer in addition to direct lookups by transaction ID. Use on-demand billing mode rather than provisioned capacity since transaction volume in testing is unpredictable and on-demand is more cost-effective for sporadic workloads.

Enable server-side encryption using the AWS-managed DynamoDB encryption key. This provides encryption at rest without the cost and complexity of customer-managed KMS keys. Set deletion_protection_enabled to false since this is test infrastructure that needs clean terraform destroy capability. Enable point-in-time recovery for the table even in testing since it provides backup capability at minimal cost and demonstrates production best practices.

Configure the table with a time-to-live attribute named ttl that Lambda functions can set when writing items. This allows automatic cleanup of old transaction records after a specified period without requiring manual deletion. Add all standard tags including Environment, Team, CostCenter, and ManagedBy for cost allocation tracking.

### SNS Topic for Payment Notifications

Create an SNS topic named payment-notifications with display name set to Payment Processing Notifications. Enable server-side encryption using the AWS-managed SNS key to encrypt messages at rest and in transit within AWS. Create an SNS topic policy that allows the notification-dispatcher Lambda execution role to publish messages, and include the root account allow statement at the beginning of the policy to prevent lockout.

Add an SNS email subscription to the topic using a variable for the email address since this will vary by environment and user. The subscription will initially be in PendingConfirmation status requiring the user to click the confirmation link in the email they receive. This is expected and acceptable since it's a one-time manual step that doesn't block infrastructure deployment. Mark the email variable as sensitive in the Terraform configuration and document that users need to confirm the subscription after deployment.

### CloudWatch Alarms for Queue Monitoring

Create six CloudWatch metric alarms for monitoring queue health. For each of the three primary queues, create an alarm that triggers when ApproximateNumberOfMessagesVisible exceeds one thousand messages, evaluated over a five-minute period with one evaluation period. This indicates that message processing is falling behind message arrival rate and requires investigation. Name these alarms with a pattern like queue-name-depth-alarm.

For each of the three dead letter queues, create an alarm that triggers when ApproximateNumberOfMessagesVisible is greater than zero, evaluated over one minute with one evaluation period. Any messages in a dead letter queue indicates failed processing that needs immediate attention. Name these alarms like queue-name-dlq-alarm. Configure all alarms to transition to ALARM state when the threshold is breached.

Don't configure SNS actions for the alarms in the Terraform code since notification preferences vary by environment. In production these would publish to an SNS topic for the operations team, but for testing we just need the alarms to exist and report their state correctly. The alarms will appear in the CloudWatch console showing OK or ALARM state based on actual queue metrics.

### SSM Parameters for Configuration Management

Create three SSM Parameter Store parameters to hold the queue URLs for the three primary queues. Name them slash payment-pipeline slash transaction-validation-queue-url, slash payment-pipeline slash fraud-detection-queue-url, and slash payment-pipeline slash payment-notification-queue-url. Use standard tier parameters rather than advanced tier since we're storing simple string values under four kilobytes and don't need parameter policies or higher throughput.

Set the type to String for each parameter and the value to the queue URL from the corresponding SQS queue resource. Add descriptions explaining what each parameter contains. Lambda functions will read these parameters at startup using boto3 get_parameter calls to dynamically configure which queues they interact with. This pattern allows queue URLs to change without requiring Lambda function updates.

### IAM Roles and Least Privilege Policies

Create separate IAM roles for each Lambda function rather than sharing a single role across all functions. This follows the principle of least privilege where each function only has permissions for the specific resources it accesses. Name the roles transaction-validator-role, fraud-detector-role, and notification-dispatcher-role.

Each role needs an assume role policy that allows the Lambda service principal lambda.amazonaws.com to assume it. Attach an inline policy to each role that grants the minimum permissions needed. The transaction-validator policy allows sqs:ReceiveMessage, sqs:DeleteMessage, and sqs:GetQueueAttributes on only the transaction-validation queue ARN, dynamodb:PutItem on only the payment-transactions table ARN, and logs:CreateLogStream plus logs:PutLogEvents on only its specific log group ARN. Don't use wildcard resources or wildcard actions in any policy.

The fraud-detector policy needs the same SQS actions on the fraud-detection queue, dynamodb:UpdateItem on the table, and the same logging permissions. The notification-dispatcher policy needs SQS actions on its queue, dynamodb:GetItem on the table, sns:Publish on only the payment-notifications topic ARN, and logging permissions. Create explicit depends_on relationships from the role policy attachments to the resources they reference to ensure resources exist before policies reference their ARNs.

EventBridge Pipes each need their own IAM execution role. The validation-to-fraud pipe role needs sqs:ReceiveMessage and sqs:DeleteMessage on the transaction-validation queue, and sqs:SendMessage on the fraud-detection queue. The fraud-to-notification pipe role needs the same pattern for its queue pair. These roles don't need logging permissions since EventBridge Pipes handles its own logging.

### Resource Naming and Tagging Strategy

All resources must follow a deterministic naming pattern without random suffixes. Use simple descriptive names without environment suffixes or resource-type
prefixes. For example, SQS queues are named transaction-validation.fifo, 
Lambda functions are named transaction-validator, and IAM roles are named 
transaction-validator-role. For example, the transaction validation queue should be named queue-transaction-validation-dev. The exception is S3 buckets if any are needed, which require globally unique names and should append the AWS account ID. Don't use random_string resources in the naming pattern since this causes integration test failures when tests can't predict resource names.

Apply a consistent set of tags to all resources using the provider's default_tags configuration. Include Environment set to the environment variable, Team set to Platform Engineering, CostCenter set to Engineering, and ManagedBy set to Terraform. Individual resources can add additional specific tags like QueueType for SQS resources or FunctionPurpose for Lambda functions.

### Terraform Dependencies and Gotchas

Several resources require explicit depends_on to handle AWS eventual consistency and dependency chains. Each Lambda function must depend on both its IAM role and its IAM role policy attachment since Lambda creation fails if the role isn't fully propagated through IAM. CloudWatch Log Groups should be created before Lambda functions so Terraform can set retention and Lambda doesn't auto-create them with default settings.

SQS queue policies must be created after the queues exist but before EventBridge Pipes or Lambda event source mappings try to access them. EventBridge Pipes must be created after both their source and target queues exist. Lambda event source mappings must be created after both the Lambda function and the SQS queue exist.

The archive data sources that create zip files from Python code need to specify the source directory, output path, and type set to zip. They should exclude the underscore underscore pycache underscore underscore directory and any dot pyc files to keep the zip clean. Lambda functions reference the output_path from the archive data source as their filename argument.

SSM parameters should be created after the SQS queues they reference so the queue URLs are available. CloudWatch alarms should be created after the queues they monitor. There's no dependency between the three processing stages in terms of creation order since they're independent—all three Lambda functions and queues can be created in parallel.

### Security Configuration Requirements

Set recovery_window_in_days to zero for any Secrets Manager secrets if added later, allowing immediate deletion during testing rather than the default thirty-day waiting period. CloudWatch Log Groups must have retention_in_days set to seven rather than infinite retention to control costs.

For SQS queues, don't configure queue policies with VPC endpoint requirements or IP address restrictions since this would lock out Terraform and CI/CD tooling. The queue policies should allow actions based on IAM principal ARNs, not network location. Include the root account exception at the beginning of each resource policy following the pattern of an Allow statement for the root account ARN with all actions on the resource.

Encryption should use AWS-managed keys for SQS, DynamoDB, and SNS rather than customer-managed KMS keys. This provides encryption at rest without the operational overhead of key rotation and permission management. Lambda functions don't need encryption configuration since Lambda always encrypts environment variables and code packages at rest.

## Provider Configuration

The infrastructure requires Terraform version one point five or higher with AWS provider version constrained to the five point x series. Include the random provider for any unique identifier generation and the archive provider for packaging Lambda function code into zip files. Configure the AWS provider for the us-east-one region with default tags that apply to all resources automatically.

Define variables for environment defaulting to dev, email_address for the SNS subscription marked as sensitive, and cloudwatch_retention_days defaulting to seven. The environment variable gets used in resource naming and tags, while the email address variable is required for SNS subscription creation. Use data sources only for aws_caller_identity to get the account ID, aws_region to get the current region name, and aws_availability_zones to list available zones if needed for any resources requiring zone placement.

## File Organization

Structure the implementation with lib/provider.tf containing the Terraform version constraints, all required provider declarations with version pins, the AWS provider configuration with region and default tags, and all variable definitions with types, descriptions, and defaults. The lib/main.tf file contains all infrastructure resources in logical grouping order, starting with data sources, then IAM roles and policies, followed by SQS queues and queue policies, then EventBridge Pipes, Lambda layers if needed, Lambda functions with their event source mappings and permissions, DynamoDB table, SNS topic and subscription, CloudWatch Log Groups and alarms, SSM parameters, archive data sources for zipping Lambda code, and finally comprehensive outputs at the end.

Create three separate Python files in the lib directory named transaction_validator.py, fraud_detector.py, and notification_dispatcher.py. Each file contains a lambda_handler function that accepts event and context parameters, parses the SQS message from the event, performs its specific processing logic, interacts with DynamoDB and optionally SNS, includes comprehensive error handling with try-except blocks, logs all operations to CloudWatch Logs using Python's logging module, and returns success or raises exceptions for failure cases.

The transaction validator function extracts transaction details from the SQS message, validates required fields are present, checks data types and ranges, writes a new item to DynamoDB with transaction state set to validated, and returns success. The fraud detector function reads the message, calculates a fraud score based on transaction patterns, updates the existing DynamoDB item with the fraud score and state set to fraud-checked, and returns the score. The notification dispatcher function reads the message, retrieves full transaction details from DynamoDB, formats a notification message, publishes to the SNS topic, updates DynamoDB state to notified, and returns confirmation.

## Outputs

Every resource created must have corresponding outputs to enable automated integration testing. These outputs get exported to a flat JSON file that tests consume to validate infrastructure. Group outputs logically by resource type for clarity.

For SQS queues output the URL and ARN for each of the six queues—three primary and three dead letter queues. Name these outputs like transaction_validation_queue_url, transaction_validation_queue_arn, transaction_validation_dlq_url, and transaction_validation_dlq_arn, repeating the pattern for fraud detection and payment notification queues. Include descriptions for each output explaining what queue it represents.

For Lambda functions output the function name, function ARN, and role ARN for each of the three functions. Tests need the function name to invoke functions, the function ARN to verify configuration, and the role ARN to validate IAM permissions. Output names should follow the pattern transaction_validator_function_name, transaction_validator_function_arn, and transaction_validator_role_arn.

For the DynamoDB table output the table name, table ARN, and the GSI name. For SNS output the topic ARN and subscription ARN with the subscription ARN marked as sensitive since it contains the email address. For EventBridge Pipes output the ARN for each pipe. For CloudWatch output the log group names as a list containing all three log group names, and output the alarm names as lists grouped by alarm type.

For SSM parameters output the parameter names as a list and parameter ARNs as a list. Include metadata outputs for environment, region from the data source, and account_id from the caller identity data source. The total output count should be thirty-five to forty outputs ensuring tests can validate every resource's existence and configuration. Mark any outputs containing email addresses, queue URLs, or endpoints as sensitive to prevent them from appearing in logs.