"""
Metric Filters infrastructure module.

Creates metric filters on log groups to extract key business metrics
from structured application logs.
"""

from typing import Dict

import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig
from .log_groups import LogGroupsStack


class MetricFiltersStack:
    """
    Metric Filters stack for extracting business metrics from logs.
    
    Creates metric filters for:
    - Transaction volume
    - Transaction amount
    - Processing time
    - Error count
    - Database connections
    - API latency
    """
    
    def __init__(
        self,
        config: ObservabilityConfig,
        provider_manager: AWSProviderManager,
        log_groups_stack: LogGroupsStack
    ):
        """
        Initialize the Metric Filters stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
            log_groups_stack: Log groups stack
        """
        self.config = config
        self.provider_manager = provider_manager
        self.log_groups_stack = log_groups_stack
        
        # Create metric filters
        self._create_metric_filters()
    
    def _create_metric_filters(self) -> None:
        """Create metric filters to extract business metrics from logs."""
        # Get the processing log group
        processing_log_group = self.log_groups_stack.get_log_group('processing')
        
        if not processing_log_group:
            return
        
        # Define metric filter configurations
        # Using JSON extraction pattern for structured logs
        filters = [
            {
                'name': 'transaction-volume',
                'pattern': '{ $.event_type = "TRANSACTION_PROCESSED" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='TransactionVolume',
                    namespace=self.config.metric_namespace,
                    value='1',
                    default_value=0,
                    unit='Count'
                )
            },
            {
                'name': 'transaction-amount',
                'pattern': '{ $.event_type = "TRANSACTION_PROCESSED" && $.status = "SUCCESS" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='TransactionAmount',
                    namespace=self.config.metric_namespace,
                    value='$.amount',
                    default_value=0,
                    unit='None'
                )
            },
            {
                'name': 'processing-time',
                'pattern': '{ $.event_type = "TRANSACTION_COMPLETE" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='ProcessingTime',
                    namespace=self.config.metric_namespace,
                    value='$.processing_time',
                    default_value=0,
                    unit='Milliseconds'
                )
            },
            {
                'name': 'error-count',
                'pattern': '{ $.level = "ERROR" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='ErrorCount',
                    namespace=self.config.metric_namespace,
                    value='1',
                    default_value=0,
                    unit='Count'
                )
            },
            {
                'name': 'transaction-success-count',
                'pattern': '{ $.event_type = "TRANSACTION_PROCESSED" && $.status = "SUCCESS" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='TransactionSuccessCount',
                    namespace=self.config.metric_namespace,
                    value='1',
                    default_value=0,
                    unit='Count'
                )
            },
            {
                'name': 'database-connections',
                'pattern': '{ $.event_type = "DB_CONNECTION" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='DatabaseConnections',
                    namespace=self.config.metric_namespace,
                    value='$.active_connections',
                    default_value=0,
                    unit='Count'
                )
            },
            {
                'name': 'database-connection-failures',
                'pattern': '{ $.event_type = "DB_CONNECTION" && $.action = "FAILED" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='ConnectionFailures',
                    namespace=self.config.metric_namespace,
                    value='1',
                    default_value=0,
                    unit='Count'
                )
            },
            {
                'name': 'api-latency',
                'pattern': '{ $.event_type = "API_REQUEST" }',
                'metric_transformation': aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                    name='APILatency',
                    namespace=self.config.metric_namespace,
                    value='$.latency',
                    default_value=0,
                    unit='Milliseconds'
                )
            }
        ]
        
        # Create metric filters
        for filter_config in filters:
            aws.cloudwatch.LogMetricFilter(
                f'metric-filter-{filter_config["name"]}',
                name=f'{self.config.get_resource_name(filter_config["name"])}',
                log_group_name=processing_log_group.name,
                pattern=filter_config['pattern'],
                metric_transformation=filter_config['metric_transformation'],
                opts=self.provider_manager.get_resource_options(depends_on=[processing_log_group])
            )

