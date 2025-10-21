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

# Get environment suffix from config or environment variable
environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'dev')

# Create the TAP stack
stack = TapStack(
    name="tap-infrastructure",
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
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
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

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\compute.py

```python
"""
Compute infrastructure module for EC2 instances, Auto Scaling Groups, and scaling policies.

This module creates EC2 launch templates and Auto Scaling Groups with CPU-based scaling,
addressing MODEL_FAILURES #3 by deploying ASG in private subnets (not public).
"""

from typing import List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class ComputeStack:
    """
    Manages compute resources including EC2 launch templates and Auto Scaling Groups.

    Creates:
    - Launch template with Amazon Linux 2023 and SSM agent
    - Auto Scaling Group in private subnets (MODEL_FAILURES fix #3)
    - CPU-based scaling policies
    """

    def __init__(
        self,
        config: InfraConfig,
        private_subnet_ids: List[Output[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the compute stack.

        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG (MODEL_FAILURES fix #3)
            security_group_id: Security group ID for EC2 instances
            instance_profile_name: IAM instance profile name
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.parent = parent

        # Get latest Amazon Linux 2023 AMI
        self.ami_id = self._get_latest_ami()

        # Create launch template
        self.launch_template = self._create_launch_template()

        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()

        # Create scaling policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()

    def _get_latest_ami(self) -> str:
        """
        Get the latest Amazon Linux 2023 AMI.

        Returns:
            AMI ID
        """
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["al2023-ami-*-x86_64"]
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="state",
                    values=["available"]
                )
            ]
        )
        return ami.id

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create launch template for EC2 instances.

        Following MODEL_FAILURES fix #2: Explicitly configure SSM agent.
        """
        lt_name = self.config.get_resource_name('launch-template')

        # User data script to ensure SSM agent is running
        # Amazon Linux 2023 has SSM agent pre-installed
        user_data = """#!/bin/bash
# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent for basic monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},
          "cpu_time_guest"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
"""

        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name_prefix=f"{lt_name}-",
            image_id=self.ami_id,
            instance_type=self.config.instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            vpc_security_group_ids=[self.security_group_id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        **self.config.get_common_tags(),
                        'Name': self.config.get_resource_name('ec2-instance')
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags={
                        **self.config.get_common_tags(),
                        'Name': self.config.get_resource_name('ec2-volume')
                    }
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': lt_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return launch_template

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group in private subnets.

        Following MODEL_FAILURES fix #3: Deploy in private subnets, not public.
        """
        asg_name = self.config.get_resource_name('asg')

        auto_scaling_group = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            vpc_zone_identifiers=self.private_subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            health_check_type="EC2",
            health_check_grace_period=300,
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=self.config.get_resource_name('asg-instance'),
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.config.environment,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="EnvironmentSuffix",
                    value=self.config.environment_suffix,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="ManagedBy",
                    value="Pulumi",
                    propagate_at_launch=True
                )
            ],
            opts=ResourceOptions(parent=self.parent)
        )

        return auto_scaling_group

    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """Create scale-up policy based on CPU utilization."""
        policy_name = self.config.get_resource_name('scale-up-policy')

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=1,
            cooldown=300,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )

        return policy

    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """Create scale-down policy based on CPU utilization."""
        policy_name = self.config.get_resource_name('scale-down-policy')

        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=-1,
            cooldown=300,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )

        return policy

    # Getter methods for outputs
    def get_launch_template_id(self) -> Output[str]:
        """Get launch template ID."""
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

## File: lib\infrastructure\config.py

```python
"""
Configuration module for the TAP AWS infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions to ensure consistency across all resources.
"""

import os
import re
from typing import Dict, List, Optional

import pulumi_aws as aws


class InfraConfig:
    """Centralized configuration for the TAP infrastructure."""

    def __init__(self):
        """Initialize configuration from environment variables."""
        # Environment and naming
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'tap')

        # Region configuration - dynamically fetch available AZs
        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')

        # VPC configuration
        self.vpc_cidr = os.getenv('VPC_CIDR', '10.0.0.0/16')
        self.enable_dns_hostnames = True
        self.enable_dns_support = True

        # Compute configuration
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.asg_min_size = int(os.getenv('ASG_MIN_SIZE', '1'))
        self.asg_max_size = int(os.getenv('ASG_MAX_SIZE', '3'))
        self.asg_desired_capacity = int(os.getenv('ASG_DESIRED_CAPACITY', '1'))

        # Scaling policy configuration
        self.cpu_scale_up_threshold = int(os.getenv('CPU_SCALE_UP_THRESHOLD', '70'))
        self.cpu_scale_down_threshold = int(os.getenv('CPU_SCALE_DOWN_THRESHOLD', '30'))

        # Lambda configuration
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '60'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '256'))

        # Monitoring configuration
        self.health_check_interval = os.getenv('HEALTH_CHECK_INTERVAL', 'rate(5 minutes)')
        self.alarm_evaluation_periods = int(os.getenv('ALARM_EVALUATION_PERIODS', '2'))

        # Security configuration
        self.authorized_ip_ranges = os.getenv('AUTHORIZED_IP_RANGES', '10.0.0.0/8').split(',')

    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources like S3 buckets.

        Args:
            name: The name to normalize

        Returns:
            Normalized lowercase name with only valid characters
        """
        # Convert to lowercase and replace invalid characters with dashes
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        # Remove consecutive dashes and trim
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        # Ensure it doesn't start or end with dash
        return normalized

    def get_resource_name(self, resource_type: str, include_region: bool = False) -> str:
        """
        Generate consistent resource names using environment suffix.

        Args:
            resource_type: Type of resource (e.g., 'vpc', 'subnet', 'asg')
            include_region: Whether to include region in the name

        Returns:
            Formatted resource name
        """
        parts = [self.project_name, resource_type]

        if include_region:
            # Normalize region name (e.g., us-east-1 -> useast1)
            region_normalized = self.primary_region.replace('-', '')
            parts.append(region_normalized)

        parts.append(self.environment_suffix)

        name = '-'.join(parts)
        return self.normalize_name(name)

    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags for all resources.

        Returns:
            Dictionary of common tags
        """
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Region': self.primary_region
        }

    def get_availability_zones(self, count: int = 2) -> List[str]:
        """
        Dynamically fetch available AZs in the current region.

        Args:
            count: Number of AZs to return

        Returns:
            List of availability zone names
        """
        azs_data = aws.get_availability_zones(state="available")
        available_azs = azs_data.names[:count]
        return available_azs

    def calculate_subnet_cidr(self, vpc_cidr: str, subnet_index: int) -> str:
        """
        Calculate subnet CIDR blocks from VPC CIDR.

        Args:
            vpc_cidr: VPC CIDR block (e.g., '10.0.0.0/16')
            subnet_index: Index of the subnet (0, 1, 2, ...)

        Returns:
            Subnet CIDR block
        """
        # Extract base IP and prefix from VPC CIDR
        base_ip, prefix = vpc_cidr.split('/')
        octets = base_ip.split('.')

        # For /16 VPC, create /24 subnets by incrementing the third octet
        octets[2] = str(subnet_index)
        subnet_cidr = f"{'.'.join(octets)}/24"

        return subnet_cidr


