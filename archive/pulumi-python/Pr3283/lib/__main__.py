"""
Pulumi program for secure logging system infrastructure
"""
import os
import json
import pulumi
from pulumi_aws import kms, iam, s3, cloudwatch, scheduler, lambda_
from pulumi import Output, export

# Get environment suffix from environment or use default
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "synth30598714")

# Get current AWS account ID
import boto3
sts = boto3.client('sts')
account_id = sts.get_caller_identity()['Account']
region = os.getenv("AWS_REGION", "us-east-1")

# Create KMS key for log encryption with policy
key_policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Enable IAM User Permissions",
            "Effect": "Allow",
            "Principal": {
                "AWS": f"arn:aws:iam::{account_id}:root"
            },
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow CloudWatch Logs",
            "Effect": "Allow",
            "Principal": {
                "Service": f"logs.{region}.amazonaws.com"
            },
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
            ],
            "Resource": "*",
            "Condition": {
                "ArnLike": {
                    "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{region}:{account_id}:log-group:*"
                }
            }
        }
    ]
})

log_encryption_key = kms.Key(f"log-encryption-key-{environment_suffix}",
    description="KMS key for CloudWatch Logs encryption",
    enable_key_rotation=True,
    deletion_window_in_days=10,
    policy=key_policy,
    tags={
        "Name": f"CloudWatchLogsKey-{environment_suffix}",
        "Environment": "Production",
        "Purpose": "LogEncryption",
        "EnvironmentSuffix": environment_suffix
    }
)

# Create KMS key alias
key_alias = kms.Alias(f"log-encryption-key-alias-{environment_suffix}",
    name=f"alias/cloudwatch-logs-encryption-{environment_suffix}",
    target_key_id=log_encryption_key.id
)

# Create IAM role for CloudWatch Logs
cloudwatch_logs_role = iam.Role(f"cloudwatch-logs-role-{environment_suffix}",
    name=f"secure-logging-cloudwatch-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "logs.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={"Name": f"CloudWatchLogsRole-{environment_suffix}"}
)

# Create IAM policy for KMS key usage
kms_policy = iam.Policy(f"kms-usage-policy-{environment_suffix}",
    name=f"cloudwatch-logs-kms-policy-{environment_suffix}",
    policy=log_encryption_key.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
            ],
            "Resource": arn
        }]
    }))
)

# Attach KMS policy to role
kms_policy_attachment = iam.RolePolicyAttachment(f"kms-policy-attachment-{environment_suffix}",
    role=cloudwatch_logs_role.name,
    policy_arn=kms_policy.arn
)

# Create S3 bucket for log archival
log_archive_bucket = s3.Bucket(f"log-archive-bucket-{environment_suffix}",
    bucket=f"secure-logs-archive-{environment_suffix}",
    force_destroy=True,  # Ensure bucket can be destroyed
    versioning=s3.BucketVersioningArgs(
        enabled=True
    ),
    server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
        rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=log_encryption_key.arn
            )
        )
    ),
    lifecycle_rules=[s3.BucketLifecycleRuleArgs(
        enabled=True,
        id="archive-old-logs",
        transitions=[s3.BucketLifecycleRuleTransitionArgs(
            days=90,
            storage_class="GLACIER"
        )],
        expiration=s3.BucketLifecycleRuleExpirationArgs(
            days=365
        )
    )],
    tags={
        "Name": f"LogArchiveBucket-{environment_suffix}",
        "Environment": "Production",
        "EnvironmentSuffix": environment_suffix
    }
)

# Create CloudWatch Log Group with encryption
application_log_group = cloudwatch.LogGroup(f"application-log-group-{environment_suffix}",
    name=f"/aws/application/secure-logs-{environment_suffix}",
    retention_in_days=90,
    kms_key_id=log_encryption_key.arn,
    tags={
        "Name": f"ApplicationLogs-{environment_suffix}",
        "Environment": "Production",
        "DataProtection": "Enabled",
        "EnvironmentSuffix": environment_suffix
    }
)

# Create data protection policy for masking sensitive data
data_protection_policy = cloudwatch.LogDataProtectionPolicy(f"log-data-protection-{environment_suffix}",
    log_group_name=application_log_group.name,
    policy_document=json.dumps({
        "Name": "DataProtectionPolicy",
        "Version": "2021-06-01",
        "Statement": [{
            "Sid": "MaskSensitiveData",
            "DataIdentifier": [
                "arn:aws:dataprotection::aws:data-identifier/EmailAddress",
                "arn:aws:dataprotection::aws:data-identifier/CreditCardNumber",
                "arn:aws:dataprotection::aws:data-identifier/AwsSecretKey"
            ],
            "Operation": {
                "Mask": {}
            }
        }]
    })
)

# Create metric filter for monitoring
anomaly_metric_filter = cloudwatch.LogMetricFilter(f"anomaly-metric-filter-{environment_suffix}",
    name=f"error-count-filter-{environment_suffix}",
    log_group_name=application_log_group.name,
    pattern="[ERROR]",
    metric_transformation=cloudwatch.LogMetricFilterMetricTransformationArgs(
        name=f"ErrorCount-{environment_suffix}",
        namespace="ApplicationLogs",
        value="1",
        unit="Count"
    )
)

