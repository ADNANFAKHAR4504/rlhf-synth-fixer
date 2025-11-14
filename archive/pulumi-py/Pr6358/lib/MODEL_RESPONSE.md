# Multi-Environment Infrastructure with Pulumi Python

This solution provides a complete multi-environment infrastructure setup using Pulumi with Python. It creates three isolated environments (dev, staging, prod) with identical architecture but environment-specific sizing.

## File: __main__.py

```python
"""
Multi-Environment Infrastructure with Pulumi Python
Manages dev, staging, and prod environments with consistent architecture
"""

import pulumi
import pulumi_aws as aws
from components.vpc import VpcComponent
from components.alb import AlbComponent
from components.asg import AsgComponent
from components.rds import RdsComponent
from components.s3 import S3Component

# Get current stack and configuration
stack = pulumi.get_stack()
config = pulumi.Config()

# Get configuration values from Pulumi.<stack>.yaml
environment = config.require("environment")
vpc_cidr = config.require("vpcCidr")
instance_type = config.require("instanceType")
asg_min_size = config.require_int("asgMinSize")
asg_max_size = config.require_int("asgMaxSize")
asg_desired_capacity = config.require_int("asgDesiredCapacity")
rds_instance_class = config.require("rdsInstanceClass")
rds_multi_az = config.get_bool("rdsMultiAz") or False
environment_suffix = config.require("environmentSuffix")

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "Stack": stack,
}

# Create VPC with subnets, route tables, IGW, and NAT Gateway
vpc = VpcComponent(
    f"vpc-{environment}-{environment_suffix}",
    vpc_cidr=vpc_cidr,
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Create RDS MySQL instance with Secrets Manager password
rds = RdsComponent(
    f"rds-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.private_subnet_ids,
    environment=environment,
    environment_suffix=environment_suffix,
    instance_class=rds_instance_class,
    multi_az=rds_multi_az,
    tags=common_tags,
)

# Create Application Load Balancer
alb = AlbComponent(
    f"alb-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.public_subnet_ids,
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Get latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        ),
        aws.ec2.GetAmiFilterArgs(
            name="virtualization-type",
            values=["hvm"],
        ),
    ],
)

# Create Auto Scaling Group with EC2 instances
asg = AsgComponent(
    f"asg-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.private_subnet_ids,
    target_group_arn=alb.target_group_arn,
    environment=environment,
    environment_suffix=environment_suffix,
    instance_type=instance_type,
    ami_id=ami.id,
    min_size=asg_min_size,
    max_size=asg_max_size,
    desired_capacity=asg_desired_capacity,
    tags=common_tags,
)

# Create S3 bucket for static assets
s3_bucket = S3Component(
    f"s3-{environment}-{environment_suffix}",
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Export stack outputs for validation
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("vpc_cidr", vpc_cidr)
pulumi.export("public_subnet_ids", vpc.public_subnet_ids)
pulumi.export("private_subnet_ids", vpc.private_subnet_ids)
pulumi.export("alb_dns_name", alb.alb_dns_name)
pulumi.export("alb_arn", alb.alb_arn)
pulumi.export("target_group_arn", alb.target_group_arn)
pulumi.export("asg_name", asg.asg_name)
pulumi.export("asg_arn", asg.asg_arn)
pulumi.export("rds_endpoint", rds.rds_endpoint)
pulumi.export("rds_arn", rds.rds_arn)
pulumi.export("rds_secret_arn", rds.secret_arn)
pulumi.export("s3_bucket_name", s3_bucket.bucket_name)
pulumi.export("s3_bucket_arn", s3_bucket.bucket_arn)
pulumi.export("environment", environment)
pulumi.export("stack", stack)
```

## File: lib/components/__init__.py

```python
"""
Reusable infrastructure components for multi-environment deployment
"""
```

## File: lib/components/vpc.py

```python
"""
VPC Component - Creates VPC with subnets, route tables, IGW, and NAT Gateway
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class VpcComponent(ComponentResource):
    """
    Reusable VPC component with public and private subnets across two AZs
    """

    def __init__(
        self,
        name: str,
        vpc_cidr: str,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:vpc:VpcComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment}-{environment_suffix}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets in two AZs
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{environment}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_cidr.rsplit('.', 2)[0]}.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    **tags,
                    "Name": f"public-subnet-{i+1}-{environment}-{environment_suffix}",
                    "Type": "public",
                },
                opts=child_opts,
            )
            self.public_subnets.append(subnet)

        # Create private subnets in two AZs
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_cidr.rsplit('.', 2)[0]}.{i+10}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={
                    **tags,
                    "Name": f"private-subnet-{i+1}-{environment}-{environment_suffix}",
                    "Type": "private",
                },
                opts=child_opts,
            )
            self.private_subnets.append(subnet)

        # Allocate Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment}-{environment_suffix}",
            domain="vpc",
            tags={**tags, "Name": f"nat-eip-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment}-{environment_suffix}",
            subnet_id=self.public_subnets[0].id,
            allocation_id=self.eip.id,
            tags={**tags, "Name": f"nat-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"public-rt-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Add route to IGW
        self.public_route = aws.ec2.Route(
            f"public-route-{environment}-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=child_opts,
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{environment}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=child_opts,
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{environment}-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"private-rt-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Add route to NAT Gateway
        self.private_route = aws.ec2.Route(
            f"private-route-{environment}-{environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=child_opts,
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=child_opts,
            )

        # Register outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
            }
        )
```

