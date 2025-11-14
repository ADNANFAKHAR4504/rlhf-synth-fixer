"""TAP Stack module for CDKTF Python infrastructure."""

import os
from pathlib import Path
from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint


def get_aws_region(**kwargs):
    """
    Get AWS region from environment variable, fallback to lib/AWS_REGION file, then props, then default.
    
    Priority:
    1. AWS_REGION environment variable
    2. lib/AWS_REGION file
    3. aws_region from kwargs
    4. Default: eu-central-2
    """
    # First priority: environment variable
    if os.getenv('AWS_REGION'):
        return os.getenv('AWS_REGION')
    
    # Second priority: read from lib/AWS_REGION file
    aws_region_file = Path(__file__).parent / 'AWS_REGION'
    if aws_region_file.exists():
        try:
            region_from_file = aws_region_file.read_text(encoding='utf-8').strip()
            if region_from_file:
                return region_from_file
        except Exception:
            # Ignore file read errors and continue to next fallback
            pass
    
    # Third priority: kwargs
    if kwargs.get('aws_region'):
        return kwargs.get('aws_region')
    
    # Default: eu-central-2 as specified in PROMPT.md
    return 'eu-central-2'


class TapStack(TerraformStack):
    """CDKTF Python stack for VPC infrastructure."""

    def __init__(  # pylint: disable=too-many-locals
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with VPC infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = get_aws_region(**kwargs)
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        # default_tags from tap.py is already in format {"tags": {...}}, wrap in list for AwsProvider
        provider_config = {
            "region": aws_region,
        }
        if default_tags and isinstance(default_tags, dict) and default_tags.get("tags"):
            # default_tags is already in correct format from tap.py: {"tags": {...}}
            provider_config["default_tags"] = [default_tags]

        AwsProvider(
            self,
            "aws",
            **provider_config
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Define common tags
        common_tags = {
            "Environment": "development",
            "CostCenter": "engineering"
        }

        # ========================================
        # VPC and Core Networking
        # ========================================

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}",
                **common_tags
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}",
                **common_tags
            }
        )

        # ========================================
        # Subnets (2 AZs, Public and Private)
        # ========================================

        # Create public subnets
        public_subnet_1 = Subnet(
            self,
            f"public-subnet-1-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"public-subnet-1-{environment_suffix}",
                "Type": "Public",
                **common_tags
            }
        )

        public_subnet_2 = Subnet(
            self,
            f"public-subnet-2-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={
                "Name": f"public-subnet-2-{environment_suffix}",
                "Type": "Public",
                **common_tags
            }
        )

        # Create private subnets
        private_subnet_1 = Subnet(
            self,
            f"private-subnet-1-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={
                "Name": f"private-subnet-1-{environment_suffix}",
                "Type": "Private",
                **common_tags
            }
        )

        private_subnet_2 = Subnet(
            self,
            f"private-subnet-2-{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={
                "Name": f"private-subnet-2-{environment_suffix}",
                "Type": "Private",
                **common_tags
            }
        )

        # ========================================
        # NAT Gateway (Single for Cost Optimization)
        # ========================================

        # Create Elastic IP for NAT Gateway
        eip = Eip(
            self,
            f"nat-eip-{environment_suffix}",
            domain="vpc",
            tags={
                "Name": f"nat-eip-{environment_suffix}",
                **common_tags
            },
            depends_on=[igw]
        )

        # Create NAT Gateway in first public subnet
        nat_gateway = NatGateway(
            self,
            f"nat-gateway-{environment_suffix}",
            allocation_id=eip.id,
            subnet_id=public_subnet_1.id,
            tags={
                "Name": f"nat-gateway-{environment_suffix}",
                **common_tags
            },
            depends_on=[eip, public_subnet_1]
        )

        # ========================================
        # Route Tables and Associations
        # ========================================

        # Create public route table
        public_rt = RouteTable(
            self,
            f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"public-rt-{environment_suffix}",
                "Type": "Public",
                **common_tags
            }
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            f"public-rt-assoc-1-{environment_suffix}",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            f"public-rt-assoc-2-{environment_suffix}",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Create private route table
        private_rt = RouteTable(
            self,
            f"private-rt-{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
            ],
            tags={
                "Name": f"private-rt-{environment_suffix}",
                "Type": "Private",
                **common_tags
            }
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            f"private-rt-assoc-1-{environment_suffix}",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt.id
        )

        RouteTableAssociation(
            self,
            f"private-rt-assoc-2-{environment_suffix}",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt.id
        )

        # ========================================
        # VPC Flow Logs
        # ========================================

        # Create CloudWatch Log Group for VPC Flow Logs
        log_group = CloudwatchLogGroup(
            self,
            f"vpc-flow-logs-{environment_suffix}",
            name=f"/aws/vpc/flowlogs-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"vpc-flow-logs-{environment_suffix}",
                **common_tags
            }
        )

        # Create IAM Role for VPC Flow Logs
        flow_logs_role = IamRole(
            self,
            f"vpc-flow-logs-role-{environment_suffix}",
            name=f"vpc-flow-logs-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={
                "Name": f"vpc-flow-logs-role-{environment_suffix}",
                **common_tags
            }
        )

        # Create IAM Role Policy for VPC Flow Logs
        IamRolePolicy(
            self,
            f"vpc-flow-logs-policy-{environment_suffix}",
            name=f"vpc-flow-logs-policy-{environment_suffix}",
            role=flow_logs_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "{log_group.arn}:*"
                    }}
                ]
            }}"""
        )

        # Create VPC Flow Logs
        flow_log = FlowLog(
            self,
            f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=log_group.arn,
            iam_role_arn=flow_logs_role.arn,
            max_aggregation_interval=600,  # 10 minutes (valid values: 60 or 600)
            tags={
                "Name": f"vpc-flow-log-{environment_suffix}",
                **common_tags
            }
        )

        # ========================================
        # VPC Endpoints (Gateway Type)
        # ========================================

        # Create VPC Endpoint for S3
        s3_endpoint = VpcEndpoint(
            self,
            f"s3-endpoint-{environment_suffix}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[public_rt.id, private_rt.id],
            tags={
                "Name": f"s3-endpoint-{environment_suffix}",
                **common_tags
            }
        )

        # Create VPC Endpoint for DynamoDB
        dynamodb_endpoint = VpcEndpoint(
            self,
            f"dynamodb-endpoint-{environment_suffix}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[public_rt.id, private_rt.id],
            tags={
                "Name": f"dynamodb-endpoint-{environment_suffix}",
                **common_tags
            }
        )

        # ========================================
        # Terraform Outputs
        # ========================================

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="The ID of the VPC"
        )

        TerraformOutput(
            self,
            "vpc_cidr",
            value=vpc.cidr_block,
            description="The CIDR block of the VPC"
        )

        TerraformOutput(
            self,
            "public_subnet_1_id",
            value=public_subnet_1.id,
            description=f"The ID of public subnet 1 ({aws_region}a)"
        )

        TerraformOutput(
            self,
            "public_subnet_2_id",
            value=public_subnet_2.id,
            description=f"The ID of public subnet 2 ({aws_region}b)"
        )

        TerraformOutput(
            self,
            "private_subnet_1_id",
            value=private_subnet_1.id,
            description=f"The ID of private subnet 1 ({aws_region}a)"
        )

        TerraformOutput(
            self,
            "private_subnet_2_id",
            value=private_subnet_2.id,
            description=f"The ID of private subnet 2 ({aws_region}b)"
        )

        TerraformOutput(
            self,
            "nat_gateway_id",
            value=nat_gateway.id,
            description="The ID of the NAT Gateway"
        )

        TerraformOutput(
            self,
            "internet_gateway_id",
            value=igw.id,
            description="The ID of the Internet Gateway"
        )

        TerraformOutput(
                self,
            "s3_endpoint_id",
            value=s3_endpoint.id,
            description="The ID of the S3 VPC Endpoint"
        )

        TerraformOutput(
                self,
            "dynamodb_endpoint_id",
            value=dynamodb_endpoint.id,
            description="The ID of the DynamoDB VPC Endpoint"
        )

        TerraformOutput(
            self,
            "flow_log_id",
            value=flow_log.id,
            description="The ID of the VPC Flow Log"
        )

        TerraformOutput(
            self,
            "flow_log_group_name",
            value=log_group.name,
            description="The CloudWatch Log Group name for VPC Flow Logs"
        )
