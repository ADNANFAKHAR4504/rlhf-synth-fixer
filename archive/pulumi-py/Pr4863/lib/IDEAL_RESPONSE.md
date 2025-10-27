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
from pulumi import Config, ResourceOptions

# Add lib directory to Python path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

# Now import from the lib directory
from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
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

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\compute.py

```python
"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups for
highly-available application instances across multiple AZs.
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
    for highly-available application deployment.
    """

    def __init__(
        self,
        config: InfraConfig,
        private_subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        target_group_arn: Output[str] = None,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the compute stack.

        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG instances
            security_group_id: Security group ID for instances
            instance_profile_name: IAM instance profile name
            target_group_arn: Target group ARN for ASG (optional, for ALB integration)
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.target_group_arn = target_group_arn
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_ami()

        # Create Launch Template
        self.launch_template = self._create_launch_template()

        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create Auto Scaling Policies
        self.scaling_policy = self._create_scaling_policy()

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
            ]
        )

        return ami

    def _get_user_data(self) -> str:
        """
        Generate user data script for EC2 instances.

        Returns:
            Base64-encoded user data script
        """
        user_data_script = f"""#!/bin/bash
set -e

# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install Apache web server using dnf (Amazon Linux 2023)
dnf install -y httpd

# Create a simple health check endpoint
cat > /var/www/html/health <<'EOF'
OK
EOF

# Create a simple index page
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Application</title>
</head>
<body>
    <h1>TAP Application - Environment: {self.config.environment_suffix}</h1>
    <p>Instance ID: <span id="instance-id">Loading...</span></p>
    <p>Availability Zone: <span id="az">Loading...</span></p>
    <script>
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(r => r.text())
            .then(id => document.getElementById('instance-id').textContent = id);
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(r => r.text())
            .then(az => document.getElementById('az').textContent = az);
    </script>
</body>
</html>
EOF

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Signal that instance is ready
echo "Instance ready at $(date)" > /var/log/user-data-complete.log
"""

        return user_data_script

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for Auto Scaling Group.

        Returns:
            Launch Template resource
        """
        lt_name = self.config.get_resource_name('launch-template')

        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=base64.b64encode(self._get_user_data().encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            vpc_security_group_ids=[self.security_group_id],
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint='enabled',
                http_tokens='required',  # Require IMDSv2
                http_put_response_hop_limit=1
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags=self.config.get_tags_for_resource('EC2Instance', Name=f"{lt_name}-instance")
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags=self.config.get_tags_for_resource('EBSVolume', Name=f"{lt_name}-volume")
                )
            ],
            tags=self.config.get_tags_for_resource('LaunchTemplate', Name=lt_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return launch_template

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group across multiple AZs.

        Returns:
            Auto Scaling Group resource
        """
        asg_name = self.config.get_resource_name('asg')

        # Build ASG arguments
        asg_args = {
            'name': asg_name,
            'min_size': self.config.asg_min_size,
            'max_size': self.config.asg_max_size,
            'desired_capacity': self.config.asg_desired_capacity,
            'health_check_grace_period': self.config.health_check_grace_period,
            'health_check_type': self.config.health_check_type,
            'vpc_zone_identifiers': self.private_subnet_ids,
            'launch_template': aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            'enabled_metrics': [
                'GroupMinSize',
                'GroupMaxSize',
                'GroupDesiredCapacity',
                'GroupInServiceInstances',
                'GroupTotalInstances'
            ],
            'tags': [
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in self.config.get_tags_for_resource('AutoScalingGroup', Name=asg_name).items()
            ],
            'opts': ResourceOptions(parent=self.parent)
        }

        # Only add target_group_arns if ALB is enabled
        if self.target_group_arn is not None:
            asg_args['target_group_arns'] = [self.target_group_arn]

        auto_scaling_group = aws.autoscaling.Group(asg_name, **asg_args)

        return auto_scaling_group

    def _create_scaling_policy(self) -> aws.autoscaling.Policy:
        """
        Create target tracking scaling policy.

        Returns:
            Scaling Policy resource
        """
        policy_name = self.config.get_resource_name('scaling-policy')

        scaling_policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            policy_type='TargetTrackingScaling',
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='ASGAverageCPUUtilization'
                ),
                target_value=70.0
            ),
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )

        return scaling_policy

    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name

    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn


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
from typing import Dict, List, Optional


class InfraConfig:
    """
    Centralized configuration for infrastructure deployment.

    This class manages all configuration settings including:
    - Environment variables
    - Naming conventions (region-aware)
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
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = 'tap'

        # Region configuration - dynamically inherited by ALL resources
        # Change this via AWS_REGION environment variable
        self.primary_region = os.getenv('AWS_REGION', 'us-west-1')

        # Normalize region name for use in resource names (remove hyphens for S3, etc.)
        self.region_normalized = self._normalize_region_name(self.primary_region)

        # Availability zones - will be dynamically fetched from AWS
        # This is set to None here and populated in the networking module
        # to ensure AZs are always valid for the selected region
        self.availability_zones = None  # Populated dynamically

        # VPC Configuration
        self.vpc_cidr = '10.0.0.0/16'
        self.enable_dns_hostnames = True
        self.enable_dns_support = True
        self.enable_flow_logs = True

        # Subnet Configuration - will be adjusted based on available AZs
        # These are templates; actual count depends on available AZs
        self.public_subnet_cidrs = [
            '10.0.1.0/24',
            '10.0.2.0/24',
            '10.0.3.0/24',
            '10.0.4.0/24',  # Extra for regions with 4+ AZs
            '10.0.5.0/24',
            '10.0.6.0/24'
        ]
        self.private_subnet_cidrs = [
            '10.0.11.0/24',
            '10.0.12.0/24',
            '10.0.13.0/24',
            '10.0.14.0/24',  # Extra for regions with 4+ AZs
            '10.0.15.0/24',
            '10.0.16.0/24'
        ]

        # NAT Gateway Configuration - one per AZ for HA
        self.nat_gateway_per_az = True

        # Auto Scaling Configuration
        # Reduced to avoid AWS account throttling (RequestLimitExceeded)
        self.asg_min_size = 1
        self.asg_max_size = 2
        self.asg_desired_capacity = 1
        self.health_check_grace_period = 300  # 5 minutes grace period
        self.health_check_type = 'EC2'  # Use EC2 health checks (not ELB) to allow instances to launch

        # EC2 Configuration
        self.instance_type = 't3.micro'
        self.alb_idle_timeout = 60
        self.enable_deletion_protection = False
        self.enable_cross_zone_load_balancing = False

        # Target Group Configuration
        self.target_group_port = 80
        self.target_group_protocol = 'HTTP'
        self.health_check_path = '/health'
        self.health_check_interval = 30
        self.health_check_timeout = 10  # Increased from 5 to 10 seconds
        self.healthy_threshold = 2
        self.unhealthy_threshold = 5  # Increased from 3 to 5 for more tolerance during startup

        # CloudWatch Configuration
        self.log_retention_days = 7
        self.alarm_evaluation_periods = 2
        self.alarm_period = 300  # 5 minutes

        # SNS Configuration
        self.alarm_email = os.getenv('ALARM_EMAIL', '')

        # Secrets Configuration
        self.use_secrets_manager = True
        self.use_ssm_parameters = True

        # Backup and Recovery Configuration
        self.enable_automated_backups = True
        self.backup_retention_days = 7
        self.enable_point_in_time_recovery = True

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
            us-west-1 -> uswest1
            us-east-2 -> useast2
            eu-central-1 -> eucentral1

        Args:
            region: AWS region name (e.g., 'us-west-1')

        Returns:
            Normalized region name
        """
        return re.sub(r'[^a-z0-9]', '', region.lower())

    def get_resource_name(self, resource_type: str, suffix: Optional[str] = None, include_region: bool = False) -> str:
        """
        Generate a standardized resource name.

        Format: {project_name}-{resource_type}-{region_normalized}-{environment_suffix}[-{suffix}]
        All names are lowercase for case-sensitive resources like S3 buckets.

        Args:
            resource_type: Type of resource (e.g., 'vpc', 's3-bucket', 'lambda')
            suffix: Optional additional suffix for uniqueness (e.g., AZ suffix)
            include_region: Whether to include region in the name (useful for global resources like S3)

        Returns:
            Standardized resource name in lowercase
        """
        parts = [self.project_name, resource_type]

        # Include region for global resources or when explicitly requested
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

    def set_availability_zones(self, azs: List[str]):
        """
        Set availability zones dynamically from AWS query.

        This should be called by the networking module after querying
        AWS for available AZs in the selected region.

        Args:
            azs: List of availability zone names (e.g., ['us-west-1a', 'us-west-1b'])
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
        else:
            return self.private_subnet_cidrs[:az_count]

```

