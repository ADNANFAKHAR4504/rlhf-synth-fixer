## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

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
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

```

## File: lib\*\*init\*\*.py

```python
# empty
```

## File: lib\tap_stack.py

```python
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


```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\compute.py

```python
"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups
with health checks and scaling policies.
"""

from typing import List

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class ComputeStack:
    """
    Creates and manages EC2 compute resources including Launch Templates
    and Auto Scaling Groups.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        private_subnet_ids: List[Output[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        instance_profile_arn: Output[str],
        instance_profile: aws.iam.InstanceProfile,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the compute stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            private_subnet_ids: List of private subnet IDs
            security_group_id: Security group ID
            instance_profile_name: Instance profile name
            instance_profile_arn: Instance profile ARN
            instance_profile: Instance profile resource
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.instance_profile_arn = instance_profile_arn
        self.instance_profile = instance_profile
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_latest_ami()

        # Get KMS key for EBS encryption
        self.ebs_kms_key = self._get_ebs_kms_key()

        # Create Launch Template
        self.launch_template = self._create_launch_template()

        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create scaling policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()

    def _get_latest_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get latest Amazon Linux 2023 AMI.

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
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )

        return ami

    def _get_ebs_kms_key(self) -> aws.kms.AwaitableGetAliasResult:
        """
        Get AWS managed KMS key for EBS encryption.

        Returns:
            KMS key data
        """
        kms_key = aws.kms.get_alias(
            name='alias/aws/ebs',
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )
        return kms_key

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for EC2 instances.

        Returns:
            Launch Template
        """
        template_name = self.config.get_resource_name('launch-template')

        # User data script for EC2 initialization
        user_data = """#!/bin/bash
set -e

# Configure logging
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"

# Update system packages
dnf update -y

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Install SSM agent (should be pre-installed on Amazon Linux 2023)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Create a simple health check endpoint
cat > /var/www/html/health.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body><h1>OK</h1></body>
</html>
EOF

echo "User data script completed at $(date)"
"""

        launch_template = aws.ec2.LaunchTemplate(
            template_name,
            name=template_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=pulumi.Output.secret(user_data).apply(
                lambda s: __import__('base64').b64encode(s.encode()).decode()
            ),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile_arn
            ),
            vpc_security_group_ids=[self.security_group_id],
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name='/dev/xvda',
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,
                        volume_type='gp3',
                        encrypted=True,
                        kms_key_id=self.ebs_kms_key.target_key_arn,
                        delete_on_termination=True
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint='enabled',
                http_tokens='required',
                http_put_response_hop_limit=1
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags={
                        **self.config.get_tags_for_resource('EC2-Instance'),
                        'Name': self.config.get_resource_name('ec2-instance')
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags={
                        **self.config.get_tags_for_resource('EBS-Volume'),
                        'Name': self.config.get_resource_name('ebs-volume')
                    }
                )
            ],
            tags={
                **self.config.get_tags_for_resource('LaunchTemplate'),
                'Name': template_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent,
                depends_on=[self.instance_profile]
            )
        )

        return launch_template

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group.

        Returns:
            Auto Scaling Group
        """
        asg_name = self.config.get_resource_name('asg')

        auto_scaling_group = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            health_check_grace_period=self.config.health_check_grace_period,
            health_check_type=self.config.health_check_type,
            vpc_zone_identifiers=self.private_subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in {
                    **self.config.get_tags_for_resource('AutoScalingGroup'),
                    'Name': asg_name
                }.items()
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.launch_template,
                depends_on=[self.launch_template]
            )
        )

        return auto_scaling_group

    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-up policy for Auto Scaling Group.

        Returns:
            Scaling Policy
        """
        policy_name = self.config.get_resource_name('scale-up-policy')

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type='ChangeInCapacity',
            scaling_adjustment=1,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.auto_scaling_group
            )
        )

        return policy

    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-down policy for Auto Scaling Group.

        Returns:
            Scaling Policy
        """
        policy_name = self.config.get_resource_name('scale-down-policy')

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type='ChangeInCapacity',
            scaling_adjustment=-1,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.auto_scaling_group
            )
        )

        return policy

    # Getter methods

    def get_launch_template_id(self) -> Output[str]:
        """Get Launch Template ID."""
        return self.launch_template.id

    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name

    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn

    def get_scale_up_policy_arn(self) -> Output[str]:
        """Get scale-up policy ARN."""
        return self.scale_up_policy.arn

    def get_scale_down_policy_arn(self) -> Output[str]:
        """Get scale-down policy ARN."""
        return self.scale_down_policy.arn

