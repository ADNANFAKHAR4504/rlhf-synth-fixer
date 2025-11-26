#!/usr/bin/env python
# pylint: disable=too-many-lines,redefined-outer-name,protected-access
"""
Comprehensive unit tests for TapStack with 100% code coverage.
Uses proper mocking without live AWS interactions.
"""
import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from constructs import Construct
from cdktf import App, Testing


@pytest.fixture
def mock_aws_resources():
    """Fixture to mock all AWS resource constructors."""
    # Create list of patches to avoid nested block limit
    patches = [
        patch('lib.tap_stack.S3Backend'),
        patch('lib.tap_stack.AwsProvider'),
        patch('lib.tap_stack.Vpc'),
        patch('lib.tap_stack.Subnet'),
        patch('lib.tap_stack.InternetGateway'),
        patch('lib.tap_stack.RouteTable'),
        patch('lib.tap_stack.RouteTableAssociation'),
        patch('lib.tap_stack.SecurityGroup'),
        patch('lib.tap_stack.VpcPeeringConnection'),
        patch('lib.tap_stack.VpcPeeringConnectionAccepterA'),
        patch('lib.tap_stack.Route'),
        patch('lib.tap_stack.RdsGlobalCluster'),
        patch('lib.tap_stack.RdsCluster'),
        patch('lib.tap_stack.RdsClusterInstance'),
        patch('lib.tap_stack.DbSubnetGroup'),
        patch('lib.tap_stack.SecretsmanagerSecret'),
        patch('lib.tap_stack.SecretsmanagerSecretVersion'),
        patch('lib.tap_stack.KmsKey'),
        patch('lib.tap_stack.KmsAlias'),
        patch('lib.tap_stack.DynamodbTable'),
        patch('lib.tap_stack.LambdaFunction'),
        patch('lib.tap_stack.IamRole'),
        patch('lib.tap_stack.IamRolePolicyAttachment'),
        patch('lib.tap_stack.IamPolicy'),
        patch('lib.tap_stack.CloudwatchEventRule'),
        patch('lib.tap_stack.CloudwatchEventTarget'),
        patch('lib.tap_stack.LambdaPermission'),
        patch('lib.tap_stack.Route53Zone'),
        patch('lib.tap_stack.Route53HealthCheck'),
        patch('lib.tap_stack.Route53Record'),
        patch('lib.tap_stack.CloudwatchMetricAlarm'),
        patch('lib.tap_stack.SnsTopic'),
        patch('lib.tap_stack.SnsTopicSubscription'),
        patch('lib.tap_stack.TerraformOutput'),
    ]

    # Start all patches
    mocks = [p.start() for p in patches]

    # Unpack mocks
    (mock_s3_backend, mock_aws_provider, mock_vpc, mock_subnet, mock_igw,
     mock_route_table, mock_rt_assoc, mock_sg, mock_vpc_peering, mock_vpc_accepter,
     mock_route, mock_global_cluster, mock_rds_cluster, mock_rds_instance,
     mock_db_subnet_group, mock_secret, mock_secret_version, mock_kms_key,
     mock_kms_alias, mock_dynamodb, mock_lambda, mock_iam_role,
     mock_iam_policy_attach, mock_iam_policy, mock_event_rule, mock_event_target,
     mock_lambda_permission, mock_r53_zone, mock_r53_healthcheck, mock_r53_record,
     mock_cw_alarm, mock_sns_topic, mock_sns_subscription, mock_tf_output) = mocks

    # Configure mocks with return values
    mock_vpc_instance = Mock()
    mock_vpc_instance.id = "vpc-12345678"
    mock_vpc.return_value = mock_vpc_instance

    mock_subnet_instance = Mock()
    mock_subnet_instance.id = "subnet-12345678"
    mock_subnet.return_value = mock_subnet_instance

    mock_igw_instance = Mock()
    mock_igw_instance.id = "igw-12345678"
    mock_igw.return_value = mock_igw_instance

    mock_rt_instance = Mock()
    mock_rt_instance.id = "rtb-12345678"
    mock_route_table.return_value = mock_rt_instance

    mock_sg_instance = Mock()
    mock_sg_instance.id = "sg-12345678"
    mock_sg.return_value = mock_sg_instance

    mock_peering_instance = Mock()
    mock_peering_instance.id = "pcx-12345678"
    mock_vpc_peering.return_value = mock_peering_instance

    mock_global_cluster_instance = Mock()
    mock_global_cluster_instance.id = "global-cluster-12345678"
    mock_global_cluster.return_value = mock_global_cluster_instance

    mock_secret_instance = Mock()
    mock_secret_instance.id = "secret-12345678"
    mock_secret_instance.arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
    mock_secret.return_value = mock_secret_instance

    mock_kms_instance = Mock()
    mock_kms_instance.id = "key-12345678"
    mock_kms_instance.key_id = "key-12345678"
    mock_kms_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/test"
    mock_kms_key.return_value = mock_kms_instance

    mock_db_subnet_instance = Mock()
    mock_db_subnet_instance.name = "db-subnet-group"
    mock_db_subnet_group.return_value = mock_db_subnet_instance

    mock_rds_cluster_instance = Mock()
    mock_rds_cluster_instance.id = "cluster-12345678"
    mock_rds_cluster.return_value = mock_rds_cluster_instance

    mock_dynamodb_instance = Mock()
    mock_dynamodb_instance.name = "test-table"
    mock_dynamodb.return_value = mock_dynamodb_instance

    mock_iam_role_instance = Mock()
    mock_iam_role_instance.name = "test-role"
    mock_iam_role_instance.arn = "arn:aws:iam::123456789012:role/test-role"
    mock_iam_role.return_value = mock_iam_role_instance

    mock_iam_policy_instance = Mock()
    mock_iam_policy_instance.arn = "arn:aws:iam::123456789012:policy/test-policy"
    mock_iam_policy.return_value = mock_iam_policy_instance

    mock_lambda_instance = Mock()
    mock_lambda_instance.function_name = "test-function"
    mock_lambda_instance.arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
    mock_lambda.return_value = mock_lambda_instance

    mock_event_rule_instance = Mock()
    mock_event_rule_instance.name = "test-rule"
    mock_event_rule_instance.arn = "arn:aws:events:us-east-1:123456789012:rule/test-rule"
    mock_event_rule.return_value = mock_event_rule_instance

    mock_r53_zone_instance = Mock()
    mock_r53_zone_instance.zone_id = "Z12345678"
    mock_r53_zone.return_value = mock_r53_zone_instance

    mock_r53_healthcheck_instance = Mock()
    mock_r53_healthcheck_instance.id = "hc-12345678"
    mock_r53_healthcheck.return_value = mock_r53_healthcheck_instance

    mock_sns_instance = Mock()
    mock_sns_instance.arn = "arn:aws:sns:us-east-1:123456789012:test-topic"
    mock_sns_topic.return_value = mock_sns_instance

    yield {
        's3_backend': mock_s3_backend,
        'aws_provider': mock_aws_provider,
        'vpc': mock_vpc,
        'subnet': mock_subnet,
        'igw': mock_igw,
        'route_table': mock_route_table,
        'rt_assoc': mock_rt_assoc,
        'security_group': mock_sg,
        'vpc_peering': mock_vpc_peering,
        'vpc_accepter': mock_vpc_accepter,
        'route': mock_route,
        'global_cluster': mock_global_cluster,
        'rds_cluster': mock_rds_cluster,
        'rds_instance': mock_rds_instance,
        'db_subnet_group': mock_db_subnet_group,
        'secret': mock_secret,
        'secret_version': mock_secret_version,
        'kms_key': mock_kms_key,
        'kms_alias': mock_kms_alias,
        'dynamodb': mock_dynamodb,
        'lambda_func': mock_lambda,
        'iam_role': mock_iam_role,
        'iam_policy_attach': mock_iam_policy_attach,
        'iam_policy': mock_iam_policy,
        'event_rule': mock_event_rule,
        'event_target': mock_event_target,
        'lambda_permission': mock_lambda_permission,
        'r53_zone': mock_r53_zone,
        'r53_healthcheck': mock_r53_healthcheck,
        'r53_record': mock_r53_record,
        'cw_alarm': mock_cw_alarm,
        'sns_topic': mock_sns_topic,
        'sns_subscription': mock_sns_subscription,
        'tf_output': mock_tf_output
    }

    # Cleanup: stop all patches
    for p in patches:
        p.stop()


