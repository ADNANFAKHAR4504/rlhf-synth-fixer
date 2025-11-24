"""Unit tests for TapStack (unified stack) with mocked AWS resources."""
import pytest
import json
from unittest.mock import Mock, patch, call
from constructs import Construct
from lib.tap_stack import TapStack


@pytest.fixture
def stack_params():
    """Common stack parameters for testing."""
    return {
        "scope": Mock(spec=Construct),
        "construct_id": "test-tap-stack",
        "environment_suffix": "test",
        "aws_region": "us-east-1",
        "state_bucket_region": "us-east-1",
        "state_bucket": "test-state-bucket",
        "default_tags": {"Environment": "test", "Project": "healthcare-dr"}
    }


class TestTapStackInitialization:
    """Test TapStack initialization and configuration."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_tap_stack_initialization(self, mock_backend, mock_provider, mock_kms_key,
                                     mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                     mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                     mock_s3, mock_versioning, mock_encryption,
                                     mock_iam_role, mock_iam_policy, mock_iam_attach,
                                     mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                     mock_dynamodb, mock_zone, mock_record, mock_output,
                                     stack_params):
        """Test that TapStack initializes with correct configuration."""
        # Arrange
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert
        assert stack.environment_suffix == "test"
        assert stack.aws_region == "us-east-1"
        assert stack.common_tags["Environment"] == "Production"
        assert stack.common_tags["DisasterRecovery"] == "Enabled"
        assert stack.common_tags["ManagedBy"] == "CDKTF"

        # Verify S3 Backend configuration
        mock_backend.assert_called_once()
        backend_args = mock_backend.call_args[1]
        assert backend_args["bucket"] == "test-state-bucket"
        assert backend_args["key"] == "healthcare-dr/test/terraform.tfstate"
        assert backend_args["region"] == "us-east-1"
        assert backend_args["encrypt"] is True

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_dual_provider_configuration(self, mock_backend, mock_provider, mock_kms_key,
                                        mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                        mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                        mock_s3, mock_versioning, mock_encryption,
                                        mock_iam_role, mock_iam_policy, mock_iam_attach,
                                        mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                        mock_dynamodb, mock_zone, mock_record, mock_output,
                                        stack_params):
        """Test that both primary and secondary AWS providers are configured."""
        # Arrange
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two providers should be created (primary and secondary)
        assert mock_provider.call_count == 2

        # Check primary provider
        primary_provider_call = mock_provider.call_args_list[0]
        assert primary_provider_call[0][1] == "aws"
        assert primary_provider_call[1]["region"] == "us-east-1"

        # Check secondary provider
        secondary_provider_call = mock_provider.call_args_list[1]
        assert secondary_provider_call[0][1] == "aws_secondary"
        assert secondary_provider_call[1]["alias"] == "secondary"
        assert secondary_provider_call[1]["region"] == "us-west-2"

    def _setup_all_mocks(self, mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                        mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                        mock_lambda, mock_sns, mock_dynamodb, mock_zone):
        """Helper to setup all mocks."""
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")


class TestPrimaryRegionResources:
    """Test primary region resource creation."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_primary_kms_key_created(self, mock_backend, mock_provider, mock_kms_key,
                                    mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                    mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                    mock_s3, mock_versioning, mock_encryption,
                                    mock_iam_role, mock_iam_policy, mock_iam_attach,
                                    mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                    mock_dynamodb, mock_zone, mock_record, mock_output,
                                    stack_params):
        """Test that primary KMS key is created."""
        # Arrange
        mock_kms_instance = Mock(key_id="kms-primary-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_kms_key.return_value = mock_kms_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - KMS key should be created twice (primary + secondary)
        assert mock_kms_key.call_count == 2

        # Find primary KMS key call
        primary_kms_calls = [call for call in mock_kms_key.call_args_list
                            if "provider" not in call[1]]
        assert len(primary_kms_calls) == 1
        primary_kms_args = primary_kms_calls[0][1]
        assert "primary" in primary_kms_args["description"]
        assert primary_kms_args["enable_key_rotation"] is True

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_primary_vpc_and_subnets_created(self, mock_backend, mock_provider, mock_kms_key,
                                            mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                            mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                            mock_s3, mock_versioning, mock_encryption,
                                            mock_iam_role, mock_iam_policy, mock_iam_attach,
                                            mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                            mock_dynamodb, mock_zone, mock_record, mock_output,
                                            stack_params):
        """Test that primary VPC and subnets are created."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc_instance = Mock(id="vpc-primary-123")
        mock_vpc.return_value = mock_vpc_instance
        mock_subnet.return_value = Mock(id="subnet-123")
        self._setup_mocks(mock_igw, mock_rt, mock_sg, mock_s3, mock_iam_role,
                         mock_iam_policy, mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two VPCs should be created (primary + secondary)
        assert mock_vpc.call_count == 2

        # Find primary VPC call
        primary_vpc_calls = [call for call in mock_vpc.call_args_list
                            if call[1]["cidr_block"] == "10.0.0.0/16"]
        assert len(primary_vpc_calls) == 1

        # Verify subnets created (3 per region * 2 regions = 6)
        assert mock_subnet.call_count == 6

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_primary_s3_bucket_with_versioning_and_encryption(self, mock_backend, mock_provider, mock_kms_key,
                                                              mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                                              mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                                              mock_s3, mock_versioning, mock_encryption,
                                                              mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                              mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                              mock_dynamodb, mock_zone, mock_record, mock_output,
                                                              stack_params):
        """Test that primary S3 bucket is created with versioning and encryption."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3_instance = Mock(id="bucket-primary-123", arn="arn:aws:s3:::bucket-primary-123")
        mock_s3.return_value = mock_s3_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two S3 buckets should be created (primary + secondary)
        assert mock_s3.call_count == 2

        # Find primary bucket call
        primary_bucket_calls = [call for call in mock_s3.call_args_list
                               if "primary" in call[1]["bucket"]]
        assert len(primary_bucket_calls) == 1
        primary_bucket_args = primary_bucket_calls[0][1]
        assert primary_bucket_args["force_destroy"] is True

        # Verify versioning (2 calls - primary + secondary)
        assert mock_versioning.call_count == 2

        # Verify encryption (2 calls - primary + secondary)
        assert mock_encryption.call_count == 2

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_primary_lambda_function_created(self, mock_backend, mock_provider, mock_kms_key,
                                            mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                            mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                            mock_s3, mock_versioning, mock_encryption,
                                            mock_iam_role, mock_iam_policy, mock_iam_attach,
                                            mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                            mock_dynamodb, mock_zone, mock_record, mock_output,
                                            stack_params):
        """Test that primary Lambda function is created with correct configuration."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda_instance = Mock(function_name="healthcare-dr-api-primary-v2-test")
        mock_lambda.return_value = mock_lambda_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two Lambda functions should be created (primary + secondary)
        assert mock_lambda.call_count == 2

        # Find primary Lambda call
        primary_lambda_calls = [call for call in mock_lambda.call_args_list
                               if "primary" in call[1]["function_name"]]
        assert len(primary_lambda_calls) == 1
        primary_lambda_args = primary_lambda_calls[0][1]
        assert primary_lambda_args["runtime"] == "python3.11"
        assert primary_lambda_args["memory_size"] == 3072
        assert primary_lambda_args["timeout"] == 30
        assert primary_lambda_args["environment"]["variables"]["STAGE"] == "primary"

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                        mock_iam_role, mock_iam_policy,
                        mock_lambda, mock_sns, mock_dynamodb, mock_zone):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")

    def _setup_mocks(self, mock_igw, mock_rt, mock_sg, mock_s3, mock_iam_role,
                    mock_iam_policy, mock_lambda, mock_sns, mock_dynamodb, mock_zone):
        """Helper to setup basic mocks."""
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")


class TestSecondaryRegionResources:
    """Test secondary region resource creation."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_secondary_resources_created_with_provider(self, mock_backend, mock_provider, mock_kms_key,
                                                       mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                                       mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                                       mock_s3, mock_versioning, mock_encryption,
                                                       mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                       mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                       mock_dynamodb, mock_zone, mock_record, mock_output,
                                                       stack_params):
        """Test that secondary resources are created with secondary provider."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Check that secondary resources have provider parameter
        secondary_kms_calls = [call for call in mock_kms_key.call_args_list
                              if "provider" in call[1]]
        assert len(secondary_kms_calls) == 1

        secondary_vpc_calls = [call for call in mock_vpc.call_args_list
                              if call[1]["cidr_block"] == "10.1.0.0/16"]
        assert len(secondary_vpc_calls) == 1
        assert "provider" in secondary_vpc_calls[0][1]

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_secondary_lambda_with_correct_environment(self, mock_backend, mock_provider, mock_kms_key,
                                                       mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                                       mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                                       mock_s3, mock_versioning, mock_encryption,
                                                       mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                       mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                       mock_dynamodb, mock_zone, mock_record, mock_output,
                                                       stack_params):
        """Test that secondary Lambda has correct environment variables."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Find secondary Lambda call
        secondary_lambda_calls = [call for call in mock_lambda.call_args_list
                                 if "secondary" in call[1]["function_name"]]
        assert len(secondary_lambda_calls) == 1
        secondary_lambda_args = secondary_lambda_calls[0][1]
        assert secondary_lambda_args["environment"]["variables"]["STAGE"] == "secondary"
        assert "provider" in secondary_lambda_args

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                        mock_s3, mock_iam_role, mock_iam_policy,
                        mock_lambda, mock_sns, mock_dynamodb, mock_zone):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")


