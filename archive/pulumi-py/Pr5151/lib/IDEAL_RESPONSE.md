## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the scalable EC2 infrastructure.

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

# Get environment suffix from environment variable or config
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

pulumi.log.info(f"Resolved environment suffix: {environment_suffix}")
pulumi.log.info(f"Deploying to region: {os.getenv('AWS_REGION', 'us-west-2')}")
pulumi.log.info(f"Project name: scalable-ec2")

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="scalable-infra",
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

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider configuration module.

This module creates a consistent AWS provider instance without random suffixes
to avoid creating new providers on each build, which causes drift in CI/CD pipelines.
"""
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfraConfig


def create_aws_provider(config: InfraConfig, parent: pulumi.ComponentResource = None) -> aws.Provider:
    """
    Create a consistent AWS provider instance.

    This provider uses a deterministic name based on the environment suffix
    to ensure the same provider is reused across deployments, preventing drift.

    Args:
        config: Infrastructure configuration
        parent: Parent Pulumi component resource

    Returns:
        AWS Provider instance
    """
    provider_name = f"aws-provider-{config.region_normalized}-{config.environment_suffix}"

    opts = ResourceOptions(parent=parent) if parent else None

    provider = aws.Provider(
        provider_name,
        region=config.primary_region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=config.get_common_tags()
        ),
        opts=opts
    )

    return provider


```

## File: lib\infrastructure\compute.py

```python
"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups for
highly-available EC2 instances with SSM Session Manager enabled.
"""
import base64
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class ComputeStack:
    """
    Creates and manages EC2 Launch Templates and Auto Scaling Groups
    for highly-available application deployment with SSM access.
    """

    def __init__(
        self,
        config: InfraConfig,
        subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        instance_profile_arn: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the compute stack.

        Args:
            config: Infrastructure configuration
            subnet_ids: List of subnet IDs for ASG instances
            security_group_id: Security group ID for instances
            instance_profile_arn: IAM instance profile ARN
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_arn = instance_profile_arn
        self.aws_provider = aws_provider
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_ami()

        # Get KMS key for EBS encryption
        self.ebs_kms_key = self._get_ebs_kms_key()

        # Create Launch Template
        self.launch_template = self._create_launch_template()

        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create Scaling Policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()

        # Create CloudWatch Alarms for scaling
        self.high_cpu_alarm = self._create_high_cpu_alarm()
        self.low_cpu_alarm = self._create_low_cpu_alarm()

    def _get_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get the latest Amazon Linux 2023 AMI.

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
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )

        return ami

    def _get_ebs_kms_key(self) -> aws.kms.AwaitableGetAliasResult:
        """
        Get AWS managed KMS key for EBS encryption.

        Returns:
            KMS key alias data
        """
        return aws.kms.get_alias(
            name="alias/aws/ebs",
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )

    def _get_user_data(self) -> str:
        """
        Generate user data script for EC2 instances.

        Ensures SSM agent is enabled and running, and AWS CLI is installed.

        Returns:
            User data script (Pulumi handles base64 encoding)
        """
        user_data_script = f"""#!/bin/bash
set -e

# Log all output for debugging
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "Starting user data script at $(date)"

# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo "SSM agent enabled and started"

# Install AWS CLI v2 (not pre-installed on Amazon Linux 2023)
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI v2..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip -q /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install
    rm -rf /tmp/awscliv2.zip /tmp/aws
    echo "AWS CLI v2 installed successfully"
else
    echo "AWS CLI already installed"
fi

# Verify AWS CLI installation
aws --version

# Signal that instance is ready
echo "Instance ready at $(date)" > /var/log/user-data-complete.log
echo "User data script completed successfully at $(date)"
"""

        return user_data_script

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for Auto Scaling Group.

        Returns:
            Launch Template resource
        """
        lt_name = self.config.get_resource_name('launch-template', include_region=False)

        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=base64.b64encode(self._get_user_data().encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile_arn
            ),
            vpc_security_group_ids=[self.security_group_id],
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,
                        volume_type="gp3",
                        encrypted=True,
                        kms_key_id=self.ebs_kms_key.target_key_arn,
                        delete_on_termination=True
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self.config.get_tags_for_resource('EC2Instance', Name=f"{lt_name}-instance")
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags=self.config.get_tags_for_resource('EBSVolume', Name=f"{lt_name}-volume")
                )
            ],
            tags=self.config.get_tags_for_resource('LaunchTemplate', Name=lt_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return launch_template

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group.

        Returns:
            Auto Scaling Group resource
        """
        asg_name = self.config.get_resource_name('asg', include_region=False)

        asg = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            health_check_grace_period=self.config.health_check_grace_period,
            health_check_type=self.config.health_check_type,
            vpc_zone_identifiers=self.subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in self.config.get_tags_for_resource('AutoScalingGroup', Name=asg_name).items()
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.launch_template]
            )
        )

        return asg

    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-up policy for ASG.

        Returns:
            Scaling policy resource
        """
        policy_name = self.config.get_resource_name('policy-scale-up', include_region=False)

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=self.config.scale_up_adjustment,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group]
            )
        )

        return policy

    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-down policy for ASG.

        Returns:
            Scaling policy resource
        """
        policy_name = self.config.get_resource_name('policy-scale-down', include_region=False)

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=self.config.scale_down_adjustment,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group]
            )
        )

        return policy

    def _create_high_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.

        Triggers scale-up policy when CPU > threshold.

        Returns:
            CloudWatch alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-high', include_region=False)

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=self.config.alarm_period,
            statistic="Average",
            threshold=self.config.scale_up_cpu_threshold,
            alarm_description=f"Triggers scale-up when CPU exceeds {self.config.scale_up_cpu_threshold}%",
            alarm_actions=[self.scale_up_policy.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags=self.config.get_tags_for_resource('CloudWatchAlarm', Name=alarm_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group, self.scale_up_policy]
            )
        )

        return alarm

    def _create_low_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for low CPU utilization.

        Triggers scale-down policy when CPU < threshold.

        Returns:
            CloudWatch alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-low', include_region=False)

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="LessThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=self.config.alarm_period,
            statistic="Average",
            threshold=self.config.scale_down_cpu_threshold,
            alarm_description=f"Triggers scale-down when CPU falls below {self.config.scale_down_cpu_threshold}%",
            alarm_actions=[self.scale_down_policy.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags=self.config.get_tags_for_resource('CloudWatchAlarm', Name=alarm_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group, self.scale_down_policy]
            )
        )

        return alarm

    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name

    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn

    def get_launch_template_id(self) -> Output[str]:
        """Get Launch Template ID."""
        return self.launch_template.id


