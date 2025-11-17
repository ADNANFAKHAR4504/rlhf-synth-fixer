"""
Main Pulumi stack for multi-region disaster recovery trading platform.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions

from infrastructure.route53_stack import Route53Stack
from infrastructure.aurora_stack import AuroraStack
from infrastructure.lambda_stack import LambdaStack
from infrastructure.dynamodb_stack import DynamoDBStack
from infrastructure.s3_stack import S3Stack
from infrastructure.api_gateway_stack import ApiGatewayStack
from infrastructure.monitoring_stack import MonitoringStack
from infrastructure.failover_stack import FailoverStack
from infrastructure.sns_stack import SnsStack
from infrastructure.synthetics_stack import SyntheticsStack


class TapStackArgs:
    """Arguments for the TapStack component."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        primary_region: str = "eu-central-1",
        secondary_region: str = "eu-central-2",
        domain_name: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.domain_name = domain_name


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for multi-region disaster recovery trading platform.

    BUG #1: Missing proper dependency chain - components created in wrong order
    BUG #2: No error handling for missing outputs
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.primary_region = args.primary_region
        self.secondary_region = args.secondary_region

        # BUG #1: Creating Aurora BEFORE SNS, but Aurora monitoring needs SNS
        # CORRECT: SNS should be created first
        self.aurora_stack = AuroraStack(
            f"aurora-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # SNS created after Aurora - will cause issues with monitoring
        self.sns_stack = SnsStack(
            f"sns-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB stack
        self.dynamodb_stack = DynamoDBStack(
            f"dynamodb-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # S3 stack
        self.s3_stack = S3Stack(
            f"s3-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # BUG #2: Lambda stack missing depends_on for Aurora and DynamoDB
        # Lambda needs these to exist first for environment variables
        self.lambda_stack = LambdaStack(
            f"lambda-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_endpoint=self.aurora_stack.primary_endpoint,
            dynamodb_table_name=self.dynamodb_stack.table_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)  # Missing depends_on!
        )

        # API Gateway stack
        self.api_gateway_stack = ApiGatewayStack(
            f"api-gateway-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            primary_lambda_arn=self.lambda_stack.primary_function_arn,
            secondary_lambda_arn=self.lambda_stack.secondary_function_arn,
            domain_name=args.domain_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_stack])
        )

        # Route 53 stack
        self.route53_stack = Route53Stack(
            f"route53-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_endpoint=self.api_gateway_stack.primary_api_endpoint,
            secondary_endpoint=self.api_gateway_stack.secondary_api_endpoint,
            domain_name=args.domain_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_gateway_stack])
        )

        # Monitoring stack
        self.monitoring_stack = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_cluster_id=self.aurora_stack.primary_cluster_id,
            lambda_function_name=self.lambda_stack.primary_function_name,
            api_gateway_id=self.api_gateway_stack.primary_api_id,
            sns_topic_arn=self.sns_stack.primary_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)  # BUG #3: Missing depends_on for all resources
        )

        # Synthetics stack
        self.synthetics_stack = SyntheticsStack(
            f"synthetics-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            primary_api_endpoint=self.api_gateway_stack.primary_api_endpoint,
            secondary_api_endpoint=self.api_gateway_stack.secondary_api_endpoint,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_gateway_stack])
        )

        # Failover stack
        self.failover_stack = FailoverStack(
            f"failover-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            primary_region=self.primary_region,
            secondary_region=self.secondary_region,
            aurora_global_cluster_id=self.aurora_stack.global_cluster_id,
            secondary_cluster_arn=self.aurora_stack.secondary_cluster_arn,
            route53_health_check_id=self.route53_stack.health_check_id,
            composite_alarm_arn=self.monitoring_stack.composite_alarm_arn,
            sns_topic_arn=self.sns_stack.primary_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[
                self.aurora_stack,
                self.route53_stack,
                self.monitoring_stack,
                self.sns_stack
            ])
        )

        # Register outputs using register_outputs
        self.register_outputs({
            # Aurora outputs
            'aurora_global_cluster_id': self.aurora_stack.global_cluster_id,
            'aurora_primary_cluster_id': self.aurora_stack.primary_cluster_id,
            'aurora_primary_endpoint': self.aurora_stack.primary_endpoint,
            'aurora_secondary_endpoint': self.aurora_stack.secondary_endpoint,
            'aurora_secondary_cluster_arn': self.aurora_stack.secondary_cluster_arn,
            
            # DynamoDB outputs
            'dynamodb_table_name': self.dynamodb_stack.table_name,
            'dynamodb_table_arn': self.dynamodb_stack.table_arn,
            
            # S3 outputs
            's3_primary_bucket_name': self.s3_stack.primary_bucket_name,
            's3_secondary_bucket_name': self.s3_stack.secondary_bucket_name,
            
            # Lambda outputs
            'lambda_primary_function_arn': self.lambda_stack.primary_function_arn,
            'lambda_secondary_function_arn': self.lambda_stack.secondary_function_arn,
            'lambda_primary_function_name': self.lambda_stack.primary_function_name,
            
            # API Gateway outputs
            'api_primary_api_id': self.api_gateway_stack.primary_api_id,
            'api_primary_endpoint': self.api_gateway_stack.primary_api_endpoint,
            'api_secondary_endpoint': self.api_gateway_stack.secondary_api_endpoint,
            
            # Route53 outputs
            'route53_health_check_id': self.route53_stack.health_check_id,
            
            # SNS outputs
            'sns_primary_topic_arn': self.sns_stack.primary_topic_arn,
            'sns_secondary_topic_arn': self.sns_stack.secondary_topic_arn,
            
            # Monitoring outputs
            'monitoring_composite_alarm_arn': self.monitoring_stack.composite_alarm_arn,
            'monitoring_aurora_cpu_alarm_arn': self.monitoring_stack.aurora_cpu_alarm.arn,
            'monitoring_lambda_error_alarm_arn': self.monitoring_stack.lambda_error_alarm.arn,
            'monitoring_api_error_alarm_arn': self.monitoring_stack.api_error_alarm.arn,
            
            # Synthetics outputs
            'synthetics_primary_canary_name': self.synthetics_stack.primary_canary.name,
            'synthetics_secondary_canary_name': self.synthetics_stack.secondary_canary.name,
            
            # Failover outputs
            'failover_function_arn': self.failover_stack.failover_function_arn,
            'failover_function_name': self.failover_stack.failover_function_name,
        })

        # Export outputs using pulumi.export()
        # Aurora outputs
        pulumi.export('aurora_global_cluster_id', self.aurora_stack.global_cluster_id)
        pulumi.export('aurora_primary_cluster_id', self.aurora_stack.primary_cluster_id)
        pulumi.export('aurora_primary_endpoint', self.aurora_stack.primary_endpoint)
        pulumi.export('aurora_secondary_endpoint', self.aurora_stack.secondary_endpoint)
        pulumi.export('aurora_secondary_cluster_arn', self.aurora_stack.secondary_cluster_arn)
        
        # DynamoDB outputs
        pulumi.export('dynamodb_table_name', self.dynamodb_stack.table_name)
        pulumi.export('dynamodb_table_arn', self.dynamodb_stack.table_arn)
        
        # S3 outputs
        pulumi.export('s3_primary_bucket_name', self.s3_stack.primary_bucket_name)
        pulumi.export('s3_secondary_bucket_name', self.s3_stack.secondary_bucket_name)
        
        # Lambda outputs
        pulumi.export('lambda_primary_function_arn', self.lambda_stack.primary_function_arn)
        pulumi.export('lambda_secondary_function_arn', self.lambda_stack.secondary_function_arn)
        pulumi.export('lambda_primary_function_name', self.lambda_stack.primary_function_name)
        
        # API Gateway outputs
        pulumi.export('api_primary_api_id', self.api_gateway_stack.primary_api_id)
        pulumi.export('api_primary_endpoint', self.api_gateway_stack.primary_api_endpoint)
        pulumi.export('api_secondary_endpoint', self.api_gateway_stack.secondary_api_endpoint)
        
        # Route53 outputs
        pulumi.export('route53_health_check_id', self.route53_stack.health_check_id)
        
        # SNS outputs
        pulumi.export('sns_primary_topic_arn', self.sns_stack.primary_topic_arn)
        pulumi.export('sns_secondary_topic_arn', self.sns_stack.secondary_topic_arn)
        
        # Monitoring outputs
        pulumi.export('monitoring_composite_alarm_arn', self.monitoring_stack.composite_alarm_arn)
        pulumi.export('monitoring_aurora_cpu_alarm_arn', self.monitoring_stack.aurora_cpu_alarm.arn)
        pulumi.export('monitoring_lambda_error_alarm_arn', self.monitoring_stack.lambda_error_alarm.arn)
        pulumi.export('monitoring_api_error_alarm_arn', self.monitoring_stack.api_error_alarm.arn)
        
        # Synthetics outputs
        pulumi.export('synthetics_primary_canary_name', self.synthetics_stack.primary_canary.name)
        pulumi.export('synthetics_secondary_canary_name', self.synthetics_stack.secondary_canary.name)
        
        # Failover outputs
        pulumi.export('failover_function_arn', self.failover_stack.failover_function_arn)
        pulumi.export('failover_function_name', self.failover_stack.failover_function_name)