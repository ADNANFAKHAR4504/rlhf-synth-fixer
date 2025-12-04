# Cost-Optimized EMR Data Pipeline for Transaction Log Processing

## Business Context

Hey, we need to build a cost-optimized big data pipeline for our financial analytics platform that processes 50-200GB of daily transaction logs from payment processors to detect fraud patterns and generate compliance reports. The infrastructure must handle variable workloads with automatic cost controls through spot instances, lifecycle policies, and auto-termination while maintaining reliability through retry mechanisms and monitoring. **We'll use Terraform with HCL** to deploy this production-ready data pipeline in us-east-1.

## Technical Requirements

### VPC Network Architecture

Create a VPC with CIDR 10.0.0.0/16 containing three private subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across us-east-1a, us-east-1b, and us-east-1c availability zones. This is a fully private architecture with no public subnets or internet gateway since all data access occurs through VPC endpoints. Enable DNS hostnames and DNS support for endpoint resolution. Create an S3 Gateway VPC endpoint (free) associated with all private subnet route tables for cost-effective data transfer, plus an S3 Interface VPC endpoint for PrivateLink access. Configure route tables for each private subnet routing only to the S3 gateway endpoint with no internet route. Enable VPC Flow Logs to a dedicated CloudWatch log group with KMS encryption and 30-day retention.

### KMS Encryption Infrastructure

Create three customer-managed KMS keys for S3 data encryption, EMR EBS volume encryption, and CloudWatch Logs encryption. Each key must enable automatic rotation and include a key policy allowing the root account full access first, then the current deployment user (data.aws_caller_identity.current.arn) full access second, then grant service principals (s3.amazonaws.com, logs.amazonaws.com, elasticmapreduce.amazonaws.com) the necessary GenerateDataKey, Decrypt, and CreateGrant permissions. Set deletion_window_in_days to seven and create aliases like "alias/emr-pipeline-s3-dev" for easier reference.

### S3 Data Lake with Lifecycle Optimization

Create an S3 bucket using naming pattern "s3-emr-datalake-dev-ACCOUNT_ID" for global uniqueness. Enable versioning and server-side encryption using the S3 KMS key with bucket-key-enabled for cost optimization. Implement all four public access block settings and configure bucket policy with root account access first, current user access second, then EMR service role permissions third, followed by statements denying unencrypted uploads and insecure transport. Set force_destroy to true. Configure lifecycle rules with required filter block implementing multi-tier transitions: transition objects with prefix "raw/" to Intelligent-Tiering after 30 days, transition objects with prefix "processed/" to Glacier Deep Archive after 90 days as required, and expire incomplete multipart uploads after 7 days. Create separate prefixes for raw/, processed/, emr-logs/, and athena-results/.

### EMR Cluster with Instance Fleets

Deploy an EMR cluster using release emr-6.10.0 with applications Spark 3.3.1, Hadoop 3.3.3, and Hive 3.1.3 using instance fleet configuration. Configure the master instance fleet with one m5.xlarge on-demand instance for stability. Configure the core instance fleet with two m5.large on-demand instances for HDFS reliability. Deploy the task instance fleet with target spot capacity of 4 units using m5.large (weight 1) and m5.2xlarge (weight 2) instance types, setting bid_price_as_percentage_of_on_demand_price to 80 for 60%+ cost savings with allocation_strategy "capacity-optimized" for better availability. Set log_uri to the S3 bucket emr-logs/ prefix, termination_protection to false, and configure auto_termination_policy with idle_timeout of 7200 seconds (2 hours) as required. Create an EMR security configuration enabling at-rest encryption with KMS for local disk and S3 encryption with SSE-KMS mode. Configure EMR to use Glue Data Catalog as the Hive metastore by setting hive.metastore.client.factory.class to com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory.

### Step Functions ETL Orchestration

Create a Step Functions state machine of type STANDARD implementing the ETL workflow with comprehensive error handling. Define states including SubmitSparkStep executing the transaction processing job with .sync integration pattern, WaitForCompletion checking step status, TriggerGlueCrawler to update catalog after processing, and NotifyResult publishing to SNS. Implement retry logic on the EMR step task with maxAttempts of 3, intervalSeconds of 10, and backoffRate of 2.0 for exponential backoff as required. Add Catch blocks for States.ALL errors transitioning to NotifyFailure state publishing detailed error information to SNS before reaching FailState terminal. Configure state machine logging to CloudWatch with log level ALL. The Step Functions role needs elasticmapreduce:AddJobFlowSteps, elasticmapreduce:DescribeStep, glue:StartCrawler, and sns:Publish permissions with specific resource ARNs.

### Lambda Function for S3 Event Triggers

Create a Lambda function in Python 3.11 that triggers Step Functions execution when new data arrives in the S3 raw/ prefix. Configure 256 MB memory and 60-second timeout with environment variables for STEP_FUNCTION_ARN and DATA_BUCKET. Package using data.archive_file and create aws_lambda_permission allowing S3 to invoke before creating aws_s3_bucket_notification for ObjectCreated events on raw/ prefix filtering for .json and .csv extensions. Add explicit depends_on to IAM role and policy attachment. The Lambda role needs states:StartExecution on the specific state machine ARN, s3:GetObject for event metadata, and CloudWatch Logs permissions. Don't place in VPC since it only calls Step Functions API.