class TestGlobalResources:
    """Test global resources (DynamoDB, Route53)."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_dynamodb_global_tables_created(self, mock_backend, mock_provider, mock_kms_key,
                                           mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                           mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                           mock_s3, mock_versioning, mock_encryption,
                                           mock_iam_role, mock_iam_policy, mock_iam_attach,
                                           mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                           mock_dynamodb, mock_zone, mock_record, mock_output,
                                           stack_params):
        """Test that DynamoDB global tables are created."""
        # Arrange
        mock_dynamodb_instance = Mock(name="patient-records-v2-test")
        mock_dynamodb.return_value = mock_dynamodb_instance
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two DynamoDB tables should be created (patient records + audit logs)
        assert mock_dynamodb.call_count == 2

        # Verify patient records table
        patient_table_calls = [call for call in mock_dynamodb.call_args_list
                              if "patient-records" in call[1]["name"]]
        assert len(patient_table_calls) == 1
        patient_table_args = patient_table_calls[0][1]
        assert patient_table_args["billing_mode"] == "PAY_PER_REQUEST"
        assert patient_table_args["hash_key"] == "patient_id"
        assert patient_table_args["range_key"] == "record_timestamp"
        assert patient_table_args["stream_enabled"] is True

        # Verify replica configuration
        replicas = patient_table_args["replica"]
        assert len(replicas) == 1
        assert replicas[0].region_name == "us-west-2"

        # Verify point-in-time recovery
        assert patient_table_args["point_in_time_recovery"].enabled is True

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_route53_infrastructure_created(self, mock_backend, mock_provider, mock_kms_key,
                                           mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                           mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                           mock_s3, mock_versioning, mock_encryption,
                                           mock_iam_role, mock_iam_policy, mock_iam_attach,
                                           mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                           mock_dynamodb, mock_zone, mock_record, mock_output,
                                           stack_params):
        """Test that Route 53 hosted zone and records are created."""
        # Arrange
        mock_zone_instance = Mock(zone_id="Z123456789")
        mock_zone.return_value = mock_zone_instance
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Verify hosted zone
        mock_zone.assert_called_once()
        zone_args = mock_zone.call_args[1]
        assert zone_args["name"] == "healthcare-dr-v2-test.com"

        # Verify Route53 records (2 weighted records - primary and secondary)
        assert mock_record.call_count == 2

        # Check weighted routing
        weights = [call[1]["weighted_routing_policy"].weight
                  for call in mock_record.call_args_list]
        assert 70 in weights  # Primary weight
        assert 30 in weights  # Secondary weight

    def _setup_all_mocks(self, mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                        mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                        mock_lambda, mock_sns, mock_dynamodb):
        """Helper to setup all mocks."""
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")


class TestMonitoring:
    """Test CloudWatch monitoring resources."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_cloudwatch_dashboards_created(self, mock_backend, mock_provider, mock_kms_key,
                                          mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                          mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                          mock_s3, mock_versioning, mock_encryption,
                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                          mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                          mock_dynamodb, mock_zone, mock_record, mock_output,
                                          stack_params):
        """Test that CloudWatch dashboards are created for both regions."""
        # Arrange
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_lambda, mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Two dashboards should be created (primary + secondary)
        assert mock_dashboard.call_count == 2

        # Check for primary and secondary dashboards
        dashboard_names = [call[1]["dashboard_name"] for call in mock_dashboard.call_args_list]
        assert any("primary" in name for name in dashboard_names)
        assert any("secondary" in name for name in dashboard_names)

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_cloudwatch_alarms_created_for_primary(self, mock_backend, mock_provider, mock_kms_key,
                                                   mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                                   mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                                   mock_s3, mock_versioning, mock_encryption,
                                                   mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                   mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                   mock_dynamodb, mock_zone, mock_record, mock_output,
                                                   stack_params):
        """Test that CloudWatch alarms are created for primary region only."""
        # Arrange
        mock_lambda_instance = Mock(function_name="test-lambda")
        mock_lambda.return_value = mock_lambda_instance
        mock_sns_instance = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_sns.return_value = mock_sns_instance
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                             mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Only primary alarm should be created
        mock_alarm.assert_called_once()
        alarm_args = mock_alarm.call_args[1]
        assert "primary" in alarm_args["alarm_name"]
        assert alarm_args["metric_name"] == "Errors"
        assert alarm_args["threshold"] == 5

    def _setup_all_mocks(self, mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                        mock_sg, mock_s3, mock_iam_role, mock_iam_policy,
                        mock_lambda, mock_dynamodb, mock_zone):
        """Helper to setup all mocks."""
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")