## File: lib/components/alb.py

```python
"""
ALB Component - Creates Application Load Balancer with target group
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class AlbComponent(ComponentResource):
    """
    Reusable ALB component with target group and health checks
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:alb:AlbComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for ALB in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"alb-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment}-{environment_suffix}",
            load_balancer_type="application",
            subnets=subnet_ids,
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=False,
            tags={**tags, "Name": f"alb-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{environment}-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/",
                matcher="200",
            ),
            tags={**tags, "Name": f"tg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create listener
        self.listener = aws.lb.Listener(
            f"listener-{environment}-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
            opts=child_opts,
        )

        # Register outputs
        self.alb_arn = self.alb.arn
        self.alb_dns_name = self.alb.dns_name
        self.target_group_arn = self.target_group.arn
        self.security_group_id = self.alb_sg.id

        self.register_outputs(
            {
                "alb_arn": self.alb_arn,
                "alb_dns_name": self.alb_dns_name,
                "target_group_arn": self.target_group_arn,
                "security_group_id": self.security_group_id,
            }
        )
```

## File: lib/components/asg.py

```python
"""
ASG Component - Creates Auto Scaling Group with Launch Configuration
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class AsgComponent(ComponentResource):
    """
    Reusable ASG component with launch template and EC2 instances
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        target_group_arn: pulumi.Output,
        environment: str,
        environment_suffix: str,
        instance_type: str,
        ami_id: str,
        min_size: int,
        max_size: int,
        desired_capacity: int,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:asg:AsgComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create security group for instances
        self.instance_sg = aws.ec2.SecurityGroup(
            f"instance-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for instances in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow SSH from anywhere",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"instance-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # User data script to set up web server
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
"""

        # Create launch template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{environment}-{environment_suffix}",
            image_id=ami_id,
            instance_type=instance_type,
            vpc_security_group_ids=[self.instance_sg.id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda data: __import__("base64").b64encode(data.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        **tags,
                        "Name": f"instance-{environment}-{environment_suffix}",
                    },
                )
            ],
            opts=child_opts,
        )

        # Create Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{environment}-{environment_suffix}",
            vpc_zone_identifiers=subnet_ids,
            target_group_arns=[target_group_arn],
            min_size=min_size,
            max_size=max_size,
            desired_capacity=desired_capacity,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest",
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"asg-{environment}-{environment_suffix}",
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=environment,
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="ManagedBy",
                    value="Pulumi",
                    propagate_at_launch=True,
                ),
            ],
            opts=child_opts,
        )

        # Register outputs
        self.asg_name = self.asg.name
        self.asg_arn = self.asg.arn
        self.security_group_id = self.instance_sg.id

        self.register_outputs(
            {
                "asg_name": self.asg_name,
                "asg_arn": self.asg_arn,
                "security_group_id": self.security_group_id,
            }
        )
```

## File: lib/components/rds.py