### Glue Data Catalog and Athena Integration

Create a Glue database named "transaction_analytics" for schema management. Define a Glue Crawler with S3 target pointing to the processed/ prefix, scheduled to run after EMR jobs complete to automatically discover and update table schemas with partition detection by date. Configure the crawler IAM role with glue:CreateTable, glue:UpdateTable, glue:GetTable permissions and S3 read access. Create an Athena workgroup with enforce_workgroup_configuration enabled, output location set to the athena-results/ prefix, and encryption configuration using the S3 KMS key. EMR writes to Glue Catalog enabling seamless Athena queries on processed data.

### IAM Roles and Policies

Create four IAM roles following least privilege with no wildcard permissions. The EMR service role needs EC2 and S3 operations for cluster management. The EMR EC2 instance profile needs S3 read/write on specific bucket ARNs, Glue catalog access, KMS Decrypt and GenerateDataKey on specific keys, and CloudWatch Logs. The Lambda execution role needs states:StartExecution, S3 GetObject, and CloudWatch Logs. The Step Functions role needs EMR step submission, Glue crawler operations, and SNS publish. Define all policies using aws_iam_policy_document with specific resource ARNs and add explicit depends_on before EMR cluster and Lambda function.

### CloudWatch Monitoring and Alerting

Create CloudWatch log groups for EMR cluster, Lambda, Step Functions, and VPC Flow Logs with retention_in_days set to 30 and KMS encryption. Implement CloudWatch alarms for EMR CPU utilization exceeding 80% with 2 evaluation periods of 300 seconds, Step Functions execution failures with threshold 1 for immediate notification, and EMR failed nodes count. Configure all alarms to publish to an SNS topic. Create the SNS topic for notifications with email subscription using placeholder "data-team@example.com" requiring manual confirmation (allowed per master prompt).

### Security Groups

Create two security groups for EMR networking. The master security group allows inbound SSH 22 from VPC CIDR for administrative access, all traffic from itself for inter-node communication, and outbound HTTPS 443 for AWS API calls via VPC endpoints. The core/task security group allows all inbound from master security group and itself for distributed processing, and outbound HTTPS 443. Use separate aws_security_group_rule resources with descriptions like "Allow EMR master to coordinate with core nodes" for compliance documentation.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version ~> 5.0 and archive provider ~> 2.4 for Lambda packaging. Deploy to us-east-1 with default_tags applying Environment "dev", Application "emr-data-pipeline", ManagedBy "terraform", Owner "data-engineering", CostCenter "analytics", and DataClassification "confidential". Define variables for environment, emr_release_label, master_instance_type, core_instance_type, task_instance_types, spot_bid_percentage (default 80), idle_timeout_seconds (default 7200), and glacier_transition_days (default 90).

## Resource Naming

Follow the pattern {resource-type}-{purpose}-{environment} like "vpc-emr-pipeline-dev", "emr-transaction-processor-dev", "lambda-s3-trigger-dev". S3 buckets append account ID. CloudWatch log groups use "/aws/emr/", "/aws/lambda/", "/aws/states/" prefixes. Don't use random_string in naming.

## Data Source Restrictions

Only use data.aws_caller_identity.current, data.aws_region.current, data.aws_availability_zones.available with state filter, data.aws_iam_policy_document for policies, and data.archive_file for Lambda packaging. Don't reference existing infrastructure.

## Code Documentation Requirements

All Terraform code must include detailed comment blocks explaining each section's purpose, cost optimization rationale (spot pricing, lifecycle policies, auto-termination), integration points between services, and compliance considerations for financial data processing.

## File Organization

Structure with lib/provider.tf containing version constraints, provider configuration with default_tags, and variables. The lib/main.tf contains all data sources, KMS keys, VPC networking with endpoints, S3 bucket with lifecycle rules, EMR cluster with security configuration, Step Functions state machine, Lambda function with S3 trigger, Glue database and crawler, Athena workgroup, IAM roles with policies, CloudWatch resources, SNS topic, and outputs. Create lib/lambda_function.py with the S3 event handler that extracts bucket and key, constructs Step Functions input JSON, and starts execution with error handling.

## Cleanup Configuration

Set force_destroy to true on S3 bucket, deletion_window_in_days to seven on KMS keys, termination_protection to false on EMR cluster with auto_termination_policy 7200 seconds as cost safety net, and retention_in_days to 30 on CloudWatch log groups.

## Integration Testing Outputs

Provide 45-50 outputs including VPC ID, private subnet IDs, S3 gateway and interface endpoint IDs, data bucket name and ARN with prefix paths, all three KMS key IDs and ARNs, EMR cluster ID and ARN, EMR master DNS, EMR security configuration name, Lambda function name and ARN, Step Functions state machine ARN and name, Glue database name, Glue crawler name and ARN, Athena workgroup name, all IAM role ARNs, CloudWatch log group names and ARNs, CloudWatch alarm names, SNS topic ARN, and security group IDs with descriptions. Mark sensitive values appropriately.