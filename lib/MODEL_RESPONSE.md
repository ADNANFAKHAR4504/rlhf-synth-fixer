# Financial Services Infrastructure Refactoring - Pulumi Python Implementation

This implementation refactors the existing financial services infrastructure to improve performance, maintainability, and reliability using Pulumi with Python.

## File: lib/config.py

```python
"""
Configuration management module for Pulumi infrastructure.
Centralizes all configuration values and provides validation.
"""
from typing import Dict, Any, Optional
import pulumi


class InfraConfig:
    """Centralized configuration management for infrastructure."""

    def __init__(self):
        self.config = pulumi.Config()

        # EC2 Configuration
        self.ami_id = self.config.require("ami_id")
        self.instance_type = self.config.get("instance_type") or "t3.medium"
        self.min_size = self.config.get_int("min_size") or 2
        self.max_size = self.config.get_int("max_size") or 6
        self.desired_capacity = self.config.get_int("desired_capacity") or 3

        # RDS Configuration
        self.db_instance_class = self.config.get("db_instance_class") or "db.t3.medium"
        self.db_name = self.config.get("db_name") or "financialdb"
        self.db_username = self.config.get("db_username") or "admin"
        self.db_password = self.config.require_secret("db_password")
        self.db_allocated_storage = self.config.get_int("db_allocated_storage") or 100

        # S3 Configuration
        self.data_bucket_name = self.config.get("data_bucket_name")
        self.logs_bucket_name = self.config.get("logs_bucket_name")

        # Tagging Configuration
        self.environment = self.config.get("environment") or "dev"
        self.owner = self.config.require("owner")
        self.cost_center = self.config.require("cost_center")
        self.project = self.config.require("project")

    def get_common_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Returns common tags to be applied to all resources.

        Args:
            additional_tags: Optional additional tags to merge

        Returns:
            Dictionary of tags
        """
        tags = {
            "Environment": self.environment,
            "Owner": self.owner,
            "CostCenter": self.cost_center,
            "Project": self.project,
            "ManagedBy": "Pulumi"
        }

        if additional_tags:
            tags.update(additional_tags)

        return tags
```

## File: lib/networking.py

```python
"""
Networking infrastructure module.
Creates VPC with 3 availability zones.
"""
from typing import List, Dict, Any
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class NetworkingStack:
    """Creates VPC and networking resources."""

    def __init__(self, name: str, environment_suffix: str, tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize networking infrastructure.

        Args:
            name: Resource name prefix
            environment_suffix: Environment suffix for resource naming
            tags: Common tags to apply
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment_suffix}"},
            opts=opts
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (3 AZs)
        self.public_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"public-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (3 AZs)
        self.private_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**tags, "Name": f"private-subnet-{i}-{environment_suffix}"},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={**tags, "Name": f"public-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=subnet)
            )

        # Security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"alb-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for EC2 instances
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"ec2-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**tags, "Name": f"ec2-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.ec2_sg.id]
                )
            ],
            tags={**tags, "Name": f"rds-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self.vpc)
        )
```

## File: lib/web_tier.py

