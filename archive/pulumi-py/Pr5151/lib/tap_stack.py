"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the scalable EC2 infrastructure project.

It orchestrates the instantiation of all infrastructure components including:
- AWS Provider (consistent, no random suffixes)
- Networking (default VPC and subnets)
- Security (security groups)
- IAM (roles and policies for EC2 and S3)
- Storage (S3 buckets with encryption and logging)
- Compute (Launch Templates, Auto Scaling Groups with SSM)
- Monitoring (CloudWatch logs and alarms)
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import create_aws_provider
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
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the scalable EC2 project.

    This component orchestrates the instantiation of all infrastructure components
    for a production-ready, budget-conscious, scalable AWS environment.

    The stack creates:
    - EC2 instances with Auto Scaling (1-3 instances)
    - SSM Session Manager for secure access (no SSH)
    - S3 bucket with AES-256 encryption
    - IAM roles with least-privilege policies
    - CloudWatch monitoring and alarms
    - Automated scaling based on CPU metrics

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
        super().__init__('scalable-ec2:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Initialize configuration
        pulumi.log.info(f"Initializing TapStack with environment suffix: {self.environment_suffix}")
        self.config = InfraConfig()
        pulumi.log.info(f"Region: {self.config.primary_region} ({self.config.region_normalized})")
        pulumi.log.info(f"Project: {self.config.project_name}")
        
        # Create AWS Provider
        pulumi.log.info("Creating AWS provider...")
        self.aws_provider = create_aws_provider(self.config, parent=self)
        
        # Create Networking Stack
        pulumi.log.info("Creating VPC and networking resources...")
        self.networking_stack = NetworkingStack(
            config=self.config,
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Create Security Stack
        pulumi.log.info("Creating security groups...")
        self.security_stack = SecurityStack(
            config=self.config,
            vpc_id=self.networking_stack.get_vpc_id(),
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Create IAM Stack
        pulumi.log.info("Creating IAM roles and policies...")
        self.iam_stack = IAMStack(
            config=self.config,
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Create Storage Stack
        pulumi.log.info("Creating S3 buckets...")
        self.storage_stack = StorageStack(
            config=self.config,
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Attach S3 policy to EC2 role
        pulumi.log.info("Attaching S3 policy to EC2 role...")
        self.s3_policy = self.iam_stack.attach_s3_policy(
            self.storage_stack.get_main_bucket_arn()
        )
        
        # Create Compute Stack
        pulumi.log.info("Creating Launch Template and Auto Scaling Group...")
        self.compute_stack = ComputeStack(
            config=self.config,
            subnet_ids=self.networking_stack.get_subnet_ids(),
            security_group_id=self.security_stack.get_ec2_security_group_id(),
            instance_profile_arn=self.iam_stack.get_instance_profile_arn(),
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Create Monitoring Stack
        pulumi.log.info("Creating CloudWatch monitoring...")
        self.monitoring_stack = MonitoringStack(
            config=self.config,
            asg_name=self.compute_stack.get_auto_scaling_group_name(),
            aws_provider=self.aws_provider,
            parent=self
        )
        
        # Register and export outputs
        pulumi.log.info("Registering outputs...")
        self._register_outputs()
        pulumi.log.info("TapStack initialization complete")

    def _register_outputs(self):
        """
        Register all stack outputs for use in integration tests and other consumers.
        
        Outputs include:
        - VPC and subnet information
        - Auto Scaling Group details
        - CloudWatch log group names
        - S3 bucket names
        - IAM role ARNs
        - Security group IDs
        """
        outputs = {
            # Networking outputs
            'vpc_id': self.networking_stack.get_vpc_id(),
            'subnet_ids': self.networking_stack.get_subnet_ids(),
            
            # Compute outputs
            'asg_name': self.compute_stack.get_auto_scaling_group_name(),
            'asg_arn': self.compute_stack.get_auto_scaling_group_arn(),
            'launch_template_id': self.compute_stack.get_launch_template_id(),
            
            # Security outputs
            'ec2_security_group_id': self.security_stack.get_ec2_security_group_id(),
            
            # IAM outputs
            'ec2_role_arn': self.iam_stack.get_ec2_role_arn(),
            'ec2_role_name': self.iam_stack.get_ec2_role_name(),
            'instance_profile_name': self.iam_stack.get_instance_profile_name(),
            'instance_profile_arn': self.iam_stack.get_instance_profile_arn(),
            
            # Monitoring outputs
            'ec2_log_group_name': self.monitoring_stack.get_ec2_log_group_name(),
            'ec2_log_group_arn': self.monitoring_stack.get_ec2_log_group_arn(),
            'asg_log_group_name': self.monitoring_stack.get_asg_log_group_name(),
            'asg_log_group_arn': self.monitoring_stack.get_asg_log_group_arn(),
            
            # Storage outputs
            'main_bucket_name': self.storage_stack.get_main_bucket_name(),
            'main_bucket_arn': self.storage_stack.get_main_bucket_arn(),
            'log_bucket_name': self.storage_stack.get_log_bucket_name(),
            'log_bucket_arn': self.storage_stack.get_log_bucket_arn(),
            
            # Configuration outputs
            'environment': Output.from_input(self.config.environment),
            'environment_suffix': Output.from_input(self.config.environment_suffix),
            'region': Output.from_input(self.config.primary_region),
            'project_name': Output.from_input(self.config.project_name),
        }
        
        # Register outputs at component level
        self.register_outputs(outputs)
        
        # Export outputs at stack level for Pulumi CLI and integration tests
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            # In test environments, pulumi.export() may not be available
            # This is expected and we can safely ignore it
            pulumi.log.warn(f"Could not export outputs: {e}")
