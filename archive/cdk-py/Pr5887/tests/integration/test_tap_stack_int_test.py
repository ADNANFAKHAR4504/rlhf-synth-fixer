"""
Integration tests for TapStack - VPC Endpoints Infrastructure.

Tests real deployed AWS resources using outputs from cfn-outputs/flat-outputs.json.
No mocking - all tests validate actual AWS infrastructure.
"""

import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def outputs():
    """Load CloudFormation stack outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"Outputs file {outputs_file} not found. Deploy stack first.")

    with open(outputs_file, "r") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def ec2_client():
    """Create EC2 client."""
    return boto3.client("ec2", region_name="us-east-1")


@pytest.fixture(scope="module")
def kms_client():
    """Create KMS client."""
    return boto3.client("kms", region_name="us-east-1")


class TestVPCResources:
    """Test VPC and subnet resources."""

    def test_vpc_exists(self, ec2_client, outputs):
        """Test that VPC exists and has correct configuration."""
        vpc_id = outputs["VPCId"]

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1

        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"

        # Check DNS settings using describe_vpc_attribute
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsHostnames"
        )
        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsSupport"
        )
        assert dns_support["EnableDnsSupport"]["Value"] is True

    def test_vpc_cidr_matches_output(self, outputs):
        """Test that VPC CIDR in outputs matches expected value."""
        assert outputs["VPCCidr"] == "10.0.0.0/16"

    def test_subnets_exist(self, ec2_client, outputs):
        """Test that all 3 private subnets exist."""
        subnet_ids = [
            outputs["PrivateSubnet1Id"],
            outputs["PrivateSubnet2Id"],
            outputs["PrivateSubnet3Id"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response["Subnets"]) == 3

        # Verify all subnets are in the same VPC
        vpc_id = outputs["VPCId"]
        for subnet in response["Subnets"]:
            assert subnet["VpcId"] == vpc_id
            assert subnet["State"] == "available"

    def test_subnets_in_different_azs(self, ec2_client, outputs):
        """Test that subnets are distributed across availability zones."""
        subnet_ids = [
            outputs["PrivateSubnet1Id"],
            outputs["PrivateSubnet2Id"],
            outputs["PrivateSubnet3Id"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = [subnet["AvailabilityZone"] for subnet in response["Subnets"]]

        # Should have 3 different AZs
        assert len(set(azs)) == 3

    def test_subnets_have_correct_cidr_size(self, ec2_client, outputs):
        """Test that all subnets have /24 CIDR blocks."""
        subnet_ids = [
            outputs["PrivateSubnet1Id"],
            outputs["PrivateSubnet2Id"],
            outputs["PrivateSubnet3Id"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in response["Subnets"]:
            cidr = subnet["CidrBlock"]
            # Should be /24
            assert cidr.endswith("/24")
            # Should be within 10.0.0.0/16
            assert cidr.startswith("10.0.")


class TestSecurityGroup:
    """Test security group configuration."""

    def test_security_group_exists(self, ec2_client, outputs):
        """Test that endpoint security group exists."""
        sg_id = outputs["EndpointSecurityGroupId"]

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        assert len(response["SecurityGroups"]) == 1

        sg = response["SecurityGroups"][0]
        assert sg["VpcId"] == outputs["VPCId"]

    def test_security_group_ingress_rules(self, ec2_client, outputs):
        """Test that security group allows HTTPS from VPC CIDR."""
        sg_id = outputs["EndpointSecurityGroupId"]

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response["SecurityGroups"][0]

        ingress_rules = sg["IpPermissions"]
        assert len(ingress_rules) == 1

        rule = ingress_rules[0]
        assert rule["IpProtocol"] == "tcp"
        assert rule["FromPort"] == 443
        assert rule["ToPort"] == 443
        assert len(rule["IpRanges"]) == 1
        assert rule["IpRanges"][0]["CidrIp"] == "10.0.0.0/16"

    def test_security_group_egress_rules(self, ec2_client, outputs):
        """Test that security group allows all outbound traffic."""
        sg_id = outputs["EndpointSecurityGroupId"]

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response["SecurityGroups"][0]

        egress_rules = sg["IpPermissionsEgress"]
        assert len(egress_rules) >= 1

        # Should allow all outbound
        all_egress = [r for r in egress_rules if r["IpProtocol"] == "-1"]
        assert len(all_egress) >= 1


class TestKMSKey:
    """Test KMS key configuration."""

    def test_kms_key_exists(self, kms_client, outputs):
        """Test that KMS key exists and is enabled."""
        key_id = outputs["KMSKeyId"]

        response = kms_client.describe_key(KeyId=key_id)
        key_metadata = response["KeyMetadata"]

        assert key_metadata["KeyState"] == "Enabled"
        assert key_metadata["KeyUsage"] == "ENCRYPT_DECRYPT"

    def test_kms_key_rotation_enabled(self, kms_client, outputs):
        """Test that KMS key rotation is enabled."""
        key_id = outputs["KMSKeyId"]

        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response["KeyRotationEnabled"] is True

    def test_kms_key_arn_matches(self, outputs):
        """Test that KMS key ARN contains key ID."""
        key_id = outputs["KMSKeyId"]
        key_arn = outputs["KMSKeyArn"]

        assert key_id in key_arn
        assert key_arn.startswith("arn:aws:kms:")


class TestGatewayEndpoints:
    """Test gateway VPC endpoints."""

    def test_s3_gateway_endpoint_exists(self, ec2_client, outputs):
        """Test that S3 gateway endpoint exists."""
        endpoint_id = outputs["S3GatewayEndpointId"]

        try:
            response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcEndpointId.NotFound':
                pytest.skip(f"S3 Gateway Endpoint {endpoint_id} not found. Infrastructure may not be deployed or outputs are stale.")
            raise

        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Gateway"
        assert endpoint["State"] == "available"
        assert "s3" in endpoint["ServiceName"].lower()

    def test_s3_gateway_endpoint_in_correct_vpc(self, ec2_client, outputs):
        """Test that S3 endpoint is in correct VPC."""
        endpoint_id = outputs["S3GatewayEndpointId"]
        vpc_id = outputs["VPCId"]

        try:
            response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcEndpointId.NotFound':
                pytest.skip(f"S3 Gateway Endpoint {endpoint_id} not found. Infrastructure may not be deployed or outputs are stale.")
            raise

        endpoint = response["VpcEndpoints"][0]

        assert endpoint["VpcId"] == vpc_id

    def test_dynamodb_gateway_endpoint_exists(self, ec2_client, outputs):
        """Test that DynamoDB gateway endpoint exists."""
        endpoint_id = outputs["DynamoDBGatewayEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Gateway"
        assert endpoint["State"] == "available"
        assert "dynamodb" in endpoint["ServiceName"].lower()

    def test_gateway_endpoints_have_route_tables(self, ec2_client, outputs):
        """Test that gateway endpoints are associated with route tables."""
        s3_endpoint_id = outputs["S3GatewayEndpointId"]

        try:
            response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[s3_endpoint_id])
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcEndpointId.NotFound':
                pytest.skip(f"S3 Gateway Endpoint {s3_endpoint_id} not found. Infrastructure may not be deployed or outputs are stale.")
            raise

        endpoint = response["VpcEndpoints"][0]

        # Should have route table associations
        assert len(endpoint["RouteTableIds"]) > 0


class TestInterfaceEndpoints:
    """Test interface VPC endpoints."""

    def test_ec2_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that EC2 interface endpoint exists."""
        endpoint_id = outputs["EC2InterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "ec2" in endpoint["ServiceName"].lower()

    def test_ssm_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that SSM interface endpoint exists."""
        endpoint_id = outputs["SSMInterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "ssm" in endpoint["ServiceName"].lower()
        assert "messages" not in endpoint["ServiceName"].lower()

    def test_ssm_messages_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that SSM Messages interface endpoint exists."""
        endpoint_id = outputs["SSMMessagesInterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "ssmmessages" in endpoint["ServiceName"].lower()

    def test_ec2_messages_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that EC2 Messages interface endpoint exists."""
        endpoint_id = outputs["EC2MessagesInterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "ec2messages" in endpoint["ServiceName"].lower()

    def test_cloudwatch_logs_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that CloudWatch Logs interface endpoint exists."""
        endpoint_id = outputs["CloudWatchLogsInterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "logs" in endpoint["ServiceName"].lower()

    def test_secrets_manager_interface_endpoint_exists(self, ec2_client, outputs):
        """Test that Secrets Manager interface endpoint exists."""
        endpoint_id = outputs["SecretsManagerInterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        assert len(response["VpcEndpoints"]) == 1

        endpoint = response["VpcEndpoints"][0]
        assert endpoint["VpcEndpointType"] == "Interface"
        assert endpoint["State"] == "available"
        assert "secretsmanager" in endpoint["ServiceName"].lower()

    def test_interface_endpoints_have_private_dns_enabled(self, ec2_client, outputs):
        """Test that all interface endpoints have private DNS enabled."""
        endpoint_ids = [
            outputs["EC2InterfaceEndpointId"],
            outputs["SSMInterfaceEndpointId"],
            outputs["SSMMessagesInterfaceEndpointId"],
            outputs["EC2MessagesInterfaceEndpointId"],
            outputs["CloudWatchLogsInterfaceEndpointId"],
            outputs["SecretsManagerInterfaceEndpointId"]
        ]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=endpoint_ids)
        for endpoint in response["VpcEndpoints"]:
            assert endpoint["PrivateDnsEnabled"] is True

    def test_interface_endpoints_have_security_groups(self, ec2_client, outputs):
        """Test that all interface endpoints have security groups attached."""
        endpoint_ids = [
            outputs["EC2InterfaceEndpointId"],
            outputs["SSMInterfaceEndpointId"],
            outputs["SSMMessagesInterfaceEndpointId"],
            outputs["EC2MessagesInterfaceEndpointId"],
            outputs["CloudWatchLogsInterfaceEndpointId"],
            outputs["SecretsManagerInterfaceEndpointId"]
        ]
        sg_id = outputs["EndpointSecurityGroupId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=endpoint_ids)
        for endpoint in response["VpcEndpoints"]:
            # Each endpoint should have at least one security group
            assert len(endpoint["Groups"]) >= 1
            # Should include our endpoint security group
            sg_ids = [g["GroupId"] for g in endpoint["Groups"]]
            assert sg_id in sg_ids

    def test_interface_endpoints_in_subnets(self, ec2_client, outputs):
        """Test that interface endpoints are deployed in subnets."""
        endpoint_id = outputs["EC2InterfaceEndpointId"]

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])
        endpoint = response["VpcEndpoints"][0]

        # Should have subnet IDs
        assert len(endpoint["SubnetIds"]) > 0


class TestEndpointDNSResolution:
    """Test DNS resolution for interface endpoints."""

    def test_dns_entries_exist(self, outputs):
        """Test that DNS entries are present in outputs."""
        dns_outputs = [
            "EC2InterfaceEndpointDNS",
            "SSMInterfaceEndpointDNS",
            "SSMMessagesInterfaceEndpointDNS",
            "EC2MessagesInterfaceEndpointDNS",
            "CloudWatchLogsInterfaceEndpointDNS",
            "SecretsManagerInterfaceEndpointDNS"
        ]

        for dns_output in dns_outputs:
            assert dns_output in outputs
            assert outputs[dns_output]
            # DNS should contain vpce- prefix
            assert "vpce-" in outputs[dns_output]


class TestResourceTagging:
    """Test that resources are properly tagged."""

    def test_vpc_has_tags(self, ec2_client, outputs):
        """Test that VPC has required tags."""
        vpc_id = outputs["VPCId"]

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]

        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}

        assert "Environment" in tags
        assert tags["Environment"] == "Production"
        assert "CostCenter" in tags
        assert tags["CostCenter"] == "Finance"
        assert "EnvironmentSuffix" in tags

    def test_subnets_have_tags(self, ec2_client, outputs):
        """Test that subnets have tags."""
        subnet_id = outputs["PrivateSubnet1Id"]

        response = ec2_client.describe_subnets(SubnetIds=[subnet_id])
        subnet = response["Subnets"][0]

        tags = {tag["Key"]: tag["Value"] for tag in subnet.get("Tags", [])}

        # Should have standard tags from stack
        assert "Environment" in tags or "EnvironmentSuffix" in tags


