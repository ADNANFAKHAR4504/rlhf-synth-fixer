"""TAP Stack implementation using CDKTF."""
from typing import Sequence
from constructs import Construct
from cdktf import TerraformStack, S3Backend, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider, AwsProviderDefaultTags
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TapStack(TerraformStack):
    """Infrastructure stack for TAP deployment."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str = "dev",
        state_bucket: str = "default-state-bucket",
        state_bucket_region: str = "us-east-1",
        aws_region: str = "us-east-1",
        vpc_cidr: str = "10.0.0.0/16",
        public_subnet_cidrs: Sequence[str] = ("10.0.1.0/24", "10.0.2.0/24"),
        instance_type: str = "t2.micro",
        ami_id: str = "ami-0c55b159cbfafe1f0",
        allowed_ssh_cidr: str = "0.0.0.0/0",
        allowed_http_cidr: str = "0.0.0.0/0",
        project_name: str = "tap"
    ):
        """Initialize TAP Stack."""
        super().__init__(scope, id)

        # Helper method for consistent tagging
        def create_tags(name: str) -> dict:
            return {
                "Name": f"{project_name}-{name}-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": project_name
            }

        # AWS Provider configuration
        provider_tags = AwsProviderDefaultTags(
            tags={
                "Environment": environment_suffix,
                "Project": project_name,
                "ManagedBy": "CDKTF"
            }
        )

        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[provider_tags]
        )

        # VPC
        vpc = Vpc(
            self,
            "MainVPC",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=create_tags("vpc")
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            "IGW",
            vpc_id=vpc.id,
            tags=create_tags("igw")
        )

        # Route Table
        rt = RouteTable(
            self,
            "PublicRT",
            vpc_id=vpc.id,
            tags=create_tags("rt")
        )

        Route(
            self,
            "IGWRoute",
            route_table_id=rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Create subnets with static AZ allocation
        subnets = []
        for idx, cidr in enumerate(public_subnet_cidrs):
            az_letter = chr(97 + (idx % 2))  # 'a' or 'b'
            subnet = Subnet(
                self,
                f"PublicSubnet{idx+1}",
                vpc_id=vpc.id,
                cidr_block=cidr,
                availability_zone=f"{aws_region}{az_letter}",  # e.g., us-east-1a
                map_public_ip_on_launch=True,
                tags=create_tags(f"subnet-{idx+1}")
            )
            
            RouteTableAssociation(
                self,
                f"RTAssociation{idx+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id
            )
            subnets.append(subnet)

        # Security Group
        sg = SecurityGroup(
            self,
            "WebSG",
            name=f"{project_name}-sg-{environment_suffix}",
            description="Allow HTTP and SSH traffic",
            vpc_id=vpc.id,
            tags=create_tags("sg")
        )

        SecurityGroupRule(
            self,
            "SGRuleSSH",
            type="ingress",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=[allowed_ssh_cidr],
            security_group_id=sg.id
        )

        SecurityGroupRule(
            self,
            "SGRuleHTTP",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=[allowed_http_cidr],
            security_group_id=sg.id
        )

        SecurityGroupRule(
            self,
            "SGRuleEgress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id
        )

        # EC2 Instances
        instances = []
        for idx, subnet in enumerate(subnets):
            instance = Instance(
                self,
                f"WebServer{idx+1}",
                ami=ami_id,
                instance_type=instance_type,
                subnet_id=subnet.id,
                vpc_security_group_ids=[sg.id],
                tags=create_tags(f"instance-{idx+1}")
            )
            instances.append(instance)

        # Outputs
        TerraformOutput(self, "vpc_id", value=vpc.id)
        TerraformOutput(self, "subnet_ids", value=[s.id for s in subnets])
        TerraformOutput(self, "instance_ips", value=[i.public_ip for i in instances])