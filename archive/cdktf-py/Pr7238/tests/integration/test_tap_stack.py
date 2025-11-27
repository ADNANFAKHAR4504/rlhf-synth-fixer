"""Integration tests for TapStack - testing live AWS resources."""
import json
import os

import boto3
import pytest


# Get environment variables
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
aws_region = os.environ.get("AWS_REGION", "us-east-1")

# Read outputs from flat-outputs.json
outputs_path = os.path.join(os.getcwd(), "cfn-outputs", "flat-outputs.json")
with open(outputs_path, "r", encoding="utf-8") as f:
    all_outputs = json.load(f)

# Get stack outputs - stack name follows pattern tapstack{suffix}
stack_name = f"tapstack{environment_suffix}"
outputs = all_outputs.get(stack_name, {})

# Extract output values
vpc_id = outputs.get("vpc_id")
public_subnet_ids = outputs.get("public_subnet_ids", [])
private_subnet_ids = outputs.get("private_subnet_ids", [])
nat_gateway_ips = outputs.get("nat_gateway_ips", [])

# Initialize AWS clients
ec2_client = boto3.client("ec2", region_name=aws_region)
s3_client = boto3.client("s3", region_name=aws_region)


class TestVpcIntegration:
    """Integration tests for VPC resources."""

    def test_vpc_exists(self):
        """Verify VPC exists in AWS."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response.get("Vpcs", [])
        assert len(vpcs) == 1
        assert vpcs[0]["VpcId"] == vpc_id

    def test_vpc_has_correct_cidr(self):
        """Verify VPC has correct CIDR block."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"

    def test_vpc_has_dns_support_enabled(self):
        """Verify VPC has DNS support enabled."""
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsSupport"
        )
        assert response["EnableDnsSupport"]["Value"] is True

    def test_vpc_has_dns_hostnames_enabled(self):
        """Verify VPC has DNS hostnames enabled."""
        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsHostnames"
        )
        assert response["EnableDnsHostnames"]["Value"] is True

    def test_vpc_has_correct_tags(self):
        """Verify VPC has correct tags."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        assert tags.get("Environment") == environment_suffix
        assert tags.get("Project") == "DigitalBanking"

    def test_vpc_is_available(self):
        """Verify VPC state is available."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"