## File: lib\infrastructure\compute.py

```python
"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups for
highly-available application instances across multiple AZs.
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
    for highly-available application deployment.
    """

    def __init__(
        self,
        config: InfraConfig,
        private_subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        target_group_arn: Output[str] = None,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the compute stack.

        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG instances
            security_group_id: Security group ID for instances
            instance_profile_name: IAM instance profile name
            target_group_arn: Target group ARN for ASG (optional, for ALB integration)
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.target_group_arn = target_group_arn
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_ami()

        # Create Launch Template
        self.launch_template = self._create_launch_template()

        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create Auto Scaling Policies
        self.scaling_policy = self._create_scaling_policy()

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
            ]
        )

        return ami

    def _get_user_data(self) -> str:
        """
        Generate user data script for EC2 instances.

        Returns:
            Base64-encoded user data script
        """
        user_data_script = f"""#!/bin/bash
set -e

# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install Apache web server using dnf (Amazon Linux 2023)
dnf install -y httpd

# Create a simple health check endpoint
cat > /var/www/html/health <<'EOF'
OK
EOF

# Create a simple index page
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Application</title>
</head>
<body>
    <h1>TAP Application - Environment: {self.config.environment_suffix}</h1>
    <p>Instance ID: <span id="instance-id">Loading...</span></p>
    <p>Availability Zone: <span id="az">Loading...</span></p>
    <script>
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(r => r.text())
            .then(id => document.getElementById('instance-id').textContent = id);
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(r => r.text())
            .then(az => document.getElementById('az').textContent = az);
    </script>
</body>
</html>
EOF

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Signal that instance is ready
echo "Instance ready at $(date)" > /var/log/user-data-complete.log
"""

        return user_data_script

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for Auto Scaling Group.

        Returns:
            Launch Template resource
        """
        lt_name = self.config.get_resource_name('launch-template')

        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=base64.b64encode(self._get_user_data().encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            vpc_security_group_ids=[self.security_group_id],
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint='enabled',
                http_tokens='required',  # Require IMDSv2
                http_put_response_hop_limit=1
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags=self.config.get_tags_for_resource('EC2Instance', Name=f"{lt_name}-instance")
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags=self.config.get_tags_for_resource('EBSVolume', Name=f"{lt_name}-volume")
                )
            ],
            tags=self.config.get_tags_for_resource('LaunchTemplate', Name=lt_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return launch_template

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group across multiple AZs.

        Returns:
            Auto Scaling Group resource
        """
        asg_name = self.config.get_resource_name('asg')

        # Build ASG arguments
        asg_args = {
            'name': asg_name,
            'min_size': self.config.asg_min_size,
            'max_size': self.config.asg_max_size,
            'desired_capacity': self.config.asg_desired_capacity,
            'health_check_grace_period': self.config.health_check_grace_period,
            'health_check_type': self.config.health_check_type,
            'vpc_zone_identifiers': self.private_subnet_ids,
            'launch_template': aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            'enabled_metrics': [
                'GroupMinSize',
                'GroupMaxSize',
                'GroupDesiredCapacity',
                'GroupInServiceInstances',
                'GroupTotalInstances'
            ],
            'tags': [
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in self.config.get_tags_for_resource('AutoScalingGroup', Name=asg_name).items()
            ],
            'opts': ResourceOptions(parent=self.parent)
        }

        # Only add target_group_arns if ALB is enabled
        if self.target_group_arn is not None:
            asg_args['target_group_arns'] = [self.target_group_arn]

        auto_scaling_group = aws.autoscaling.Group(asg_name, **asg_args)

        return auto_scaling_group

    def _create_scaling_policy(self) -> aws.autoscaling.Policy:
        """
        Create target tracking scaling policy.

        Returns:
            Scaling Policy resource
        """
        policy_name = self.config.get_resource_name('scaling-policy')

        scaling_policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            policy_type='TargetTrackingScaling',
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='ASGAverageCPUUtilization'
                ),
                target_value=70.0
            ),
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )

        return scaling_policy

    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name

    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn



```

