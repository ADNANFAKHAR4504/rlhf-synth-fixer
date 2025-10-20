## 1. Pulumi Project Configuration

### `Pulumi.yaml`

```yaml
name: aws-ha-infrastructure
description: Production-ready, highly-available AWS infrastructure
runtime:
  name: python
  options:
    virtualenv: venv
```

### `Pulumi.prod.yaml`

```yaml
config:
  aws:region: us-west-1
  aws-ha-infrastructure:environment: production
  aws-ha-infrastructure:project_name: ha-infra
  aws-ha-infrastructure:vpc_cidr: 10.0.0.0/16
  aws-ha-infrastructure:enable_flow_logs: true
  aws-ha-infrastructure:min_instances: 3
  aws-ha-infrastructure:max_instances: 9
  aws-ha-infrastructure:desired_instances: 3
  aws-ha-infrastructure:instance_type: t3.medium
  aws-ha-infrastructure:alert_email: ops@example.com
```

### `requirements.txt`

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-random>=4.0.0,<5.0.0
```

## 2. Main Pulumi Program

### `__main__.py`

```python
"""
Main Pulumi program for deploying a highly-available AWS infrastructure.

This program orchestrates the deployment of networking, compute, security,
monitoring, and secrets management components across multiple availability zones.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export

# Import our modules
from network.vpc import NetworkStack
from compute.autoscaling import ComputeStack
from compute.launch_template import LaunchTemplate
from security.iam import IAMStack
from security.security_groups import SecurityStack
from monitoring.cloudwatch import MonitoringStack
from monitoring.alerts import AlertingStack
from secrets.manager import SecretsStack
from utils.tags import get_common_tags

# Load configuration
config = Config()
project_name = config.get("project_name") or "ha-infra"
environment = config.get("environment") or "production"

# Get AWS account details
current = aws.get_caller_identity()
current_region = aws.get_region()

# Common tags for all resources
common_tags = get_common_tags(project_name, environment)

# Deploy IAM roles and policies first
iam_stack = IAMStack(
    name=f"{project_name}-iam",
    project_name=project_name,
    environment=environment,
    tags=common_tags
)

# Deploy networking infrastructure
network_stack = NetworkStack(
    name=f"{project_name}-network",
    project_name=project_name,
    environment=environment,
    vpc_cidr=config.get("vpc_cidr") or "10.0.0.0/16",
    availability_zones=3,  # Minimum 3 AZs for HA
    enable_flow_logs=config.get_bool("enable_flow_logs") or True,
    tags=common_tags
)

# Deploy security groups
security_stack = SecurityStack(
    name=f"{project_name}-security",
    project_name=project_name,
    environment=environment,
    vpc_id=network_stack.vpc.id,
    tags=common_tags
)

# Deploy secrets management
secrets_stack = SecretsStack(
    name=f"{project_name}-secrets",
    project_name=project_name,
    environment=environment,
    tags=common_tags
)

# Deploy compute infrastructure
compute_stack = ComputeStack(
    name=f"{project_name}-compute",
    project_name=project_name,
    environment=environment,
    vpc_id=network_stack.vpc.id,
    private_subnet_ids=network_stack.private_subnet_ids,
    security_group_ids=[security_stack.app_security_group.id],
    instance_profile_arn=iam_stack.instance_profile.arn,
    min_size=config.get_int("min_instances") or 3,
    max_size=config.get_int("max_instances") or 9,
    desired_capacity=config.get_int("desired_instances") or 3,
    instance_type=config.get("instance_type") or "t3.medium",
    tags=common_tags
)

# Deploy monitoring and alerting
monitoring_stack = MonitoringStack(
    name=f"{project_name}-monitoring",
    project_name=project_name,
    environment=environment,
    autoscaling_group_name=compute_stack.autoscaling_group.name,
    tags=common_tags
)

alerting_stack = AlertingStack(
    name=f"{project_name}-alerting",
    project_name=project_name,
    environment=environment,
    alert_email=config.get("alert_email") or "ops@example.com",
    autoscaling_group_name=compute_stack.autoscaling_group.name,
    tags=common_tags
)

# Export important values
export("vpc_id", network_stack.vpc.id)
export("private_subnet_ids", network_stack.private_subnet_ids)
export("public_subnet_ids", network_stack.public_subnet_ids)
export("nat_gateway_ids", network_stack.nat_gateway_ids)
export("autoscaling_group_name", compute_stack.autoscaling_group.name)
export("sns_topic_arn", alerting_stack.sns_topic.arn)
export("secret_arns", secrets_stack.secret_arns)
export("region", current_region.name)
export("account_id", current.account_id)

# Output deployment summary
pulumi.log.info(f"""
Deployment Summary:
- Environment: {environment}
- Region: {current_region.name}
- VPC CIDR: {config.get("vpc_cidr") or "10.0.0.0/16"}
- Availability Zones: 3
- Min Instances: {config.get_int("min_instances") or 3}
- Max Instances: {config.get_int("max_instances") or 9}
- Instance Type: {config.get("instance_type") or "t3.medium"}
""")
```

## 3. Network Module

### `network/__init__.py`

```python
from .vpc import NetworkStack

__all__ = ["NetworkStack"]
```

### `network/vpc.py`

```python
"""
Network module for creating VPC infrastructure with high availability.

