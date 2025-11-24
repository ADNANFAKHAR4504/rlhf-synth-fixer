"""Unit tests for PrimaryStack with mocked AWS resources."""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock, call
from constructs import Construct
from lib.stacks.primary_stack import PrimaryStack


@pytest.fixture
def stack_params():
    """Common stack parameters for testing."""
    return {
        "scope": Mock(spec=Construct),
        "id": "test-primary-stack",
        "region": "us-east-1",
        "environment_suffix": "test",
        "state_bucket": "test-state-bucket",
        "state_bucket_region": "us-east-1",
        "default_tags": {"Environment": "test", "Project": "healthcare-dr"}
    }


class TestPrimaryStackInitialization:
    """Test PrimaryStack initialization and configuration."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_primary_stack_creation(self, mock_output, mock_backend, mock_provider,
                                    mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                    mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                    mock_sg, mock_s3, mock_versioning, mock_encryption,
                                    mock_iam_role, mock_iam_policy, mock_iam_attach,
                                    mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                    stack_params):
        """Test that PrimaryStack initializes correctly with all resources."""
        # Arrange
        mock_kms_instance = Mock()
        mock_kms_instance.key_id = "kms-key-123"
        mock_kms_instance.arn = "arn:aws:kms:us-east-1:123456789:key/kms-key-123"
        mock_kms_key.return_value = mock_kms_instance

        mock_vpc_instance = Mock()
        mock_vpc_instance.id = "vpc-123"
        mock_vpc.return_value = mock_vpc_instance

        mock_subnet_instance = Mock()
        mock_subnet_instance.id = "subnet-123"
        mock_subnet.return_value = mock_subnet_instance

        mock_igw_instance = Mock()
        mock_igw_instance.id = "igw-123"
        mock_igw.return_value = mock_igw_instance

        mock_rt_instance = Mock()
        mock_rt_instance.id = "rt-123"
        mock_rt.return_value = mock_rt_instance

        mock_sg_instance = Mock()
        mock_sg_instance.id = "sg-123"
        mock_sg.return_value = mock_sg_instance

        mock_s3_instance = Mock()
        mock_s3_instance.id = "bucket-123"
        mock_s3_instance.arn = "arn:aws:s3:::bucket-123"
        mock_s3.return_value = mock_s3_instance

        mock_iam_role_instance = Mock()
        mock_iam_role_instance.name = "lambda-role"
        mock_iam_role_instance.arn = "arn:aws:iam::123456789:role/lambda-role"
        mock_iam_role.return_value = mock_iam_role_instance

        mock_iam_policy_instance = Mock()
        mock_iam_policy_instance.arn = "arn:aws:iam::123456789:policy/lambda-policy"
        mock_iam_policy.return_value = mock_iam_policy_instance

        mock_lambda_instance = Mock()
        mock_lambda_instance.function_name = "test-lambda"
        mock_lambda.return_value = mock_lambda_instance

        mock_sns_instance = Mock()
        mock_sns_instance.arn = "arn:aws:sns:us-east-1:123456789:topic"
        mock_sns.return_value = mock_sns_instance

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        assert stack.region == "us-east-1"
        assert stack.environment_suffix == "test"
        assert stack.common_tags["Environment"] == "Production"
        assert stack.common_tags["DisasterRecovery"] == "Enabled"
        assert stack.common_tags["Region"] == "Primary"

        # Verify S3 Backend configuration
        mock_backend.assert_called_once()
        backend_call_args = mock_backend.call_args[1]
        assert backend_call_args["bucket"] == "test-state-bucket"
        assert backend_call_args["key"] == "healthcare-dr/primary/test/terraform.tfstate"
        assert backend_call_args["region"] == "us-east-1"
        assert backend_call_args["encrypt"] is True

        # Verify AWS Provider configuration
        mock_provider.assert_called_once()
        provider_call_args = mock_provider.call_args[1]
        assert provider_call_args["region"] == "us-east-1"


class TestKmsKey:
    """Test KMS key creation."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_kms_key_created_with_rotation(self, mock_output, mock_backend, mock_provider,
                                          mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                          mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                          mock_sg, mock_s3, mock_versioning, mock_encryption,
                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                          mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                          stack_params):
        """Test that KMS key is created with rotation enabled."""
        # Arrange
        mock_kms_instance = Mock()
        mock_kms_instance.key_id = "kms-key-123"
        mock_kms_instance.arn = "arn:aws:kms:us-east-1:123456789:key/kms-key-123"
        mock_kms_key.return_value = mock_kms_instance

        self._setup_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                         mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_kms_key.assert_called_once()
        kms_args = mock_kms_key.call_args[1]
        assert kms_args["description"] == "KMS key for healthcare DR - test"
        assert kms_args["enable_key_rotation"] is True
        assert "Name" in kms_args["tags"]

        # Verify KMS alias was created
        mock_kms_alias.assert_called_once()
        alias_args = mock_kms_alias.call_args[1]
        assert alias_args["name"] == "alias/healthcare-dr-v1-test"
        assert alias_args["target_key_id"] == "kms-key-123"

    def _setup_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                    mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns):
        """Helper method to setup common mocks."""
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


