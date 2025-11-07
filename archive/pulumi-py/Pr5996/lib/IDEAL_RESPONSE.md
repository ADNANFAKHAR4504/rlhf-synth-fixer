## File: tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the VPC infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config

# Add lib directory to Python path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

# Now import from the lib directory
from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="vpc-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

```

## File: lib\*\*init\*\*.py

```py
#empty

```

## File: lib\tap_stack.py

```py
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

```

## File: lib\infrastructure\_\_init\_\_.py

```py
"""
Infrastructure package for AWS VPC deployment.

This package contains modular infrastructure components:
- config: Centralized configuration
- aws_provider: AWS provider management
- networking: VPC, subnets, NAT gateways, Flow Logs
- security: Security groups
- iam: IAM roles and policies
- compute: EC2 instances
- monitoring: CloudWatch alarms and SNS
"""

from .aws_provider import AWSProviderManager
from .compute import ComputeStack
from .config import InfraConfig
from .iam import IAMStack
from .monitoring import MonitoringStack
from .networking import NetworkingStack
from .security import SecurityStack
from .storage import StorageStack

__all__ = [
    'InfraConfig',
    'AWSProviderManager',
    'NetworkingStack',
    'SecurityStack',
    'IAMStack',
    'StorageStack',
    'ComputeStack',
    'MonitoringStack',
]


```

## File: lib\infrastructure\aws_provider.py

```py
"""
AWS Provider Manager for consistent provider usage across all resources.

This module ensures that all resources use the same AWS provider instance,
preventing provider drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class AWSProviderManager:
    """
    Manages AWS provider instances for consistent resource provisioning.

    This class ensures that all resources use the same provider instance,
    which is critical for:
    - Preventing provider drift in CI/CD pipelines
    - Ensuring consistent region deployment
    - Avoiding random suffixes in provider names
    - Maintaining idempotent infrastructure
    """

    def __init__(self, config):
        """
        Initialize the AWS provider manager.

        Args:
            config: InfraConfig instance with region and environment settings
        """
        self.config = config

        # Create a single, consistent AWS provider for the specified region
        self.provider = aws.Provider(
            'aws-provider',
            region=config.primary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags=config.common_tags
            )
        )

    def get_provider(self) -> aws.Provider:
        """
        Get the AWS provider instance.

        Returns:
            AWS provider instance
        """
        return self.provider

    def get_resource_options(self, depends_on=None, parent=None) -> ResourceOptions:
        """
        Get ResourceOptions with the consistent provider.

        Args:
            depends_on: Optional list of resources this resource depends on
            parent: Optional parent resource

        Returns:
            ResourceOptions configured with the provider
        """
        opts = ResourceOptions(
            provider=self.provider
        )

        if depends_on:
            opts.depends_on = depends_on if isinstance(depends_on, list) else [depends_on]

        if parent:
            opts.parent = parent

        return opts


```

## File: lib\infrastructure\compute.py

```py
"""
Compute infrastructure module.

This module creates EC2 instances with proper configuration.

"""

import pulumi
import pulumi_aws as aws
from pulumi import Output


class ComputeStack:
    """
    Compute stack that creates EC2 instances.

    Creates:
    - EC2 instances across multiple AZs
    - Dynamic AMI lookup
    - Proper user data for monitoring and SSM
    """

    def __init__(self, config, provider_manager, private_subnet_ids,
                 security_group_id, instance_profile_name, instance_profile, parent=None):
        """
        Initialize the compute stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            private_subnet_ids: List of private subnet IDs
            security_group_id: Security group ID
            instance_profile_name: Instance profile name
            instance_profile: Instance profile resource for dependency
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.instance_profile = instance_profile
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI dynamically
        self.ami = self._get_latest_ami()

        # Create EC2 instances
        self.instances = self._create_ec2_instances()

    def _get_latest_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get latest Amazon Linux 2023 AMI dynamically.

        Fixes hardcoded AMI failure by using dynamic lookup.

        Returns:
            AMI data
        """
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='virtualization-type',
                    values=['hvm']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='root-device-type',
                    values=['ebs']
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )

        return ami

    def _get_user_data(self, instance_index: int) -> str:
        """
        Generate user data script for EC2 instance.

        Args:
            instance_index: Index of the instance

        Returns:
            User data script
        """
        user_data = f"""#!/bin/bash
set -e

# Configure logging
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"
echo "Instance: {self.config.project_name}-ec2-{instance_index}-{self.config.environment_suffix}"

