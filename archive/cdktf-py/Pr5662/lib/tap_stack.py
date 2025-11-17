"""TAP Stack module for CDKTF Python VPC infrastructure."""

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
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for production-ready VPC infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with VPC infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'ap-northeast-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
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
            "Environment": "Production",
            "Project": "PaymentGateway",
            "EnvironmentSuffix": environment_suffix
        }

        # Create VPC
        vpc = Vpc(
            self,
            "payment_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"payment-vpc-{environment_suffix}"
            }
        )

        # Get availability zones for the region
        azs = [
            f"{aws_region}a",
            f"{aws_region}b",
            f"{aws_region}c"
        ]

        # Create public subnets
        public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        public_subnets = []

        for i, (az, cidr) in enumerate(zip(azs, public_subnet_cidrs)):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public"
                }
            )
            public_subnets.append(subnet)

        # Create private subnets
        private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
        private_subnets = []

        for i, (az, cidr) in enumerate(zip(azs, private_subnet_cidrs)):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private"
                }
            )
            private_subnets.append(subnet)

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "internet_gateway",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"internet-gateway-{environment_suffix}"
            }
        )

        # Create Elastic IP for NAT Gateway
        eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={
                **common_tags,
                "Name": f"nat-eip-{environment_suffix}"
            }
        )

        # Create NAT Gateway in first public subnet (ap-northeast-1a)
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=eip.id,
            subnet_id=public_subnets[0].id,
            tags={
                **common_tags,
                "Name": f"nat-gateway-{environment_suffix}"
            }
        )

        # Create route table for public subnets
        public_route_table = RouteTable(
            self,
            "public_route_table",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"public-route-table-{environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_route_table_association_{i}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id
            )

        # Create route table for private subnets
        private_route_table = RouteTable(
            self,
            "private_route_table",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
            ],
            tags={
                **common_tags,
                "Name": f"private-route-table-{environment_suffix}"
            }
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_route_table_association_{i}",
                subnet_id=subnet.id,
                route_table_id=private_route_table.id
            )

        # Create S3 VPC Endpoint
        s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[private_route_table.id],
            tags={
                **common_tags,
                "Name": f"s3-endpoint-{environment_suffix}"
            }
        )

        # Create CloudWatch Log Group for VPC Flow Logs
        log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_logs_group",
            name=f"/aws/vpc/flow-logs-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags
        )

        # Create IAM Role for VPC Flow Logs
        flow_logs_role = IamRole(
            self,
            "vpc_flow_logs_role",
            name=f"vpc-flow-logs-role-{environment_suffix}",
            assume_role_policy=json.dumps({
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
            }),
            tags=common_tags
        )

        # Create IAM Policy for VPC Flow Logs
        IamRolePolicy(
            self,
            "vpc_flow_logs_policy",
            name=f"vpc-flow-logs-policy-{environment_suffix}",
            role=flow_logs_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": log_group.arn
                    }
                ]
            })
        )

        # Enable VPC Flow Logs
        FlowLog(
            self,
            "vpc_flow_logs",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=log_group.arn,
            iam_role_arn=flow_logs_role.arn,
            max_aggregation_interval=600,  # 10 minutes (valid values: 60 or 600)
            tags={
                **common_tags,
                "Name": f"vpc-flow-logs-{environment_suffix}"
            }
        )

        # Create CloudFormation Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="Public Subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="Private Subnet IDs"
        )

        TerraformOutput(
            self,
            "nat_gateway_id",
            value=nat_gateway.id,
            description="NAT Gateway ID"
        )

        TerraformOutput(
            self,
            "s3_endpoint_id",
            value=s3_endpoint.id,
            description="S3 VPC Endpoint ID"
        )

        TerraformOutput(
            self,
            "internet_gateway_id",
            value=igw.id,
            description="Internet Gateway ID"
        )