This module creates:
- VPC with DNS support
- Public and private subnets across multiple AZs
- Internet Gateway for public subnets
- NAT Gateways for private subnet outbound traffic
- Route tables and associations
- VPC Flow Logs for network auditing
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional


class NetworkStack:
    """
    Creates a highly-available network infrastructure across multiple AZs.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        vpc_cidr: str = "10.0.0.0/16",
        availability_zones: int = 3,
        enable_flow_logs: bool = True,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the network stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            vpc_cidr: CIDR block for the VPC
            availability_zones: Number of AZs to use (minimum 3 for HA)
            enable_flow_logs: Whether to enable VPC flow logs
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.vpc_cidr = vpc_cidr
        self.az_count = max(availability_zones, 3)  # Minimum 3 AZs
        self.tags = tags or {}

        # Get available AZs
        self.azs = aws.get_availability_zones(state="available")

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"{project_name}-vpc-{environment}"
            }
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{project_name}-igw-{environment}"
            }
        )

        # Create subnets
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []

        for i in range(self.az_count):
            az = self.azs.names[i]

            # Calculate subnet CIDR blocks
            public_cidr = f"10.0.{i * 10}.0/24"
            private_cidr = f"10.0.{100 + i * 10}.0/24"

            # Create public subnet
            public_subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=public_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    "Name": f"{project_name}-public-subnet-{az}-{environment}",
                    "Type": "Public",
                    "kubernetes.io/role/elb": "1"  # For potential EKS use
                }
            )
            self.public_subnets.append(public_subnet)

            # Create private subnet
            private_subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=private_cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.tags,
                    "Name": f"{project_name}-private-subnet-{az}-{environment}",
                    "Type": "Private",
                    "kubernetes.io/role/internal-elb": "1"  # For potential EKS use
                }
            )
            self.private_subnets.append(private_subnet)

            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i+1}",
                domain="vpc",
                tags={
                    **self.tags,
                    "Name": f"{project_name}-nat-eip-{az}-{environment}"
                }
            )
            self.eips.append(eip)

            # Create NAT Gateway in each public subnet for HA
            nat_gateway = aws.ec2.NatGateway(
                f"{name}-nat-gateway-{i+1}",
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.tags,
                    "Name": f"{project_name}-nat-gateway-{az}-{environment}"
                }
            )
            self.nat_gateways.append(nat_gateway)

        # Create route tables
        self._create_route_tables()

        # Create VPC Flow Logs if enabled
        if enable_flow_logs:
            self._create_flow_logs()

        # Store subnet IDs for export
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]
        self.nat_gateway_ids = [nat.id for nat in self.nat_gateways]

    def _create_route_tables(self):
        """Create and associate route tables for public and private subnets."""

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"{self.name}-public-rt",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.project_name}-public-rt-{self.environment}",
                "Type": "Public"
            }
        )

        # Add route to Internet Gateway
        aws.ec2.Route(
            f"{self.name}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Create private route tables (one per AZ for isolation)
        self.private_route_tables = []
        for i in range(self.az_count):
            private_route_table = aws.ec2.RouteTable(
                f"{self.name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={
                    **self.tags,
                    "Name": f"{self.project_name}-private-rt-{self.azs.names[i]}-{self.environment}",
                    "Type": "Private"
                }
            )
            self.private_route_tables.append(private_route_table)

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"{self.name}-private-route-{i+1}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateways[i].id
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"{self.name}-private-rta-{i+1}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=private_route_table.id
            )

    def _create_flow_logs(self):
        """Create VPC Flow Logs for network auditing."""

        # Create S3 bucket for flow logs
        flow_logs_bucket = aws.s3.BucketV2(
            f"{self.name}-flow-logs",
            bucket=f"{self.project_name}-flow-logs-{self.environment}",
            tags={
                **self.tags,
                "Name": f"{self.project_name}-flow-logs-{self.environment}",
                "Purpose": "VPC Flow Logs"
            }
        )

        # Enable versioning for audit trail
        aws.s3.BucketVersioningV2(
            f"{self.name}-flow-logs-versioning",
            bucket=flow_logs_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )

        # Enable encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"{self.name}-flow-logs-encryption",
            bucket=flow_logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.name}-flow-logs-pab",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Create IAM role for Flow Logs
        flow_logs_role = aws.iam.Role(
            f"{self.name}-flow-logs-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                **self.tags,
                "Name": f"{self.project_name}-flow-logs-role-{self.environment}"
            }
        )

        # Attach policy for S3 access
        flow_logs_policy = aws.iam.RolePolicy(
            f"{self.name}-flow-logs-policy",
            role=flow_logs_role.id,
            policy=pulumi.Output.all(flow_logs_bucket.arn).apply(
                lambda args: f"""{{
                    "Version": "2012-10-17",
                    "Statement": [
                        {{
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject",
                                "s3:GetObject",
                                "s3:ListBucket"
                            ],
                            "Resource": [
                                "{args[0]}",
                                "{args[0]}/*"
                            ]
                        }}
                    ]
                }}"""
            )
        )

        # Create Flow Logs
        self.flow_logs = aws.ec2.FlowLog(
            f"{self.name}-flow-logs",
            iam_role_arn=flow_logs_role.arn,
            log_destination_arn=flow_logs_bucket.arn,
            log_destination_type="s3",
            traffic_type="ALL",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.project_name}-flow-logs-{self.environment}"
            }
        )
```

## 4. Security Module

### `security/iam.py`

```python
"""
IAM module for creating roles and policies with least-privilege access.

