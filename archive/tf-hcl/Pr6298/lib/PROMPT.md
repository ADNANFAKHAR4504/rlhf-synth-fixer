Hey, we need to build a real-time event processing system for our financial services platform that handles market data events from multiple sources. Right now we're dealing with unpredictable loads—sometimes we get ten thousand events per minute during market volatility, other times it's quiet—and we need a system that scales automatically without paying for idle capacity. The business impact is significant: delayed processing means our traders get stale data, which can cost millions in missed opportunities or bad trades.

Here's what we're building: a serverless event-driven architecture **using Terraform with HCL** that processes market data events through three stages—ingestion, processing, and notification. Events come into a custom EventBridge bus where routing rules direct them to the appropriate Lambda function based on event type and source. The ingestion Lambda validates and stores raw events in DynamoDB. The processing Lambda enriches the data, applies business rules, and updates the processed events table with global secondary indexes for fast queries. The notification Lambda handles alerts for critical events like price thresholds or unusual trading patterns. Every Lambda function has a dead letter queue to capture failures for later analysis, and we're using SNS to send email notifications for events that need human attention.

This pattern is used by companies like Robinhood for real-time stock trading event processing, Stripe for payment event handling and fraud detection, and Capital One for financial transaction processing and compliance monitoring. They all need the same thing: automatic scaling for variable loads, audit trails of every processed event, and resilient error handling. We're building the same foundation that powers event-driven financial systems at scale.

The architecture includes comprehensive observability from day one. X-Ray tracing gives us end-to-end visibility into event flow across Lambda invocations and AWS service calls. CloudWatch captures logs from all Lambda functions with seven-day retention for debugging and compliance. We're monitoring Lambda errors and throttles plus DynamoDB capacity consumption with CloudWatch alarms that publish to SNS when thresholds are exceeded. EventBridge archive stores all events for ninety days to meet compliance requirements and support event replay for recovery scenarios.

For security and configuration management, each Lambda function has its own IAM role with least privilege access—only the specific DynamoDB, SQS, SNS, and X-Ray permissions needed for its job. Environment variables like API endpoints and table names come from AWS Systems Manager Parameter Store, which Lambda functions read at runtime. DynamoDB tables use encryption at rest with AWS managed keys and point-in-time recovery for data protection. Reserved concurrent execution limits on each Lambda function prevent runaway costs and ensure critical functions always have capacity available.

The entire stack is serverless managed services, so there's no VPC networking, no EC2 instances to patch, no capacity planning. DynamoDB uses on-demand billing that auto-scales read and write capacity. Lambda scales from zero to thousands of concurrent executions automatically. EventBridge handles millions of events without configuration. Cost-wise, this architecture runs under fifteen dollars per month if cleanup fails—Lambda charges are pay per invocation, DynamoDB on-demand is pay per request, and most AWS services in this stack have generous free tiers. Deployment takes around ten minutes with everything creating in parallel, and terraform destroy cleanly removes all resources in about six minutes.

## Technical Requirements

### Lambda Functions

Create three Lambda functions with Python 3.11 runtime, one for each processing stage. The ingestion function receives events from EventBridge, validates the schema, and writes to the DynamoDB events table. The processing function enriches events with calculated fields like moving averages or volatility indicators and updates the events table with processed status. The notification function evaluates events against alert rules and publishes critical notifications to SNS.

Configure each Lambda with 256 MB memory allocation since the default 128 MB is too low for boto3 operations and DynamoDB SDK calls. Set timeout to 30 seconds to allow time for database operations and external calls—the default three-second timeout causes failures. Enable X-Ray active tracing on all three functions so we get distributed traces showing the complete event processing flow. Set reserved concurrent executions to 10 for each function to demonstrate capacity reservation without consuming account limits.

Configure a dead letter queue for each Lambda function using SQS standard queues. When a Lambda invocation fails after the maximum retry attempts, the event goes to the dead letter queue for later investigation. Set the dead letter target ARN in each Lambda function's configuration. Create separate CloudWatch log groups for each Lambda at paths `/aws/lambda/{function-name}` with retention set to seven days as specified in the constraints.

Use AWS Systems Manager Parameter Store for Lambda environment variables rather than hardcoding values. Create parameters for DynamoDB table names, SNS topic ARN, and any configuration values. Lambda functions read these parameters at runtime using the boto3 SSM client. This approach keeps configurations centralized and allows changes without redeploying Lambda code. Don't use Lambda layers for this implementation since boto3 is already included in the Python runtime—for production deployments with genuine shared dependencies, layers would be appropriate, but for testing they add packaging complexity without significant value.

### EventBridge Configuration

