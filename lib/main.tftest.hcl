
variables {
  environment_suffix       = "test-12345"
  aws_region               = "us-east-1"
  log_retention_days       = 7
  xray_sampling_percentage = 0.1
  alert_email              = ""
  enable_security_hub      = false
  enable_config            = false
}

run "validate_cloudtrail" {
  command = plan

  assert {
    condition     = aws_cloudtrail.payment_audit.enable_log_file_validation == true
    error_message = "CloudTrail log file validation must be enabled"
  }

  assert {
    condition     = aws_cloudtrail.payment_audit.include_global_service_events == true
    error_message = "CloudTrail must include global service events"
  }
}

run "validate_log_groups" {
  command = plan

  assert {
    condition     = aws_cloudwatch_log_group.payment_api_logs.retention_in_days == 7
    error_message = "Log retention must match configured value"
  }

  assert {
    condition     = can(regex(".*test-12345", aws_cloudwatch_log_group.payment_api_logs.name))
    error_message = "Log group name must include environment suffix"
  }
}

run "validate_encryption" {
  command = plan

  assert {
    condition     = aws_kms_key.observability.enable_key_rotation == true
    error_message = "KMS key rotation must be enabled"
  }

  assert {
    condition     = length(aws_s3_bucket_server_side_encryption_configuration.cloudtrail_logs.rule) > 0
    error_message = "S3 bucket must have encryption enabled"
  }
}

run "validate_s3_security" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail_logs.block_public_acls == true
    error_message = "S3 bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail_logs.restrict_public_buckets == true
    error_message = "S3 bucket must restrict public access"
  }
}

run "validate_xray_sampling" {
  command = plan

  assert {
    condition     = aws_xray_sampling_rule.payment_transactions.fixed_rate == 0.1
    error_message = "X-Ray sampling rate must match configured value"
  }

  assert {
    condition     = can(regex("pay-txn-.*", aws_xray_sampling_rule.payment_transactions.rule_name))
    error_message = "X-Ray sampling rule name must include descriptive prefix and environment suffix"
  }
}

run "validate_alarms" {
  command = plan

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_error_rate.comparison_operator == "GreaterThanThreshold"
    error_message = "CloudWatch alarm must use GreaterThanThreshold comparison"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_latency.threshold == 500
    error_message = "Latency alarm threshold must be 500ms"
  }

  assert {
    condition     = can(regex("payment-high-error-rate-.*", aws_cloudwatch_metric_alarm.high_error_rate.alarm_name))
    error_message = "Alarm name must include environment suffix"
  }
}

run "validate_sns_topics" {
  command = plan

  assert {
    condition     = can(regex("payment-alerts-test-12345", aws_sns_topic.payment_alerts.name))
    error_message = "SNS topic name must include environment suffix"
  }

  assert {
    condition     = can(regex("security-alerts-test-12345", aws_sns_topic.security_alerts.name))
    error_message = "Security alerts topic name must include environment suffix"
  }
}

run "validate_ssm_parameters" {
  command = plan

  assert {
    condition     = can(regex("/observability/test-12345/.*", aws_ssm_parameter.xray_sampling_rate.name))
    error_message = "SSM parameter name must include environment suffix in path"
  }

  assert {
    condition     = aws_ssm_parameter.xray_sampling_rate.type == "String"
    error_message = "SSM parameter type must be String"
  }

  assert {
    condition     = aws_ssm_parameter.log_retention.name == "/observability/test-12345/logs/retention-days"
    error_message = "Log retention SSM parameter name must be correct"
  }

  assert {
    condition     = aws_ssm_parameter.alert_threshold_latency.name == "/observability/test-12345/alerts/latency-threshold-ms"
    error_message = "Alert threshold SSM parameter name must be correct"
  }
}