This module creates:
- Instance roles and profiles for EC2 instances
- Service roles for various AWS services
- Least-privilege policies for specific actions
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, Optional


class IAMStack:
    """
    Creates IAM roles and policies with least-privilege access.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the IAM stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.tags = tags or {}

        # Create instance role for EC2 instances
        self.instance_role = aws.iam.Role(
            f"{name}-instance-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                **self.tags,
                "Name": f"{project_name}-instance-role-{environment}",
                "Purpose": "EC2 Instance Role"
            }
        )

        # Attach CloudWatch policy for metrics and logs
        self.cloudwatch_policy = aws.iam.RolePolicy(
            f"{name}-cloudwatch-policy",
            role=self.instance_role.id,
            policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "ec2:DescribeVolumes",
                            "ec2:DescribeTags",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "*"
                    }
                ]
            }"""
        )

        # Attach S3 read-only policy for application artifacts
        self.s3_readonly_policy = aws.iam.RolePolicy(
            f"{name}-s3-readonly-policy",
            role=self.instance_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "arn:aws:s3:::{project_name}-artifacts-{environment}",
                            "arn:aws:s3:::{project_name}-artifacts-{environment}/*"
                        ]
                    }}
                ]
            }}"""
        )

        # Attach Secrets Manager policy
        self.secrets_policy = aws.iam.RolePolicy(
            f"{name}-secrets-policy",
            role=self.instance_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": "arn:aws:secretsmanager:*:*:secret:{project_name}/{environment}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {{
                            "StringEquals": {{
                                "kms:ViaService": "secretsmanager.*.amazonaws.com"
                            }}
                        }}
                    }}
                ]
            }}"""
        )

        # Attach SSM Parameter Store policy
        self.ssm_policy = aws.iam.RolePolicy(
            f"{name}-ssm-policy",
            role=self.instance_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": "arn:aws:ssm:*:*:parameter/{project_name}/{environment}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "ssm:DescribeParameters"
                        ],
                        "Resource": "*"
                    }}
                ]
            }}"""
        )

        # Create instance profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"{name}-instance-profile",
            role=self.instance_role.name,
            tags={
                **self.tags,
                "Name": f"{project_name}-instance-profile-{environment}"
            }
        )

        # Create role for Pulumi operations (if running in CI/CD)
        self._create_pulumi_role()

    def _create_pulumi_role(self):
        """Create IAM role for Pulumi operations with necessary permissions."""

        self.pulumi_role = aws.iam.Role(
            f"{self.name}-pulumi-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codebuild.amazonaws.com",
                        "AWS": "arn:aws:iam::*:root"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                **self.tags,
                "Name": f"{self.project_name}-pulumi-role-{self.environment}",
                "Purpose": "Pulumi Deployment"
            }
        )

        # Attach managed policies for Pulumi operations
        aws.iam.RolePolicyAttachment(
            f"{self.name}-pulumi-ec2-policy",
            role=self.pulumi_role.id,
            policy_arn="arn:aws:iam::aws:policy/AmazonEC2FullAccess"
        )

        aws.iam.RolePolicyAttachment(
            f"{self.name}-pulumi-vpc-policy",
            role=self.pulumi_role.id,
            policy_arn="arn:aws:iam::aws:policy/AmazonVPCFullAccess"
        )

        aws.iam.RolePolicyAttachment(
            f"{self.name}-pulumi-iam-policy",
            role=self.pulumi_role.id,
            policy_arn="arn:aws:iam::aws:policy/IAMFullAccess"
        )
```

### `security/security_groups.py`

```python
"""
Security Groups module for network security with least-privilege rules.