class TestTapStackInitialization:
    """Test TapStack initialization and constructor parameters."""

    def test_stack_creation_with_default_regions(self, mock_aws_resources):
        """Test stack creation with default region configuration."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        assert stack is not None
        assert stack.environment_suffix == "dev"

        # Verify S3Backend was called with correct parameters
        mock_aws_resources['s3_backend'].assert_called_once()
        call_kwargs = mock_aws_resources['s3_backend'].call_args[1]
        assert call_kwargs['bucket'] == "test-bucket"
        assert call_kwargs['key'] == "test-stack/dev/terraform.tfstate"
        assert call_kwargs['region'] == "us-east-1"
        assert call_kwargs['encrypt'] is True

    def test_stack_creation_with_custom_regions(self, mock_aws_resources):
        """Test stack creation with custom primary and secondary regions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2",
            primary_region="eu-west-1",
            secondary_region="eu-central-1"
        )

        assert stack is not None
        assert stack.environment_suffix == "prod"

        # Verify providers were created for custom regions
        assert mock_aws_resources['aws_provider'].call_count == 2

        # Check primary provider
        primary_call = mock_aws_resources['aws_provider'].call_args_list[0]
        assert primary_call[1]['region'] == "eu-west-1"
        assert primary_call[1]['alias'] == "primary"

        # Check secondary provider
        secondary_call = mock_aws_resources['aws_provider'].call_args_list[1]
        assert secondary_call[1]['region'] == "eu-central-1"
        assert secondary_call[1]['alias'] == "secondary"


