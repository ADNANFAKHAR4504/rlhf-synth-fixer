"""
Main TapStack orchestrator for serverless infrastructure.

This module brings together all infrastructure components and
exports outputs for integration testing.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import get_aws_provider
from infrastructure.config import ServerlessConfig, initialize_config
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.notifications import NotificationsStack
from infrastructure.storage import StorageStack
from infrastructure.validation import run_all_validations


class TapStack(pulumi.ComponentResource):
    """
    Main stack orchestrator for serverless infrastructure.
    
    This component creates and links all infrastructure components:
    - Configuration and validation
    - AWS provider
    - IAM roles and policies
    - DynamoDB tables
    - S3 buckets
    - SNS topics
    - Lambda functions
    - API Gateway
    - CloudWatch monitoring
    
    All outputs are exported for integration testing.
    """
    
    def __init__(
        self,
        name: str,
        config: ServerlessConfig,
        opts: pulumi.ResourceOptions = None
    ):
        """
        Initialize TapStack.
        
        Args:
            name: Stack name
            config: ServerlessConfig instance
            opts: Pulumi resource options
        """
        super().__init__(
            "serverless:stack:TapStack",
            name,
            None,
            opts
        )
        
        self.config = config
        
        # Log configuration
        pulumi.log.info(f"Initializing TapStack with environment suffix: {config.environment_suffix}")
        pulumi.log.info(f"Region: {config.primary_region} ({config.region_short})")
        pulumi.log.info(f"Project: {config.project_name}")
        
        # Run validation
        pulumi.log.info("Running configuration validation...")
        run_all_validations(config)
        pulumi.log.info("Configuration validation passed")
        
        # Create AWS provider
        self.provider = get_aws_provider(config)
        
        # Create infrastructure components in dependency order
        pulumi.log.info("Creating IAM roles and policies...")
        self.iam = IAMStack(
            config=config,
            provider=self.provider,
            parent=self
        )
        
        pulumi.log.info("Creating DynamoDB tables...")
        self.dynamodb = DynamoDBStack(
            config=config,
            provider=self.provider,
            parent=self
        )
        
        pulumi.log.info("Creating S3 buckets...")
        self.storage = StorageStack(
            config=config,
            provider=self.provider,
            parent=self
        )
        
        pulumi.log.info("Creating SNS topics...")
        self.notifications = NotificationsStack(
            config=config,
            provider=self.provider,
            parent=self
        )
        
        pulumi.log.info("Creating Lambda functions...")
        self.lambda_functions = LambdaStack(
            config=config,
            provider=self.provider,
            iam_stack=self.iam,
            dynamodb_stack=self.dynamodb,
            storage_stack=self.storage,
            notifications_stack=self.notifications,
            parent=self
        )
        
        pulumi.log.info("Creating API Gateway...")
        self.api_gateway = APIGatewayStack(
            config=config,
            provider=self.provider,
            lambda_stack=self.lambda_functions,
            parent=self
        )
        
        pulumi.log.info("Creating CloudWatch monitoring...")
        self.monitoring = MonitoringStack(
            config=config,
            provider=self.provider,
            lambda_stack=self.lambda_functions,
            dynamodb_stack=self.dynamodb,
            notifications_stack=self.notifications,
            parent=self
        )
        
        # Attach IAM policies after all resources are created
        pulumi.log.info("Attaching IAM policies...")
        self._attach_iam_policies()
        
        # Register and export all outputs
        pulumi.log.info("Registering outputs...")
        self._register_outputs()
        
        pulumi.log.info("TapStack initialization complete")
    
    def _attach_iam_policies(self) -> None:
        """Attach IAM policies to Lambda roles with least-privilege access."""
        # API Handler policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.api_handler_role,
            self.monitoring.api_handler_log_group.arn,
            "api-handler"
        )
        self.iam.attach_dynamodb_policy(
            self.iam.api_handler_role,
            self.dynamodb.items_table.arn,
            "api-handler",
            read_only=False
        )
        self.iam.attach_sns_policy(
            self.iam.api_handler_role,
            self.notifications.notifications_topic.arn,
            "api-handler"
        )
        
        # File Processor policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.file_processor_role,
            self.monitoring.file_processor_log_group.arn,
            "file-processor"
        )
        self.iam.attach_s3_policy(
            self.iam.file_processor_role,
            self.storage.files_bucket.arn,
            "file-processor",
            read_only=True
        )
        self.iam.attach_dynamodb_policy(
            self.iam.file_processor_role,
            self.dynamodb.items_table.arn,
            "file-processor",
            read_only=False
        )
        self.iam.attach_sns_policy(
            self.iam.file_processor_role,
            self.notifications.notifications_topic.arn,
            "file-processor"
        )
        
        # Stream Processor policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.stream_processor_role,
            self.monitoring.stream_processor_log_group.arn,
            "stream-processor"
        )
        self.iam.attach_dynamodb_streams_policy(
            self.iam.stream_processor_role,
            self.dynamodb.items_table.arn,
            "stream-processor"
        )
        self.iam.attach_sns_policy(
            self.iam.stream_processor_role,
            self.notifications.notifications_topic.arn,
            "stream-processor"
        )
    
    def _register_outputs(self) -> None:
        """
        Register and export all stack outputs.
        
        These outputs are used by integration tests to interact
        with the deployed infrastructure.
        """
        outputs = {
            # Configuration
            "environment": self.config.environment,
            "environment_suffix": self.config.environment_suffix,
            "primary_region": self.config.primary_region,
            
            # DynamoDB
            "dynamodb_table_name": self.dynamodb.items_table.name,
            "dynamodb_table_arn": self.dynamodb.items_table.arn,
            
            # S3
            "s3_bucket_name": self.storage.files_bucket.id,
            "s3_bucket_arn": self.storage.files_bucket.arn,
            
            # SNS
            "sns_topic_arn": self.notifications.notifications_topic.arn,
            
            # Lambda Functions
            "api_handler_name": self.lambda_functions.api_handler.name,
            "api_handler_arn": self.lambda_functions.api_handler.arn,
            "file_processor_name": self.lambda_functions.file_processor.name,
            "file_processor_arn": self.lambda_functions.file_processor.arn,
            "stream_processor_name": self.lambda_functions.stream_processor.name,
            "stream_processor_arn": self.lambda_functions.stream_processor.arn,
            
            # API Gateway
            "api_gateway_id": self.api_gateway.rest_api.id,
            "api_gateway_url": self.api_gateway.api_url,
            
            # CloudWatch
            "api_handler_log_group_name": self.monitoring.api_handler_log_group.name,
            "api_handler_log_group_arn": self.monitoring.api_handler_log_group.arn,
            "file_processor_log_group_name": self.monitoring.file_processor_log_group.name,
            "file_processor_log_group_arn": self.monitoring.file_processor_log_group.arn,
            "stream_processor_log_group_name": self.monitoring.stream_processor_log_group.name,
            "stream_processor_log_group_arn": self.monitoring.stream_processor_log_group.arn,
            
            # IAM
            "api_handler_role_arn": self.iam.api_handler_role.arn,
            "file_processor_role_arn": self.iam.file_processor_role.arn,
            "stream_processor_role_arn": self.iam.stream_processor_role.arn,
        }
        
        # Register outputs with component
        self.register_outputs(outputs)
        
        # Export outputs at stack level for integration tests
        # Use try-except to handle environments where pulumi.export may not be available
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            pulumi.log.warn(f"Could not export outputs: {e}")