```

## File: lib\infrastructure\config.py

```python
"""
Centralized configuration for the infrastructure stack.

This module provides a centralized configuration class that manages all infrastructure
settings including naming conventions, region configuration, and resource parameters.
All resources dynamically inherit the region configuration.
"""
import os
import re
from typing import Dict, Optional


class InfraConfig:
    """
    Centralized configuration for infrastructure deployment.

    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware, lowercase for S3)
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
        self.project_name = 'scalable-ec2'

        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-west-2')

        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)

        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True

        # Subnet Configuration
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24'
        ]

        # EC2 Configuration
        self.instance_type = 't2.micro'

        # Auto Scaling Configuration
        self.asg_min_size = 1
        self.asg_max_size = 3
        self.asg_desired_capacity = 1
        self.health_check_grace_period = 300
        self.health_check_type = 'EC2'

        # Scaling Policy Configuration
        self.scale_up_cpu_threshold = 70.0
        self.scale_down_cpu_threshold = 30.0
        self.scale_up_adjustment = 1
        self.scale_down_adjustment = -1

        # CloudWatch Configuration
        self.log_retention_days = 7
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300

        # S3 Configuration
        self.s3_encryption_algorithm = 'AES256'
        self.s3_enable_versioning = True
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
            us-west-2 -> uswest2
            us-east-1 -> useast1
            eu-central-1 -> eucentral1

        Args:
            region: AWS region name (e.g., 'us-west-2')

        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())

    def get_resource_name(self, resource_type: str, suffix: Optional[str] = None, include_region: bool = True) -> str:
        """
        Generate a standardized resource name.

        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources like S3 buckets.

        Args:
            resource_type: Type of resource (e.g., 'vpc', 's3-bucket', 'lambda')
            suffix: Optional additional suffix for uniqueness
            include_region: Whether to include region in the name (default True for consistency)

        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type]

        # Include region for global resources and consistency
        if include_region:
            parts.append(self.region_normalized)

        parts.append(self.environment_suffix)

        if suffix:
            parts.append(suffix)

        return '-'.join(parts).lower()

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
            'Repository': os.getenv('REPOSITORY', 'unknown'),
            'CommitAuthor': os.getenv('COMMIT_AUTHOR', 'unknown')
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