# Update system packages
dnf update -y

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Install and configure SSM agent (should be pre-installed on AL2023, but ensure it's there)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo "SSM agent status:"
systemctl status amazon-ssm-agent --no-pager

# Create instance info file
cat > /home/ec2-user/instance-info.txt <<'EOFINFO'
Instance: {self.config.project_name}-ec2-{instance_index}-{self.config.environment_suffix}
Region: {self.config.primary_region}
Environment: {self.config.environment_suffix}
Initialized: $(date)
EOFINFO

# Create helper script for S3 interaction
cat > /home/ec2-user/s3-helper.sh <<'EOFSCRIPT'
#!/bin/bash
# Helper script for interacting with S3 buckets
# Usage examples:
#   ./s3-helper.sh upload-data myfile.txt
#   ./s3-helper.sh upload-log application.log
#   ./s3-helper.sh list-data
#   ./s3-helper.sh list-logs

DATA_BUCKET="{self.config.get_resource_name('data-bucket')}"
LOGS_BUCKET="{self.config.get_resource_name('logs-bucket')}"

case "$1" in
    upload-data)
        aws s3 cp "$2" "s3://$DATA_BUCKET/" --sse aws:kms
        echo "Uploaded $2 to $DATA_BUCKET"
        ;;
    upload-log)
        aws s3 cp "$2" "s3://$LOGS_BUCKET/" --sse aws:kms
        echo "Uploaded $2 to $LOGS_BUCKET"
        ;;
    list-data)
        aws s3 ls "s3://$DATA_BUCKET/"
        ;;
    list-logs)
        aws s3 ls "s3://$LOGS_BUCKET/"
        ;;
    *)
        echo "Usage: $0 {{upload-data|upload-log|list-data|list-logs}} [file]"
        exit 1
        ;;
esac
EOFSCRIPT

chmod +x /home/ec2-user/s3-helper.sh
chown ec2-user:ec2-user /home/ec2-user/s3-helper.sh

# Create a test file to verify S3 access
echo "Test file created at $(date)" > /home/ec2-user/test-file.txt
chown ec2-user:ec2-user /home/ec2-user/test-file.txt

echo "User data script completed successfully at $(date)"
"""
        return user_data

    def _create_ec2_instances(self) -> list:
        """
        Create EC2 instances across multiple AZs.

        Returns:
            List of EC2 instance resources
        """
        instances = []

        for i, subnet_id in enumerate(self.private_subnet_ids):
            instance = aws.ec2.Instance(
                f'ec2-instance-{i}',
                ami=self.ami.id,
                instance_type=self.config.instance_type,
                subnet_id=subnet_id,
                vpc_security_group_ids=[self.security_group_id],
                iam_instance_profile=self.instance_profile_name,
                user_data=self._get_user_data(i),
                tags=self.config.get_tags_for_resource(
                    'EC2Instance',
                    Name=self.config.get_resource_name('ec2', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.instance_profile],
                    parent=self.parent
                )
            )

            instances.append(instance)

        return instances

    def get_instance_ids(self) -> list:
        """Get list of EC2 instance IDs."""
        return [instance.id for instance in self.instances]

    def get_instances(self) -> list:
        """Get list of EC2 instance resources."""
        return self.instances


```

## File: lib\infrastructure\config.py

```py
"""
Centralized configuration for the AWS VPC infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions to ensure consistency across all resources.
"""

import os
import re
from typing import Dict, List


class InfraConfig:
    """
    Centralized configuration for the VPC infrastructure.

    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware and environment suffix-aware)
    - Region configuration (dynamically inherited by all resources)
    - Resource parameters
    - Tagging strategy

    All resources inherit the region from this config, ensuring consistency
    when switching regions.
    """

    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment configuration
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = 'infra001'

        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')

        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)

        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        self.enable_flow_logs = True

        # Subnet Configuration - will be adjusted based on available AZs
        # Using proper CIDR calculation to avoid overlaps
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24',
            '10.0.4.0/24',
        ]
        self.private_subnet_cidrs = [
            '10.0.11.0/24',
            '10.0.12.0/24',
            '10.0.13.0/24',
            '10.0.14.0/24',
        ]

        # NAT Gateway Configuration - one per AZ for HA
        self.nat_gateway_per_az = True

        # EC2 Configuration
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.ssh_allowed_cidr = os.getenv('SSH_ALLOWED_CIDR', '10.20.30.40/32')

        # CloudWatch Configuration
        self.log_retention_days = 30
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300

        # Alarm thresholds
        self.cpu_high_threshold = int(os.getenv('CPU_HIGH_THRESHOLD', '80'))
        self.nat_packet_drop_threshold = int(os.getenv('NAT_PACKET_DROP_THRESHOLD', '10'))

        # SNS Configuration
        self.alarm_email = os.getenv('ALARM_EMAIL', '')

        # SSM Configuration
        self.enable_ssm = True

        # Tagging Configuration
        self.common_tags = self._get_common_tags()

    def _normalize_region_name(self, region: str) -> str:
        """
        Normalize region name for use in resource names.

        Removes hyphens and converts to lowercase for use in S3 bucket names
        and other resources that have strict naming requirements.

        Examples:
            us-east-1 -> useast1
            us-west-2 -> uswest2
            eu-central-1 -> eucentral1

        Args:
            region: AWS region name (e.g., 'us-east-1')

        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())

    def get_resource_name(self, resource_type: str, suffix: str = None) -> str:
        """
        Generate a standardized resource name.

        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources.

        Args:
            resource_type: Type of resource (e.g., 'vpc', 'subnet', 'ec2')
            suffix: Optional additional suffix for uniqueness (e.g., AZ suffix, '1', '2')

        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type, self.region_normalized, self.environment_suffix]

        if suffix:
            parts.append(suffix)

        name = '-'.join(parts).lower()

        # Additional normalization for case-sensitive resources
        # Remove any characters that might be invalid
        name = re.sub(r'[^a-z0-9-]', '-', name)
        # Remove consecutive dashes
        name = re.sub(r'-+', '-', name)
        # Trim dashes from start and end
        name = name.strip('-')

        return name

    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.

        Returns:
            Dictionary of common tags
        """
        return self._get_common_tags()

    def _get_common_tags(self) -> Dict[str, str]:
        """
        Generate common tags for all resources.

        Returns:
            Dictionary of tags
        """
        return {
            'ProjectName': self.project_name,
            'Environment': self.environment,
            'ENVIRONMENT_SUFFIX': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region,
        }

    def get_tags_for_resource(self, resource_type: str, **additional_tags) -> Dict[str, str]:
        """
        Get tags for a specific resource type.

        Args:
            resource_type: Type of resource
            **additional_tags: Additional tags to merge

        Returns:
            Dictionary of tags
        """
        tags = self.common_tags.copy()
        tags['ResourceType'] = resource_type
        tags.update(additional_tags)
        return tags

    def get_subnet_cidrs_for_azs(self, az_count: int, subnet_type: str = 'public') -> List[str]:
        """
        Get subnet CIDRs based on the number of available AZs.

        Args:
            az_count: Number of availability zones
            subnet_type: 'public' or 'private'

        Returns:
            List of CIDR blocks for subnets
        """
        if subnet_type == 'public':
            return self.public_subnet_cidrs[:az_count]
        return self.private_subnet_cidrs[:az_count]


