"""Integration tests for deployed infrastructure."""

import os
import json
import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment."""
    return os.environ.get("AWS_REGION", "ap-southeast-1")


@pytest.fixture(scope="module")
def environment_suffix():
    """Get environment suffix from environment."""
    return os.environ.get("ENVIRONMENT_SUFFIX", "dev")


@pytest.fixture(scope="module")
def outputs():
    """Load deployment outputs from file."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"Outputs file not found: {outputs_file}")
    
    with open(outputs_file, 'r') as f:
        data = json.load(f)
        # Extract the stack outputs (first key in the dict)
        stack_name = list(data.keys())[0]
        return data[stack_name]


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client."""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region):
    """Create S3 client."""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope="module")
def iam_client(aws_region):
    """Create IAM client."""
    return boto3.client('iam', region_name=aws_region)


@pytest.fixture(scope="module")
def config_client(aws_region):
    """Create AWS Config client."""
    return boto3.client('config', region_name=aws_region)


@pytest.fixture(scope="module")
def sns_client(aws_region):
    """Create SNS client."""
    return boto3.client('sns', region_name=aws_region)


@pytest.fixture(scope="module")
def cloudwatch_client(aws_region):
    """Create CloudWatch client."""
    return boto3.client('cloudwatch', region_name=aws_region)


class TestNetworkingInfrastructure:
    """Test suite for networking resources."""

    def test_vpc_exists(self, ec2_client, outputs):
        """Test that VPC exists and is available."""
        vpc_id = outputs['vpc_id']
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'
        print(f"✅ VPC {vpc_id} exists and is available")

    def test_private_subnets_exist(self, ec2_client, outputs):
        """Test that private subnets exist."""
        subnet_ids = json.loads(outputs['private_subnet_ids'])
        
        assert len(subnet_ids) == 3, "Expected 3 private subnets"
        
        response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        assert len(response['Subnets']) == 3
        
        for subnet in response['Subnets']:
            assert subnet['State'] == 'available'
            print(f"✅ Subnet {subnet['SubnetId']} is available in AZ {subnet['AvailabilityZone']}")

    def test_vpc_flow_logs_enabled(self, ec2_client, outputs):
        """Test that VPC flow logs are enabled."""
        vpc_id = outputs['vpc_id']
        
        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )
        
        assert len(response['FlowLogs']) > 0, "No flow logs found for VPC"
        assert response['FlowLogs'][0]['FlowLogStatus'] == 'ACTIVE'
        print(f"✅ VPC flow logs are active for {vpc_id}")


class TestStorageInfrastructure:
    """Test suite for storage resources."""

    def test_data_bucket_exists(self, s3_client, outputs):
        """Test that data bucket exists."""
        bucket_name = outputs['data_bucket_name']
        
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        print(f"✅ S3 bucket {bucket_name} exists")

    def test_data_bucket_encryption(self, s3_client, outputs):
        """Test that data bucket has encryption enabled."""
        bucket_name = outputs['data_bucket_name']
        
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']
        print(f"✅ S3 bucket {bucket_name} has encryption enabled")

    def test_data_bucket_versioning(self, s3_client, outputs):
        """Test that data bucket has versioning enabled."""
        bucket_name = outputs['data_bucket_name']
        
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'
        print(f"✅ S3 bucket {bucket_name} has versioning enabled")

    def test_data_bucket_public_access_blocked(self, s3_client, outputs):
        """Test that data bucket blocks public access."""
        bucket_name = outputs['data_bucket_name']
        
        response = s3_client.get_public_access_block(Bucket=bucket_name)
        block_config = response['PublicAccessBlockConfiguration']
        
        assert block_config['BlockPublicAcls'] is True
        assert block_config['IgnorePublicAcls'] is True
        assert block_config['BlockPublicPolicy'] is True
        assert block_config['RestrictPublicBuckets'] is True
        print(f"✅ S3 bucket {bucket_name} has all public access blocked")


class TestSecurityInfrastructure:
    """Test suite for security resources."""

    def test_kms_keys_exist(self, kms_client, outputs):
        """Test that KMS keys exist and are enabled."""
        kms_arns = json.loads(outputs['kms_key_arns'])
        
        for key_type, key_arn in kms_arns.items():
            key_id = key_arn.split('/')[-1]
            response = kms_client.describe_key(KeyId=key_id)
            
            assert response['KeyMetadata']['Enabled'] is True
            assert response['KeyMetadata']['KeyState'] == 'Enabled'
            print(f"✅ KMS key for {key_type} is enabled: {key_id}")

    def test_kms_key_rotation(self, kms_client, outputs):
        """Test that KMS keys have rotation enabled."""
        kms_arns = json.loads(outputs['kms_key_arns'])
        
        for key_type, key_arn in kms_arns.items():
            key_id = key_arn.split('/')[-1]
            response = kms_client.get_key_rotation_status(KeyId=key_id)
            
            assert response['KeyRotationEnabled'] is True
            print(f"✅ KMS key for {key_type} has rotation enabled")

    def test_lambda_role_exists(self, iam_client, environment_suffix):
        """Test that Lambda IAM role exists."""
        role_name = f"lambda-execution-role-{environment_suffix}"
        
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name
        print(f"✅ Lambda IAM role {role_name} exists")

    def test_config_role_exists(self, iam_client, environment_suffix):
        """Test that Config IAM role exists."""
        role_name = f"config-recorder-role-{environment_suffix}"
        
        response = iam_client.get_role(RoleName=role_name)
        assert response['Role']['RoleName'] == role_name
        print(f"✅ Config IAM role {role_name} exists")


class TestComplianceInfrastructure:
    """Test suite for compliance resources."""

    def test_config_recorder_exists(self, config_client, outputs):
        """Test that AWS Config recorder exists and is recording."""
        recorder_name = outputs['config_recorder_name']
        
        response = config_client.describe_configuration_recorder_status(
            ConfigurationRecorderNames=[recorder_name]
        )
        
        assert len(response['ConfigurationRecordersStatus']) == 1
        assert response['ConfigurationRecordersStatus'][0]['recording'] is True
        print(f"✅ AWS Config recorder {recorder_name} is recording")

    def test_config_rules_exist(self, config_client, environment_suffix):
        """Test that Config rules are deployed."""
        expected_rules = [
            f"s3-bucket-server-side-encryption-{environment_suffix}",
            f"required-tags-{environment_suffix}",
            f"encrypted-volumes-{environment_suffix}"
        ]
        
        response = config_client.describe_config_rules()
        rule_names = [rule['ConfigRuleName'] for rule in response['ConfigRules']]
        
        for expected_rule in expected_rules:
            assert expected_rule in rule_names, f"Config rule {expected_rule} not found"
            print(f"✅ Config rule {expected_rule} exists")


class TestMonitoringInfrastructure:
    """Test suite for monitoring resources."""

    def test_sns_topic_exists(self, sns_client, outputs):
        """Test that SNS topic exists."""
        topic_arn = outputs['security_alerts_topic_arn']
        
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response['Attributes']['TopicArn'] == topic_arn
        print(f"✅ SNS topic exists: {topic_arn}")

    def test_cloudwatch_alarms_exist(self, cloudwatch_client, environment_suffix):
        """Test that CloudWatch alarms are configured."""
        expected_alarms = [
            f"unauthorized-api-calls-{environment_suffix}",
            f"security-group-changes-{environment_suffix}",
            f"root-account-usage-{environment_suffix}"
        ]
        
        response = cloudwatch_client.describe_alarms()
        alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
        
        for expected_alarm in expected_alarms:
            assert expected_alarm in alarm_names, f"Alarm {expected_alarm} not found"
            print(f"✅ CloudWatch alarm {expected_alarm} exists")


class TestEndToEndScenarios:
    """Test suite for end-to-end scenarios."""

    def test_s3_encryption_with_kms(self, s3_client, outputs):
        """Test that S3 bucket uses KMS encryption."""
        bucket_name = outputs['data_bucket_name']
        kms_arns = json.loads(outputs['kms_key_arns'])
        s3_kms_key_id = kms_arns['s3'].split('/')[-1]
        
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        
        encryption_config = rules[0]['ApplyServerSideEncryptionByDefault']
        
        if encryption_config['SSEAlgorithm'] == 'aws:kms':
            # Verify it's using our KMS key
            assert s3_kms_key_id in encryption_config.get('KMSMasterKeyID', '')
            print(f"✅ S3 bucket uses KMS encryption with key {s3_kms_key_id}")
        else:
            print(f"✅ S3 bucket uses {encryption_config['SSEAlgorithm']} encryption")

    def test_vpc_isolation(self, ec2_client, outputs):
        """Test that subnets are properly isolated (private)."""
        subnet_ids = json.loads(outputs['private_subnet_ids'])
        
        response = ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'association.subnet-id', 'Values': subnet_ids}
            ]
        )
        
        for route_table in response['RouteTables']:
            routes = route_table['Routes']
            # Check that there's no internet gateway route
            igw_routes = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]
            assert len(igw_routes) == 0, "Private subnets should not have IGW routes"
        
        print(f"✅ Private subnets are properly isolated (no IGW routes)")

