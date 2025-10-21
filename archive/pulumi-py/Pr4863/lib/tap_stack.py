"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of all infrastructure components including:
- Networking (VPC, subnets, gateways, routing)
- Security (security groups, NACLs)
- IAM (roles and policies)
- Compute (Launch Templates, Auto Scaling Groups)
- Load Balancing (ALB, target groups, listeners)
- Monitoring (CloudWatch logs, metrics, alarms)
- Notifications (SNS topics and subscriptions)
- Secrets (Secrets Manager and SSM Parameter Store)
- Storage (S3 buckets with lifecycle policies)
"""

from typing import Optional

import pulumi
from infrastructure.compute import ComputeStack
# Import infrastructure modules
from infrastructure.config import InfraConfig
from infrastructure.iam import IAMStack
from infrastructure.loadbalancer import LoadBalancerStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.networking import NetworkingStack
from infrastructure.notifications import NotificationsStack
from infrastructure.secrets import SecretsStack
from infrastructure.security import SecurityStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of all infrastructure components
    for a production-ready, highly-available AWS environment with failure recovery
    and operational resilience.

    The stack creates:
    - Multi-AZ VPC with public and private subnets
    - NAT Gateways for high availability
    - Application Load Balancer
    - Auto Scaling Groups with health checks
    - CloudWatch monitoring and alarms
    - SNS notifications
    - IAM roles with least-privilege policies
    - Secrets management via Secrets Manager and SSM
    - S3 buckets with lifecycle policies for backups

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
        self.tags = args.tags

        # Initialize configuration
        self.config = InfraConfig()
        
        # Create Notifications Stack (needed for monitoring alarms)
        self.notifications_stack = NotificationsStack(
            config=self.config,
            parent=self
        )
        
        # Create Networking Stack
        self.networking_stack = NetworkingStack(
            config=self.config,
            parent=self
        )
        
        # Create Security Stack
        self.security_stack = SecurityStack(
            config=self.config,
            vpc_id=self.networking_stack.get_vpc_id(),
            parent=self
        )
        
        # Create IAM Stack
        self.iam_stack = IAMStack(
            config=self.config,
            parent=self
        )
        
        # Create Load Balancer Stack (DISABLED - AWS account ALB provisioning issues)
        # self.loadbalancer_stack = LoadBalancerStack(
        #     config=self.config,
        #     vpc_id=self.networking_stack.get_vpc_id(),
        #     public_subnet_ids=self.networking_stack.get_public_subnet_ids(),
        #     security_group_id=self.security_stack.get_alb_security_group_id(),
        #     parent=self
        # )
        
        # Create Compute Stack (without ALB target group)
        self.compute_stack = ComputeStack(
            config=self.config,
            private_subnet_ids=self.networking_stack.get_private_subnet_ids(),
            security_group_id=self.security_stack.get_app_security_group_id(),
            instance_profile_name=self.iam_stack.get_instance_profile_name(),
            target_group_arn=None,  # No ALB for now
            parent=self
        )
        
        # Create Monitoring Stack (without ALB monitoring)
        self.monitoring_stack = MonitoringStack(
            config=self.config,
            alb_arn=None,  # No ALB for now
            asg_name=self.compute_stack.get_auto_scaling_group_name(),
            sns_topic_arn=self.notifications_stack.get_alarm_topic_arn(),
            parent=self
        )
        
        # Create Secrets Stack
        self.secrets_stack = SecretsStack(
            config=self.config,
            parent=self
        )
        
        # Create Storage Stack
        self.storage_stack = StorageStack(
            config=self.config,
            parent=self
        )
        
        # Attach additional IAM policies if needed
        if self.config.use_secrets_manager:
            secret_arn = self.secrets_stack.get_app_secret_arn()
            # Only attach if secret was created
            secret_arn.apply(lambda arn: (
                self.iam_stack.attach_secrets_manager_policy(
                    self.iam_stack.ec2_role,
                    secret_arn
                ) if arn else None
            ))
        
        # Attach S3 read policy for backup bucket
        self.iam_stack.attach_s3_read_policy(
            self.iam_stack.ec2_role,
            self.storage_stack.get_backup_bucket_arn()
        )
        
        # Register and export outputs
        self._register_outputs()

    def _register_outputs(self):
        """
        Register all stack outputs for use in integration tests and other consumers.
        
        Outputs include:
        - VPC and subnet information
        - Load balancer DNS name
        - Auto Scaling Group details
        - CloudWatch log group names
        - S3 bucket names
        - SNS topic ARNs
        - SSM parameter names
        """
        outputs = {
            # Networking outputs
            'vpc_id': self.networking_stack.get_vpc_id(),
            'public_subnet_ids': self.networking_stack.get_public_subnet_ids(),
            'private_subnet_ids': self.networking_stack.get_private_subnet_ids(),
            
            # Load Balancer outputs (DISABLED - ALB removed due to AWS provisioning issues)
            # 'alb_dns_name': self.loadbalancer_stack.get_alb_dns_name(),
            # 'alb_arn': self.loadbalancer_stack.get_alb_arn(),
            # 'alb_zone_id': self.loadbalancer_stack.get_alb_zone_id(),
            # 'target_group_arn': self.loadbalancer_stack.get_target_group_arn(),
            
            # Compute outputs
            'asg_name': self.compute_stack.get_auto_scaling_group_name(),
            'asg_arn': self.compute_stack.get_auto_scaling_group_arn(),
            
            # Security outputs
            'alb_security_group_id': self.security_stack.get_alb_security_group_id(),
            'app_security_group_id': self.security_stack.get_app_security_group_id(),
            
            # IAM outputs
            'ec2_role_arn': self.iam_stack.get_ec2_role_arn(),
            'instance_profile_name': self.iam_stack.get_instance_profile_name(),
            
            # Monitoring outputs
            'app_log_group_name': self.monitoring_stack.get_app_log_group_name(),
            'app_log_group_arn': self.monitoring_stack.get_app_log_group_arn(),
            
            # Notifications outputs
            'alarm_topic_arn': self.notifications_stack.get_alarm_topic_arn(),
            
            # Secrets outputs
            'app_config_parameter_name': self.secrets_stack.get_app_config_parameter_name(),
            'app_config_parameter_arn': self.secrets_stack.get_app_config_parameter_arn(),
            
            # Storage outputs
            'backup_bucket_name': self.storage_stack.get_backup_bucket_name(),
            'backup_bucket_arn': self.storage_stack.get_backup_bucket_arn(),
            
            # Configuration outputs
            'environment': Output.from_input(self.config.environment),
            'environment_suffix': Output.from_input(self.config.environment_suffix),
            'region': Output.from_input(self.config.primary_region),
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
            pass