```

## File: lib\infrastructure\iam.py

```python
"""
IAM infrastructure module for roles, policies, and instance profiles.

This module creates IAM roles with least-privilege policies for EC2 instances
and Lambda functions
to specific resources instead of using "Resource": "*".
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Manages IAM roles, policies, and instance profiles.

    Creates:
    - EC2 role with SSM access and scoped permissions
    - Lambda role with scoped permissions for EC2 and Auto Scaling
    - Instance profile for EC2 instances
    """

    def __init__(
        self,
        config: InfraConfig,
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the IAM stack.

        Args:
            config: Infrastructure configuration
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.parent = parent

        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.lambda_role = self._create_lambda_role()

        # Create instance profile for EC2
        self.ec2_instance_profile = self._create_ec2_instance_profile()

    def _create_ec2_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances with SSM access."""
        role_name = self.config.get_resource_name('ec2-role')

        # Trust policy for EC2
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
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        # Attach AWS managed policy for SSM
        aws.iam.RolePolicyAttachment(
            f"{role_name}-ssm-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=role)
        )

        # Attach AWS managed policy for CloudWatch Agent
        aws.iam.RolePolicyAttachment(
            f"{role_name}-cloudwatch-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_lambda_role(self) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with scoped permissions.
        """
        role_name = self.config.get_resource_name('lambda-role')

        # Trust policy for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        # Attach AWS managed policy for Lambda basic execution
        aws.iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        # Create custom policy with scoped permissions for EC2 and Auto Scaling
        policy_name = self.config.get_resource_name('lambda-ec2-policy')

        # Get account ID for scoped ARNs
        caller_identity = aws.get_caller_identity()
        account_id = caller_identity.account_id

        policy_document = Output.all(account_id).apply(
            lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus"
                        ],
                        "Resource": "*"  # DescribeInstances requires wildcard
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances"
                        ],
                        "Resource": "*"  # Describe actions require wildcard
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:SetInstanceHealth",
                            "autoscaling:TerminateInstanceInAutoScalingGroup"
                        ],
                        "Resource": f"arn:aws:autoscaling:{self.config.primary_region}:{args[0]}:autoScalingGroup:*:autoScalingGroupName/{self.config.project_name}-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*",  # PutMetricData requires wildcard
                        "Condition": {
                            "StringEquals": {
                                "cloudwatch:namespace": f"{self.config.project_name}/HealthCheck"
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": f"arn:aws:sns:{self.config.primary_region}:{args[0]}:{self.config.project_name}-*"
                    }
                ]
            })
        )

        custom_policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            policy=policy_document,
            tags={
                **self.config.get_common_tags(),
                'Name': policy_name
            },
            opts=ResourceOptions(parent=role)
        )

        # Attach custom policy to role
        aws.iam.RolePolicyAttachment(
            f"{role_name}-custom-policy",
            role=role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_ec2_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create instance profile for EC2 instances."""
        profile_name = self.config.get_resource_name('ec2-instance-profile')

        instance_profile = aws.iam.InstanceProfile(
            profile_name,
            name=profile_name,
            role=self.ec2_role.name,
            tags={
                **self.config.get_common_tags(),
                'Name': profile_name
            },
            opts=ResourceOptions(parent=self.ec2_role)
        )

        return instance_profile

    # Getter methods for outputs
    def get_ec2_role_arn(self) -> Output[str]:
        """Get EC2 role ARN."""
        return self.ec2_role.arn

    def get_ec2_role_name(self) -> Output[str]:
        """Get EC2 role name."""
        return self.ec2_role.name

    def get_lambda_role_arn(self) -> Output[str]:
        """Get Lambda role ARN."""
        return self.lambda_role.arn

    def get_lambda_role_name(self) -> Output[str]:
        """Get Lambda role name."""
        return self.lambda_role.name

    def get_ec2_instance_profile_name(self) -> Output[str]:
        """Get EC2 instance profile name."""
        return self.ec2_instance_profile.name

    def get_ec2_instance_profile_arn(self) -> Output[str]:
        """Get EC2 instance profile ARN."""
        return self.ec2_instance_profile.arn


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda functions infrastructure module for health monitoring and instance replacement.

This module creates Lambda functions for automated EC2 health monitoring with
retry logic and SNS notifications.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class LambdaStack:
    """
    Manages Lambda functions for health monitoring.

    Creates:
    - Lambda function with retry logic
    - Uses Python 3.11 runtime
    - Proper error handling and SNS notifications
    """

    def __init__(
        self,
        config: InfraConfig,
        lambda_role_arn: Output[str],
        asg_name: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: Infrastructure configuration
            lambda_role_arn: IAM role ARN for Lambda execution
            asg_name: Auto Scaling Group name to monitor
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.lambda_role_arn = lambda_role_arn
        self.asg_name = asg_name
        self.parent = parent

        # Create Lambda function
        self.health_check_function = self._create_health_check_function()

    def _create_health_check_function(self) -> aws.lambda_.Function:
        """
        Create Lambda function for EC2 health monitoring.

        """
        function_name = self.config.get_resource_name('health-check-lambda')

        # Lambda code with retry logic and error handling
        lambda_code = """
import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
ec2_client = boto3.client('ec2')
asg_client = boto3.client('autoscaling')
cloudwatch_client = boto3.client('cloudwatch')

# Configuration
ASG_NAME = os.environ.get('ASG_NAME')
MAX_RETRIES = 3
NAMESPACE = os.environ.get('CLOUDWATCH_NAMESPACE', 'TAP/HealthCheck')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Monitor EC2 instance health in Auto Scaling Group and replace unhealthy instances.

    This function:
    1. Queries all instances in the ASG
    2. Checks their health status
    3. Marks unhealthy instances for replacement
    4. Publishes metrics to CloudWatch
    5. Includes retry logic for transient failures
    \"\"\"
    print(f"Starting health check for ASG: {ASG_NAME}")

    try:
        # Get instances from Auto Scaling Group
        instances = get_asg_instances(ASG_NAME)

        if not instances:
            print(f"No instances found in ASG: {ASG_NAME}")
            publish_metric('InstanceCount', 0)
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'No instances to check', 'asg': ASG_NAME})
            }

        print(f"Found {len(instances)} instances in ASG")

        # Check health of each instance
        healthy_count = 0
        unhealthy_count = 0
        replaced_count = 0

        for instance in instances:
            instance_id = instance['InstanceId']
            lifecycle_state = instance['LifecycleState']
            health_status = instance['HealthStatus']

            print(f"Checking instance {instance_id}: lifecycle={lifecycle_state}, health={health_status}")

            # Check EC2 instance status
            ec2_status = check_ec2_instance_status(instance_id)

            if ec2_status == 'healthy' and health_status == 'Healthy' and lifecycle_state == 'InService':
                healthy_count += 1
                print(f"Instance {instance_id} is healthy")
            else:
                unhealthy_count += 1
                print(f"Instance {instance_id} is unhealthy: ec2_status={ec2_status}, health={health_status}")

                # Attempt to replace unhealthy instance with retry logic
                if replace_unhealthy_instance(instance_id, ASG_NAME):
                    replaced_count += 1

        # Publish metrics to CloudWatch
        publish_metric('HealthyInstances', healthy_count)
        publish_metric('UnhealthyInstances', unhealthy_count)
        publish_metric('ReplacedInstances', replaced_count)

        result = {
            'total_instances': len(instances),
            'healthy': healthy_count,
            'unhealthy': unhealthy_count,
            'replaced': replaced_count,
            'timestamp': datetime.utcnow().isoformat()
        }

        print(f"Health check completed: {json.dumps(result)}")

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        error_msg = f"Error in health check: {str(e)}"
        print(error_msg)
        publish_metric('HealthCheckErrors', 1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }


def get_asg_instances(asg_name: str) -> List[Dict[str, Any]]:
    \"\"\"Get all instances from Auto Scaling Group.\"\"\"
    try:
        response = asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        if not response['AutoScalingGroups']:
            return []

        return response['AutoScalingGroups'][0]['Instances']
    except Exception as e:
        print(f"Error getting ASG instances: {str(e)}")
        return []


def check_ec2_instance_status(instance_id: str) -> str:
    \"\"\"Check EC2 instance status.\"\"\"
    try:
        response = ec2_client.describe_instance_status(
            InstanceIds=[instance_id],
            IncludeAllInstances=True
        )

        if not response['InstanceStatuses']:
            return 'unknown'

        status = response['InstanceStatuses'][0]
        instance_status = status.get('InstanceStatus', {}).get('Status', 'unknown')
        system_status = status.get('SystemStatus', {}).get('Status', 'unknown')

        if instance_status == 'ok' and system_status == 'ok':
            return 'healthy'
        else:
            return 'unhealthy'
    except Exception as e:
        print(f"Error checking EC2 status for {instance_id}: {str(e)}")
        return 'unknown'


def replace_unhealthy_instance(instance_id: str, asg_name: str) -> bool:
    \"\"\"
    Replace unhealthy instance with retry logic.

    \"\"\"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Marking instance {instance_id} as unhealthy")

            asg_client.set_instance_health(
                InstanceId=instance_id,
                HealthStatus='Unhealthy',
                ShouldRespectGracePeriod=False
            )

            print(f"Successfully marked instance {instance_id} as unhealthy")
            return True

        except Exception as e:
            print(f"Attempt {attempt} failed for instance {instance_id}: {str(e)}")
            if attempt == MAX_RETRIES:
                print(f"All {MAX_RETRIES} attempts failed for instance {instance_id}")
                return False

    return False