This module creates:
- Application security groups
- Database security groups
- Load balancer security groups
- Network ACLs for additional protection
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, Optional


class SecurityStack:
    """
    Creates security groups and network ACLs with least-privilege access.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        vpc_id: pulumi.Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the security stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            vpc_id: VPC ID where security groups will be created
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.vpc_id = vpc_id
        self.tags = tags or {}

        # Create application security group
        self.app_security_group = aws.ec2.SecurityGroup(
            f"{name}-app-sg",
            name=f"{project_name}-app-sg-{environment}",
            description="Security group for application instances",
            vpc_id=vpc_id,
            tags={
                **self.tags,
                "Name": f"{project_name}-app-sg-{environment}",
                "Type": "Application"
            }
        )

        # Allow HTTPS inbound from anywhere (through ALB)
        aws.ec2.SecurityGroupRule(
            f"{name}-app-https-ingress",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],  # Only from within VPC
            security_group_id=self.app_security_group.id,
            description="HTTPS from VPC"
        )

        # Allow HTTP inbound from anywhere (through ALB)
        aws.ec2.SecurityGroupRule(
            f"{name}-app-http-ingress",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],  # Only from within VPC
            security_group_id=self.app_security_group.id,
            description="HTTP from VPC"
        )

        # Allow all outbound traffic (for updates, external APIs, etc.)
        aws.ec2.SecurityGroupRule(
            f"{name}-app-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.app_security_group.id,
            description="All outbound traffic"
        )

        # Create ALB security group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            name=f"{project_name}-alb-sg-{environment}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            tags={
                **self.tags,
                "Name": f"{project_name}-alb-sg-{environment}",
                "Type": "LoadBalancer"
            }
        )

        # Allow HTTPS from internet
        aws.ec2.SecurityGroupRule(
            f"{name}-alb-https-ingress",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_security_group.id,
            description="HTTPS from Internet"
        )

        # Allow HTTP from internet (for redirect to HTTPS)
        aws.ec2.SecurityGroupRule(
            f"{name}-alb-http-ingress",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_security_group.id,
            description="HTTP from Internet"
        )

        # Allow outbound to app instances
        aws.ec2.SecurityGroupRule(
            f"{name}-alb-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            source_security_group_id=self.app_security_group.id,
            security_group_id=self.alb_security_group.id,
            description="Traffic to application instances"
        )

        # Create database security group
        self.db_security_group = aws.ec2.SecurityGroup(
            f"{name}-db-sg",
            name=f"{project_name}-db-sg-{environment}",
            description="Security group for database instances",
            vpc_id=vpc_id,
            tags={
                **self.tags,
                "Name": f"{project_name}-db-sg-{environment}",
                "Type": "Database"
            }
        )

        # Allow PostgreSQL from app instances
        aws.ec2.SecurityGroupRule(
            f"{name}-db-postgres-ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.app_security_group.id,
            security_group_id=self.db_security_group.id,
            description="PostgreSQL from application instances"
        )

        # Allow MySQL from app instances
        aws.ec2.SecurityGroupRule(
            f"{name}-db-mysql-ingress",
            type="ingress",
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            source_security_group_id=self.app_security_group.id,
            security_group_id=self.db_security_group.id,
            description="MySQL from application instances"
        )

        # No egress for database (it doesn't need to initiate connections)
        aws.ec2.SecurityGroupRule(
            f"{name}-db-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["127.0.0.1/32"],  # Effectively no egress
            security_group_id=self.db_security_group.id,
            description="No outbound traffic"
        )
```

## 5. Compute Module

### `compute/launch_template.py`

```python
"""
Launch Template module for EC2 instance configuration.

