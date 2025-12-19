# CDKTF Python VPC Infrastructure Implementation

This implementation creates a production-ready VPC environment with proper network segmentation for a payment gateway application.

## File: lib/__init__.py

```python
"""TAP Stack library module."""
```

## File: lib/tap_stack.py

```python
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
            max_aggregation_interval=300,  # 5 minutes
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
```

## File: tap.py

```python
#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "ap-northeast-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
```

## File: tests/__init__.py

```python
"""Tests package for TAP Stack."""
```

## File: tests/unit/__init__.py

```python
"""Unit tests package."""
```

## File: tests/unit/test_tap_stack.py

```python
"""Unit tests for TAP Stack VPC infrastructure."""

import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Unit tests for the TapStack."""

    def setup_method(self):
        """Set up test fixtures."""
        self.stack_name = "TestStack"
        self.environment_suffix = "test"

    def test_stack_creation(self):
        """Test that the stack can be created successfully."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_configuration(self):
        """Test VPC is created with correct CIDR block."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check VPC exists with correct CIDR
        assert any(
            resource.get("type") == "aws_vpc" and
            resource.get("cidr_block") == "10.0.0.0/16"
            for resource in synthesized.get("resource", {}).get("aws_vpc", {}).values()
        )

    def test_public_subnets_count(self):
        """Test that three public subnets are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Count public subnets
        public_subnets = [
            resource for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
            if "public" in resource.get("tags", {}).get("Type", "").lower()
        ]

        assert len(public_subnets) >= 3

    def test_private_subnets_count(self):
        """Test that three private subnets are created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Count private subnets
        private_subnets = [
            resource for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
            if "private" in resource.get("tags", {}).get("Type", "").lower()
        ]

        assert len(private_subnets) >= 3

    def test_subnet_cidr_blocks(self):
        """Test that subnets have correct CIDR blocks."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Expected CIDR blocks
        expected_public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        expected_private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

        subnet_cidrs = [
            resource.get("cidr_block")
            for resource in synthesized.get("resource", {}).get("aws_subnet", {}).values()
        ]

        # Check all expected CIDRs are present
        for cidr in expected_public_cidrs + expected_private_cidrs:
            assert cidr in subnet_cidrs

    def test_internet_gateway_created(self):
        """Test that Internet Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check IGW exists
        assert "aws_internet_gateway" in synthesized.get("resource", {})

    def test_nat_gateway_created(self):
        """Test that NAT Gateway is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check NAT Gateway exists
        assert "aws_nat_gateway" in synthesized.get("resource", {})

        # Check EIP for NAT Gateway exists
        assert "aws_eip" in synthesized.get("resource", {})

    def test_route_tables_created(self):
        """Test that route tables are created for public and private subnets."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check route tables exist
        assert "aws_route_table" in synthesized.get("resource", {})

        # Should have at least 2 route tables (public and private)
        route_tables = synthesized.get("resource", {}).get("aws_route_table", {})
        assert len(route_tables) >= 2

    def test_vpc_flow_logs_configured(self):
        """Test that VPC Flow Logs are configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check Flow Log exists
        assert "aws_flow_log" in synthesized.get("resource", {})

        # Check CloudWatch Log Group exists
        assert "aws_cloudwatch_log_group" in synthesized.get("resource", {})

    def test_flow_logs_retention(self):
        """Test that Flow Logs retention is set to 7 days."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check log group retention
        log_groups = synthesized.get("resource", {}).get("aws_cloudwatch_log_group", {})

        assert any(
            lg.get("retention_in_days") == 7
            for lg in log_groups.values()
        )

    def test_s3_vpc_endpoint_created(self):
        """Test that S3 VPC Endpoint is created."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check S3 VPC Endpoint exists
        assert "aws_vpc_endpoint" in synthesized.get("resource", {})

    def test_resource_tagging(self):
        """Test that resources are tagged correctly."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check VPC tags
        vpcs = synthesized.get("resource", {}).get("aws_vpc", {})
        for vpc in vpcs.values():
            tags = vpc.get("tags", {})
            assert tags.get("Environment") == "Production"
            assert tags.get("Project") == "PaymentGateway"
            assert "EnvironmentSuffix" in tags

    def test_environment_suffix_in_names(self):
        """Test that environment_suffix is included in resource names."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check VPC name includes suffix
        vpcs = synthesized.get("resource", {}).get("aws_vpc", {})
        for vpc in vpcs.values():
            name = vpc.get("tags", {}).get("Name", "")
            assert self.environment_suffix in name

    def test_outputs_defined(self):
        """Test that all required outputs are defined."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check outputs exist
        outputs = synthesized.get("output", {})

        expected_outputs = [
            "vpc_id",
            "public_subnet_ids",
            "private_subnet_ids",
            "nat_gateway_id",
            "s3_endpoint_id"
        ]

        for output_name in expected_outputs:
            assert output_name in outputs

    def test_iam_role_for_flow_logs(self):
        """Test that IAM role is created for VPC Flow Logs."""
        app = Testing.app()
        stack = TapStack(
            app,
            self.stack_name,
            environment_suffix=self.environment_suffix,
            aws_region="ap-northeast-1",
        )

        synthesized = Testing.synth(stack)

        # Check IAM role exists
        assert "aws_iam_role" in synthesized.get("resource", {})

        # Check IAM policy exists
        assert "aws_iam_role_policy" in synthesized.get("resource", {})
```

