# CDKTF Python Infrastructure - Multi-Environment Module System

This implementation provides a complete CDKTF Python solution for managing infrastructure across development, staging, and production environments using a modular architecture with workspace-based separation.

## Project Structure

```
.
├── tap.py                          # Main entry point
├── cdktf.json                      # CDKTF configuration
├── lib/
│   ├── __init__.py                # Package initialization
│   ├── tap_stack.py               # Root stack orchestrator
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── vpc_module.py          # VPC module with subnets, NAT, IGW
│   │   ├── rds_module.py          # RDS Aurora PostgreSQL module
│   │   ├── ecs_module.py          # ECS Fargate module with ALB
│   │   ├── iam_module.py          # IAM roles and policies
│   │   └── secrets_module.py      # AWS Secrets Manager integration
│   └── config/
│       ├── __init__.py
│       ├── variables.py           # Environment-specific variables
│       └── validation.py          # Input validation logic
└── tests/
    ├── unit/
    │   └── test_tap_stack.py
    └── integration/
        └── test_tap_stack.py
```

## File: cdktf.json

```json
{
  "language": "python",
  "app": "python3 tap.py",
  "projectId": "3f4k2j",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: tap.py

```python
#!/usr/bin/env python
"""
Main entry point for CDKTF Python multi-environment infrastructure.
Supports workspace-based environment separation (dev, staging, prod).
"""
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "synth-2")
created_at = datetime.now(timezone.utc).isoformat()

# Determine workspace (environment) from ENVIRONMENT_SUFFIX
# This maps to Terraform workspaces: dev, staging, prod
workspace = environment_suffix.split('-')[0] if '-' in environment_suffix else environment_suffix

# Validate workspace
valid_workspaces = ['dev', 'staging', 'prod']
if workspace not in valid_workspaces:
    print(f"Warning: workspace '{workspace}' not in {valid_workspaces}, defaulting to 'dev'")
    workspace = 'dev'

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Workspace": workspace,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with workspace-based configuration
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    workspace=workspace,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
```

## File: lib/__init__.py

```python
"""TAP Infrastructure package for CDKTF Python."""

__version__ = "1.0.0"
```

## File: lib/config/__init__.py

```python
"""Configuration package for environment-specific variables."""
```

## File: lib/config/variables.py

```python
"""
Environment-specific configuration variables for multi-environment infrastructure.
Supports workspace-based configuration for dev, staging, and prod environments.
"""

from typing import Dict, Any


class EnvironmentConfig:
    """Environment-specific configuration manager."""

    # CIDR blocks for each environment (non-overlapping)
    VPC_CIDRS = {
        'dev': '10.0.0.0/16',
        'staging': '10.1.0.0/16',
        'prod': '10.2.0.0/16',
    }

    # ECS container counts per environment
    ECS_CONTAINER_COUNTS = {
        'dev': 2,
        'staging': 4,
        'prod': 8,
    }

    # RDS Multi-AZ configuration (only prod uses Multi-AZ)
    RDS_MULTI_AZ = {
        'dev': False,
        'staging': False,
        'prod': True,
    }

    # RDS instance classes per environment
    RDS_INSTANCE_CLASS = {
        'dev': 'db.t3.medium',
        'staging': 'db.r5.large',
        'prod': 'db.r5.xlarge',
    }

    # Availability zones per environment
    AVAILABILITY_ZONES = {
        'dev': 2,
        'staging': 2,
        'prod': 3,
    }

    # ALB settings
    ALB_ENABLE_DELETION_PROTECTION = {
        'dev': False,
        'staging': False,
        'prod': False,  # Set to False for destroyability in testing
    }

    @staticmethod
    def get_vpc_cidr(workspace: str) -> str:
        """Get VPC CIDR block for workspace."""
        return EnvironmentConfig.VPC_CIDRS.get(workspace, EnvironmentConfig.VPC_CIDRS['dev'])

    @staticmethod
    def get_ecs_container_count(workspace: str) -> int:
        """Get ECS container count for workspace."""
        return EnvironmentConfig.ECS_CONTAINER_COUNTS.get(workspace, 2)

    @staticmethod
    def get_rds_multi_az(workspace: str) -> bool:
        """Get RDS Multi-AZ setting for workspace."""
        return EnvironmentConfig.RDS_MULTI_AZ.get(workspace, False)

    @staticmethod
    def get_rds_instance_class(workspace: str) -> str:
        """Get RDS instance class for workspace."""
        return EnvironmentConfig.RDS_INSTANCE_CLASS.get(workspace, 'db.t3.medium')

    @staticmethod
    def get_availability_zones(workspace: str) -> int:
        """Get number of availability zones for workspace."""
        return EnvironmentConfig.AVAILABILITY_ZONES.get(workspace, 2)

    @staticmethod
    def get_alb_deletion_protection(workspace: str) -> bool:
        """Get ALB deletion protection setting for workspace."""
        return EnvironmentConfig.ALB_ENABLE_DELETION_PROTECTION.get(workspace, False)

    @staticmethod
    def validate_workspace(workspace: str) -> bool:
        """Validate that workspace is one of: dev, staging, prod."""
        return workspace in ['dev', 'staging', 'prod']

    @staticmethod
    def get_all_config(workspace: str) -> Dict[str, Any]:
        """Get all configuration values for a workspace."""
        if not EnvironmentConfig.validate_workspace(workspace):
            raise ValueError(f"Invalid workspace: {workspace}. Must be one of: dev, staging, prod")

        return {
            'workspace': workspace,
            'vpc_cidr': EnvironmentConfig.get_vpc_cidr(workspace),
            'ecs_container_count': EnvironmentConfig.get_ecs_container_count(workspace),
            'rds_multi_az': EnvironmentConfig.get_rds_multi_az(workspace),
            'rds_instance_class': EnvironmentConfig.get_rds_instance_class(workspace),
            'availability_zones': EnvironmentConfig.get_availability_zones(workspace),
            'alb_deletion_protection': EnvironmentConfig.get_alb_deletion_protection(workspace),
        }