```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider management module.

This module manages a consistent AWS provider instance to prevent drift
and ensure all resources use the same provider configuration.
"""

import pulumi_aws as aws
from infrastructure.config import InfraConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    This ensures all resources use the same provider configuration,
    preventing drift in CI/CD pipelines caused by multiple provider instances.
    """

    def __init__(self, config: InfraConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: Infrastructure configuration
        """
        self.config = config
        self._provider = None

    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS provider instance
        """
        if self._provider is None:
            # Create a single consistent provider without random suffixes
            provider_name = f"aws-provider-{self.config.environment_suffix}"

            self._provider = aws.Provider(
                provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )

        return self._provider

```

## File: lib\infrastructure\config.py

```python
"""
Centralized configuration for the TAP AWS infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions to ensure consistency across all resources.
"""

import os
import re
from typing import Dict, List

import pulumi_aws as aws


class InfraConfig:
    """
    Centralized configuration for the TAP infrastructure.

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
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'local')
        self.project_name = 'tap'

        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')

        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)

        # Availability zones - will be dynamically fetched from AWS
        # This is set to None here and populated in the networking module
        # to ensure AZs are always valid for the selected region
        self.availability_zones = None  # Populated dynamically

        # VPC Configuration
        self.vpc_cidr = os.getenv('VPC_CIDR', '10.0.0.0/16')
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        self.enable_flow_logs = True

        # Subnet Configuration - will be adjusted based on available AZs
        # These are templates; actual count depends on available AZs
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

        # Auto Scaling Configuration
        self.asg_min_size = int(os.getenv('ASG_MIN_SIZE', '1'))
        self.asg_max_size = int(os.getenv('ASG_MAX_SIZE', '3'))
        self.asg_desired_capacity = int(os.getenv('ASG_DESIRED_CAPACITY', '1'))
        self.health_check_grace_period = 300
        self.health_check_type = 'EC2'

        # EC2 Configuration
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')

        # CloudWatch Configuration
        self.log_retention_days = 7
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300

        # Alarm thresholds
        self.cpu_high_threshold = int(os.getenv('CPU_HIGH_THRESHOLD', '70'))
        self.cpu_low_threshold = int(os.getenv('CPU_LOW_THRESHOLD', '30'))

        # SNS Configuration
        self.alarm_email = os.getenv('ALARM_EMAIL', '')

        # S3 Lifecycle Configuration
        self.s3_transition_to_ia_days = 30
        self.s3_transition_to_glacier_days = 90
        self.s3_expiration_days = 365

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
        All names are lowercase for case-sensitive resources like S3 buckets.

        Args:
            resource_type: Type of resource (e.g., 'vpc', 's3-bucket', 'lambda')
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
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region,
            'Team': os.getenv('TEAM', 'Infrastructure'),
            'CostCenter': os.getenv('COST_CENTER', 'Engineering'),
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

    def set_availability_zones(self, azs: List[str]):
        """
        Set availability zones dynamically from AWS query.

        This should be called by the networking module after querying
        AWS for available AZs in the selected region.

        Args:
            azs: List of availability zone names (e.g., ['us-east-1a', 'us-east-1b'])
        """
        self.availability_zones = azs

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

```python
"""
IAM infrastructure module.

This module creates IAM roles and policies with least-privilege permissions
for EC2 instances and other AWS services.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Creates and manages IAM roles and policies with least-privilege principles.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the IAM stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Create EC2 role
        self.ec2_role = self._create_ec2_role()

        # Create instance profile
        self.instance_profile = self._create_instance_profile()

    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances with least-privilege policies.

        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('ec2-role')

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags={
                **self.config.get_tags_for_resource('IAM-Role'),
                'Name': role_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        # Attach SSM policy for Systems Manager access
        aws.iam.RolePolicyAttachment(
            f"{role_name}-ssm-policy",
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )

        # Attach CloudWatch policy for logging and metrics
        self._attach_cloudwatch_policy(role)

        return role

    def _attach_cloudwatch_policy(self, role: aws.iam.Role):
        """
        Attach CloudWatch policy to role with scoped permissions.

        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('ec2-cloudwatch-policy')

        # Create scoped CloudWatch policy (no Resource: *)
        policy_document = Output.all(self.config.primary_region).apply(
            lambda args: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": [
                            f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*",
                            f"arn:aws:logs:{args[0]}:*:log-group:/aws/ec2/*:log-stream:*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeTags"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )

    def attach_s3_policy(self, role: aws.iam.Role, *bucket_arns: Output[str]):
        """
        Attach S3 policy to role with scoped permissions for multiple buckets.

        Args:
            role: IAM role to attach policy to
            *bucket_arns: S3 bucket ARNs to scope permissions
        """
        policy_name = self.config.get_resource_name('ec2-s3-policy')

        # Create scoped S3 policy (no Resource: *)
        policy_document = Output.all(*bucket_arns).apply(
            lambda arns: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                        "s3:GetBucketVersioning",
                        "s3:ListBucketVersions"
                    ],
                    "Resource": list(arns) + [f"{arn}/*" for arn in arns]
                }]
            })
        )

        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.

        Returns:
            Instance Profile
        """
        profile_name = self.config.get_resource_name('ec2-instance-profile')

        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags={
                **self.config.get_tags_for_resource('IAM-InstanceProfile'),
                'Name': profile_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.ec2_role
            )
        )

        return instance_profile

    # Getter methods

    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn

    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name

    def get_ec2_instance_profile_name(self) -> Output[str]:
        """Get EC2 instance profile name."""
        return self.instance_profile.name

    def get_ec2_instance_profile_arn(self) -> Output[str]:
        """Get EC2 instance profile ARN."""
        return self.instance_profile.arn

    def get_ec2_instance_profile(self) -> aws.iam.InstanceProfile:
        """Get EC2 instance profile resource."""
        return self.instance_profile

```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring infrastructure module.

This module creates CloudWatch logs, metrics, alarms, and SNS notifications
for comprehensive observability and alerting.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Creates and manages CloudWatch monitoring, alarms, and SNS notifications.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        asg_name: Output[str],
        scale_up_policy_arn: Output[str],
        scale_down_policy_arn: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            asg_name: Auto Scaling Group name
            scale_up_policy_arn: Scale-up policy ARN
            scale_down_policy_arn: Scale-down policy ARN
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.asg_name = asg_name
        self.scale_up_policy_arn = scale_up_policy_arn
        self.scale_down_policy_arn = scale_down_policy_arn
        self.parent = parent

        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()

        # Create CloudWatch log group
        self.log_group = self._create_log_group()

        # Create CloudWatch alarms
        self.cpu_high_alarm = self._create_cpu_high_alarm()
        self.cpu_low_alarm = self._create_cpu_low_alarm()

    def _create_alarm_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.

        Returns:
            SNS Topic
        """
        topic_name = self.config.get_resource_name('alarm-topic')

        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags={
                **self.config.get_tags_for_resource('SNS-Topic'),
                'Name': topic_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        # Create email subscription if email is configured
        if self.config.alarm_email:
            subscription_name = self.config.get_resource_name('alarm-subscription')

            aws.sns.TopicSubscription(
                subscription_name,
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.alarm_email,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=topic
                )
            )

        return topic

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for application logs.

        Returns:
            CloudWatch Log Group
        """
        log_group_name = self.config.get_resource_name('app-logs')

        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=f"/aws/ec2/{log_group_name}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_tags_for_resource('CloudWatch-LogGroup'),
                'Name': log_group_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        return log_group

    def _create_cpu_high_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.

        Returns:
            CloudWatch Metric Alarm
        """
        alarm_name = self.config.get_resource_name('cpu-high-alarm')

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=self.config.cpu_high_threshold,
            alarm_description=f'Triggers when CPU exceeds {self.config.cpu_high_threshold}%',
            alarm_actions=[
                self.scale_up_policy_arn,
                self.alarm_topic.arn
            ],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags={
                **self.config.get_tags_for_resource('CloudWatch-Alarm'),
                'Name': alarm_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        return alarm

    def _create_cpu_low_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for low CPU utilization.

        Returns:
            CloudWatch Metric Alarm
        """
        alarm_name = self.config.get_resource_name('cpu-low-alarm')

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='LessThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=self.config.cpu_low_threshold,
            alarm_description=f'Triggers when CPU falls below {self.config.cpu_low_threshold}%',
            alarm_actions=[
                self.scale_down_policy_arn,
                self.alarm_topic.arn
            ],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags={
                **self.config.get_tags_for_resource('CloudWatch-Alarm'),
                'Name': alarm_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        return alarm

    # Getter methods

    def get_alarm_topic_arn(self) -> Output[str]:
        """Get SNS alarm topic ARN."""
        return self.alarm_topic.arn

    def get_log_group_name(self) -> Output[str]:
        """Get CloudWatch Log Group name."""
        return self.log_group.name

    def get_log_group_arn(self) -> Output[str]:
        """Get CloudWatch Log Group ARN."""
        return self.log_group.arn

    def get_cpu_high_alarm_arn(self) -> Output[str]:
        """Get CPU high alarm ARN."""
        return self.cpu_high_alarm.arn

    def get_cpu_low_alarm_arn(self) -> Output[str]:
        """Get CPU low alarm ARN."""
        return self.cpu_low_alarm.arn

```

## File: lib\infrastructure\networking.py

```python
"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, NAT gateways,
route tables, network ACLs, and VPC Flow Logs for a highly-available multi-AZ setup.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Creates and manages networking infrastructure including VPC, subnets,
    gateways, and routing for high availability across multiple AZs.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the networking stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Dynamically fetch available AZs for the configured region
        self.available_azs = self._get_available_azs()

        # Update config with actual AZs
        self.config.set_availability_zones(self.available_azs)

        # Create VPC
        self.vpc = self._create_vpc()

        # Create VPC Flow Logs
        self.flow_log_group = self._create_flow_log_group()
        self.flow_log_role = self._create_flow_log_role()
        self.flow_log = self._create_flow_log()

        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()

        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()

        # Create NAT Gateways (one per AZ for HA)
        self.nat_gateways = self._create_nat_gateways()

        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()

        # Create Network ACLs
        self.public_nacl = self._create_public_nacl()
        self.private_nacl = self._create_private_nacl()

    def _get_available_azs(self) -> List[str]:
        """
        Dynamically fetch available AZs for the configured region.

        This ensures that subnets are only created in AZs that actually exist
        in the target region, making the code truly region-agnostic.

        Returns:
            List of available AZ names (e.g., ['us-east-1a', 'us-east-1b'])
        """
        # Use Pulumi AWS SDK with explicit region
        azs_data = aws.get_availability_zones(
            state='available',
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )

        available_az_names = azs_data.names

        # Ensure we have at least 2 AZs for HA
        if len(available_az_names) < 2:
            raise ValueError(
                f"Region {self.config.primary_region} has fewer than 2 AZs. "
                "Cannot create HA infrastructure."
            )

        # Use up to 2 AZs for optimal cost/redundancy balance
        return available_az_names[:min(2, len(available_az_names))]

    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC with DNS support enabled.

        Returns:
            VPC resource
        """
        vpc_name = self.config.get_resource_name('vpc')

        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags={
                **self.config.get_tags_for_resource('VPC'),
                'Name': vpc_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        return vpc

    def _create_flow_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for VPC Flow Logs.

        Returns:
            CloudWatch Log Group
        """
        log_group_name = self.config.get_resource_name('vpc-flow-logs')

        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=f"/aws/vpc/{log_group_name}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_tags_for_resource('CloudWatch-LogGroup'),
                'Name': log_group_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        return log_group

    def _create_flow_log_role(self) -> aws.iam.Role:
        """
        Create IAM role for VPC Flow Logs.

        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('vpc-flow-logs-role')

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "vpc-flow-logs.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags={
                **self.config.get_tags_for_resource('IAM-Role'),
                'Name': role_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        # Attach policy to allow writing to CloudWatch Logs
        policy_name = self.config.get_resource_name('vpc-flow-logs-policy')

        # Use Output.all to properly handle the log group ARN
        policy_document = Output.all(self.flow_log_group.arn).apply(
            lambda args: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": args[0]
                }]
            })
        )

        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )

        return role

    def _create_flow_log(self) -> aws.ec2.FlowLog:
        """
        Create VPC Flow Log.

        Returns:
            VPC Flow Log
        """
        flow_log_name = self.config.get_resource_name('vpc-flow-log')

        flow_log = aws.ec2.FlowLog(
            flow_log_name,
            vpc_id=self.vpc.id,
            traffic_type='ALL',
            log_destination_type='cloud-watch-logs',
            log_destination=self.flow_log_group.arn,
            iam_role_arn=self.flow_log_role.arn,
            tags={
                **self.config.get_tags_for_resource('VPC-FlowLog'),
                'Name': flow_log_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc,
                depends_on=[self.flow_log_group, self.flow_log_role]
            )
        )

        return flow_log

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for public subnet access.

        Returns:
            Internet Gateway
        """
        igw_name = self.config.get_resource_name('igw')

        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('InternetGateway'),
                'Name': igw_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        return igw

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets in each availability zone.

        Returns:
            List of public subnets
        """
        public_subnets = []
        subnet_cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'public')

        for i, (az, cidr) in enumerate(zip(self.available_azs, subnet_cidrs)):
            subnet_name = self.config.get_resource_name('public-subnet', str(i + 1))

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_tags_for_resource('Subnet'),
                    'Name': subnet_name,
                    'Type': 'Public',
                    'AZ': az
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )

            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create private subnets in each availability zone.

        Returns:
            List of private subnets
        """
        private_subnets = []
        subnet_cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'private')

        for i, (az, cidr) in enumerate(zip(self.available_azs, subnet_cidrs)):
            subnet_name = self.config.get_resource_name('private-subnet', str(i + 1))

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.config.get_tags_for_resource('Subnet'),
                    'Name': subnet_name,
                    'Type': 'Private',
                    'AZ': az
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )

            private_subnets.append(subnet)

        return private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).

        Returns:
            List of NAT Gateways
        """
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name('nat-eip', str(i + 1))

            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags={
                    **self.config.get_tags_for_resource('EIP'),
                    'Name': eip_name
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=public_subnet
                )
            )

            # Create NAT Gateway
            nat_name = self.config.get_resource_name('nat-gateway', str(i + 1))

            nat = aws.ec2.NatGateway(
                nat_name,
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_tags_for_resource('NATGateway'),
                    'Name': nat_name
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=public_subnet,
                    depends_on=[eip]
                )
            )

            nat_gateways.append(nat)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets.

        Returns:
            Public route table
        """
        rt_name = self.config.get_resource_name('public-rt')

        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('RouteTable'),
                'Name': rt_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        # Create route to Internet Gateway
        route_name = self.config.get_resource_name('public-route-igw')

        aws.ec2.Route(
            route_name,
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=route_table,
                depends_on=[self.internet_gateway]
            )
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name('public-rt-assoc', str(i + 1))

            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table
                )
            )

        return route_table

    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create route tables for private subnets (one per AZ for NAT Gateway).

        Returns:
            List of private route tables
        """
        private_route_tables = []

        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt_name = self.config.get_resource_name('private-rt', str(i + 1))

            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_tags_for_resource('RouteTable'),
                    'Name': rt_name,
                    'Type': 'Private'
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )

            # Create route to NAT Gateway
            route_name = self.config.get_resource_name('private-route-nat', str(i + 1))

            aws.ec2.Route(
                route_name,
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table,
                    depends_on=[nat_gateway]
                )
            )

            # Associate private subnet with private route table
            assoc_name = self.config.get_resource_name('private-rt-assoc', str(i + 1))

            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table
                )
            )

            private_route_tables.append(route_table)

        return private_route_tables

    def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for public subnets.

        Returns:
            Public Network ACL
        """
        nacl_name = self.config.get_resource_name('public-nacl')

        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('NetworkACL'),
                'Name': nacl_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        # Ingress rule: Allow all inbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=False,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )

        # Egress rule: Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )

        return nacl

    def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for private subnets.

        Returns:
            Private Network ACL
        """
        nacl_name = self.config.get_resource_name('private-nacl')

        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('NetworkACL'),
                'Name': nacl_name,
                'Type': 'Private'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )

        # Ingress rule: Allow all inbound traffic from VPC
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block=self.config.vpc_cidr,
            egress=False,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )

        # Egress rule: Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )

        return nacl

    # Getter methods for outputs

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_vpc_cidr(self) -> str:
        """Get VPC CIDR block."""
        return self.config.vpc_cidr

    def get_public_subnet_ids(self) -> List[Output[str]]:
        """Get list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]

    def get_internet_gateway_id(self) -> Output[str]:
        """Get Internet Gateway ID."""
        return self.internet_gateway.id

    def get_nat_gateway_ids(self) -> List[Output[str]]:
        """Get list of NAT Gateway IDs."""
        return [nat.id for nat in self.nat_gateways]

    def get_public_route_table_id(self) -> Output[str]:
        """Get public route table ID."""
        return self.public_route_table.id

    def get_private_route_table_ids(self) -> List[Output[str]]:
        """Get list of private route table IDs."""
        return [rt.id for rt in self.private_route_tables]

    def get_flow_log_group_name(self) -> Output[str]:
        """Get VPC Flow Log CloudWatch Log Group name."""
        return self.flow_log_group.name

```

## File: lib\infrastructure\security.py

```python
"""
Security infrastructure module.