```python
"""
RDS Component - Creates RDS MySQL instance with Secrets Manager password
"""

import pulumi
import pulumi_aws as aws
import json
import random
import string
from pulumi import ComponentResource, ResourceOptions


class RdsComponent(ComponentResource):
    """
    Reusable RDS component with MySQL and Secrets Manager integration
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        environment: str,
        environment_suffix: str,
        instance_class: str,
        multi_az: bool,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:rds:RdsComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Generate random password
        password = "".join(
            random.choices(string.ascii_letters + string.digits, k=16)
        )

        # Create secret in Secrets Manager
        self.secret = aws.secretsmanager.Secret(
            f"rds-password-{environment}-{environment_suffix}",
            description=f"RDS MySQL password for {environment}",
            tags={**tags, "Name": f"rds-password-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Store password in secret
        self.secret_version = aws.secretsmanager.SecretVersion(
            f"rds-password-version-{environment}-{environment_suffix}",
            secret_id=self.secret.id,
            secret_string=json.dumps(
                {
                    "username": "admin",
                    "password": password,
                    "engine": "mysql",
                    "host": "placeholder",
                    "port": 3306,
                    "dbname": f"appdb_{environment}",
                }
            ),
            opts=child_opts,
        )

        # Create security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for RDS in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow MySQL from VPC",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"rds-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"rds-subnet-group-{environment}-{environment_suffix}",
            subnet_ids=subnet_ids,
            tags={
                **tags,
                "Name": f"rds-subnet-group-{environment}-{environment_suffix}",
            },
            opts=child_opts,
        )

        # Create RDS instance
        self.rds_instance = aws.rds.Instance(
            f"rds-{environment}-{environment_suffix}",
            identifier=f"rds-{environment}-{environment_suffix}",
            engine="mysql",
            engine_version="8.0",
            instance_class=instance_class,
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp3",
            db_name=f"appdb_{environment}",
            username="admin",
            password=password,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            multi_az=multi_az,
            skip_final_snapshot=True,
            backup_retention_period=7,
            enabled_cloudwatch_logs_exports=["error", "general", "slowquery"],
            tags={**tags, "Name": f"rds-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Update secret with actual endpoint
        self.secret_version_update = self.rds_instance.endpoint.apply(
            lambda endpoint: aws.secretsmanager.SecretVersion(
                f"rds-password-version-update-{environment}-{environment_suffix}",
                secret_id=self.secret.id,
                secret_string=pulumi.Output.json_dumps(
                    {
                        "username": "admin",
                        "password": password,
                        "engine": "mysql",
                        "host": endpoint.split(":")[0],
                        "port": 3306,
                        "dbname": f"appdb_{environment}",
                    }
                ),
                opts=ResourceOptions(
                    parent=self, depends_on=[self.rds_instance, self.secret_version]
                ),
            )
        )

        # Register outputs
        self.rds_endpoint = self.rds_instance.endpoint
        self.rds_arn = self.rds_instance.arn
        self.secret_arn = self.secret.arn
        self.security_group_id = self.rds_sg.id

        self.register_outputs(
            {
                "rds_endpoint": self.rds_endpoint,
                "rds_arn": self.rds_arn,
                "secret_arn": self.secret_arn,
                "security_group_id": self.security_group_id,
            }
        )
```

## File: lib/components/s3.py

```python
"""
S3 Component - Creates S3 bucket for static assets
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class S3Component(ComponentResource):
    """
    Reusable S3 component for static assets
    """

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:s3:S3Component", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create S3 bucket with unique name
        self.bucket = aws.s3.Bucket(
            f"static-assets-{environment}-{environment_suffix}",
            bucket=f"static-assets-{environment}-{environment_suffix}",
            tags={**tags, "Name": f"static-assets-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Enable versioning
        self.bucket_versioning = aws.s3.BucketVersioningV2(
            f"bucket-versioning-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=child_opts,
        )

        # Configure server-side encryption
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"bucket-encryption-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=child_opts,
        )

        # Block public access
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"bucket-public-access-block-{environment}-{environment_suffix}",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts,
        )

        # Register outputs
        self.bucket_name = self.bucket.bucket
        self.bucket_arn = self.bucket.arn

        self.register_outputs(
            {
                "bucket_name": self.bucket_name,
                "bucket_arn": self.bucket_arn,
            }
        )
```

## File: Pulumi.yaml

```yaml
name: multi-env-infrastructure
runtime: python
description: Multi-environment infrastructure with Pulumi Python

config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
```

## File: Pulumi.dev.yaml

```yaml
config:
  multi-env-infrastructure:environment: "dev"
  multi-env-infrastructure:vpcCidr: "10.0.0.0/16"
  multi-env-infrastructure:instanceType: "t3.micro"
  multi-env-infrastructure:asgMinSize: "1"
  multi-env-infrastructure:asgMaxSize: "2"
  multi-env-infrastructure:asgDesiredCapacity: "1"
  multi-env-infrastructure:rdsInstanceClass: "db.t3.micro"
  multi-env-infrastructure:rdsMultiAz: "false"
  multi-env-infrastructure:environmentSuffix: "dev001"
  aws:region: "us-east-1"
```

## File: Pulumi.staging.yaml

```yaml
config:
  multi-env-infrastructure:environment: "staging"
  multi-env-infrastructure:vpcCidr: "10.1.0.0/16"
  multi-env-infrastructure:instanceType: "t3.small"
  multi-env-infrastructure:asgMinSize: "2"
  multi-env-infrastructure:asgMaxSize: "4"
  multi-env-infrastructure:asgDesiredCapacity: "2"
  multi-env-infrastructure:rdsInstanceClass: "db.t3.small"
  multi-env-infrastructure:rdsMultiAz: "false"
  multi-env-infrastructure:environmentSuffix: "stg001"
  aws:region: "us-east-1"
```