class TestVpcInfrastructure:
    """Test VPC and networking infrastructure."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_vpc_created_with_dns_enabled(self, mock_output, mock_backend, mock_provider,
                                         mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                         mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                         mock_sg, mock_s3, mock_versioning, mock_encryption,
                                         mock_iam_role, mock_iam_policy, mock_iam_attach,
                                         mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                         stack_params):
        """Test that VPC is created with DNS support enabled."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc_instance = Mock(id="vpc-123")
        mock_vpc.return_value = mock_vpc_instance
        self._setup_mocks(mock_subnet, mock_igw, mock_rt, mock_sg, mock_s3,
                         mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_vpc.assert_called_once()
        vpc_args = mock_vpc.call_args[1]
        assert vpc_args["cidr_block"] == "10.0.0.0/16"
        assert vpc_args["enable_dns_hostnames"] is True
        assert vpc_args["enable_dns_support"] is True
        assert "Name" in vpc_args["tags"]

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_subnets_created_across_availability_zones(self, mock_output, mock_backend, mock_provider,
                                                       mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                       mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                       mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                       mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                       mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                       stack_params):
        """Test that subnets are created in three availability zones."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet_instance = Mock(id="subnet-123")
        mock_subnet.return_value = mock_subnet_instance
        self._setup_mocks(mock_igw, mock_rt, mock_sg, mock_s3,
                         mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert - Should create 3 subnets (a, b, c)
        assert mock_subnet.call_count == 3

        # Verify subnet configurations
        for i, call_args in enumerate(mock_subnet.call_args_list):
            subnet_args = call_args[1]
            assert subnet_args["vpc_id"] == "vpc-123"
            assert subnet_args["cidr_block"] == f"10.0.{i}.0/24"
            assert subnet_args["availability_zone"] in ["us-east-1a", "us-east-1b", "us-east-1c"]
            assert subnet_args["map_public_ip_on_launch"] is True

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_internet_gateway_and_route_table_created(self, mock_output, mock_backend, mock_provider,
                                                      mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                      mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                      mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                      mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                      mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                      stack_params):
        """Test that internet gateway and route table are created."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw_instance = Mock(id="igw-123")
        mock_igw.return_value = mock_igw_instance
        mock_rt_instance = Mock(id="rt-123")
        mock_rt.return_value = mock_rt_instance
        self._setup_mocks(mock_sg, mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_igw.assert_called_once()
        igw_args = mock_igw.call_args[1]
        assert igw_args["vpc_id"] == "vpc-123"

        mock_rt.assert_called_once()
        rt_args = mock_rt.call_args[1]
        assert rt_args["vpc_id"] == "vpc-123"

        # Verify route to internet gateway
        mock_route.assert_called_once()
        route_args = mock_route.call_args[1]
        assert route_args["route_table_id"] == "rt-123"
        assert route_args["destination_cidr_block"] == "0.0.0.0/0"
        assert route_args["gateway_id"] == "igw-123"

        # Verify route table associations (3 subnets)
        assert mock_rt_assoc.call_count == 3

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_security_group_created_with_correct_rules(self, mock_output, mock_backend, mock_provider,
                                                       mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                       mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                       mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                       mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                       mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                       stack_params):
        """Test that security group is created with correct ingress/egress rules."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg_instance = Mock(id="sg-123")
        mock_sg.return_value = mock_sg_instance
        self._setup_mocks(mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_sg.assert_called_once()
        sg_args = mock_sg.call_args[1]
        assert sg_args["name"] == "healthcare-dr-lambda-sg-v1-test"
        assert sg_args["description"] == "Security group for Lambda functions"
        assert sg_args["vpc_id"] == "vpc-123"

        # Verify egress rules (allow all outbound)
        egress_rules = sg_args["egress"]
        assert len(egress_rules) == 1
        assert egress_rules[0].from_port == 0
        assert egress_rules[0].to_port == 0
        assert egress_rules[0].protocol == "-1"

        # Verify ingress rules (HTTPS only)
        ingress_rules = sg_args["ingress"]
        assert len(ingress_rules) == 1
        assert ingress_rules[0].from_port == 443
        assert ingress_rules[0].to_port == 443
        assert ingress_rules[0].protocol == "tcp"

    def _setup_mocks(self, *mocks):
        """Helper to setup basic mock returns."""
        defaults = [
            Mock(id="subnet-123"),
            Mock(id="igw-123"),
            Mock(id="rt-123"),
            Mock(id="sg-123"),
            Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123"),
            Mock(name="role", arn="arn:aws:iam::123:role/role"),
            Mock(arn="arn:aws:iam::123:policy/policy"),
            Mock(function_name="lambda"),
            Mock(arn="arn:aws:sns:us-east-1:123:topic")
        ]
        for mock_obj, default in zip(mocks, defaults):
            mock_obj.return_value = default


class TestS3Bucket:
    """Test S3 bucket creation and configuration."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_s3_bucket_created_with_versioning_and_encryption(self, mock_output, mock_backend, mock_provider,
                                                              mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                              mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                              mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                              mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                              mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                              stack_params):
        """Test that S3 bucket is created with versioning and KMS encryption."""
        # Arrange
        mock_kms_instance = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_kms_key.return_value = mock_kms_instance
        mock_s3_instance = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_s3.return_value = mock_s3_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_s3.assert_called_once()
        s3_args = mock_s3.call_args[1]
        assert s3_args["bucket"] == "healthcare-medical-docs-primary-v1-test"
        assert s3_args["force_destroy"] is True
        assert "Name" in s3_args["tags"]

        # Verify versioning is enabled
        mock_versioning.assert_called_once()
        versioning_args = mock_versioning.call_args[1]
        assert versioning_args["bucket"] == "bucket-123"
        assert versioning_args["versioning_configuration"]["status"] == "Enabled"

        # Verify encryption is configured
        mock_encryption.assert_called_once()
        encryption_args = mock_encryption.call_args[1]
        assert encryption_args["bucket"] == "bucket-123"
        rule = encryption_args["rule"][0]
        assert rule.apply_server_side_encryption_by_default.sse_algorithm == "aws:kms"
        assert rule.apply_server_side_encryption_by_default.kms_master_key_id == "arn:aws:kms:us-east-1:123:key/kms-123"

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                        mock_iam_role, mock_iam_policy, mock_lambda, mock_sns):
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


