"""Integration tests for TapStack deployment."""
import os
import json
import boto3
import pytest


def get_output_by_pattern(outputs, pattern):
    """Get output value by searching for a pattern in the key name."""
    for key, value in outputs.items():
        if pattern.lower() in key.lower():
            return value
    return None


# Load deployment outputs
@pytest.fixture(scope="module")
def deployment_outputs():
    """Load deployment outputs from flat-outputs.json."""
    outputs_path = os.path.join(os.getcwd(), 'cfn-outputs', 'flat-outputs.json')

    with open(outputs_path, 'r') as f:
        all_outputs = json.load(f)

    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    stack_name = f"TapStack{environment_suffix}"

    return all_outputs.get(stack_name, {})


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment variable."""
    return os.environ.get('AWS_REGION', 'us-east-1')


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
        vpc_id = get_output_by_pattern(deployment_outputs, "vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"
        assert vpc["VpcId"] == vpc_id

    def test_private_subnets_exist(self, deployment_outputs, ec2_client):
        """Verify private subnets exist."""
        subnet_ids = get_output_by_pattern(deployment_outputs, "private_subnet_ids")
        assert subnet_ids is not None, "Private subnet IDs not found in outputs"
        assert isinstance(subnet_ids, list), "Private subnet IDs should be a list"

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response["Subnets"]) == 3

        for subnet in response["Subnets"]:
            assert subnet["State"] == "available"
            assert subnet["MapPublicIpOnLaunch"] == False

    def test_subnets_in_different_azs(self, deployment_outputs, ec2_client):
        """Verify subnets are in different availability zones."""
        subnet_ids = get_output_by_pattern(deployment_outputs, "private_subnet_ids")
        assert subnet_ids is not None, "Private subnet IDs not found in outputs"

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = [subnet["AvailabilityZone"] for subnet in response["Subnets"]]

        assert len(set(azs)) == 3


class TestSecurityInfrastructure:
    """Integration tests for security infrastructure."""

    def test_kms_keys_exist_and_enabled(self, deployment_outputs, kms_client):
        """Verify KMS keys exist and are enabled."""
        ebs_key_arn = get_output_by_pattern(deployment_outputs, "ebs_kms_key_arn")
        s3_key_arn = get_output_by_pattern(deployment_outputs, "s3_kms_key_arn")
        rds_key_arn = get_output_by_pattern(deployment_outputs, "rds_kms_key_arn")

        key_arns = [ebs_key_arn, s3_key_arn, rds_key_arn]

        for key_arn in key_arns:
            if key_arn:
                response = kms_client.describe_key(KeyId=key_arn)
                assert response["KeyMetadata"]["Enabled"] == True
                assert response["KeyMetadata"]["KeyState"] == "Enabled"

    def test_kms_keys_have_rotation_enabled(self, deployment_outputs, kms_client):
        """Verify KMS keys have automatic rotation enabled."""
        ebs_key_arn = get_output_by_pattern(deployment_outputs, "ebs_kms_key_arn")
        s3_key_arn = get_output_by_pattern(deployment_outputs, "s3_kms_key_arn")
        rds_key_arn = get_output_by_pattern(deployment_outputs, "rds_kms_key_arn")

        key_arns = [ebs_key_arn, s3_key_arn, rds_key_arn]

        for key_arn in key_arns:
            if key_arn:
                response = kms_client.get_key_rotation_status(KeyId=key_arn)
                assert response["KeyRotationEnabled"] == True

    def test_security_group_exists(self, deployment_outputs, ec2_client):
        """Verify application security group exists."""
        sg_id = get_output_by_pattern(deployment_outputs, "app_security_group_id")
        assert sg_id is not None, "Application security group ID not found in outputs"

        response = ec2_client.describe_security_groups(GroupIds=[sg_id])

        assert len(response["SecurityGroups"]) == 1
        sg = response["SecurityGroups"][0]

        vpc_id = get_output_by_pattern(deployment_outputs, "vpc_id")
        assert sg["VpcId"] == vpc_id

    def test_network_firewall_exists(self, deployment_outputs, networkfirewall_client):
        """Verify Network Firewall exists and is available."""
        firewall_arn = get_output_by_pattern(deployment_outputs, "network_firewall")
        assert firewall_arn is not None, "Network Firewall ARN not found in outputs"

        response = networkfirewall_client.describe_firewall(FirewallArn=firewall_arn)

        assert response["Firewall"]["FirewallArn"] == firewall_arn
        assert response["FirewallStatus"]["Status"] in ["PROVISIONING", "READY"]


class TestStorageInfrastructure:
    """Integration tests for storage infrastructure."""

    def test_s3_buckets_exist(self, deployment_outputs, s3_client):
        """Verify S3 buckets exist."""
        audit_bucket = get_output_by_pattern(deployment_outputs, "audit_bucket_name")
        compliance_bucket = get_output_by_pattern(deployment_outputs, "compliance_bucket_name")

        bucket_names = [audit_bucket, compliance_bucket]

        for bucket_name in bucket_names:
            if bucket_name:
                response = s3_client.head_bucket(Bucket=bucket_name)
                assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_buckets_have_versioning(self, deployment_outputs, s3_client):
        """Verify S3 buckets have versioning enabled."""
        audit_bucket = get_output_by_pattern(deployment_outputs, "audit_bucket_name")
        compliance_bucket = get_output_by_pattern(deployment_outputs, "compliance_bucket_name")

        bucket_names = [audit_bucket, compliance_bucket]

        for bucket_name in bucket_names:
            if bucket_name:
                response = s3_client.get_bucket_versioning(Bucket=bucket_name)
                assert response["Status"] == "Enabled"

    def test_s3_buckets_have_encryption(self, deployment_outputs, s3_client):
        """Verify S3 buckets have encryption enabled."""
        audit_bucket = get_output_by_pattern(deployment_outputs, "audit_bucket_name")
        compliance_bucket = get_output_by_pattern(deployment_outputs, "compliance_bucket_name")

        bucket_names = [audit_bucket, compliance_bucket]

        for bucket_name in bucket_names:
            if bucket_name:
                response = s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = response["ServerSideEncryptionConfiguration"]["Rules"]
                assert len(rules) > 0
                assert rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "aws:kms"

    def test_s3_buckets_block_public_access(self, deployment_outputs, s3_client):
        """Verify S3 buckets block all public access."""
        audit_bucket = get_output_by_pattern(deployment_outputs, "audit_bucket_name")
        compliance_bucket = get_output_by_pattern(deployment_outputs, "compliance_bucket_name")

        bucket_names = [audit_bucket, compliance_bucket]

        for bucket_name in bucket_names:
            if bucket_name:
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
        vpc_id = get_output_by_pattern(deployment_outputs, "vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpc_endpoints(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["VpcEndpoints"]) >= 2

    def test_s3_endpoint_exists(self, deployment_outputs, ec2_client):
        """Verify S3 VPC endpoint exists."""
        endpoint_id = get_output_by_pattern(deployment_outputs, "s3_endpoint_id")
        assert endpoint_id is not None, "S3 endpoint ID not found in outputs"

        response = ec2_client.describe_vpc_endpoints(VpcEndpointIds=[endpoint_id])

        assert len(response["VpcEndpoints"]) == 1
        endpoint = response["VpcEndpoints"][0]
        assert endpoint["State"] == "available"
        assert "s3" in endpoint["ServiceName"]

    def test_ec2_endpoint_exists(self, deployment_outputs, ec2_client):
        """Verify EC2 VPC endpoint exists and has DNS entries."""
        ec2_endpoint_dns = get_output_by_pattern(deployment_outputs, "ec2_endpoint_dns")

        if ec2_endpoint_dns and isinstance(ec2_endpoint_dns, list):
            assert len(ec2_endpoint_dns) > 0
            for dns_entry in ec2_endpoint_dns:
                if isinstance(dns_entry, dict):
                    assert "dns_name" in dns_entry or "hosted_zone_id" in dns_entry

    def test_ssm_endpoint_exists(self, deployment_outputs, ec2_client):
        """Verify SSM VPC endpoint exists and has DNS entries."""
        ssm_endpoint_dns = get_output_by_pattern(deployment_outputs, "ssm_endpoint_dns")

        if ssm_endpoint_dns and isinstance(ssm_endpoint_dns, list):
            assert len(ssm_endpoint_dns) > 0
            for dns_entry in ssm_endpoint_dns:
                if isinstance(dns_entry, dict):
                    assert "dns_name" in dns_entry or "hosted_zone_id" in dns_entry


class TestMonitoringInfrastructure:
    """Integration tests for monitoring infrastructure."""

    def test_cloudwatch_log_groups_exist(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups exist."""
        app_log_group = get_output_by_pattern(deployment_outputs, "app_log_group_name")
        audit_log_group = get_output_by_pattern(deployment_outputs, "audit_log_group_name")

        log_group_names = [app_log_group, audit_log_group]

        for log_group_name in log_group_names:
            if log_group_name:
                response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
                assert len(response["logGroups"]) > 0
                log_group = response["logGroups"][0]
                assert log_group["logGroupName"] == log_group_name

    def test_cloudwatch_log_groups_have_retention(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups have retention set."""
        app_log_group = get_output_by_pattern(deployment_outputs, "app_log_group_name")
        audit_log_group = get_output_by_pattern(deployment_outputs, "audit_log_group_name")

        log_group_names = [app_log_group, audit_log_group]

        for log_group_name in log_group_names:
            if log_group_name:
                response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
                log_group = response["logGroups"][0]
                assert "retentionInDays" in log_group
                assert log_group["retentionInDays"] >= 365

    def test_cloudwatch_log_groups_have_kms_encryption(self, deployment_outputs, logs_client):
        """Verify CloudWatch log groups have KMS encryption."""
        app_log_group = get_output_by_pattern(deployment_outputs, "app_log_group_name")
        audit_log_group = get_output_by_pattern(deployment_outputs, "audit_log_group_name")

        log_group_names = [app_log_group, audit_log_group]

        for log_group_name in log_group_names:
            if log_group_name:
                response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
                log_group = response["logGroups"][0]
                assert "kmsKeyId" in log_group or log_group.get("kmsKeyId") is not None


class TestComplianceInfrastructure:
    """Integration tests for compliance infrastructure."""

    def test_iam_roles_exist(self, deployment_outputs, iam_client):
        """Verify IAM roles exist."""
        app_role_arn = get_output_by_pattern(deployment_outputs, "app_role_arn")
        audit_role_arn = get_output_by_pattern(deployment_outputs, "audit_role_arn")

        role_arns = [app_role_arn, audit_role_arn]

        for role_arn in role_arns:
            if role_arn:
                role_name = role_arn.split("/")[-1]
                response = iam_client.get_role(RoleName=role_name)
                assert response["Role"]["Arn"] == role_arn

    def test_iam_roles_have_session_limit(self, deployment_outputs, iam_client):
        """Verify IAM roles have session limit set."""
        app_role_arn = get_output_by_pattern(deployment_outputs, "app_role_arn")
        audit_role_arn = get_output_by_pattern(deployment_outputs, "audit_role_arn")

        role_arns = [app_role_arn, audit_role_arn]

        for role_arn in role_arns:
            if role_arn:
                role_name = role_arn.split("/")[-1]
                response = iam_client.get_role(RoleName=role_name)
                assert response["Role"]["MaxSessionDuration"] <= 43200

    def test_ssm_parameters_exist(self, deployment_outputs, ssm_client):
        """Verify SSM parameters exist."""
        param_name = get_output_by_pattern(deployment_outputs, "app_config_param_name")

        if param_name:
            response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)

            assert response["Parameter"]["Name"] == param_name
            assert response["Parameter"]["Type"] == "SecureString"

    def test_ssm_parameters_have_valid_json(self, deployment_outputs, ssm_client):
        """Verify SSM parameters contain valid JSON."""
        param_name = get_output_by_pattern(deployment_outputs, "app_config_param_name")

        if param_name:
            response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)

            value = response["Parameter"]["Value"]
            parsed = json.loads(value)
            assert isinstance(parsed, dict)


class TestZeroTrustArchitecture:
    """Integration tests for zero-trust architecture compliance."""

    def test_no_internet_gateway(self, deployment_outputs, ec2_client):
        """Verify VPC has no internet gateway attached."""
        vpc_id = get_output_by_pattern(deployment_outputs, "vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["InternetGateways"]) == 0

    def test_subnets_are_private(self, deployment_outputs, ec2_client):
        """Verify all subnets are private (no public IP assignment)."""
        subnet_ids = get_output_by_pattern(deployment_outputs, "private_subnet_ids")
        assert subnet_ids is not None, "Private subnet IDs not found in outputs"

        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in response["Subnets"]:
            assert subnet["MapPublicIpOnLaunch"] == False

    def test_deployment_summary(self, deployment_outputs, aws_region):
        """Verify deployment summary contains correct information."""
        summary = get_output_by_pattern(deployment_outputs, "deployment_summary")

        if summary and isinstance(summary, dict):
            assert summary.get("region") == aws_region
            assert summary.get("architecture") == "zero-trust"
            assert summary.get("compliance") == "pci-dss-level-1"