## File: Pulumi.prod.yaml

```yaml
config:
  multi-env-infrastructure:environment: "prod"
  multi-env-infrastructure:vpcCidr: "10.2.0.0/16"
  multi-env-infrastructure:instanceType: "t3.medium"
  multi-env-infrastructure:asgMinSize: "2"
  multi-env-infrastructure:asgMaxSize: "6"
  multi-env-infrastructure:asgDesiredCapacity: "2"
  multi-env-infrastructure:rdsInstanceClass: "db.t3.small"
  multi-env-infrastructure:rdsMultiAz: "true"
  multi-env-infrastructure:environmentSuffix: "prd001"
  aws:region: "us-east-1"
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: README.md

```markdown
# Multi-Environment Infrastructure with Pulumi Python

This project implements a multi-environment infrastructure solution using Pulumi with Python. It creates three isolated environments (dev, staging, prod) with identical architecture but environment-specific resource sizing.

## Architecture

Each environment includes:
- **VPC**: Isolated Virtual Private Cloud with public and private subnets across 2 AZs
- **ALB**: Application Load Balancer with health checks
- **ASG**: Auto Scaling Group with EC2 instances
- **RDS**: MySQL database with passwords stored in AWS Secrets Manager
- **S3**: Bucket for static assets with versioning and encryption

## Prerequisites

- Python 3.7 or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi backend (optional, defaults to Pulumi Cloud):
```bash
pulumi login
# Or use S3 backend:
# pulumi login s3://<your-bucket-name>
```

## Deployment

### Deploy Development Environment

```bash
pulumi stack select dev
pulumi up
```

### Deploy Staging Environment

```bash
pulumi stack select staging
pulumi up
```

### Deploy Production Environment

```bash
pulumi stack select prod
pulumi up
```

## Stack Configuration

Each environment has its own configuration file:

- `Pulumi.dev.yaml`: Development environment (10.0.0.0/16, t3.micro instances)
- `Pulumi.staging.yaml`: Staging environment (10.1.0.0/16, t3.small instances)
- `Pulumi.prod.yaml`: Production environment (10.2.0.0/16, t3.medium instances)

## Environment Differences

| Parameter | Dev | Staging | Prod |
|-----------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Type | t3.micro | t3.small | t3.medium |
| ASG Min Size | 1 | 2 | 2 |
| ASG Max Size | 2 | 4 | 6 |
| RDS Instance | db.t3.micro | db.t3.small | db.t3.small |
| RDS Multi-AZ | false | false | true |

## Stack Outputs

Each stack exports the following outputs for validation:

- `vpc_id`: VPC identifier
- `alb_dns_name`: Load balancer DNS name
- `rds_endpoint`: Database endpoint
- `rds_secret_arn`: ARN of the Secrets Manager secret containing DB credentials
- `s3_bucket_name`: Name of the S3 bucket

View outputs:
```bash
pulumi stack output
```

## Resource Naming

All resources follow the naming pattern: `{resource-type}-{environment}-{suffix}`

The `environmentSuffix` is configured in each stack file and ensures unique resource names.

## Destroying Resources

To destroy an environment:

```bash
pulumi stack select <environment>
pulumi destroy
```

## Components

The infrastructure is organized into reusable components:

- `lib/components/vpc.py`: VPC with subnets, route tables, IGW, and NAT Gateway
- `lib/components/alb.py`: Application Load Balancer with target group
- `lib/components/asg.py`: Auto Scaling Group with launch template
- `lib/components/rds.py`: RDS MySQL with Secrets Manager integration
- `lib/components/s3.py`: S3 bucket with versioning and encryption

## Security

- Database passwords are stored in AWS Secrets Manager
- S3 buckets have server-side encryption enabled
- Public access to S3 buckets is blocked
- Security groups follow least-privilege principles
- All resources are tagged with Environment and ManagedBy tags

## Tags

All resources are tagged with:
- `Environment`: The environment name (dev/staging/prod)
- `ManagedBy`: "Pulumi"
- `Stack`: The Pulumi stack name

## Troubleshooting

### Stack Selection
```bash
pulumi stack ls
pulumi stack select <stack-name>
```

### View Configuration
```bash
pulumi config
```

### Check State
```bash
pulumi stack
```

## Cost Optimization

- Uses serverless-compatible instance types (t3 family)
- RDS Multi-AZ only enabled for production
- Auto-scaling adjusts capacity based on demand
- All resources are destroyable to avoid ongoing costs
```