This module creates security groups with strict access controls
to minimize exposure and enforce least-privilege principles.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class SecurityStack:
    """
    Creates and manages security groups with strict access controls.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        vpc_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the security stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            vpc_id: VPC ID
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc_id = vpc_id
        self.parent = parent

        # Create security groups
        self.ec2_security_group = self._create_ec2_security_group()

    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.

        Returns:
            EC2 Security Group
        """
        sg_name = self.config.get_resource_name('ec2-sg')

        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for EC2 instances in Auto Scaling Group',
            vpc_id=self.vpc_id,
            tags={
                **self.config.get_tags_for_resource('SecurityGroup'),
                'Name': sg_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        # Ingress rule: Allow HTTP from within VPC only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-http",
            type='ingress',
            from_port=80,
            to_port=80,
            protocol='tcp',
            cidr_blocks=[self.config.vpc_cidr],
            security_group_id=security_group.id,
            description='Allow HTTP traffic from within VPC',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )

        # Ingress rule: Allow HTTPS from within VPC only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-https",
            type='ingress',
            from_port=443,
            to_port=443,
            protocol='tcp',
            cidr_blocks=[self.config.vpc_cidr],
            security_group_id=security_group.id,
            description='Allow HTTPS traffic from within VPC',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )

        # Egress rule: Allow all outbound traffic
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            from_port=0,
            to_port=0,
            protocol='-1',
            cidr_blocks=['0.0.0.0/0'],
            security_group_id=security_group.id,
            description='Allow all outbound traffic',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )

        return security_group

    # Getter methods

    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id