## File: lib\infrastructure\loadbalancer.py

```python
"""
Load Balancer infrastructure module.

This module creates Application Load Balancer, target groups,
and listeners for highly-available traffic distribution.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import CustomTimeouts, Output, ResourceOptions

from .config import InfraConfig


class LoadBalancerStack:
    """
    Creates and manages Application Load Balancer and related resources.
    """

    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        public_subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the load balancer stack.

        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID
            public_subnet_ids: List of public subnet IDs
            security_group_id: Security group ID for ALB
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.security_group_id = security_group_id
        self.parent = parent

        # Create Target Group
        self.target_group = self._create_target_group()

        # Create Application Load Balancer
        self.alb = self._create_alb()

        # Create Listener
        self.listener = self._create_listener()

    def _create_target_group(self) -> aws.lb.TargetGroup:
        """
        Create Target Group for ALB.

        Returns:
            Target Group resource
        """
        tg_name = self.config.get_resource_name('tg')

        target_group = aws.lb.TargetGroup(
            tg_name,
            name=tg_name,
            port=self.config.target_group_port,
            protocol=self.config.target_group_protocol,
            vpc_id=self.vpc_id,
            target_type='instance',
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path=self.config.health_check_path,
                interval=self.config.health_check_interval,
                timeout=self.config.health_check_timeout,
                healthy_threshold=self.config.healthy_threshold,
                unhealthy_threshold=self.config.unhealthy_threshold,
                matcher='200'
            ),
            deregistration_delay=30,
            tags=self.config.get_tags_for_resource('TargetGroup', Name=tg_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return target_group

    def _create_alb(self) -> aws.lb.LoadBalancer:
        """
        Create Application Load Balancer.

        Returns:
            Load Balancer resource
        """
        alb_name = self.config.get_resource_name('alb')

        alb = aws.lb.LoadBalancer(
            alb_name,
            name=alb_name,
            load_balancer_type='application',
            internal=False,
            security_groups=[self.security_group_id],
            subnets=self.public_subnet_ids,
            enable_deletion_protection=self.config.enable_deletion_protection,
            enable_cross_zone_load_balancing=self.config.enable_cross_zone_load_balancing,
            idle_timeout=self.config.alb_idle_timeout,
            tags=self.config.get_tags_for_resource('LoadBalancer', Name=alb_name),
            opts=ResourceOptions(
                parent=self.parent,
                custom_timeouts=CustomTimeouts(create="10m")  # Standard ALB creation timeout
            )
        )

        return alb

    def _create_listener(self) -> aws.lb.Listener:
        """
        Create HTTP Listener for ALB.

        Returns:
            Listener resource
        """
        listener_name = self.config.get_resource_name('listener-http')

        listener = aws.lb.Listener(
            listener_name,
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol='HTTP',
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type='forward',
                    target_group_arn=self.target_group.arn
                )
            ],
            tags=self.config.get_tags_for_resource('Listener', Name=listener_name),
            opts=ResourceOptions(parent=self.alb)
        )

        return listener

    def get_target_group_arn(self) -> Output[str]:
        """Get Target Group ARN."""
        return self.target_group.arn

    def get_alb_arn(self) -> Output[str]:
        """Get ALB ARN."""
        return self.alb.arn

    def get_alb_dns_name(self) -> Output[str]:
        """Get ALB DNS name."""
        return self.alb.dns_name

    def get_alb_zone_id(self) -> Output[str]:
        """Get ALB zone ID."""
        return self.alb.zone_id


```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring infrastructure module.

