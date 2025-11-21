# Asynchronous Financial Transaction Processing Pipeline with SQS FIFO

## Business Context

Hey, we're building message processing infrastructure for a fintech startup handling millions of daily payment transactions through their mobile app. The system needs asynchronous queues for transaction validation, fraud detection, and notification dispatch with guaranteed message ordering per customer to prevent race conditions during peak market hours. **We'll use Terraform with HCL** to create this production-grade message processing infrastructure in us-east-1.

## Technical Requirements

### SQS FIFO Queues

Create three FIFO SQS queues named transaction-validation.fifo, fraud-detection.fifo, and notification-dispatch.fifo with content-based deduplication enabled and a five-minute deduplication interval. Configure each queue with message retention of exactly seven days (604800 seconds) for audit compliance, maximum message size of 256 KB (262144 bytes) for transaction payloads, and visibility timeout of 300 seconds to accommodate Lambda processing time. Enable long polling with receive wait time of twenty seconds to reduce API calls and costs. Set deduplication scope to messageGroup and FIFO throughput limit to perMessageGroupId allowing 300 transactions per second per customer. Enable server-side encryption using AWS managed keys (SSE-SQS) by setting sqs_managed_sse_enabled to true. Configure tags for cost allocation including Environment, Department, Application, and ManagedBy. Note that message group IDs are set by application code when Lambda functions send messages using customer ID as the group identifier, not configured in Terraform.

### Dead Letter Queues

Create three corresponding dead letter queues with the .dlq.fifo suffix for transaction-validation.dlq.fifo, fraud-detection.dlq.fifo, and notification-dispatch.dlq.fifo using identical FIFO configurations as the main queues. Configure redrive policies on each main queue linking to their respective DLQ with maxReceiveCount set to three, allowing messages to be retried three times before moving to the dead letter queue. Use explicit depends_on to ensure DLQs are created before main queues reference them in redrive policies. Apply the same encryption, retention, and tagging configuration to DLQs as main queues.

### SNS Topic for Alarm Notifications

Create an SNS topic named transaction-processing-alarms with a descriptive display name for CloudWatch alarm notifications. Configure an email subscription to the topic using the email address ops-team@example.com for the operations team to receive critical alerts about queue depth and processing failures. Note that email subscriptions require manual confirmation which is acceptable for notification testing. Set up a topic policy allowing cloudwatch.amazonaws.com service principal to publish messages to the topic. Apply standard resource tags including Environment, Department, Application, and ManagedBy for consistency.

### CloudWatch Monitoring

Create CloudWatch alarms for each of the three main queues monitoring the ApproximateNumberOfMessagesVisible metric with a threshold exceeding ten thousand messages, one datapoint within one evaluation period, and alarm actions publishing to the SNS topic created above. Set up additional alarms for each dead letter queue triggering when ApproximateNumberOfMessagesVisible exceeds zero indicating processing failures requiring immediate attention. Build a CloudWatch dashboard named financial-transaction-processing-dashboard containing six metric widgets organized in a two-column layout with three rows. Each widget should display time series line graphs for ApproximateNumberOfMessagesVisible and ApproximateAgeOfOldestMessage metrics with five-minute periods covering the last three hours. The first row shows transaction-validation queue and DLQ, second row shows fraud-detection queue and DLQ, and third row shows notification-dispatch queue and DLQ with y-axis labels and legends enabled.

### IAM Roles and Policies

