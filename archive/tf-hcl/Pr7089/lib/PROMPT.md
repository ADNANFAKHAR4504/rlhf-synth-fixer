# Multi-Region Disaster Recovery Infrastructure for Payment Processing

## Business Context

Hey, we need to implement a disaster recovery solution for our critical payment processing application that can automatically failover between regions within three minutes of an outage while maintaining zero data loss for completed transactions. A recent business continuity audit identified that our current single-region architecture puts us at risk for extended outages during regional AWS failures, which is unacceptable for payment processing. **We'll use Terraform with HCL** to build this multi-region active-passive DR infrastructure spanning us-east-1 (primary) and us-west-2 (secondary).

## Technical Requirements

### Network Foundation

Create isolated VPCs in both us-east-1 and us-west-2 using non-overlapping CIDR blocks—10.0.0.0/16 for the primary region and 10.1.0.0/16 for the secondary region. Each VPC needs two private subnets across two availability zones with CIDR allocations like 10.0.1.0/24 and 10.0.2.0/24 for us-east-1, and 10.1.1.0/24 and 10.1.2.0/24 for us-west-2. Enable DNS hostnames and DNS resolution on both VPCs since we'll be using private DNS for service discovery. Don't create public subnets, internet gateways, or NAT gateways since this infrastructure doesn't need direct internet access—the Lambda functions and API Gateway endpoints will use AWS's internal networking.

### Data Layer with Global Replication

Set up a DynamoDB global table named "transactions" with on-demand billing mode that automatically replicates between us-east-1 and us-west-2. Configure the table with a partition key named "transaction_id" of type string and a sort key named "timestamp" of type number. Enable point-in-time recovery for disaster recovery compliance and configure the stream specification to NEW_AND_OLD_IMAGES for replication. The global table should use a single resource with replica blocks for each region rather than separate table resources.

Create two S3 buckets following the pattern "s3-payment-docs-{region}-ACCOUNT_ID" for global uniqueness—one in us-east-1 as the source and one in us-west-2 as the destination. Enable versioning on both buckets before configuring replication since versioning is a prerequisite for cross-region replication. Implement server-side encryption using AWS managed keys and enable all four public access block settings. Set force_destroy to true for testing cleanup and configure the replication from us-east-1 to us-west-2 with a rule that applies to all objects using an empty prefix filter. Create an IAM role that S3 can assume for replication with permissions to replicate objects and metadata.

### Health Monitoring System

Create Lambda functions in Python 3.11 for health monitoring in both regions named "lambda-health-monitor-{region}-dev" that check the status of the DynamoDB table every sixty seconds. Configure each Lambda with 256 MB memory and a 300-second timeout with environment variables containing the DynamoDB table name and SNS topic ARN for notifications. Package the Lambda using the archive_file data source pointing to a Python file that queries DynamoDB table status and returns a health status JSON response. Don't place the Lambda functions in VPCs since they only access AWS services through AWS's internal network and VPC Lambda adds unnecessary cold start delays. Add explicit depends_on to both the IAM role and all policy attachments to handle IAM's eventual consistency.

Deploy API Gateway HTTP APIs in both regions as regional endpoints that integrate with the respective Lambda health monitor functions using AWS_PROXY integration. Configure the API Gateway with a route for GET /health that triggers the Lambda function and set auto_deploy to true on the default stage so changes deploy immediately. The API Gateway endpoints will provide stable HTTPS URLs for Route 53 health checks.

### DNS-Based Failover

Create a Route 53 hosted zone for the application domain and configure two health checks—one pointing to the us-east-1 API Gateway endpoint at the /health path and another for us-west-2. Set each health check to HTTPS type with a request interval of thirty seconds and failure threshold of three consecutive failures before marking unhealthy. Create weighted routing policy records with the same DNS name where the primary region has weight 100 and secondary has weight 0 for initial traffic distribution. Associate each record with its respective health check using the health_check_id attribute and include unique set_identifier values like "primary" and "secondary". When the primary region's health check fails, Route 53 will automatically route traffic to the secondary region.

### Monitoring and Alerting

Set up CloudWatch metric alarms in both regions monitoring DynamoDB for UserErrors and SystemErrors that indicate throttling or service issues. Create additional alarms for Lambda function errors and throttles with thresholds set to trigger when more than three errors occur within five minutes. Configure all alarms to publish notifications to an SNS topic in each region. Create the SNS topics with KMS encryption enabled and add an email subscription endpoint using a dummy email address for testing notifications—this subscription will require manual confirmation which is acceptable for testing purposes. Set retention_in_days to one on all CloudWatch log groups created for Lambda functions to minimize storage costs during testing.

### Configuration Synchronization

Create AWS Systems Manager parameters in both regions using SecureString type with KMS encryption for sensitive configuration data like database connection strings and API keys. Name the parameters following the pattern "/payment-app/{environment}/{config-key}" for organized hierarchical storage. Deploy Lambda functions named "lambda-config-sync-{region}-dev" in both regions that can read parameters from one region and write to another when configuration changes occur. Configure these Lambda functions with 256 MB memory, 300-second timeout, and environment variables containing the SSM parameter paths. The sync functions will use cross-region IAM assume role permissions for secure access.