```

## File: lib\infrastructure\iam.py

```python
"""
IAM infrastructure module.

This module creates IAM roles and policies for EC2 instances with least-privilege
access to S3 and Systems Manager (SSM) for secure instance management.
"""
import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class IAMStack:
    """
    Creates and manages IAM roles and policies for EC2 instances.

    Provides least-privilege access to:
    - AWS Systems Manager (SSM) for secure instance management
    - S3 for object storage operations
    - CloudWatch Logs for logging
    """

    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the IAM stack.

        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent

        # Create EC2 IAM role
        self.ec2_role = self._create_ec2_role()

        # Attach SSM managed policy for Systems Manager access
        self.ssm_policy_attachment = self._attach_ssm_managed_policy()

        # Attach CloudWatch managed policy for logging
        self.cloudwatch_policy_attachment = self._attach_cloudwatch_managed_policy()

        # Create instance profile
        self.instance_profile = self._create_instance_profile()

    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances.

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-ec2', include_region=False)

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
            assume_role_policy=json.dumps(assume_role_policy),
            description=f"IAM role for EC2 instances in {self.config.environment_suffix} environment",
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return role

    def _attach_ssm_managed_policy(self) -> aws.iam.RolePolicyAttachment:
        """
        Attach AWS managed SSM policy to EC2 role.

        This enables Systems Manager Session Manager for secure instance access
        without SSH keys.

        Returns:
            Role policy attachment resource
        """
        attachment_name = self.config.get_resource_name('attachment-ssm-ec2', include_region=False)

        attachment = aws.iam.RolePolicyAttachment(
            attachment_name,
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )

        return attachment

    def _attach_cloudwatch_managed_policy(self) -> aws.iam.RolePolicyAttachment:
        """
        Attach AWS managed CloudWatch policy to EC2 role.

        This enables CloudWatch Logs and metrics publishing.

        Returns:
            Role policy attachment resource
        """
        attachment_name = self.config.get_resource_name('attachment-cloudwatch-ec2', include_region=False)

        attachment = aws.iam.RolePolicyAttachment(
            attachment_name,
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )

        return attachment

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create IAM instance profile for EC2 instances.

        Returns:
            Instance profile resource
        """
        profile_name = self.config.get_resource_name('profile-ec2', include_region=False)

        profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource('InstanceProfile', Name=profile_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )

        return profile

    def attach_s3_policy(self, bucket_arn: Output[str]) -> aws.iam.RolePolicy:
        """
        Attach S3 access policy to EC2 role.

        Provides least-privilege access to the specified S3 bucket.

        Args:
            bucket_arn: ARN of the S3 bucket

        Returns:
            Role policy resource
        """
        policy_name = self.config.get_resource_name('policy-s3-ec2', include_region=False)

        def create_policy_document(arn: str) -> str:
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"{arn}/*"
                    }
                ]
            })

        policy = aws.iam.RolePolicy(
            policy_name,
            role=self.ec2_role.id,
            policy=bucket_arn.apply(create_policy_document),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.ec2_role]
            )
        )

        return policy

    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn

    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name

    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name

    def get_instance_profile_arn(self) -> Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn


```

## File: lib\infrastructure\compute.py

```python
"""
Monitoring infrastructure module.

