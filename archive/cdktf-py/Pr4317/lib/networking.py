"""Networking infrastructure for HIPAA-compliant VPC."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupIngress,
    SecurityGroupEgress,
)
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_availability_zones import (
    DataAwsAvailabilityZones,
)
import json


class NetworkingConstruct(Construct):
    """Construct for VPC and networking infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        """Initialize networking infrastructure."""
        super().__init__(scope, construct_id)

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "available_azs", state="available")

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"healthcare-vpc-{environment_suffix}"},
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"healthcare-igw-{environment_suffix}"},
        )

        # Create public subnets
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"healthcare-public-subnet-1-{environment_suffix}"},
        )

        self.public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"healthcare-public-subnet-2-{environment_suffix}"},
        )

        # Create private subnets
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"healthcare-private-subnet-1-{environment_suffix}"},
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"healthcare-private-subnet-2-{environment_suffix}"},
        )

        # Create EIP for NAT Gateway
        eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={"Name": f"healthcare-nat-eip-{environment_suffix}"},
        )

        # Create NAT Gateway (single for cost optimization)
        nat_gw = NatGateway(
            self,
            "nat_gw",
            allocation_id=eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={"Name": f"healthcare-nat-gw-{environment_suffix}"},
        )

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags={"Name": f"healthcare-public-rt-{environment_suffix}"},
        )

        # Create route table for private subnets
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", nat_gateway_id=nat_gw.id)],
            tags={"Name": f"healthcare-private-rt-{environment_suffix}"},
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_rt.id,
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_rt.id,
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_rt.id,
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_rt.id,
        )

        # Create VPC Endpoint for S3
        VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            route_table_ids=[private_rt.id],
            tags={"Name": f"healthcare-s3-endpoint-{environment_suffix}"},
        )

        # Create VPC Endpoint for DynamoDB
        VpcEndpoint(
            self,
            "dynamodb_endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws_region}.dynamodb",
            route_table_ids=[private_rt.id],
            tags={"Name": f"healthcare-dynamodb-endpoint-{environment_suffix}"},
        )

        # Create security group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self,
            "lambda_sg",
            name=f"healthcare-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={"Name": f"healthcare-lambda-sg-{environment_suffix}"},
        )

        # Create security group for ALB
        self.alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"healthcare-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS inbound",
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP inbound",
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                )
            ],
            tags={"Name": f"healthcare-alb-sg-{environment_suffix}"},
        )

        # VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/healthcare-{environment_suffix}",
            retention_in_days=7,
        )

        flow_log_role = IamRole(
            self,
            "vpc_flow_log_role",
            name=f"healthcare-vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
        )

        IamRolePolicy(
            self,
            "vpc_flow_log_policy",
            name=f"healthcare-vpc-flow-log-policy-{environment_suffix}",
            role=flow_log_role.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams",
                            ],
                            "Resource": "*",
                        }
                    ],
                }
            ),
        )

        FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            iam_role_arn=flow_log_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=flow_log_group.arn,
            tags={"Name": f"healthcare-vpc-flow-log-{environment_suffix}"},
        )

        # Export values
        self.vpc_id = self.vpc.id
        self.private_subnet_ids = [self.private_subnet_1.id, self.private_subnet_2.id]
        self.public_subnet_ids = [self.public_subnet_1.id, self.public_subnet_2.id]
        self.lambda_security_group_id = self.lambda_sg.id
        self.alb_security_group_id = self.alb_sg.id
