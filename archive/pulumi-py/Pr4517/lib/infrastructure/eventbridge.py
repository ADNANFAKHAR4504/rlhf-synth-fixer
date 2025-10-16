"""
EventBridge configuration for the event processing pipeline.

This module creates EventBridge event buses, rules, and targets
with proper provider handling for multi-region deployment.
"""

from typing import Dict, List

import pulumi
from aws_provider import AWSProviderManager
from lambda_functions import LambdaStack
from pulumi_aws import cloudwatch, lambda_

from config import PipelineConfig


class EventBridgeStack:
    """Creates EventBridge components for event processing."""
    
    def __init__(self, config: PipelineConfig, provider_manager: AWSProviderManager, lambda_stack: LambdaStack):
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.event_buses: Dict[str, cloudwatch.EventBus] = {}
        self.rules: Dict[str, cloudwatch.EventRule] = {}
        self.targets: Dict[str, cloudwatch.EventTarget] = {}
        self.permissions: Dict[str, lambda_.Permission] = {}
        
        self._create_event_buses()
        self._create_rules()
        self._create_targets()
        self._create_permissions()
    
    def _create_event_buses(self):
        """Create EventBridge event buses in each region."""
        for region in self.config.regions:
            bus_name = self.config.get_resource_name('trading-events-bus', region)
            
            self.event_buses[region] = cloudwatch.EventBus(
                f"trading-events-bus-{region}",
                name=bus_name,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_rules(self):
        """Create EventBridge rules for routing trading events."""
        for region in self.config.regions:
            rule_name = self.config.get_resource_name('trading-events-rule', region)
            
            # Define event pattern for trading events
            # This pattern accepts events from production and integration test sources
            # The Lambda function handles validation internally
            import json
            event_pattern = json.dumps({
                "source": [
                    {"prefix": "trading."},       # Production events: trading.platform
                    {"prefix": "integration."}    # Integration test events: integration.e2e.*, integration.test.*
                ],
                "detail-type": [
                    "Order Placed",
                    "Order Filled", 
                    "Order Cancelled",
                    "Trade Executed",
                    "Trade Execution",           # For integration tests
                    "Market Data Update",
                    "Multi-Region Trade"         # For integration tests
                ]
            })
            
            self.rules[region] = cloudwatch.EventRule(
                f"trading-events-rule-{region}",
                name=rule_name,
                event_bus_name=self.event_buses[region].name,
                event_pattern=event_pattern,
                description="Route trading events to event processor",
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_targets(self):
        """Create EventBridge targets for Lambda functions."""
        for region in self.config.regions:
            target_name = self.config.get_resource_name('lambda-target', region)
            
            # Get Lambda function ARN
            lambda_arn = self.lambda_stack.get_function_arn(region)
            
            self.targets[region] = cloudwatch.EventTarget(
                f"lambda-target-{region}",
                rule=self.rules[region].name,
                event_bus_name=self.event_buses[region].name,
                arn=lambda_arn,
                target_id=target_name,
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_permissions(self):
        """Create Lambda permissions for EventBridge invocation."""
        for region in self.config.regions:
            permission_name = self.config.get_resource_name('eventbridge-lambda-permission', region)
            
            # Get Lambda function name
            lambda_name = self.lambda_stack.get_function_name(region)
            
            # Get rule ARN - EventBridge invokes Lambda through the rule, not the bus
            rule_arn = self.rules[region].arn
            
            self.permissions[region] = lambda_.Permission(
                f"eventbridge-lambda-permission-{region}",
                statement_id=permission_name,
                action="lambda:InvokeFunction",
                function=lambda_name,
                principal="events.amazonaws.com",
                source_arn=rule_arn,
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def get_event_bus_arn(self, region: str) -> pulumi.Output[str]:
        """Get EventBridge event bus ARN for a region."""
        return self.event_buses[region].arn
    
    def get_event_bus_name(self, region: str) -> pulumi.Output[str]:
        """Get EventBridge event bus name for a region."""
        return self.event_buses[region].name
    
    def get_rule_arn(self, region: str) -> pulumi.Output[str]:
        """Get EventBridge rule ARN for a region."""
        return self.rules[region].arn