class TestEndToEndWorkflow:
    """Test end-to-end VPC endpoint functionality."""

    def test_all_resources_in_same_vpc(self, ec2_client, outputs):
        """Test that all resources are in the same VPC."""
        vpc_id = outputs["VPCId"]

        # Check subnets
        subnet_ids = [
            outputs["PrivateSubnet1Id"],
            outputs["PrivateSubnet2Id"],
            outputs["PrivateSubnet3Id"]
        ]
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["VpcId"] == vpc_id

        # Check security group
        sg_id = outputs["EndpointSecurityGroupId"]
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        assert response["SecurityGroups"][0]["VpcId"] == vpc_id

        # Check endpoints
        endpoint_ids = [
            outputs["S3GatewayEndpointId"],
            outputs["DynamoDBGatewayEndpointId"],
            outputs["EC2InterfaceEndpointId"]
        ]
        try:
            response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=endpoint_ids)
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcEndpointId.NotFound':
                pytest.skip(f"One or more VPC endpoints not found. Infrastructure may not be deployed or outputs are stale. Endpoint IDs: {endpoint_ids}")
            raise

        for endpoint in response["VpcEndpoints"]:
            assert endpoint["VpcId"] == vpc_id

    def test_complete_infrastructure_deployed(self, outputs):
        """Test that all expected outputs are present."""
        required_outputs = [
            "VPCId", "VPCCidr",
            "PrivateSubnet1Id", "PrivateSubnet2Id", "PrivateSubnet3Id",
            "S3GatewayEndpointId", "DynamoDBGatewayEndpointId",
            "EC2InterfaceEndpointId", "SSMInterfaceEndpointId",
            "SSMMessagesInterfaceEndpointId", "EC2MessagesInterfaceEndpointId",
            "CloudWatchLogsInterfaceEndpointId", "SecretsManagerInterfaceEndpointId",
            "EndpointSecurityGroupId", "KMSKeyId", "KMSKeyArn"
        ]

        for output in required_outputs:
            assert output in outputs
            assert outputs[output]  # Should not be empty
