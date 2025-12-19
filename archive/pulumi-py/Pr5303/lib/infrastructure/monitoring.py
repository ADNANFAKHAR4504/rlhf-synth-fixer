"""
Monitoring infrastructure module for CloudWatch alarms and EventBridge rules.

This module creates CloudWatch alarms for CPU utilization and EventBridge rules
to trigger Lambda health checks.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Manages CloudWatch alarms and EventBridge rules.
    
    Creates:
    - CPU utilization alarms for scaling
    - EventBridge rule to trigger Lambda health checks
    - CloudWatch log group for Lambda logs
    """
    
    def __init__(
        self,
        config: InfraConfig,
        asg_name: Output[str],
        scale_up_policy_arn: Output[str],
        scale_down_policy_arn: Output[str],
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: Infrastructure configuration
            asg_name: Auto Scaling Group name for alarms
            scale_up_policy_arn: Scale-up policy ARN
            scale_down_policy_arn: Scale-down policy ARN
            lambda_function_arn: Lambda function ARN for EventBridge target
            lambda_function_name: Lambda function name for permissions
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.asg_name = asg_name
        self.scale_up_policy_arn = scale_up_policy_arn
        self.scale_down_policy_arn = scale_down_policy_arn
        self.lambda_function_arn = lambda_function_arn
        self.lambda_function_name = lambda_function_name
        self.parent = parent
        
        # Create CloudWatch alarms
        self.cpu_high_alarm = self._create_cpu_high_alarm()
        self.cpu_low_alarm = self._create_cpu_low_alarm()
        
        # Create EventBridge rule for Lambda health checks
        self.health_check_rule = self._create_health_check_rule()
        self.health_check_target = self._create_health_check_target()
        self.lambda_permission = self._create_lambda_permission()
        
        # Create CloudWatch log group for Lambda
        self.lambda_log_group = self._create_lambda_log_group()
    
    def _create_cpu_high_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm for high CPU utilization to trigger scale-up."""
        alarm_name = self.config.get_resource_name('cpu-high-alarm')
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=self.config.cpu_scale_up_threshold,
            alarm_description=f"Trigger scale-up when CPU exceeds {self.config.cpu_scale_up_threshold}%",
            dimensions={
                "AutoScalingGroupName": self.asg_name
            },
            alarm_actions=[self.scale_up_policy_arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return alarm
    
    def _create_cpu_low_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm for low CPU utilization to trigger scale-down."""
        alarm_name = self.config.get_resource_name('cpu-low-alarm')
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="LessThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=self.config.cpu_scale_down_threshold,
            alarm_description=f"Trigger scale-down when CPU below {self.config.cpu_scale_down_threshold}%",
            dimensions={
                "AutoScalingGroupName": self.asg_name
            },
            alarm_actions=[self.scale_down_policy_arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return alarm
    
    def _create_health_check_rule(self) -> aws.cloudwatch.EventRule:
        """Create EventBridge rule to trigger Lambda health checks."""
        rule_name = self.config.get_resource_name('health-check-rule')
        
        rule = aws.cloudwatch.EventRule(
            rule_name,
            name=rule_name,
            description="Trigger Lambda health check function periodically",
            schedule_expression=self.config.health_check_interval,
            tags={
                **self.config.get_common_tags(),
                'Name': rule_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return rule
    
    def _create_health_check_target(self) -> aws.cloudwatch.EventTarget:
        """Create EventBridge target to invoke Lambda function."""
        target_name = self.config.get_resource_name('health-check-target')
        
        target = aws.cloudwatch.EventTarget(
            target_name,
            rule=self.health_check_rule.name,
            arn=self.lambda_function_arn,
            opts=ResourceOptions(parent=self.health_check_rule)
        )
        
        return target
    
    def _create_lambda_permission(self) -> aws.lambda_.Permission:
        """Create permission for EventBridge to invoke Lambda function."""
        permission_name = self.config.get_resource_name('lambda-eventbridge-permission')
        
        permission = aws.lambda_.Permission(
            permission_name,
            action="lambda:InvokeFunction",
            function=self.lambda_function_name,
            principal="events.amazonaws.com",
            source_arn=self.health_check_rule.arn,
            opts=ResourceOptions(parent=self.health_check_rule)
        )
        
        return permission
    
    def _create_lambda_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for Lambda function logs."""
        log_group_name = self.lambda_function_name.apply(
            lambda name: f"/aws/lambda/{name}"
        )
        
        log_group = aws.cloudwatch.LogGroup(
            self.config.get_resource_name('lambda-log-group'),
            name=log_group_name,
            retention_in_days=7,
            tags={
                **self.config.get_common_tags(),
                'Name': 'lambda-logs'
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return log_group
    
    # Getter methods for outputs
    def get_cpu_high_alarm_arn(self) -> Output[str]:
        """Get CPU high alarm ARN."""
        return self.cpu_high_alarm.arn
    
    def get_cpu_low_alarm_arn(self) -> Output[str]:
        """Get CPU low alarm ARN."""
        return self.cpu_low_alarm.arn
    
    def get_health_check_rule_arn(self) -> Output[str]:
        """Get health check rule ARN."""
        return self.health_check_rule.arn
    
    def get_lambda_log_group_name(self) -> Output[str]:
        """Get Lambda log group name."""
        return self.lambda_log_group.name