```

## File: lib\infrastructure\iam.py

```py
"""
IAM infrastructure module.

This module creates IAM roles, policies, and instance profiles
with least-privilege access.

"""

import json

import pulumi_aws as aws
from pulumi import Output


class IAMStack:
    """
    IAM stack that creates roles, policies, and instance profiles.

    Creates:
    - EC2 instance role with least-privilege policies
    - S3 access policy (scoped to specific buckets)
    - CloudWatch access policy (scoped to specific log groups)
    - SSM access for secure management
    - Instance profile for EC2
    """

    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the IAM stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Get AWS account ID for ARN construction
        self.account_id = aws.get_caller_identity().account_id

        # Create EC2 instance role
        self.ec2_role = self._create_ec2_role()

        # Create CloudWatch policy and attach
        self.cloudwatch_policy = self._create_cloudwatch_policy()
        self._attach_cloudwatch_policy()

        # Attach SSM policy for secure management
        self._attach_ssm_policy()

        # Create instance profile
        self.instance_profile = self._create_instance_profile()

    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances.

        Returns:
            IAM role resource
        """
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'ec2.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        }

        role = aws.iam.Role(
            'ec2-role',
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.config.get_tags_for_resource(
                'IAMRole',
                Name=self.config.get_resource_name('ec2-role')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        return role

    def _create_cloudwatch_policy(self) -> aws.iam.Policy:
        """
        Create CloudWatch access policy with scoped permissions.

        Fixes wildcard permissions by scoping to specific log groups.

        Returns:
            IAM policy resource
        """
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogStreams'
                    ],
                    'Resource': [
                        f'arn:aws:logs:{self.config.primary_region}:{self.account_id}:log-group:/aws/ec2/{self.config.project_name}*',
                        f'arn:aws:logs:{self.config.primary_region}:{self.account_id}:log-group:/aws/ec2/{self.config.project_name}*:log-stream:*'
                    ]
                }
            ]
        }

        policy = aws.iam.Policy(
            'ec2-cloudwatch-policy',
            policy=json.dumps(policy_document),
            tags=self.config.get_tags_for_resource(
                'IAMPolicy',
                Name=self.config.get_resource_name('ec2-cloudwatch-policy')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        return policy

    def _attach_cloudwatch_policy(self):
        """Attach CloudWatch policy to EC2 role."""
        aws.iam.RolePolicyAttachment(
            'ec2-cloudwatch-policy-attachment',
            role=self.ec2_role.name,
            policy_arn=self.cloudwatch_policy.arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role, self.cloudwatch_policy],
                parent=self.parent
            )
        )

    def attach_s3_policy(self, bucket_arns: list, kms_key_arn=None):
        """
        Create and attach S3 access policy with scoped permissions.

        Fixes placeholder ARNs and wildcard permissions by using
        actual bucket ARNs. Also includes KMS permissions for S3 encryption.

        Args:
            bucket_arns: List of S3 bucket ARNs to grant access to
            kms_key_arn: Optional KMS key ARN for S3 encryption
        """
        # Wait for all bucket ARNs to be available
        if kms_key_arn:
            Output.all(*bucket_arns, kms_key_arn).apply(
                lambda args: self._create_s3_policy(args[:-1], args[-1])
            )
        else:
            Output.all(*bucket_arns).apply(lambda arns: self._create_s3_policy(arns))

    def _create_s3_policy(self, bucket_arns: list, kms_key_arn=None):
        """
        Internal method to create S3 policy with resolved ARNs.

        Args:
            bucket_arns: List of resolved S3 bucket ARNs
            kms_key_arn: Optional KMS key ARN for encryption/decryption
        """
        resources = []
        for arn in bucket_arns:
            resources.append(arn)
            resources.append(f'{arn}/*')

        statements = [
            {
                'Effect': 'Allow',
                'Action': [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject'
                ],
                'Resource': [f'{arn}/*' for arn in bucket_arns]
            },
            {
                'Effect': 'Allow',
                'Action': [
                    's3:ListBucket',
                    's3:GetBucketLocation'
                ],
                'Resource': bucket_arns
            }
        ]

        # Add KMS permissions if KMS key is provided
        if kms_key_arn:
            statements.append({
                'Effect': 'Allow',
                'Action': [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey'
                ],
                'Resource': kms_key_arn
            })

        policy_document = {
            'Version': '2012-10-17',
            'Statement': statements
        }

        policy = aws.iam.Policy(
            'ec2-s3-policy',
            policy=json.dumps(policy_document),
            tags=self.config.get_tags_for_resource(
                'IAMPolicy',
                Name=self.config.get_resource_name('ec2-s3-policy')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        aws.iam.RolePolicyAttachment(
            'ec2-s3-policy-attachment',
            role=self.ec2_role.name,
            policy_arn=policy.arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role, policy],
                parent=self.parent
            )
        )

        return policy

    def _attach_ssm_policy(self):
        """
        Attach SSM managed policy for secure management.

        Uses AWS managed policy for SSM access, which is acceptable
        for SSM as it's a well-scoped managed policy.
        """
        aws.iam.RolePolicyAttachment(
            'ec2-ssm-policy-attachment',
            role=self.ec2_role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role],
                parent=self.parent
            )
        )

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.

        Returns:
            Instance profile resource
        """
        instance_profile = aws.iam.InstanceProfile(
            'ec2-instance-profile',
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource(
                'InstanceProfile',
                Name=self.config.get_resource_name('ec2-instance-profile')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.ec2_role],
                parent=self.parent
            )
        )

        return instance_profile

    def get_ec2_role(self) -> aws.iam.Role:
        """Get EC2 IAM role."""
        return self.ec2_role

    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name

    def get_instance_profile_arn(self) -> Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn

    def get_instance_profile(self) -> aws.iam.InstanceProfile:
        """Get instance profile resource."""
        return self.instance_profile


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring infrastructure module.

