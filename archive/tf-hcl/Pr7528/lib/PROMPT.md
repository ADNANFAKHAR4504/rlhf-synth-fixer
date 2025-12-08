# Advanced Observability Platform for Distributed Payment Processing

## Business Context

Hey, we need to build a comprehensive observability platform for our payment processing infrastructure following a recent audit that identified monitoring gaps. The platform must provide real-time visibility into application health, intelligent alerting through anomaly detection, and automated incident management for fintech compliance. **We'll use Terraform with HCL** to implement this CloudWatch-based monitoring solution in us-east-1 with cross-region dashboard visibility into eu-west-1 and ap-southeast-1.

## Technical Requirements

### KMS Encryption Infrastructure

Create two customer-managed KMS keys for CloudWatch Logs encryption and S3 storage encryption following the naming pattern "kms-{purpose}-dev". Each key must enable automatic annual rotation and include a key policy granting the root account full access first, then the deployment user, followed by service principals for logs.REGION.amazonaws.com (using region-specific principal for CloudWatch Logs) and s3.amazonaws.com with comprehensive KMS permissions including Encrypt, Decrypt, ReEncrypt, GenerateDataKey, and Describe actions. Set deletion_window_in_days to seven for testing cleanup and create aliases like "alias/observability-logs-dev" for easier reference.

### S3 Storage for Lambda Artifacts

Set up an S3 bucket for Lambda deployment artifacts using the naming pattern "s3-observability-dev-ACCOUNT_ID" for global uniqueness. Enable versioning and configure server-side encryption using the S3 KMS key. Implement all four public access block settings and add a bucket policy with root account access first, then current user access, then deny unencrypted uploads. Set force_destroy to true and configure lifecycle rules with the required filter block to transition objects to Glacier after thirty days.

### VPC Network for Synthetics Canaries

Create a VPC with CIDR 10.0.0.0/16 containing four subnets across two availability zones with public subnets for the NAT Gateway and private subnets for Synthetics execution. Enable DNS hostnames and support, create an Internet Gateway, and deploy a single NAT Gateway with an Elastic IP. Configure route tables appropriately and create a security group for Synthetics allowing outbound HTTPS traffic for CloudWatch API communication.

### CloudWatch Log Groups and Metric Filters

Create three CloudWatch Log Groups for payment service, authentication service, and transaction processor using the naming pattern "log-group-{service}-dev" with KMS encryption and retention set to one day. Implement metric filters parsing JSON-formatted logs to extract custom metrics. The payment filter should detect failed transactions matching transaction_status equals "failed", the authentication filter should count failed logins matching auth_result equals "failure", and the transaction filter should extract processing_time as a latency metric publishing to the "fintech/payments/metrics" namespace.

### CloudWatch Alarms with Dynamic Blocks

Define a local variable containing alarm configurations for payment_errors, auth_failures, and high_latency with respective thresholds, evaluation periods, and comparison operators. Use Terraform dynamic blocks with for_each to create alarms iterating over this configuration map. Each alarm must have both OK and ALARM actions pointing to SNS topics for bidirectional notifications. Configure alarms in the custom namespace monitoring error counts with threshold of five in five minutes, authentication failures with threshold of ten, and processing latency exceeding two thousand milliseconds with treat_missing_data set to "notBreaching".

### Composite Alarms for Pipeline Health

Create a composite alarm combining payment_errors and high_latency using AND logic to trigger only when both conditions occur indicating systemic issues. Configure a second composite alarm using OR logic across all three base alarms for critical escalation. Both should trigger the critical SNS topic for incident notification.

### CloudWatch Anomaly Detection Alarms

Implement anomaly detection through CloudWatch metric alarms using the ANOMALY_DETECTION_BAND expression for payment transaction volume and average processing latency. Configure alarms with band width of two standard deviations triggering when metrics fall outside predicted bands for three consecutive five-minute evaluation periods. Use metric queries with the expression "ANOMALY_DETECTION_BAND(m1, 2)" where m1 references the base metric.

### Metric Math Expression for Error Rate

Create a CloudWatch alarm using metric math calculating error rate percentage with the expression "100 * errors / total_requests" where errors and total_requests reference metrics from the custom namespace. Configure the alarm to trigger when error rate exceeds five percent over five minutes staying under the ten nested functions CloudWatch limit.

### Cross-Region CloudWatch Dashboard

Create a dashboard named "observability-platform-dev" displaying metrics from us-east-1, eu-west-1, and ap-southeast-1 using explicit region properties in widget definitions. Build widgets for payment transaction volume as line graphs, error rate as gauges, latency percentiles as stacked areas, and payment volume trends as time series with a markdown widget documenting the dashboard purpose. Include x and y coordinates for proper widget positioning.

### SNS Topics with Subscription Filters

Create two SNS topics for standard alerts and critical escalations using the naming pattern "sns-{purpose}-dev" with server-side encryption using AWS managed KMS keys per the constraint. Create email subscriptions with filter policies routing messages by severity attribute where "critical" goes to escalation and "warning" or "info" to standard with prefix matching on "payment" for service routing. Use email address from var.alert_email variable for notification subscriptions.