class TestNetworkingComponents:
    """Test VPC, subnets, and networking components."""

    def test_vpc_creation(self, mock_aws_resources):
        """Test primary and secondary VPC creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify VPCs were created (2 VPCs: primary and secondary)
        assert mock_aws_resources['vpc'].call_count == 2

        # Check primary VPC
        primary_vpc_call = mock_aws_resources['vpc'].call_args_list[0]
        assert primary_vpc_call[1]['cidr_block'] == "10.0.0.0/16"
        assert primary_vpc_call[1]['enable_dns_hostnames'] is True
        assert primary_vpc_call[1]['enable_dns_support'] is True
        assert "payment-v1-primary-vpc-v1-dev" in primary_vpc_call[1]['tags']['Name']

        # Check secondary VPC
        secondary_vpc_call = mock_aws_resources['vpc'].call_args_list[1]
        assert secondary_vpc_call[1]['cidr_block'] == "10.1.0.0/16"
        assert "payment-v1-secondary-vpc-dev" in secondary_vpc_call[1]['tags']['Name']

    def test_subnet_creation(self, mock_aws_resources):
        """Test subnet creation across availability zones."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify subnets were created (3 primary + 3 secondary = 6 subnets)
        assert mock_aws_resources['subnet'].call_count == 6

        # Check primary subnets
        for i in range(3):
            subnet_call = mock_aws_resources['subnet'].call_args_list[i]
            assert subnet_call[1]['cidr_block'] == f"10.0.{i}.0/24"
            assert subnet_call[1]['availability_zone'] == f"us-east-1{chr(97+i)}"

        # Check secondary subnets
        for i in range(3):
            subnet_call = mock_aws_resources['subnet'].call_args_list[i+3]
            assert subnet_call[1]['cidr_block'] == f"10.1.{i}.0/24"
            assert subnet_call[1]['availability_zone'] == f"us-west-2{chr(97+i)}"

    def test_internet_gateway_creation(self, mock_aws_resources):
        """Test Internet Gateway creation for both regions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="staging",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 IGWs were created (primary and secondary)
        assert mock_aws_resources['igw'].call_count == 2

        # Check that IGWs are tagged correctly
        primary_igw_call = mock_aws_resources['igw'].call_args_list[0]
        assert "payment-v1-primary-igw-staging" in primary_igw_call[1]['tags']['Name']

        secondary_igw_call = mock_aws_resources['igw'].call_args_list[1]
        assert "payment-v1-secondary-igw-staging" in secondary_igw_call[1]['tags']['Name']

    def test_route_table_creation(self, mock_aws_resources):
        """Test route table creation and associations."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 route tables were created
        assert mock_aws_resources['route_table'].call_count == 2

        # Verify route table associations (3 primary + 3 secondary = 6 associations)
        assert mock_aws_resources['rt_assoc'].call_count == 6

    def test_vpc_peering_connection(self, mock_aws_resources):
        """Test VPC peering between primary and secondary regions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify VPC peering was created
        mock_aws_resources['vpc_peering'].assert_called_once()
        peering_call = mock_aws_resources['vpc_peering'].call_args[1]
        assert peering_call['peer_region'] == "us-west-2"
        assert peering_call['auto_accept'] is False

        # Verify VPC peering accepter was created
        mock_aws_resources['vpc_accepter'].assert_called_once()
        accepter_call = mock_aws_resources['vpc_accepter'].call_args[1]
        assert accepter_call['auto_accept'] is True

        # Verify peering routes were created (2 routes)
        assert mock_aws_resources['route'].call_count == 2

    def test_security_groups_creation(self, mock_aws_resources):
        """Test security group creation for DB and Lambda."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 4 security groups were created (2 DB + 2 Lambda)
        assert mock_aws_resources['security_group'].call_count == 4

        # Check primary DB security group
        primary_db_sg = mock_aws_resources['security_group'].call_args_list[0]
        assert "payment-v1-primary-db-sg-dev" in primary_db_sg[1]['name']
        assert len(primary_db_sg[1]['ingress']) == 1
        assert primary_db_sg[1]['ingress'][0].from_port == 5432
        assert primary_db_sg[1]['ingress'][0].protocol == "tcp"

        # Check primary Lambda security group
        primary_lambda_sg = mock_aws_resources['security_group'].call_args_list[1]
        assert "payment-v1-primary-lambda-sg-dev" in primary_lambda_sg[1]['name']
        assert len(primary_lambda_sg[1]['egress']) == 1