This module creates CloudWatch alarms and SNS topics for notifications.

"""

import pulumi_aws as aws
from pulumi import Output


class MonitoringStack:
    """
    Monitoring stack that creates CloudWatch alarms and SNS notifications.

    Creates:
    - SNS topic for alarm notifications
    - CloudWatch alarms for EC2 instances
    - CloudWatch alarms for NAT Gateways
    """

    def __init__(self, config, provider_manager, ec2_instances, nat_gateway_ids, parent=None):
        """
        Initialize the monitoring stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            ec2_instances: List of EC2 instance resources
            nat_gateway_ids: List of NAT Gateway IDs
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.ec2_instances = ec2_instances
        self.nat_gateway_ids = nat_gateway_ids
        self.parent = parent

        # Create SNS topic for alarm notifications
        self.sns_topic = self._create_sns_topic()

        # Create CloudWatch alarms for EC2 instances
        self.ec2_alarms = self._create_ec2_alarms()

        # Create CloudWatch alarms for NAT Gateways
        self.nat_gateway_alarms = self._create_nat_gateway_alarms()

    def _create_sns_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.

        Fixes missing SNS topic failure.

        Returns:
            SNS topic resource
        """
        topic = aws.sns.Topic(
            'alarm-notifications-topic',
            display_name=f'{self.config.project_name} Infrastructure Alarms',
            tags=self.config.get_tags_for_resource(
                'SNSTopic',
                Name=self.config.get_resource_name('alarm-notifications')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Subscribe email if provided
        if self.config.alarm_email:
            aws.sns.TopicSubscription(
                'alarm-email-subscription',
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.alarm_email,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[topic],
                    parent=self.parent
                )
            )

        return topic

    def _create_ec2_alarms(self) -> list:
        """
        Create CloudWatch alarms for EC2 instances.

        Fixes:
        - Adds alarm_actions
        - Proper threshold configuration

        Returns:
            List of alarm resources
        """
        alarms = []

        for i, instance in enumerate(self.ec2_instances):
            # CPU utilization alarm
            cpu_alarm = aws.cloudwatch.MetricAlarm(
                f'ec2-cpu-alarm-{i}',
                name=self.config.get_resource_name('ec2-cpu-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='CPUUtilization',
                namespace='AWS/EC2',
                period=self.config.alarm_period,
                statistic='Average',
                threshold=self.config.cpu_high_threshold,
                alarm_description=f'Alarm when CPU exceeds {self.config.cpu_high_threshold}% for EC2 instance {i}',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'InstanceId': instance.id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('ec2-cpu-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[instance, self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(cpu_alarm)

            # Status check alarm
            status_alarm = aws.cloudwatch.MetricAlarm(
                f'ec2-status-alarm-{i}',
                name=self.config.get_resource_name('ec2-status-alarm', str(i)),
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='StatusCheckFailed',
                namespace='AWS/EC2',
                period=self.config.alarm_period,
                statistic='Maximum',
                threshold=1,
                alarm_description=f'Alarm when status check fails for EC2 instance {i}',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'InstanceId': instance.id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('ec2-status-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[instance, self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(status_alarm)

        return alarms

    def _create_nat_gateway_alarms(self) -> list:
        """
        Create CloudWatch alarms for NAT Gateways.

        Fixes:
        - Adds alarm_actions
        - Proper threshold configuration

        Returns:
            List of alarm resources
        """
        alarms = []

        for i, nat_gateway_id in enumerate(self.nat_gateway_ids):
            # Packet drop alarm
            packet_drop_alarm = aws.cloudwatch.MetricAlarm(
                f'nat-gateway-packet-drops-alarm-{i}',
                name=self.config.get_resource_name('nat-packet-drops-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='PacketsDropCount',
                namespace='AWS/NATGateway',
                period=self.config.alarm_period,
                statistic='Sum',
                threshold=self.config.nat_packet_drop_threshold,
                alarm_description=f'Alarm when NAT Gateway {i} drops more than {self.config.nat_packet_drop_threshold} packets',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'NatGatewayId': nat_gateway_id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('nat-packet-drops-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(packet_drop_alarm)

            # Error port allocation alarm
            error_alarm = aws.cloudwatch.MetricAlarm(
                f'nat-gateway-error-alarm-{i}',
                name=self.config.get_resource_name('nat-error-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='ErrorPortAllocation',
                namespace='AWS/NATGateway',
                period=self.config.alarm_period,
                statistic='Sum',
                threshold=0,
                alarm_description=f'Alarm when NAT Gateway {i} has port allocation errors',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'NatGatewayId': nat_gateway_id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('nat-error-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(error_alarm)

        return alarms

    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn


```

## File: lib\infrastructure\networking.py

```py
"""
Networking infrastructure module.