Create an IAM role named lambda-sqs-processor-role for Lambda function execution with an assume role policy allowing lambda.amazonaws.com service principal. Define an IAM policy named sqs-message-processing-policy granting specific permissions including sqs:ReceiveMessage, sqs:DeleteMessage, sqs:SendMessage, sqs:DeleteMessageBatch, sqs:GetQueueAttributes, and sqs:GetQueueUrl with resources restricted to the specific ARNs of all six queues using references to the created queue resources. Attach the policy to the Lambda execution role and add explicit depends_on between the role, policy, and attachment resources to handle IAM eventual consistency. Include CloudWatch Logs permissions allowing logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents restricted to log group resources with the ARN pattern matching arn:aws:logs:REGION:ACCOUNT_ID:log-group:/aws/lambda/* for Lambda function logging.

### Queue Access Policies

Implement queue policies on each main queue and DLQ restricting access to the current AWS account ID using data.aws_caller_identity.current.account_id. Configure the policy to allow sqs:SendMessage, sqs:ReceiveMessage, and sqs:DeleteMessage actions only from principals within the same account preventing unauthorized cross-account access. Use aws_iam_policy_document data source to build the policy JSON with proper account ID references and AWS service principal conditions rather than hardcoding values.

## Provider Configuration

Configure Terraform version 1.5 or higher with AWS provider version constrained to 5.x using the pessimistic version operator (~> 5.0). Deploy all resources to us-east-1 region with default_tags applying Environment set to dev, Department set to payments, Application set to transaction-processing, and ManagedBy set to terraform automatically to all resources. Define an environment variable with type string and default value dev for resource naming and a region variable with type string and default value us-east-1.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for IAM roles and policies like lambda-sqs-processor-dev and sqs-message-processing-dev. For FIFO queues, use descriptive names matching business functions like transaction-validation.fifo, fraud-detection.fifo, and notification-dispatch.fifo with corresponding DLQs using the .dlq.fifo suffix. CloudWatch alarms should use the pattern {queue-name}-high-depth-alarm and {queue-name}-dlq-alarm, the dashboard should be named financial-transaction-processing-{environment}, and the SNS topic should be named transaction-processing-alarms-{environment}. Don't use random_string resources in naming since that causes integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for retrieving AWS account ID in queue policies and IAM policy documents, data.aws_region.current for region name in ARN construction, and data.aws_iam_policy_document for building IAM policies with proper JSON formatting. Don't use data sources referencing existing infrastructure like existing queues, VPCs, SNS topics, or roles since all resources must be created fresh by this configuration.

## File Organization

Structure the configuration with lib/provider.tf containing Terraform required version (>= 1.5), AWS provider configuration (~> 5.0) with region and default_tags, and all variable definitions including environment and region. Create lib/main.tf containing data sources for caller identity and region, the SNS topic and email subscription, all six SQS queue resources (three main queues and three DLQs), redrive policy configurations, queue access policies using policy documents, IAM role and policy resources with attachments, CloudWatch alarm resources for all six queues referencing the SNS topic, the CloudWatch dashboard resource with JSON body configuration for all widgets, and comprehensive outputs with minimum thirty outputs including all queue URLs, ARNs, IAM role ARN, policy ARNs, SNS topic ARN, alarm ARNs, and dashboard name.

## Cleanup Configuration

SQS queues, SNS topics, CloudWatch alarms, CloudWatch dashboards, and IAM roles delete cleanly without requiring special force_destroy or deletion protection settings. Set message retention to seven days (604800 seconds) on all queues for audit compliance during active use. Ensure no lifecycle blocks with prevent_destroy are added to any resources. All resources will be completely removed during terraform destroy with no manual cleanup steps required beyond the expected SNS email subscription confirmation which can be ignored.

## Integration Testing Outputs

Provide comprehensive outputs including queue URLs and ARNs for each of the three main queues and their corresponding dead letter queues (twelve outputs total), the Lambda execution role ARN, the SQS message processing policy ARN, the SNS topic ARN for alarm notifications, CloudWatch alarm ARNs for all six high-depth alarms monitoring both main queues and DLQs (six alarm outputs), the CloudWatch dashboard name, AWS account ID, and deployment region. Include descriptions on all outputs explaining their purpose and mark sensitive outputs appropriately. Tests require outputs for every resource to validate FIFO configuration, encryption settings, redrive policies, IAM permissions, SNS integration, and monitoring setup with minimum thirty total outputs.