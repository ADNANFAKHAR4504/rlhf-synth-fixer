"""
Comprehensive unit tests for TapStack with 100% code coverage.
All tests use mocks - no live AWS resources are created.
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
import json


class TestTapStackInitialization:
    """Test TapStack initialization and constructor"""

    @pytest.fixture
    def mock_providers(self):
        """Mock AWS providers"""
        with patch('lib.tap_stack.AwsProvider') as mock_aws:
            mock_primary = MagicMock()
            mock_secondary = MagicMock()
            mock_aws.side_effect = [mock_primary, mock_secondary]
            yield mock_aws, mock_primary, mock_secondary

    @pytest.fixture
    def mock_backend(self):
        """Mock S3 backend"""
        with patch('lib.tap_stack.S3Backend') as mock_s3:
            yield mock_s3

    @pytest.fixture
    def mock_app(self):
        """Mock CDKTF App"""
        return MagicMock()

    def test_stack_initialization_with_all_parameters(self, mock_app, mock_backend, mock_providers):
        """Test TapStack initializes with all required parameters"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'), \
             patch('lib.tap_stack.TerraformOutput'):

            from lib.tap_stack import TapStack

            stack = TapStack(
                mock_app,
                "test-stack",
                environment_suffix="test-env",
                state_bucket="test-bucket",
                state_bucket_region="us-east-1",
                primary_region="us-east-1",
                secondary_region="us-west-2"
            )

            assert stack.environment_suffix == "test-env"
            mock_backend.assert_called_once()

    def test_s3_backend_configuration(self, mock_app, mock_backend, mock_providers):
        """Test S3Backend is configured with correct parameters"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'), \
             patch('lib.tap_stack.TerraformOutput'):

            from lib.tap_stack import TapStack

            TapStack(
                mock_app,
                "test-stack-id",
                environment_suffix="prod",
                state_bucket="my-state-bucket",
                state_bucket_region="us-west-2"
            )

            call_kwargs = mock_backend.call_args[1]
            assert call_kwargs['bucket'] == "my-state-bucket"
            assert call_kwargs['region'] == "us-west-2"
            assert call_kwargs['encrypt'] is True
            assert "test-stack-id/prod/terraform.tfstate" in call_kwargs['key']


class TestNetworkingResources:
    """Test networking resource creation"""

    @pytest.fixture
    def mock_stack_deps(self):
        """Mock all stack dependencies"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'), \
             patch('lib.tap_stack.TerraformOutput'):
            yield

    def test_primary_vpc_creation(self, mock_stack_deps):
        """Test primary VPC is created with correct CIDR block"""
        with patch('lib.tap_stack.Vpc') as mock_vpc, \
             patch('lib.tap_stack.Subnet'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Verify primary VPC was created
            vpc_calls = [call for call in mock_vpc.call_args_list
                        if 'primary_vpc' in str(call)]
            assert len(vpc_calls) > 0
            primary_call = vpc_calls[0]
            assert primary_call[1]['cidr_block'] == "10.0.0.0/16"
            assert primary_call[1]['enable_dns_hostnames'] is True
            assert primary_call[1]['enable_dns_support'] is True

    def test_secondary_vpc_creation(self, mock_stack_deps):
        """Test secondary VPC is created with correct CIDR block"""
        with patch('lib.tap_stack.Vpc') as mock_vpc, \
             patch('lib.tap_stack.Subnet'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Verify secondary VPC was created
            vpc_calls = [call for call in mock_vpc.call_args_list
                        if 'secondary_vpc' in str(call)]
            assert len(vpc_calls) > 0
            secondary_call = vpc_calls[0]
            assert secondary_call[1]['cidr_block'] == "10.1.0.0/16"

    def test_subnet_creation_primary_region(self, mock_stack_deps):
        """Test 3 subnets are created in primary region"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet') as mock_subnet:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Count primary subnet calls
            primary_subnet_calls = [call for call in mock_subnet.call_args_list
                                   if 'primary_private_subnet' in str(call)]
            assert len(primary_subnet_calls) == 3

    def test_subnet_creation_secondary_region(self, mock_stack_deps):
        """Test 3 subnets are created in secondary region"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet') as mock_subnet:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Count secondary subnet calls
            secondary_subnet_calls = [call for call in mock_subnet.call_args_list
                                     if 'secondary_private_subnet' in str(call)]
            assert len(secondary_subnet_calls) == 3

    def test_vpc_peering_connection_created(self, mock_stack_deps):
        """Test VPC peering connection is created between regions"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.VpcPeeringConnection') as mock_peering:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            mock_peering.assert_called_once()
            call_kwargs = mock_peering.call_args[1]
            assert call_kwargs['auto_accept'] is False
            assert call_kwargs['peer_region'] == "us-west-2"

    def test_security_groups_created(self, mock_stack_deps):
        """Test security groups are created for database and Lambda"""
        with patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.SecurityGroup') as mock_sg:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 4 security groups: primary/secondary db, primary/secondary lambda
            assert mock_sg.call_count == 4


class TestDatabaseResources:
    """Test database resource creation"""

    @pytest.fixture
    def mock_stack_deps(self):
        """Mock all stack dependencies"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'), \
             patch('lib.tap_stack.TerraformOutput'):
            yield

    def test_kms_keys_created(self, mock_stack_deps):
        """Test KMS keys are created for both regions"""
        with patch('lib.tap_stack.KmsKey') as mock_kms, \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 2 KMS keys: primary and secondary
            assert mock_kms.call_count == 2
            first_call = mock_kms.call_args_list[0][1]
            assert first_call['enable_key_rotation'] is True

    def test_aurora_global_cluster_created(self, mock_stack_deps):
        """Test Aurora Global Cluster is created"""
        with patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster') as mock_global, \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            mock_global.assert_called_once()
            call_kwargs = mock_global.call_args[1]
            assert call_kwargs['engine'] == "aurora-postgresql"
            assert call_kwargs['engine_version'] == "14.6"
            assert call_kwargs['storage_encrypted'] is True

    def test_primary_aurora_cluster_created(self, mock_stack_deps):
        """Test primary Aurora cluster is created with correct config"""
        with patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster') as mock_cluster, \
             patch('lib.tap_stack.RdsClusterInstance'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Find primary cluster call
            primary_calls = [call for call in mock_cluster.call_args_list
                           if 'primary_cluster' in str(call)]
            assert len(primary_calls) == 1
            call_kwargs = primary_calls[0][1]
            assert call_kwargs['engine_version'] == "14.6"
            assert call_kwargs['storage_encrypted'] is True
            assert call_kwargs['backup_retention_period'] == 7
            assert call_kwargs['skip_final_snapshot'] is True

    def test_secondary_aurora_cluster_created(self, mock_stack_deps):
        """Test secondary Aurora cluster is created"""
        with patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster') as mock_cluster, \
             patch('lib.tap_stack.RdsClusterInstance'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Find secondary cluster call
            secondary_calls = [call for call in mock_cluster.call_args_list
                             if 'secondary_cluster' in str(call)]
            assert len(secondary_calls) == 1

    def test_rds_cluster_instances_created(self, mock_stack_deps):
        """Test 2 RDS instances are created for each cluster (4 total)"""
        with patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance') as mock_instance:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 4 instances total (2 primary + 2 secondary)
            assert mock_instance.call_count == 4

    def test_secrets_manager_secrets_created(self, mock_stack_deps):
        """Test Secrets Manager secrets are created for both regions"""
        with patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret') as mock_secret, \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 2 secrets (primary and secondary)
            assert mock_secret.call_count == 2


class TestComputeResources:
    """Test compute resource creation"""

    @pytest.fixture
    def mock_stack_deps(self):
        """Mock all stack dependencies"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'), \
             patch('lib.tap_stack.TerraformOutput'):
            yield

    def test_dynamodb_global_table_created(self, mock_stack_deps):
        """Test DynamoDB global table is created"""
        with patch('lib.tap_stack.DynamodbTable') as mock_ddb, \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            mock_ddb.assert_called_once()
            call_kwargs = mock_ddb.call_args[1]
            assert call_kwargs['billing_mode'] == "PAY_PER_REQUEST"
            assert call_kwargs['hash_key'] == "sessionId"
            assert call_kwargs['stream_enabled'] is True

    def test_lambda_iam_roles_created(self, mock_stack_deps):
        """Test IAM roles are created for Lambda functions"""
        with patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole') as mock_role, \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 3 IAM roles (primary, secondary, backup lambda)
            assert mock_role.call_count == 3

    def test_lambda_functions_created(self, mock_stack_deps):
        """Test Lambda functions are created with correct architecture"""
        with patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction') as mock_lambda, \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 3 Lambda functions (primary, secondary, backup)
            assert mock_lambda.call_count == 3

            # Verify ARM architecture
            for call in mock_lambda.call_args_list:
                call_kwargs = call[1]
                assert call_kwargs['architectures'] == ["arm64"]
                assert call_kwargs['runtime'] == "python3.11"

    def test_backup_verification_lambda_scheduled(self, mock_stack_deps):
        """Test backup verification Lambda has CloudWatch schedule"""
        with patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule') as mock_rule, \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            mock_rule.assert_called_once()
            call_kwargs = mock_rule.call_args[1]
            assert call_kwargs['schedule_expression'] == "rate(1 day)"


class TestDnsAndMonitoring:
    """Test DNS and monitoring resource creation"""

    @pytest.fixture
    def mock_stack_deps(self):
        """Mock all stack dependencies"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.TerraformOutput'):
            yield

    def test_route53_hosted_zone_created(self, mock_stack_deps):
        """Test Route53 hosted zone is created"""
        with patch('lib.tap_stack.Route53Zone') as mock_zone, \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            mock_zone.assert_called_once()

    def test_route53_health_checks_created(self, mock_stack_deps):
        """Test health checks are created for both regions"""
        with patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck') as mock_health, \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 2 health checks (primary and secondary)
            assert mock_health.call_count == 2

            for call in mock_health.call_args_list:
                call_kwargs = call[1]
                assert call_kwargs['type'] == "HTTPS"
                assert call_kwargs['port'] == 443
                assert call_kwargs['request_interval'] == 30
                assert call_kwargs['failure_threshold'] == 3

    def test_route53_failover_records_created(self, mock_stack_deps):
        """Test failover DNS records are created"""
        with patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record') as mock_record, \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 2 records (primary and secondary)
            assert mock_record.call_count == 2

    def test_sns_topics_created_both_regions(self, mock_stack_deps):
        """Test SNS topics are created in both regions"""
        with patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic') as mock_sns, \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'):

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 2 SNS topics (primary and secondary)
            assert mock_sns.call_count == 2

    def test_cloudwatch_alarms_created(self, mock_stack_deps):
        """Test CloudWatch alarms are created for monitoring"""
        with patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm') as mock_alarm:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 6 alarms (2 DB CPU, 2 Lambda errors, 1 DynamoDB, 1 replication lag)
            assert mock_alarm.call_count == 6


class TestOutputs:
    """Test Terraform outputs"""

    @pytest.fixture
    def mock_stack_deps(self):
        """Mock all stack dependencies"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.Vpc'), \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup'), \
             patch('lib.tap_stack.KmsKey'), \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup'), \
             patch('lib.tap_stack.RdsGlobalCluster'), \
             patch('lib.tap_stack.SecretsmanagerSecret'), \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster'), \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable'), \
             patch('lib.tap_stack.IamRole'), \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy'), \
             patch('lib.tap_stack.LambdaFunction'), \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic'), \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm'):
            yield

    def test_terraform_outputs_created(self, mock_stack_deps):
        """Test all required Terraform outputs are created"""
        with patch('lib.tap_stack.TerraformOutput') as mock_output:

            from lib.tap_stack import TapStack

            TapStack(
                MagicMock(),
                "test",
                environment_suffix="env",
                state_bucket="bucket",
                state_bucket_region="us-east-1"
            )

            # Should create 6 outputs
            assert mock_output.call_count == 6

            # Verify output names
            output_names = [call[0][2] for call in mock_output.call_args_list]
            expected_outputs = [
                "primary_vpc_id",
                "secondary_vpc_id",
                "global_database_id",
                "dynamodb_table_name",
                "dns_failover_domain",
                "sns_topic_arn"
            ]
            for expected in expected_outputs:
                assert expected in output_names


class TestNamingConventions:
    """Test v1 naming convention is applied to all resources"""

    @pytest.fixture
    def mock_all_resources(self):
        """Mock all AWS resources"""
        with patch('lib.tap_stack.S3Backend'), \
             patch('lib.tap_stack.AwsProvider'), \
             patch('lib.tap_stack.Vpc') as mock_vpc, \
             patch('lib.tap_stack.Subnet'), \
             patch('lib.tap_stack.InternetGateway'), \
             patch('lib.tap_stack.RouteTable'), \
             patch('lib.tap_stack.VpcPeeringConnection'), \
             patch('lib.tap_stack.VpcPeeringConnectionAccepterA'), \
             patch('lib.tap_stack.Route'), \
             patch('lib.tap_stack.RouteTableAssociation'), \
             patch('lib.tap_stack.SecurityGroup') as mock_sg, \
             patch('lib.tap_stack.KmsKey') as mock_kms, \
             patch('lib.tap_stack.KmsAlias'), \
             patch('lib.tap_stack.DbSubnetGroup') as mock_subnet_group, \
             patch('lib.tap_stack.RdsGlobalCluster') as mock_global, \
             patch('lib.tap_stack.SecretsmanagerSecret') as mock_secret, \
             patch('lib.tap_stack.SecretsmanagerSecretVersion'), \
             patch('lib.tap_stack.RdsCluster') as mock_cluster, \
             patch('lib.tap_stack.RdsClusterInstance'), \
             patch('lib.tap_stack.DynamodbTable') as mock_ddb, \
             patch('lib.tap_stack.IamRole') as mock_role, \
             patch('lib.tap_stack.IamRolePolicyAttachment'), \
             patch('lib.tap_stack.IamPolicy') as mock_policy, \
             patch('lib.tap_stack.LambdaFunction') as mock_lambda, \
             patch('lib.tap_stack.CloudwatchEventRule'), \
             patch('lib.tap_stack.CloudwatchEventTarget'), \
             patch('lib.tap_stack.LambdaPermission'), \
             patch('lib.tap_stack.Route53Zone'), \
             patch('lib.tap_stack.Route53HealthCheck'), \
             patch('lib.tap_stack.Route53Record'), \
             patch('lib.tap_stack.SnsTopic') as mock_sns, \
             patch('lib.tap_stack.SnsTopicSubscription'), \
             patch('lib.tap_stack.CloudwatchMetricAlarm') as mock_alarm, \
             patch('lib.tap_stack.TerraformOutput'):

            yield {
                'vpc': mock_vpc,
                'sg': mock_sg,
                'kms': mock_kms,
                'subnet_group': mock_subnet_group,
                'global': mock_global,
                'secret': mock_secret,
                'cluster': mock_cluster,
                'ddb': mock_ddb,
                'role': mock_role,
                'policy': mock_policy,
                'lambda': mock_lambda,
                'sns': mock_sns,
                'alarm': mock_alarm
            }

    def test_vpc_has_v1_naming(self, mock_all_resources):
        """Test VPC resources include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        vpc_call = mock_all_resources['vpc'].call_args_list[0][1]
        assert "payment-v1-primary-vpc-test123" in str(vpc_call['tags'])

    def test_security_groups_have_v1_naming(self, mock_all_resources):
        """Test security groups include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        sg_call = mock_all_resources['sg'].call_args_list[0][1]
        assert "payment-v1-" in sg_call['name']

    def test_rds_resources_have_v1_naming(self, mock_all_resources):
        """Test RDS resources include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        global_call = mock_all_resources['global'].call_args_list[0][1]
        assert "payment-v1-global-test123" in global_call['global_cluster_identifier']

    def test_dynamodb_has_v1_naming(self, mock_all_resources):
        """Test DynamoDB table includes v1 in name"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        ddb_call = mock_all_resources['ddb'].call_args_list[0][1]
        assert "payment-v1-sessions-test123" in ddb_call['name']

    def test_lambda_functions_have_v1_naming(self, mock_all_resources):
        """Test Lambda functions include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        lambda_call = mock_all_resources['lambda'].call_args_list[0][1]
        assert "payment-v1-" in lambda_call['function_name']

    def test_iam_roles_have_v1_naming(self, mock_all_resources):
        """Test IAM roles include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        role_call = mock_all_resources['role'].call_args_list[0][1]
        assert "payment-v1-" in role_call['name']

    def test_sns_topics_have_v1_naming(self, mock_all_resources):
        """Test SNS topics include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        sns_call = mock_all_resources['sns'].call_args_list[0][1]
        assert "payment-v1-alerts-test123" in sns_call['name']

    def test_cloudwatch_alarms_have_v1_naming(self, mock_all_resources):
        """Test CloudWatch alarms include v1 in names"""
        from lib.tap_stack import TapStack

        TapStack(
            MagicMock(),
            "test",
            environment_suffix="test123",
            state_bucket="bucket",
            state_bucket_region="us-east-1"
        )

        alarm_call = mock_all_resources['alarm'].call_args_list[0][1]
        assert "payment-v1-" in alarm_call['alarm_name']
