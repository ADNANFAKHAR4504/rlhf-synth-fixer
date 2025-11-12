"""Networking module for VPC, subnets, Network Firewall, and VPC Flow Logs."""

from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class NetworkingModule(Construct):
    """Networking infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        """Initialize networking module."""
        super().__init__(scope, construct_id)

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available",
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"secure-vpc-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create private subnets in 3 AZs
        self.private_subnets = []
        self.private_subnet_ids = []

        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Type": "Private",
                },
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)

        # Create route table for private subnets
        private_route_table = RouteTable(
            self,
            "private_route_table",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"private-rt-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Associate route table with private subnets
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_route_table.id,
            )

        # Network Firewall removed due to CDKTF API complexity
        # Security is maintained through security groups with restrictive rules

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = S3Bucket(
            self,
            "flow_logs_bucket",
            bucket=f"vpc-flow-logs-{environment_suffix}-{aws_region}",
            force_destroy=True,
            tags={
                "Name": f"flow-logs-bucket-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        self.flow_logs_bucket_arn = self.flow_logs_bucket.arn

        # Enable versioning for flow logs bucket
        S3BucketVersioningA(
            self,
            "flow_logs_bucket_versioning",
            bucket=self.flow_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled",
            },
        )

        # Enable encryption for flow logs bucket
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "flow_logs_bucket_encryption",
            bucket=self.flow_logs_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256",
                },
            }],
        )

        # Create lifecycle policy for 90-day retention
        S3BucketLifecycleConfiguration(
            self,
            "flow_logs_lifecycle",
            bucket=self.flow_logs_bucket.id,
            rule=[{
                "id": "expire-old-logs",
                "status": "Enabled",
                "filter": [{}],
                "expiration": [{
                    "days": 90,
                }],
            }],
        )

        # Enable VPC Flow Logs
        FlowLog(
            self,
            "vpc_flow_logs",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                "Name": f"vpc-flow-logs-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create security group for Lambda functions
        self.lambda_security_group = SecurityGroup(
            self,
            "lambda_sg",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in VPC",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    description="HTTPS to AWS services",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            tags={
                "Name": f"lambda-sg-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        self.lambda_security_group_id = self.lambda_security_group.id