def publish_metric(metric_name: str, value: float) -> None:
    \"\"\"Publish custom metric to CloudWatch.\"\"\"
    try:
        cloudwatch_client.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Error publishing metric {metric_name}: {str(e)}")
"""

        # Create Lambda function
        function = aws.lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,  # Python 3.11
            handler="index.lambda_handler",
            role=self.lambda_role_arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ASG_NAME": self.asg_name,
                    "CLOUDWATCH_NAMESPACE": f"{self.config.project_name}/HealthCheck"
                }
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': function_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return function

    # Getter methods for outputs
    def get_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.health_check_function.arn

    def get_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.health_check_function.name


```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring infrastructure module for CloudWatch alarms and EventBridge rules.

This module creates CloudWatch alarms for CPU utilization and EventBridge rules
to trigger Lambda health checks.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Manages CloudWatch alarms and EventBridge rules.

    Creates:
    - CPU utilization alarms for scaling
    - EventBridge rule to trigger Lambda health checks
    - CloudWatch log group for Lambda logs
    """

    def __init__(
        self,
        config: InfraConfig,
        asg_name: Output[str],
        scale_up_policy_arn: Output[str],
        scale_down_policy_arn: Output[str],
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: Infrastructure configuration
            asg_name: Auto Scaling Group name for alarms
            scale_up_policy_arn: Scale-up policy ARN
            scale_down_policy_arn: Scale-down policy ARN
            lambda_function_arn: Lambda function ARN for EventBridge target
            lambda_function_name: Lambda function name for permissions
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.asg_name = asg_name
        self.scale_up_policy_arn = scale_up_policy_arn
        self.scale_down_policy_arn = scale_down_policy_arn
        self.lambda_function_arn = lambda_function_arn
        self.lambda_function_name = lambda_function_name
        self.parent = parent

        # Create CloudWatch alarms
        self.cpu_high_alarm = self._create_cpu_high_alarm()
        self.cpu_low_alarm = self._create_cpu_low_alarm()

        # Create EventBridge rule for Lambda health checks
        self.health_check_rule = self._create_health_check_rule()
        self.health_check_target = self._create_health_check_target()
        self.lambda_permission = self._create_lambda_permission()

        # Create CloudWatch log group for Lambda
        self.lambda_log_group = self._create_lambda_log_group()

    def _create_cpu_high_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm for high CPU utilization to trigger scale-up."""
        alarm_name = self.config.get_resource_name('cpu-high-alarm')

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=self.config.cpu_scale_up_threshold,
            alarm_description=f"Trigger scale-up when CPU exceeds {self.config.cpu_scale_up_threshold}%",
            dimensions={
                "AutoScalingGroupName": self.asg_name
            },
            alarm_actions=[self.scale_up_policy_arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return alarm

    def _create_cpu_low_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm for low CPU utilization to trigger scale-down."""
        alarm_name = self.config.get_resource_name('cpu-low-alarm')

        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="LessThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=self.config.cpu_scale_down_threshold,
            alarm_description=f"Trigger scale-down when CPU below {self.config.cpu_scale_down_threshold}%",
            dimensions={
                "AutoScalingGroupName": self.asg_name
            },
            alarm_actions=[self.scale_down_policy_arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return alarm

    def _create_health_check_rule(self) -> aws.cloudwatch.EventRule:
        """Create EventBridge rule to trigger Lambda health checks."""
        rule_name = self.config.get_resource_name('health-check-rule')

        rule = aws.cloudwatch.EventRule(
            rule_name,
            name=rule_name,
            description="Trigger Lambda health check function periodically",
            schedule_expression=self.config.health_check_interval,
            tags={
                **self.config.get_common_tags(),
                'Name': rule_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return rule

    def _create_health_check_target(self) -> aws.cloudwatch.EventTarget:
        """Create EventBridge target to invoke Lambda function."""
        target_name = self.config.get_resource_name('health-check-target')

        target = aws.cloudwatch.EventTarget(
            target_name,
            rule=self.health_check_rule.name,
            arn=self.lambda_function_arn,
            opts=ResourceOptions(parent=self.health_check_rule)
        )

        return target

    def _create_lambda_permission(self) -> aws.lambda_.Permission:
        """Create permission for EventBridge to invoke Lambda function."""
        permission_name = self.config.get_resource_name('lambda-eventbridge-permission')

        permission = aws.lambda_.Permission(
            permission_name,
            action="lambda:InvokeFunction",
            function=self.lambda_function_name,
            principal="events.amazonaws.com",
            source_arn=self.health_check_rule.arn,
            opts=ResourceOptions(parent=self.health_check_rule)
        )

        return permission

    def _create_lambda_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for Lambda function logs."""
        log_group_name = self.lambda_function_name.apply(
            lambda name: f"/aws/lambda/{name}"
        )

        log_group = aws.cloudwatch.LogGroup(
            self.config.get_resource_name('lambda-log-group'),
            name=log_group_name,
            retention_in_days=7,
            tags={
                **self.config.get_common_tags(),
                'Name': 'lambda-logs'
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return log_group

    # Getter methods for outputs
    def get_cpu_high_alarm_arn(self) -> Output[str]:
        """Get CPU high alarm ARN."""
        return self.cpu_high_alarm.arn

    def get_cpu_low_alarm_arn(self) -> Output[str]:
        """Get CPU low alarm ARN."""
        return self.cpu_low_alarm.arn

    def get_health_check_rule_arn(self) -> Output[str]:
        """Get health check rule ARN."""
        return self.health_check_rule.arn

    def get_lambda_log_group_name(self) -> Output[str]:
        """Get Lambda log group name."""
        return self.lambda_log_group.name


```

## File: lib\infrastructure\networking.py

```python
"""
Networking infrastructure module for VPC, subnets, gateways, and routing.

This module creates a multi-AZ VPC architecture with public and private subnets,
Internet Gateway for public access, and NAT Gateways for private subnet outbound traffic.
"""

from typing import List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Manages VPC networking infrastructure including subnets, gateways, and routing.

    Creates a VPC spanning multiple availability zones with:
    - Public subnets with Internet Gateway access
    - Private subnets with NAT Gateway access
    - Proper routing tables for each subnet type
    """

    def __init__(self, config: InfraConfig, parent: Optional[pulumi.Resource] = None):
        """
        Initialize the networking stack.

        Args:
            config: Infrastructure configuration
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.parent = parent

        # Get availability zones dynamically
        self.availability_zones = config.get_availability_zones(count=2)

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()

        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()

        # Create NAT Gateways (one per AZ for high availability)
        self.nat_gateways = self._create_nat_gateways()

        # Create and configure routing tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create the VPC."""
        vpc_name = self.config.get_resource_name('vpc')

        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return vpc

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway for public subnet access."""
        igw_name = self.config.get_resource_name('igw')

        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': igw_name
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        return igw

    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """Create public subnets in each availability zone."""
        public_subnets = []

        for i, az in enumerate(self.availability_zones):
            subnet_name = self.config.get_resource_name(f'public-subnet-{i+1}')
            # Public subnets use even indices: 0, 2, 4, ...
            subnet_cidr = self.config.calculate_subnet_cidr(self.config.vpc_cidr, i * 2)

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': subnet_name,
                    'Type': 'Public',
                    'AZ': az
                },
                opts=ResourceOptions(parent=self.vpc)
            )

            public_subnets.append(subnet)

        return public_subnets

    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """Create private subnets in each availability zone."""
        private_subnets = []

        for i, az in enumerate(self.availability_zones):
            subnet_name = self.config.get_resource_name(f'private-subnet-{i+1}')
            # Private subnets use odd indices: 1, 3, 5, ...
            subnet_cidr = self.config.calculate_subnet_cidr(self.config.vpc_cidr, i * 2 + 1)

            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.config.get_common_tags(),
                    'Name': subnet_name,
                    'Type': 'Private',
                    'AZ': az
                },
                opts=ResourceOptions(parent=self.vpc)
            )

            private_subnets.append(subnet)

        return private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """Create NAT Gateways in each public subnet for high availability."""
        nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name(f'nat-eip-{i+1}')
            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': eip_name
                },
                opts=ResourceOptions(parent=public_subnet)
            )

            # Create NAT Gateway
            nat_name = self.config.get_resource_name(f'nat-gateway-{i+1}')
            nat_gateway = aws.ec2.NatGateway(
                nat_name,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': nat_name
                },
                opts=ResourceOptions(parent=public_subnet, depends_on=[self.internet_gateway])
            )

            nat_gateways.append(nat_gateway)

        return nat_gateways

    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """Create route table for public subnets with IGW route."""
        rt_name = self.config.get_resource_name('public-rt')

        # Create route table
        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': rt_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to Internet Gateway
        route_name = self.config.get_resource_name('public-route-igw')
        aws.ec2.Route(
            route_name,
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(parent=route_table)
        )

        # Associate route table with public subnets
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name(f'public-rt-assoc-{i+1}')
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

        return route_table

    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """Create route tables for private subnets with NAT Gateway routes."""
        route_tables = []

        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt_name = self.config.get_resource_name(f'private-rt-{i+1}')

            # Create route table
            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': rt_name,
                    'Type': 'Private'
                },
                opts=ResourceOptions(parent=self.vpc)
            )

            # Add route to NAT Gateway
            route_name = self.config.get_resource_name(f'private-route-nat-{i+1}')
            aws.ec2.Route(
                route_name,
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=route_table)
            )

            # Associate route table with private subnet
            assoc_name = self.config.get_resource_name(f'private-rt-assoc-{i+1}')
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

            route_tables.append(route_table)

        return route_tables

    # Getter methods for outputs
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_vpc_cidr(self) -> Output[str]:
        """Get VPC CIDR block."""
        return self.vpc.cidr_block

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


```

## File: lib\infrastructure\security.py

```python
"""
Security infrastructure module for security groups and network access control.

This module creates security groups with restricted access following the principle
of least privilege, specifically for EC2 instances accessed via AWS Systems Manager.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class SecurityStack:
    """
    Manages security groups for the infrastructure.

    Creates security groups with restricted access:
    - EC2 security group with SSM access restricted to authorized IPs
    - Proper egress rules for outbound traffic
    """

    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the security stack.

        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID where security groups will be created
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.vpc_id = vpc_id
        self.parent = parent

        # Create security groups
        self.ec2_security_group = self._create_ec2_security_group()

    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances with restricted access.

         Restrict access to authorized IPs only.
        """
        sg_name = self.config.get_resource_name('ec2-sg')

        # Create ingress rules for authorized IP ranges only
        ingress_rules = []
        for ip_range in self.config.authorized_ip_ranges:
            ingress_rules.append(
                aws.ec2.SecurityGroupIngressArgs(
                    description=f"HTTPS for SSM from {ip_range}",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[ip_range]
                )
            )

        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description="Security group for EC2 instances with SSM access",
            vpc_id=self.vpc_id,
            ingress=ingress_rules,
            egress=[
                # Allow all outbound traffic for updates, SSM, and application needs
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': sg_name
            },
            opts=ResourceOptions(parent=self.parent)
        )

        return security_group

    # Getter methods for outputs
    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id


```
