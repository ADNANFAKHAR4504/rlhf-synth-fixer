#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import pulumi
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variable or config
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'Project': 'LogisticsEventProcessor',
    'ManagedBy': 'Pulumi'
}

# Create TapStack arguments with configuration
args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=default_tags,
    log_retention_days=config.get_int("log_retention_days") or 7,
    alert_email=config.get("alert_email") or "devops@example.com",
    enable_xray=config.get_bool("enable_xray") or False
)

# Instantiate the main stack
stack = TapStack(
    name=f"TapStack{environment_suffix}",
    args=args
)

# Export stack outputs
pulumi.export("event_bus_name", stack.event_bus.name)
pulumi.export("event_bus_arn", stack.event_bus.arn)
pulumi.export("shipment_table_name", stack.shipment_events_table.name)
pulumi.export("shipment_table_arn", stack.shipment_events_table.arn)
pulumi.export("error_table_name", stack.error_events_table.name)
pulumi.export("error_table_arn", stack.error_events_table.arn)
pulumi.export("alert_topic_arn", stack.alert_topic.arn)
pulumi.export("processing_topic_arn", stack.processing_topic.arn)
pulumi.export("shipment_processor_arn", stack.shipment_processor.arn)
pulumi.export("shipment_processor_name", stack.shipment_processor.name)
pulumi.export("status_updater_arn", stack.status_updater.arn)
pulumi.export("status_updater_name", stack.status_updater.name)
pulumi.export("notification_handler_arn", stack.notification_handler.arn)
pulumi.export("notification_handler_name", stack.notification_handler.name)