```python
"""
Web tier ComponentResource.
Encapsulates ALB, Target Group, and Auto Scaling Group.
"""
from typing import List, Dict, Any, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class WebTierArgs:
    """Arguments for WebTier component."""

    def __init__(self,
                 vpc_id: Output[str],
                 public_subnet_ids: List[Output[str]],
                 private_subnet_ids: List[Output[str]],
                 alb_security_group_id: Output[str],
                 ec2_security_group_id: Output[str],
                 instance_profile_arn: Output[str],
                 ami_id: str,
                 instance_type: str,
                 min_size: int,
                 max_size: int,
                 desired_capacity: int,
                 environment_suffix: str,
                 tags: Dict[str, str]):
        """
        Initialize web tier arguments.

        Args:
            vpc_id: VPC ID
            public_subnet_ids: List of public subnet IDs
            private_subnet_ids: List of private subnet IDs
            alb_security_group_id: ALB security group ID
            ec2_security_group_id: EC2 security group ID
            instance_profile_arn: IAM instance profile ARN
            ami_id: AMI ID for EC2 instances
            instance_type: EC2 instance type
            min_size: Minimum ASG size
            max_size: Maximum ASG size
            desired_capacity: Desired ASG capacity
            environment_suffix: Environment suffix
            tags: Common tags
        """
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.private_subnet_ids = private_subnet_ids
        self.alb_security_group_id = alb_security_group_id
        self.ec2_security_group_id = ec2_security_group_id
        self.instance_profile_arn = instance_profile_arn
        self.ami_id = ami_id
        self.instance_type = instance_type
        self.min_size = min_size
        self.max_size = max_size
        self.desired_capacity = desired_capacity
        self.environment_suffix = environment_suffix
        self.tags = tags


class WebTier(ComponentResource):
    """
    Web tier component resource.
    Encapsulates ALB, Target Group, and Auto Scaling Group.
    """

    def __init__(self, name: str, args: WebTierArgs, opts: Optional[ResourceOptions] = None):
        """
        Initialize web tier component.

        Args:
            name: Component name
            args: Web tier arguments
            opts: Pulumi resource options
        """
        super().__init__("custom:infrastructure:WebTier", name, None, opts)

        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{args.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[args.alb_security_group_id],
            subnets=args.public_subnet_ids,
            enable_deletion_protection=False,
            tags={**args.tags, "Name": f"alb-{args.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{args.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=args.vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={**args.tags, "Name": f"tg-{args.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ALB Listener
        self.listener = aws.lb.Listener(
            f"alb-listener-{args.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self.alb)
        )

        # Launch Template
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Financial Services Application</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
"""

        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{args.environment_suffix}",
            name_prefix=f"lt-{args.environment_suffix}-",
            image_id=args.ami_id,
            instance_type=args.instance_type,
            vpc_security_group_ids=[args.ec2_security_group_id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=args.instance_profile_arn
            ),
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**args.tags, "Name": f"web-instance-{args.environment_suffix}"}
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{args.environment_suffix}",
            vpc_zone_identifiers=args.private_subnet_ids,
            desired_capacity=args.desired_capacity,
            max_size=args.max_size,
            min_size=args.min_size,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            target_group_arns=[self.target_group.arn],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True
                ) for k, v in {**args.tags, "Name": f"asg-{args.environment_suffix}"}.items()
            ],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "alb_dns_name": self.alb.dns_name,
            "alb_arn": self.alb.arn,
            "target_group_arn": self.target_group.arn,
            "asg_name": self.asg.name
        })
```

## File: lib/database.py

```python
"""
Database infrastructure module.
Creates RDS MySQL instance.
"""
from typing import List, Dict, Any
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class DatabaseStack:
    """Creates RDS MySQL database."""

    def __init__(self,
                 name: str,
                 vpc_id: Output[str],
                 private_subnet_ids: List[Output[str]],
                 security_group_id: Output[str],
                 db_name: str,
                 db_username: str,
                 db_password: Output[str],
                 instance_class: str,
                 allocated_storage: int,
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize database infrastructure.

        Args:
            name: Resource name prefix
            vpc_id: VPC ID
            private_subnet_ids: List of private subnet IDs
            security_group_id: RDS security group ID
            db_name: Database name
            db_username: Database username
            db_password: Database password
            instance_class: RDS instance class
            allocated_storage: Allocated storage in GB
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # DB Subnet Group
        self.subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"db-subnet-group-{environment_suffix}"},
            opts=opts
        )

        # RDS Instance
        self.db_instance = aws.rds.Instance(
            f"db-{environment_suffix}",
            identifier=f"financial-db-{environment_suffix}",
            engine="mysql",
            engine_version="8.0",
            instance_class=instance_class,
            allocated_storage=allocated_storage,
            storage_type="gp3",
            storage_encrypted=True,
            db_name=db_name,
            username=db_username,
            password=db_password,
            db_subnet_group_name=self.subnet_group.name,
            vpc_security_group_ids=[security_group_id],
            skip_final_snapshot=True,
            backup_retention_period=7,
            multi_az=False,
            publicly_accessible=False,
            tags={**tags, "Name": f"db-{environment_suffix}"},
            opts=ResourceOptions(parent=self.subnet_group)
        )
```

## File: lib/storage.py