# Create CloudWatch metric alarm
error_alarm = cloudwatch.MetricAlarm(f"error-alarm-{environment_suffix}",
    name=f"high-error-rate-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name=f"ErrorCount-{environment_suffix}",
    namespace="ApplicationLogs",
    period=300,
    statistic="Sum",
    threshold=100.0,
    alarm_description="Alert when error count exceeds threshold",
    treat_missing_data="notBreaching"
)

# Create Lambda function role
lambda_role = iam.Role(f"lambda-export-role-{environment_suffix}",
    name=f"log-export-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={"EnvironmentSuffix": environment_suffix}
)

# Attach basic execution policy to Lambda role
lambda_basic_execution = iam.RolePolicyAttachment(f"lambda-basic-execution-{environment_suffix}",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Create Lambda export policy
lambda_export_policy = iam.Policy(f"lambda-export-policy-{environment_suffix}",
    name=f"lambda-log-export-policy-{environment_suffix}",
    policy=Output.all(application_log_group.arn, log_archive_bucket.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateExportTask",
                        "logs:DescribeExportTasks",
                        "logs:DescribeLogGroups"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[1],
                        f"{args[1]}/*"
                    ]
                }
            ]
        })
    )
)

# Attach export policy to Lambda role
lambda_export_policy_attachment = iam.RolePolicyAttachment(f"lambda-export-policy-attachment-{environment_suffix}",
    role=lambda_role.name,
    policy_arn=lambda_export_policy.arn
)

# Create Lambda function
log_export_function = lambda_.Function(f"log-export-function-{environment_suffix}",
    name=f"cloudwatch-log-exporter-{environment_suffix}",
    runtime="python3.9",
    handler="index.handler",
    role=lambda_role.arn,
    code=pulumi.FileArchive("./lib/lambda"),
    environment=lambda_.FunctionEnvironmentArgs(
        variables={
            "LOG_GROUP_NAME": application_log_group.name,
            "S3_BUCKET_NAME": log_archive_bucket.bucket
        }
    ),
    timeout=300,
    memory_size=256,
    tags={
        "Name": f"LogExporter-{environment_suffix}",
        "EnvironmentSuffix": environment_suffix
    },
    opts=pulumi.ResourceOptions(depends_on=[lambda_basic_execution, lambda_export_policy_attachment])
)

# Create EventBridge Scheduler role
scheduler_role = iam.Role(f"scheduler-role-{environment_suffix}",
    name=f"log-export-scheduler-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "scheduler.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={"EnvironmentSuffix": environment_suffix}
)

# Create scheduler policy
scheduler_policy = iam.Policy(f"scheduler-policy-{environment_suffix}",
    name=f"scheduler-invoke-lambda-policy-{environment_suffix}",
    policy=log_export_function.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": arn
        }]
    }))
)

# Attach scheduler policy to role
scheduler_policy_attachment = iam.RolePolicyAttachment(f"scheduler-policy-attachment-{environment_suffix}",
    role=scheduler_role.name,
    policy_arn=scheduler_policy.arn
)

# Create EventBridge Scheduler for daily log export
daily_log_export = scheduler.Schedule(f"daily-log-export-{environment_suffix}",
    name=f"daily-log-archival-{environment_suffix}",
    schedule_expression="rate(1 day)",
    flexible_time_window=scheduler.ScheduleFlexibleTimeWindowArgs(
        mode="OFF"
    ),
    target=scheduler.ScheduleTargetArgs(
        arn=log_export_function.arn,
        role_arn=scheduler_role.arn,
        retry_policy=scheduler.ScheduleTargetRetryPolicyArgs(
            maximum_retry_attempts=3,
            maximum_event_age_in_seconds=3600
        )
    ),
    description="Daily trigger for CloudWatch log archival to S3",
    opts=pulumi.ResourceOptions(depends_on=[scheduler_policy_attachment])
)

# Create EventBridge log group for enhanced logging
eventbridge_log_group = cloudwatch.LogGroup(f"eventbridge-log-group-{environment_suffix}",
    name=f"/aws/events/log-archival-{environment_suffix}",
    retention_in_days=30,
    kms_key_id=log_encryption_key.arn,
    tags={
        "Name": f"EventBridgeSchedulerLogs-{environment_suffix}",
        "Purpose": "SchedulerDebugging",
        "EnvironmentSuffix": environment_suffix
    }
)

# Export outputs
export("logGroupName", application_log_group.name)
export("logGroupArn", application_log_group.arn)
export("archiveBucketName", log_archive_bucket.bucket)
export("archiveBucketArn", log_archive_bucket.arn)
export("kmsKeyId", log_encryption_key.id)
export("kmsKeyArn", log_encryption_key.arn)
export("lambdaFunctionName", log_export_function.name)
export("lambdaFunctionArn", log_export_function.arn)
export("schedulerName", daily_log_export.name)
export("schedulerArn", daily_log_export.arn)
export("eventBridgeLogGroup", eventbridge_log_group.name)