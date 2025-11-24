"""Unit tests for SecondaryStack with mocked AWS resources."""
import pytest
import json
from unittest.mock import Mock, patch
from constructs import Construct
from lib.stacks.secondary_stack import SecondaryStack


@pytest.fixture
def stack_params():
    """Common stack parameters for testing."""
    return {
        "scope": Mock(spec=Construct),
        "id": "test-secondary-stack",
        "region": "us-west-2",
        "environment_suffix": "test",
        "primary_bucket_arn": "arn:aws:s3:::primary-bucket",
        "primary_kms_key_arn": "arn:aws:kms:us-east-1:123456789:key/primary-kms",
        "state_bucket": "test-state-bucket",
        "state_bucket_region": "us-east-1",
        "default_tags": {"Environment": "test", "Project": "healthcare-dr"}
    }


class TestSecondaryStackInitialization:
    """Test SecondaryStack initialization and configuration."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_secondary_stack_creation(self, mock_output, mock_backend, mock_provider,
                                      mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                      mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                      mock_sg, mock_s3, mock_versioning, mock_encryption,
                                      mock_iam_role, mock_iam_policy, mock_iam_attach,
                                      mock_lambda, mock_sns, mock_dashboard,
                                      stack_params):
        """Test that SecondaryStack initializes correctly with all resources."""
        # Arrange
        self._setup_all_mocks(mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                             mock_sg, mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        assert stack.region == "us-west-2"
        assert stack.environment_suffix == "test"
        assert stack.primary_bucket_arn == "arn:aws:s3:::primary-bucket"
        assert stack.primary_kms_key_arn == "arn:aws:kms:us-east-1:123456789:key/primary-kms"
        assert stack.common_tags["Environment"] == "Production"
        assert stack.common_tags["DisasterRecovery"] == "Enabled"
        assert stack.common_tags["Region"] == "Secondary"
        assert stack.common_tags["ManagedBy"] == "CDKTF"

        # Verify S3 Backend configuration
        mock_backend.assert_called_once()
        backend_call_args = mock_backend.call_args[1]
        assert backend_call_args["bucket"] == "test-state-bucket"
        assert backend_call_args["key"] == "healthcare-dr/secondary/test/terraform.tfstate"
        assert backend_call_args["region"] == "us-east-1"
        assert backend_call_args["encrypt"] is True

        # Verify AWS Provider configuration
        mock_provider.assert_called_once()
        provider_call_args = mock_provider.call_args[1]
        assert provider_call_args["region"] == "us-west-2"

    def _setup_all_mocks(self, mock_kms_key, mock_vpc, mock_subnet, mock_igw, mock_rt,
                        mock_sg, mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns):
        """Helper to setup all mocks."""
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
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


class TestKmsKey:
    """Test KMS key creation in secondary region."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_kms_key_created_with_rotation(self, mock_output, mock_backend, mock_provider,
                                          mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                          mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                          mock_sg, mock_s3, mock_versioning, mock_encryption,
                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                          mock_lambda, mock_sns, mock_dashboard,
                                          stack_params):
        """Test that KMS key is created in secondary region with rotation enabled."""
        # Arrange
        mock_kms_instance = Mock(key_id="kms-sec-123", arn="arn:aws:kms:us-west-2:123:key/kms-sec-123")
        mock_kms_key.return_value = mock_kms_instance
        self._setup_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                         mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        mock_kms_key.assert_called_once()
        kms_args = mock_kms_key.call_args[1]
        assert kms_args["description"] == "KMS key for healthcare DR secondary - test"
        assert kms_args["enable_key_rotation"] is True
        assert "Name" in kms_args["tags"]
        assert "secondary" in kms_args["tags"]["Name"]

        # Verify KMS alias was created
        mock_kms_alias.assert_called_once()
        alias_args = mock_kms_alias.call_args[1]
        assert alias_args["name"] == "alias/healthcare-dr-secondary-v1-test"
        assert alias_args["target_key_id"] == "kms-sec-123"

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
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")