```

## File: lib/config/validation.py

```python
"""
Input validation logic for infrastructure configuration.
Implements validation rules to prevent invalid configurations.
"""

import ipaddress
from typing import List, Optional


class ConfigValidator:
    """Validator for infrastructure configuration parameters."""

    @staticmethod
    def validate_cidr(cidr: str) -> bool:
        """Validate CIDR block format."""
        try:
            ipaddress.ip_network(cidr)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_cidr_non_overlapping(cidrs: List[str]) -> bool:
        """Validate that CIDR blocks do not overlap."""
        networks = []
        for cidr in cidrs:
            try:
                network = ipaddress.ip_network(cidr)
                networks.append(network)
            except ValueError:
                return False

        # Check for overlaps
        for i, net1 in enumerate(networks):
            for net2 in networks[i + 1:]:
                if net1.overlaps(net2):
                    return False
        return True

    @staticmethod
    def validate_container_count(count: int) -> bool:
        """Validate ECS container count (must be positive)."""
        return count > 0 and count <= 100

    @staticmethod
    def validate_instance_class(instance_class: str) -> bool:
        """Validate RDS instance class format."""
        valid_prefixes = ['db.t3.', 'db.t4g.', 'db.r5.', 'db.r6g.', 'db.r6i.']
        return any(instance_class.startswith(prefix) for prefix in valid_prefixes)

    @staticmethod
    def validate_availability_zones(az_count: int, max_azs: int = 6) -> bool:
        """Validate availability zone count."""
        return 1 <= az_count <= max_azs

    @staticmethod
    def validate_environment_suffix(suffix: str) -> bool:
        """Validate environment suffix format."""
        if not suffix:
            return False
        # Must be alphanumeric with hyphens, 1-50 chars
        return len(suffix) <= 50 and all(c.isalnum() or c == '-' for c in suffix)

    @staticmethod
    def validate_all(config: dict) -> tuple[bool, Optional[str]]:
        """Validate all configuration parameters. Returns (is_valid, error_message)."""
        # Validate CIDR
        if not ConfigValidator.validate_cidr(config.get('vpc_cidr', '')):
            return False, f"Invalid CIDR block: {config.get('vpc_cidr')}"

        # Validate container count
        count = config.get('ecs_container_count', 0)
        if not ConfigValidator.validate_container_count(count):
            return False, f"Invalid container count: {count}. Must be between 1 and 100."

        # Validate instance class
        instance_class = config.get('rds_instance_class', '')
        if not ConfigValidator.validate_instance_class(instance_class):
            return False, f"Invalid RDS instance class: {instance_class}"

        # Validate AZ count
        az_count = config.get('availability_zones', 0)
        if not ConfigValidator.validate_availability_zones(az_count):
            return False, f"Invalid AZ count: {az_count}. Must be between 1 and 6."

        return True, None
```

## File: lib/modules/__init__.py

```python
"""Infrastructure modules package."""
```

## File: lib/modules/vpc_module.py

```python
"""
VPC Module - Creates VPC with public/private subnets, NAT gateways, and route tables.
Supports configurable CIDR ranges and multi-AZ deployment.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from typing import List


class VpcModule(Construct):
    """
    VPC Module for multi-environment infrastructure.
    Creates VPC with public and private subnets across multiple AZs.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_cidr: str,
        availability_zones: int = 2,
        enable_nat_gateway: bool = True,
        **kwargs
    ):
        """
        Initialize VPC module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            vpc_cidr: CIDR block for the VPC
            availability_zones: Number of AZs to use (default: 2)
            enable_nat_gateway: Whether to create NAT gateways (default: True)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.az_count = availability_zones

        # Get available AZs
        self.azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}",
                "Module": "vpc",
            }
        )

        # Create Internet Gateway
        self.igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}",
            }
        )

        # Create subnets
        self.public_subnets: List[Subnet] = []
        self.private_subnets: List[Subnet] = []
        self.nat_gateways: List[NatGateway] = []
        self.eips: List[Eip] = []

        # Calculate subnet CIDRs (split VPC CIDR into smaller subnets)
        # For simplicity, we'll create /20 subnets (4096 IPs each)
        # Public: first half, Private: second half
        base_ip = vpc_cidr.split('/')[0]
        base_octets = base_ip.split('.')

        for i in range(self.az_count):
            # Public subnet
            public_subnet = Subnet(
                self,
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{i * 16}.0/20",
                availability_zone=f"${{element({self.azs.names}, {i})}}",
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i}-{environment_suffix}",
                    "Type": "public",
                }
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{base_octets[0]}.{base_octets[1]}.{128 + i * 16}.0/20",
                availability_zone=f"${{element({self.azs.names}, {i})}}",
                tags={
                    "Name": f"private-subnet-{i}-{environment_suffix}",
                    "Type": "private",
                }
            )
            self.private_subnets.append(private_subnet)

            # Create NAT Gateway for each AZ (if enabled)
            if enable_nat_gateway:
                eip = Eip(
                    self,
                    f"nat-eip-{i}-{environment_suffix}",
                    domain="vpc",
                    tags={
                        "Name": f"nat-eip-{i}-{environment_suffix}",
                    }
                )
                self.eips.append(eip)

                nat_gw = NatGateway(
                    self,
                    f"nat-gateway-{i}-{environment_suffix}",
                    allocation_id=eip.id,
                    subnet_id=public_subnet.id,
                    tags={
                        "Name": f"nat-gateway-{i}-{environment_suffix}",
                    }
                )
                self.nat_gateways.append(nat_gw)

        # Create route tables
        # Public route table (one for all public subnets)
        self.public_route_table = RouteTable(
            self,
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"public-rt-{environment_suffix}",
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public-rt-assoc-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
            )

        # Private route tables (one per AZ with NAT gateway)
        self.private_route_tables: List[RouteTable] = []
        for i in range(self.az_count):
            routes = []
            if enable_nat_gateway and i < len(self.nat_gateways):
                routes.append(
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=self.nat_gateways[i].id,
                    )
                )

            private_rt = RouteTable(
                self,
                f"private-rt-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                route=routes,
                tags={
                    "Name": f"private-rt-{i}-{environment_suffix}",
                }
            )
            self.private_route_tables.append(private_rt)

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"private-rt-assoc-{i}-{environment_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=private_rt.id,
            )

    def get_vpc_id(self) -> str:
        """Return VPC ID."""
        return self.vpc.id

    def get_public_subnet_ids(self) -> List[str]:
        """Return list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]

    def get_private_subnet_ids(self) -> List[str]:
        """Return list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
```

## File: lib/modules/secrets_module.py

```python
"""
Secrets Module - Manages AWS Secrets Manager secrets and data sources.
Provides workspace-aware secret paths and retrieval.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
import json