```python
"""
Storage infrastructure module.
Creates S3 buckets with encryption.
"""
from typing import Dict, Any, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class StorageStack:
    """Creates S3 buckets for data and logs."""

    def __init__(self,
                 name: str,
                 data_bucket_name: Optional[str],
                 logs_bucket_name: Optional[str],
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize storage infrastructure.

        Args:
            name: Resource name prefix
            data_bucket_name: Data bucket name (optional)
            logs_bucket_name: Logs bucket name (optional)
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # Data bucket
        data_bucket_final_name = data_bucket_name or f"financial-data-{environment_suffix}"
        self.data_bucket = aws.s3.Bucket(
            f"data-bucket-{environment_suffix}",
            bucket=data_bucket_final_name,
            tags={**tags, "Name": f"data-bucket-{environment_suffix}"},
            opts=opts
        )

        # Enable versioning on data bucket
        self.data_bucket_versioning = aws.s3.BucketVersioningV2(
            f"data-bucket-versioning-{environment_suffix}",
            bucket=self.data_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Enable encryption on data bucket
        self.data_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"data-bucket-encryption-{environment_suffix}",
            bucket=self.data_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Block public access
        self.data_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"data-bucket-public-access-{environment_suffix}",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.data_bucket)
        )

        # Logs bucket
        logs_bucket_final_name = logs_bucket_name or f"financial-logs-{environment_suffix}"
        self.logs_bucket = aws.s3.Bucket(
            f"logs-bucket-{environment_suffix}",
            bucket=logs_bucket_final_name,
            tags={**tags, "Name": f"logs-bucket-{environment_suffix}"},
            opts=opts
        )

        # Enable encryption on logs bucket
        self.logs_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"logs-bucket-encryption-{environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Block public access on logs bucket
        self.logs_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"logs-bucket-public-access-{environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.logs_bucket)
        )
```

## File: lib/iam.py

```python
"""
IAM infrastructure module.
Creates IAM roles and policies with least-privilege access.
"""
from typing import Dict, Any
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class IAMStack:
    """Creates IAM roles and policies."""

    def __init__(self,
                 name: str,
                 data_bucket_arn: Output[str],
                 logs_bucket_arn: Output[str],
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize IAM infrastructure.

        Args:
            name: Resource name prefix
            data_bucket_arn: Data bucket ARN
            logs_bucket_arn: Logs bucket ARN
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # EC2 assume role policy
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                }
            }]
        })

        # EC2 IAM Role
        self.ec2_role = aws.iam.Role(
            f"ec2-role-{environment_suffix}",
            name=f"ec2-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={**tags, "Name": f"ec2-role-{environment_suffix}"},
            opts=opts
        )

        # S3 access policy for EC2
        s3_policy_document = pulumi.Output.all(data_bucket_arn, logs_bucket_arn).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"{arns[0]}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            arns[0]
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"{arns[1]}/*"
                        ]
                    }
                ]
            })
        )

        self.s3_policy = aws.iam.RolePolicy(
            f"ec2-s3-policy-{environment_suffix}",
            role=self.ec2_role.id,
            policy=s3_policy_document,
            opts=ResourceOptions(parent=self.ec2_role)
        )

        # CloudWatch Logs policy for EC2
        cloudwatch_policy_document = json.dumps({
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
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/ec2/{environment_suffix}/*"
                }
            ]
        })

        self.cloudwatch_policy = aws.iam.RolePolicy(
            f"ec2-cloudwatch-policy-{environment_suffix}",
            role=self.ec2_role.id,
            policy=cloudwatch_policy_document,
            opts=ResourceOptions(parent=self.ec2_role)
        )

        # EC2 Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"ec2-instance-profile-{environment_suffix}",
            name=f"ec2-instance-profile-{environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self.ec2_role)
        )
```

## File: lib/tap_stack.py

