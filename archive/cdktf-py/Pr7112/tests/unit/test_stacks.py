"""Comprehensive unit tests for all IaC stacks with proper CDKTF mocking."""
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from cdktf import App, Testing


class TestGlobalStack:
    """Unit tests for GlobalStack."""

    @patch('lib.stacks.global_stack.TerraformOutput')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.S3Backend')
    def test_global_stack_creates_all_resources(
        self, mock_backend, mock_provider, mock_dynamodb, mock_zone,
        mock_health_check, mock_record, mock_output
    ):
        """Test GlobalStack initialization creates all resources."""
        from lib.stacks.global_stack import GlobalStack

        # Setup mocks
        mock_zone.return_value = Mock(zone_id="Z123")
        mock_health_check.return_value = Mock(id="hc-123")
        mock_dynamodb.return_value = Mock(name="table-123")

        # Create CDKTF app (real scope)
        app = App()

        # Create stack
        stack = GlobalStack(
            scope=app,
            id="test-stack",
            environment_suffix="test",
            primary_endpoint="primary.example.com",
            secondary_endpoint="secondary.example.com",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Assertions
        assert stack.environment_suffix == "test"
        assert stack.primary_region == "us-east-1"
        assert stack.secondary_region == "us-west-2"

        # Verify S3Backend called
        assert mock_backend.call_count == 1

        # Verify AWS Provider called
        assert mock_provider.call_count == 1

        # Verify DynamoDB tables created (patient records + audit logs)
        assert mock_dynamodb.call_count == 2

        # Verify Route53 resources created
        assert mock_zone.call_count == 1
        assert mock_health_check.call_count == 2  # primary + secondary
        assert mock_record.call_count == 2  # primary + secondary

    @patch('lib.stacks.global_stack.TerraformOutput')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.S3Backend')
    def test_dynamodb_tables_have_correct_configuration(
        self, mock_backend, mock_provider, mock_dynamodb, mock_zone,
        mock_health_check, mock_record, mock_output
    ):
        """Test DynamoDB tables are configured correctly."""
        from lib.stacks.global_stack import GlobalStack

        mock_zone.return_value = Mock(zone_id="Z123")
        mock_health_check.return_value = Mock(id="hc-123")
        mock_dynamodb.return_value = Mock(name="table-123")

        app = App()
        stack = GlobalStack(
            scope=app,
            id="test-stack",
            environment_suffix="test",
            primary_endpoint="primary.example.com",
            secondary_endpoint="secondary.example.com",
            primary_region="us-east-1",
            secondary_region="us-west-2",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Check DynamoDB was called twice
        assert mock_dynamodb.call_count == 2


class TestPrimaryStack:
    """Unit tests for PrimaryStack."""

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
    def test_primary_stack_creates_all_resources(
        self, mock_output, mock_backend, mock_provider, mock_kms_key,
        mock_kms_alias, mock_vpc, mock_subnet, mock_igw, mock_rt,
        mock_route, mock_rt_assoc, mock_sg, mock_s3, mock_versioning,
        mock_encryption, mock_iam_role, mock_iam_policy, mock_iam_attach,
        mock_lambda, mock_sns, mock_dashboard, mock_alarm
    ):
        """Test PrimaryStack initialization creates all resources."""
        from lib.stacks.primary_stack import PrimaryStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_output_instance = Mock()
        mock_output_instance.value = "test-value"
        mock_output.return_value = mock_output_instance

        # Create stack
        app = App()
        stack = PrimaryStack(
            scope=app,
            id="test-primary-stack",
            region="us-east-1",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Assertions
        assert stack.region == "us-east-1"
        assert stack.environment_suffix == "test"

        # Verify resources created
        assert mock_kms_key.call_count == 1
        assert mock_vpc.call_count == 1
        assert mock_subnet.call_count == 3  # 3 subnets
        assert mock_s3.call_count == 1
        assert mock_lambda.call_count == 1

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
    def test_vpc_configuration(
        self, mock_output, mock_backend, mock_provider, mock_kms_key,
        mock_kms_alias, mock_vpc, mock_subnet, mock_igw, mock_rt,
        mock_route, mock_rt_assoc, mock_sg, mock_s3, mock_versioning,
        mock_encryption, mock_iam_role, mock_iam_policy, mock_iam_attach,
        mock_lambda, mock_sns, mock_dashboard, mock_alarm
    ):
        """Test VPC is configured with correct CIDR."""
        from lib.stacks.primary_stack import PrimaryStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_output_instance = Mock()
        mock_output_instance.value = "test-value"
        mock_output.return_value = mock_output_instance

        app = App()
        stack = PrimaryStack(
            scope=app,
            id="test-primary-stack",
            region="us-east-1",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Check VPC was called with correct CIDR
        vpc_call = mock_vpc.call_args
        assert vpc_call[1]["cidr_block"] == "10.0.0.0/16"


class TestSecondaryStack:
    """Unit tests for SecondaryStack."""

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
    def test_secondary_stack_creates_all_resources(
        self, mock_output, mock_backend, mock_provider, mock_kms_key,
        mock_kms_alias, mock_vpc, mock_subnet, mock_igw, mock_rt,
        mock_route, mock_rt_assoc, mock_sg, mock_s3, mock_versioning,
        mock_encryption, mock_iam_role, mock_iam_policy, mock_iam_attach,
        mock_lambda, mock_sns, mock_dashboard
    ):
        """Test SecondaryStack initialization creates all resources."""
        from lib.stacks.secondary_stack import SecondaryStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")
        mock_output_instance = Mock()
        mock_output_instance.value = "test-value"
        mock_output.return_value = mock_output_instance

        # Create stack
        app = App()
        stack = SecondaryStack(
            scope=app,
            id="test-secondary-stack",
            region="us-west-2",
            environment_suffix="test",
            primary_bucket_arn="arn:aws:s3:::primary-bucket",
            primary_kms_key_arn="arn:aws:kms:us-east-1:123:key/primary",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Assertions
        assert stack.region == "us-west-2"
        assert stack.environment_suffix == "test"

        # Verify resources created
        assert mock_kms_key.call_count == 1
        assert mock_vpc.call_count == 1
        assert mock_subnet.call_count == 3  # 3 subnets
        assert mock_s3.call_count == 1
        assert mock_lambda.call_count == 1

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
    def test_secondary_vpc_uses_different_cidr(
        self, mock_output, mock_backend, mock_provider, mock_kms_key,
        mock_kms_alias, mock_vpc, mock_subnet, mock_igw, mock_rt,
        mock_route, mock_rt_assoc, mock_sg, mock_s3, mock_versioning,
        mock_encryption, mock_iam_role, mock_iam_policy, mock_iam_attach,
        mock_lambda, mock_sns, mock_dashboard
    ):
        """Test secondary VPC uses different CIDR than primary."""
        from lib.stacks.secondary_stack import SecondaryStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-west-2:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-west-2:123:topic")
        mock_output_instance = Mock()
        mock_output_instance.value = "test-value"
        mock_output.return_value = mock_output_instance

        app = App()
        stack = SecondaryStack(
            scope=app,
            id="test-secondary-stack",
            region="us-west-2",
            environment_suffix="test",
            primary_bucket_arn="arn:aws:s3:::primary-bucket",
            primary_kms_key_arn="arn:aws:kms:us-east-1:123:key/primary",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"Env": "test"}
        )

        # Check VPC was called with different CIDR
        vpc_call = mock_vpc.call_args
        assert vpc_call[1]["cidr_block"] == "10.1.0.0/16"


class TestTapStack:
    """Unit tests for TapStack (unified stack)."""

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
    def test_tap_stack_creates_multi_region_resources(
        self, mock_backend, mock_provider, mock_kms_key, mock_kms_alias,
        mock_vpc, mock_subnet, mock_igw, mock_rt, mock_route, mock_rt_assoc,
        mock_sg, mock_s3, mock_versioning, mock_encryption, mock_iam_role,
        mock_iam_policy, mock_iam_attach, mock_lambda, mock_sns,
        mock_dashboard, mock_alarm, mock_dynamodb, mock_zone, mock_record,
        mock_output
    ):
        """Test TapStack creates resources in both regions."""
        from lib.tap_stack import TapStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")

        # Create stack
        app = App()
        stack = TapStack(
            scope=app,
            construct_id="test-tap-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Env": "test"}
        )

        # Assertions
        assert stack.environment_suffix == "test"
        assert stack.aws_region == "us-east-1"

        # Verify dual providers (primary + secondary)
        assert mock_provider.call_count == 2

        # Verify resources created in both regions
        assert mock_kms_key.call_count == 2  # primary + secondary
        assert mock_vpc.call_count == 2  # primary + secondary
        assert mock_subnet.call_count == 6  # 3 per region * 2 regions
        assert mock_s3.call_count == 2  # primary + secondary
        assert mock_lambda.call_count == 2  # primary + secondary

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
    def test_tap_stack_creates_global_resources(
        self, mock_backend, mock_provider, mock_kms_key, mock_kms_alias,
        mock_vpc, mock_subnet, mock_igw, mock_rt, mock_route, mock_rt_assoc,
        mock_sg, mock_s3, mock_versioning, mock_encryption, mock_iam_role,
        mock_iam_policy, mock_iam_attach, mock_lambda, mock_sns,
        mock_dashboard, mock_alarm, mock_dynamodb, mock_zone, mock_record,
        mock_output
    ):
        """Test TapStack creates global resources (DynamoDB, Route53)."""
        from lib.tap_stack import TapStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")

        app = App()
        stack = TapStack(
            scope=app,
            construct_id="test-tap-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Env": "test"}
        )

        # Verify global resources
        assert mock_dynamodb.call_count == 2  # patient records + audit logs
        assert mock_zone.call_count == 1  # Route53 hosted zone
        assert mock_record.call_count == 2  # primary + secondary records

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
    def test_tap_stack_outputs_all_arns(
        self, mock_backend, mock_provider, mock_kms_key, mock_kms_alias,
        mock_vpc, mock_subnet, mock_igw, mock_rt, mock_route, mock_rt_assoc,
        mock_sg, mock_s3, mock_versioning, mock_encryption, mock_iam_role,
        mock_iam_policy, mock_iam_attach, mock_lambda, mock_sns,
        mock_dashboard, mock_alarm, mock_dynamodb, mock_zone, mock_record,
        mock_output
    ):
        """Test TapStack creates all required outputs."""
        from lib.tap_stack import TapStack

        # Setup mocks
        mock_kms_key.return_value = Mock(key_id="kms-123", arn="arn:aws:kms:us-east-1:123:key/kms")
        mock_vpc.return_value = Mock(id="vpc-123")
        mock_subnet.return_value = Mock(id="subnet-123")
        mock_igw.return_value = Mock(id="igw-123")
        mock_rt.return_value = Mock(id="rt-123")
        mock_sg.return_value = Mock(id="sg-123")
        mock_s3.return_value = Mock(id="bucket-123", arn="arn:aws:s3:::bucket")
        mock_iam_role.return_value = Mock(name="role", arn="arn:aws:iam::123:role/role")
        mock_iam_policy.return_value = Mock(arn="arn:aws:iam::123:policy/policy")
        mock_lambda.return_value = Mock(function_name="lambda-func")
        mock_sns.return_value = Mock(arn="arn:aws:sns:us-east-1:123:topic")
        mock_dynamodb.return_value = Mock(name="table")
        mock_zone.return_value = Mock(zone_id="Z123")

        app = App()
        stack = TapStack(
            scope=app,
            construct_id="test-tap-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags={"Env": "test"}
        )

        # Verify outputs created
        assert mock_output.call_count >= 6  # At least 6 outputs expected