Create a custom EventBridge event bus for the market data events rather than using the default bus. This provides isolation and allows specific IAM permissions for this workload. Build three EventBridge rules that match events based on detail-type and source attributes in the event pattern. The first rule routes ingestion events with detail-type "MarketData.Raw" to the ingestion Lambda. The second rule routes processing events with detail-type "MarketData.Validated" to the processing Lambda. The third rule routes notification events with detail-type "MarketData.Alert" to the notification Lambda.

Grant each EventBridge rule permission to invoke its target Lambda function using aws_lambda_permission resources. Without these permissions, EventBridge can't invoke the functions and events silently fail. Use the event bus ARN in the rule configurations so events are evaluated against the custom bus, not the default bus.

Create an EventBridge archive on the custom event bus with ninety-day retention as specified in the constraints. The archive captures all events that match the archive pattern for compliance and replay capability. Configure the archive to capture all events by using a pattern that matches everything. EventBridge archives support replaying events for recovery scenarios, though testing that functionality isn't necessary—the capability is what matters.

### DynamoDB Tables

Build two DynamoDB tables using on-demand billing mode for automatic scaling. The events table stores processed market data with attributes for event ID as the partition key, timestamp as the sort key, event type, source, status, and payload. Create a global secondary index on the events table with event type as the partition key and timestamp as the sort key to support queries like "get all trade events from the last hour." Use projection type ALL for the GSI so all attributes are available in query results without additional reads.

The audit table stores a log of every processing step with partition key as audit ID and sort key as timestamp. Include attributes for event ID reference, processing stage, function name, status, and error message if applicable. This table provides the audit trail showing which functions processed each event and when.

Enable server-side encryption on both tables using AWS managed keys as specified in the constraints. Enable point-in-time recovery on both tables for data protection and compliance. Set deletion_protection_enabled to false so terraform destroy can clean up the tables during testing—production deployments would set this to true. Define only the key attributes in the attribute definitions block since DynamoDB is schemaless for non-key attributes.

### SQS Dead Letter Queues

Create three SQS standard queues to serve as dead letter queues for the three Lambda functions. Configure each queue with message retention period of four days and visibility timeout of 30 seconds matching the Lambda timeout. Don't configure a dead letter queue for the dead letter queues themselves—they're the final destination for failed messages.

Set up the redrive policy on each Lambda function pointing to its corresponding dead letter queue with maxReceiveCount set to 2 as specified in the constraints. This means Lambda retries a failed invocation twice before sending it to the dead letter queue. The combination of Lambda retries plus dead letter queues ensures we don't lose events even when processing fails.

### SNS Topics and Subscriptions

Create an SNS standard topic for critical event notifications. Configure an email subscription on the topic with the email address provided in a variable. The subscription will be in PendingConfirmation state until the user clicks the confirmation link in the email they receive—this is expected behavior and the user has confirmed they'll handle the manual confirmation step. Tests can verify that the topic exists and accepts publish requests even though delivery won't work until subscription is confirmed.

The notification Lambda function publishes messages to this SNS topic when it identifies events that require human attention based on alert rules. CloudWatch alarms also publish to this topic when they detect Lambda errors, throttles, or DynamoDB capacity issues. Grant the Lambda execution role permission to publish to the SNS topic and grant CloudWatch alarms permission to publish.

### IAM Roles and Policies

Create three separate IAM roles following least privilege principles, one for each Lambda function. Each role includes the AWS managed policy AWSLambdaBasicExecutionRole which grants CloudWatch Logs permissions. Add custom inline policies granting only the specific permissions each function needs.

The ingestion Lambda role needs DynamoDB PutItem on the events table, SQS SendMessage on its dead letter queue, SSM GetParameter for reading configuration, and X-Ray PutTraceSegments and PutTelemetryRecords. The processing Lambda role needs DynamoDB GetItem, UpdateItem, and Query on the events table and its GSI, plus SQS, SSM, and X-Ray permissions. The notification Lambda role needs DynamoDB Query permissions, SNS Publish to the topic, plus SQS, SSM, and X-Ray permissions.

Use depends_on in each Lambda function resource to ensure the IAM role and all policy attachments are created before the Lambda function due to IAM eventual consistency. Without this, Lambda creation can fail with "role not found" errors even though the role was just created.

### CloudWatch Monitoring

Create CloudWatch metric alarms for monitoring Lambda errors, throttles, and DynamoDB consumed capacity. Build an alarm for each Lambda function that triggers when the Errors metric exceeds zero with a one-minute evaluation period. Create throttle alarms the same way monitoring the Throttles metric. For DynamoDB, create alarms on ConsumedReadCapacityUnits and ConsumedWriteCapacityUnits though with on-demand billing these are informational since capacity auto-scales.

Configure all alarms to publish to the SNS topic when they enter ALARM state so the team receives email notifications. Use a sixty-second period with one evaluation period and Sum statistic for error and throttle metrics. Set threshold values appropriate for testing—zero for errors means any error triggers the alarm which is correct for this use case.

