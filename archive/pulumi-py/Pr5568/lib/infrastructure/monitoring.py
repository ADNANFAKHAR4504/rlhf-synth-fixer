"""
Monitoring module.

This module creates CloudWatch alarms with proper metric math
for percentage-based thresholds (e.g., error rates).
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack
from .step_functions import StepFunctionsStack


class MonitoringStack:
    """
    Manages CloudWatch alarms and monitoring.
    
    Creates alarms with metric math expressions for percentage-based
    thresholds instead of absolute counts.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        step_functions_stack: StepFunctionsStack = None
    ):
        """
        Initialize the Monitoring stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            step_functions_stack: StepFunctionsStack instance (optional)
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.step_functions_stack = step_functions_stack
        self.alarms = {}
        
        self._create_lambda_alarms()
        if step_functions_stack:
            self._create_step_functions_alarms()
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        function_names = ['user-service', 'order-service', 'product-service']
        
        for function_name in function_names:
            self._create_lambda_error_rate_alarm(function_name)
            self._create_lambda_throttle_alarm(function_name)
            self._create_lambda_duration_alarm(function_name)
    
    def _create_lambda_error_rate_alarm(self, function_name: str):
        """
        Create error rate alarm using metric math for percentage calculation.
        
        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-error-rate', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-rate-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            threshold=1.0,
            alarm_description=f'Alarm when {function_name} error rate exceeds 1%',
            treat_missing_data='notBreaching',
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='errors',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Errors',
                        namespace='AWS/Lambda',
                        period=60,
                        stat='Sum',
                        dimensions={
                            'FunctionName': lambda_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='invocations',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Invocations',
                        namespace='AWS/Lambda',
                        period=60,
                        stat='Sum',
                        dimensions={
                            'FunctionName': lambda_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='IF(invocations > 0, (errors / invocations) * 100, 0)',
                    label='Error Rate (%)',
                    return_data=True
                )
            ],
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f'{function_name}-error-rate'] = alarm
    
    def _create_lambda_throttle_alarm(self, function_name: str):
        """
        Create throttle alarm for Lambda function.
        
        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-throttles', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {function_name} is throttled',
            treat_missing_data='notBreaching',
            dimensions={
                'FunctionName': lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f'{function_name}-throttles'] = alarm
    
    def _create_lambda_duration_alarm(self, function_name: str):
        """
        Create duration alarm for Lambda function.
        
        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-duration', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        threshold_ms = (self.config.lambda_timeout - 5) * 1000
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=60,
            statistic='Maximum',
            threshold=threshold_ms,
            alarm_description=f'Alarm when {function_name} duration approaches timeout',
            treat_missing_data='notBreaching',
            dimensions={
                'FunctionName': lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f'{function_name}-duration'] = alarm
    
    def _create_step_functions_alarms(self):
        """Create CloudWatch alarms for Step Functions."""
        if not self.step_functions_stack:
            return
        
        workflow_name = 'order-workflow'
        state_machine = self.step_functions_stack.get_state_machine(workflow_name)
        
        if not state_machine:
            return
        
        opts = self.provider_manager.get_resource_options()
        
        failed_alarm = aws.cloudwatch.MetricAlarm(
            f'{workflow_name}-failed-alarm',
            name=self.config.get_resource_name(f'{workflow_name}-failed', include_region=False),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ExecutionsFailed',
            namespace='AWS/States',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {workflow_name} executions fail',
            treat_missing_data='notBreaching',
            dimensions={
                'StateMachineArn': state_machine.arn
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f'{workflow_name}-failed'] = failed_alarm
        
        timeout_alarm = aws.cloudwatch.MetricAlarm(
            f'{workflow_name}-timeout-alarm',
            name=self.config.get_resource_name(f'{workflow_name}-timeout', include_region=False),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ExecutionsTimedOut',
            namespace='AWS/States',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {workflow_name} executions timeout',
            treat_missing_data='notBreaching',
            dimensions={
                'StateMachineArn': state_machine.arn
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.alarms[f'{workflow_name}-timeout'] = timeout_alarm
    
    def get_alarm(self, alarm_name: str) -> aws.cloudwatch.MetricAlarm:
        """
        Get an alarm by name.
        
        Args:
            alarm_name: Name of the alarm
            
        Returns:
            CloudWatch MetricAlarm resource
        """
        return self.alarms.get(alarm_name)