class TestLambdaFunction:
    """Test Lambda function creation and IAM configuration."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_lambda_function_created_with_correct_configuration(self, mock_output, mock_backend, mock_provider,
                                                                mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                                mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                                mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                                mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                                mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                                stack_params):
        """Test that Lambda function is created with correct configuration."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role_instance = Mock(name="lambda-role", arn="arn:aws:iam::123:role/lambda-role")
        mock_iam_role.return_value = mock_iam_role_instance
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/lambda-policy")
        mock_lambda_instance = Mock(function_name="healthcare-dr-api-primary-v1-test")
        mock_lambda.return_value = mock_lambda_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_lambda.assert_called_once()
        lambda_args = mock_lambda.call_args[1]
        assert lambda_args["function_name"] == "healthcare-dr-api-primary-v1-test"
        assert lambda_args["role"] == "arn:aws:iam::123:role/lambda-role"
        assert lambda_args["handler"] == "api_handler.handler"
        assert lambda_args["runtime"] == "python3.11"
        assert lambda_args["memory_size"] == 3072
        assert lambda_args["timeout"] == 30
        assert lambda_args["environment"]["variables"]["ENVIRONMENT"] == "production"
        assert lambda_args["environment"]["variables"]["STAGE"] == "primary"

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_lambda_iam_role_with_correct_permissions(self, mock_output, mock_backend, mock_provider,
                                                      mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                      mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                      mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                      mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                      mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                      stack_params):
        """Test that Lambda IAM role is created with correct permissions."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role_instance = Mock(name="lambda-role", arn="arn:aws:iam::123:role/lambda-role")
        mock_iam_role.return_value = mock_iam_role_instance
        mock_iam_policy_instance = Mock(arn="arn:aws:iam::123:policy/lambda-policy")
        mock_iam_policy.return_value = mock_iam_policy_instance
        mock_lambda.return_value = Mock(function_name="lambda")
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert - Verify IAM role creation
        mock_iam_role.assert_called_once()
        role_args = mock_iam_role.call_args[1]
        assert role_args["name"] == "healthcare-dr-lambda-role-primary-v1-test"
        assume_role_policy = json.loads(role_args["assume_role_policy"])
        assert assume_role_policy["Statement"][0]["Principal"]["Service"] == "lambda.amazonaws.com"

        # Verify IAM policy creation with correct permissions
        mock_iam_policy.assert_called_once()
        policy_args = mock_iam_policy.call_args[1]
        policy_document = json.loads(policy_args["policy"])

        # Check DynamoDB permissions
        dynamodb_stmt = next(s for s in policy_document["Statement"]
                            if "dynamodb:GetItem" in s["Action"])
        assert "dynamodb:PutItem" in dynamodb_stmt["Action"]
        assert "dynamodb:Query" in dynamodb_stmt["Action"]
        assert "dynamodb:Scan" in dynamodb_stmt["Action"]

        # Check S3 permissions
        s3_stmt = next(s for s in policy_document["Statement"]
                      if "s3:GetObject" in s["Action"])
        assert "s3:PutObject" in s3_stmt["Action"]

        # Check KMS permissions
        kms_stmt = next(s for s in policy_document["Statement"]
                       if "kms:Decrypt" in s["Action"])
        assert "kms:Encrypt" in kms_stmt["Action"]
        assert "kms:GenerateDataKey" in kms_stmt["Action"]

        # Verify policy attachments (custom + basic execution role)
        assert mock_iam_attach.call_count == 2

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")


class TestMonitoringResources:
    """Test CloudWatch and SNS monitoring resources."""

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_sns_topic_created(self, mock_output, mock_backend, mock_provider,
                               mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                               mock_igw, mock_rt, mock_route, mock_rt_assoc,
                               mock_sg, mock_s3, mock_versioning, mock_encryption,
                               mock_iam_role, mock_iam_policy, mock_iam_attach,
                               mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                               stack_params):
        """Test that SNS topic is created for notifications."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda")
        mock_sns_instance = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_sns.return_value = mock_sns_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert
        mock_sns.assert_called_once()
        sns_args = mock_sns.call_args[1]
        assert sns_args["name"] == "healthcare-dr-failover-primary-v1-test"
        assert "Name" in sns_args["tags"]

    @patch('lib.stacks.primary_stack.CloudwatchMetricAlarm')
    @patch('lib.stacks.primary_stack.CloudwatchDashboard')
    @patch('lib.stacks.primary_stack.SnsTopic')
    @patch('lib.stacks.primary_stack.LambdaFunction')
    @patch('lib.stacks.primary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.primary_stack.IamPolicy')
    @patch('lib.stacks.primary_stack.IamRole')
    @patch('lib.stacks.primary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.primary_stack.S3BucketVersioningA')
    @patch('lib.stacks.primary_stack.S3Bucket')
    @patch('lib.stacks.primary_stack.SecurityGroup')
    @patch('lib.stacks.primary_stack.RouteTableAssociation')
    @patch('lib.stacks.primary_stack.Route')
    @patch('lib.stacks.primary_stack.RouteTable')
    @patch('lib.stacks.primary_stack.InternetGateway')
    @patch('lib.stacks.primary_stack.Subnet')
    @patch('lib.stacks.primary_stack.Vpc')
    @patch('lib.stacks.primary_stack.KmsAlias')
    @patch('lib.stacks.primary_stack.KmsKey')
    @patch('lib.stacks.primary_stack.AwsProvider')
    @patch('lib.stacks.primary_stack.S3Backend')
    @patch('lib.stacks.primary_stack.TerraformOutput')
    def test_cloudwatch_dashboard_and_alarm_created(self, mock_output, mock_backend, mock_provider,
                                                    mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                    mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                    mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                    mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                    mock_lambda, mock_sns, mock_dashboard, mock_alarm,
                                                    stack_params):
        """Test that CloudWatch dashboard and alarms are created."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda_instance = Mock(function_name="test-lambda")
        mock_lambda.return_value = mock_lambda_instance
        mock_sns_instance = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_sns.return_value = mock_sns_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg)

        # Act
        stack = PrimaryStack(**stack_params)

        # Assert - Verify CloudWatch dashboard
        mock_dashboard.assert_called_once()
        dashboard_args = mock_dashboard.call_args[1]
        assert dashboard_args["dashboard_name"] == "healthcare-dr-primary-v1-test"
        dashboard_body = json.loads(dashboard_args["dashboard_body"])
        assert "widgets" in dashboard_body
        assert len(dashboard_body["widgets"]) == 2

        # Verify CloudWatch alarm
        mock_alarm.assert_called_once()
        alarm_args = mock_alarm.call_args[1]
        assert alarm_args["alarm_name"] == "healthcare-dr-lambda-errors-primary-v1-test"
        assert alarm_args["comparison_operator"] == "GreaterThanThreshold"
        assert alarm_args["metric_name"] == "Errors"
        assert alarm_args["threshold"] == 5
        assert alarm_args["alarm_actions"] == ["arn:aws:sns:us-east-1:123:topic"]

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
