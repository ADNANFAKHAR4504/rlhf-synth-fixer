"""
CloudWatch monitoring and alarms for serverless application.

This module creates CloudWatch Log Groups and Metric Alarms
for monitoring Lambda functions and other resources.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class MonitoringStack(pulumi.ComponentResource):
    """
    Manages CloudWatch monitoring for the serverless application.
    
    Creates:
    - Log Groups for Lambda functions
    - Metric Alarms for error rates
    - CloudWatch Dashboard
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_stack: 'LambdaStack',
        dynamodb_stack: 'DynamoDBStack',
        notifications_stack: 'NotificationsStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize monitoring stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            lambda_stack: Lambda stack with functions
            dynamodb_stack: DynamoDB stack with tables
            notifications_stack: Notifications stack with topics
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:monitoring:MonitoringStack",
            config.get_resource_name("monitoring"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        self.notifications_stack = notifications_stack
        
        # Create log groups
        self.api_handler_log_group = self._create_log_group("api-handler")
        self.file_processor_log_group = self._create_log_group("file-processor")
        self.stream_processor_log_group = self._create_log_group("stream-processor")
        
        # Create alarms if monitoring is enabled
        if self.config.enable_monitoring:
            self._create_lambda_error_alarms()
            self._create_dynamodb_alarms()
        
        self.register_outputs({
            "api_handler_log_group_name": self.api_handler_log_group.name,
            "api_handler_log_group_arn": self.api_handler_log_group.arn,
            "file_processor_log_group_name": self.file_processor_log_group.name,
            "file_processor_log_group_arn": self.file_processor_log_group.arn,
            "stream_processor_log_group_name": self.stream_processor_log_group.name,
            "stream_processor_log_group_arn": self.stream_processor_log_group.arn,
        })
    
    def _create_log_group(self, function_type: str) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for a Lambda function.
        
        Args:
            function_type: Type of function (e.g., 'api-handler')
            
        Returns:
            CloudWatch Log Group
        """
        function_name = self.config.get_lambda_function_name(function_type)
        
        return aws.cloudwatch.LogGroup(
            resource_name=self.config.get_resource_name(f"log-group-{function_type}"),
            name=f"/aws/lambda/{function_name}",
            retention_in_days=7,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _create_lambda_error_alarms(self) -> None:
        """Create error rate alarms for all Lambda functions."""
        functions = [
            ("api-handler", self.lambda_stack.api_handler),
            ("file-processor", self.lambda_stack.file_processor),
            ("stream-processor", self.lambda_stack.stream_processor),
        ]
        
        for function_type, function in functions:
            # Error rate alarm using metric math
            aws.cloudwatch.MetricAlarm(
                resource_name=self.config.get_resource_name(f"alarm-error-rate-{function_type}"),
                name=self.config.get_resource_name(f"alarm-error-rate-{function_type}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                threshold=self.config.error_rate_threshold,
                alarm_description=f"Error rate exceeds {self.config.error_rate_threshold}% for {function_type}",
                treat_missing_data="notBreaching",
                alarm_actions=[self.notifications_stack.notifications_topic.arn],
                metric_queries=[
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="error_rate",
                        expression="(errors / invocations) * 100",
                        label="Error Rate (%)",
                        return_data=True,
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="errors",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Errors",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={"FunctionName": function.name}
                        ),
                        return_data=False,
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="invocations",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Invocations",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={"FunctionName": function.name}
                        ),
                        return_data=False,
                    ),
                ],
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )
            
            # Throttle alarm
            aws.cloudwatch.MetricAlarm(
                resource_name=self.config.get_resource_name(f"alarm-throttle-{function_type}"),
                name=self.config.get_resource_name(f"alarm-throttle-{function_type}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Throttles",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=0,
                alarm_description=f"Throttling detected for {function_type}",
                dimensions={"FunctionName": function.name},
                treat_missing_data="notBreaching",
                alarm_actions=[self.notifications_stack.notifications_topic.arn],
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )
    
    def _create_dynamodb_alarms(self) -> None:
        """Create alarms for DynamoDB tables."""
        # Read throttle alarm
        aws.cloudwatch.MetricAlarm(
            resource_name=self.config.get_resource_name("alarm-dynamodb-read-throttle"),
            name=self.config.get_resource_name("alarm-dynamodb-read-throttle"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="DynamoDB read throttling detected",
            dimensions={"TableName": self.dynamodb_stack.items_table.name},
            treat_missing_data="notBreaching",
            alarm_actions=[self.notifications_stack.notifications_topic.arn],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        # Write throttle alarm
        aws.cloudwatch.MetricAlarm(
            resource_name=self.config.get_resource_name("alarm-dynamodb-write-throttle"),
            name=self.config.get_resource_name("alarm-dynamodb-write-throttle"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="DynamoDB write throttling detected",
            dimensions={"TableName": self.dynamodb_stack.items_table.name},
            treat_missing_data="notBreaching",
            alarm_actions=[self.notifications_stack.notifications_topic.arn],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

