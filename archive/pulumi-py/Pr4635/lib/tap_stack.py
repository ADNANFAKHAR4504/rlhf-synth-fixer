"""
tap_stack.py

Main Pulumi stack for High Availability infrastructure.
Orchestrates all infrastructure components and exports outputs for integration tests.
"""

from typing import Optional

import pulumi
# Import infrastructure modules using relative imports
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.compute import ComputeStack
from infrastructure.config import Config
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaFunctionsStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.networking import NetworkingStack
from infrastructure.parameter_store import ParameterStoreManager
from infrastructure.sns import SNSStack
from infrastructure.state_manager import StateManager
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    Arguments for TapStack.
    
    Args:
        environment_suffix: Environment suffix from ENVIRONMENT_SUFFIX env var
        email_endpoint: Optional email for SNS notifications
        use_default_vpc: Whether to use default VPC
    """
    
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        email_endpoint: Optional[str] = None,
        use_default_vpc: bool = False
    ):
        self.environment_suffix = environment_suffix
        self.email_endpoint = email_endpoint
        self.use_default_vpc = use_default_vpc


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi stack for High Availability infrastructure.
    
    This stack creates:
    - S3 buckets for logs and state storage
    - IAM roles with least-privilege policies
    - Auto Scaling groups with health checks
    - Lambda functions for rollback and monitoring
    - CloudWatch alarms and dashboards
    - SNS topics for notifications
    - SSM Parameter Store for configuration
    
    All outputs are exported via pulumi.export() for integration tests.
    """
    
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        # Initialize configuration
        self.config = Config()
        
        # Override environment suffix if provided
        if args.environment_suffix:
            self.config.environment_suffix = args.environment_suffix
        
        # Initialize provider manager
        self.provider_manager = AWSProviderManager(
            primary_region=self.config.primary_region,
            secondary_regions=self.config.secondary_regions
        )
        
        # Create infrastructure components
        self._create_infrastructure(args)
        
        # Register outputs
        self._register_outputs()
    
    def _create_infrastructure(self, args: TapStackArgs):
        """Create all infrastructure components."""
        # 1. Create storage resources
        self.storage_stack = StorageStack(self.config)
        
        # 2. Create IAM roles
        self.iam_stack = IAMStack(self.config)
        
        # 3. Create SNS topic
        self.sns_stack = SNSStack(self.config, args.email_endpoint)
        
        # 4. Create networking
        self.networking_stack = NetworkingStack(
            self.config,
            use_default_vpc=args.use_default_vpc
        )
        
        # 5. Create compute resources
        self.compute_stack = ComputeStack(
            self.config,
            vpc_id=self.networking_stack.get_vpc_id(),
            subnet_ids=self.networking_stack.get_primary_subnet_ids(),
            instance_role=self.iam_stack.get_role('instance')
        )
        
        # 6. Create monitoring
        self.monitoring_stack = MonitoringStack(
            self.config,
            sns_topic_arn=self.sns_stack.get_topic_arn()
        )
        
        # Setup alarms
        self.monitoring_stack.setup_standard_alarms(
            asg_name=self.compute_stack.get_asg_name()
        )
        
        # Create dashboard
        self.dashboard = self.monitoring_stack.create_dashboard(
            asg_name=self.compute_stack.get_asg_name()
        )
        
        # 7. Create Lambda functions
        self.lambda_stack = LambdaFunctionsStack(
            self.config,
            rollback_role=self.iam_stack.get_role('rollback'),
            monitoring_role=self.iam_stack.get_role('monitoring'),
            cleanup_role=self.iam_stack.get_role('cleanup'),
            state_bucket_name=self.storage_stack.get_state_bucket_name(),
            sns_topic_arn=self.sns_stack.get_topic_arn()
        )
        
        # 8. Create Parameter Store
        self.parameter_store = ParameterStoreManager(self.config)
        
        # 9. Create state manager
        self.state_manager = StateManager(
            self.config,
            state_bucket=self.storage_stack.state_bucket
        )
        
        # 10. Create EventBridge schedules for health checks
        self._create_event_schedules()
    
    def _create_event_schedules(self):
        """Create EventBridge schedules for periodic tasks."""
        import pulumi_aws as aws

        # Health check schedule (every minute)
        health_check_rule = aws.cloudwatch.EventRule(
            'health-check-schedule',
            name=self.config.get_resource_name('health-check-schedule'),
            schedule_expression='rate(1 minute)',  # Use singular 'minute' for rate of 1
            description='Periodic health check trigger',
            state='ENABLED'  # Use 'state' instead of deprecated 'is_enabled'
        )
        
        # Lambda permission for EventBridge
        aws.lambda_.Permission(
            'health-check-lambda-permission',
            statement_id='AllowExecutionFromCloudWatch',
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_monitoring_lambda_name(),
            principal='events.amazonaws.com',
            source_arn=health_check_rule.arn
        )
        
        # EventBridge target
        health_check_target = aws.cloudwatch.EventTarget(
            'health-check-target',
            rule=health_check_rule.name,
            arn=self.lambda_stack.get_monitoring_lambda_arn()
        )
        
        # Cleanup schedule (daily)
        cleanup_rule = aws.cloudwatch.EventRule(
            'cleanup-schedule',
            name=self.config.get_resource_name('cleanup-schedule'),
            schedule_expression='rate(1 day)',
            description='Daily cleanup schedule',
            state='ENABLED'  # Use 'state' instead of deprecated 'is_enabled'
        )
        
        # Lambda permission for cleanup
        aws.lambda_.Permission(
            'cleanup-lambda-permission',
            statement_id='AllowExecutionFromCloudWatch',
            action='lambda:InvokeFunction',
            function=self.lambda_stack.cleanup_lambda.name,
            principal='events.amazonaws.com',
            source_arn=cleanup_rule.arn
        )
        
        # Cleanup target
        cleanup_target = aws.cloudwatch.EventTarget(
            'cleanup-target',
            rule=cleanup_rule.name,
            arn=self.lambda_stack.get_cleanup_lambda_arn()
        )
    
    def _register_outputs(self):
        """
        Register and export all outputs for integration tests.
        
        Addresses the requirement to export outputs via pulumi.export().
        """
        outputs = {
            # Storage
            'log_bucket_name': self.storage_stack.get_log_bucket_name(),
            'log_bucket_arn': self.storage_stack.get_log_bucket_arn(),
            'state_bucket_name': self.storage_stack.get_state_bucket_name(),
            'state_bucket_arn': self.storage_stack.get_state_bucket_arn(),
            
            # Compute
            'asg_name': self.compute_stack.get_asg_name(),
            'asg_arn': self.compute_stack.get_asg_arn(),
            
            # Lambda
            'rollback_lambda_arn': self.lambda_stack.get_rollback_lambda_arn(),
            'rollback_lambda_name': self.lambda_stack.get_rollback_lambda_name(),
            'monitoring_lambda_arn': self.lambda_stack.get_monitoring_lambda_arn(),
            'monitoring_lambda_name': self.lambda_stack.get_monitoring_lambda_name(),
            'cleanup_lambda_arn': self.lambda_stack.get_cleanup_lambda_arn(),
            
            # SNS
            'sns_topic_arn': self.sns_stack.get_topic_arn(),
            'sns_topic_name': self.sns_stack.get_topic_name(),
            
            # Monitoring
            'dashboard_name': self.dashboard.dashboard_name,
            
            # Configuration
            'environment': Output.from_input(self.config.environment_suffix),
            'region': Output.from_input(self.config.primary_region),
            'app_name': Output.from_input(self.config.app_name)
        }
        
        # Export outputs to Pulumi stack level
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            # Handle cases where pulumi.export() may not be available (e.g., tests)
            pulumi.log.warn(f"Could not export output {key}: {e}")
        
        # Also register outputs at component level for backward compatibility
        self.register_outputs(outputs)