This module creates CloudWatch log groups, metrics, and alarms
for comprehensive infrastructure monitoring.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class MonitoringStack:
    """
    Creates and manages CloudWatch log groups, metrics, and alarms.
    """

    def __init__(
        self,
        config: InfraConfig,
        alb_arn: Output[str] = None,
        asg_name: Output[str] = None,
        sns_topic_arn: Output[str] = None,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: Infrastructure configuration
            alb_arn: ALB ARN for monitoring (optional)
            asg_name: Auto Scaling Group name
            sns_topic_arn: SNS topic ARN for alarm notifications
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.alb_arn = alb_arn
        self.asg_name = asg_name
        self.sns_topic_arn = sns_topic_arn
        self.parent = parent

        # Create log groups
        self.app_log_group = self._create_app_log_group()

        # Create CloudWatch alarms
        self.cpu_alarm = self._create_cpu_alarm()
        if self.alb_arn is not None:
            self.unhealthy_host_alarm = self._create_unhealthy_host_alarm()
            self.alb_5xx_alarm = self._create_alb_5xx_alarm()
        else:
            self.unhealthy_host_alarm = None
            self.alb_5xx_alarm = None

    def _create_app_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for application logs.

        Returns:
            Log Group resource
        """
        log_group_name = self.config.get_resource_name('log-group-app')

        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return log_group

    def _create_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.

        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-high')

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=80.0,
            alarm_description='Triggers when CPU utilization exceeds 80%',
            alarm_actions=[self.sns_topic_arn],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return alarm

    def _create_unhealthy_host_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for unhealthy hosts.

        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-unhealthy-hosts')

        alb_full_name = self.alb_arn.apply(
            lambda arn: '/'.join(arn.split(':')[-1].split('/')[1:])
        )

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=0.0,
            alarm_description='Triggers when there are unhealthy hosts',
            alarm_actions=[self.sns_topic_arn],
            dimensions=alb_full_name.apply(lambda name: {
                'LoadBalancer': name
            }),
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return alarm

    def _create_alb_5xx_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for ALB 5xx errors.

        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-alb-5xx')

        # Extract ALB name from ARN for dimensions
        alb_full_name = self.alb_arn.apply(
            lambda arn: '/'.join(arn.split(':')[-1].split('/')[1:])
        )

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=self.config.alarm_period,
            statistic='Sum',
            threshold=10.0,
            alarm_description='Triggers when ALB 5xx errors exceed 10 in 5 minutes',
            alarm_actions=[self.sns_topic_arn],
            dimensions=alb_full_name.apply(lambda name: {
                'LoadBalancer': name
            }),
            treat_missing_data='notBreaching',
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return alarm

    def get_app_log_group_name(self) -> Output[str]:
        """Get application log group name."""
        return self.app_log_group.name

    def get_app_log_group_arn(self) -> Output[str]:
        """Get application log group ARN."""
        return self.app_log_group.arn


```

## File: lib\infrastructure\networking.py

```python
"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, NAT gateways,
route tables, and network ACLs for a highly-available multi-AZ setup.
"""
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NetworkingStack:
    """
    Creates and manages networking infrastructure including VPC, subnets,
    gateways, and routing for high availability across multiple AZs.
    """

    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the networking stack.

        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent

        # Dynamically fetch available AZs for the configured region
        self.available_azs = self._get_available_azs()

        # Update config with actual AZs
        self.config.set_availability_zones(self.available_azs)

        # Create VPC
        self.vpc = self._create_vpc()

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

        # Create VPC Flow Logs
        self.flow_log_group = self._create_flow_log_group()
        self.flow_log_role = self._create_flow_log_role()
        self.flow_log = self._create_flow_log()

    def _get_available_azs(self) -> List[str]:
        """
        Dynamically fetch available AZs for the configured region.

        This ensures that subnets are only created in AZs that actually exist
        in the target region, making the code truly region-agnostic.

        Returns:
            List of available AZ names (e.g., ['us-west-1a', 'us-west-1b'])
        """
        # Query AWS for available AZs in the current region
        # Note: The region is automatically inherited from the AWS provider configuration
        azs_data = aws.get_availability_zones(state='available')

        # Return the AZ names (e.g., ['us-west-1a', 'us-west-1b'])
        # Use at least 2 AZs for HA, and up to 3 for optimal redundancy
        available_az_names = azs_data.names

        # Ensure we have at least 2 AZs for HA
        if len(available_az_names) < 2:
            raise Exception(f"Region {self.config.primary_region} has fewer than 2 AZs. Cannot create HA infrastructure.")

        # Use up to 3 AZs for optimal cost/redundancy balance
        return available_az_names[:min(3, len(available_az_names))]

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
            tags=self.config.get_tags_for_resource('VPC', Name=vpc_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return vpc

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for public subnet internet access.

        Returns:
            Internet Gateway resource
        """
        igw_name = self.config.get_resource_name('igw')

        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('InternetGateway', Name=igw_name),
            opts=ResourceOptions(parent=self.vpc)
        )

        return igw

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets across multiple AZs.
        Dynamically uses the AZs available in the configured region.

        Returns:
            List of public subnet resources
        """
        subnets = []

        # Get CIDRs based on actual AZ count
        cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'public')

        for i, (az_name, cidr) in enumerate(zip(self.available_azs, cidrs)):
            # Extract AZ suffix (last character, e.g., 'a' from 'us-west-1a')
            az_suffix = az_name[-1]
            subnet_name = self.config.get_resource_name('subnet-public', az_suffix)

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,  # Use full AZ name from AWS
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Public',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )

            subnets.append(subnet)

        return subnets

    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create private subnets across multiple AZs.
        Dynamically uses the AZs available in the configured region.

        Returns:
            List of private subnet resources
        """
        subnets = []

        # Get CIDRs based on actual AZ count
        cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'private')

        for i, (az_name, cidr) in enumerate(zip(self.available_azs, cidrs)):
            # Extract AZ suffix (last character, e.g., 'a' from 'us-west-1a')
            az_suffix = az_name[-1]
            subnet_name = self.config.get_resource_name('subnet-private', az_suffix)

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,  # Use full AZ name from AWS
                map_public_ip_on_launch=False,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Private',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )

            subnets.append(subnet)

        return subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).
        Dynamically creates one NAT gateway per available AZ.

        Returns:
            List of NAT Gateway resources
        """
        nat_gateways = []

        for i, (public_subnet, az_name) in enumerate(zip(
            self.public_subnets,
            self.available_azs
        )):
            # Extract AZ suffix for naming
            az_suffix = az_name[-1]

            # Create Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name('eip-nat', az_suffix)
            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags=self.config.get_tags_for_resource('EIP', Name=eip_name),
                opts=ResourceOptions(parent=public_subnet)
            )

            # Create NAT Gateway
            nat_name = self.config.get_resource_name('nat', az_suffix)
            nat_gateway = aws.ec2.NatGateway(
                nat_name,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=self.config.get_tags_for_resource('NatGateway', Name=nat_name),
                opts=ResourceOptions(parent=public_subnet, depends_on=[eip])
            )

            nat_gateways.append(nat_gateway)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets with route to Internet Gateway.

        Returns:
            Route table resource
        """
        rt_name = self.config.get_resource_name('rt-public')

        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('RouteTable', Name=rt_name, Type='Public'),
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to Internet Gateway
        aws.ec2.Route(
            f"{rt_name}-igw-route",
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(parent=route_table)
        )

        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{rt_name}-association-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

        return route_table

    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create route tables for private subnets with routes to NAT Gateways.
        Each private subnet gets its own route table pointing to its AZ's NAT Gateway.
        Dynamically adapts to the number of available AZs.

        Returns:
            List of route table resources
        """
        route_tables = []

        for i, (subnet, nat_gateway, az_name) in enumerate(zip(
            self.private_subnets,
            self.nat_gateways,
            self.available_azs
        )):
            # Extract AZ suffix for naming
            az_suffix = az_name[-1]
            rt_name = self.config.get_resource_name('rt-private', az_suffix)

            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags=self.config.get_tags_for_resource(
                    'RouteTable',
                    Name=rt_name,
                    Type='Private',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"{rt_name}-nat-route",
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=route_table)
            )

            # Associate with private subnet
            aws.ec2.RouteTableAssociation(
                f"{rt_name}-association",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

            route_tables.append(route_table)

        return route_tables

    def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for public subnets.

        Returns:
            Network ACL resource
        """
        nacl_name = self.config.get_resource_name('nacl-public')

        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('NetworkAcl', Name=nacl_name, Type='Public'),
            opts=ResourceOptions(parent=self.vpc)
        )

        # Inbound rules
        # Allow HTTP
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-http",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=80,
            to_port=80,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )

        # Allow HTTPS
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-https",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=443,
            to_port=443,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )

        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=120,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )

        # Outbound rules
        # Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress-all",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(parent=nacl)
        )

        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.NetworkAclAssociation(
                f"{nacl_name}-association-{i}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=nacl)
            )

        return nacl

    def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for private subnets.

        Returns:
            Network ACL resource
        """
        nacl_name = self.config.get_resource_name('nacl-private')

        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('NetworkAcl', Name=nacl_name, Type='Private'),
            opts=ResourceOptions(parent=self.vpc)
        )

        # Inbound rules
        # Allow traffic from VPC CIDR
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-vpc",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block=self.config.vpc_cidr,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )

        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )

        # Outbound rules
        # Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress-all",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(parent=nacl)
        )

        # Associate with private subnets
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.NetworkAclAssociation(
                f"{nacl_name}-association-{i}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=nacl)
            )

        return nacl

    def _create_flow_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for VPC Flow Logs.

        Returns:
            Log Group resource
        """
        log_group_name = self.config.get_resource_name('log-group-vpc-flow')

        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return log_group

    def _create_flow_log_role(self) -> aws.iam.Role:
        """
        Create IAM role for VPC Flow Logs.

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-vpc-flow-logs')

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
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Attach policy for CloudWatch Logs
        policy_name = self.config.get_resource_name('policy-vpc-flow-logs')

        policy_document = self.flow_log_group.arn.apply(lambda arn: {
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
                "Resource": arn
            }]
        })

        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document.apply(lambda doc: pulumi.Output.json_dumps(doc)),
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_flow_log(self) -> aws.ec2.FlowLog:
        """
        Create VPC Flow Log.

        Returns:
            Flow Log resource
        """
        if not self.config.enable_flow_logs:
            return None

        flow_log_name = self.config.get_resource_name('flow-log-vpc')

        flow_log = aws.ec2.FlowLog(
            flow_log_name,
            vpc_id=self.vpc.id,
            traffic_type='ALL',
            iam_role_arn=self.flow_log_role.arn,
            log_destination_type='cloud-watch-logs',
            log_destination=self.flow_log_group.arn,
            tags=self.config.get_tags_for_resource('FlowLog', Name=flow_log_name),
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.flow_log_role])
        )

        return flow_log

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_public_subnet_ids(self) -> Output[List[str]]:
        """Get list of public subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.public_subnets])

    def get_private_subnet_ids(self) -> Output[List[str]]:
        """Get list of private subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.private_subnets])