class TestVpcInfrastructure:
    """Test VPC and networking infrastructure in secondary region."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_vpc_created_with_different_cidr(self, mock_output, mock_backend, mock_provider,
                                            mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                            mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                            mock_sg, mock_s3, mock_versioning, mock_encryption,
                                            mock_iam_role, mock_iam_policy, mock_iam_attach,
                                            mock_lambda, mock_sns, mock_dashboard,
                                            stack_params):
        """Test that secondary VPC is created with different CIDR block (10.1.0.0/16)."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_vpc_instance = Mock(id="vpc-sec-123")
        mock_vpc.return_value = mock_vpc_instance
        self._setup_mocks(mock_subnet, mock_igw, mock_rt, mock_sg, mock_s3,
                         mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        mock_vpc.assert_called_once()
        vpc_args = mock_vpc.call_args[1]
        assert vpc_args["cidr_block"] == "10.1.0.0/16"  # Different from primary (10.0.0.0/16)
        assert vpc_args["enable_dns_hostnames"] is True
        assert vpc_args["enable_dns_support"] is True
        assert "secondary" in vpc_args["tags"]["Name"]

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_subnets_created_in_us_west_2_azs(self, mock_output, mock_backend, mock_provider,
                                              mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                              mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                              mock_sg, mock_s3, mock_versioning, mock_encryption,
                                              mock_iam_role, mock_iam_policy, mock_iam_attach,
                                              mock_lambda, mock_sns, mock_dashboard,
                                              stack_params):
        """Test that subnets are created in us-west-2 availability zones."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet_instance = Mock(id="subnet-123")
        mock_subnet.return_value = mock_subnet_instance
        self._setup_mocks(mock_igw, mock_rt, mock_sg, mock_s3,
                         mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert - Should create 3 subnets (a, b, c)
        assert mock_subnet.call_count == 3

        # Verify subnet configurations with 10.1.x.0/24 CIDR and us-west-2 AZs
        for i, call_args in enumerate(mock_subnet.call_args_list):
            subnet_args = call_args[1]
            assert subnet_args["vpc_id"] == "vpc-123"
            assert subnet_args["cidr_block"] == f"10.1.{i}.0/24"
            assert subnet_args["availability_zone"] in ["us-west-2a", "us-west-2b", "us-west-2c"]
            assert subnet_args["map_public_ip_on_launch"] is True

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_security_group_created(self, mock_output, mock_backend, mock_provider,
                                    mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                    mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                    mock_sg, mock_s3, mock_versioning, mock_encryption,
                                    mock_iam_role, mock_iam_policy, mock_iam_attach,
                                    mock_lambda, mock_sns, mock_dashboard,
                                    stack_params):
        """Test that security group is created with correct rules."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg_instance = Mock(id="sg-sec-123")
        mock_sg.return_value = mock_sg_instance
        self._setup_mocks(mock_s3, mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        mock_sg.assert_called_once()
        sg_args = mock_sg.call_args[1]
        assert sg_args["name"] == "healthcare-dr-lambda-sg-secondary-v1-test"
        assert sg_args["description"] == "Security group for Lambda functions"
        assert sg_args["vpc_id"] == "vpc-123"

        # Verify egress rules (allow all outbound)
        egress_rules = sg_args["egress"]
        assert len(egress_rules) == 1
        assert egress_rules[0].protocol == "-1"

        # Verify ingress rules (HTTPS)
        ingress_rules = sg_args["ingress"]
        assert len(ingress_rules) == 1
        assert ingress_rules[0].from_port == 443
        assert ingress_rules[0].to_port == 443

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
            Mock(arn="arn:aws:sns:us-west-2:123:topic")
        ]
        for mock_obj, default in zip(mocks, defaults):
            mock_obj.return_value = default


class TestS3ReplicationBucket:
    """Test S3 replication bucket in secondary region."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_s3_bucket_created_for_replication(self, mock_output, mock_backend, mock_provider,
                                               mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                               mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                               mock_sg, mock_s3, mock_versioning, mock_encryption,
                                               mock_iam_role, mock_iam_policy, mock_iam_attach,
                                               mock_lambda, mock_sns, mock_dashboard,
                                               stack_params):
        """Test that S3 bucket is created as replication destination."""
        # Arrange
        mock_kms_instance = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_kms_key.return_value = mock_kms_instance
        mock_s3_instance = Mock(id="bucket-sec-123", arn="arn:aws:s3:::bucket-sec-123")
        mock_s3.return_value = mock_s3_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg,
                             mock_iam_role, mock_iam_policy, mock_lambda, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        mock_s3.assert_called_once()
        s3_args = mock_s3.call_args[1]
        assert s3_args["bucket"] == "healthcare-medical-docs-secondary-v1-test"
        assert s3_args["force_destroy"] is True
        assert "secondary" in s3_args["tags"]["Name"]

        # Verify versioning is enabled (required for replication destination)
        mock_versioning.assert_called_once()
        versioning_args = mock_versioning.call_args[1]
        assert versioning_args["bucket"] == "bucket-sec-123"
        assert versioning_args["versioning_configuration"]["status"] == "Enabled"

        # Verify encryption with secondary KMS key
        mock_encryption.assert_called_once()
        encryption_args = mock_encryption.call_args[1]
        assert encryption_args["bucket"] == "bucket-sec-123"
        rule = encryption_args["rule"][0]
        assert rule.apply_server_side_encryption_by_default.sse_algorithm == "aws:kms"
        assert rule.apply_server_side_encryption_by_default.kms_master_key_id == "arn:aws:kms:us-west-2:123:key/kms-123"

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
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")


class TestLambdaFunction:
    """Test Lambda function in secondary region."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_lambda_function_created_with_secondary_config(self, mock_output, mock_backend, mock_provider,
                                                          mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                          mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                          mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                          mock_lambda, mock_sns, mock_dashboard,
                                                          stack_params):
        """Test that Lambda function is created with secondary stage configuration."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role_instance = Mock(name="lambda-role", arn="arn:aws:iam::123:role/lambda-role")
        mock_iam_role.return_value = mock_iam_role_instance
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/lambda-policy")
        mock_lambda_instance = Mock(function_name="healthcare-dr-api-secondary-v1-test")
        mock_lambda.return_value = mock_lambda_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert
        mock_lambda.assert_called_once()
        lambda_args = mock_lambda.call_args[1]
        assert lambda_args["function_name"] == "healthcare-dr-api-secondary-v1-test"
        assert lambda_args["role"] == "arn:aws:iam::123:role/lambda-role"
        assert lambda_args["handler"] == "api_handler.handler"
        assert lambda_args["runtime"] == "python3.11"
        assert lambda_args["memory_size"] == 3072
        assert lambda_args["timeout"] == 30
        assert lambda_args["environment"]["variables"]["ENVIRONMENT"] == "production"
        assert lambda_args["environment"]["variables"]["STAGE"] == "secondary"

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_lambda_iam_role_with_cross_region_permissions(self, mock_output, mock_backend, mock_provider,
                                                          mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                          mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                          mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                          mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                          mock_lambda, mock_sns, mock_dashboard,
                                                          stack_params):
        """Test that Lambda IAM role has cross-region permissions."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role_instance = Mock(name="lambda-role", arn="arn:aws:iam::123:role/lambda-role")
        mock_iam_role.return_value = mock_iam_role_instance
        mock_iam_policy_instance = Mock(arn="arn:aws:iam::123:policy/lambda-policy")
        mock_iam_policy.return_value = mock_iam_policy_instance
        mock_lambda.return_value = Mock(function_name="lambda")
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert - Verify IAM role creation
        mock_iam_role.assert_called_once()
        role_args = mock_iam_role.call_args[1]
        assert role_args["name"] == "healthcare-dr-lambda-role-secondary-v1-test"

        # Verify IAM policy with cross-region access
        mock_iam_policy.assert_called_once()
        policy_args = mock_iam_policy.call_args[1]
        policy_document = json.loads(policy_args["policy"])

        # Verify all required permissions
        actions = []
        for statement in policy_document["Statement"]:
            if isinstance(statement["Action"], list):
                actions.extend(statement["Action"])
            else:
                actions.append(statement["Action"])

        assert "dynamodb:GetItem" in actions
        assert "s3:GetObject" in actions
        assert "kms:Decrypt" in actions
        assert "logs:CreateLogGroup" in actions

        # Verify policy attachments
        assert mock_iam_attach.call_count == 2

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg, mock_sns):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")