## File: tests/integration/__init__.py

```python
"""Integration tests package."""
```

## File: tests/integration/test_tap_stack.py

```python
"""Integration tests for TAP Stack VPC infrastructure."""

import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed VPC infrastructure."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Load stack outputs and initialize AWS clients."""
        # Load outputs from flat-outputs.json
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, "r") as f:
            self.outputs = json.load(f)

        # Initialize AWS clients
        self.ec2_client = boto3.client("ec2", region_name="ap-northeast-1")
        self.logs_client = boto3.client("logs", region_name="ap-northeast-1")

        # Get VPC ID from outputs
        self.vpc_id = self.outputs.get("vpc_id")
        if not self.vpc_id:
            pytest.skip("VPC ID not found in outputs")

    def test_vpc_exists(self):
        """Test that VPC exists and has correct configuration."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        # Check CIDR block
        assert vpc["CidrBlock"] == "10.0.0.0/16"

        # Check DNS settings
        assert vpc["EnableDnsHostnames"] is True
        assert vpc["EnableDnsSupport"] is True

    def test_vpc_tags(self):
        """Test that VPC has correct tags."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response["Vpcs"][0]

        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        assert tags.get("Environment") == "Production"
        assert tags.get("Project") == "PaymentGateway"

    def test_public_subnets_exist(self):
        """Test that three public subnets exist with correct configuration."""
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])

        assert len(public_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response["Subnets"]

        # Check CIDR blocks
        expected_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
        actual_cidrs = sorted([subnet["CidrBlock"] for subnet in subnets])

        assert actual_cidrs == sorted(expected_cidrs)

        # Check map_public_ip_on_launch is enabled
        for subnet in subnets:
            assert subnet["MapPublicIpOnLaunch"] is True

    def test_private_subnets_exist(self):
        """Test that three private subnets exist with correct configuration."""
        private_subnet_ids = self.outputs.get("private_subnet_ids", [])

        assert len(private_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response["Subnets"]

        # Check CIDR blocks
        expected_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
        actual_cidrs = sorted([subnet["CidrBlock"] for subnet in subnets])

        assert actual_cidrs == sorted(expected_cidrs)

        # Check map_public_ip_on_launch is disabled
        for subnet in subnets:
            assert subnet["MapPublicIpOnLaunch"] is False

    def test_availability_zones(self):
        """Test that subnets span three availability zones."""
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])
        private_subnet_ids = self.outputs.get("private_subnet_ids", [])

        all_subnet_ids = public_subnet_ids + private_subnet_ids

        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)
        subnets = response["Subnets"]

        availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)

        # Should have 3 unique AZs
        assert len(availability_zones) == 3

        # All should be in ap-northeast-1 region
        for az in availability_zones:
            assert az.startswith("ap-northeast-1")

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached to VPC."""
        igw_id = self.outputs.get("internet_gateway_id")

        assert igw_id is not None

        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[igw_id]
        )

        assert len(response["InternetGateways"]) == 1
        igw = response["InternetGateways"][0]

        # Check attachment
        attachments = igw.get("Attachments", [])
        assert len(attachments) == 1
        assert attachments[0]["VpcId"] == self.vpc_id
        assert attachments[0]["State"] == "available"

    def test_nat_gateway_exists(self):
        """Test that NAT Gateway exists in first public subnet."""
        nat_gateway_id = self.outputs.get("nat_gateway_id")
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])

        assert nat_gateway_id is not None

        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=[nat_gateway_id]
        )

        assert len(response["NatGateways"]) == 1
        nat_gw = response["NatGateways"][0]

        # Check state
        assert nat_gw["State"] == "available"

        # Check subnet (should be in first public subnet)
        assert nat_gw["SubnetId"] == public_subnet_ids[0]

        # Check EIP is allocated
        assert len(nat_gw["NatGatewayAddresses"]) == 1

    def test_nat_gateway_in_correct_az(self):
        """Test that NAT Gateway is in ap-northeast-1a."""
        nat_gateway_id = self.outputs.get("nat_gateway_id")

        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=[nat_gateway_id]
        )

        nat_gw = response["NatGateways"][0]
        subnet_id = nat_gw["SubnetId"]

        # Get subnet details
        subnet_response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
        subnet = subnet_response["Subnets"][0]

        assert subnet["AvailabilityZone"] == "ap-northeast-1a"

    def test_public_route_table_configuration(self):
        """Test that public subnets route to Internet Gateway."""
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])
        igw_id = self.outputs.get("internet_gateway_id")

        for subnet_id in public_subnet_ids:
            # Get route table for subnet
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {"Name": "association.subnet-id", "Values": [subnet_id]}
                ]
            )

            assert len(response["RouteTables"]) == 1
            route_table = response["RouteTables"][0]

            # Check default route to IGW
            routes = route_table["Routes"]
            default_route = next(
                (r for r in routes if r.get("DestinationCidrBlock") == "0.0.0.0/0"),
                None
            )

            assert default_route is not None
            assert default_route.get("GatewayId") == igw_id

    def test_private_route_table_configuration(self):
        """Test that private subnets route to NAT Gateway."""
        private_subnet_ids = self.outputs.get("private_subnet_ids", [])
        nat_gateway_id = self.outputs.get("nat_gateway_id")

        for subnet_id in private_subnet_ids:
            # Get route table for subnet
            response = self.ec2_client.describe_route_tables(
                Filters=[
                    {"Name": "association.subnet-id", "Values": [subnet_id]}
                ]
            )

            assert len(response["RouteTables"]) == 1
            route_table = response["RouteTables"][0]

            # Check default route to NAT Gateway
            routes = route_table["Routes"]
            default_route = next(
                (r for r in routes if r.get("DestinationCidrBlock") == "0.0.0.0/0"),
                None
            )

            assert default_route is not None
            assert default_route.get("NatGatewayId") == nat_gateway_id

    def test_s3_vpc_endpoint_exists(self):
        """Test that S3 VPC Endpoint exists and is configured correctly."""
        s3_endpoint_id = self.outputs.get("s3_endpoint_id")

        assert s3_endpoint_id is not None

        response = self.ec2_client.describe_vpc_endpoints(
            VpcEndpointIds=[s3_endpoint_id]
        )

        assert len(response["VpcEndpoints"]) == 1
        endpoint = response["VpcEndpoints"][0]

        # Check endpoint type
        assert endpoint["VpcEndpointType"] == "Gateway"

        # Check service name
        assert "s3" in endpoint["ServiceName"]

        # Check state
        assert endpoint["State"] == "available"

        # Check VPC
        assert endpoint["VpcId"] == self.vpc_id

    def test_s3_endpoint_route_table_association(self):
        """Test that S3 endpoint is associated with private route tables."""
        s3_endpoint_id = self.outputs.get("s3_endpoint_id")

        response = self.ec2_client.describe_vpc_endpoints(
            VpcEndpointIds=[s3_endpoint_id]
        )

        endpoint = response["VpcEndpoints"][0]
        route_table_ids = endpoint.get("RouteTableIds", [])

        # Should have at least one route table associated
        assert len(route_table_ids) >= 1

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {"Name": "resource-id", "Values": [self.vpc_id]}
            ]
        )

        flow_logs = response["FlowLogs"]

        assert len(flow_logs) >= 1

        flow_log = flow_logs[0]

        # Check traffic type
        assert flow_log["TrafficType"] == "ALL"

        # Check log destination type
        assert flow_log["LogDestinationType"] == "cloud-watch-logs"

        # Check state
        assert flow_log["FlowLogStatus"] == "ACTIVE"

        # Check aggregation interval (5 minutes = 300 seconds)
        assert flow_log.get("MaxAggregationInterval") == 300

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch Log Group exists for Flow Logs."""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {"Name": "resource-id", "Values": [self.vpc_id]}
            ]
        )

        flow_logs = response["FlowLogs"]
        assert len(flow_logs) >= 1

        log_destination = flow_logs[0]["LogDestination"]
        log_group_name = log_destination.split(":")[-1]

        # Check log group exists
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        assert len(response["logGroups"]) >= 1

    def test_flow_logs_retention_period(self):
        """Test that Flow Logs retention is set to 7 days."""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {"Name": "resource-id", "Values": [self.vpc_id]}
            ]
        )

        flow_logs = response["FlowLogs"]
        assert len(flow_logs) >= 1

        log_destination = flow_logs[0]["LogDestination"]
        log_group_name = log_destination.split(":")[-1]

        # Check retention
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_group = response["logGroups"][0]

        # Retention should be 7 days
        assert log_group.get("retentionInDays") == 7

    def test_all_outputs_present(self):
        """Test that all required outputs are present."""
        required_outputs = [
            "vpc_id",
            "public_subnet_ids",
            "private_subnet_ids",
            "nat_gateway_id",
            "s3_endpoint_id",
            "internet_gateway_id"
        ]

        for output_name in required_outputs:
            assert output_name in self.outputs, f"Missing output: {output_name}"
            assert self.outputs[output_name] is not None

    def test_subnet_ids_are_lists(self):
        """Test that subnet ID outputs are lists."""
        public_subnet_ids = self.outputs.get("public_subnet_ids")
        private_subnet_ids = self.outputs.get("private_subnet_ids")

        assert isinstance(public_subnet_ids, list)
        assert isinstance(private_subnet_ids, list)

        assert len(public_subnet_ids) == 3
        assert len(private_subnet_ids) == 3
```

