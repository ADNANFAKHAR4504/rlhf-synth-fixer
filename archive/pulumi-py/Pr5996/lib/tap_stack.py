"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the VPC infrastructure.

It orchestrates the instantiation of all infrastructure components including
networking, security, IAM, compute, and monitoring.
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
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the VPC infrastructure.
    
    This component orchestrates the instantiation of all infrastructure components
    for a production-ready, highly-available AWS environment.
    
    The stack creates:
    - Multi-AZ VPC with public and private subnets
    - NAT Gateways for high availability (one per AZ)
    - VPC Flow Logs with KMS encryption
    - S3 buckets with versioning, encryption, and lifecycle policies
    - EC2 instances with dynamic AMI lookup
    - CloudWatch monitoring and alarms with SNS notifications
    - IAM roles with least-privilege policies
    - Security groups with proper ingress/egress rules
    
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
        
        # 1. Networking: VPC, subnets, gateways, routing, Flow Logs
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
        
        # Attach S3 policy to EC2 role for both buckets (includes KMS permissions)
        self.iam_stack.attach_s3_policy(
            bucket_arns=[
                self.storage_stack.get_data_bucket_arn(),
                self.storage_stack.get_logs_bucket_arn()
            ],
            kms_key_arn=self.storage_stack.get_kms_key_arn()
        )
        
        # 5. Compute: EC2 instances with dynamic AMI lookup
        self.compute_stack = ComputeStack(
            config=self.config,
            provider_manager=self.provider_manager,
            private_subnet_ids=self.networking_stack.get_private_subnet_ids(),
            security_group_id=self.security_stack.get_ec2_security_group_id(),
            instance_profile_name=self.iam_stack.get_instance_profile_name(),
            instance_profile=self.iam_stack.get_instance_profile(),
            parent=self
        )
        
        # 6. Monitoring: CloudWatch alarms, SNS notifications
        self.monitoring_stack = MonitoringStack(
            config=self.config,
            provider_manager=self.provider_manager,
            ec2_instances=self.compute_stack.get_instances(),
            nat_gateway_ids=self.networking_stack.get_nat_gateway_ids(),
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
        try:
            # VPC outputs
            pulumi.export('vpc_id', self.networking_stack.get_vpc_id())
            pulumi.export('region', self.config.primary_region)
            
            # Subnet outputs
            pulumi.export('public_subnet_ids', Output.all(*self.networking_stack.get_public_subnet_ids()))
            pulumi.export('private_subnet_ids', Output.all(*self.networking_stack.get_private_subnet_ids()))
            
            # NAT Gateway outputs
            pulumi.export('nat_gateway_ids', Output.all(*self.networking_stack.get_nat_gateway_ids()))
            
            # Security group outputs
            pulumi.export('ec2_security_group_id', self.security_stack.get_ec2_security_group_id())
            
            # IAM outputs
            pulumi.export('ec2_instance_profile_name', self.iam_stack.get_instance_profile_name())
            pulumi.export('ec2_instance_profile_arn', self.iam_stack.get_instance_profile_arn())
            
            # S3 outputs
            pulumi.export('data_bucket_name', self.storage_stack.get_data_bucket_name())
            pulumi.export('data_bucket_arn', self.storage_stack.get_data_bucket_arn())
            pulumi.export('logs_bucket_name', self.storage_stack.get_logs_bucket_name())
            pulumi.export('logs_bucket_arn', self.storage_stack.get_logs_bucket_arn())
            pulumi.export('s3_kms_key_id', self.storage_stack.get_kms_key_id())
            pulumi.export('s3_kms_key_arn', self.storage_stack.get_kms_key_arn())
            
            # EC2 outputs
            pulumi.export('ec2_instance_ids', Output.all(*self.compute_stack.get_instance_ids()))
            
            # Monitoring outputs
            pulumi.export('sns_topic_arn', self.monitoring_stack.get_sns_topic_arn())
            
            # Flow Logs outputs
            pulumi.export('flow_logs_log_group_name', self.networking_stack.flow_logs_log_group.name)
            pulumi.export('flow_logs_kms_key_id', self.networking_stack.kms_key.id)
            
        except Exception as e:
            # Gracefully handle environments where pulumi.export() may not be available
            print(f'Warning: Could not export outputs: {e}')
        
        # Preserve backward compatibility with component outputs
        self.register_outputs({
            'vpc_id': self.networking_stack.get_vpc_id(),
            'region': self.config.primary_region,
            'public_subnet_ids': Output.all(*self.networking_stack.get_public_subnet_ids()),
            'private_subnet_ids': Output.all(*self.networking_stack.get_private_subnet_ids()),
            'nat_gateway_ids': Output.all(*self.networking_stack.get_nat_gateway_ids()),
            'ec2_security_group_id': self.security_stack.get_ec2_security_group_id(),
            'ec2_instance_profile_name': self.iam_stack.get_instance_profile_name(),
            'ec2_instance_profile_arn': self.iam_stack.get_instance_profile_arn(),
            'data_bucket_name': self.storage_stack.get_data_bucket_name(),
            'data_bucket_arn': self.storage_stack.get_data_bucket_arn(),
            'logs_bucket_name': self.storage_stack.get_logs_bucket_name(),
            'logs_bucket_arn': self.storage_stack.get_logs_bucket_arn(),
            's3_kms_key_id': self.storage_stack.get_kms_key_id(),
            's3_kms_key_arn': self.storage_stack.get_kms_key_arn(),
            'ec2_instance_ids': Output.all(*self.compute_stack.get_instance_ids()),
            'sns_topic_arn': self.monitoring_stack.get_sns_topic_arn(),
            'flow_logs_log_group_name': self.networking_stack.flow_logs_log_group.name,
            'flow_logs_kms_key_id': self.networking_stack.kms_key.id,
        })
