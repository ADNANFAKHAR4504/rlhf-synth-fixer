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
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions, Output
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from environment variables, fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
pr_number = os.getenv('PR_NUMBER', 'unknown')
team = os.getenv('TEAM', 'unknown')
created_at = datetime.now(timezone.utc).isoformat()


# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    "CreatedAt": created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider('aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

stack = TapStack(
    name="TapStack",
    args=TapStackArgs(environment_suffix=environment_suffix),
    opts=ResourceOptions(provider=provider)
)

# Export all outputs expected by integration tests
# Global Accelerator
pulumi.export("GlobalAcceleratorDnsName", stack.accelerator.dns_name)

# FIX: Use Output.apply() to safely access ip_sets (it's an Output, not a regular list)
static_ip1 = stack.accelerator.ip_sets.apply(
    lambda ip_sets: ip_sets[0].ip_addresses[0] if ip_sets and len(ip_sets) > 0 and len(ip_sets[0].ip_addresses) > 0 else ""
)
static_ip2 = stack.accelerator.ip_sets.apply(
    lambda ip_sets: ip_sets[0].ip_addresses[1] if ip_sets and len(ip_sets) > 0 and len(ip_sets[0].ip_addresses) > 1 else ""
)
pulumi.export("GlobalAcceleratorStaticIP1", static_ip1)
pulumi.export("GlobalAcceleratorStaticIP2", static_ip2)

# VPC Networking
pulumi.export("PrimaryVpcId", stack.primary_vpc.id)
pulumi.export("SecondaryVpcId", stack.secondary_vpc.id)
pulumi.export("VpcPeeringConnectionId", stack.vpc_peering.id)

# Network Load Balancers
pulumi.export("PrimaryNLBDnsName", stack.primary_nlb.dns_name)
pulumi.export("SecondaryNLBDnsName", stack.secondary_nlb.dns_name)
pulumi.export("PrimaryNLBArn", stack.primary_nlb.arn)
pulumi.export("SecondaryNLBArn", stack.secondary_nlb.arn)

# Health Checks
pulumi.export("PrimaryHealthCheckId", stack.primary_health_check.id)
pulumi.export("SecondaryHealthCheckId", stack.secondary_health_check.id)

# API Gateway
# Construct API endpoint URLs
primary_api_endpoint = Output.all(stack.primary_api.id).apply(
    lambda args: f"https://{args[0]}.execute-api.us-east-1.amazonaws.com/prod"
)
secondary_api_endpoint = Output.all(stack.secondary_api.id).apply(
    lambda args: f"https://{args[0]}.execute-api.us-east-2.amazonaws.com/prod"
)
pulumi.export("PrimaryApiEndpoint", primary_api_endpoint)
pulumi.export("SecondaryApiEndpoint", secondary_api_endpoint)

# Parameter Store
pulumi.export("PrimaryParameterDBEndpoint", stack.primary_db_endpoint_param.name)
pulumi.export("PrimaryParameterAPIKey", stack.primary_api_key_param.name)
pulumi.export("PrimaryParameterFeatureFlag", stack.primary_feature_flag_param.name)

# Storage (S3 and DynamoDB)
pulumi.export("PrimaryS3BucketName", stack.primary_bucket.id)
pulumi.export("SecondaryS3BucketName", stack.secondary_bucket.id)
pulumi.export("DynamoDBTableName", stack.dynamodb_table.name)
pulumi.export("DynamoDBTableArn", stack.dynamodb_table.arn)

# Aurora Global Database
pulumi.export("AuroraGlobalClusterId", stack.global_cluster.id)
pulumi.export("PrimaryAuroraClusterId", stack.primary_cluster.id)
pulumi.export("PrimaryAuroraEndpoint", stack.primary_cluster.endpoint)
pulumi.export("SecondaryAuroraClusterId", stack.secondary_cluster.id)
pulumi.export("SecondaryAuroraEndpoint", stack.secondary_cluster.endpoint)

# Lambda Functions
pulumi.export("PrimaryLambdaArn", stack.primary_lambda.arn)
pulumi.export("SecondaryLambdaArn", stack.secondary_lambda.arn)

# EventBridge
pulumi.export("PrimaryEventBusName", stack.event_bus_primary.name)
pulumi.export("SecondaryEventBusName", stack.event_bus_secondary.name)

# Monitoring (SNS)
pulumi.export("PrimarySNSTopicArn", stack.primary_sns_topic.arn)
pulumi.export("SecondarySNSTopicArn", stack.secondary_sns_topic.arn)

# AWS Backup
pulumi.export("PrimaryBackupVaultName", stack.backup_vault_primary.name)
pulumi.export("SecondaryBackupVaultName", stack.backup_vault_secondary.name)
