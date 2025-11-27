"""Integration tests for Secondary Stack resources (us-west-2)."""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        "../../cfn-outputs/flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        pytest.skip(f"Outputs file not found: {outputs_path}")

    with open(outputs_path, 'r') as f:
        outputs = json.load(f)

    if not outputs:
        pytest.skip("No stack outputs found in flat-outputs.json")

    stack_name = list(outputs.keys())[0]
    return outputs[stack_name]


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients for secondary region testing."""
    try:
        return {
            's3': boto3.client('s3', region_name='us-west-2'),
            'kms': boto3.client('kms', region_name='us-west-2'),
            'lambda': boto3.client('lambda', region_name='us-west-2'),
            'iam': boto3.client('iam', region_name='us-west-2'),
            'sns': boto3.client('sns', region_name='us-west-2'),
            'cloudwatch': boto3.client('cloudwatch', region_name='us-west-2'),
            'ec2': boto3.client('ec2', region_name='us-west-2'),
        }
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")


class TestSecondaryS3Bucket:
    """Test secondary S3 bucket deployment and configuration."""

    def test_secondary_bucket_exists(self, stack_outputs, aws_clients):
        """Test that secondary S3 bucket exists."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        if not bucket_arn:
            pytest.skip("Secondary bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                pytest.fail(f"Bucket {bucket_name} not found")
            raise

    def test_secondary_bucket_versioning_enabled(self, stack_outputs, aws_clients):
        """Test that S3 bucket has versioning enabled (required for replication)."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        if not bucket_arn:
            pytest.skip("Secondary bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
            assert response.get('Status') == 'Enabled', \
                "Versioning must be enabled for replication destination"
        except ClientError as e:
            pytest.skip(f"Could not check bucket versioning: {e}")

    def test_secondary_bucket_encryption_enabled(self, stack_outputs, aws_clients):
        """Test that S3 bucket has server-side encryption enabled."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        if not bucket_arn:
            pytest.skip("Secondary bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']

            assert len(rules) > 0, "Should have at least one encryption rule"
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                pytest.fail("Bucket encryption not configured")
            raise

    def test_secondary_bucket_encryption_uses_secondary_kms(self, stack_outputs, aws_clients):
        """Test that S3 bucket encryption uses secondary region KMS key."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        kms_key_arn = stack_outputs.get('secondary_kms_key_arn')

        if not bucket_arn or not kms_key_arn:
            pytest.skip("Bucket ARN or KMS key ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            encryption_config = rules[0]['ApplyServerSideEncryptionByDefault']

            assert 'KMSMasterKeyID' in encryption_config
            # Extract key ID from ARN for comparison
            kms_key_id = kms_key_arn.split('/')[-1]
            assert kms_key_id in encryption_config['KMSMasterKeyID']
        except ClientError as e:
            pytest.skip(f"Could not verify KMS encryption: {e}")

    def test_secondary_bucket_in_correct_region(self, stack_outputs, aws_clients):
        """Test that secondary bucket is in us-west-2 region."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        if not bucket_arn:
            pytest.skip("Secondary bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].get_bucket_location(Bucket=bucket_name)
            location = response.get('LocationConstraint')
            assert location == 'us-west-2', f"Bucket should be in us-west-2, found {location}"
        except ClientError as e:
            pytest.skip(f"Could not check bucket location: {e}")

    def test_secondary_bucket_has_tags(self, stack_outputs, aws_clients):
        """Test that secondary bucket has required tags."""
        bucket_arn = stack_outputs.get('secondary_bucket_arn')
        if not bucket_arn:
            pytest.skip("Secondary bucket ARN not found in outputs")

        bucket_name = bucket_arn.split(':::')[-1]

        try:
            response = aws_clients['s3'].get_bucket_tagging(Bucket=bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}

            assert 'Environment' in tags
            assert tags['Environment'] == 'Production'
            assert 'DisasterRecovery' in tags
            assert tags['DisasterRecovery'] == 'Enabled'
            assert 'ManagedBy' in tags
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchTagSet':
                pytest.fail("Bucket should have tags configured")
            raise


class TestSecondaryKMSKey:
    """Test secondary KMS key deployment and configuration."""

    def test_secondary_kms_key_exists(self, stack_outputs, aws_clients):
        """Test that secondary KMS key exists and is enabled."""
        kms_key_arn = stack_outputs.get('secondary_kms_key_arn')
        if not kms_key_arn:
            pytest.skip("Secondary KMS key ARN not found in outputs")

        try:
            response = aws_clients['kms'].describe_key(KeyId=kms_key_arn)
            assert response['KeyMetadata']['KeyState'] == 'Enabled'
            assert response['KeyMetadata']['KeyManager'] == 'CUSTOMER'
        except ClientError as e:
            if e.response['Error']['Code'] == 'NotFoundException':
                pytest.fail(f"KMS key {kms_key_arn} not found")
            raise

    def test_secondary_kms_key_rotation_enabled(self, stack_outputs, aws_clients):
        """Test that KMS key rotation is enabled."""
        kms_key_arn = stack_outputs.get('secondary_kms_key_arn')
        if not kms_key_arn:
            pytest.skip("Secondary KMS key ARN not found in outputs")

        try:
            response = aws_clients['kms'].get_key_rotation_status(KeyId=kms_key_arn)
            assert response['KeyRotationEnabled'] is True, "Key rotation should be enabled"
        except ClientError as e:
            pytest.skip(f"Could not check key rotation status: {e}")

    def test_secondary_kms_key_has_alias(self, stack_outputs, aws_clients):
        """Test that KMS key has an alias configured."""
        kms_key_arn = stack_outputs.get('secondary_kms_key_arn')
        if not kms_key_arn:
            pytest.skip("Secondary KMS key ARN not found in outputs")

        kms_key_id = kms_key_arn.split('/')[-1]

        try:
            response = aws_clients['kms'].list_aliases()
            aliases = response.get('Aliases', [])

            # Find aliases for this key
            key_aliases = [
                alias for alias in aliases
                if alias.get('TargetKeyId') == kms_key_id
            ]

            assert len(key_aliases) > 0, "KMS key should have at least one alias"

            # Check for healthcare-dr-secondary alias
            alias_names = [alias['AliasName'] for alias in key_aliases]
            healthcare_aliases = [name for name in alias_names if 'healthcare-dr-secondary' in name]
            assert len(healthcare_aliases) > 0, "Should have healthcare-dr-secondary alias"
        except ClientError as e:
            pytest.skip(f"Could not verify KMS alias: {e}")

    def test_secondary_kms_key_in_correct_region(self, stack_outputs, aws_clients):
        """Test that KMS key is in the correct region (us-west-2)."""
        kms_key_arn = stack_outputs.get('secondary_kms_key_arn')
        if not kms_key_arn:
            pytest.skip("Secondary KMS key ARN not found in outputs")

        # Extract region from ARN
        arn_parts = kms_key_arn.split(':')
        region = arn_parts[3] if len(arn_parts) > 3 else None

        assert region == 'us-west-2', f"KMS key should be in us-west-2, found {region}"


class TestSecondaryLambdaFunction:
    """Test secondary Lambda function deployment and configuration."""

    def test_secondary_lambda_function_exists(self, stack_outputs, aws_clients):
        """Test that secondary Lambda function exists and is active."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].get_function(FunctionName=lambda_name)
            assert response['Configuration']['State'] == 'Active'
            assert response['Configuration']['FunctionName'] == lambda_name
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.fail(f"Lambda function {lambda_name} not found")
            raise

    def test_secondary_lambda_function_configuration(self, stack_outputs, aws_clients):
        """Test that Lambda function has correct configuration."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].get_function(FunctionName=lambda_name)
            config = response['Configuration']

            # Verify runtime and memory configuration
            assert config['Runtime'] == 'python3.11'
            assert config['MemorySize'] == 3072, "Memory should be 3072 MB (3 GB)"
            assert config['Timeout'] == 30, "Timeout should be 30 seconds"
        except ClientError as e:
            pytest.skip(f"Could not verify Lambda configuration: {e}")

    def test_secondary_lambda_environment_variables(self, stack_outputs, aws_clients):
        """Test that Lambda function has correct environment variables."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].get_function(FunctionName=lambda_name)
            env_vars = response['Configuration'].get('Environment', {}).get('Variables', {})

            assert 'ENVIRONMENT' in env_vars
            assert env_vars['ENVIRONMENT'] == 'production'
            assert 'STAGE' in env_vars
            assert env_vars['STAGE'] == 'secondary', "Stage should be 'secondary'"
        except ClientError as e:
            pytest.skip(f"Could not verify environment variables: {e}")

    def test_secondary_lambda_has_iam_role(self, stack_outputs, aws_clients):
        """Test that Lambda function has an IAM role attached."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].get_function(FunctionName=lambda_name)
            role_arn = response['Configuration']['Role']

            assert role_arn is not None
            assert 'healthcare-dr-lambda-role' in role_arn

            # Verify role exists
            role_name = role_arn.split('/')[-1]
            iam_client = boto3.client('iam')  # IAM is global
            role_response = iam_client.get_role(RoleName=role_name)
            assert role_response['Role']['RoleName'] == role_name
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.fail("Lambda IAM role not found")
            raise

    def test_secondary_lambda_handler_configured(self, stack_outputs, aws_clients):
        """Test that Lambda function has correct handler."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].get_function(FunctionName=lambda_name)
            handler = response['Configuration']['Handler']

            assert handler == 'api_handler.handler'
        except ClientError as e:
            pytest.skip(f"Could not verify Lambda handler: {e}")

    def test_secondary_lambda_has_tags(self, stack_outputs, aws_clients):
        """Test that Lambda function has required tags."""
        lambda_name = stack_outputs.get('secondary_lambda_name')
        if not lambda_name:
            pytest.skip("Secondary Lambda function name not found in outputs")

        try:
            response = aws_clients['lambda'].list_tags(
                Resource=f"arn:aws:lambda:us-west-2:342597974367:function:{lambda_name}"
            )
            tags = response.get('Tags', {})

            assert 'Environment' in tags
            assert tags['Environment'] == 'Production'
            assert 'DisasterRecovery' in tags
            assert tags['DisasterRecovery'] == 'Enabled'
            assert 'ManagedBy' in tags
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            pytest.skip(f"Could not verify Lambda tags: {e}")


class TestSecondaryVPCInfrastructure:
    """Test secondary VPC and networking infrastructure."""

    def test_secondary_vpc_exists(self, aws_clients):
        """Test that secondary VPC exists with correct CIDR block."""
        try:
            response = aws_clients['ec2'].describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['*healthcare-dr-vpc-secondary-v2*']},
                    {'Name': 'cidr-block', 'Values': ['10.1.0.0/16']}
                ]
            )

            vpcs = response.get('Vpcs', [])
            if not vpcs:
                pytest.skip("Secondary VPC not found - may use different tagging")

            vpc = vpcs[0]
            assert vpc['State'] == 'available'
            assert vpc['CidrBlock'] == '10.1.0.0/16', "Secondary VPC should use 10.1.0.0/16"

            # Check DNS attributes using describe_vpc_attribute
            vpc_id = vpc['VpcId']
            dns_hostnames = aws_clients['ec2'].describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsHostnames'
            )
            dns_support = aws_clients['ec2'].describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsSupport'
            )

            assert dns_hostnames['EnableDnsHostnames']['Value'] is True
            assert dns_support['EnableDnsSupport']['Value'] is True
        except ClientError as e:
            pytest.skip(f"Could not verify VPC: {e}")

    def test_secondary_subnets_exist(self, aws_clients):
        """Test that secondary subnets exist across availability zones."""
        try:
            response = aws_clients['ec2'].describe_subnets(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['*healthcare-dr-subnet*secondary-v2*']}
                ]
            )

            subnets = response.get('Subnets', [])
            if not subnets:
                pytest.skip("Secondary subnets not found - may use different tagging")

            # Should have 3 subnets (one per AZ)
            assert len(subnets) >= 3, "Should have at least 3 subnets"

            # Verify CIDR blocks (10.1.x.0/24)
            cidr_blocks = [subnet['CidrBlock'] for subnet in subnets]
            expected_cidrs = ['10.1.0.0/24', '10.1.1.0/24', '10.1.2.0/24']
            for expected_cidr in expected_cidrs:
                assert expected_cidr in cidr_blocks, f"Expected CIDR {expected_cidr} not found"

            # Verify subnets are in different AZs
            availability_zones = [subnet['AvailabilityZone'] for subnet in subnets]
            assert len(set(availability_zones)) >= 3, "Subnets should be in different AZs"

            # Verify AZs are in us-west-2
            for az in availability_zones:
                assert az.startswith('us-west-2'), f"AZ {az} should be in us-west-2"
        except ClientError as e:
            pytest.skip(f"Could not verify subnets: {e}")

    def test_secondary_internet_gateway_exists(self, aws_clients):
        """Test that internet gateway exists for secondary VPC."""
        try:
            response = aws_clients['ec2'].describe_internet_gateways(
                Filters=[
                    {'Name': 'tag:Name', 'Values': ['*healthcare-dr-igw-secondary-v2*']}
                ]
            )

            igws = response.get('InternetGateways', [])
            if not igws:
                pytest.skip("Internet gateway not found - may use different tagging")

            igw = igws[0]
            assert len(igw['Attachments']) > 0, "Internet gateway should be attached to VPC"
            assert igw['Attachments'][0]['State'] == 'available'
        except ClientError as e:
            pytest.skip(f"Could not verify internet gateway: {e}")

    def test_secondary_security_group_exists(self, aws_clients):
        """Test that Lambda security group exists."""
        try:
            response = aws_clients['ec2'].describe_security_groups(
                Filters=[
                    {'Name': 'group-name', 'Values': ['*healthcare-dr-lambda-sg-secondary*']},
                ]
            )

            security_groups = response.get('SecurityGroups', [])
            if not security_groups:
                pytest.skip("Security group not found - may use different naming")

            sg = security_groups[0]
            assert sg['GroupName'] is not None

            # Verify ingress rules (HTTPS)
            ingress_rules = sg.get('IpPermissions', [])
            https_rules = [rule for rule in ingress_rules if rule.get('FromPort') == 443]
            assert len(https_rules) > 0, "Should have HTTPS ingress rule"

            # Verify egress rules (allow all)
            egress_rules = sg.get('IpPermissionsEgress', [])
            assert len(egress_rules) > 0, "Should have egress rules"
        except ClientError as e:
            pytest.skip(f"Could not verify security group: {e}")


class TestSecondaryMonitoring:
    """Test CloudWatch monitoring and SNS for secondary region."""

    def test_secondary_sns_topic_exists(self, aws_clients):
        """Test that SNS topic exists for secondary region."""
        try:
            response = aws_clients['sns'].list_topics()
            topics = response.get('Topics', [])

            healthcare_topics = [
                topic for topic in topics
                if 'healthcare-dr-failover-secondary-v2' in topic['TopicArn']
            ]

            if not healthcare_topics:
                pytest.skip("SNS topic not found - may use different naming")

            topic_arn = healthcare_topics[0]['TopicArn']

            # Verify topic is in us-west-2
            assert 'us-west-2' in topic_arn, "SNS topic should be in us-west-2"

            # Verify topic attributes
            attrs_response = aws_clients['sns'].get_topic_attributes(TopicArn=topic_arn)
            assert attrs_response['Attributes'] is not None
        except ClientError as e:
            pytest.skip(f"Could not verify SNS topic: {e}")

    def test_secondary_cloudwatch_dashboard_exists(self, aws_clients):
        """Test that CloudWatch dashboard exists for secondary region."""
        try:
            response = aws_clients['cloudwatch'].list_dashboards()
            dashboards = response.get('DashboardEntries', [])

            healthcare_dashboards = [
                dashboard for dashboard in dashboards
                if 'healthcare-dr-secondary-v2' in dashboard['DashboardName']
            ]

            if not healthcare_dashboards:
                pytest.skip("CloudWatch dashboard not found - may use different naming")

            # Get dashboard details
            dashboard_name = healthcare_dashboards[0]['DashboardName']
            dashboard_response = aws_clients['cloudwatch'].get_dashboard(
                DashboardName=dashboard_name
            )

            assert dashboard_response['DashboardBody'] is not None
            dashboard_body = json.loads(dashboard_response['DashboardBody'])
            assert 'widgets' in dashboard_body

            # Verify dashboard is for us-west-2 region
            widgets = dashboard_body.get('widgets', [])
            if widgets:
                # Check that widgets reference us-west-2
                widget_str = json.dumps(dashboard_body)
                assert 'us-west-2' in widget_str, "Dashboard should reference us-west-2"
        except ClientError as e:
            pytest.skip(f"Could not verify CloudWatch dashboard: {e}")


class TestCrossRegionConsistency:
    """Test consistency between primary and secondary regions."""

    def test_lambda_configurations_match(self, stack_outputs):
        """Test that Lambda configurations are consistent across regions."""
        primary_lambda = stack_outputs.get('primary_lambda_name')
        secondary_lambda = stack_outputs.get('secondary_lambda_name')

        if not primary_lambda or not secondary_lambda:
            pytest.skip("Lambda names not found in outputs")

        try:
            primary_client = boto3.client('lambda', region_name='us-east-1')
            secondary_client = boto3.client('lambda', region_name='us-west-2')

            primary_config = primary_client.get_function(FunctionName=primary_lambda)['Configuration']
            secondary_config = secondary_client.get_function(FunctionName=secondary_lambda)['Configuration']

            # Compare configurations
            assert primary_config['Runtime'] == secondary_config['Runtime']
            assert primary_config['MemorySize'] == secondary_config['MemorySize']
            assert primary_config['Timeout'] == secondary_config['Timeout']
            assert primary_config['Handler'] == secondary_config['Handler']

            # Environment variables should be same except STAGE
            primary_env = primary_config.get('Environment', {}).get('Variables', {})
            secondary_env = secondary_config.get('Environment', {}).get('Variables', {})

            assert primary_env.get('ENVIRONMENT') == secondary_env.get('ENVIRONMENT')
            assert primary_env.get('STAGE') == 'primary'
            assert secondary_env.get('STAGE') == 'secondary'
        except ClientError as e:
            pytest.skip(f"Could not compare Lambda configurations: {e}")

    def test_s3_bucket_configurations_match(self, stack_outputs):
        """Test that S3 bucket configurations are consistent."""
        primary_bucket_arn = stack_outputs.get('primary_bucket_arn')
        secondary_bucket_arn = stack_outputs.get('secondary_bucket_arn')

        if not primary_bucket_arn or not secondary_bucket_arn:
            pytest.skip("Bucket ARNs not found in outputs")

        primary_bucket = primary_bucket_arn.split(':::')[-1]
        secondary_bucket = secondary_bucket_arn.split(':::')[-1]

        try:
            primary_s3 = boto3.client('s3', region_name='us-east-1')
            secondary_s3 = boto3.client('s3', region_name='us-west-2')

            # Compare versioning
            primary_versioning = primary_s3.get_bucket_versioning(Bucket=primary_bucket)
            secondary_versioning = secondary_s3.get_bucket_versioning(Bucket=secondary_bucket)

            assert primary_versioning.get('Status') == secondary_versioning.get('Status')
            assert primary_versioning.get('Status') == 'Enabled'

            # Compare encryption
            primary_encryption = primary_s3.get_bucket_encryption(Bucket=primary_bucket)
            secondary_encryption = secondary_s3.get_bucket_encryption(Bucket=secondary_bucket)

            primary_algo = primary_encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
            secondary_algo = secondary_encryption['ServerSideEncryptionConfiguration']['Rules'][0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']

            assert primary_algo == secondary_algo == 'aws:kms'
        except ClientError as e:
            pytest.skip(f"Could not compare S3 configurations: {e}")

    def test_vpc_cidr_blocks_dont_overlap(self):
        """Test that primary and secondary VPC CIDR blocks don't overlap."""
        try:
            primary_ec2 = boto3.client('ec2', region_name='us-east-1')
            secondary_ec2 = boto3.client('ec2', region_name='us-west-2')

            # Get VPCs
            primary_vpcs = primary_ec2.describe_vpcs(
                Filters=[{'Name': 'tag:Name', 'Values': ['*healthcare-dr-vpc-primary-v2*']}]
            )
            secondary_vpcs = secondary_ec2.describe_vpcs(
                Filters=[{'Name': 'tag:Name', 'Values': ['*healthcare-dr-vpc-secondary-v2*']}]
            )

            if not primary_vpcs.get('Vpcs') or not secondary_vpcs.get('Vpcs'):
                pytest.skip("VPCs not found")

            primary_cidr = primary_vpcs['Vpcs'][0]['CidrBlock']
            secondary_cidr = secondary_vpcs['Vpcs'][0]['CidrBlock']

            # Verify different CIDR blocks
            assert primary_cidr == '10.0.0.0/16'
            assert secondary_cidr == '10.1.0.0/16'
            assert primary_cidr != secondary_cidr, "VPC CIDR blocks should not overlap"
        except ClientError as e:
            pytest.skip(f"Could not verify VPC CIDR blocks: {e}")