run "validate_eventbridge_rules" {
  command = plan

  assert {
    condition     = can(regex("security-config-changes-.*", aws_cloudwatch_event_rule.security_config_changes.name))
    error_message = "EventBridge rule name must include environment suffix"
  }

  assert {
    condition     = can(regex("unauthorized-api-calls-.*", aws_cloudwatch_event_rule.unauthorized_api_calls.name))
    error_message = "Unauthorized API calls rule name must include environment suffix"
  }

  assert {
    condition     = aws_cloudwatch_event_target.security_config_sns.target_id == "SendToSNS"
    error_message = "EventBridge target ID must be SendToSNS"
  }

  assert {
    condition     = aws_cloudwatch_event_target.unauthorized_api_sns.target_id == "SendToSNS"
    error_message = "Unauthorized API target ID must be SendToSNS"
  }
}

run "validate_dashboard" {
  command = plan

  assert {
    condition     = can(regex("payment-operations-.*", aws_cloudwatch_dashboard.payment_operations.dashboard_name))
    error_message = "Dashboard name must include environment suffix"
  }

  assert {
    condition     = length(aws_cloudwatch_dashboard.payment_operations.dashboard_body) > 0
    error_message = "Dashboard must have body content"
  }
}

run "validate_s3_lifecycle" {
  command = plan

  assert {
    condition     = length(aws_s3_bucket_lifecycle_configuration.cloudtrail_logs.rule) > 0
    error_message = "S3 lifecycle rule must be configured"
  }

  assert {
    condition     = length(aws_s3_bucket_versioning.cloudtrail_logs.versioning_configuration) > 0
    error_message = "S3 bucket versioning must be enabled"
  }
}

run "validate_kms_alias" {
  command = plan

  assert {
    condition     = can(regex("alias/observability-.*", aws_kms_alias.observability.name))
    error_message = "KMS alias must include environment suffix"
  }

  assert {
    condition     = aws_kms_key.observability.deletion_window_in_days == 7
    error_message = "KMS key deletion window must be 7 days"
  }
}

run "validate_all_log_groups" {
  command = plan

  assert {
    condition     = aws_cloudwatch_log_group.payment_processor_logs.retention_in_days == 7
    error_message = "Payment processor log retention must match configured value"
  }

  assert {
    condition     = aws_cloudwatch_log_group.payment_database_logs.retention_in_days == 7
    error_message = "Payment database log retention must match configured value"
  }

  assert {
    condition     = aws_cloudwatch_log_group.security_events_logs.retention_in_days == 30
    error_message = "Security events log retention must be 30 days"
  }

  assert {
    condition     = can(regex("/aws/payment-processor-.*", aws_cloudwatch_log_group.payment_processor_logs.name))
    error_message = "Log group names must include environment suffix"
  }
}

run "validate_alarms_configuration" {
  command = plan

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_error_rate.namespace == "PaymentProcessing"
    error_message = "Error rate alarm must use PaymentProcessing namespace"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_error_rate.evaluation_periods == 2
    error_message = "Error rate alarm must have 2 evaluation periods"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.failed_transactions.threshold == 5
    error_message = "Failed transactions threshold must be 5"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.failed_transactions.period == 60
    error_message = "Failed transactions period must be 60 seconds"
  }
}

run "validate_xray_default_rule" {
  command = plan

  assert {
    condition     = aws_xray_sampling_rule.default_sampling.fixed_rate == 0.05
    error_message = "Default sampling rule rate must be 0.05"
  }

  assert {
    condition     = aws_xray_sampling_rule.default_sampling.priority == 5000
    error_message = "Default sampling rule priority must be 5000"
  }

  assert {
    condition     = can(regex("def-.*", aws_xray_sampling_rule.default_sampling.rule_name))
    error_message = "Default sampling rule name must include environment suffix"
  }
}

run "validate_policies" {
  command = plan

  assert {
    condition     = can(regex("cloudtrail-logs-.*", aws_s3_bucket.cloudtrail_logs.bucket))
    error_message = "CloudTrail S3 bucket name must include environment suffix"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail_logs.block_public_policy == true
    error_message = "S3 bucket must block public policies"
  }
}

