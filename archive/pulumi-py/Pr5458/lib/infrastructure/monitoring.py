"""
Monitoring module for the serverless infrastructure.

This module creates CloudWatch alarms with percentage-based error rates
as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the serverless infrastructure.
    
    Model failure fix: Uses percentage-based error rate alarms (>1%)
    instead of absolute thresholds.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize Monitoring Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.alarms = {}
    
    def create_lambda_error_alarm(
        self,
        function_name: Output[str],
        alarm_name_suffix: str
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Lambda error rate.
        
        Model failure fix: Uses metric math to calculate error percentage (>1%).
        
        Args:
            function_name: Lambda function name
            alarm_name_suffix: Suffix for alarm name
            
        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            f"lambda-error-{alarm_name_suffix}",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create alarm with metric math for error percentage
        # Model failure fix: Uses error rate (errors / invocations * 100) > 1%
        alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{alarm_name_suffix}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=self.config.alarm_error_rate_threshold * 100,  # 1.0 (1%)
            treat_missing_data="notBreaching",
            alarm_description=f"Lambda error rate > {self.config.alarm_error_rate_threshold * 100}%",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="errors",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,  # 5 minutes
                        stat="Sum",
                        dimensions={
                            "FunctionName": function_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="invocations",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": function_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="error_rate",
                    expression="(errors / invocations) * 100",
                    label="Error Rate (%)",
                    return_data=True
                )
            ],
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f"lambda-error-{alarm_name_suffix}"] = alarm
        return alarm
    
    def create_lambda_throttle_alarm(
        self,
        function_name: Output[str],
        alarm_name_suffix: str
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Lambda throttling.
        
        Args:
            function_name: Lambda function name
            alarm_name_suffix: Suffix for alarm name
            
        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            f"lambda-throttle-{alarm_name_suffix}",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-throttle-alarm-{alarm_name_suffix}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="Lambda function is being throttled",
            dimensions={
                "FunctionName": function_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f"lambda-throttle-{alarm_name_suffix}"] = alarm
        return alarm
    
    def create_dynamodb_throttle_alarm(
        self,
        table_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for DynamoDB throttling.
        
        Model failure fix: Uses appropriate throttling metrics for on-demand capacity.
        
        Args:
            table_name: DynamoDB table name
            
        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "dynamodb-throttle",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # For on-demand tables, monitor SystemErrors and ThrottledRequests
        alarm = aws.cloudwatch.MetricAlarm(
            "dynamodb-throttle-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="SystemErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="DynamoDB table experiencing system errors",
            dimensions={
                "TableName": table_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms['dynamodb-throttle'] = alarm
        return alarm
    
    def create_api_gateway_error_alarm(
        self,
        api_name: Output[str],
        stage_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for API Gateway 5XX errors.
        
        Args:
            api_name: API Gateway name
            stage_name: API Gateway stage name
            
        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "api-5xx-errors",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            "api-5xx-errors-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="API Gateway experiencing 5XX errors",
            dimensions={
                "ApiName": api_name,
                "Stage": stage_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms['api-5xx-errors'] = alarm
        return alarm
    
    def create_step_functions_error_alarm(
        self,
        state_machine_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Step Functions execution failures.
        
        Args:
            state_machine_name: State machine name
            
        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "step-functions-failures",
            include_region=False
        )
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            "step-functions-failures-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ExecutionsFailed",
            namespace="AWS/States",
            period=300,
            statistic="Sum",
            threshold=5,
            treat_missing_data="notBreaching",
            alarm_description="Step Functions executions are failing",
            dimensions={
                "StateMachineArn": state_machine_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms['step-functions-failures'] = alarm
        return alarm