class TestDatabaseComponents:
    """Test RDS Aurora, KMS, and Secrets Manager components."""

    def test_kms_key_creation(self, mock_aws_resources):
        """Test KMS key creation for encryption."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 KMS keys were created (primary and secondary)
        assert mock_aws_resources['kms_key'].call_count == 2

        # Check KMS key rotation is enabled
        primary_kms_call = mock_aws_resources['kms_key'].call_args_list[0]
        assert primary_kms_call[1]['enable_key_rotation'] is True
        assert "prod" in primary_kms_call[1]['description']

        # Verify KMS aliases were created
        assert mock_aws_resources['kms_alias'].call_count == 2

    def test_db_subnet_group_creation(self, mock_aws_resources):
        """Test DB subnet group creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 DB subnet groups were created
        assert mock_aws_resources['db_subnet_group'].call_count == 2

        # Check primary DB subnet group
        primary_db_subnet = mock_aws_resources['db_subnet_group'].call_args_list[0]
        assert "payment-v1-primary-db-subnet-dev" in primary_db_subnet[1]['name']
        assert len(primary_db_subnet[1]['subnet_ids']) == 3

    def test_secrets_manager_creation(self, mock_aws_resources):
        """Test Secrets Manager secret creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 secrets were created (primary and secondary)
        assert mock_aws_resources['secret'].call_count == 2

        # Verify secret versions were created
        assert mock_aws_resources['secret_version'].call_count == 2

        # Check secret version contains correct credentials
        primary_secret_version = mock_aws_resources['secret_version'].call_args_list[0]
        secret_string = json.loads(primary_secret_version[1]['secret_string'])
        assert secret_string['username'] == "dbadmin"
        assert secret_string['engine'] == "postgres"
        assert secret_string['port'] == 5432
        assert secret_string['dbname'] == "paymentdb"

    def test_global_cluster_creation(self, mock_aws_resources):
        """Test Aurora Global Cluster creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify global cluster was created
        mock_aws_resources['global_cluster'].assert_called_once()
        global_cluster_call = mock_aws_resources['global_cluster'].call_args[1]
        assert "payment-v1-global-prod" in global_cluster_call['global_cluster_identifier']
        assert global_cluster_call['engine'] == "aurora-postgresql"
        assert global_cluster_call['engine_version'] == "14.6"
        assert global_cluster_call['database_name'] == "paymentdb"
        assert global_cluster_call['storage_encrypted'] is True

    def test_rds_cluster_creation(self, mock_aws_resources):
        """Test primary and secondary RDS cluster creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 RDS clusters were created (primary and secondary)
        assert mock_aws_resources['rds_cluster'].call_count == 2

        # Check primary cluster configuration
        primary_cluster = mock_aws_resources['rds_cluster'].call_args_list[0]
        assert "payment-v1-primary-dev" in primary_cluster[1]['cluster_identifier']
        assert primary_cluster[1]['engine'] == "aurora-postgresql"
        assert primary_cluster[1]['master_username'] == "dbadmin"
        assert primary_cluster[1]['storage_encrypted'] is True
        assert primary_cluster[1]['backup_retention_period'] == 7
        assert primary_cluster[1]['skip_final_snapshot'] is True

        # Check secondary cluster configuration
        secondary_cluster = mock_aws_resources['rds_cluster'].call_args_list[1]
        assert "payment-v1-secondary-dev" in secondary_cluster[1]['cluster_identifier']
        assert 'master_username' not in secondary_cluster[1]  # Secondary doesn't have master credentials
        assert 'master_password' not in secondary_cluster[1]

    def test_rds_cluster_instances(self, mock_aws_resources):
        """Test RDS cluster instance creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 4 instances were created (2 primary + 2 secondary)
        assert mock_aws_resources['rds_instance'].call_count == 4

        # Check instance configuration
        instance_call = mock_aws_resources['rds_instance'].call_args_list[0]
        assert instance_call[1]['instance_class'] == "db.r6g.large"
        assert instance_call[1]['engine'] == "aurora-postgresql"
        assert instance_call[1]['publicly_accessible'] is False