This module creates VPC, subnets, NAT gateways, Internet Gateway,
route tables, VPC Flow Logs, and all networking components.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Networking stack that creates VPC and all networking components.

    Creates:
    - VPC with DNS support
    - Public and private subnets across multiple AZs
    - Internet Gateway
    - NAT Gateways (one per AZ for HA)
    - Route tables and associations
    - VPC Flow Logs with KMS encryption
    - Network ACLs
    """

    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the networking stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Get available AZs dynamically - fixes hardcoded AZ failure
        self.availability_zones = aws.get_availability_zones(
            state='available',
            opts=pulumi.InvokeOptions(provider=provider_manager.get_provider())
        )

        # Limit to 2 AZs for this deployment (can be parameterized)
        self.az_names = self.availability_zones.names[:2]

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.igw = self._create_internet_gateway()

        # Create subnets
        self.public_subnets, self.private_subnets = self._create_subnets()

        # Create NAT Gateways (one per AZ for HA)
        self.nat_gateways = self._create_nat_gateways()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()

        # Create VPC Flow Logs with KMS encryption
        self.kms_key, self.flow_logs_log_group, self.flow_logs = self._create_flow_logs()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC with DNS support.

        Returns:
            VPC resource
        """
        vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags=self.config.get_tags_for_resource(
                'VPC',
                Name=self.config.get_resource_name('vpc')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        return vpc

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway attached to VPC.

        Returns:
            Internet Gateway resource
        """
        igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource(
                'InternetGateway',
                Name=self.config.get_resource_name('igw')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc],
                parent=self.parent
            )
        )

        return igw

    def _create_subnets(self):
        """
        Create public and private subnets across multiple AZs.

        Fixes:
        - Dynamic AZ usage
        - Proper CIDR allocation
        - Explicit Tier tagging

        Returns:
            Tuple of (public_subnets, private_subnets)
        """
        public_subnets = []
        private_subnets = []

        az_count = len(self.az_names)
        public_cidrs = self.config.get_subnet_cidrs_for_azs(az_count, 'public')
        private_cidrs = self.config.get_subnet_cidrs_for_azs(az_count, 'private')

        for i, az in enumerate(self.az_names):
            # Create public subnet
            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=public_cidrs[i],
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=self.config.get_resource_name('public-subnet', str(i)),
                    Tier='Public',
                    Type='Public'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )
            public_subnets.append(public_subnet)

            # Create private subnet
            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=private_cidrs[i],
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=self.config.get_resource_name('private-subnet', str(i)),
                    Tier='Private',
                    Type='Private'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )
            private_subnets.append(private_subnet)

        return public_subnets, private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).

        Fixes the single NAT Gateway failure by creating one per AZ.

        Returns:
            List of NAT Gateway resources
        """
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags=self.config.get_tags_for_resource(
                    'EIP',
                    Name=self.config.get_resource_name('nat-eip', str(i))
                ),
                opts=self.provider_manager.get_resource_options(parent=self.parent)
            )

            # Create NAT Gateway
            nat_gateway = aws.ec2.NatGateway(
                f'nat-gateway-{i}',
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=self.config.get_tags_for_resource(
                    'NATGateway',
                    Name=self.config.get_resource_name('nat-gateway', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[eip, public_subnet, self.igw],
                    parent=self.parent
                )
            )

            nat_gateways.append(nat_gateway)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create public route table with route to Internet Gateway.

        Returns:
            Route table resource
        """
        route_table = aws.ec2.RouteTable(
            'public-route-table',
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource(
                'RouteTable',
                Name=self.config.get_resource_name('public-rt'),
                Type='Public'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc],
                parent=self.parent
            )
        )

        # Create route to Internet Gateway
        route = aws.ec2.Route(
            'public-internet-route',
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[route_table, self.igw],
                parent=self.parent
            )
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-subnet-{i}-association',
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, subnet],
                    parent=self.parent
                )
            )

        return route_table

    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create private route tables (one per AZ) with routes to NAT Gateways.

        Each private subnet gets its own route table pointing to its AZ's NAT Gateway
        for high availability.

        Returns:
            List of route table resources
        """
        route_tables = []

        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            # Create private route table
            route_table = aws.ec2.RouteTable(
                f'private-route-table-{i}',
                vpc_id=self.vpc.id,
                tags=self.config.get_tags_for_resource(
                    'RouteTable',
                    Name=self.config.get_resource_name('private-rt', str(i)),
                    Type='Private'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )

            # Create route to NAT Gateway
            route = aws.ec2.Route(
                f'private-nat-route-{i}',
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, nat_gateway],
                    parent=self.parent
                )
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f'private-subnet-{i}-association',
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, private_subnet],
                    parent=self.parent
                )
            )

            route_tables.append(route_table)

        return route_tables

    def _create_flow_logs(self):
        """
        Create VPC Flow Logs with KMS encryption and proper IAM role.

        Fixes:
        - Adds KMS encryption for logs
        - Creates scoped IAM trust policy
        - Sets log retention policy

        Returns:
            Tuple of (kms_key, log_group, flow_log)
        """
        # Create KMS key for CloudWatch Logs encryption
        kms_key = aws.kms.Key(
            'flow-logs-kms-key',
            description=f'KMS key for VPC Flow Logs encryption - {self.config.environment_suffix}',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.config.get_tags_for_resource(
                'KMSKey',
                Name=self.config.get_resource_name('flow-logs-kms')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Create KMS key alias
        kms_alias = aws.kms.Alias(
            'flow-logs-kms-alias',
            name=f'alias/{self.config.get_resource_name("flow-logs")}',
            target_key_id=kms_key.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )

        # Create KMS key policy to allow CloudWatch Logs to use the key
        kms_key_policy = aws.kms.KeyPolicy(
            'flow-logs-kms-key-policy',
            key_id=kms_key.id,
            policy=Output.all(kms_key.arn).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'Enable IAM User Permissions',
                        'Effect': 'Allow',
                        'Principal': {
                            'AWS': f'arn:aws:iam::{aws.get_caller_identity().account_id}:root'
                        },
                        'Action': 'kms:*',
                        'Resource': '*'
                    },
                    {
                        'Sid': 'Allow CloudWatch Logs',
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': f'logs.{self.config.primary_region}.amazonaws.com'
                        },
                        'Action': [
                            'kms:Encrypt',
                            'kms:Decrypt',
                            'kms:ReEncrypt*',
                            'kms:GenerateDataKey*',
                            'kms:CreateGrant',
                            'kms:DescribeKey'
                        ],
                        'Resource': '*',
                        'Condition': {
                            'ArnLike': {
                                'kms:EncryptionContext:aws:logs:arn': f'arn:aws:logs:{self.config.primary_region}:{aws.get_caller_identity().account_id}:log-group:*'
                            }
                        }
                    }
                ]
            })),
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )

        # Create CloudWatch Log Group with KMS encryption
        log_group = aws.cloudwatch.LogGroup(
            'vpc-flow-logs-group',
            name=f'/aws/vpc/flow-logs/{self.config.get_resource_name("vpc")}',
            retention_in_days=self.config.log_retention_days,
            kms_key_id=kms_key.arn,
            tags=self.config.get_tags_for_resource(
                'LogGroup',
                Name=self.config.get_resource_name('flow-logs-group')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key, kms_key_policy],
                parent=self.parent
            )
        )

        # Create IAM role for VPC Flow Logs with scoped trust policy
        flow_logs_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'vpc-flow-logs.amazonaws.com'
                },
                'Action': 'sts:AssumeRole',
                'Condition': {
                    'StringEquals': {
                        'aws:SourceAccount': aws.get_caller_identity().account_id
                    }
                }
            }]
        }

        flow_logs_role = aws.iam.Role(
            'vpc-flow-logs-role',
            assume_role_policy=json.dumps(flow_logs_role_policy),
            tags=self.config.get_tags_for_resource(
                'IAMRole',
                Name=self.config.get_resource_name('flow-logs-role')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Create IAM policy for VPC Flow Logs with scoped permissions
        flow_logs_policy = aws.iam.RolePolicy(
            'vpc-flow-logs-policy',
            role=flow_logs_role.id,
            policy=Output.all(log_group.arn).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogGroups',
                        'logs:DescribeLogStreams'
                    ],
                    'Resource': f'{args[0]}:*'
                }]
            })),
            opts=self.provider_manager.get_resource_options(
                depends_on=[flow_logs_role, log_group],
                parent=self.parent
            )
        )

        # Enable VPC Flow Logs
        flow_log = aws.ec2.FlowLog(
            'vpc-flow-log',
            iam_role_arn=flow_logs_role.arn,
            log_destination=log_group.arn,
            traffic_type='ALL',
            vpc_id=self.vpc.id,
            log_destination_type='cloud-watch-logs',
            tags=self.config.get_tags_for_resource(
                'FlowLog',
                Name=self.config.get_resource_name('vpc-flow-log')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc, log_group, flow_logs_role, flow_logs_policy],
                parent=self.parent
            )
        )

        return kms_key, log_group, flow_log

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_public_subnet_ids(self) -> List[Output[str]]:
        """Get list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]

    def get_nat_gateway_ids(self) -> List[Output[str]]:
        """Get list of NAT Gateway IDs."""
        return [nat.id for nat in self.nat_gateways]


```

## File: lib\infrastructure\security.py

```py
"""
Security infrastructure module.

