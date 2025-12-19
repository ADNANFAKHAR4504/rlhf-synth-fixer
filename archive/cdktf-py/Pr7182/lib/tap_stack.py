"""VPC Stack module for CDKTF Python infrastructure - Financial Services Platform."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.network_acl import (
    NetworkAcl,
    NetworkAclEgress,
    NetworkAclIngress
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock


class TapStack(TerraformStack):
    """Production-ready VPC stack for financial services platform."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the VPC stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
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

        # Common tags for all resources
        project_name = kwargs.get('project_name', 'DigitalBanking')
        common_tags = {
            "Project": project_name,
            "ManagedBy": "CDKTF"
        }

        # Define availability zones dynamically based on region
        availability_zones = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # Create VPC with DNS support
        vpc = Vpc(self, f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": f"vpc-{environment_suffix}"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(self, f"igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"igw-{environment_suffix}"
            }
        )

        # Create S3 bucket for VPC Flow Logs
        flow_logs_bucket = S3Bucket(
            self,
            f"flow-logs-bucket-{environment_suffix}",
            bucket=f"vpc-flow-logs-{environment_suffix}-{construct_id}".lower(),
            force_destroy=True,
            tags={
                **common_tags,
                "Name": f"flow-logs-bucket-{environment_suffix}"
            }
        )

        # Enable versioning on S3 bucket
        S3BucketVersioningA(self, f"flow-logs-versioning-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Block public access to S3 bucket
        S3BucketPublicAccessBlock(self, f"flow-logs-public-block-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Configure S3 lifecycle policy for Glacier transition after 30 days
        S3BucketLifecycleConfiguration(self, f"flow-logs-lifecycle-{environment_suffix}",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="transition-to-glacier",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=30,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # Enable VPC Flow Logs to S3
        FlowLog(self, f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={
                **common_tags,
                "Name": f"vpc-flow-log-{environment_suffix}"
            }
        )

        # Create subnets (public and private) across 3 AZs
        public_subnets = []
        private_subnets = []

        for i, az in enumerate(availability_zones):
            # Public subnet in each AZ (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
            public_subnet = Subnet(self, f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **common_tags,
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public"
                }
            )
            public_subnets.append(public_subnet)

            # Private subnet in each AZ (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
            private_subnet = Subnet(self, f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private"
                }
            )
            private_subnets.append(private_subnet)

        # Create NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        nat_gateway_ips = []

        for i, public_subnet in enumerate(public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = Eip(self, f"nat-eip-{i+1}-{environment_suffix}",
                domain="vpc",
                tags={
                    **common_tags,
                    "Name": f"nat-eip-{i+1}-{environment_suffix}"
                }
            )
            nat_gateway_ips.append(eip.public_ip)

            # Create NAT Gateway in public subnet
            nat = NatGateway(self, f"nat-gateway-{i+1}-{environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **common_tags,
                    "Name": f"nat-gateway-{i+1}-{environment_suffix}"
                }
            )
            nat_gateways.append(nat)

        # Create public route table
        public_route_table = RouteTable(self, f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": f"public-rt-{environment_suffix}"
            }
        )

        # Route to Internet Gateway for public subnets
        Route(self, f"public-route-{environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with public route table
        for i, public_subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=public_subnet.id,
                route_table_id=public_route_table.id
            )

        # Create private route tables (one per AZ with NAT Gateway)
        for i, (private_subnet, nat_gateway) in enumerate(zip(private_subnets, nat_gateways)):
            private_route_table = RouteTable(self, f"private-rt-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    **common_tags,
                    "Name": f"private-rt-{i+1}-{environment_suffix}"
                }
            )

            # Route to NAT Gateway for private subnet
            Route(self, f"private-route-{i+1}-{environment_suffix}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )

            # Associate private subnet with private route table
            RouteTableAssociation(self, f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_route_table.id
            )

        # Create custom Network ACL with deny-all baseline
        NetworkAcl(self, f"nacl-{environment_suffix}",
            vpc_id=vpc.id,
            subnet_ids=[s.id for s in public_subnets + private_subnets],
            # Deny all inbound traffic by default
            ingress=[
                NetworkAclIngress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            # Deny all outbound traffic by default
            egress=[
                NetworkAclEgress(
                    protocol="-1",
                    rule_no=100,
                    action="deny",
                    cidr_block="0.0.0.0/0",
                    from_port=0,
                    to_port=0
                )
            ],
            tags={
                **common_tags,
                "Name": f"nacl-{environment_suffix}",
                "Note": "Baseline deny-all NACL - exceptions must be documented"
            }
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="The ID of the VPC"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="List of public subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="List of private subnet IDs"
        )

        TerraformOutput(self, "nat_gateway_ips",
            value=nat_gateway_ips,
            description="List of NAT Gateway public IP addresses"
        )

        TerraformOutput(self, "flow_logs_bucket",
            value=flow_logs_bucket.bucket,
            description="S3 bucket name for VPC Flow Logs"
        )