### Lambda for Custom Metric Collection with EMF

Create a Lambda function in Python 3.11 collecting custom metrics using CloudWatch Embedded Metric Format outputting JSON with the _aws metadata block containing CloudWatchMetrics array specifying namespace, dimensions for Service and Environment, and metrics for RequestCount, ErrorCount, and ProcessingTime. Configure 256 MB memory and 300-second timeout with environment variables for namespace and environment. Package using archive_file, upload to S3, then reference in Lambda. Create an IAM role with least privilege allowing cloudwatch:PutMetricData for the specific namespace and logs permissions for the function's log group. Add explicit depends_on to IAM attachments and schedule execution every five minutes using EventBridge.

### CloudWatch Log Metric Filters for Contributor Analysis

Create three CloudWatch log metric filters analyzing the payment service log group for high-cardinality data patterns. Configure filters tracking requests by IP address parsing source_ip, transactions by user parsing user_id, and errors by endpoint parsing endpoint and status fields where status equals "error". Publish metrics with dimensions to the "fintech/payments/metrics" namespace enabling contributor analysis through metric dimensions.

### CloudWatch Synthetics Canary

Deploy a Synthetics canary using syn-python-selenium-3.0 runtime for payment API endpoint monitoring running every five minutes. Package the canary script as a local file, zip using archive_file data source, upload to S3 with KMS encryption, then reference via s3_bucket and s3_key attributes since inline code blocks are not supported. Place the canary in private subnets with the Synthetics security group meeting the private endpoint constraint. Create the canary script implementing HTTPS heartbeat checks storing artifacts in the S3 bucket. Configure the execution role with s3:PutObject, s3:GetObject, logs permissions, cloudwatch:PutMetricData, and EC2 VPC networking permissions including CreateNetworkInterface, DescribeNetworkInterfaces, and DeleteNetworkInterface restricted to VPC subnets.

### Systems Manager Parameter for Incident Configuration

Create an SSM Parameter storing critical incident configuration template at path "/observability/ENVIRONMENT/critical-incident-config". Store incident metadata as JSON including title, description, priority set to one, severity set to "1" for critical, category as "availability", environment variable, and source as "cloudwatch-alarms" for reference by incident management workflows and automation.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using the pessimistic operator and archive provider 2.4 or higher for Lambda packaging. Deploy to us-east-1 with default_tags applying Environment, Project, Owner, ManagedBy, and CostCenter tags. Define an environment variable with type string defaulting to "dev" for resource naming.

## Resource Naming

Follow the deterministic pattern "type-purpose-environment" for resources like "kms-logs-encryption-dev" or "lambda-metric-collector-dev". S3 buckets append account ID for global uniqueness. CloudWatch uses the "fintech/payments/metrics" namespace per constraints. Don't use random_string in naming since it causes test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for account ID, data.aws_region.current for region name, data.aws_availability_zones.available for AZ selection, and data.archive_file for Lambda packaging. Don't reference existing infrastructure.

## Code Documentation Requirements

All Terraform code must include detailed comment blocks explaining each section's purpose and configuration choices. Use multi-line comments before resource blocks describing functionality, setting rationale, and component integration. Include inline comments for IAM policies, metric filter patterns, and alarm configurations documenting security rationale and compliance considerations.

## File Organization

Structure with lib/provider.tf containing version constraints, AWS provider with default_tags, archive provider, and variables including environment and alert_email. The lib/main.tf contains data sources, KMS keys, S3 bucket, VPC networking, CloudWatch Log Groups with metric filters, alarms using dynamic blocks, composite alarms, anomaly detection alarms using ANOMALY_DETECTION_BAND expression, metric math alarms, dashboard with positioned widgets, log metric filters for contributor analysis with dimensions, SNS topics, Lambda with IAM and EventBridge trigger, Synthetics canary with S3-based script deployment and execution role, SSM Parameter for incident configuration, and comprehensive outputs. Create lib/lambda_function.py implementing EMF metric collection.

## Cleanup Configuration

Set force_destroy true on S3, deletion_window_in_days to seven on KMS keys, retention_in_days to one on Log Groups. Lambda, SNS, alarms, dashboards, Contributor Insights, Synthetics, and VPC resources delete cleanly. NAT Gateway takes two to three minutes for ENI cleanup.

## Integration Testing Outputs

Provide outputs including KMS key IDs, ARNs, and aliases totaling six outputs. S3 bucket name, ARN, and domain for three outputs. VPC ID, subnet IDs, NAT gateway ID, and security group ID for seven outputs. Log Group names and ARNs for six outputs. Metric filter names for six outputs including contributor analysis filters. Individual alarm ARNs and composite alarm ARNs for twelve outputs. Anomaly detection alarm ARNs and names for two outputs. Dashboard name and ARN for two outputs. Contributor analysis metric filter names for three outputs. Synthetics canary name and ARN for two outputs. SNS topic ARNs and names for four outputs. Lambda function name, ARN, qualified ARN, and invoke ARN for four outputs. IAM role ARNs for two outputs. EventBridge rule ARN for one output. SSM Parameter ARN for one output. Region and account ID outputs for two outputs. Target minimum forty outputs for comprehensive test validation.