```python
"""
Main Pulumi stack for financial services infrastructure.
Orchestrates all infrastructure components.
"""
from typing import Optional, Dict, Any
import pulumi
from pulumi import ComponentResource, ResourceOptions, Output

from lib.config import InfraConfig
from lib.networking import NetworkingStack
from lib.iam import IAMStack
from lib.storage import StorageStack
from lib.database import DatabaseStack
from lib.web_tier import WebTier, WebTierArgs


class TapStackArgs:
    """Arguments for TapStack component."""

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        """
        Initialize TapStack arguments.

        Args:
            environment_suffix: Environment suffix for resource naming
            tags: Additional tags to apply
        """
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(ComponentResource):
    """
    Main Pulumi component resource for financial services infrastructure.
    Orchestrates networking, compute, database, and storage resources.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        """
        Initialize the main infrastructure stack.

        Args:
            name: Stack name
            args: Stack arguments
            opts: Pulumi resource options
        """
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Load configuration
        config = InfraConfig()
        common_tags = config.get_common_tags(args.tags)

        # Create networking infrastructure
        networking = NetworkingStack(
            name="networking",
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage infrastructure (can be parallel with networking)
        storage = StorageStack(
            name="storage",
            data_bucket_name=config.data_bucket_name,
            logs_bucket_name=config.logs_bucket_name,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM roles and policies
        iam = IAMStack(
            name="iam",
            data_bucket_arn=storage.data_bucket.arn,
            logs_bucket_arn=storage.logs_bucket.arn,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database infrastructure
        database = DatabaseStack(
            name="database",
            vpc_id=networking.vpc.id,
            private_subnet_ids=[s.id for s in networking.private_subnets],
            security_group_id=networking.rds_sg.id,
            db_name=config.db_name,
            db_username=config.db_username,
            db_password=config.db_password,
            instance_class=config.db_instance_class,
            allocated_storage=config.db_allocated_storage,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create web tier (ALB + ASG + Target Group)
        web_tier_args = WebTierArgs(
            vpc_id=networking.vpc.id,
            public_subnet_ids=[s.id for s in networking.public_subnets],
            private_subnet_ids=[s.id for s in networking.private_subnets],
            alb_security_group_id=networking.alb_sg.id,
            ec2_security_group_id=networking.ec2_sg.id,
            instance_profile_arn=iam.instance_profile.arn,
            ami_id=config.ami_id,
            instance_type=config.instance_type,
            min_size=config.min_size,
            max_size=config.max_size,
            desired_capacity=config.desired_capacity,
            environment_suffix=self.environment_suffix,
            tags=common_tags
        )

        web_tier = WebTier(
            name="web-tier",
            args=web_tier_args,
            opts=ResourceOptions(parent=self)
        )

        # Export stack outputs
        self.register_outputs({
            "vpc_id": networking.vpc.id,
            "alb_dns_name": web_tier.alb.dns_name,
            "alb_arn": web_tier.alb.arn,
            "rds_endpoint": database.db_instance.endpoint,
            "rds_address": database.db_instance.address,
            "data_bucket_arn": storage.data_bucket.arn,
            "data_bucket_name": storage.data_bucket.bucket,
            "logs_bucket_arn": storage.logs_bucket.arn,
            "logs_bucket_name": storage.logs_bucket.bucket
        })
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for financial services infrastructure.
"""
import os
import pulumi
from pulumi import Config

from lib.tap_stack import TapStack, TapStackArgs


# Get environment suffix
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or pulumi.get_stack()

# Create the main stack
stack = TapStack(
    name="financial-services-infra",
    args=TapStackArgs(environment_suffix=environment_suffix)
)

# Export outputs at module level for Pulumi
pulumi.export("vpc_id", stack.outputs["vpc_id"])
pulumi.export("alb_dns_name", stack.outputs["alb_dns_name"])
pulumi.export("alb_arn", stack.outputs["alb_arn"])
pulumi.export("rds_endpoint", stack.outputs["rds_endpoint"])
pulumi.export("rds_address", stack.outputs["rds_address"])
pulumi.export("data_bucket_arn", stack.outputs["data_bucket_arn"])
pulumi.export("data_bucket_name", stack.outputs["data_bucket_name"])
pulumi.export("logs_bucket_arn", stack.outputs["logs_bucket_arn"])
pulumi.export("logs_bucket_name", stack.outputs["logs_bucket_name"])
```

## File: Pulumi.dev.yaml

```yaml
config:
  pulumi-infra:ami_id: ami-0c55b159cbfafe1f0
  pulumi-infra:instance_type: t3.medium
  pulumi-infra:min_size: "2"
  pulumi-infra:max_size: "6"
  pulumi-infra:desired_capacity: "3"
  pulumi-infra:db_instance_class: db.t3.medium
  pulumi-infra:db_name: financialdb
  pulumi-infra:db_username: admin
  pulumi-infra:db_password:
    secure: AAABAKzXpXXXXXXXXXXXXXXXXXXXXXXX
  pulumi-infra:db_allocated_storage: "100"
  pulumi-infra:environment: dev
  pulumi-infra:owner: finance-team
  pulumi-infra:cost_center: FINOPS-001
  pulumi-infra:project: financial-services-platform
```

## Summary

This implementation provides:

1. **Centralized Configuration** - All values moved to Pulumi.Config in `config.py`
2. **ComponentResource Pattern** - Web tier encapsulated in custom ComponentResource
3. **Type Hints** - All functions have proper type annotations
4. **Centralized Tagging** - Common tags applied via `get_common_tags()` method
5. **Least-Privilege IAM** - Specific permissions for S3 and CloudWatch Logs
6. **Stack Outputs** - ALB DNS, RDS endpoint, and S3 ARNs exported
7. **Parallel Resource Creation** - Resources created in parallel where possible
8. **Encryption** - S3 buckets use SSE-S3, RDS has encryption at rest
9. **Environment Suffix** - All resources include environment suffix for parallel deployments

The refactored code maintains backward compatibility while improving deployment performance and code maintainability.
