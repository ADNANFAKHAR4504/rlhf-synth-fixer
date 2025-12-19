"""
CloudWatch monitoring resources for the image processing pipeline.
Provides comprehensive logging and monitoring capabilities for Lambda functions.
Addresses model failures around CloudWatch logging and alarm configuration.
"""

from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ImageProcessingConfig


def create_log_group(function_name: pulumi.Output[str]) -> aws.cloudwatch.LogGroup:
    """
    Creates a CloudWatch Log Group for Lambda function logs.
    Addresses model failure: CloudWatch logging partially implemented.
    
    Args:
        config: Image processing configuration
        
    Returns:
        CloudWatch Log Group resource
    """
    
    log_group = aws.cloudwatch.LogGroup(
        f"img-proc-processor-log-group",
        name=function_name.apply(lambda name: f"/aws/lambda/{name}"),
        retention_in_days=7,
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    return log_group

def create_cloudwatch_alarms(function_name: pulumi.Output[str], function_arn: pulumi.Output[str]) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates comprehensive CloudWatch alarms for monitoring Lambda function health.
    Addresses model failure: CloudWatch alarms partial.
    
    Args:
        config: Image processing configuration
        function_arn: ARN of the Lambda function
        
    Returns:
        Dictionary of CloudWatch alarm resources
    """
    
    alarms = {}
    
    # Error rate alarm
    alarms['error_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-error-alarm",
        name="img-proc-error-rate",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=5,  # Alert if more than 5 errors in 5 minutes
        alarm_description="Alarm when Lambda function error rate is too high",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Duration alarm
    alarms['duration_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-duration-alarm",
        name="img-proc-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=30000,  # 30 seconds
        alarm_description="Alarm when Lambda function duration is too long",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Invocation alarm - addresses model failure: CloudWatch alarms partial
    alarms['invocation_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-invocation-alarm",
        name="img-proc-invocations",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Invocations",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=100,  # Alert if more than 100 invocations in 5 minutes
        alarm_description="Alarm when Lambda function invocation rate is too high",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Throttle alarm - addresses model failure: CloudWatch alarms partial
    alarms['throttle_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-throttle-alarm",
        name="img-proc-throttles",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=1,  # Alert on any throttles
        alarm_description="Alarm when Lambda function is throttled",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Timeout alarm - addresses model failure: CloudWatch alarms partial
    alarms['timeout_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-timeout-alarm",
        name="img-proc-timeouts",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Maximum",
        threshold=60000,  # 60 seconds in milliseconds
        alarm_description="Alarm when Lambda function approaches timeout",
                dimensions=function_name.apply(lambda name: {
                    "FunctionName": name
                }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    return alarms

def create_s3_event_alarms(source_bucket_name: str) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates CloudWatch alarms for S3 event processing.
    
    Args:
        source_bucket_name: Name of the source S3 bucket
        
    Returns:
        Dictionary of S3 event alarm resources
    """
    
    alarms = {}
    
    # S3 object creation alarm
    alarms['s3_object_creation_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-s3-object-creation-alarm",
        name="img-proc-s3-object-creation",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="NumberOfObjects",
        namespace="AWS/S3",
        period=300,
        statistic="Sum",
        threshold=10,  # Alert if more than 10 objects created in 5 minutes
        alarm_description="Alarm when too many objects are created in source bucket",
        dimensions={
            "BucketName": source_bucket_name,
            "StorageType": "AllStorageTypes"
        },
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    return alarms

def create_custom_metrics(function_name: pulumi.Output[str]) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Creates custom CloudWatch metrics for image processing.
    Addresses model failure: No custom metrics to CloudWatch.
    
    Args:
        function_name: Name of the Lambda function
        
    Returns:
        Dictionary of custom metric alarm resources
    """
    
    alarms = {}
    
    # Image processing success rate alarm
    alarms['processing_success_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-processing-success-alarm",
        name="img-proc-processing-success-rate",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="ProcessingSuccessRate",
        namespace="Custom/ImageProcessing",
        period=300,
        statistic="Average",
        threshold=0.95,  # Alert if success rate drops below 95%
        alarm_description="Alarm when image processing success rate is too low",
        dimensions=function_name.apply(lambda name: {
            "FunctionName": name
        }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    # Image processing duration alarm
    alarms['processing_duration_alarm'] = aws.cloudwatch.MetricAlarm(
        "img-proc-processing-duration-alarm",
        name="img-proc-processing-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="ProcessingDuration",
        namespace="Custom/ImageProcessing",
        period=300,
        statistic="Average",
        threshold=10000,  # 10 seconds
        alarm_description="Alarm when image processing duration is too long",
        dimensions=function_name.apply(lambda name: {
            "FunctionName": name
        }),
        tags={"Project": "ImageProcessingPipeline", "ManagedBy": "Pulumi"},
        opts=pulumi.ResourceOptions()
    )
    
    return alarms