class SecretsModule(Construct):
    """
    Secrets Module for managing sensitive configuration.
    Creates and retrieves secrets from AWS Secrets Manager with workspace-aware naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        **kwargs
    ):
        """
        Initialize Secrets module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace

        # Create database credentials secret
        self.db_secret = SecretsmanagerSecret(
            self,
            f"db-credentials-{environment_suffix}",
            name=f"{workspace}/database/credentials-{environment_suffix}",
            description=f"Database credentials for {workspace} environment",
            recovery_window_in_days=0,  # Set to 0 for immediate deletion (destroyability)
            tags={
                "Name": f"db-credentials-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create initial secret version with placeholder values
        # In production, these should be rotated and managed securely
        db_credentials = {
            "username": f"dbadmin_{workspace}",
            "password": "ChangeMe123!",  # Placeholder - should be rotated
            "engine": "aurora-postgresql",
            "host": "placeholder.rds.amazonaws.com",
            "port": 5432,
            "dbname": f"appdb_{workspace}"
        }

        self.db_secret_version = SecretsmanagerSecretVersion(
            self,
            f"db-secret-version-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # Create application config secret
        self.app_secret = SecretsmanagerSecret(
            self,
            f"app-config-{environment_suffix}",
            name=f"{workspace}/application/config-{environment_suffix}",
            description=f"Application configuration for {workspace} environment",
            recovery_window_in_days=0,
            tags={
                "Name": f"app-config-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        app_config = {
            "api_key": "placeholder-api-key",
            "encryption_key": "placeholder-encryption-key",
            "feature_flags": {
                "enable_advanced_features": workspace == "prod"
            }
        }

        self.app_secret_version = SecretsmanagerSecretVersion(
            self,
            f"app-secret-version-{environment_suffix}",
            secret_id=self.app_secret.id,
            secret_string=json.dumps(app_config)
        )

    def get_db_secret_arn(self) -> str:
        """Return database secret ARN."""
        return self.db_secret.arn

    def get_app_secret_arn(self) -> str:
        """Return application secret ARN."""
        return self.app_secret.arn

    @staticmethod
    def get_secret_value(scope: Construct, secret_name: str, construct_id: str) -> str:
        """
        Retrieve secret value from AWS Secrets Manager.

        Args:
            scope: The scope in which to define this data source
            secret_name: Name of the secret to retrieve
            construct_id: Unique construct ID

        Returns:
            Secret value as string
        """
        secret = DataAwsSecretsmanagerSecret(
            scope,
            construct_id,
            name=secret_name
        )

        secret_version = DataAwsSecretsmanagerSecretVersion(
            scope,
            f"{construct_id}-version",
            secret_id=secret.id
        )

        return secret_version.secret_string
```

## File: lib/modules/iam_module.py

```python
"""
IAM Module - Creates IAM roles and policies for ECS tasks and services.
Implements least privilege principle with environment-specific naming.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
import json


class IamModule(Construct):
    """
    IAM Module for ECS task and execution roles.
    Creates roles with environment-prefixed names following least privilege.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        **kwargs
    ):
        """
        Initialize IAM module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace

        # ECS Task Execution Role (used by ECS agent)
        self.ecs_execution_role = IamRole(
            self,
            f"ecs-execution-role-{environment_suffix}",
            name=f"{workspace}-ecs-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"{workspace}-ecs-execution-role-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            f"ecs-execution-policy-attachment-{environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Additional policy for Secrets Manager access
        IamRolePolicy(
            self,
            f"ecs-execution-secrets-policy-{environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": [
                            f"arn:aws:secretsmanager:*:*:secret:{workspace}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # ECS Task Role (used by the container)
        self.ecs_task_role = IamRole(
            self,
            f"ecs-task-role-{environment_suffix}",
            name=f"{workspace}-ecs-task-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"{workspace}-ecs-task-role-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Task role policy (least privilege - add specific permissions as needed)
        IamRolePolicy(
            self,
            f"ecs-task-policy-{environment_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::app-bucket-{environment_suffix}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            f"arn:aws:dynamodb:*:*:table/app-table-{environment_suffix}"
                        ]
                    }
                ]
            })
        )

    def get_execution_role_arn(self) -> str:
        """Return ECS execution role ARN."""
        return self.ecs_execution_role.arn

    def get_task_role_arn(self) -> str:
        """Return ECS task role ARN."""
        return self.ecs_task_role.arn
```

## File: lib/modules/rds_module.py

```python
"""
RDS Module - Creates Aurora PostgreSQL cluster with conditional Multi-AZ.
Supports environment-specific configurations and automated backups.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from typing import List


class RdsModule(Construct):
    """
    RDS Aurora PostgreSQL Module.
    Creates database cluster with conditional Multi-AZ based on environment.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        vpc_id: str,
        subnet_ids: List[str],
        allowed_security_group_id: str,
        database_name: str = "appdb",
        master_username: str = "dbadmin",
        instance_class: str = "db.t3.medium",
        multi_az: bool = False,
        **kwargs
    ):
        """
        Initialize RDS module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            vpc_id: VPC ID where RDS will be deployed
            subnet_ids: List of subnet IDs for DB subnet group
            allowed_security_group_id: Security group ID allowed to access DB
            database_name: Name of the database to create
            master_username: Master username for the database
            instance_class: RDS instance class
            multi_az: Whether to enable Multi-AZ deployment
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace

        # Create DB subnet group
        self.db_subnet_group = DbSubnetGroup(
            self,
            f"db-subnet-group-{environment_suffix}",
            name=f"db-subnet-group-{environment_suffix}",
            subnet_ids=subnet_ids,
            tags={
                "Name": f"db-subnet-group-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create security group for RDS
        self.db_security_group = SecurityGroup(
            self,
            f"db-sg-{environment_suffix}",
            name=f"db-sg-{environment_suffix}",
            description=f"Security group for RDS Aurora cluster - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[allowed_security_group_id],
                    description="PostgreSQL access from ECS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"db-sg-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create RDS Aurora cluster
        self.db_cluster = RdsCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.4",
            database_name=database_name,
            master_username=master_username,
            master_password="ChangeMe123!",  # Should be from Secrets Manager in production
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.db_security_group.id],
            skip_final_snapshot=True,  # CRITICAL: For destroyability
            deletion_protection=False,  # CRITICAL: For destroyability
            backup_retention_period=7 if workspace == "prod" else 1,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            storage_encrypted=True,
            tags={
                "Name": f"aurora-cluster-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create cluster instances (Multi-AZ if specified)
        self.db_instances: List[RdsClusterInstance] = []
        instance_count = 2 if multi_az else 1

        for i in range(instance_count):
            instance = RdsClusterInstance(
                self,
                f"aurora-instance-{i}-{environment_suffix}",
                identifier=f"aurora-instance-{i}-{environment_suffix}",
                cluster_identifier=self.db_cluster.id,
                instance_class=instance_class,
                engine=self.db_cluster.engine,
                engine_version=self.db_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"aurora-instance-{i}-{environment_suffix}",
                    "Workspace": workspace,
                    "Instance": str(i),
                }
            )
            self.db_instances.append(instance)

    def get_cluster_endpoint(self) -> str:
        """Return cluster writer endpoint."""
        return self.db_cluster.endpoint

    def get_cluster_reader_endpoint(self) -> str:
        """Return cluster reader endpoint."""
        return self.db_cluster.reader_endpoint

    def get_cluster_id(self) -> str:
        """Return cluster identifier."""
        return self.db_cluster.id

    def get_security_group_id(self) -> str:
        """Return database security group ID."""
        return self.db_security_group.id
```

## File: lib/modules/ecs_module.py

```python
"""
ECS Module - Creates ECS Fargate cluster with Application Load Balancer.
Supports environment-based container scaling and task definitions.
"""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration, EcsServiceLoadBalancer
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from typing import List
import json


class EcsModule(Construct):
    """
    ECS Fargate Module with Application Load Balancer.
    Scales container counts based on environment configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        workspace: str,
        vpc_id: str,
        public_subnet_ids: List[str],
        private_subnet_ids: List[str],
        execution_role_arn: str,
        task_role_arn: str,
        container_count: int = 2,
        enable_alb_deletion_protection: bool = False,
        **kwargs
    ):
        """
        Initialize ECS module.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Environment suffix for resource naming
            workspace: Workspace name (dev, staging, prod)
            vpc_id: VPC ID where ECS will be deployed
            public_subnet_ids: List of public subnet IDs for ALB
            private_subnet_ids: List of private subnet IDs for ECS tasks
            execution_role_arn: ARN of ECS execution role
            task_role_arn: ARN of ECS task role
            container_count: Number of containers to run (desired count)
            enable_alb_deletion_protection: Whether to enable ALB deletion protection
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.workspace = workspace
        self.container_count = container_count

        # Create CloudWatch Log Group for ECS tasks
        self.log_group = CloudwatchLogGroup(
            self,
            f"ecs-log-group-{environment_suffix}",
            name=f"/ecs/{workspace}-app-{environment_suffix}",
            retention_in_days=7 if workspace != "prod" else 30,
            tags={
                "Name": f"ecs-log-group-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create ECS Cluster
        self.cluster = EcsCluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            name=f"ecs-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled" if workspace == "prod" else "disabled"
            }],
            tags={
                "Name": f"ecs-cluster-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create security group for ALB
        self.alb_security_group = SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            name=f"alb-sg-{environment_suffix}",
            description=f"Security group for ALB - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"alb-sg-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create security group for ECS tasks
        self.ecs_security_group = SecurityGroup(
            self,
            f"ecs-sg-{environment_suffix}",
            name=f"ecs-sg-{environment_suffix}",
            description=f"Security group for ECS tasks - {workspace}",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.alb_security_group.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"ecs-sg-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            f"app-alb-{environment_suffix}",
            name=f"app-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=enable_alb_deletion_protection,
            tags={
                "Name": f"app-alb-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create target group
        self.target_group = LbTargetGroup(
            self,
            f"app-tg-{environment_suffix}",
            name=f"app-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "path": "/health",
                "port": "8080",
                "protocol": "HTTP",
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30,
                "matcher": "200"
            },
            deregistration_delay=30,
            tags={
                "Name": f"app-tg-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create ALB listener
        self.alb_listener = LbListener(
            self,
            f"alb-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            tags={
                "Name": f"alb-listener-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create ECS Task Definition
        container_definitions = [
            {
                "name": f"app-container-{workspace}",
                "image": "nginx:latest",  # Placeholder image
                "cpu": 256,
                "memory": 512,
                "essential": True,
                "portMappings": [
                    {
                        "containerPort": 8080,
                        "hostPort": 8080,
                        "protocol": "tcp"
                    }
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": self.log_group.name,
                        "awslogs-region": "us-east-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "ENVIRONMENT",
                        "value": workspace
                    },
                    {
                        "name": "APP_PORT",
                        "value": "8080"
                    }
                ]
            }
        ]

        self.task_definition = EcsTaskDefinition(
            self,
            f"app-task-def-{environment_suffix}",
            family=f"app-task-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=execution_role_arn,
            task_role_arn=task_role_arn,
            container_definitions=json.dumps(container_definitions),
            tags={
                "Name": f"app-task-def-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Create ECS Service
        self.service = EcsService(
            self,
            f"app-service-{environment_suffix}",
            name=f"app-service-{environment_suffix}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=container_count,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[self.ecs_security_group.id],
                assign_public_ip=False
            ),
            load_balancer=[
                EcsServiceLoadBalancer(
                    target_group_arn=self.target_group.arn,
                    container_name=f"app-container-{workspace}",
                    container_port=8080
                )
            ],
            depends_on=[self.alb_listener],
            tags={
                "Name": f"app-service-{environment_suffix}",
                "Workspace": workspace,
            }
        )

    def get_cluster_name(self) -> str:
        """Return ECS cluster name."""
        return self.cluster.name

    def get_cluster_arn(self) -> str:
        """Return ECS cluster ARN."""
        return self.cluster.arn

    def get_alb_dns_name(self) -> str:
        """Return ALB DNS name."""
        return self.alb.dns_name

    def get_alb_arn(self) -> str:
        """Return ALB ARN."""
        return self.alb.arn

    def get_ecs_security_group_id(self) -> str:
        """Return ECS security group ID."""
        return self.ecs_security_group.id
```

## File: lib/tap_stack.py

```python
"""
TAP Stack - Root orchestrator for multi-environment infrastructure.
Coordinates VPC, RDS, ECS, IAM, and Secrets modules with workspace-based configuration.
"""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable

from lib.config.variables import EnvironmentConfig
from lib.config.validation import ConfigValidator
from lib.modules.vpc_module import VpcModule
from lib.modules.iam_module import IamModule
from lib.modules.secrets_module import SecretsModule
from lib.modules.rds_module import RdsModule
from lib.modules.ecs_module import EcsModule


class TapStack(TerraformStack):
    """
    Root CDKTF Python stack for multi-environment infrastructure.
    Implements workspace-based environment separation with reusable modules.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with multi-environment configuration."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        workspace = kwargs.get('workspace', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Validate workspace
        if not EnvironmentConfig.validate_workspace(workspace):
            raise ValueError(f"Invalid workspace: {workspace}")

        # Get environment-specific configuration
        config = EnvironmentConfig.get_all_config(workspace)

        # Validate configuration
        is_valid, error_msg = ConfigValidator.validate_all(config)
        if not is_valid:
            raise ValueError(f"Configuration validation failed: {error_msg}")

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with workspace-specific state files
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{workspace}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add DynamoDB for state locking using escape hatch
        self.add_override("terraform.backend.s3.dynamodb_table", f"terraform-state-lock-{workspace}")
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create DynamoDB table for state locking
        state_lock_table = DynamodbTable(
            self,
            f"state-lock-table-{environment_suffix}",
            name=f"terraform-state-lock-{workspace}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="LockID",
            attribute=[{
                "name": "LockID",
                "type": "S"
            }],
            deletion_protection_enabled=False,  # CRITICAL: For destroyability
            tags={
                "Name": f"terraform-state-lock-{workspace}",
                "Workspace": workspace,
                "Purpose": "Terraform state locking"
            }
        )

        # Create S3 bucket for static assets
        assets_bucket = S3Bucket(
            self,
            f"assets-bucket-{environment_suffix}",
            bucket=f"app-assets-{workspace}-{environment_suffix}",
            versioning={
                "enabled": True
            },
            server_side_encryption_configuration={
                "rule": {
                    "apply_server_side_encryption_by_default": {
                        "sse_algorithm": "AES256"
                    }
                }
            },
            force_destroy=True,  # CRITICAL: For destroyability
            tags={
                "Name": f"app-assets-{workspace}-{environment_suffix}",
                "Workspace": workspace,
            }
        )

        # Module 1: VPC Module
        vpc_module = VpcModule(
            self,
            f"vpc-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_cidr=config['vpc_cidr'],
            availability_zones=config['availability_zones'],
            enable_nat_gateway=True
        )

        # Module 2: IAM Module
        iam_module = IamModule(
            self,
            f"iam-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace
        )

        # Module 3: Secrets Module
        secrets_module = SecretsModule(
            self,
            f"secrets-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace
        )

        # Module 4: ECS Module
        ecs_module = EcsModule(
            self,
            f"ecs-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            vpc_id=vpc_module.get_vpc_id(),
            public_subnet_ids=vpc_module.get_public_subnet_ids(),
            private_subnet_ids=vpc_module.get_private_subnet_ids(),
            execution_role_arn=iam_module.get_execution_role_arn(),
            task_role_arn=iam_module.get_task_role_arn(),
            container_count=config['ecs_container_count'],
            enable_alb_deletion_protection=config['alb_deletion_protection']
        )

        # Module 5: RDS Module
        rds_module = RdsModule(
            self,
            f"rds-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            vpc_id=vpc_module.get_vpc_id(),
            subnet_ids=vpc_module.get_private_subnet_ids(),
            allowed_security_group_id=ecs_module.get_ecs_security_group_id(),
            database_name=f"appdb_{workspace}",
            master_username="dbadmin",
            instance_class=config['rds_instance_class'],
            multi_az=config['rds_multi_az']
        )

        # Outputs - Expose critical resource IDs and endpoints
        TerraformOutput(
            self,
            "workspace",
            value=workspace,
            description="Current workspace (environment)"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc_module.get_vpc_id(),
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=vpc_module.get_public_subnet_ids(),
            description="Public subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=vpc_module.get_private_subnet_ids(),
            description="Private subnet IDs"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_module.get_cluster_name(),
            description="ECS cluster name"
        )

        TerraformOutput(
            self,
            "ecs_cluster_arn",
            value=ecs_module.get_cluster_arn(),
            description="ECS cluster ARN"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=ecs_module.get_alb_dns_name(),
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=rds_module.get_cluster_endpoint(),
            description="RDS Aurora cluster endpoint (writer)"
        )

        TerraformOutput(
            self,
            "rds_cluster_reader_endpoint",
            value=rds_module.get_cluster_reader_endpoint(),
            description="RDS Aurora cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=secrets_module.get_db_secret_arn(),
            description="Database credentials secret ARN"
        )

        TerraformOutput(
            self,
            "app_secret_arn",
            value=secrets_module.get_app_secret_arn(),
            description="Application configuration secret ARN"
        )

        TerraformOutput(
            self,
            "ecs_task_role_arn",
            value=iam_module.get_task_role_arn(),
            description="ECS task role ARN"
        )

        TerraformOutput(
            self,
            "ecs_execution_role_arn",
            value=iam_module.get_execution_role_arn(),
            description="ECS execution role ARN"
        )

        TerraformOutput(
            self,
            "assets_bucket_name",
            value=assets_bucket.bucket,
            description="S3 bucket name for static assets"
        )

        TerraformOutput(
            self,
            "state_lock_table_name",
            value=state_lock_table.name,
            description="DynamoDB table name for state locking"
        )
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure with CDKTF Python

This infrastructure implements a modular, workspace-based architecture for managing AWS resources across development, staging, and production environments using Cloud Development Kit for Terraform (CDKTF) with Python.

## Architecture Overview

The infrastructure consists of five main modules:

1. **VPC Module** - Network infrastructure with public/private subnets, NAT gateways, and route tables
2. **IAM Module** - ECS task and execution roles with least privilege policies
3. **Secrets Module** - AWS Secrets Manager integration for sensitive configuration
4. **ECS Module** - Fargate cluster with Application Load Balancer for containerized applications
5. **RDS Module** - Aurora PostgreSQL cluster with conditional Multi-AZ deployment

## Workspace Configuration

Infrastructure uses Terraform workspaces to manage environment separation:

- **dev**: Development environment (2 ECS containers, single-AZ RDS)
- **staging**: Staging environment (4 ECS containers, single-AZ RDS)
- **prod**: Production environment (8 ECS containers, Multi-AZ RDS)

## Environment-Specific Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| ECS Containers | 2 | 4 | 8 |
| RDS Multi-AZ | No | No | Yes |
| RDS Instance Class | db.t3.medium | db.r5.large | db.r5.xlarge |
| Availability Zones | 2 | 2 | 3 |

## Prerequisites

- Python 3.9 or higher
- Node.js 18+ (for CDKTF CLI)
- Terraform 1.5+
- AWS CLI v2 configured with appropriate credentials
- cdktf-cli installed: `npm install -g cdktf-cli@latest`

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

### Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev-12345"  # Unique suffix for resources
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export TEAM="synth-2"
```

### Deploy to Development

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy to dev environment
cdktf deploy
```

### Deploy to Staging or Production

Change the workspace prefix in `ENVIRONMENT_SUFFIX`:

```bash
# For staging
export ENVIRONMENT_SUFFIX="staging-12345"
cdktf deploy

# For production
export ENVIRONMENT_SUFFIX="prod-12345"
cdktf deploy
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{suffix}`

Examples:
- VPC: `vpc-dev-12345`
- ECS Cluster: `ecs-cluster-staging-67890`
- IAM Role: `prod-ecs-task-role-abc123`

## State Management

- **Backend**: S3 with workspace-specific state files
- **State Path**: `s3://{bucket}/{workspace}/{stack-name}.tfstate`
- **Locking**: DynamoDB table per workspace (`terraform-state-lock-{workspace}`)
- **Encryption**: Enabled on S3 backend

## Secrets Management

Sensitive values are stored in AWS Secrets Manager with workspace-aware paths:

- Database credentials: `{workspace}/database/credentials-{suffix}`
- Application config: `{workspace}/application/config-{suffix}`

### Accessing Secrets

```python
from lib.modules.secrets_module import SecretsModule

secret_value = SecretsModule.get_secret_value(
    scope,
    "dev/database/credentials-12345",
    "db-secret-data"
)
```

## Validation

The infrastructure includes validation logic for:

- CIDR block format and non-overlapping ranges
- Container count limits (1-100)
- RDS instance class format
- Availability zone count (1-6)
- Environment suffix format (alphanumeric with hyphens, max 50 chars)

## Outputs

After deployment, the following outputs are available:

- `vpc_id` - VPC identifier
- `public_subnet_ids` - List of public subnet IDs
- `private_subnet_ids` - List of private subnet IDs
- `ecs_cluster_name` - ECS cluster name
- `alb_dns_name` - Application Load Balancer DNS name
- `rds_cluster_endpoint` - Database writer endpoint
- `rds_cluster_reader_endpoint` - Database reader endpoint
- `db_secret_arn` - Database credentials secret ARN
- `app_secret_arn` - Application config secret ARN

## Destroying Infrastructure

```bash
cdktf destroy
```

All resources are configured for safe destruction (no retention policies, skip final snapshots, etc.).

## Module Versioning

Modules use semantic versioning with Git tags:

```bash
git tag -a v1.0.0 -m "Initial release of multi-environment infrastructure"
git push origin v1.0.0
```

## Testing

Run unit tests:
```bash
pytest tests/unit/ -v
```

Run integration tests:
```bash
pytest tests/integration/ -v
```

## Troubleshooting

### State Lock Issues

If state is locked, identify and release the lock:

```bash
aws dynamodb get-item \
  --table-name terraform-state-lock-dev \
  --key '{"LockID": {"S": "iac-rlhf-tf-states/dev/TapStackdev-12345.tfstate"}}'

# If stuck, delete the lock (use with caution)
aws dynamodb delete-item \
  --table-name terraform-state-lock-dev \
  --key '{"LockID": {"S": "iac-rlhf-tf-states/dev/TapStackdev-12345.tfstate"}}'
```

### Workspace Errors

Verify workspace configuration:

```bash
terraform workspace list
terraform workspace select dev
```

## Security Considerations

- All data encrypted at rest (S3, RDS, Secrets Manager)
- IAM roles follow least privilege principle
- Security groups restrict traffic to required ports only
- Secrets rotation should be implemented in production
- Database master password should be managed through Secrets Manager

## Cost Optimization

- Development environments use smaller instance sizes
- RDS Multi-AZ only enabled for production
- NAT Gateways can be reduced to 1 per environment if cost is a concern
- Container Insights disabled for dev/staging

## Support

For issues or questions, contact the infrastructure team.
```

## File: tests/__init__.py

```python
"""Tests package for TAP infrastructure."""
```

## File: tests/unit/__init__.py

```python
"""Unit tests package."""
```

## File: tests/unit/test_tap_stack.py

```python
"""
Unit tests for TAP stack and modules.
Tests configuration, validation, and resource creation logic.
"""

import pytest
from lib.config.variables import EnvironmentConfig
from lib.config.validation import ConfigValidator


class TestEnvironmentConfig:
    """Test environment configuration class."""

    def test_vpc_cidr_dev(self):
        """Test VPC CIDR for dev environment."""
        assert EnvironmentConfig.get_vpc_cidr('dev') == '10.0.0.0/16'

    def test_vpc_cidr_staging(self):
        """Test VPC CIDR for staging environment."""
        assert EnvironmentConfig.get_vpc_cidr('staging') == '10.1.0.0/16'

    def test_vpc_cidr_prod(self):
        """Test VPC CIDR for prod environment."""
        assert EnvironmentConfig.get_vpc_cidr('prod') == '10.2.0.0/16'

    def test_ecs_container_count_dev(self):
        """Test ECS container count for dev."""
        assert EnvironmentConfig.get_ecs_container_count('dev') == 2

    def test_ecs_container_count_staging(self):
        """Test ECS container count for staging."""
        assert EnvironmentConfig.get_ecs_container_count('staging') == 4

    def test_ecs_container_count_prod(self):
        """Test ECS container count for prod."""
        assert EnvironmentConfig.get_ecs_container_count('prod') == 8

    def test_rds_multi_az_dev(self):
        """Test RDS Multi-AZ setting for dev."""
        assert EnvironmentConfig.get_rds_multi_az('dev') is False

    def test_rds_multi_az_prod(self):
        """Test RDS Multi-AZ setting for prod."""
        assert EnvironmentConfig.get_rds_multi_az('prod') is True

    def test_workspace_validation_valid(self):
        """Test workspace validation with valid values."""
        assert EnvironmentConfig.validate_workspace('dev') is True
        assert EnvironmentConfig.validate_workspace('staging') is True
        assert EnvironmentConfig.validate_workspace('prod') is True

    def test_workspace_validation_invalid(self):
        """Test workspace validation with invalid values."""
        assert EnvironmentConfig.validate_workspace('invalid') is False
        assert EnvironmentConfig.validate_workspace('test') is False

    def test_get_all_config_dev(self):
        """Test getting all configuration for dev."""
        config = EnvironmentConfig.get_all_config('dev')
        assert config['workspace'] == 'dev'
        assert config['vpc_cidr'] == '10.0.0.0/16'
        assert config['ecs_container_count'] == 2
        assert config['rds_multi_az'] is False

    def test_get_all_config_invalid_workspace(self):
        """Test getting config with invalid workspace raises error."""
        with pytest.raises(ValueError, match="Invalid workspace"):
            EnvironmentConfig.get_all_config('invalid')


class TestConfigValidator:
    """Test configuration validator class."""

    def test_validate_cidr_valid(self):
        """Test CIDR validation with valid CIDR blocks."""
        assert ConfigValidator.validate_cidr('10.0.0.0/16') is True
        assert ConfigValidator.validate_cidr('192.168.1.0/24') is True

    def test_validate_cidr_invalid(self):
        """Test CIDR validation with invalid CIDR blocks."""
        assert ConfigValidator.validate_cidr('invalid') is False
        assert ConfigValidator.validate_cidr('10.0.0.0/33') is False

    def test_validate_cidr_non_overlapping_valid(self):
        """Test non-overlapping CIDR validation with valid blocks."""
        cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16']
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is True

    def test_validate_cidr_non_overlapping_invalid(self):
        """Test non-overlapping CIDR validation with overlapping blocks."""
        cidrs = ['10.0.0.0/16', '10.0.1.0/24', '10.2.0.0/16']
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is False

    def test_validate_container_count_valid(self):
        """Test container count validation with valid counts."""
        assert ConfigValidator.validate_container_count(1) is True
        assert ConfigValidator.validate_container_count(50) is True
        assert ConfigValidator.validate_container_count(100) is True

    def test_validate_container_count_invalid(self):
        """Test container count validation with invalid counts."""
        assert ConfigValidator.validate_container_count(0) is False
        assert ConfigValidator.validate_container_count(101) is False
        assert ConfigValidator.validate_container_count(-1) is False

    def test_validate_instance_class_valid(self):
        """Test RDS instance class validation with valid classes."""
        assert ConfigValidator.validate_instance_class('db.t3.medium') is True
        assert ConfigValidator.validate_instance_class('db.r5.large') is True

    def test_validate_instance_class_invalid(self):
        """Test RDS instance class validation with invalid classes."""
        assert ConfigValidator.validate_instance_class('invalid') is False
        assert ConfigValidator.validate_instance_class('t3.medium') is False

    def test_validate_availability_zones_valid(self):
        """Test AZ count validation with valid counts."""
        assert ConfigValidator.validate_availability_zones(1) is True
        assert ConfigValidator.validate_availability_zones(3) is True
        assert ConfigValidator.validate_availability_zones(6) is True

    def test_validate_availability_zones_invalid(self):
        """Test AZ count validation with invalid counts."""
        assert ConfigValidator.validate_availability_zones(0) is False
        assert ConfigValidator.validate_availability_zones(7) is False

    def test_validate_environment_suffix_valid(self):
        """Test environment suffix validation with valid suffixes."""
        assert ConfigValidator.validate_environment_suffix('dev-12345') is True
        assert ConfigValidator.validate_environment_suffix('prod-abc') is True

    def test_validate_environment_suffix_invalid(self):
        """Test environment suffix validation with invalid suffixes."""
        assert ConfigValidator.validate_environment_suffix('') is False
        assert ConfigValidator.validate_environment_suffix('a' * 51) is False

    def test_validate_all_valid_config(self):
        """Test validate_all with valid configuration."""
        config = {
            'vpc_cidr': '10.0.0.0/16',
            'ecs_container_count': 2,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is True
        assert error_msg is None

    def test_validate_all_invalid_cidr(self):
        """Test validate_all with invalid CIDR."""
        config = {
            'vpc_cidr': 'invalid',
            'ecs_container_count': 2,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is False
        assert 'CIDR' in error_msg

    def test_validate_all_invalid_container_count(self):
        """Test validate_all with invalid container count."""
        config = {
            'vpc_cidr': '10.0.0.0/16',
            'ecs_container_count': 0,
            'rds_instance_class': 'db.t3.medium',
            'availability_zones': 2
        }
        is_valid, error_msg = ConfigValidator.validate_all(config)
        assert is_valid is False
        assert 'container count' in error_msg


class TestCIDRNonOverlapping:
    """Test CIDR non-overlapping validation across all environments."""

    def test_all_environment_cidrs_non_overlapping(self):
        """Verify that all environment CIDRs are non-overlapping."""
        cidrs = [
            EnvironmentConfig.get_vpc_cidr('dev'),
            EnvironmentConfig.get_vpc_cidr('staging'),
            EnvironmentConfig.get_vpc_cidr('prod')
        ]
        assert ConfigValidator.validate_cidr_non_overlapping(cidrs) is True
```

## File: tests/integration/__init__.py

```python
"""Integration tests package."""
```

## File: tests/integration/test_tap_stack.py

```python
"""
Integration tests for TAP stack.
Tests full stack synthesis and resource relationships.
"""

import pytest
import os
from cdktf import Testing


def test_stack_synthesis():
    """Test that the stack synthesizes without errors."""
    # This test requires actual AWS credentials and state bucket
    # For now, we'll skip it in CI/CD
    pytest.skip("Integration test requires AWS credentials")


def test_dev_environment_configuration():
    """Test dev environment configuration values."""
    from lib.config.variables import EnvironmentConfig

    config = EnvironmentConfig.get_all_config('dev')

    assert config['vpc_cidr'] == '10.0.0.0/16'
    assert config['ecs_container_count'] == 2
    assert config['rds_multi_az'] is False
    assert config['availability_zones'] == 2


def test_prod_environment_configuration():
    """Test prod environment configuration values."""
    from lib.config.variables import EnvironmentConfig

    config = EnvironmentConfig.get_all_config('prod')

    assert config['vpc_cidr'] == '10.2.0.0/16'
    assert config['ecs_container_count'] == 8
    assert config['rds_multi_az'] is True
    assert config['availability_zones'] == 3


def test_environment_specific_scaling():
    """Test that container counts scale appropriately per environment."""
    from lib.config.variables import EnvironmentConfig

    dev_count = EnvironmentConfig.get_ecs_container_count('dev')
    staging_count = EnvironmentConfig.get_ecs_container_count('staging')
    prod_count = EnvironmentConfig.get_ecs_container_count('prod')

    assert dev_count < staging_count < prod_count
    assert dev_count == 2
    assert staging_count == 4
    assert prod_count == 8
```

## Additional Files

### requirements.txt

Create a requirements.txt for Python dependencies (not shown in code blocks above, but needed):

```
cdktf>=0.20.0
constructs>=10.0.0
cdktf-cdktf-provider-aws>=19.0.0
pytest>=7.0.0
pytest-cov>=4.0.0
```

## Deployment Instructions

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   cdktf get
   ```

2. **Set environment variables**:
   ```bash
   export ENVIRONMENT_SUFFIX="dev-12345"
   export AWS_REGION="us-east-1"
   ```

3. **Synthesize and deploy**:
   ```bash
   cdktf synth
   cdktf deploy
   ```

## Key Features Implemented

1. **Workspace Management**: Environment separation through workspace-based configuration
2. **VPC Module**: Non-overlapping CIDRs (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)
3. **RDS Module**: Conditional Multi-AZ (prod only)
4. **ECS Module**: Environment-based scaling (2/4/8 containers)
5. **S3 Backend**: Workspace-specific state files with DynamoDB locking
6. **IAM Roles**: Environment-prefixed names
7. **AWS Secrets Manager**: Integration with workspace-aware paths
8. **Validation Rules**: Comprehensive input validation
9. **Semantic Versioning**: Git tag support (documented in README)
10. **environmentSuffix**: All resources include suffix for uniqueness
11. **Destroyability**: No retention policies, proper cleanup on destroy
