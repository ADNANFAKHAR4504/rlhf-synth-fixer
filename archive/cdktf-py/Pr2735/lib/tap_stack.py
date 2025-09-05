#!/usr/bin/env python
"""TAP Stack module for CDKTF Python infrastructure."""

from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(self, scope: Construct, id: str, **kwargs):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, id)

        # Extract parameters from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "us-east-1")  # Default to us-east-1 as per prompt
        state_bucket = kwargs.get("state_bucket", "iac-rlhf-tf-states")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        default_tags = kwargs.get("default_tags", {})

        # Configure S3 Backend for remote state
        S3Backend(self,
            bucket=state_bucket,
            key=f"cdktf/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # Merge required tags with default tags
        production_tags = {
            "Environment": "Production",
            "Department": "IT"
        }
        if "tags" in default_tags:
            production_tags.update(default_tags["tags"])

        # AWS Provider
        AwsProvider(self, "aws",
            region=aws_region,
            default_tags=[{
                "tags": production_tags
            }]
        )

        # Availability zones for us-east-1
        availability_zones = [f"{aws_region}a", f"{aws_region}b"]

        # VPC
        vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"production-vpc-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Internet Gateway
        igw = InternetGateway(self, "igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"production-igw-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Public Subnets (2 AZs)
        public_subnets = []
        private_subnets = []

        for i in range(2):
            # Public Subnet
            public_subnet = Subnet(self, f"public_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=availability_zones[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"production-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": "Production",
                    "Department": "IT"
                }
            )
            public_subnets.append(public_subnet)

            # Private Subnet
            private_subnet = Subnet(self, f"private_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=availability_zones[i],
                tags={
                    "Name": f"production-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": "Production",
                    "Department": "IT"
                }
            )
            private_subnets.append(private_subnet)

        # Public Route Table
        public_rt = RouteTable(self, "public_rt",
            vpc_id=vpc.id,
            tags={
                "Name": f"production-public-rt-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Public Route to Internet Gateway
        Route(self, "public_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate Public Subnets with Public Route Table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public_rt_association_{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Security Group for EC2 Web Server (HTTPS only)
        web_sg = SecurityGroup(self, "web_sg",
            name=f"production-web-sg-{environment_suffix}",
            description="Security group for web server - HTTPS only",
            vpc_id=vpc.id,
            tags={
                "Name": f"production-web-sg-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # HTTPS inbound rule (port 443)
        SecurityGroupRule(self, "https_ingress",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id
        )

        # Outbound traffic for web server
        SecurityGroupRule(self, "web_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id
        )

        # Security Group for RDS Database
        db_sg = SecurityGroup(self, "db_sg",
            name=f"production-db-sg-{environment_suffix}",
            description="Security group for PostgreSQL database",
            vpc_id=vpc.id,
            tags={
                "Name": f"production-db-sg-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # PostgreSQL inbound rule from web server security group only (port 5432)
        SecurityGroupRule(self, "postgres_ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=web_sg.id,
            security_group_id=db_sg.id
        )

        # IAM Role for EC2 (basic role with least privilege)
        ec2_role = IamRole(self, "ec2_role",
            name=f"production-ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            }),
            tags={
                "Name": f"production-ec2-role-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Instance Profile for EC2
        instance_profile = IamInstanceProfile(self, "ec2_instance_profile",
            name=f"production-ec2-instance-profile-{environment_suffix}",
            role=ec2_role.name,
            tags={
                "Name": f"production-ec2-instance-profile-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Get latest Amazon Linux 2 AMI
        ami = DataAwsAmi(self, "amazon_linux",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                },
                {
                    "name": "virtualization-type",
                    "values": ["hvm"]
                }
            ]
        )

        # EC2 Instance in public subnet (web-facing)
        web_instance = Instance(self, "web_instance",
            ami=ami.id,
            instance_type="t3.micro",
            subnet_id=public_subnets[0].id,  # First public subnet
            vpc_security_group_ids=[web_sg.id],
            iam_instance_profile=instance_profile.name,
            tags={
                "Name": f"production-web-server-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # DB Subnet Group for RDS
        db_subnet_group = DbSubnetGroup(self, "db_subnet_group",
            name=f"production-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": f"production-db-subnet-group-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # PostgreSQL RDS Instance in private subnets
        rds_instance = DbInstance(self, "postgres_db",
            identifier=f"production-postgres-{environment_suffix}",
            engine="postgres",
            engine_version="15.7",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,  # Required encryption at rest
            db_name="productiondb",
            username="dbadmin",
            manage_master_user_password=True,  # Let AWS manage the password
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            publicly_accessible=False,  # Keep in private subnets
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,  # For development/testing
            tags={
                "Name": f"production-postgres-{environment_suffix}",
                "Environment": "Production",
                "Department": "IT"
            }
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="Public Subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="Private Subnet IDs"
        )

        TerraformOutput(self, "web_instance_id",
            value=web_instance.id,
            description="Web Server Instance ID"
        )

        TerraformOutput(self, "web_instance_public_ip",
            value=web_instance.public_ip,
            description="Web Server Public IP"
        )

        TerraformOutput(self, "rds_endpoint",
            value=rds_instance.endpoint,
            description="RDS PostgreSQL Endpoint"
        )
