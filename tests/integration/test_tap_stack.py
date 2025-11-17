"""Integration tests for TapStack deployment."""
import os
import json
import boto3
import pytest


# Load deployment outputs
@pytest.fixture(scope="module")
def deployment_outputs():
    """Load deployment outputs from flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "cfn-outputs",
        "flat-outputs.json"
    )

    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def aws_region(deployment_outputs):
    """Get AWS region from deployment outputs."""
    return deployment_outputs.get("Region", "us-east-1")


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client."""
    return boto3.client("ec2", region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client."""
    return boto3.client("s3", region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client("kms", region_name=aws_region)


@pytest.fixture(scope="module")
def logs_client(aws_region):
    """Create CloudWatch Logs client."""
    return boto3.client("logs", region_name=aws_region)


@pytest.fixture(scope="module")
def iam_client(aws_region):
    """Create IAM client."""
    return boto3.client("iam", region_name=aws_region)


@pytest.fixture(scope="module")
def ssm_client(aws_region):
    """Create SSM client."""
    return boto3.client("ssm", region_name=aws_region)


@pytest.fixture(scope="module")
def networkfirewall_client(aws_region):
    """Create Network Firewall client."""
    return boto3.client("network-firewall", region_name=aws_region)


class TestNetworkingInfrastructure:
    """Integration tests for networking infrastructure."""

    def test_vpc_exists(self, deployment_outputs, ec2_client):
        """Verify VPC exists and is available."""
        vpc_id = deployment_outputs["VpcId"]
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == "10.0.0.0/16"

    def test_private_subnets_exist(self, deployment_outputs, ec2_client):
        """Verify private subnets exist."""
        subnet_ids = [
            deployment_outputs["PrivateSubnet1"],
            deployment_outputs["PrivateSubnet2"],
            deployment_outputs["PrivateSubnet3"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response["Subnets"]) == 3

        for subnet in response["Subnets"]:
            assert subnet["State"] == "available"
            assert subnet["MapPublicIpOnLaunch"] == False

    def test_subnets_in_different_azs(self, deployment_outputs, ec2_client):
        """Verify subnets are in different availability zones."""
        subnet_ids = [
            deployment_outputs["PrivateSubnet1"],
            deployment_outputs["PrivateSubnet2"],
            deployment_outputs["PrivateSubnet3"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = [subnet["AvailabilityZone"] for subnet in response["Subnets"]]

        # All AZs should be unique
        assert len(set(azs)) == 3


class TestSecurityInfrastructure:
    """Integration tests for security infrastructure."""

    def test_kms_keys_exist_and_enabled(self, deployment_outputs, kms_client):
        """Verify KMS keys exist and are enabled."""
        key_arns = [
            deployment_outputs["EbsKmsKeyArn"],
            deployment_outputs["S3KmsKeyArn"],
            deployment_outputs["RdsKmsKeyArn"]
        ]

        for key_arn in key_arns:
            response = kms_client.describe_key(KeyId=key_arn)
            assert response["KeyMetadata"]["Enabled"] == True
            assert response["KeyMetadata"]["KeyState"] == "Enabled"

    def test_kms_keys_have_rotation_enabled(self, deployment_outputs, kms_client):
        """Verify KMS keys have automatic rotation enabled."""
        key_arns = [
            deployment_outputs["EbsKmsKeyArn"],
            deployment_outputs["S3KmsKeyArn"],
            deployment_outputs["RdsKmsKeyArn"]
        ]

        for key_arn in key_arns:
            response = kms_client.get_key_rotation_status(KeyId=key_arn)
            assert response["KeyRotationEnabled"] == True

    def test_security_group_exists(self, deployment_outputs, ec2_client):
        """Verify application security group exists."""
        sg_id = deployment_outputs["AppSecurityGroupId"]
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])

        assert len(response["SecurityGroups"]) == 1
        sg = response["SecurityGroups"][0]
        assert sg["VpcId"] == deployment_outputs["VpcId"]

    def test_network_firewall_exists(self, deployment_outputs, networkfirewall_client):
        """Verify Network Firewall exists and is available."""
        firewall_arn = deployment_outputs["NetworkFirewallArn"]
        response = networkfirewall_client.describe_firewall(FirewallArn=firewall_arn)

        assert response["Firewall"]["FirewallArn"] == firewall_arn
        assert response["FirewallStatus"]["Status"] in ["PROVISIONING", "READY"]


class TestStorageInfrastructure:
    """Integration tests for storage infrastructure."""

    def test_s3_buckets_exist(self, deployment_outputs, s3_client):
        """Verify S3 buckets exist."""
        bucket_names = [
            deployment_outputs["AuditBucketName"],
            deployment_outputs["ComplianceBucketName"]
        ]

        for bucket_name in bucket_names:
            response = s3_client.head_bucket(Bucket=bucket_name)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_buckets_have_versioning(self, deployment_outputs, s3_client):
        """Verify S3 buckets have versioning enabled."""
        bucket_names = [
            deployment_outputs["AuditBucketName"],
            deployment_outputs["ComplianceBucketName"]
        ]

        for bucket_name in bucket_names:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            assert response["Status"] == "Enabled"

    def test_s3_buckets_have_encryption(self, deployment_outputs, s3_client):
        """Verify S3 buckets have encryption enabled."""
        bucket_names = [
            deployment_outputs["AuditBucketName"],
            deployment_outputs["ComplianceBucketName"]
        ]

        for bucket_name in bucket_names:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response["ServerSideEncryptionConfiguration"]["Rules"]
            assert len(rules) > 0
            assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"

    def test_s3_buckets_block_public_access(self, deployment_outputs, s3_client):
        """Verify S3 buckets block all public access."""
        bucket_names = [
            deployment_outputs["AuditBucketName"],
            deployment_outputs["ComplianceBucketName"]
        ]

        for bucket_name in bucket_names:
            response = s3_client.get_public_access_block(Bucket=bucket_name)
            config = response["PublicAccessBlockConfiguration"]
            assert config["BlockPublicAcls"] == True
            assert config["BlockPublicPolicy"] == True
            assert config["IgnorePublicAcls"] == True
            assert config["RestrictPublicBuckets"] == True


class TestVpcEndpoints:
    """Integration tests for VPC endpoints."""

    def test_vpc_endpoints_exist(self, deployment_outputs, ec2_client):
        """Verify VPC endpoints exist."""
        vpc_id = deployment_outputs["VpcId"]
        response = ec2_client.describe_vpc_endpoints(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Should have at least 5 endpoints (S3, DynamoDB, EC2, SSM, SSM Messages)
        assert len(response["VpcEndpoints"]) >= 5

    def test_s3_endpoint_exists(self, deployment_outputs, ec2_client):
        """Verify S3 VPC endpoint exists."""
        endpoint_id = deployment_outputs["S3EndpointId"]
        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])

        assert len(response["VpcEndpoints"]) == 1
        endpoint = response["VpcEndpoints"][0]
        assert endpoint["State"] == "available"
        assert "s3" in endpoint["ServiceName"]


class TestMonitoringInfrastructure:
    """Integration tests for monitoring infrastructure."""

    def test_cloudwatch_log_groups_exist(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups exist."""
        log_group_names = [
            deployment_outputs["AppLogGroupName"],
            deployment_outputs["AuditLogGroupName"]
        ]

        for log_group_name in log_group_names:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            assert len(response["logGroups"]) > 0
            log_group = response["logGroups"][0]
            assert log_group["logGroupName"] == log_group_name

    def test_cloudwatch_log_groups_have_retention(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups have retention set."""
        log_group_names = [
            deployment_outputs["AppLogGroupName"],
            deployment_outputs["AuditLogGroupName"]
        ]

        for log_group_name in log_group_names:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            log_group = response["logGroups"][0]
            assert "retentionInDays" in log_group
            assert log_group["retentionInDays"] == 2557  # 7 years

    def test_cloudwatch_log_groups_have_kms_encryption(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups have KMS encryption."""
        log_group_names = [
            deployment_outputs["AppLogGroupName"],
            deployment_outputs["AuditLogGroupName"]
        ]

        for log_group_name in log_group_names:
            response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            log_group = response["logGroups"][0]
            assert "kmsKeyId" in log_group
            assert log_group["kmsKeyId"] is not None


class TestComplianceInfrastructure:
    """Integration tests for compliance infrastructure."""

    def test_iam_roles_exist(self, deployment_outputs, iam_client):
        """Verify IAM roles exist."""
        role_arns = [
            deployment_outputs["AppRoleArn"],
            deployment_outputs["AuditRoleArn"]
        ]

        for role_arn in role_arns:
            role_name = role_arn.split("/")[-1]
            response = iam_client.get_role(RoleName=role_name)
            assert response["Role"]["Arn"] == role_arn

    def test_iam_roles_have_session_limit(self, deployment_outputs, iam_client):
        """Verify IAM roles have 1-hour session limit."""
        role_arns = [
            deployment_outputs["AppRoleArn"],
            deployment_outputs["AuditRoleArn"]
        ]

        for role_arn in role_arns:
            role_name = role_arn.split("/")[-1]
            response = iam_client.get_role(RoleName=role_name)
            assert response["Role"]["MaxSessionDuration"] == 3600

    def test_ssm_parameters_exist(self, deployment_outputs, ssm_client):
        """Verify SSM parameters exist."""
        param_name = deployment_outputs["AppConfigParamName"]
        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)

        assert response["Parameter"]["Name"] == param_name
        assert response["Parameter"]["Type"] == "SecureString"

    def test_ssm_parameters_have_valid_json(self, deployment_outputs, ssm_client):
        """Verify SSM parameters contain valid JSON."""
        param_name = deployment_outputs["AppConfigParamName"]
        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)

        value = response["Parameter"]["Value"]
        parsed = json.loads(value)
        assert isinstance(parsed, dict)


class TestZeroTrustArchitecture:
    """Integration tests for zero-trust architecture compliance."""

    def test_no_internet_gateway(self, deployment_outputs, ec2_client):
        """Verify VPC has no internet gateway attached."""
        vpc_id = deployment_outputs["VpcId"]
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        # Should have no internet gateways
        assert len(response["InternetGateways"]) == 0

    def test_subnets_are_private(self, deployment_outputs, ec2_client):
        """Verify all subnets are private (no public IP assignment)."""
        subnet_ids = [
            deployment_outputs["PrivateSubnet1"],
            deployment_outputs["PrivateSubnet2"],
            deployment_outputs["PrivateSubnet3"]
        ]

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] == False

    def test_deployment_summary(self, deployment_outputs):
        """Verify deployment summary contains correct information."""
        assert deployment_outputs["Environment"] is not None
        assert deployment_outputs["Region"] == "us-east-1"
        assert deployment_outputs["Architecture"] == "zero-trust"
        assert deployment_outputs["Compliance"] == "pci-dss-level-1"