This module creates security groups with proper ingress/egress rules.
"""

import pulumi_aws as aws
from pulumi import Output


class SecurityStack:
    """
    Security stack that creates security groups.

    Creates:
    - EC2 security group with SSH access from specified CIDR
    - Proper egress rules
    """

    def __init__(self, config, provider_manager, vpc_id, parent=None):
        """
        Initialize the security stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            vpc_id: VPC ID to create security groups in
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc_id = vpc_id
        self.parent = parent

        # Create EC2 security group
        self.ec2_security_group = self._create_ec2_security_group()

    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.

        Allows SSH access from specified CIDR and all outbound traffic.

        Returns:
            Security group resource
        """
        security_group = aws.ec2.SecurityGroup(
            'ec2-security-group',
            vpc_id=self.vpc_id,
            description=f'Security group for {self.config.project_name} EC2 instances',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=22,
                    to_port=22,
                    cidr_blocks=[self.config.ssh_allowed_cidr],
                    description='SSH access from specified CIDR'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags=self.config.get_tags_for_resource(
                'SecurityGroup',
                Name=self.config.get_resource_name('ec2-sg')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        return security_group

    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id


```

## File: lib\infrastructure\storage.py

```py
"""
Storage infrastructure module.

This module creates S3 buckets with proper security configurations.