### IAM Security

Create IAM roles for Lambda functions following least privilege with no wildcard permissions on actions or resources. The health monitor Lambda role needs DynamoDB DescribeTable permissions for the specific table ARN, SNS Publish permission to the specific topic ARN, and CloudWatch Logs permissions for writing logs. The config sync Lambda role needs SSM GetParameter permissions in its home region and AssumeRole permission for a cross-region role that allows PutParameter in the other region. Define all policies using aws_iam_policy_document data sources with specific resource ARNs and appropriate condition keys. Set maximum session duration to 3600 seconds on the cross-region assume role and add conditions that restrict which Lambda functions can assume it based on source ARN.

### Encryption

Create KMS keys in both regions for encrypting SNS topics and SSM parameters. Configure each key with automatic rotation enabled and a key policy that grants the root account full permissions to prevent lockouts. Add statements allowing the SNS and SSM services to use the keys for encryption and decryption operations. Set deletion_window_in_days to seven for quick testing cleanup and create aliases like "alias/dr-encryption-{region}-dev" for easier reference in resource configurations.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using the pessimistic operator (~> 5.0). Include the random provider for generating any necessary random values and the archive provider for Lambda function packaging. Define two provider configurations—one for us-east-1 using the default provider and another for us-west-2 with alias "secondary". Apply default_tags automatically to all resources with Environment set to "dev", DataClassification set to "sensitive", Owner set to "platform-team", and ManagedBy set to "terraform". Create an environment variable with type string and default value "dev" for consistent resource naming across the infrastructure.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{region}-{environment} for all resources like "lambda-health-monitor-east-dev" or "kms-dr-encryption-west-dev". S3 buckets need the AWS account ID appended for global uniqueness following the pattern "s3-payment-docs-{region}-dev-ACCOUNT_ID" since bucket names must be globally unique across all AWS accounts. Don't use random_string resources in naming since that causes integration test failures when tests expect deterministic resource names.

## Data Source Restrictions

Only use data.aws_caller_identity.current for retrieving the AWS account ID, data.aws_region.current for getting the region name dynamically, data.aws_availability_zones.available for selecting availability zones, and data.archive_file for packaging Lambda function code. Don't use data sources that reference existing infrastructure like data.aws_vpc or data.aws_subnet—create all infrastructure resources fresh rather than importing or referencing existing resources.

## File Organization

Structure the code with lib/provider.tf containing Terraform version constraints requiring 1.5 or higher, AWS provider configurations for both regions with version ~> 5.0, random and archive provider declarations, variable definitions for environment with type string and default "dev", and the default_tags configuration. The lib/main.tf file should contain all data sources, VPC networking resources for both regions, DynamoDB global table with replica configuration, S3 buckets with cross-region replication, Lambda functions for health monitoring and config sync in both regions, API Gateway HTTP APIs with Lambda integration, Route 53 hosted zone with health checks and weighted routing records, IAM roles and policies with cross-region assume role capability, KMS keys in both regions, SNS topics with email subscriptions, CloudWatch alarms and log groups, SSM parameters in both regions, and comprehensive outputs with minimum forty outputs covering all major resources. Create lib/lambda_health_monitor.py with a handler function that uses boto3 to call describe_table on DynamoDB and returns a JSON response with status and timestamp. Create lib/lambda_config_sync.py with a handler that reads SSM parameters from one region and writes to another using AssumeRole.

## Cleanup Configuration

Set force_destroy to true on both S3 buckets to allow deletion even when they contain objects, deletion_window_in_days to seven on both KMS keys for the minimum allowed deletion window, and retention_in_days to one on all CloudWatch log groups. Configure deletion_protection_enabled to false on the DynamoDB global table and ensure point_in_time recovery is enabled but doesn't prevent deletion. All other resources including Lambda functions, API Gateways, Route 53 resources, IAM roles, SNS topics, and SSM parameters delete cleanly without special configuration.

## Integration Testing Outputs

Provide comprehensive outputs for all resources including VPC IDs and CIDR blocks for both regions (four outputs), private subnet IDs as lists for both regions (two outputs), DynamoDB table name and ARN and stream ARN (three outputs), S3 bucket names and ARNs for both regions (four outputs), S3 replication role ARN (one output), Lambda function names and ARNs for all four functions (eight outputs), Lambda execution role ARN (one output), API Gateway endpoint URLs and IDs for both regions (four outputs), Route 53 hosted zone ID and name (two outputs), Route 53 health check IDs for both regions (two outputs), Route 53 record FQDN (one output), CloudWatch alarm names as a list (one output), SNS topic ARNs for both regions (two outputs), KMS key IDs and ARNs for both regions (four outputs), SSM parameter names as a list (one output), and cross-region assume role ARN (one output). Mark sensitive outputs like SSM parameter values appropriately with sensitive equals true. Integration tests require these outputs to validate that all resources are created correctly with proper configurations and that the disaster recovery failover mechanism is ready to function.