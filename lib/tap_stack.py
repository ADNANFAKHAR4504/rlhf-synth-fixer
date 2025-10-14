"""
Main Pulumi stack for EC2 failure recovery infrastructure.
Orchestrates all components and exports outputs for integration tests.
"""
import pulumi
import pulumi_aws as aws

from lib.infrastructure.cloudwatch import CloudWatchStack
from lib.infrastructure.cloudwatch_events import CloudWatchEventsStack
from lib.infrastructure.config import EC2RecoveryConfig
from lib.infrastructure.iam import IAMStack
from lib.infrastructure.lambda_function import LambdaStack
from lib.infrastructure.parameter_store import ParameterStoreStack
from lib.infrastructure.s3 import S3Stack
from lib.infrastructure.sns import SNSStack


class EC2RecoveryStack:
    """Main stack for EC2 failure recovery infrastructure."""
    
    def __init__(self):
        # Initialize configuration
        self.config = EC2RecoveryConfig()
        
        # Initialize all infrastructure components
        self.iam_stack = IAMStack(self.config)
        self.s3_stack = S3Stack(self.config)
        self.parameter_store_stack = ParameterStoreStack(self.config)
        self.sns_stack = SNSStack(self.config)
        self.cloudwatch_stack = CloudWatchStack(self.config)
        self.lambda_stack = LambdaStack(self.config, self.iam_stack.get_role_arn())
        self.cloudwatch_events_stack = CloudWatchEventsStack(
            self.config, 
            self.lambda_stack.get_function_arn()
        )
        
        # Register outputs
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all outputs for integration tests."""
        try:
            # Lambda function outputs
            pulumi.export("lambda_function_arn", self.lambda_stack.get_function_arn())
            pulumi.export("lambda_function_name", self.lambda_stack.get_function_name())
            
            # S3 bucket outputs
            pulumi.export("s3_bucket_name", self.s3_stack.get_bucket_name())
            pulumi.export("s3_bucket_arn", self.s3_stack.get_bucket_arn())
            
            # SNS topic outputs
            pulumi.export("sns_topic_arn", self.sns_stack.get_topic_arn())
            pulumi.export("sns_topic_name", self.sns_stack.get_topic_name())
            
            # CloudWatch log group outputs
            pulumi.export("cloudwatch_log_group_name", self.cloudwatch_stack.get_log_group_name())
            pulumi.export("cloudwatch_log_group_arn", self.cloudwatch_stack.get_log_group_arn())
            
            # CloudWatch Events outputs
            pulumi.export("event_rule_arn", self.cloudwatch_events_stack.get_event_rule_arn())
            pulumi.export("event_rule_name", self.cloudwatch_events_stack.get_event_rule_name())
            
            # IAM role outputs
            pulumi.export("iam_role_arn", self.iam_stack.get_role_arn())
            pulumi.export("iam_role_name", self.iam_stack.get_role_name())
            
            # Configuration outputs
            pulumi.export("environment", self.config.environment)
            pulumi.export("region", self.config.region)
            pulumi.export("project_name", self.config.project_name)
            pulumi.export("alert_email", self.config.alert_email)
            pulumi.export("max_retry_attempts", self.config.max_retry_attempts)
            pulumi.export("retry_interval_minutes", self.config.retry_interval_minutes)
            pulumi.export("monitoring_interval_minutes", self.config.monitoring_interval_minutes)
            
            # Parameter Store outputs
            pulumi.export("parameter_store_prefix", self.config.parameter_store_prefix)
            
        except Exception as e:
            # Gracefully handle test environments where pulumi.export may not be available
            print(f"Warning: Could not export outputs: {e}")


# Create the main stack
stack = EC2RecoveryStack()