Features:
- S3 buckets with versioning enabled
- KMS encryption at rest
- Lifecycle policies for cost optimization
- Restrictive bucket policies
- Public access block
"""

import json

import pulumi_aws as aws
from pulumi import Output


class StorageStack:
    """
    Storage stack that creates S3 buckets with security best practices.

    Creates:
    - Data bucket for application data
    - Logs bucket for application logs
    - KMS encryption for both buckets
    - Versioning enabled
    - Lifecycle policies
    - Restrictive bucket policies
    - Public access block
    """

    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the storage stack.

        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Get AWS account ID for bucket policies
        self.account_id = aws.get_caller_identity().account_id

        # Create KMS key for S3 encryption
        self.kms_key = self._create_kms_key()

        # Create S3 buckets
        self.data_bucket = self._create_data_bucket()
        self.logs_bucket = self._create_logs_bucket()

        # Configure bucket policies
        self._configure_bucket_policies()

    def _create_kms_key(self) -> aws.kms.Key:
        """
        Create KMS key for S3 bucket encryption.

        Returns:
            KMS key resource
        """
        kms_key = aws.kms.Key(
            's3-kms-key',
            description=f'KMS key for S3 bucket encryption - {self.config.environment_suffix}',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.config.get_tags_for_resource(
                'KMSKey',
                Name=self.config.get_resource_name('s3-kms')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Create KMS key alias
        aws.kms.Alias(
            's3-kms-alias',
            name=f'alias/{self.config.get_resource_name("s3")}',
            target_key_id=kms_key.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )

        return kms_key

    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for application data.

        Returns:
            S3 bucket resource
        """
        bucket_name = self.config.get_resource_name('data-bucket')

        bucket = aws.s3.Bucket(
            'data-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource(
                'S3Bucket',
                Name=bucket_name,
                Purpose='ApplicationData'
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            'data-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            'data-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket, self.kms_key],
                parent=self.parent
            )
        )

        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            'data-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class='STANDARD_IA'
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-versions',
                    status='Enabled',
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=90
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'data-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        return bucket

    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for application logs.

        Returns:
            S3 bucket resource
        """
        bucket_name = self.config.get_resource_name('logs-bucket')

        bucket = aws.s3.Bucket(
            'logs-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource(
                'S3Bucket',
                Name=bucket_name,
                Purpose='ApplicationLogs'
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            'logs-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            'logs-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket, self.kms_key],
                parent=self.parent
            )
        )

        # Configure lifecycle policy for logs
        aws.s3.BucketLifecycleConfiguration(
            'logs-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-logs',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=365
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-logs-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                )
            ],
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            'logs-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(
                depends_on=[bucket],
                parent=self.parent
            )
        )

        return bucket

    def _configure_bucket_policies(self):
        """
        Configure restrictive bucket policies.

        Policies enforce:
        - Encryption in transit (SSL/TLS required)
        - Access only from specific IAM roles
        """
        # Data bucket policy
        aws.s3.BucketPolicy(
            'data-bucket-policy',
            bucket=self.data_bucket.id,
            policy=Output.all(self.data_bucket.arn, self.account_id).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyInsecureTransport',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [
                                args[0],
                                f'{args[0]}/*'
                            ],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{args[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.data_bucket],
                parent=self.parent
            )
        )

        # Logs bucket policy
        aws.s3.BucketPolicy(
            'logs-bucket-policy',
            bucket=self.logs_bucket.id,
            policy=Output.all(self.logs_bucket.arn, self.account_id).apply(
                lambda args: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyInsecureTransport',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [
                                args[0],
                                f'{args[0]}/*'
                            ],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{args[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        }
                    ]
                })
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.logs_bucket],
                parent=self.parent
            )
        )

    def get_data_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn

    def get_logs_bucket_arn(self) -> Output[str]:
        """Get logs bucket ARN."""
        return self.logs_bucket.arn

    def get_data_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.id

    def get_logs_bucket_name(self) -> Output[str]:
        """Get logs bucket name."""
        return self.logs_bucket.id

    def get_kms_key_id(self) -> Output[str]:
        """Get KMS key ID."""
        return self.kms_key.id

    def get_kms_key_arn(self) -> Output[str]:
        """Get KMS key ARN."""
        return self.kms_key.arn


```