This module creates:
- Launch templates with proper configuration
- User data scripts for instance initialization
- Instance metadata options for security
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional
import base64


class LaunchTemplate:
    """
    Creates launch templates for Auto Scaling Groups.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        instance_type: str,
        security_group_ids: List[pulumi.Output[str]],
        instance_profile_arn: pulumi.Output[str],
        key_name: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the launch template.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            instance_type: EC2 instance type
            security_group_ids: List of security group IDs
            instance_profile_arn: IAM instance profile ARN
            key_name: SSH key pair name
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.tags = tags or {}

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ]
        )

        # User data script for instance initialization
        user_data = """#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install SSM agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install other necessary tools
yum install -y aws-cli jq htop

# Configure CloudWatch agent
cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "CustomApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/system",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "/aws/ec2/system",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Application-specific setup would go here
echo "Instance initialization complete" >> /var/log/user-data.log
"""

        # Create launch template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"{name}-launch-template",
            name=f"{project_name}-lt-{environment}",
            description=f"Launch template for {project_name} {environment} instances",
            image_id=ami.id,
            instance_type=instance_type,
            key_name=key_name,
            vpc_security_group_ids=security_group_ids,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=instance_profile_arn
            ),
            user_data=base64.b64encode(user_data.encode()).decode(),

            # Instance metadata options for security
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",  # IMDSv2 only
                http_put_response_hop_limit=1,
                instance_metadata_tags="enabled"
            ),

            # Enable detailed monitoring
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),

            # EBS optimization
            ebs_optimized=True,

            # Root block device
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,
                        volume_type="gp3",
                        iops=3000,
                        throughput=125,
                        encrypted=True,
                        delete_on_termination=True
                    )
                )
            ],

            # Tags for instances
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        **self.tags,
                        "Name": f"{project_name}-instance-{environment}",
                        "LaunchTemplate": f"{project_name}-lt-{environment}"
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags={
                        **self.tags,
                        "Name": f"{project_name}-volume-{environment}",
                        "LaunchTemplate": f"{project_name}-lt-{environment}"
                    }
                )
            ],

            tags={
                **self.tags,
                "Name": f"{project_name}-lt-{environment}"
            }
        )
```

### `compute/autoscaling.py`

```python
"""
Auto Scaling module for compute resources with high availability.

This module creates:
- Auto Scaling Groups across multiple AZs
- Target tracking scaling policies
- Health checks and lifecycle hooks
- Automatic instance replacement
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional
from .launch_template import LaunchTemplate