## File: lib/README.md

```markdown
# Payment Gateway VPC Infrastructure

This CDKTF Python implementation creates a production-ready VPC environment with proper network segmentation for a payment gateway application.

## Architecture Overview

The infrastructure creates:

- VPC with CIDR block 10.0.0.0/16 across 3 availability zones in ap-northeast-1
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for load balancers
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for application servers
- Internet Gateway for public subnet internet access
- Single NAT Gateway in first public subnet (ap-northeast-1a) for cost optimization
- S3 VPC Endpoint (Gateway type) for private S3 access
- VPC Flow Logs to CloudWatch with 5-minute aggregation intervals
- IAM role with least privilege for VPC Flow Logs

## Components

### Networking

- **VPC**: 10.0.0.0/16 with DNS hostnames and DNS support enabled
- **Public Subnets**: 3 subnets across 3 AZs with public IP assignment enabled
- **Private Subnets**: 3 subnets across 3 AZs with no public IP assignment
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: Single NAT Gateway in ap-northeast-1a for private subnet internet access
- **Route Tables**: Separate route tables for public and private subnets with explicit associations

### Security & Monitoring

- **VPC Flow Logs**: Captures all network traffic (ACCEPT, REJECT, ALL)
- **CloudWatch Log Group**: Stores flow logs with 7-day retention
- **IAM Role**: Least privilege role for VPC Flow Logs to write to CloudWatch
- **Tags**: All resources tagged with Environment=Production and Project=PaymentGateway

### VPC Endpoints

- **S3 Gateway Endpoint**: Enables private subnet access to S3 without internet

## Prerequisites

- Python 3.9 or higher
- CDKTF CLI installed (`npm install -g cdktf-cli`)
- AWS credentials configured
- Terraform installed

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Generate CDKTF provider bindings:

```bash
cdktf get
```

## Configuration

The stack accepts the following configuration via environment variables:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: "dev")
- `AWS_REGION`: Target AWS region (default: "ap-northeast-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state (default: "iac-rlhf-tf-states")
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (default: "us-east-1")
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging

## Deployment

1. Synthesize the CDKTF configuration:

```bash
cdktf synth
```

2. Deploy the infrastructure:

```bash
cdktf deploy
```

3. Confirm deployment when prompted.

## Testing

### Unit Tests

Run unit tests to verify stack configuration:

```bash
pytest tests/unit/ -v
```

### Integration Tests

After deployment, run integration tests to verify deployed resources:

```bash
pytest tests/integration/ -v
```

Integration tests load outputs from `cfn-outputs/flat-outputs.json` and validate:

- VPC configuration and CIDR blocks
- Subnet configuration and availability zones
- Internet Gateway and NAT Gateway configuration
- Route table configurations
- S3 VPC Endpoint configuration
- VPC Flow Logs and CloudWatch Log Group settings
- Resource tags and naming conventions

## Outputs

The stack exports the following outputs for cross-stack references:

- `vpc_id`: VPC ID
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_id`: NAT Gateway ID
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `internet_gateway_id`: Internet Gateway ID