class TestComputeComponents:
    """Test Lambda, DynamoDB, and IAM components."""

    def test_dynamodb_table_creation(self, mock_aws_resources):
        """Test DynamoDB global table creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify DynamoDB table was created
        mock_aws_resources['dynamodb'].assert_called_once()
        dynamodb_call = mock_aws_resources['dynamodb'].call_args[1]
        assert "payment-v1-sessions-test" in dynamodb_call['name']
        assert dynamodb_call['billing_mode'] == "PAY_PER_REQUEST"
        assert dynamodb_call['hash_key'] == "sessionId"
        assert dynamodb_call['stream_enabled'] is True
        assert dynamodb_call['stream_view_type'] == "NEW_AND_OLD_IMAGES"

        # Check replica configuration
        assert len(dynamodb_call['replica']) == 1
        assert dynamodb_call['replica'][0].region_name == "us-west-2"

    def test_lambda_iam_role_creation(self, mock_aws_resources):
        """Test Lambda IAM role creation with policies."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 3 IAM roles were created (2 Lambda + 1 Backup)
        assert mock_aws_resources['iam_role'].call_count == 3

        # Check primary Lambda role
        primary_role = mock_aws_resources['iam_role'].call_args_list[0]
        assert "payment-v1-lambda-role-primary-dev" in primary_role[1]['name']
        assume_policy = json.loads(primary_role[1]['assume_role_policy'])
        assert assume_policy['Statement'][0]['Action'] == "sts:AssumeRole"
        assert assume_policy['Statement'][0]['Principal']['Service'] == "lambda.amazonaws.com"

        # Verify IAM policy attachments (2 for primary Lambda + 2 for secondary Lambda + 2 for backup = 6)
        assert mock_aws_resources['iam_policy_attach'].call_count == 6

        # Verify custom IAM policies (2 Lambda policies + 1 backup policy = 3)
        assert mock_aws_resources['iam_policy'].call_count == 3

    def test_lambda_policy_permissions(self, mock_aws_resources):
        """Test Lambda IAM policy permissions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check primary Lambda policy
        primary_policy = mock_aws_resources['iam_policy'].call_args_list[0]
        policy_doc = json.loads(primary_policy[1]['policy'])

        # Verify DynamoDB permissions
        dynamodb_statement = policy_doc['Statement'][0]
        assert "dynamodb:PutItem" in dynamodb_statement['Action']
        assert "dynamodb:GetItem" in dynamodb_statement['Action']
        assert "dynamodb:UpdateItem" in dynamodb_statement['Action']

        # Verify Secrets Manager permissions
        secrets_statement = policy_doc['Statement'][1]
        assert "secretsmanager:GetSecretValue" in secrets_statement['Action']

    def test_payment_lambda_creation(self, mock_aws_resources):
        """Test payment processing Lambda function creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="staging",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 3 Lambda functions were created (2 payment + 1 backup)
        assert mock_aws_resources['lambda_func'].call_count == 3

        # Check primary payment Lambda
        primary_lambda = mock_aws_resources['lambda_func'].call_args_list[0]
        assert "payment-v1-processor-primary-staging" in primary_lambda[1]['function_name']
        assert primary_lambda[1]['runtime'] == "python3.11"
        assert primary_lambda[1]['architectures'] == ["arm64"]
        assert primary_lambda[1]['memory_size'] == 512
        assert primary_lambda[1]['timeout'] == 30
        assert primary_lambda[1]['handler'] == "index.handler"

        # Check Lambda environment variables
        env_vars = primary_lambda[1]['environment']['variables']
        assert 'DYNAMODB_TABLE' in env_vars
        assert 'DB_SECRET_ARN' in env_vars
        assert env_vars['REGION'] == "us-east-1"

        # Check VPC configuration
        vpc_config = primary_lambda[1]['vpc_config']
        assert len(vpc_config['subnet_ids']) == 3
        assert len(vpc_config['security_group_ids']) == 1

    def test_backup_verification_lambda(self, mock_aws_resources):
        """Test backup verification Lambda function."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check backup Lambda configuration
        backup_lambda = mock_aws_resources['lambda_func'].call_args_list[2]
        assert "payment-v1-backup-verification-prod" in backup_lambda[1]['function_name']
        assert backup_lambda[1]['memory_size'] == 256
        assert backup_lambda[1]['timeout'] == 300

        # Check environment variables
        env_vars = backup_lambda[1]['environment']['variables']
        assert "payment-v1-primary-prod" in env_vars['CLUSTER_IDENTIFIER']
        assert env_vars['ENVIRONMENT'] == "prod"

    def test_backup_iam_policy(self, mock_aws_resources):
        """Test backup Lambda IAM policy permissions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check backup policy
        backup_policy = mock_aws_resources['iam_policy'].call_args_list[2]
        policy_doc = json.loads(backup_policy[1]['policy'])

        # Verify RDS permissions
        rds_statement = policy_doc['Statement'][0]
        assert "rds:DescribeDBClusters" in rds_statement['Action']
        assert "rds:DescribeDBClusterSnapshots" in rds_statement['Action']

        # Verify CloudWatch permissions
        cw_statement = policy_doc['Statement'][1]
        assert "cloudwatch:PutMetricData" in cw_statement['Action']

    def test_cloudwatch_event_rule(self, mock_aws_resources):
        """Test CloudWatch Event Rule for backup schedule."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify event rule was created
        mock_aws_resources['event_rule'].assert_called_once()
        event_rule = mock_aws_resources['event_rule'].call_args[1]
        assert "payment-v1-backup-schedule-dev" in event_rule['name']
        assert event_rule['schedule_expression'] == "rate(1 day)"

        # Verify event target was created
        mock_aws_resources['event_target'].assert_called_once()

        # Verify Lambda permission was created
        mock_aws_resources['lambda_permission'].assert_called_once()
        lambda_perm = mock_aws_resources['lambda_permission'].call_args[1]
        assert lambda_perm['statement_id'] == "AllowExecutionFromCloudWatch"
        assert lambda_perm['action'] == "lambda:InvokeFunction"
        assert lambda_perm['principal'] == "events.amazonaws.com"


class TestDNSComponents:
    """Test Route 53 DNS and health check components."""

    def test_route53_hosted_zone(self, mock_aws_resources):
        """Test Route 53 hosted zone creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify hosted zone was created
        mock_aws_resources['r53_zone'].assert_called_once()
        zone_call = mock_aws_resources['r53_zone'].call_args[1]
        assert zone_call['name'] == "payment-v1-dr-prod.internal.test"

    def test_route53_health_checks(self, mock_aws_resources):
        """Test Route 53 health check creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 health checks were created (primary and secondary)
        assert mock_aws_resources['r53_healthcheck'].call_count == 2

        # Check primary health check
        primary_hc = mock_aws_resources['r53_healthcheck'].call_args_list[0]
        assert primary_hc[1]['type'] == "HTTPS"
        assert primary_hc[1]['resource_path'] == "/health"
        assert primary_hc[1]['port'] == 443
        assert primary_hc[1]['request_interval'] == 30
        assert primary_hc[1]['failure_threshold'] == 3
        assert primary_hc[1]['measure_latency'] is True

    def test_route53_failover_records(self, mock_aws_resources):
        """Test Route 53 DNS records with failover routing."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 DNS records were created (primary and secondary)
        assert mock_aws_resources['r53_record'].call_count == 2

        # Check primary record
        primary_record = mock_aws_resources['r53_record'].call_args_list[0]
        assert primary_record[1]['name'] == "api.payment-dr-test.internal.test"
        assert primary_record[1]['type'] == "CNAME"
        assert primary_record[1]['ttl'] == 60
        assert primary_record[1]['set_identifier'] == "primary"
        assert primary_record[1]['failover_routing_policy']['type'] == "PRIMARY"

        # Check secondary record
        secondary_record = mock_aws_resources['r53_record'].call_args_list[1]
        assert secondary_record[1]['set_identifier'] == "secondary"
        assert secondary_record[1]['failover_routing_policy']['type'] == "SECONDARY"