```

## File: lib\infrastructure\notifications.py

```python
"""
Notifications infrastructure module.

This module creates SNS topics and subscriptions for alarm notifications.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NotificationsStack:
    """
    Creates and manages SNS topics and subscriptions for notifications.
    """

    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the notifications stack.

        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent

        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()

        # Create email subscription if email is configured
        if self.config.alarm_email:
            self.email_subscription = self._create_email_subscription()

    def _create_alarm_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.

        Returns:
            SNS Topic resource
        """
        topic_name = self.config.get_resource_name('topic-alarms')

        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            display_name='Infrastructure Alarms',
            tags=self.config.get_tags_for_resource('SNSTopic', Name=topic_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return topic

    def _create_email_subscription(self) -> aws.sns.TopicSubscription:
        """
        Create email subscription to alarm topic.

        Returns:
            Topic Subscription resource
        """
        subscription_name = self.config.get_resource_name('subscription-email')

        subscription = aws.sns.TopicSubscription(
            subscription_name,
            topic=self.alarm_topic.arn,
            protocol='email',
            endpoint=self.config.alarm_email,
            opts=ResourceOptions(parent=self.alarm_topic)
        )

        return subscription

    def get_alarm_topic_arn(self) -> Output[str]:
        """Get alarm topic ARN."""
        return self.alarm_topic.arn


```

## File: lib\infrastructure\secrets.py

```python
"""
Secrets management infrastructure module.

This module creates AWS Secrets Manager secrets and SSM parameters
for secure configuration management.
"""
import json

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecretsStack:
    """
    Creates and manages AWS Secrets Manager secrets and SSM parameters.
    """

    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the secrets stack.

        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent

        # Create SSM parameters
        self.app_config_parameter = self._create_app_config_parameter()
        self.environment_parameter = self._create_environment_parameter()

        # Create Secrets Manager secrets if enabled
        if self.config.use_secrets_manager:
            self.app_secret = self._create_app_secret()

    def _create_app_config_parameter(self) -> aws.ssm.Parameter:
        """
        Create SSM parameter for application configuration.

        Returns:
            SSM Parameter resource
        """
        param_name = f"/{self.config.project_name}/{self.config.environment_suffix}/app-config"
        resource_name = self.config.get_resource_name('param-app-config')

        app_config = {
            'environment': self.config.environment,
            'environment_suffix': self.config.environment_suffix,
            'region': self.config.primary_region,
            'log_level': 'INFO'
        }

        parameter = aws.ssm.Parameter(
            resource_name,
            name=param_name,
            type='String',
            value=json.dumps(app_config),
            description='Application configuration parameters',
            tags=self.config.get_tags_for_resource('SSMParameter', Name=param_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return parameter

    def _create_environment_parameter(self) -> aws.ssm.Parameter:
        """
        Create SSM parameter for environment information.

        Returns:
            SSM Parameter resource
        """
        param_name = f"/{self.config.project_name}/{self.config.environment_suffix}/environment"
        resource_name = self.config.get_resource_name('param-environment')

        parameter = aws.ssm.Parameter(
            resource_name,
            name=param_name,
            type='String',
            value=self.config.environment_suffix,
            description='Environment suffix for this deployment',
            tags=self.config.get_tags_for_resource('SSMParameter', Name=param_name),
            opts=ResourceOptions(parent=self.parent)
        )

        return parameter

    def _create_app_secret(self) -> aws.secretsmanager.Secret:
        """
        Create Secrets Manager secret for sensitive application data.
        Includes region in name for uniqueness.

        Returns:
            Secret resource
        """
        secret_name = self.config.get_resource_name('secret-app', include_region=True)

        secret = aws.secretsmanager.Secret(
            secret_name,
            name=secret_name,
            description='Application secrets',
            recovery_window_in_days=0,  # Force immediate deletion (for dev purposes)
            tags=self.config.get_tags_for_resource('Secret', Name=secret_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Create a secret version with placeholder data
        secret_data = {
            'api_key': 'placeholder-will-be-rotated',
            'db_password': 'placeholder-will-be-rotated'
        }

        aws.secretsmanager.SecretVersion(
            f"{secret_name}-version",
            secret_id=secret.id,
            secret_string=json.dumps(secret_data),
            opts=ResourceOptions(parent=secret)
        )

        return secret

    def get_app_config_parameter_name(self) -> Output[str]:
        """Get application config parameter name."""
        return self.app_config_parameter.name

    def get_app_config_parameter_arn(self) -> Output[str]:
        """Get application config parameter ARN."""
        return self.app_config_parameter.arn

    def get_app_secret_arn(self) -> Output[str]:
        """Get application secret ARN."""
        if hasattr(self, 'app_secret'):
            return self.app_secret.arn
        return Output.from_input('')


```

## File: lib\infrastructure\storage.py

```python
"""
Storage infrastructure module.

This module creates S3 buckets with lifecycle policies for backup and recovery.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class StorageStack:
    """
    Creates and manages S3 buckets with lifecycle policies for backup and recovery.
    """

    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the storage stack.

        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent

        # Create backup bucket
        self.backup_bucket = self._create_backup_bucket()

    def _create_backup_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket for backups with lifecycle policies.
        Includes region in name for global uniqueness.

        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_resource_name('backup-bucket', include_region=True)

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Name=bucket_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            f"{bucket_name}-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=bucket)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{bucket_name}-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=bucket)
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{bucket_name}-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=bucket)
        )

        # Add lifecycle configuration
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
                    id='expire-old-backups',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_expiration_days
                    )
                )
            ],
            opts=ResourceOptions(parent=bucket)
        )

        return bucket

    def get_backup_bucket_name(self) -> Output[str]:
        """Get backup bucket name."""
        return self.backup_bucket.id

    def get_backup_bucket_arn(self) -> Output[str]:
        """Get backup bucket ARN."""
        return self.backup_bucket.arn


```

## File: lib\infrastructure\iam.py

```python
"""
IAM infrastructure module.

This module creates IAM roles and policies with least-privilege access
for EC2 instances and other AWS services.
"""
import json

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class IAMStack:
    """
    Creates and manages IAM roles and policies with least-privilege access.
    """

    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the IAM stack.

        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent

        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.ec2_instance_profile = self._create_instance_profile()

    def _create_ec2_role(self) -> aws.iam.Role:
        """
        Create IAM role for EC2 instances with least-privilege policies.

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-ec2')

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
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Attach AWS managed policy for CloudWatch Agent (includes Logs)
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('ec2-cloudwatch-agent-attachment'),
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
            opts=ResourceOptions(parent=role)
        )

        # Attach AWS managed policy for SSM (includes Session Manager)
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('ec2-ssm-managed-attachment'),
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            opts=ResourceOptions(parent=role)
        )

        # Attach CloudWatch metrics policy (custom for namespace restriction)
        self._attach_cloudwatch_policy(role)

        # Attach SSM policy for parameter store access (custom for scoped access)
        self._attach_ssm_policy(role)

        return role

    def _attach_cloudwatch_policy(self, role: aws.iam.Role):
        """
        Attach CloudWatch metrics policy to role.

        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('policy-cloudwatch')

        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:ListMetrics"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "cloudwatch:namespace": f"{self.config.project_name}/application"
                    }
                }
            }]
        }

        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=json.dumps(policy_document),
            opts=ResourceOptions(parent=role)
        )

    def _attach_ssm_policy(self, role: aws.iam.Role):
        """
        Attach SSM policy to role for parameter store access.

        Args:
            role: IAM role to attach policy to
        """
        policy_name = self.config.get_resource_name('policy-ssm')

        # Build ARN for SSM parameters scoped to this project
        ssm_parameter_arn = Output.concat(
            'arn:aws:ssm:',
            self.config.primary_region,
            ':',
            aws.get_caller_identity().account_id,
            ':parameter/',
            self.config.project_name,
            '/',
            self.config.environment_suffix,
            '/*'
        )

        policy_document = ssm_parameter_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                "Resource": arn
            }]
        }))

        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )

    def attach_s3_read_policy(self, role: aws.iam.Role, bucket_arn: Output[str]):
        """
        Attach S3 read and write policy to role for a specific bucket.

        Args:
            role: IAM role to attach policy to
            bucket_arn: ARN of the S3 bucket
        """
        policy_name = self.config.get_resource_name('policy-s3-readwrite')

        policy_document = bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    arn,
                    f"{arn}/*"
                ]
            }]
        }))

        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )

    def attach_secrets_manager_policy(self, role: aws.iam.Role, secret_arn: Output[str]):
        """
        Attach Secrets Manager policy to role for a specific secret.

        Args:
            role: IAM role to attach policy to
            secret_arn: ARN of the secret
        """
        policy_name = self.config.get_resource_name('policy-secrets')

        policy_document = secret_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": arn
            }]
        }))

        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role)
        )

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """
        Create instance profile for EC2 instances.

        Returns:
            Instance Profile resource
        """
        profile_name = self.config.get_resource_name('instance-profile')

        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags=self.config.get_tags_for_resource('InstanceProfile', Name=profile_name),
            opts=ResourceOptions(parent=self.ec2_role)
        )

        return instance_profile

    def get_instance_profile_name(self) -> Output[str]:
        """Get instance profile name."""
        return self.ec2_instance_profile.name

    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn


```

## File: lib\infrastructure\security.py

```python
"""
Security infrastructure module.

This module creates security groups with least-privilege access rules
for ALB and application instances.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecurityStack:
    """
    Creates and manages security groups for ALB and application instances.
    """

    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the security stack.

        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.parent = parent

        # Create security groups
        self.alb_security_group = self._create_alb_security_group()
        self.app_security_group = self._create_app_security_group()

    def _create_alb_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for Application Load Balancer.
        Allows HTTP and HTTPS from internet.

        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-alb')

        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for Application Load Balancer',
            vpc_id=self.vpc_id,
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Ingress rule - HTTP
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-http",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=80,
            to_port=80,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow HTTP from internet',
            opts=ResourceOptions(parent=security_group)
        )

        # Ingress rule - HTTPS
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-https",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=443,
            to_port=443,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow HTTPS from internet',
            opts=ResourceOptions(parent=security_group)
        )

        # Egress rule - Allow all outbound
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            security_group_id=security_group.id,
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow all outbound traffic',
            opts=ResourceOptions(parent=security_group)
        )

        return security_group

    def _create_app_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for application instances.
        Only allows traffic from ALB security group.

        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-app')

        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for application instances',
            vpc_id=self.vpc_id,
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(parent=self.parent)
        )

        # Ingress rule - HTTP from ALB only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-alb",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=80,
            to_port=80,
            source_security_group_id=self.alb_security_group.id,
            description='Allow HTTP from ALB only',
            opts=ResourceOptions(parent=security_group)
        )

        # Egress rule - Allow all outbound
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            security_group_id=security_group.id,
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow all outbound traffic',
            opts=ResourceOptions(parent=security_group)
        )

        return security_group

    def get_alb_security_group_id(self) -> Output[str]:
        """Get ALB security group ID."""
        return self.alb_security_group.id

    def get_app_security_group_id(self) -> Output[str]:
        """Get application security group ID."""
        return self.app_security_group.id


```