This module creates CloudWatch Log Groups and additional monitoring
resources for EC2 instances and S3 buckets.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class MonitoringStack:
    """
    Creates and manages CloudWatch monitoring resources.

    Features:
    - Log groups for EC2 instance logs
    - Log groups for Auto Scaling events
    - Metric alarms for operational monitoring
    """

    def __init__(
        self,
        config: InfraConfig,
        asg_name: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: Infrastructure configuration
            asg_name: Auto Scaling Group name
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.asg_name = asg_name
        self.aws_provider = aws_provider
        self.parent = parent

        # Create log groups
        self.ec2_log_group = self._create_ec2_log_group()
        self.asg_log_group = self._create_asg_log_group()

    def _create_ec2_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for EC2 instance logs.

        Returns:
            CloudWatch Log Group resource
        """
        log_group_name = f"/aws/ec2/{self.config.environment_suffix}"
        resource_name = self.config.get_resource_name('log-group-ec2', include_region=False)

        log_group = aws.cloudwatch.LogGroup(
            resource_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return log_group

    def _create_asg_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for Auto Scaling events.

        Returns:
            CloudWatch Log Group resource
        """
        log_group_name = f"/aws/autoscaling/{self.config.environment_suffix}"
        resource_name = self.config.get_resource_name('log-group-asg', include_region=False)

        log_group = aws.cloudwatch.LogGroup(
            resource_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return log_group

    def get_ec2_log_group_name(self) -> Output[str]:
        """Get EC2 log group name."""
        return self.ec2_log_group.name

    def get_ec2_log_group_arn(self) -> Output[str]:
        """Get EC2 log group ARN."""
        return self.ec2_log_group.arn

    def get_asg_log_group_name(self) -> Output[str]:
        """Get ASG log group name."""
        return self.asg_log_group.name

    def get_asg_log_group_arn(self) -> Output[str]:
        """Get ASG log group ARN."""
        return self.asg_log_group.arn


```

## File: lib\infrastructure\networking.py

```python
"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, and route tables
for the EC2 infrastructure.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NetworkingStack:
    """
    Creates and manages VPC and networking resources.

    Creates:
    - VPC with DNS support
    - Public subnets across multiple availability zones
    - Internet Gateway
    - Route tables and associations
    """

    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the networking stack.

        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent

        # Get available availability zones
        self.availability_zones = self._get_availability_zones()

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()

        # Create public subnets
        self.public_subnets = self._create_public_subnets()

        # Create route table
        self.route_table = self._create_route_table()

        # Associate subnets with route table
        self.route_table_associations = self._create_route_table_associations()

    def _get_availability_zones(self):
        """
        Get available availability zones in the region.

        Returns:
            Availability zones data
        """
        azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )
        return azs

    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC.

        Returns:
            VPC resource
        """
        vpc_name = self.config.get_resource_name('vpc', include_region=False)

        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags=self.config.get_tags_for_resource('VPC', Name=vpc_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return vpc

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for VPC.

        Returns:
            Internet Gateway resource
        """
        igw_name = self.config.get_resource_name('igw', include_region=False)

        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('InternetGateway', Name=igw_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.vpc]
            )
        )

        return igw

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets across availability zones.

        Returns:
            List of subnet resources
        """
        subnets = []

        # Use first 2 AZs for cost efficiency (t2.micro budget-conscious)
        az_count = min(2, len(self.availability_zones.names))

        for i in range(az_count):
            subnet_name = self.config.get_resource_name(
                'subnet-public',
                suffix=f"az{i+1}",
                include_region=False
            )

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=self.config.public_subnet_cidrs[i],
                availability_zone=self.availability_zones.names[i],
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Public',
                    AZ=self.availability_zones.names[i]
                ),
                opts=ResourceOptions(
                    provider=self.aws_provider,
                    parent=self.parent,
                    depends_on=[self.vpc]
                )
            )

            subnets.append(subnet)

        return subnets

    def _create_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets.

        Returns:
            Route table resource
        """
        rt_name = self.config.get_resource_name('rt-public', include_region=False)

        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.internet_gateway.id
                )
            ],
            tags=self.config.get_tags_for_resource('RouteTable', Name=rt_name, Type='Public'),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.vpc, self.internet_gateway]
            )
        )

        return route_table

    def _create_route_table_associations(self) -> List[aws.ec2.RouteTableAssociation]:
        """
        Associate public subnets with route table.

        Returns:
            List of route table association resources
        """
        associations = []

        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name(
                'rta-public',
                suffix=f"az{i+1}",
                include_region=False
            )

            association = aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=self.route_table.id,
                opts=ResourceOptions(
                    provider=self.aws_provider,
                    parent=self.parent,
                    depends_on=[subnet, self.route_table]
                )
            )

            associations.append(association)

        return associations

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_subnet_ids(self) -> Output[List[str]]:
        """Get list of public subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.public_subnets])

```

## File: lib\infrastructure\security.py

```python
"""
Security infrastructure module.

This module creates security groups for EC2 instances with appropriate
ingress and egress rules.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecurityStack:
    """
    Creates and manages security groups for EC2 instances.

    Security groups allow:
    - Outbound internet access for updates and SSM
    - No inbound SSH (using SSM Session Manager instead)
    """

    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the security stack.

        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID for security group (Output)
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.aws_provider = aws_provider
        self.parent = parent

        # Create security group for EC2 instances
        self.ec2_security_group = self._create_ec2_security_group()

    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.

        Allows all outbound traffic for SSM and updates.
        No inbound rules needed as we use SSM Session Manager.

        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-ec2', include_region=False)

        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description=f"Security group for EC2 instances in {self.config.environment_suffix} environment",
            vpc_id=self.vpc_id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return security_group

    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id