class TestMonitoringResources:
    """Test CloudWatch and SNS monitoring resources in secondary region."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_sns_topic_and_cloudwatch_dashboard_created(self, mock_output, mock_backend, mock_provider,
                                                        mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                                        mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                                        mock_sg, mock_s3, mock_versioning, mock_encryption,
                                                        mock_iam_role, mock_iam_policy, mock_iam_attach,
                                                        mock_lambda, mock_sns, mock_dashboard,
                                                        stack_params):
        """Test that SNS topic and CloudWatch dashboard are created."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-123")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda_instance = Mock(function_name="test-lambda-secondary")
        mock_lambda.return_value = mock_lambda_instance
        mock_sns_instance = Mock(arn="arn:aws:sns:us-west-2:123:topic")
        mock_sns.return_value = mock_sns_instance
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert - Verify SNS topic
        mock_sns.assert_called_once()
        sns_args = mock_sns.call_args[1]
        assert sns_args["name"] == "healthcare-dr-failover-secondary-v1-test"
        assert "secondary" in sns_args["tags"]["Name"]

        # Verify CloudWatch dashboard
        mock_dashboard.assert_called_once()
        dashboard_args = mock_dashboard.call_args[1]
        assert dashboard_args["dashboard_name"] == "healthcare-dr-secondary-v1-test"
        dashboard_body = json.loads(dashboard_args["dashboard_body"])
        assert "widgets" in dashboard_body
        assert dashboard_body["widgets"][0]["properties"]["title"] == "Lambda Metrics - Secondary Region"

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")


