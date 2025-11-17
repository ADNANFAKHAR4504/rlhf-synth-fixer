"""Integration tests for TAP Stack VPC infrastructure."""

import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed VPC infrastructure."""
    
    def _retry_aws_call(self, func, max_retries=3, delay=5):
        """Helper method to retry AWS API calls with exponential backoff."""
        import time
        for attempt in range(max_retries):
            try:
                return func()
            except ClientError as e:
                if attempt == max_retries - 1:
                    raise
                if "Throttling" in str(e) or "RequestLimitExceeded" in str(e):
                    wait_time = delay * (2 ** attempt)
                    print(f"AWS API throttled, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise
    
    def _validate_ci_environment(self):
        """Validate CI environment setup and warn about potential issues."""
        issues = []
        
        # Check AWS credentials environment
        if not os.getenv("AWS_ACCESS_KEY_ID") and not os.getenv("AWS_PROFILE"):
            issues.append("No AWS_ACCESS_KEY_ID or AWS_PROFILE found")
            
        # Check required outputs
        required_outputs = ["vpc_id", "public_subnet_ids", "private_subnet_ids"]
        missing_outputs = [out for out in required_outputs if not self.outputs.get(out)]
        if missing_outputs:
            issues.append(f"Missing required outputs: {missing_outputs}")
            
        # Check if region matches deployment region
        if self.region_name not in self.vpc_id:
            print(f"⚠️  Warning: Region {self.region_name} may not match VPC region")
            
        if issues:
            print(f"⚠️  CI Environment Issues Found:")
            for issue in issues:
                print(f"     - {issue}")
        else:
            print("✅ CI Environment validation passed")

    @pytest.fixture(autouse=True)
    def setup(self):
        """Load stack outputs and initialize AWS clients."""
        # Load outputs from flat-outputs.json
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}")

        try:
            with open(outputs_file, "r", encoding='utf-8') as f:
                self.outputs = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            pytest.skip(f"Failed to load outputs file {outputs_file}: {e}")

        # Initialize AWS clients - use AWS_REGION environment variable or default
        # Determine AWS region from environment or outputs
        self.region_name = os.getenv('AWS_REGION', 'ap-northeast-1')
        
        try:
            self.ec2_client = boto3.client("ec2", region_name=self.region_name)
            self.logs_client = boto3.client("logs", region_name=self.region_name)
            
            # Test AWS credentials by making a simple call
            self.ec2_client.describe_regions(RegionNames=[self.region_name])
        except Exception as e:
            pytest.skip(f"AWS credentials not available or invalid for region {self.region_name}: {e}")

        # Load dynamic configuration from environment or defaults
        self.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        self.expected_vpc_cidr = os.getenv("VPC_CIDR_BLOCK", "10.0.0.0/16")
        self.expected_flow_log_interval = int(os.getenv("FLOW_LOG_INTERVAL", "600"))
        self.expected_project_name = os.getenv("PROJECT_NAME", "PaymentGateway")
        self.expected_environment = os.getenv("ENVIRONMENT_NAME", "Production")

        # Calculate expected availability zones for the region
        self.expected_azs = [
            f"{self.region_name}a",
            f"{self.region_name}b", 
            f"{self.region_name}c"
        ]

        # Expected subnet CIDRs (can be configured via environment)
        self.expected_public_cidrs = os.getenv("PUBLIC_SUBNET_CIDRS", "10.0.1.0/24,10.0.2.0/24,10.0.3.0/24").split(",")
        self.expected_private_cidrs = os.getenv("PRIVATE_SUBNET_CIDRS", "10.0.11.0/24,10.0.12.0/24,10.0.13.0/24").split(",")

        # Get VPC ID from outputs
        self.vpc_id = self.outputs.get("vpc_id")
        if not self.vpc_id:
            pytest.skip("VPC ID not found in outputs")
            
        # CI/CD Debug information and validation (only in CI environments)
        if os.getenv("CI"):
            print(f"\n🔧 CI/CD Debug Info:")
            print(f"   Region: {self.region_name}")
            print(f"   Environment Suffix: {self.environment_suffix}")
            print(f"   VPC ID: {self.vpc_id}")
            print(f"   Expected VPC CIDR: {self.expected_vpc_cidr}")
            print(f"   Project: {self.expected_project_name}")
            print(f"   Available outputs: {list(self.outputs.keys())}")
            
            # Validate critical environment variables for CI/CD
            self._validate_ci_environment()

    def test_00_infrastructure_ready(self):
        """Test that basic infrastructure is ready (runs first)."""
        # This test ensures infrastructure is deployed and accessible
        def check_vpc():
            return self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        
        response = self._retry_aws_call(check_vpc)
        assert len(response["Vpcs"]) == 1, "VPC should exist and be accessible"

    def test_vpc_exists(self):
        """Test that VPC exists and has correct configuration."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        # Check CIDR block (dynamic)
        assert vpc["CidrBlock"] == self.expected_vpc_cidr

        # Check DNS settings using describe_vpc_attribute for accurate results
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute="enableDnsHostnames"
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute="enableDnsSupport"
        )
        
        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True
        assert dns_support["EnableDnsSupport"]["Value"] is True

    def test_vpc_tags(self):
        """Test that VPC has correct tags."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response["Vpcs"][0]

        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        # Dynamic tag checks
        assert tags.get("Environment") == self.expected_environment
        assert tags.get("Project") == self.expected_project_name
        assert tags.get("EnvironmentSuffix") == self.environment_suffix

    def test_public_subnets_exist(self):
        """Test that three public subnets exist with correct configuration."""
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])

        assert len(public_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response["Subnets"]

        # Check CIDR blocks (dynamic)
        actual_cidrs = sorted([subnet["CidrBlock"] for subnet in subnets])
        expected_cidrs = sorted(self.expected_public_cidrs)

        assert actual_cidrs == expected_cidrs

        # Check map_public_ip_on_launch is enabled
        for subnet in subnets:
            assert subnet["MapPublicIpOnLaunch"] is True

    def test_private_subnets_exist(self):
        """Test that three private subnets exist with correct configuration."""
        private_subnet_ids = self.outputs.get("private_subnet_ids", [])

        assert len(private_subnet_ids) == 3

        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response["Subnets"]

        # Check CIDR blocks (dynamic)
        actual_cidrs = sorted([subnet["CidrBlock"] for subnet in subnets])
        expected_cidrs = sorted(self.expected_private_cidrs)

        assert actual_cidrs == expected_cidrs

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

        # All should be in the correct region and match expected AZs
        for az in availability_zones:
            assert az.startswith(self.region_name)
            assert az in self.expected_azs

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
        """Test that NAT Gateway is in the first availability zone."""
        nat_gateway_id = self.outputs.get("nat_gateway_id")

        response = self.ec2_client.describe_nat_gateways(
            NatGatewayIds=[nat_gateway_id]
        )

        nat_gateways = response["NatGateways"]
        assert len(nat_gateways) == 1

        nat_gateway = nat_gateways[0]

        # Get the subnet the NAT gateway is in
        subnet_id = nat_gateway["SubnetId"]
        subnet_response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
        subnet = subnet_response["Subnets"][0]

        # Verify it's in the first AZ of the region (dynamic)
        expected_az = self.expected_azs[0]  # First AZ
        assert subnet["AvailabilityZone"] == expected_az

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

        # Check aggregation interval (dynamic based on deployment configuration)
        assert flow_log.get("MaxAggregationInterval") == self.expected_flow_log_interval

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