## Cost Optimization

- Single NAT Gateway instead of one per AZ (reduces costs significantly)
- Gateway VPC Endpoint for S3 (no data transfer charges)
- VPC Flow Logs with 7-day retention (minimal storage costs)

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

Confirm destruction when prompted. All resources will be removed (no Retain policies).

## Network Flow

1. **Public Subnet Traffic**:
   - Resources in public subnets → Route Table → Internet Gateway → Internet

2. **Private Subnet Traffic**:
   - Resources in private subnets → Route Table → NAT Gateway → Internet Gateway → Internet
   - Resources in private subnets → Route Table → S3 VPC Endpoint → S3 (no internet)

3. **Logging**:
   - All traffic → VPC Flow Logs → CloudWatch Log Group (5-minute intervals)

## Security Considerations

- Private subnets cannot be accessed from the internet
- Private subnets can initiate outbound connections through NAT Gateway
- S3 access from private subnets doesn't traverse the internet
- All network traffic is logged for compliance and auditing
- IAM role follows principle of least privilege
- Flow logs retained for 7 days for compliance purposes

## Compliance

This infrastructure meets the following requirements:

- Network segmentation with public/private subnets
- Comprehensive logging of all network traffic
- 7-day log retention for audit purposes
- Controlled internet access through NAT Gateway
- Private access to AWS services via VPC Endpoints
- Explicit tagging for environment identification