class TestTerraformOutputs:
    """Test Terraform outputs."""

    @patch('lib.stacks.secondary_stack.CloudwatchDashboard')
    @patch('lib.stacks.secondary_stack.SnsTopic')
    @patch('lib.stacks.secondary_stack.LambdaFunction')
    @patch('lib.stacks.secondary_stack.IamRolePolicyAttachment')
    @patch('lib.stacks.secondary_stack.IamPolicy')
    @patch('lib.stacks.secondary_stack.IamRole')
    @patch('lib.stacks.secondary_stack.S3BucketServerSideEncryptionConfigurationA')
    @patch('lib.stacks.secondary_stack.S3BucketVersioningA')
    @patch('lib.stacks.secondary_stack.S3Bucket')
    @patch('lib.stacks.secondary_stack.SecurityGroup')
    @patch('lib.stacks.secondary_stack.RouteTableAssociation')
    @patch('lib.stacks.secondary_stack.Route')
    @patch('lib.stacks.secondary_stack.RouteTable')
    @patch('lib.stacks.secondary_stack.InternetGateway')
    @patch('lib.stacks.secondary_stack.Subnet')
    @patch('lib.stacks.secondary_stack.Vpc')
    @patch('lib.stacks.secondary_stack.KmsAlias')
    @patch('lib.stacks.secondary_stack.KmsKey')
    @patch('lib.stacks.secondary_stack.AwsProvider')
    @patch('lib.stacks.secondary_stack.S3Backend')
    @patch('lib.stacks.secondary_stack.TerraformOutput')
    def test_terraform_outputs_created(self, mock_output, mock_backend, mock_provider,
                                       mock_kms_key, mock_kms_alias, mock_vpc, mock_subnet,
                                       mock_igw, mock_rt, mock_route, mock_rt_assoc,
                                       mock_sg, mock_s3, mock_versioning, mock_encryption,
                                       mock_iam_role, mock_iam_policy, mock_iam_attach,
                                       mock_lambda, mock_sns, mock_dashboard,
                                       stack_params):
        """Test that all required Terraform outputs are created."""
        # Arrange
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms-123")
        mock_s3_instance = Mock(id="bucket-123", arn="arn:aws:s3:::bucket-secondary-123")
        mock_s3.return_value = mock_s3_instance
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda_instance = Mock(function_name="test-lambda-secondary")
        mock_lambda.return_value = mock_lambda_instance
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")
        self._setup_all_mocks(mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg)

        # Act
        stack = SecondaryStack(**stack_params)

        # Assert - Check that TerraformOutput was called
        assert mock_output.call_count >= 2  # medical_docs_bucket_arn, api_endpoint

        # Verify output names
        output_ids = [call[0][1] for call in mock_output.call_args_list]
        assert "medical_docs_bucket_arn" in output_ids
        assert "api_endpoint" in output_ids

    def _setup_all_mocks(self, mock_vpc, mock_subnet, mock_igw, mock_rt, mock_sg):
        """Helper to setup all mocks."""
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
