S3 Cross-Region Replication with Monitoring

Hi, I'm setting up cross-region replication for our retail platform between us-east-1 and eu-west-1. We have about 100,000 users daily and need to replicate around 10TB of data automatically. The main thing is I need good monitoring and audit logging so we can make sure everything stays in sync.

So here's what I'm thinking - I need two S3 buckets, one as the source in us-east-1 and another as the replica in eu-west-1. For naming, let's use retail-data-source-{account-id}-{region} for the source and retail-data-replica-{account-id}-{region} for the replica. Both need versioning enabled since that's required for replication anyway.

For security, I want to use customer-managed KMS keys with one key in each region. Public access should be completely blocked on both buckets - all four settings turned on. Also set up Intelligent-Tiering to save on costs, and add lifecycle policies to clean up incomplete multipart uploads after 7 days and expire old versions after 90 days.

The replication setup needs to handle everything - all objects including existing ones, delete markers, metadata, tags, the whole deal. Since we're using KMS encryption, make sure to include the source_selection_criteria block with sse_kms_encrypted_objects status set to Enabled. Turn on Replication Time Control so we get a 15-minute replication guarantee, and enable replication metrics for CloudWatch monitoring.

I'll need an IAM role for the replication with permissions to read from the source bucket, decrypt with the source KMS key, write to the destination bucket, and encrypt with the destination KMS key. Try to keep it least privilege - no wildcard ARNs unless AWS absolutely requires it.

For the KMS keys, create one in each region with these aliases: alias/retail-data-source-key for us-east-1 and alias/retail-data-replica-key for eu-west-1. Enable automatic key rotation on both. The key policies should allow the S3 service to use them, the replication role to use them, and CloudTrail to encrypt logs.

On the monitoring side, I need CloudWatch alarms for these scenarios:
- Alert if replication latency goes over 15 minutes (900 seconds)
- Alert if there's more than 100GB pending replication for over 15 minutes
- Alert on high 4xx error rates, like more than 100 errors in 5 minutes
- Alert on high 5xx error rates, like more than 10 errors in 5 minutes

Also create a CloudWatch dashboard called retail-s3-replication-dashboard that shows the key replication metrics from both regions - things like replication latency, bytes pending, operations pending, bucket sizes, and error rates. Auto-refresh would be good.

For event notifications, configure EventBridge to capture important S3 events and send them to SNS topics. Object events like PutObject, DeleteObject, and CompleteMultipartUpload should go to retail-s3-info-alerts. Replication failures and Replication Time Control violations should go to retail-s3-critical-alerts. Security events like bucket policy changes, encryption changes, and versioning changes should also go to retail-s3-critical-alerts.

So basically three SNS topics for different severity levels:
- retail-s3-critical-alerts for replication failures and security stuff
- retail-s3-warning-alerts for high latency and backlog warnings
- retail-s3-info-alerts for routine notifications

For audit logging, set up CloudTrail with a trail called retail-s3-audit-trail. Make it a multi-region trail with log file validation enabled. Enable S3 data events for both buckets so we capture all object-level API calls. Send the logs to a dedicated bucket called retail-cloudtrail-logs-{account-id} and also to CloudWatch Logs with 90-day retention so we can search through them easier.

The CloudTrail bucket will need a policy that allows CloudTrail to write logs. Also create an IAM role for CloudTrail with permissions to write to CloudWatch Logs.

For file organization, I'm thinking just two Terraform files:

provider.tf should have the Terraform block with required_providers (Terraform version 1.5.0 or higher and AWS provider version 5.0 or higher). Include two AWS provider blocks with aliases - use us_east_1 for the us-east-1 region and eu_west_1 for the eu-west-1 region. Note that the alias names should use underscores not hyphens. Both providers should have default_tags configured for automatic tagging.

main.tf should have everything else. Start with the variables at the top - region defaulting to us-east-1, environment with validation to only allow dev/staging/prod, project_name defaulting to retail, replication_latency_threshold defaulting to 900 seconds, pending_replication_threshold defaulting to 107374182400 bytes which is 100GB, log_retention_days defaulting to 90, lifecycle_noncurrent_expiration_days defaulting to 90, and lifecycle_multipart_expiration_days defaulting to 7. Make sure all variables have descriptions, types, and defaults.

Then add a data sources section with aws_caller_identity to get the account ID dynamically.

After that, a locals block to define the bucket names with account ID and region, and common_tags with Project, Environment, ManagedBy, and DataClassification.

Then the resources section with clear comments for each group. Start with the KMS keys for both regions with their aliases and policies. Then the IAM replication role with the trust policy and permissions policy. Then the source S3 bucket in us-east-1 with versioning, encryption using the source KMS key, public access block with all four settings, intelligent-tiering, and lifecycle policies. Then the replica S3 bucket in eu-west-1 with the same configuration but using the replica KMS key.

Add the S3 replication configuration with source_selection_criteria for KMS objects, Replication Time Control, metrics, and delete marker replication. Then CloudWatch alarms for latency, pending bytes, 4xx errors, and 5xx errors, all pointing to the SNS topics. Create the CloudWatch dashboard with widgets showing multi-region metrics.

Set up the three SNS topics with policies that allow EventBridge and CloudWatch to publish to them. Create CloudWatch log groups for EventBridge and CloudTrail. Add EventBridge rules to capture object events, replication events, and security events, with targets pointing to both CloudWatch Logs and the SNS topics.

Create the CloudTrail S3 bucket with encryption, versioning, public access block, and a bucket policy allowing CloudTrail to write. Add the CloudTrail IAM role for CloudWatch Logs integration. Finally add the CloudTrail trail itself with multi-region enabled, S3 data events for both buckets, log file validation, and CloudWatch Logs integration.

At the bottom, add outputs for source_bucket_name, source_bucket_arn, replica_bucket_name, replica_bucket_arn, replication_role_arn, source_kms_key_arn, replica_kms_key_arn, cloudtrail_trail_arn, cloudwatch_dashboard_name, sns_critical_topic_arn, sns_warning_topic_arn, and sns_info_topic_arn. Each output should have a clear description.

Tag all resources with Project=retail, Environment=production, ManagedBy=Terraform, and DataClassification=Confidential.

Oh and don't output any sensitive stuff like KMS key IDs or secret access keys. For testing during development, probably better to use smaller datasets like 10GB instead of the full 10TB to keep costs down. The code should work with standard terraform init, terraform plan, and terraform apply commands. You can use a terraform.tfvars file for variable values if needed.

Let me know if anything's unclear.