class ComputeStack:
    """
    Creates Auto Scaling Groups with high availability and auto-recovery.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        vpc_id: pulumi.Output[str],
        private_subnet_ids: List[pulumi.Output[str]],
        security_group_ids: List[pulumi.Output[str]],
        instance_profile_arn: pulumi.Output[str],
        min_size: int = 3,
        max_size: int = 9,
        desired_capacity: int = 3,
        instance_type: str = "t3.medium",
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the compute stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            vpc_id: VPC ID
            private_subnet_ids: List of private subnet IDs
            security_group_ids: List of security group IDs
            instance_profile_arn: IAM instance profile ARN
            min_size: Minimum number of instances
            max_size: Maximum number of instances
            desired_capacity: Desired number of instances
            instance_type: EC2 instance type
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.tags = tags or {}

        # Create launch template
        self.launch_template = LaunchTemplate(
            name=f"{name}-lt",
            project_name=project_name,
            environment=environment,
            instance_type=instance_type,
            security_group_ids=security_group_ids,
            instance_profile_arn=instance_profile_arn,
            tags=tags
        )

        # Create target group for load balancer
        self.target_group = aws.lb.TargetGroup(
            f"{name}-tg",
            name=f"{project_name}-tg-{environment}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",

            # Health check configuration
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200"
            ),

            # Deregistration delay
            deregistration_delay=30,

            # Stickiness
            stickiness=aws.lb.TargetGroupStickinessArgs(
                enabled=True,
                type="lb_cookie",
                cookie_duration=86400  # 24 hours
            ),

            tags={
                **self.tags,
                "Name": f"{project_name}-tg-{environment}"
            }
        )

        # Create Auto Scaling Group
        self.autoscaling_group = aws.autoscaling.Group(
            f"{name}-asg",
            name=f"{project_name}-asg-{environment}",
            min_size=min_size,
            max_size=max_size,
            desired_capacity=desired_capacity,

            # Use launch template
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.launch_template.id,
                version="$Latest"
            ),

            # Subnet placement
            vpc_zone_identifiers=private_subnet_ids,

            # Health checks
            health_check_type="ELB",
            health_check_grace_period=300,

            # Instance replacement
            max_instance_lifetime=604800,  # 7 days

            # Target group attachment
            target_group_arns=[self.target_group.arn],

            # Instance refresh settings
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],

            # Termination policies
            termination_policies=["OldestInstance"],

            # Tags
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True
                ) for k, v in {
                    **self.tags,
                    "Name": f"{project_name}-asg-instance-{environment}",
                    "AutoScalingGroup": f"{project_name}-asg-{environment}"
                }.items()
            ]
        )

        # Create scaling policies
        self._create_scaling_policies()

        # Create lifecycle hooks
        self._create_lifecycle_hooks()

    def _create_scaling_policies(self):
        """Create target tracking scaling policies."""

        # CPU utilization scaling policy
        self.cpu_scaling_policy = aws.autoscaling.Policy(
            f"{self.name}-cpu-scaling",
            name=f"{self.project_name}-cpu-scaling-{self.environment}",
            autoscaling_group_name=self.autoscaling_group.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ASGAverageCPUUtilization"
                ),
                target_value=70.0
            )
        )

        # Custom metric scaling policy (example: request count per target)
        self.request_scaling_policy = aws.autoscaling.Policy(
            f"{self.name}-request-scaling",
            name=f"{self.project_name}-request-scaling-{self.environment}",
            autoscaling_group_name=self.autoscaling_group.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ALBRequestCountPerTarget",
                    resource_label=pulumi.Output.all(
                        self.target_group.arn_suffix,
                        self.autoscaling_group.name
                    ).apply(lambda args: f"targetgroup/{args[0]}/auto-scaling-group/{args[1]}")
                ),
                target_value=1000.0
            )
        )

    def _create_lifecycle_hooks(self):
        """Create lifecycle hooks for graceful instance management."""

        # Create SNS topic for lifecycle notifications
        lifecycle_topic = aws.sns.Topic(
            f"{self.name}-lifecycle-topic",
            name=f"{self.project_name}-lifecycle-{self.environment}",
            tags={
                **self.tags,
                "Name": f"{self.project_name}-lifecycle-topic-{self.environment}"
            }
        )

        # Create IAM role for lifecycle hooks
        lifecycle_role = aws.iam.Role(
            f"{self.name}-lifecycle-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "autoscaling.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                **self.tags,
                "Name": f"{self.project_name}-lifecycle-role-{self.environment}"
            }
        )

        # Attach policy for SNS publishing
        aws.iam.RolePolicy(
            f"{self.name}-lifecycle-policy",
            role=lifecycle_role.id,
            policy=pulumi.Output.all(lifecycle_topic.arn).apply(
                lambda args: f"""{{
                    "Version": "2012-10-17",
                    "Statement": [{{
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "{args[0]}"
                    }}]
                }}"""
            )
        )

        # Create launching lifecycle hook
        aws.autoscaling.LifecycleHook(
            f"{self.name}-launching-hook",
            name=f"{self.project_name}-launching-{self.environment}",
            autoscaling_group_name=self.autoscaling_group.name,
            default_result="CONTINUE",
            heartbeat_timeout=300,
            lifecycle_transition="autoscaling:EC2_INSTANCE_LAUNCHING",
            notification_metadata=f'{{"Environment": "{self.environment}"}}',
            notification_target_arn=lifecycle_topic.arn,
            role_arn=lifecycle_role.arn
        )

        # Create terminating lifecycle hook
        aws.autoscaling.LifecycleHook(
            f"{self.name}-terminating-hook",
            name=f"{self.project_name}-terminating-{self.environment}",
            autoscaling_group_name=self.autoscaling_group.name,
            default_result="CONTINUE",
            heartbeat_timeout=300,
            lifecycle_transition="autoscaling:EC2_INSTANCE_TERMINATING",
            notification_metadata=f'{{"Environment": "{self.environment}"}}',
            notification_target_arn=lifecycle_topic.arn,
            role_arn=lifecycle_role.arn
        )
```

## 6. Monitoring Module

### `monitoring/cloudwatch.py`

```python
"""
CloudWatch monitoring module for logs and metrics.

