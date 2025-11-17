"""
CloudWatch Dashboard infrastructure module.

Creates a CloudWatch dashboard with real-time widgets displaying transaction metrics,
system health, and API performance with proper Output handling.
"""

import json

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig


class DashboardStack:
    """
    CloudWatch Dashboard stack for real-time monitoring.
    
    Creates a dashboard with widgets for:
    - Transaction metrics
    - Error rates
    - Processing time
    - API latency
    - System health
    """
    
    def __init__(self, config: ObservabilityConfig, provider_manager: AWSProviderManager):
        """
        Initialize the Dashboard stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.dashboard = None
        
        # Create dashboard
        self._create_dashboard()
    
    def _create_dashboard(self) -> None:
        """
        Create CloudWatch dashboard with proper Output handling.
        
        This addresses model failure #16 by using Output.all() to resolve
        dynamic values before JSON serialization.
        """
        dashboard_name = self.config.get_resource_name('dashboard')
        
        # Use Output.all() to resolve region before creating dashboard body
        dashboard_body = Output.all(
            region=self.config.primary_region,
            namespace=self.config.metric_namespace
        ).apply(lambda args: json.dumps({
            'widgets': [
                # Transaction Volume
                {
                    'type': 'metric',
                    'x': 0,
                    'y': 0,
                    'width': 8,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [args['namespace'], 'TransactionVolume', {'stat': 'Sum', 'label': 'Total Transactions'}]
                        ],
                        'period': 60,
                        'stat': 'Sum',
                        'region': args['region'],
                        'title': 'Transaction Volume',
                        'yAxis': {'left': {'min': 0}},
                        'view': 'timeSeries',
                        'stacked': False
                    }
                },
                # Error Rate
                {
                    'type': 'metric',
                    'x': 8,
                    'y': 0,
                    'width': 8,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [{'expression': '(m1 / m2) * 100', 'label': 'Error Rate %', 'id': 'e1'}],
                            [args['namespace'], 'ErrorCount', {'id': 'm1', 'visible': False}],
                            [args['namespace'], 'TransactionVolume', {'id': 'm2', 'visible': False}]
                        ],
                        'period': 60,
                        'stat': 'Sum',
                        'region': args['region'],
                        'title': 'Error Rate',
                        'yAxis': {'left': {'min': 0, 'max': 5}},
                        'view': 'timeSeries',
                        'annotations': {
                            'horizontal': [{
                                'value': 1,
                                'label': 'Error Threshold',
                                'color': '#ff0000'
                            }]
                        }
                    }
                },
                # Processing Time
                {
                    'type': 'metric',
                    'x': 16,
                    'y': 0,
                    'width': 8,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [args['namespace'], 'ProcessingTime', {'stat': 'Average', 'label': 'Avg Processing Time'}],
                            [args['namespace'], 'ProcessingTime', {'stat': 'p99', 'label': 'p99 Processing Time'}]
                        ],
                        'period': 60,
                        'stat': 'Average',
                        'region': args['region'],
                        'title': 'Processing Time (ms)',
                        'yAxis': {'left': {'min': 0}},
                        'view': 'timeSeries'
                    }
                },
                # API Latency
                {
                    'type': 'metric',
                    'x': 0,
                    'y': 6,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [args['namespace'], 'APILatency', {'stat': 'Average', 'label': 'Avg Latency'}],
                            [args['namespace'], 'APILatency', {'stat': 'p99', 'label': 'p99 Latency'}]
                        ],
                        'period': 60,
                        'stat': 'Average',
                        'region': args['region'],
                        'title': 'API Latency (ms)',
                        'yAxis': {'left': {'min': 0}},
                        'view': 'timeSeries',
                        'annotations': {
                            'horizontal': [{
                                'value': 500,
                                'label': 'Latency Threshold',
                                'color': '#ff9900'
                            }]
                        }
                    }
                },
                # Database Health
                {
                    'type': 'metric',
                    'x': 12,
                    'y': 6,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [args['namespace'], 'DatabaseConnections', {'stat': 'Average', 'label': 'Active Connections'}],
                            [args['namespace'], 'ConnectionFailures', {'stat': 'Sum', 'label': 'Connection Failures'}]
                        ],
                        'period': 60,
                        'stat': 'Average',
                        'region': args['region'],
                        'title': 'Database Health',
                        'view': 'timeSeries'
                    }
                }
            ]
        }))
        
        # Create dashboard with properly resolved body
        self.dashboard = aws.cloudwatch.Dashboard(
            'payment-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body,
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_dashboard_name(self) -> Output[str]:
        """
        Get the dashboard name as Output.
        
        Returns:
            Dashboard name as Output
        """
        return self.dashboard.dashboard_name if self.dashboard else Output.from_input('')
    
    def get_dashboard_url(self) -> Output[str]:
        """
        Get the dashboard URL as Output.
        
        Returns:
            Dashboard URL as Output
        """
        if not self.dashboard:
            return Output.from_input('')
        
        return Output.all(
            region=self.config.primary_region,
            name=self.dashboard.dashboard_name
        ).apply(lambda args: 
            f"https://console.aws.amazon.com/cloudwatch/home?region={args['region']}#dashboards:name={args['name']}"
        )

