"""Storage resources - S3 buckets and CloudWatch log groups"""
import pulumi
import pulumi_aws as aws
from typing import Dict, Any


def create_storage_buckets(
    environment_suffix: str,
    aws_account_id: str,
    region: str,
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create S3 buckets and CloudWatch log groups for the application."""

    # Create globally unique bucket names
    bucket_suffix = f"{environment_suffix}-{aws_account_id}-{region}"

    # Application logs bucket
    app_logs_bucket = aws.s3.Bucket(
        f"app-logs-{environment_suffix}",
        bucket=f"app-logs-{bucket_suffix}",
        tags={**tags, "Purpose": "application-logs"},
    )

    # Transaction data bucket
    transaction_data_bucket = aws.s3.Bucket(
        f"transaction-data-{environment_suffix}",
        bucket=f"transaction-data-{bucket_suffix}",
        tags={**tags, "Purpose": "transaction-data"},
    )

    # Enable S3 bucket encryption
    app_logs_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"app-logs-encryption-{environment_suffix}",
        bucket=app_logs_bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ],
    )

    transaction_data_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
        f"transaction-data-encryption-{environment_suffix}",
        bucket=transaction_data_bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ],
    )

    # CloudWatch Log Groups with environment-based retention
    retention_days = {
        "dev": 7,
        "staging": 14,
        "prod": 30
    }
    environment = tags.get("Environment", "dev")
    retention = retention_days.get(environment, 7)

    ecs_log_group = aws.cloudwatch.LogGroup(
        f"ecs-logs-{environment_suffix}",
        name=f"/ecs/transaction-processing-{environment_suffix}",
        retention_in_days=retention,
        tags={**tags, "Name": f"ecs-logs-{environment_suffix}"},
    )

    rds_log_group = aws.cloudwatch.LogGroup(
        f"rds-logs-{environment_suffix}",
        name=f"/aws/rds/aurora-{environment_suffix}",
        retention_in_days=retention,
        tags={**tags, "Name": f"rds-logs-{environment_suffix}"},
    )

    alb_log_group = aws.cloudwatch.LogGroup(
        f"alb-logs-{environment_suffix}",
        name=f"/aws/alb/transaction-{environment_suffix}",
        retention_in_days=retention,
        tags={**tags, "Name": f"alb-logs-{environment_suffix}"},
    )

    return {
        "app_logs_bucket": app_logs_bucket,
        "transaction_data_bucket": transaction_data_bucket,
        "app_logs_encryption": app_logs_encryption,
        "transaction_data_encryption": transaction_data_encryption,
        "ecs_log_group": ecs_log_group,
        "rds_log_group": rds_log_group,
        "alb_log_group": alb_log_group,
    }