The CloudWatch log groups for Lambda functions are created automatically when you specify the log group name in the Lambda function, but you can create them explicitly with retention settings. Set retention_in_days to 7 as specified in the constraints. CloudWatch Logs charges based on ingestion and storage, so seven-day retention keeps costs low for testing while providing enough history for debugging.

### X-Ray Tracing

Enable X-Ray tracing on all Lambda functions by setting tracing_config mode to Active. This automatically instruments the Lambda runtime to send trace data to X-Ray showing execution time, downstream AWS service calls, and errors. The X-Ray service map visualizes the complete event processing flow from EventBridge through Lambda to DynamoDB and SNS.

Include X-Ray permissions in each Lambda execution role—specifically xray:PutTraceSegments and xray:PutTelemetryRecords. Without these permissions, Lambda can't send trace data and you'll see permissions errors in the logs. X-Ray uses sampling to control cost, defaulting to one request per second plus five percent of additional requests, which is appropriate for testing.

### Systems Manager Parameter Store

Create SSM parameters for configuration values that Lambda functions need. Use parameter type String for non-sensitive configuration like DynamoDB table names, EventBridge bus name, and SNS topic ARN. Store these as standard tier parameters which are free and support values up to 4KB.

Lambda functions read these parameters at runtime using the boto3 SSM client with the get_parameter API call. This is better than hardcoding values in Lambda environment variables because configuration changes don't require Lambda redeployment. The Lambda execution roles need ssm:GetParameter permission for the specific parameter ARNs they access.

### Resource Naming and Tagging

All resources must follow the deterministic naming pattern `{resource-type}-{purpose}-{environment}` without random suffixes. For example, Lambda functions should be named `lambda-ingestion-dev`, `lambda-processing-dev`, `lambda-notification-dev`. DynamoDB tables are `dynamodb-events-dev` and `dynamodb-audit-dev`. This naming pattern ensures integration tests can locate resources by predictable names using the outputs.

Tag all resources with Environment, Project, and CostCenter tags as specified in the constraints. Use default tags on the AWS provider to apply these consistently across all resources. Individual resources can add additional tags specific to their purpose like FunctionType for Lambda or TableType for DynamoDB.

Include the random provider for generating unique identifiers where needed and the archive provider for packaging Lambda function code. Define variables for environment name, notification email address, and any other configurable values. Use variable validation where appropriate, such as email format validation.

## File Organization

Structure the implementation with provider configuration in `lib/provider.tf` including Terraform version constraints, AWS provider version ~> 5.0, random provider, archive provider, region configuration, and default tags. Define all variables in the provider file with descriptions, types, and default values where appropriate.

Implement all infrastructure resources in `lib/main.tf` starting with data sources for caller identity, region, and availability zones. Create Lambda function code archives using the archive_file data source. Build resources in logical order: IAM roles and policies first, then DynamoDB tables, SQS queues, SNS topics, SSM parameters, EventBridge bus and rules, Lambda functions with dependencies on IAM resources, Lambda permissions for EventBridge, CloudWatch log groups and alarms, and finally EventBridge archive. Include comprehensive outputs at the end of main.tf with at least thirty to forty outputs covering all resource IDs, ARNs, and configuration values needed for testing.

Create Lambda function code in `lib/lambda_function.py` with three handler functions: `ingestion_handler`, `processing_handler`, and `notification_handler`. Each handler includes error handling, CloudWatch logging, boto3 client initialization for AWS services, reading configuration from SSM Parameter Store, and the specific business logic for that processing stage. Use the Lambda runtime environment variables and event parameter to access configuration and input data.

## Outputs

Every resource must have corresponding outputs. The minimum requirement is thirty to forty outputs grouped by category.

Lambda outputs must include function name, function ARN, and role ARN for each of the three functions—nine outputs total. EventBridge outputs include bus name, bus ARN, list of rule names, and archive ARN for four outputs. DynamoDB outputs include table name and ARN for each table—four outputs. SQS outputs include queue URL and ARN for each of the three dead letter queues—six outputs. SNS outputs include topic ARN and topic name for two outputs. CloudWatch outputs include list of log group names and list of alarm names for two outputs. SSM outputs include list of parameter names for one output.

Include metadata outputs for environment name, AWS region, and account ID. Mark outputs as sensitive where appropriate such as SNS topic ARN or queue URLs. Provide clear descriptions for every output explaining what the value represents and how it's used.

All outputs must use deterministic resource names following the `{resource-type}-{purpose}-{environment}` pattern so integration tests can reliably locate resources. Don't use random string suffixes in resource names as this breaks test expectations—the only exception is S3 buckets which aren't part of this architecture.