class TestMonitoringComponents:
    """Test CloudWatch alarms and SNS components."""

    def test_sns_topic_creation(self, mock_aws_resources):
        """Test SNS topic creation for alerts."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 SNS topics were created (primary and secondary)
        assert mock_aws_resources['sns_topic'].call_count == 2

        # Check primary SNS topic
        primary_sns = mock_aws_resources['sns_topic'].call_args_list[0]
        assert "payment-v1-alerts-dev" in primary_sns[1]['name']
        assert primary_sns[1]['display_name'] == "Payment System Alerts"

        # Check secondary SNS topic
        secondary_sns = mock_aws_resources['sns_topic'].call_args_list[1]
        assert "payment-v1-alerts-secondary-dev" in secondary_sns[1]['name']

    def test_sns_subscriptions(self, mock_aws_resources):
        """Test SNS topic subscriptions."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 2 SNS subscriptions were created
        assert mock_aws_resources['sns_subscription'].call_count == 2

        # Check subscription configuration
        subscription = mock_aws_resources['sns_subscription'].call_args_list[0]
        assert subscription[1]['protocol'] == "email"
        assert subscription[1]['endpoint'] == "ops-team@example.com"

    def test_cloudwatch_alarms_creation(self, mock_aws_resources):
        """Test CloudWatch alarm creation."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 6 alarms were created (2 DB CPU + 2 Lambda errors + 1 DynamoDB + 1 replication lag)
        assert mock_aws_resources['cw_alarm'].call_count == 6

    def test_rds_cpu_alarms(self, mock_aws_resources):
        """Test RDS CPU utilization alarms."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check primary DB CPU alarm
        primary_alarm = mock_aws_resources['cw_alarm'].call_args_list[0]
        assert "payment-v1-primary-db-cpu-dev" in primary_alarm[1]['alarm_name']
        assert primary_alarm[1]['comparison_operator'] == "GreaterThanThreshold"
        assert primary_alarm[1]['metric_name'] == "CPUUtilization"
        assert primary_alarm[1]['namespace'] == "AWS/RDS"
        assert primary_alarm[1]['threshold'] == 80
        assert primary_alarm[1]['statistic'] == "Average"
        assert primary_alarm[1]['period'] == 300
        assert primary_alarm[1]['evaluation_periods'] == 2

    def test_lambda_error_alarms(self, mock_aws_resources):
        """Test Lambda error alarms."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="staging",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check primary Lambda error alarm
        lambda_alarm = mock_aws_resources['cw_alarm'].call_args_list[2]
        assert "payment-v1-primary-lambda-errors-staging" in lambda_alarm[1]['alarm_name']
        assert lambda_alarm[1]['metric_name'] == "Errors"
        assert lambda_alarm[1]['namespace'] == "AWS/Lambda"
        assert lambda_alarm[1]['threshold'] == 10
        assert lambda_alarm[1]['statistic'] == "Sum"
        assert lambda_alarm[1]['period'] == 60
        assert lambda_alarm[1]['evaluation_periods'] == 1

    def test_dynamodb_throttle_alarm(self, mock_aws_resources):
        """Test DynamoDB read throttle alarm."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check DynamoDB throttle alarm
        dynamodb_alarm = mock_aws_resources['cw_alarm'].call_args_list[4]
        assert "payment-v1-dynamodb-read-throttle-dev" in dynamodb_alarm[1]['alarm_name']
        assert dynamodb_alarm[1]['metric_name'] == "ReadThrottleEvents"
        assert dynamodb_alarm[1]['namespace'] == "AWS/DynamoDB"
        assert dynamodb_alarm[1]['threshold'] == 10

    def test_aurora_replication_lag_alarm(self, mock_aws_resources):
        """Test Aurora replication lag alarm."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check replication lag alarm
        replication_alarm = mock_aws_resources['cw_alarm'].call_args_list[5]
        assert "payment-v1-aurora-replication-lag-prod" in replication_alarm[1]['alarm_name']
        assert replication_alarm[1]['metric_name'] == "AuroraGlobalDBReplicationLag"
        assert replication_alarm[1]['threshold'] == 5000
        assert replication_alarm[1]['statistic'] == "Maximum"


class TestOutputs:
    """Test Terraform outputs."""

    def test_terraform_outputs_creation(self, mock_aws_resources):
        """Test all Terraform outputs are created."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify 7 outputs were created
        assert mock_aws_resources['tf_output'].call_count == 7

        # Check output names
        output_calls = [call[0][1] for call in mock_aws_resources['tf_output'].call_args_list]
        assert "primary_vpc_id" in output_calls
        assert "secondary_vpc_id" in output_calls
        assert "global_database_id" in output_calls
        assert "dynamodb_table_name" in output_calls
        assert "dns_failover_domain" in output_calls
        assert "sns_topic_arn" in output_calls
        assert "environment_suffix" in output_calls