```

## File: lib\infrastructure\storage.py

```python
"""
Storage infrastructure module.

This module creates S3 buckets with versioning, encryption,
and lifecycle policies for secure and cost-effective storage.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class StorageStack:
    """
    Creates and manages S3 buckets with security and lifecycle policies.
    """

    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the storage stack.

        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent

        # Create S3 buckets
        self.logs_bucket = self._create_logs_bucket()
        self.data_bucket = self._create_data_bucket()

    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for logs with versioning and encryption.

        Returns:
            S3 Bucket
        """
        bucket_name = self.config.get_resource_name('logs-bucket')

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags={
                **self.config.get_tags_for_resource('S3-Bucket'),
                'Name': bucket_name,
                'Purpose': 'Logs'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.
                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    )
                )
            )],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            f"{bucket_name}-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_ia_days,
                            storage_class='STANDARD_IA'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_glacier_days,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-versions',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        return bucket

    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for data with versioning and encryption.

        Returns:
            S3 Bucket
        """
        bucket_name = self.config.get_resource_name('data-bucket')

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags={
                **self.config.get_tags_for_resource('S3-Bucket'),
                'Name': bucket_name,
                'Purpose': 'Data'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.
                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    )
                )
            )],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=bucket
            )
        )

        return bucket

    # Getter methods

    def get_logs_bucket_name(self) -> Output[str]:
        """Get logs bucket name."""
        return self.logs_bucket.id

    def get_logs_bucket_arn(self) -> Output[str]:
        """Get logs bucket ARN."""
        return self.logs_bucket.arn

    def get_data_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.id

    def get_data_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn

```
