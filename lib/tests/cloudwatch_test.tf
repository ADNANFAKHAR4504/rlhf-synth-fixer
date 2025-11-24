# Unit tests for cloudwatch.tf - CloudWatch Logs and Alarms

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Test 1: Verify central log group is created
output "test_central_log_group_created" {
  description = "Test if central CloudWatch log group was created"
  value       = try(aws_cloudwatch_log_group.central.name != null, false)
}

# Test 2: Verify organizations log group is created
output "test_organizations_log_group_created" {
  description = "Test if organizations CloudWatch log group was created"
  value       = try(aws_cloudwatch_log_group.organizations.name != null, false)
}

# Test 3: Verify config log group is created
output "test_config_log_group_created" {
  description = "Test if config CloudWatch log group was created"
  value       = try(aws_cloudwatch_log_group.config.name != null, false)
}

# Test 4: Verify IAM activity log group is created
output "test_iam_activity_log_group_created" {
  description = "Test if IAM activity CloudWatch log group was created"
  value       = try(aws_cloudwatch_log_group.iam_activity.name != null, false)
}

# Test 5: Verify CloudTrail log group is created
output "test_cloudtrail_log_group_created" {
  description = "Test if CloudTrail CloudWatch log group was created"
  value       = try(aws_cloudwatch_log_group.cloudtrail.name != null, false)
}

# Test 6: Verify all log groups have 90-day retention
output "test_all_log_groups_90_day_retention" {
  description = "Test if all log groups have 90-day retention"
  value = alltrue([
    aws_cloudwatch_log_group.central.retention_in_days == 90,
    aws_cloudwatch_log_group.organizations.retention_in_days == 90,
    aws_cloudwatch_log_group.config.retention_in_days == 90,
    aws_cloudwatch_log_group.iam_activity.retention_in_days == 90,
    aws_cloudwatch_log_group.cloudtrail.retention_in_days == 90
  ])
}

# Test 7: Verify all log groups are KMS encrypted
output "test_all_log_groups_encrypted" {
  description = "Test if all log groups are KMS encrypted"
  value = alltrue([
    aws_cloudwatch_log_group.central.kms_key_id != null,
    aws_cloudwatch_log_group.organizations.kms_key_id != null,
    aws_cloudwatch_log_group.config.kms_key_id != null,
    aws_cloudwatch_log_group.iam_activity.kms_key_id != null,
    aws_cloudwatch_log_group.cloudtrail.kms_key_id != null
  ])
}

# Test 8: Verify CloudTrail logs IAM role is created
output "test_cloudtrail_logs_role_created" {
  description = "Test if CloudTrail logs IAM role was created"
  value       = try(aws_iam_role.cloudtrail_logs.arn != null, false)
}

# Test 9: Verify CloudTrail logs policy is attached
output "test_cloudtrail_logs_policy_attached" {
  description = "Test if CloudTrail logs policy was attached"
  value       = try(aws_iam_role_policy.cloudtrail_logs.policy != null, false)
}

# Test 10: Verify metric filter for unauthorized API calls
output "test_unauthorized_api_calls_metric_filter" {
  description = "Test if unauthorized API calls metric filter was created"
  value       = try(aws_cloudwatch_log_metric_filter.unauthorized_api_calls.name != null, false)
}

# Test 11: Verify metric filter for root account usage
output "test_root_account_usage_metric_filter" {
  description = "Test if root account usage metric filter was created"
  value       = try(aws_cloudwatch_log_metric_filter.root_account_usage.name != null, false)
}

# Test 12: Verify metric filter for IAM policy changes
output "test_iam_policy_changes_metric_filter" {
  description = "Test if IAM policy changes metric filter was created"
  value       = try(aws_cloudwatch_log_metric_filter.iam_policy_changes.name != null, false)
}

# Test 13: Verify metric filter for KMS key disabling
output "test_kms_key_disabling_metric_filter" {
  description = "Test if KMS key disabling metric filter was created"
  value       = try(aws_cloudwatch_log_metric_filter.kms_key_disabling.name != null, false)
}

# Test 14: Verify metric filter for config changes
output "test_config_changes_metric_filter" {
  description = "Test if config changes metric filter was created"
  value       = try(aws_cloudwatch_log_metric_filter.config_changes.name != null, false)
}

# Test 15: Verify CloudWatch alarms are created
output "test_cloudwatch_alarms_created" {
  description = "Test if CloudWatch alarms were created"
  value = alltrue([
    aws_cloudwatch_metric_alarm.unauthorized_api_calls.alarm_name != null,
    aws_cloudwatch_metric_alarm.root_account_usage.alarm_name != null,
    aws_cloudwatch_metric_alarm.iam_policy_changes.alarm_name != null,
    aws_cloudwatch_metric_alarm.kms_key_disabling.alarm_name != null
  ])
}

# Test 16: Verify log group names have environment_suffix
output "test_log_group_names_have_suffix" {
  description = "Test if log group names include environment_suffix"
  value       = try(contains(aws_cloudwatch_log_group.central.name, var.environment_suffix), false)
}

# Test 17: Verify cross-account log resource policy
output "test_cross_account_log_policy" {
  description = "Test if cross-account log resource policy was created"
  value       = try(aws_cloudwatch_log_resource_policy.cross_account.policy_text != null, false)
}

# Test 18: Verify CloudWatch alarms have correct thresholds
output "test_unauthorized_api_calls_alarm_threshold" {
  description = "Test if unauthorized API calls alarm has threshold of 5"
  value       = try(aws_cloudwatch_metric_alarm.unauthorized_api_calls.threshold == 5, false)
}

# Test 19: Verify root account usage alarm threshold
output "test_root_account_usage_alarm_threshold" {
  description = "Test if root account usage alarm has threshold of 1"
  value       = try(aws_cloudwatch_metric_alarm.root_account_usage.threshold == 1, false)
}

# Test 20: Verify alarms use correct comparison operator
output "test_alarm_comparison_operator" {
  description = "Test if alarms use GreaterThanOrEqualToThreshold"
  value       = try(aws_cloudwatch_metric_alarm.unauthorized_api_calls.comparison_operator == "GreaterThanOrEqualToThreshold", false)
}