This module creates:
- Log groups with retention policies
- Custom metrics
- Metric filters
- Dashboard for visualization
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, Optional


class MonitoringStack:
    """
    Creates CloudWatch monitoring resources.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        autoscaling_group_name: pulumi.Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the monitoring stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            autoscaling_group_name: Name of the Auto Scaling Group to monitor
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.tags = tags or {}

        # Create log groups
        self.system_log_group = aws.cloudwatch.LogGroup(
            f"{name}-system-logs",
            name=f"/aws/ec2/{project_name}/{environment}/system",
            retention_in_days=30,
            tags={
                **self.tags,
                "Name": f"{project_name}-system-logs-{environment}"
            }
        )

        self.application_log_group = aws.cloudwatch.LogGroup(
            f"{name}-app-logs",
            name=f"/aws/ec2/{project_name}/{environment}/application",
            retention_in_days=30,
            tags={
                **self.tags,
                "Name": f"{project_name}-app-logs-{environment}"
            }
        )

        # Create metric filters for error detection
        self.error_metric_filter = aws.cloudwatch.LogMetricFilter(
            f"{name}-error-filter",
            name=f"{project_name}-error-filter-{environment}",
            log_group_name=self.application_log_group.name,
            pattern="[ERROR]",
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                namespace=f"{project_name}/{environment}",
                name="ErrorCount",
                value="1",
                default_value=0
            )
        )

        # Create CloudWatch Dashboard
        self.dashboard = aws.cloudwatch.Dashboard(
            f"{name}-dashboard",
            dashboard_name=f"{project_name}-{environment}",
            dashboard_body=pulumi.Output.all(
                autoscaling_group_name,
                self.application_log_group.name
            ).apply(lambda args: f"""{{
                "widgets": [
                    {{
                        "type": "metric",
                        "properties": {{
                            "metrics": [
                                ["AWS/EC2", "CPUUtilization", {{"AutoScalingGroupName": "{args[0]}"}}],
                                [".", "NetworkIn", {{".": "."}}],
                                [".", "NetworkOut", {{".": "."}}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-west-1",
                            "title": "EC2 Instance Metrics"
                        }}
                    }},
                    {{
                        "type": "metric",
                        "properties": {{
                            "metrics": [
                                ["AWS/AutoScaling", "GroupDesiredCapacity", {{"AutoScalingGroupName": "{args[0]}"}}],
                                [".", "GroupInServiceInstances", {{".": "."}}],
                                [".", "GroupTotalInstances", {{".": "."}}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-west-1",
                            "title": "Auto Scaling Metrics"
                        }}
                    }},
                    {{
                        "type": "log",
                        "properties": {{
                            "query": "SOURCE '{args[1]}' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                            "region": "us-west-1",
                            "title": "Recent Application Logs"
                        }}
                    }},
                    {{
                        "type": "metric",
                        "properties": {{
                            "metrics": [
                                ["{self.project_name}/{self.environment}", "ErrorCount", {{"stat": "Sum"}}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-west-1",
                            "title": "Application Errors"
                        }}
                    }}
                ]
            }}""")
        )
```

### `monitoring/alerts.py`

```python
"""
Alerting module for CloudWatch alarms and SNS notifications.

This module creates:
- CloudWatch alarms for various metrics
- SNS topics for notifications
- Alert routing and escalation
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, Optional


class AlertingStack:
    """
    Creates alerting infrastructure with CloudWatch alarms and SNS.
    """

    def __init__(
        self,
        name: str,
        project_name: str,
        environment: str,
        alert_email: str,
        autoscaling_group_name: pulumi.Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        """
        Initialize the alerting stack.

        Args:
            name: Stack name prefix
            project_name: Project name for resource naming
            environment: Environment (production, staging, etc.)
            alert_email: Email address for alerts
            autoscaling_group_name: Name of the Auto Scaling Group to monitor
            tags: Common tags to apply to resources
        """
        self.name = name
        self.project_name = project_name
        self.environment = environment
        self.tags = tags or {}

        # Create SNS topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"{name}-alerts",
            name=f"{project_name}-alerts-{environment}",
            display_name=f"{project_name} {environment} Alerts",
            tags={
                **self.tags,
                "Name": f"{project_name}-alerts-{environment}"
            }
        )

        # Create email subscription
        self.email_subscription = aws.sns.TopicSubscription(
            f"{name}-email-subscription",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint=alert_email
        )

        # High CPU alarm
        self.high_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-high-cpu",
            alarm_name=f"{project_name}-high-cpu-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when CPU exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "AutoScalingGroupName": autoscaling_group_name
            },
            tags={
                **self.tags,
                "Name": f"{project_name}-high-cpu-alarm-{environment}"
            }
        )

        # Low instance count alarm
        self.low_instance_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-low-instances",
            alarm_name=f"{project_name}-low-instances-{environment}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="GroupInServiceInstances",
            namespace="AWS/AutoScaling",
            period=60,
            statistic="Average",
            threshold=2,
            alarm_description="Alarm when in-service instances drop below 2",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "AutoScalingGroupName": autoscaling_group_name
            },
            treat_missing_data="breaching",
            tags={
                **self.tags,
                "Name": f"{project_name}-low-instances-alarm-{environment}"
            }
        )

        # High memory alarm (requires CloudWatch agent)
        self.high_memory_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-high-memory",
            alarm_name=f"{project_name}-high-memory-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MEM_USED",
            namespace="CustomApp",
            period=300,
            statistic="Average",
            threshold=90,
            alarm_description="Alarm when memory usage exceeds 90%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "AutoScalingGroupName": autoscaling_group_name
            },
            tags={
                **self.tags,
                "Name": f"{project_name}-high-memory-alarm-{environment}"
            }
        )

        # Disk space alarm
        self.low_disk_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-high-disk",
            alarm_name=f"{project_name}-high-disk-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="DISK_USED",
            namespace="CustomApp",
            period=300,
            statistic="Maximum",
            threshold=80,
            alarm_description="Alarm when disk usage exceeds 80%",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "AutoScalingGroupName": autoscaling_group_name
            },
            tags={
                **self.tags,
                "Name": f"{project_name}-high-disk-alarm-{environment}"
            }
        )

        # Application error rate alarm
        self.error_rate_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-error-rate",
            alarm_name=f"{project_name}-error-rate-{environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ErrorCount",
            namespace=f"{project_name}/{environment}",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alarm when error count exceeds 10 in 5 minutes",
            alarm_actions=[self.sns_topic.arn],
            tags={
                **self.tags,
                "Name
```
