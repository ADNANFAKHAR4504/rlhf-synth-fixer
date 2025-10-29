"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the secure, scalable AWS cloud environment.

It orchestrates the instantiation of all infrastructure components including
networking, security, IAM, compute, Lambda functions, and monitoring.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.compute import ComputeStack
from infrastructure.config import InfraConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.networking import NetworkingStack
from infrastructure.security import SecurityStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
                                           MUST be provided in CI/CD to prevent resource conflicts.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        # Use 'local' as fallback for local development only
        # CI/CD MUST provide environment_suffix to prevent conflicts
        self.environment_suffix = environment_suffix or 'local'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP infrastructure.
    
    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.
    
    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """
    
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)
        
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        
        # Initialize configuration
        self.config = InfraConfig()
        
        # Update config with provided environment suffix
        self.config.environment_suffix = self.environment_suffix
        
        # Initialize infrastructure components in dependency order
        
        # 1. Networking: VPC, subnets, gateways, routing
        self.networking_stack = NetworkingStack(
            config=self.config,
            parent=self
        )
        
        # 2. Security: Security groups
        self.security_stack = SecurityStack(
            config=self.config,
            vpc_id=self.networking_stack.get_vpc_id(),
            parent=self
        )
        
        # 3. IAM: Roles, policies, instance profiles
        self.iam_stack = IAMStack(
            config=self.config,
            parent=self
        )
        
        # 4. Compute: Launch template, Auto Scaling Group, scaling policies
        self.compute_stack = ComputeStack(
            config=self.config,
            private_subnet_ids=self.networking_stack.get_private_subnet_ids(),
            security_group_id=self.security_stack.get_ec2_security_group_id(),
            instance_profile_name=self.iam_stack.get_ec2_instance_profile_name(),
            instance_profile_arn=self.iam_stack.get_ec2_instance_profile_arn(),
            instance_profile=self.iam_stack.get_ec2_instance_profile(),
            parent=self
        )
        
        # 5. Lambda: Health monitoring function
        self.lambda_stack = LambdaStack(
            config=self.config,
            lambda_role_arn=self.iam_stack.get_lambda_role_arn(),
            asg_name=self.compute_stack.get_auto_scaling_group_name(),
            parent=self
        )
        
        # 6. Monitoring: CloudWatch alarms, EventBridge rules
        self.monitoring_stack = MonitoringStack(
            config=self.config,
            asg_name=self.compute_stack.get_auto_scaling_group_name(),
            scale_up_policy_arn=self.compute_stack.get_scale_up_policy_arn(),
            scale_down_policy_arn=self.compute_stack.get_scale_down_policy_arn(),
            lambda_function_arn=self.lambda_stack.get_function_arn(),
            lambda_function_name=self.lambda_stack.get_function_name(),
            parent=self
        )
        
        # Register outputs
        self._register_outputs()
    
    def _register_outputs(self):
        """
        Register all outputs for the stack.
        
        All infrastructure outputs must be in tap_stack.py
        for integration testing.
        """
        outputs = {}
        
        # Networking outputs
        outputs['vpc_id'] = self.networking_stack.get_vpc_id()
        outputs['vpc_cidr'] = self.networking_stack.get_vpc_cidr()
        outputs['public_subnet_ids'] = Output.all(*self.networking_stack.get_public_subnet_ids())
        outputs['private_subnet_ids'] = Output.all(*self.networking_stack.get_private_subnet_ids())
        outputs['internet_gateway_id'] = self.networking_stack.get_internet_gateway_id()
        outputs['nat_gateway_ids'] = Output.all(*self.networking_stack.get_nat_gateway_ids())
        outputs['public_route_table_id'] = self.networking_stack.get_public_route_table_id()
        outputs['private_route_table_ids'] = Output.all(*self.networking_stack.get_private_route_table_ids())
        
        # Security outputs
        outputs['ec2_security_group_id'] = self.security_stack.get_ec2_security_group_id()
        
        # IAM outputs
        outputs['ec2_role_arn'] = self.iam_stack.get_ec2_role_arn()
        outputs['ec2_role_name'] = self.iam_stack.get_ec2_role_name()
        outputs['lambda_role_arn'] = self.iam_stack.get_lambda_role_arn()
        outputs['lambda_role_name'] = self.iam_stack.get_lambda_role_name()
        outputs['ec2_instance_profile_name'] = self.iam_stack.get_ec2_instance_profile_name()
        outputs['ec2_instance_profile_arn'] = self.iam_stack.get_ec2_instance_profile_arn()
        
        # Compute outputs
        outputs['launch_template_id'] = self.compute_stack.get_launch_template_id()
        outputs['auto_scaling_group_name'] = self.compute_stack.get_auto_scaling_group_name()
        outputs['auto_scaling_group_arn'] = self.compute_stack.get_auto_scaling_group_arn()
        outputs['scale_up_policy_arn'] = self.compute_stack.get_scale_up_policy_arn()
        outputs['scale_down_policy_arn'] = self.compute_stack.get_scale_down_policy_arn()
        
        # Lambda outputs
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn()
        outputs['lambda_function_name'] = self.lambda_stack.get_function_name()
        
        # Monitoring outputs
        outputs['cpu_high_alarm_arn'] = self.monitoring_stack.get_cpu_high_alarm_arn()
        outputs['cpu_low_alarm_arn'] = self.monitoring_stack.get_cpu_low_alarm_arn()
        outputs['health_check_rule_arn'] = self.monitoring_stack.get_health_check_rule_arn()
        outputs['lambda_log_group_name'] = self.monitoring_stack.get_lambda_log_group_name()
        
        # Configuration outputs
        outputs['region'] = self.config.primary_region
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        
        # SSM access instructions
        outputs['ssm_access_instructions'] = "Connect to EC2 instances using AWS Systems Manager Session Manager in the AWS Console or AWS CLI"
        
        # Register outputs with Pulumi
        # Add exception handling for pulumi.export()
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            # Gracefully handle environments where pulumi.export() may not be available
            print(f"Warning: Could not export outputs: {e}")
        
        # Preserve backward compatibility with self.register_outputs()
        self.register_outputs(outputs)