```

## File: lib\infrastructure\storage.py

```python
"""
Storage infrastructure module.

This module creates S3 buckets with server-side encryption, versioning,
lifecycle policies, and access logging for secure and cost-effective storage.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class StorageStack:
    """
    Creates and manages S3 buckets with security and lifecycle configurations.

    Features:
    - Server-side encryption with AES-256
    - Versioning enabled
    - Lifecycle policies for cost optimization
    - Access logging
    - Public access blocking
    """

    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the storage stack.

        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent

        # Create main S3 bucket
        self.main_bucket = self._create_main_bucket()

        # Create logging bucket
        self.log_bucket = self._create_log_bucket()

        # Configure bucket encryption
        self.bucket_encryption = self._configure_bucket_encryption()

        # Configure bucket versioning
        self.bucket_versioning = self._configure_bucket_versioning()

        # Configure lifecycle rules
        self.lifecycle_configuration = self._configure_lifecycle()

        # Block public access
        self.public_access_block = self._block_public_access()

        # Configure logging
        self.logging_configuration = self._configure_logging()

    def _create_main_bucket(self) -> aws.s3.Bucket:
        """
        Create main S3 bucket.

        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_resource_name('bucket-main', include_region=True)

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return bucket

    def _create_log_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for access logs.

        Returns:
            S3 Bucket resource for logs
        """
        bucket_name = self.config.get_resource_name('bucket-logs', include_region=True)

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name, Purpose='AccessLogs'),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )

        return bucket

    def _configure_bucket_encryption(self) -> aws.s3.BucketServerSideEncryptionConfiguration:
        """
        Configure server-side encryption for main bucket.

        Uses AES-256 encryption algorithm.

        Returns:
            Bucket encryption configuration resource
        """
        encryption_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-encryption"

        encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            encryption_name,
            bucket=self.main_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm=self.config.s3_encryption_algorithm
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )

        return encryption

    def _configure_bucket_versioning(self) -> aws.s3.BucketVersioning:
        """
        Configure versioning for main bucket.

        Returns:
            Bucket versioning configuration resource
        """
        versioning_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-versioning"

        versioning = aws.s3.BucketVersioning(
            versioning_name,
            bucket=self.main_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled" if self.config.s3_enable_versioning else "Suspended"
            ),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )

        return versioning

    def _configure_lifecycle(self) -> aws.s3.BucketLifecycleConfiguration:
        """
        Configure lifecycle rules for cost optimization.

        Transitions objects to Infrequent Access and Glacier storage classes,
        and expires old objects.

        Returns:
            Bucket lifecycle configuration resource
        """
        lifecycle_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-lifecycle"

        lifecycle = aws.s3.BucketLifecycleConfiguration(
            lifecycle_name,
            bucket=self.main_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition-and-expiration",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_ia_days,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_transition_to_glacier_days,
                            storage_class="GLACIER"
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )

        return lifecycle

    def _block_public_access(self) -> aws.s3.BucketPublicAccessBlock:
        """
        Block all public access to the main bucket.

        Returns:
            Bucket public access block resource
        """
        block_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-public-access-block"

        block = aws.s3.BucketPublicAccessBlock(
            block_name,
            bucket=self.main_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket]
            )
        )

        return block

    def _configure_logging(self) -> aws.s3.BucketLogging:
        """
        Configure access logging for the main bucket.

        Returns:
            Bucket logging configuration resource
        """
        logging_name = f"{self.config.get_resource_name('bucket-main', include_region=True)}-logging"

        logging = aws.s3.BucketLogging(
            logging_name,
            bucket=self.main_bucket.id,
            target_bucket=self.log_bucket.id,
            target_prefix="access-logs/",
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.main_bucket, self.log_bucket]
            )
        )

        return logging

    def get_main_bucket_name(self) -> Output[str]:
        """Get main bucket name."""
        return self.main_bucket.id

    def get_main_bucket_arn(self) -> Output[str]:
        """Get main bucket ARN."""
        return self.main_bucket.arn

    def get_log_bucket_name(self) -> Output[str]:
        """Get log bucket name."""
        return self.log_bucket.id

    def get_log_bucket_arn(self) -> Output[str]:
        """Get log bucket ARN."""
        return self.log_bucket.arn


```