class TestSubnetIntegration:
    """Integration tests for subnet resources."""

    def test_public_subnets_exist(self):
        """Verify public subnets exist in AWS."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        subnets = response.get("Subnets", [])
        assert len(subnets) == len(public_subnet_ids)

    def test_private_subnets_exist(self):
        """Verify private subnets exist in AWS."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        subnets = response.get("Subnets", [])
        assert len(subnets) == len(private_subnet_ids)

    def test_public_subnets_belong_to_vpc(self):
        """Verify public subnets belong to the correct VPC."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["VpcId"] == vpc_id

    def test_private_subnets_belong_to_vpc(self):
        """Verify private subnets belong to the correct VPC."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["VpcId"] == vpc_id

    def test_public_subnets_map_public_ip(self):
        """Verify public subnets map public IP on launch."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] is True

    def test_private_subnets_do_not_map_public_ip(self):
        """Verify private subnets do not map public IP on launch."""
        response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] is False

    def test_subnets_are_available(self):
        """Verify all subnets are in available state."""
        all_subnet_ids = public_subnet_ids + private_subnet_ids
        response = ec2_client.describe_subnets(SubnetIds=all_subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["State"] == "available"

    def test_subnets_in_different_availability_zones(self):
        """Verify subnets are distributed across availability zones."""
        response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        azs = {subnet["AvailabilityZone"] for subnet in response["Subnets"]}
        assert len(azs) == len(public_subnet_ids)


class TestInternetGatewayIntegration:
    """Integration tests for Internet Gateway resources."""

    def test_internet_gateway_attached_to_vpc(self):
        """Verify Internet Gateway is attached to VPC."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        igws = response.get("InternetGateways", [])
        assert len(igws) == 1
        attachments = igws[0].get("Attachments", [])
        assert len(attachments) == 1
        assert attachments[0]["VpcId"] == vpc_id
        assert attachments[0]["State"] == "available"

    def test_internet_gateway_has_correct_tags(self):
        """Verify Internet Gateway has correct tags."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        igw = response["InternetGateways"][0]
        tags = {tag["Key"]: tag["Value"] for tag in igw.get("Tags", [])}
        assert tags.get("Environment") == environment_suffix
        assert tags.get("Project") == "DigitalBanking"


class TestNatGatewayIntegration:
    """Integration tests for NAT Gateway resources."""

    def test_nat_gateways_exist(self):
        """Verify NAT Gateways exist in AWS."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nats = [n for n in response.get("NatGateways", []) if n["State"] == "available"]
        assert len(nats) == len(nat_gateway_ips)

    def test_nat_gateways_have_public_ips(self):
        """Verify NAT Gateways have public IP addresses."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nats = [n for n in response.get("NatGateways", []) if n["State"] == "available"]
        public_ips = []
        for nat in nats:
            for address in nat.get("NatGatewayAddresses", []):
                if address.get("PublicIp"):
                    public_ips.append(address["PublicIp"])
        for expected_ip in nat_gateway_ips:
            assert expected_ip in public_ips

    def test_nat_gateways_are_available(self):
        """Verify NAT Gateways are in available state."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nats = [n for n in response.get("NatGateways", []) if n["State"] != "deleted"]
        for nat in nats:
            assert nat["State"] == "available"

    def test_nat_gateways_in_public_subnets(self):
        """Verify NAT Gateways are in public subnets."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nats = [n for n in response.get("NatGateways", []) if n["State"] == "available"]
        for nat in nats:
            assert nat["SubnetId"] in public_subnet_ids


class TestRouteTableIntegration:
    """Integration tests for Route Table resources."""

    def test_public_route_table_exists(self):
        """Verify public route table exists with internet gateway route."""
        response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        route_tables = response.get("RouteTables", [])
        # Find route table with IGW route
        igw_route_tables = []
        for rt in route_tables:
            for route in rt.get("Routes", []):
                if route.get("GatewayId", "").startswith("igw-"):
                    igw_route_tables.append(rt)
                    break
        assert len(igw_route_tables) >= 1

    def test_private_route_tables_exist_with_nat_routes(self):
        """Verify private route tables exist with NAT gateway routes."""
        response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        route_tables = response.get("RouteTables", [])
        # Find route tables with NAT gateway routes
        nat_route_tables = []
        for rt in route_tables:
            for route in rt.get("Routes", []):
                if route.get("NatGatewayId", "").startswith("nat-"):
                    nat_route_tables.append(rt)
                    break
        assert len(nat_route_tables) == len(private_subnet_ids)

    def test_public_subnets_associated_with_public_route_table(self):
        """Verify public subnets are associated with route table containing IGW route."""
        for subnet_id in public_subnet_ids:
            response = ec2_client.describe_route_tables(
                Filters=[{"Name": "association.subnet-id", "Values": [subnet_id]}]
            )
            route_tables = response.get("RouteTables", [])
            assert len(route_tables) == 1
            # Check for IGW route
            has_igw_route = False
            for route in route_tables[0].get("Routes", []):
                if route.get("GatewayId", "").startswith("igw-"):
                    has_igw_route = True
                    break
            assert has_igw_route


class TestFlowLogIntegration:
    """Integration tests for VPC Flow Log resources."""

    def test_vpc_flow_log_exists(self):
        """Verify VPC Flow Log exists."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        assert len(flow_logs) >= 1

    def test_flow_log_is_active(self):
        """Verify VPC Flow Log is active."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        active_logs = [fl for fl in flow_logs if fl["FlowLogStatus"] == "ACTIVE"]
        assert len(active_logs) >= 1

    def test_flow_log_captures_all_traffic(self):
        """Verify Flow Log captures all traffic types."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        all_traffic_logs = [fl for fl in flow_logs if fl["TrafficType"] == "ALL"]
        assert len(all_traffic_logs) >= 1

    def test_flow_log_uses_s3_destination(self):
        """Verify Flow Log uses S3 as destination."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        s3_logs = [fl for fl in flow_logs if fl["LogDestinationType"] == "s3"]
        assert len(s3_logs) >= 1


class TestS3BucketIntegration:
    """Integration tests for S3 bucket resources."""

    def test_flow_logs_bucket_exists(self):
        """Verify S3 bucket for flow logs exists."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        s3_logs = [fl for fl in flow_logs if fl["LogDestinationType"] == "s3"]
        assert len(s3_logs) >= 1
        # Extract bucket name from destination ARN
        destination_arn = s3_logs[0]["LogDestination"]
        bucket_name = destination_arn.replace("arn:aws:s3:::", "")
        # Verify bucket exists
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_flow_logs_bucket_has_versioning_enabled(self):
        """Verify S3 bucket has versioning enabled."""
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )
        flow_logs = response.get("FlowLogs", [])
        s3_logs = [fl for fl in flow_logs if fl["LogDestinationType"] == "s3"]
        destination_arn = s3_logs[0]["LogDestination"]
        bucket_name = destination_arn.replace("arn:aws:s3:::", "")
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"


class TestNetworkAclIntegration:
    """Integration tests for Network ACL resources."""

    def test_custom_network_acl_exists(self):
        """Verify custom Network ACL exists for VPC."""
        response = ec2_client.describe_network_acls(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nacls = response.get("NetworkAcls", [])
        # Filter out default NACL
        custom_nacls = [n for n in nacls if not n["IsDefault"]]
        assert len(custom_nacls) >= 1

    def test_network_acl_has_correct_tags(self):
        """Verify custom Network ACL has correct tags."""
        response = ec2_client.describe_network_acls(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        nacls = response.get("NetworkAcls", [])
        custom_nacls = [n for n in nacls if not n["IsDefault"]]
        for nacl in custom_nacls:
            tags = {tag["Key"]: tag["Value"] for tag in nacl.get("Tags", [])}
            if tags.get("Environment") == environment_suffix:
                assert tags.get("Project") == "DigitalBanking"


class TestElasticIpIntegration:
    """Integration tests for Elastic IP resources."""

    def test_elastic_ips_exist(self):
        """Verify Elastic IPs for NAT Gateways exist."""
        response = ec2_client.describe_addresses(
            PublicIps=nat_gateway_ips
        )
        addresses = response.get("Addresses", [])
        assert len(addresses) == len(nat_gateway_ips)

    def test_elastic_ips_are_associated(self):
        """Verify Elastic IPs are associated with NAT Gateways."""
        response = ec2_client.describe_addresses(
            PublicIps=nat_gateway_ips
        )
        for address in response.get("Addresses", []):
            assert address.get("AssociationId") is not None

    def test_elastic_ips_have_correct_tags(self):
        """Verify Elastic IPs have correct tags."""
        response = ec2_client.describe_addresses(
            PublicIps=nat_gateway_ips
        )
        for address in response.get("Addresses", []):
            tags = {tag["Key"]: tag["Value"] for tag in address.get("Tags", [])}
            assert tags.get("Environment") == environment_suffix
            assert tags.get("Project") == "DigitalBanking"
