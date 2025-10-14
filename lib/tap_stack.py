import pulumi
import pulumi_aws as aws
from infrastructure.autoscaling import AutoScalingStack
from infrastructure.aws_provider import AWSProviderStack
from infrastructure.cloudwatch import CloudWatchStack
from infrastructure.config import WebAppConfig
from infrastructure.ec2 import EC2Stack
from infrastructure.iam import IAMStack
from infrastructure.s3 import S3Stack


class WebAppStack:
    """Main web application infrastructure stack."""
    
    def __init__(self):
        # Initialize configuration
        self.config = WebAppConfig()
        
        # Initialize AWS provider
        self.provider_stack = AWSProviderStack(self.config)
        self.provider = self.provider_stack.get_provider()
        
        # Initialize infrastructure components
        self.s3_stack = S3Stack(self.config, self.provider)
        self.iam_stack = IAMStack(self.config, self.provider)
        self.cloudwatch_stack = CloudWatchStack(self.config, self.provider)
        
        # Attach IAM policies to role (requires bucket name)
        self.iam_stack.attach_policies_to_role(self.s3_stack.get_bucket_name())
        
        # Initialize Auto Scaling first (creates VPC and security group)
        self.autoscaling_stack = AutoScalingStack(
            self.config,
            self.provider
        )
        
        # Initialize EC2 (requires security group from autoscaling)
        self.ec2_stack = EC2Stack(
            self.config, 
            self.provider, 
            self.iam_stack.get_instance_profile_name(),
            self.s3_stack.get_bucket_name(),
            self.autoscaling_stack.security_group.id
        )
        
        # Create Auto Scaling Group with EC2 resources
        self.autoscaling_stack.create_auto_scaling_group(self.ec2_stack.get_launch_template_id())
        
        # Register all outputs
        self._register_outputs()
    
    def _register_outputs(self):
        """Register all stack outputs for integration tests."""
        try:
            # S3 outputs
            pulumi.export("s3_bucket_name", self.s3_stack.get_bucket_name())
            pulumi.export("s3_bucket_arn", self.s3_stack.get_bucket_arn())
            
            # IAM outputs
            pulumi.export("iam_role_name", self.iam_stack.instance_role.name)
            pulumi.export("iam_instance_profile_name", self.iam_stack.get_instance_profile_name())
            pulumi.export("iam_instance_profile_arn", self.iam_stack.get_instance_profile_arn())
            
            # EC2 outputs
            pulumi.export("launch_template_id", self.ec2_stack.get_launch_template_id())
            pulumi.export("security_group_id", self.ec2_stack.get_security_group_id())
            
            # Auto Scaling outputs
            pulumi.export("load_balancer_dns_name", self.autoscaling_stack.get_load_balancer_dns_name())
            pulumi.export("load_balancer_arn", self.autoscaling_stack.get_load_balancer_arn())
            pulumi.export("target_group_arn", self.autoscaling_stack.get_target_group_arn())
            pulumi.export("auto_scaling_group_name", self.autoscaling_stack.get_auto_scaling_group_name())
            
            # CloudWatch outputs
            pulumi.export("log_group_name", self.cloudwatch_stack.get_log_group_name())
            pulumi.export("log_group_arn", self.cloudwatch_stack.get_log_group_arn())
            
            # Configuration outputs (these are strings, not Outputs)
            pulumi.export("region", self.config.region)
            pulumi.export("environment", self.config.environment)
            pulumi.export("app_name", self.config.app_name)
            pulumi.export("instance_type", self.config.instance_type)
            pulumi.export("min_size", self.config.min_size)
            pulumi.export("max_size", self.config.max_size)
            pulumi.export("desired_capacity", self.config.desired_capacity)
            
        except Exception as e:
            # Handle cases where pulumi.export might not be available
            print(f"Warning: Could not register outputs: {e}")