"""
tap_stack.py

Main Pulumi ComponentResource for multi-environment infrastructure.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output

from lib.config import EnvironmentConfig
from lib.vpc_stack import VpcStack
from lib.dynamodb_stack import DynamoDBStack
from lib.s3_stack import S3Stack
from lib.lambda_stack import LambdaStack
from lib.api_gateway_stack import ApiGatewayStack
from lib.cloudfront_stack import CloudFrontStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix: Environment identifier (dev, staging, prod)
        tags: Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for multi-environment payment processing infrastructure.

    This component orchestrates the deployment of:
    - VPC with private subnets and VPC endpoints
    - DynamoDB tables with environment-specific capacity
    - S3 buckets with lifecycle policies
    - Lambda functions with environment-specific configurations
    - API Gateway with throttling
    - CloudFront distributions

    Args:
        name: The logical name of this Pulumi component
        args: Configuration arguments including environment suffix and tags
        opts: Pulumi options
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        environment_suffix = args.environment_suffix

        # Extract base environment from suffix (for PR-based environments, default to 'dev')
        # Valid base environments: dev, staging, prod
        # PR-based suffixes like 'pr7669' should use 'dev' configuration
        base_environment = environment_suffix
        if environment_suffix.startswith('pr') or environment_suffix not in ['dev', 'staging', 'prod']:
            base_environment = 'dev'

        # Load environment configuration using base environment
        env_config = EnvironmentConfig(base_environment)
        env_config.validate_capacity()

        # Get common tags
        tags = env_config.get_common_tags()
        if args.tags:
            tags.update(args.tags)

        # Deploy VPC infrastructure
        vpc_stack = VpcStack(
            f"vpc-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Deploy DynamoDB tables
        dynamodb_stack = DynamoDBStack(
            f"dynamodb-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            read_capacity=env_config.get("dynamodb_read_capacity"),
            write_capacity=env_config.get("dynamodb_write_capacity"),
            enable_pitr=env_config.get("dynamodb_pitr"),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Deploy S3 buckets
        s3_stack = S3Stack(
            f"s3-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            log_retention_days=env_config.get("s3_log_retention_days"),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Deploy Lambda functions
        lambda_stack = LambdaStack(
            f"lambda-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            memory_size=env_config.get("lambda_memory"),
            timeout=env_config.get("lambda_timeout"),
            transactions_table_name=dynamodb_stack.transactions_table.name,
            transactions_table_arn=dynamodb_stack.transactions_table.arn,
            sessions_table_name=dynamodb_stack.sessions_table.name,
            sessions_table_arn=dynamodb_stack.sessions_table.arn,
            subnet_ids=[vpc_stack.private_subnet_a.id, vpc_stack.private_subnet_b.id],
            security_group_id=vpc_stack.lambda_sg.id,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Deploy API Gateway
        api_stack = ApiGatewayStack(
            f"api-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            payment_processor_invoke_arn=lambda_stack.payment_processor.invoke_arn,
            payment_processor_arn=lambda_stack.payment_processor.arn,
            session_manager_invoke_arn=lambda_stack.session_manager.invoke_arn,
            session_manager_arn=lambda_stack.session_manager.arn,
            api_logs_bucket_arn=s3_stack.api_logs_bucket.arn,
            throttle_burst=env_config.get("api_throttle_burst"),
            throttle_rate=env_config.get("api_throttle_rate"),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Extract API domain from API URL
        api_domain = api_stack.api_url.apply(lambda url: url.replace("https://", "").split("/")[0])

        # Deploy CloudFront
        cloudfront_stack = CloudFrontStack(
            f"cloudfront-stack-{environment_suffix}",
            environment_suffix=environment_suffix,
            api_domain=api_domain,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        pulumi.export("vpc_id", vpc_stack.vpc.id)
        pulumi.export("transactions_table_name", dynamodb_stack.transactions_table.name)
        pulumi.export("sessions_table_name", dynamodb_stack.sessions_table.name)
        pulumi.export("api_logs_bucket_name", s3_stack.api_logs_bucket.bucket)
        pulumi.export("api_endpoint", api_stack.api_url)
        pulumi.export("cloudfront_domain", cloudfront_stack.distribution.domain_name)
        pulumi.export("cloudfront_distribution_id", cloudfront_stack.distribution.id)
        pulumi.export("environment", environment_suffix)

        # Register outputs
        self.register_outputs({
            "vpc_id": vpc_stack.vpc.id,
            "transactions_table_name": dynamodb_stack.transactions_table.name,
            "sessions_table_name": dynamodb_stack.sessions_table.name,
            "api_endpoint": api_stack.api_url,
            "cloudfront_domain": cloudfront_stack.distribution.domain_name,
        })
