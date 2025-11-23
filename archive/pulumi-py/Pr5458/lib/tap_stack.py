"""
Main stack orchestrator for the serverless infrastructure.

This module imports and links all infrastructure modules and exports outputs
for integration testing.
"""

import pulumi
from infrastructure import (APIGatewayStack, AWSProviderManager, DynamoDBStack,
                            IAMStack, KMSStack, LambdaStack, MonitoringStack,
                            ServerlessConfig, SQSStack, StepFunctionsStack,
                            StorageStack)
from pulumi import ComponentResource, Output, ResourceOptions


class TapStack(ComponentResource):
    """
    Main stack component that orchestrates all infrastructure resources.
    
    This stack creates a complete serverless infrastructure with:
    - S3 bucket with KMS encryption
    - DynamoDB table with correct schema
    - Lambda functions with proper configuration
    - API Gateway with throttling
    - Step Functions with service integration
    - CloudWatch monitoring with percentage-based alarms
    """
    
    def __init__(self, name: str, opts: ResourceOptions = None):
        """
        Initialize the Tap Stack.
        
        Args:
            name: Stack name
            opts: Resource options
        """
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        # Initialize configuration
        self.config = ServerlessConfig()
        
        # Initialize provider manager
        self.provider_manager = AWSProviderManager(self.config)
        
        # Create KMS key for S3 encryption
        self.kms_stack = KMSStack(self.config, self.provider_manager)
        
        # Create DynamoDB table
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        
        # Create S3 bucket
        self.storage_stack = StorageStack(
            self.config,
            self.provider_manager,
            self.kms_stack.get_s3_key_id()
        )
        
        # Create SQS Dead Letter Queues
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        
        # Create DLQs for each Lambda
        self.processing_dlq = self.sqs_stack.create_dlq('processing-lambda')
        self.upload_dlq = self.sqs_stack.create_dlq('upload-lambda')
        self.status_dlq = self.sqs_stack.create_dlq('status-lambda')
        self.results_dlq = self.sqs_stack.create_dlq('results-lambda')
        
        # Create IAM roles
        self.iam_stack = IAMStack(self.config, self.provider_manager)
        
        # Create Lambda role for processing function
        self.processing_lambda_role = self.iam_stack.create_lambda_role(
            'processing',
            s3_bucket_arns=[self.storage_stack.get_bucket_arn()],
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn()],
            sqs_queue_arns=[self.processing_dlq.arn],
            kms_key_arn=self.kms_stack.get_s3_key_arn()
        )
        
        # Create Lambda role for API functions
        self.api_lambda_role = self.iam_stack.create_lambda_role(
            'api',
            s3_bucket_arns=[self.storage_stack.get_bucket_arn()],
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn()],
            sqs_queue_arns=[
                self.upload_dlq.arn,
                self.status_dlq.arn,
                self.results_dlq.arn
            ],
            kms_key_arn=self.kms_stack.get_s3_key_arn()
        )
        
        # Create Lambda functions
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.sqs_stack,
            self.dynamodb_stack.get_table_name(),
            self.storage_stack.get_bucket_name()
        )
        
        # Create processing Lambda
        self.processing_lambda = self.lambda_stack.create_processing_lambda(
            self.processing_lambda_role
        )
        
        # Create API Lambda functions
        self.upload_lambda = self.lambda_stack.create_api_lambda(
            'upload',
            'api_handler.upload_handler',
            self.api_lambda_role
        )
        
        self.status_lambda = self.lambda_stack.create_api_lambda(
            'status',
            'api_handler.status_handler',
            self.api_lambda_role
        )
        
        self.results_lambda = self.lambda_stack.create_api_lambda(
            'results',
            'api_handler.results_handler',
            self.api_lambda_role
        )
        
        # Configure S3 event notification for processing Lambda
        # Grant S3 permission to invoke Lambda
        s3_lambda_permission = pulumi_aws.lambda_.Permission(
            "s3-invoke-processing-lambda",
            action="lambda:InvokeFunction",
            function=self.processing_lambda.name,
            principal="s3.amazonaws.com",
            source_arn=self.storage_stack.get_bucket_arn(),
            opts=ResourceOptions(provider=self.provider_manager.get_provider())
            if self.provider_manager.get_provider() else None
        )
        
        # Configure S3 bucket notification (depends on permission)
        self.storage_stack.configure_event_notification(
            self.processing_lambda.arn
        )
        
        # Create API Gateway
        self.api_gateway_stack = APIGatewayStack(self.config, self.provider_manager)
        self.api = self.api_gateway_stack.create_api(
            self.upload_lambda,
            self.status_lambda,
            self.results_lambda
        )
        
        # Create Step Functions role
        self.step_functions_role = self.iam_stack.create_step_functions_role(
            lambda_arns=[self.processing_lambda.arn],
            sqs_queue_arns=[self.processing_dlq.arn]
        )
        
        # Create Step Functions state machine
        self.step_functions_stack = StepFunctionsStack(
            self.config,
            self.provider_manager,
            self.step_functions_role
        )
        
        self.processing_workflow = self.step_functions_stack.create_processing_workflow(
            self.processing_lambda.arn,
            self.processing_dlq.url
        )
        
        # Create CloudWatch monitoring
        self.monitoring_stack = MonitoringStack(self.config, self.provider_manager)
        
        # Create alarms for Lambda functions
        self.monitoring_stack.create_lambda_error_alarm(
            self.processing_lambda.name,
            'processing'
        )
        self.monitoring_stack.create_lambda_throttle_alarm(
            self.processing_lambda.name,
            'processing'
        )
        
        # Create alarm for DynamoDB
        self.monitoring_stack.create_dynamodb_throttle_alarm(
            self.dynamodb_stack.get_table_name()
        )
        
        # Create alarm for API Gateway
        self.monitoring_stack.create_api_gateway_error_alarm(
            self.api.id,
            self.api_gateway_stack.get_stage_name()
        )
        
        # Create alarm for Step Functions
        self.monitoring_stack.create_step_functions_error_alarm(
            self.processing_workflow.arn
        )
        
        # Register outputs
        self._register_outputs()
        
        # Finish component registration
        self.register_outputs({})
    
    def _register_outputs(self) -> None:
        """
        Register and export all stack outputs for integration testing.
        
        All outputs are exported using pulumi.export() for use in integration tests.
        """
        # S3 outputs
        try:
            pulumi.export('s3_bucket_name', self.storage_stack.get_bucket_name())
            pulumi.export('s3_bucket_arn', self.storage_stack.get_bucket_arn())
        except Exception:
            pass  # Gracefully handle if export not available
        
        # DynamoDB outputs
        try:
            pulumi.export('dynamodb_table_name', self.dynamodb_stack.get_table_name())
            pulumi.export('dynamodb_table_arn', self.dynamodb_stack.get_table_arn())
        except Exception:
            pass
        
        # Lambda outputs
        try:
            pulumi.export('processing_lambda_name', self.processing_lambda.name)
            pulumi.export('processing_lambda_arn', self.processing_lambda.arn)
            pulumi.export('upload_lambda_name', self.upload_lambda.name)
            pulumi.export('upload_lambda_arn', self.upload_lambda.arn)
            pulumi.export('status_lambda_name', self.status_lambda.name)
            pulumi.export('status_lambda_arn', self.status_lambda.arn)
            pulumi.export('results_lambda_name', self.results_lambda.name)
            pulumi.export('results_lambda_arn', self.results_lambda.arn)
        except Exception:
            pass
        
        # API Gateway outputs
        try:
            pulumi.export('api_gateway_endpoint', self.api_gateway_stack.get_api_endpoint())
            pulumi.export('api_gateway_id', self.api_gateway_stack.get_api_id())
            pulumi.export('api_gateway_stage', self.api_gateway_stack.get_stage_name())
        except Exception:
            pass
        
        # Step Functions outputs
        try:
            pulumi.export('state_machine_arn', self.processing_workflow.arn)
            pulumi.export('state_machine_name', self.processing_workflow.name)
        except Exception:
            pass
        
        # SQS DLQ outputs
        try:
            pulumi.export('processing_dlq_url', self.processing_dlq.url)
            pulumi.export('processing_dlq_arn', self.processing_dlq.arn)
            pulumi.export('upload_dlq_url', self.upload_dlq.url)
            pulumi.export('status_dlq_url', self.status_dlq.url)
            pulumi.export('results_dlq_url', self.results_dlq.url)
        except Exception:
            pass
        
        # KMS outputs
        try:
            pulumi.export('kms_key_id', self.kms_stack.get_s3_key_id())
            pulumi.export('kms_key_arn', self.kms_stack.get_s3_key_arn())
        except Exception:
            pass
        
        # Configuration outputs
        try:
            pulumi.export('environment', self.config.environment)
            pulumi.export('environment_suffix', self.config.environment_suffix)
            pulumi.export('region', self.config.primary_region)
            pulumi.export('normalized_region', self.config.normalized_region)
        except Exception:
            pass


# Import pulumi_aws here to avoid circular import
import pulumi_aws
