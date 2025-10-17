"""
Monitoring module for environment migration solution.

This module manages CloudWatch Logs, metrics, and alarms for
comprehensive observability.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class MonitoringStack:
    """
    Manages CloudWatch logs, metrics, and alarms.
    
    Provides comprehensive monitoring and observability for the
    migration solution across all regions.
    """
    
    def __init__(
        self,
        config: MigrationConfig,
        provider_manager: AWSProviderManager,
        lambda_function_names: Dict[str, Output[str]]
    ):
        """
        Initialize monitoring stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
            lambda_function_names: Dictionary of Lambda function names by region
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_function_names = lambda_function_names
        self.log_groups: Dict[str, Dict[str, aws.cloudwatch.LogGroup]] = {}
        self.metric_alarms: Dict[str, List[aws.cloudwatch.MetricAlarm]] = {}
        
        # Create monitoring resources for all regions
        self._create_log_groups()
        self._create_metric_alarms()
    
    def _create_log_groups(self):
        """Create CloudWatch log groups for all regions."""
        for region in self.config.all_regions:
            self.log_groups[region] = {}
            provider = self.provider_manager.get_provider(region)
            
            # Lambda function log group
            if region in self.lambda_function_names:
                log_group_name = self.lambda_function_names[region].apply(
                    lambda name: f"/aws/lambda/{name}"
                )
                
                log_group = aws.cloudwatch.LogGroup(
                    self.config.get_resource_name('lambda-logs', region),
                    name=log_group_name,
                    retention_in_days=self.config.log_retention_days,
                    tags=self.config.get_region_tags(region),
                    opts=ResourceOptions(provider=provider)
                )
                
                self.log_groups[region]['lambda'] = log_group
            
            # Validation log group
            validation_log_name = self.config.get_resource_name('validation-logs', region)
            validation_log_group = aws.cloudwatch.LogGroup(
                validation_log_name,
                name=f"/aws/migration/validation-{region}-{self.config.environment}-{self.config.environment_suffix}",
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.log_groups[region]['validation'] = validation_log_group
            
            # Deployment log group
            deployment_log_name = self.config.get_resource_name('deployment-logs', region)
            deployment_log_group = aws.cloudwatch.LogGroup(
                deployment_log_name,
                name=f"/aws/migration/deployment-{region}-{self.config.environment}-{self.config.environment_suffix}",
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.log_groups[region]['deployment'] = deployment_log_group
    
    def _create_metric_alarms(self):
        """Create CloudWatch metric alarms for all regions."""
        for region in self.config.all_regions:
            self.metric_alarms[region] = []
            provider = self.provider_manager.get_provider(region)
            
            if region not in self.lambda_function_names:
                continue
            
            function_name = self.lambda_function_names[region]
            
            # Lambda error alarm
            error_alarm_name = self.config.get_resource_name('lambda-errors', region)
            error_alarm = aws.cloudwatch.MetricAlarm(
                error_alarm_name,
                name=error_alarm_name,
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=self.config.error_threshold,
                alarm_description=f"Lambda errors in {region}",
                dimensions={
                    "FunctionName": function_name
                },
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.metric_alarms[region].append(error_alarm)
            
            # Lambda duration alarm
            duration_alarm_name = self.config.get_resource_name('lambda-duration', region)
            duration_alarm = aws.cloudwatch.MetricAlarm(
                duration_alarm_name,
                name=duration_alarm_name,
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Duration",
                namespace="AWS/Lambda",
                period=300,
                statistic="Average",
                threshold=self.config.lambda_timeout * 1000 * 0.8,  # 80% of timeout
                alarm_description=f"Lambda duration approaching timeout in {region}",
                dimensions={
                    "FunctionName": function_name
                },
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.metric_alarms[region].append(duration_alarm)
            
            # Lambda throttles alarm
            throttle_alarm_name = self.config.get_resource_name('lambda-throttles', region)
            throttle_alarm = aws.cloudwatch.MetricAlarm(
                throttle_alarm_name,
                name=throttle_alarm_name,
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Throttles",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=5,
                alarm_description=f"Lambda throttles in {region}",
                dimensions={
                    "FunctionName": function_name
                },
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.metric_alarms[region].append(throttle_alarm)
    
    def get_log_group(self, region: str, log_type: str) -> aws.cloudwatch.LogGroup:
        """
        Get log group for a region and type.
        
        Args:
            region: AWS region
            log_type: Type of log group ('lambda', 'validation', 'deployment')
            
        Returns:
            CloudWatch log group
        """
        return self.log_groups[region][log_type]
    
    def get_log_group_arn(self, region: str, log_type: str) -> Output[str]:
        """
        Get log group ARN for a region and type.
        
        Args:
            region: AWS region
            log_type: Type of log group
            
        Returns:
            Log group ARN as Output
        """
        return self.log_groups[region][log_type].arn
    
    def get_log_group_name(self, region: str, log_type: str) -> Output[str]:
        """
        Get log group name for a region and type.
        
        Args:
            region: AWS region
            log_type: Type of log group
            
        Returns:
            Log group name as Output
        """
        return self.log_groups[region][log_type].name
    
    def get_all_log_group_arns(self, region: str) -> List[Output[str]]:
        """
        Get all log group ARNs for a region.
        
        Args:
            region: AWS region
            
        Returns:
            List of log group ARNs
        """
        return [lg.arn for lg in self.log_groups[region].values()]

