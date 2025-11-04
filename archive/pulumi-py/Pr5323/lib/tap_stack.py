"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) infrastructure.

It orchestrates the instantiation of all infrastructure components including
networking, security, IAM, storage, compute, and monitoring.
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.compute import ComputeStack
from infrastructure.config import InfraConfig
from infrastructure.iam import IAMStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.networking import NetworkingStack
from infrastructure.security import SecurityStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'local'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP infrastructure.
    
    This component orchestrates the instantiation of all infrastructure components
    for a production-ready, highly-available AWS environment.
    
    The stack creates:
    - Multi-AZ VPC with public and private subnets
    - NAT Gateways for high availability
    - VPC Flow Logs and Network ACLs
    - Auto Scaling Groups with health checks
    - CloudWatch monitoring and alarms
    - SNS notifications
    - IAM roles with least-privilege policies
    - S3 buckets with versioning and lifecycle policies
    
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
        
        # Initialize AWS provider manager
        self.provider_manager = AWSProviderManager(self.config)
        
        # Initialize infrastructure components in dependency order
        
        # 1. Networking: VPC, subnets, gateways, routing, NACLs, Flow Logs
        self.networking_stack = NetworkingStack(
            config=self.config,
            provider_manager=self.provider_manager,
            parent=self
        )
        
        # 2. Security: Security groups
        self.security_stack = SecurityStack(
            config=self.config,
            provider_manager=self.provider_manager,
            vpc_id=self.networking_stack.get_vpc_id(),
            parent=self
        )
        
        # 3. IAM: Roles, policies, instance profiles
        self.iam_stack = IAMStack(
            config=self.config,
            provider_manager=self.provider_manager,
            parent=self
        )
        
        # 4. Storage: S3 buckets with versioning and encryption
        self.storage_stack = StorageStack(
            config=self.config,
            provider_manager=self.provider_manager,
            parent=self
        )
        
        # Attach S3 policy to EC2 role for both buckets
        self.iam_stack.attach_s3_policy(
            self.iam_stack.ec2_role,
            self.storage_stack.get_data_bucket_arn(),
            self.storage_stack.get_logs_bucket_arn()
        )
        
        # 5. Compute: Launch template, Auto Scaling Group, scaling policies
        self.compute_stack = ComputeStack(
            config=self.config,
            provider_manager=self.provider_manager,
            private_subnet_ids=self.networking_stack.get_private_subnet_ids(),
            security_group_id=self.security_stack.get_ec2_security_group_id(),
            instance_profile_name=self.iam_stack.get_ec2_instance_profile_name(),
            instance_profile_arn=self.iam_stack.get_ec2_instance_profile_arn(),
            instance_profile=self.iam_stack.get_ec2_instance_profile(),
            parent=self
        )
        
        # 6. Monitoring: CloudWatch alarms, SNS notifications
        self.monitoring_stack = MonitoringStack(
            config=self.config,
            provider_manager=self.provider_manager,
            asg_name=self.compute_stack.get_auto_scaling_group_name(),
            scale_up_policy_arn=self.compute_stack.get_scale_up_policy_arn(),
            scale_down_policy_arn=self.compute_stack.get_scale_down_policy_arn(),
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
        outputs['flow_log_group_name'] = self.networking_stack.get_flow_log_group_name()
        
        # Security outputs
        outputs['ec2_security_group_id'] = self.security_stack.get_ec2_security_group_id()
        
        # IAM outputs
        outputs['ec2_role_arn'] = self.iam_stack.get_ec2_role_arn()
        outputs['ec2_role_name'] = self.iam_stack.get_ec2_role_name()
        outputs['ec2_instance_profile_name'] = self.iam_stack.get_ec2_instance_profile_name()
        outputs['ec2_instance_profile_arn'] = self.iam_stack.get_ec2_instance_profile_arn()
        
        # Storage outputs
        outputs['logs_bucket_name'] = self.storage_stack.get_logs_bucket_name()
        outputs['logs_bucket_arn'] = self.storage_stack.get_logs_bucket_arn()
        outputs['data_bucket_name'] = self.storage_stack.get_data_bucket_name()
        outputs['data_bucket_arn'] = self.storage_stack.get_data_bucket_arn()
        
        # Compute outputs
        outputs['launch_template_id'] = self.compute_stack.get_launch_template_id()
        outputs['auto_scaling_group_name'] = self.compute_stack.get_auto_scaling_group_name()
        outputs['auto_scaling_group_arn'] = self.compute_stack.get_auto_scaling_group_arn()
        outputs['scale_up_policy_arn'] = self.compute_stack.get_scale_up_policy_arn()
        outputs['scale_down_policy_arn'] = self.compute_stack.get_scale_down_policy_arn()
        
        # Monitoring outputs
        outputs['alarm_topic_arn'] = self.monitoring_stack.get_alarm_topic_arn()
        outputs['log_group_name'] = self.monitoring_stack.get_log_group_name()
        outputs['log_group_arn'] = self.monitoring_stack.get_log_group_arn()
        outputs['cpu_high_alarm_arn'] = self.monitoring_stack.get_cpu_high_alarm_arn()
        outputs['cpu_low_alarm_arn'] = self.monitoring_stack.get_cpu_low_alarm_arn()
        
        # Configuration outputs
        outputs['region'] = self.config.primary_region
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        
        # SSM access instructions
        outputs['ssm_access_instructions'] = (
            "Connect to EC2 instances using AWS Systems Manager "
            "Session Manager in the AWS Console or AWS CLI"
        )
        
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