class TestResourceTagging:
    """Test resource tagging consistency."""

    def test_environment_tags(self, mock_aws_resources):
        """Test that resources are tagged with environment suffix."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="production",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check VPC tags
        primary_vpc_call = mock_aws_resources['vpc'].call_args_list[0]
        assert primary_vpc_call[1]['tags']['Environment'] == "production"

        # Check Lambda tags
        lambda_call = mock_aws_resources['lambda_func'].call_args_list[0]
        assert lambda_call[1]['tags']['Environment'] == "production"


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_different_environment_suffixes(self, mock_aws_resources):
        """Test stack creation with different environment suffixes."""
        from lib.tap_stack import TapStack

        app = App()

        environments = ["dev", "staging", "prod", "test", "qa"]
        for env in environments:
            stack = TapStack(
                app,
                f"test-stack-{env}",
                environment_suffix=env,
                state_bucket="test-bucket",
                state_bucket_region="us-east-1"
            )
            assert stack.environment_suffix == env

    def test_resource_naming_convention(self, mock_aws_resources):
        """Test that resource names follow consistent naming convention."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check VPC naming
        vpc_call = mock_aws_resources['vpc'].call_args_list[0]
        assert "payment-v1" in vpc_call[1]['tags']['Name']
        assert "-dev" in vpc_call[1]['tags']['Name']

        # Check Lambda naming
        lambda_call = mock_aws_resources['lambda_func'].call_args_list[0]
        assert "payment-v1" in lambda_call[1]['function_name']
        assert "-dev" in lambda_call[1]['function_name']

    def test_database_credentials_format(self, mock_aws_resources):
        """Test database credentials structure."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check secret version structure
        secret_version_call = mock_aws_resources['secret_version'].call_args_list[0]
        credentials = json.loads(secret_version_call[1]['secret_string'])

        # Verify all required keys are present
        required_keys = ['username', 'password', 'engine', 'host', 'port', 'dbname']
        for key in required_keys:
            assert key in credentials


class TestIntegration:
    """Test integration between components."""

    def test_vpc_subnet_integration(self, mock_aws_resources):
        """Test VPC and subnet integration."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify subnets reference VPC IDs
        for i in range(6):
            subnet_call = mock_aws_resources['subnet'].call_args_list[i]
            assert 'vpc_id' in subnet_call[1]

    def test_lambda_vpc_integration(self, mock_aws_resources):
        """Test Lambda and VPC integration."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Check Lambda VPC configuration
        lambda_call = mock_aws_resources['lambda_func'].call_args_list[0]
        vpc_config = lambda_call[1]['vpc_config']
        assert 'subnet_ids' in vpc_config
        assert 'security_group_ids' in vpc_config

    def test_rds_security_group_integration(self, mock_aws_resources):
        """Test RDS and security group integration."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify RDS cluster references security groups
        primary_cluster_call = mock_aws_resources['rds_cluster'].call_args_list[0]
        assert 'vpc_security_group_ids' in primary_cluster_call[1]

    def test_alarm_sns_integration(self, mock_aws_resources):
        """Test CloudWatch alarm and SNS integration."""
        from lib.tap_stack import TapStack

        app = App()
        stack = TapStack(
            app,
            "test-stack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1"
        )

        # Verify alarms reference SNS topics
        for i in range(6):
            alarm_call = mock_aws_resources['cw_alarm'].call_args_list[i]
            assert 'alarm_actions' in alarm_call[1]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=lib.tap_stack", "--cov-report=term-missing"])