class TestTerraformOutputs:
    """Test Terraform outputs creation."""

    @patch('lib.tap_stack.TerraformOutput')
    @patch('lib.tap_stack.Route53Record')
    @patch('lib.tap_stack.Route53Zone')
    @patch('lib.tap_stack.DynamodbTable')
    @patch('lib.tap_stack.CloudwatchMetricAlarm')
    @patch('lib.tap_stack.CloudwatchDashboard')
    @patch('lib.tap_stack.SnsTopic')
    @patch('lib.tap_stack.LambdaFunction')
    @patch('lib.tap_stack.IamRolePolicyAttachment')
    @patch('lib.tap_stack.IamPolicy')
    @patch('lib.tap_stack.IamRole')
    @patch('lib.tap_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.tap_stack.S3BucketVersioningA')
    @patch('lib.tap_stack.S3Bucket')
    @patch('lib.tap_stack.SecurityGroup')
    @patch('lib.tap_stack.RouteTableAssociation')
    @patch('lib.tap_stack.Route')
    @patch('lib.tap_stack.RouteTable')
    @patch('lib.tap_stack.InternetGateway')
    @patch('lib.tap_stack.Subnet')
    @patch('lib.tap_stack.Vpc')
    @patch('lib.tap_stack.KmsAlias')
    @patch('lib.tap_stack.KmsKey')
    @patch('lib.tap_stack.AwsProvider')
    @patch('lib.tap_stack.S3Backend')
    def test_all_terraform_outputs_created(self, mock_backend, mock_provider, mock_kms_key,
                                          mock_kms_alias, mock_vpc, mock_subnet, mock_igw,
                                          mock_rt, mock_route, mock_rt_assoc, mock_sg,
                                          mock_s3, mock_versioning, mock_encryption,
                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                          mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                          mock_dynamodb, mock_zone, mock_record, mock_output,
                                          stack_params):
        """Test that all required Terraform outputs are created."""
        # Arrange
        mock_kms_instance = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_kms_key.return_value = mock_kms_instance
        mock_s3_instance = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_s3.return_value = mock_s3_instance
        mock_lambda_instance = Mock(function_name="test-lambda")
        mock_lambda.return_value = mock_lambda_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_iam_role, mock_iam_policy,
                             mock_sns, mock_dynamodb, mock_zone)

        # Act
        stack = TapStack(**stack_params)

        # Assert - Check that TerraformOutput was called multiple times
        assert mock_output.call_count >= 6  # At least 6 outputs expected

        # Verify output names
        output_ids = [call[0][1] for call in mock_output.call_args_list]
        assert "primary_bucket_arn" in output_ids
        assert "secondary_bucket_arn" in output_ids
        assert "primary_lambda_name" in output_ids
        assert "secondary_lambda_name" in output_ids
        assert "primary_kms_key_arn" in output_ids
        assert "secondary_kms_key_arn" in output_ids

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                        mock_iam_role, mock_iam_policy,
                        mock_sns, mock_dynamodb, mock_zone):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")
