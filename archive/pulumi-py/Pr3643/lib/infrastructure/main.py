"""
Main infrastructure orchestrator for image processing pipeline.
Coordinates all infrastructure components and addresses model failures.
"""

import pulumi
import pulumi_aws as aws

from . import config, iam, lambda_function, monitoring, s3


def create_infrastructure():
    """
    Creates the complete image processing pipeline infrastructure.
    Orchestrates all components and addresses model failures.
    """
    
    # Get configuration
    pipeline_config = config.create_config()
    
    # Create KMS key for encryption
    kms_key = s3.create_kms_key(pipeline_config)
    pulumi.export("kms_key_id", kms_key.key_id)
    pulumi.export("kms_key_arn", kms_key.arn)
    
    # Create S3 buckets
    source_bucket = s3.create_source_bucket(pipeline_config, kms_key)
    pulumi.export("source_bucket_name", source_bucket.bucket)
    pulumi.export("source_bucket_arn", source_bucket.arn)
    
    dest_bucket = s3.create_destination_bucket(pipeline_config, kms_key)
    pulumi.export("dest_bucket_name", dest_bucket.bucket)
    pulumi.export("dest_bucket_arn", dest_bucket.arn)
    
    # Create IAM roles
    lambda_role = iam.create_lambda_role(pipeline_config)
    pulumi.export("lambda_role_arn", lambda_role.arn)
    
    vpc_role = iam.create_vpc_execution_role(pipeline_config)
    if vpc_role:
        pulumi.export("vpc_role_arn", vpc_role.arn)
    
    # Create CloudWatch log group
    log_group = monitoring.create_log_group(pipeline_config)
    pulumi.export("log_group_name", log_group.name)
    
    # Create Dead Letter Queue
    dlq = lambda_function.create_dead_letter_queue(pipeline_config)
    if dlq:
        pulumi.export("dlq_arn", dlq.arn)
        # Update config with DLQ ARN
        pipeline_config.dlq_arn = dlq.arn
    
    # Create Lambda function
    processor_function = lambda_function.create_lambda_function(
        config=pipeline_config,
        role_arn=lambda_role.arn,
        source_bucket_name=source_bucket.bucket,
        dest_bucket_name=dest_bucket.bucket,
        log_group=log_group,
        kms_key_arn=kms_key.arn
    )
    pulumi.export("lambda_function_name", processor_function.name)
    pulumi.export("lambda_function_arn", processor_function.arn)
    
    # Configure S3 trigger
    bucket_notification = lambda_function.configure_s3_trigger(
        config=pipeline_config,
        lambda_function=processor_function,
        source_bucket=source_bucket
    )
    pulumi.export("bucket_notification_id", bucket_notification.id)
    
    # Create CloudWatch alarms
    lambda_alarms = monitoring.create_cloudwatch_alarms(
        config=pipeline_config,
        function_arn=processor_function.arn
    )
    pulumi.export("lambda_alarms", {name: alarm.id for name, alarm in lambda_alarms.items()})
    
    # Create S3 event alarms
    s3_alarms = monitoring.create_s3_event_alarms(
        config=pipeline_config,
        source_bucket_name=source_bucket.bucket
    )
    pulumi.export("s3_alarms", {name: alarm.id for name, alarm in s3_alarms.items()})
    
    # Create custom metrics alarms
    custom_alarms = monitoring.create_custom_metrics(pipeline_config)
    pulumi.export("custom_alarms", {name: alarm.id for name, alarm in custom_alarms.items()})
    
    # Export comprehensive stack outputs
    pulumi.export("stack_outputs", {
        "source_bucket": source_bucket.bucket,
        "dest_bucket": dest_bucket.bucket,
        "lambda_function": processor_function.name,
        "log_group": log_group.name,
        "kms_key": kms_key.key_id,
        "upload_prefix": "uploads/",
        "image_sizes": pipeline_config.image_sizes,
        "supported_formats": pipeline_config.supported_extensions,
        "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing",
        "monitoring": "Check CloudWatch logs and alarms for processing status",
        "security": "All resources use KMS encryption and least-privilege IAM policies"
    })
    
    return {
        "config": pipeline_config,
        "kms_key": kms_key,
        "source_bucket": source_bucket,
        "dest_bucket": dest_bucket,
        "lambda_role": lambda_role,
        "vpc_role": vpc_role,
        "log_group": log_group,
        "dlq": dlq,
        "lambda_function": processor_function,
        "bucket_notification": bucket_notification,
        "lambda_alarms": lambda_alarms,
        "s3_alarms": s3_alarms,
        "custom_alarms": custom_alarms
    }

# Create the infrastructure
infrastructure = create_infrastructure()
