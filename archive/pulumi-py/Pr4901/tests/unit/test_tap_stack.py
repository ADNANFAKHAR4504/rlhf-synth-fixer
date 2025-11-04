"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
import unittest.mock
from unittest.mock import patch, MagicMock
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock class for Pulumi testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create a mock resource."""
        # Return a dict of default property values for the resource type
        outputs = {
            **args.inputs,
            'id': f"{args.name}_id",
            'arn': f"arn:aws::{args.typ}::{args.name}",
        }

        # Add type-specific outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs['id'] = 'vpc-12345'
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs['id'] = f'subnet-{args.name}'
            outputs['availability_zone'] = 'ca-central-1a'
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs['endpoint'] = 'test-writer.cluster-abc.ca-central-1.rds.amazonaws.com'
            outputs['reader_endpoint'] = 'test-reader.cluster-abc.ca-central-1.rds.amazonaws.com'
            outputs['arn'] = f'arn:aws:rds:ca-central-1:123456789012:cluster:{args.name}'
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs['configuration_endpoint_address'] = 'test-redis.abc.cfg.cac1.cache.amazonaws.com'
        elif args.typ == "aws:efs/fileSystem:FileSystem":
            outputs['id'] = 'fs-12345'
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs['name'] = f'{args.name}-cluster'
        elif args.typ == "aws:ecs/service:Service":
            outputs['name'] = f'{args.name}-service'
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs['arn'] = f'arn:aws:secretsmanager:ca-central-1:123456789012:secret:{args.name}'
        elif args.typ == "aws:lambda/function:Function":
            outputs['arn'] = f'arn:aws:lambda:ca-central-1:123456789012:function:{args.name}'
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs['id'] = f'sg-{args.name}'

        return [outputs.get('id', f'{args.name}_id'), outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock provider function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                'names': ['ca-central-1a', 'ca-central-1b', 'ca-central-1d'],
                'zone_ids': ['cac1-az1', 'cac1-az2', 'cac1-az3'],
            }
        elif args.token == "aws:iam/getPolicyDocument:getPolicyDocument":
            return {'json': '{"Version": "2012-10-17", "Statement": []}'}
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Project': 'Test', 'Owner': 'QA'}
        args = TapStackArgs(environment_suffix='prod', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack creates all required component stacks."""
    from lib.tap_stack import TapStack, TapStackArgs

    # Create stack
    args = TapStackArgs(environment_suffix='test')
    stack = TapStack('test-stack', args)

    # Verify stack has all required components
    assert stack is not None
    assert stack.environment_suffix == 'test'
    assert 'Environment' in stack.tags
    assert stack.tags['Environment'] == 'test'


@pulumi.runtime.test
def test_vpc_stack_creates_vpc():
    """Test VpcStack creates VPC with proper configuration."""
    from lib.vpc_stack import VpcStack

    vpc_stack = VpcStack('test-vpc', tags={'Env': 'test'})

    # Verify VPC stack has required outputs
    assert vpc_stack.vpc_id is not None
    assert vpc_stack.public_subnet_ids is not None
    assert vpc_stack.private_subnet_ids is not None


@pulumi.runtime.test
def test_vpc_stack_creates_multiple_subnets():
    """Test VpcStack creates public and private subnets."""
    from lib.vpc_stack import VpcStack

    vpc_stack = VpcStack('test-vpc')

    # Should have 2 public and 2 private subnets
    assert len(vpc_stack.public_subnet_ids) == 2
    assert len(vpc_stack.private_subnet_ids) == 2


@pulumi.runtime.test
def test_secrets_stack_creates_secret():
    """Test SecretsStack creates secret with rotation."""
    from lib.secrets_stack import SecretsStack

    secrets_stack = SecretsStack(
        'test-secrets',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ]
    )

    assert secrets_stack.db_secret_arn is not None
    assert secrets_stack.rotation_lambda_sg_id is not None


@pulumi.runtime.test
def test_secrets_stack_attach_to_rds():
    """Test SecretsStack can attach to RDS cluster."""
    from lib.secrets_stack import SecretsStack

    secrets_stack = SecretsStack(
        'test-secrets',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[pulumi.Output.from_input('subnet-1')]
    )

    # Should not raise exception
    secrets_stack.attach_to_rds(
        cluster_arn=pulumi.Output.from_input('arn:aws:rds:test'),
        cluster_id=pulumi.Output.from_input('cluster-123')
    )

    assert secrets_stack.rds_cluster_arn is not None
    assert secrets_stack.rds_cluster_id is not None


@pulumi.runtime.test
def test_rds_stack_creates_cluster():
    """Test RdsStack creates Aurora cluster."""
    from lib.rds_stack import RdsStack

    rds_stack = RdsStack(
        'test-rds',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ],
        secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:test')
    )

    assert rds_stack.cluster_endpoint is not None
    assert rds_stack.reader_endpoint is not None
    assert rds_stack.security_group_id is not None


@pulumi.runtime.test
def test_elasticache_stack_creates_cluster():
    """Test ElastiCacheStack creates Redis cluster."""
    from lib.elasticache_stack import ElastiCacheStack

    cache_stack = ElastiCacheStack(
        'test-cache',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ]
    )

    assert cache_stack.configuration_endpoint is not None
    assert cache_stack.security_group_id is not None


@pulumi.runtime.test
def test_efs_stack_creates_filesystem():
    """Test EfsStack creates EFS filesystem."""
    from lib.efs_stack import EfsStack

    efs_stack = EfsStack(
        'test-efs',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[
            pulumi.Output.from_input('subnet-1'),
            pulumi.Output.from_input('subnet-2')
        ]
    )

    assert efs_stack.file_system_id is not None
    assert efs_stack.access_point_id is not None


@pulumi.runtime.test
def test_ecs_stack_creates_cluster():
    """Test EcsStack creates ECS cluster and service."""
    from lib.ecs_stack import EcsStack

    ecs_stack = EcsStack(
        'test-ecs',
        vpc_id=pulumi.Output.from_input('vpc-123'),
        private_subnet_ids=[pulumi.Output.from_input('subnet-1')],
        public_subnet_ids=[pulumi.Output.from_input('subnet-pub-1')],
        rds_security_group_id=pulumi.Output.from_input('sg-rds'),
        elasticache_security_group_id=pulumi.Output.from_input('sg-cache'),
        efs_id=pulumi.Output.from_input('fs-123'),
        rds_endpoint=pulumi.Output.from_input('rds.endpoint'),
        rds_reader_endpoint=pulumi.Output.from_input('rds.reader'),
        elasticache_endpoint=pulumi.Output.from_input('redis.endpoint'),
        db_secret_arn=pulumi.Output.from_input('arn:aws:secretsmanager:test')
    )

    assert ecs_stack.cluster_name is not None
    assert ecs_stack.service_name is not None
    assert ecs_stack.alb_dns is not None


# Test lambda rotation handler
class TestLambdaRotationHandler(unittest.TestCase):
    """Test cases for Lambda rotation handler."""

    def setUp(self):
        """Set up test fixtures."""
        self.secret_arn = 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret'
        self.token = 'test-token-123'
        
        self.current_secret = {
            'username': 'testuser',
            'password': 'current-password',
            'host': 'test-host.rds.amazonaws.com',
            'port': 5432,
            'dbname': 'testdb'
        }

    def test_lambda_handler_imports(self):
        """Test that lambda handler can be imported."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        assert hasattr(rotation_handler, 'lambda_handler')

    def test_lambda_handler_functions_exist(self):
        """Test that all required rotation functions exist."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        assert hasattr(rotation_handler, 'create_secret')
        assert hasattr(rotation_handler, 'set_secret')
        assert hasattr(rotation_handler, 'test_secret')
        assert hasattr(rotation_handler, 'finish_secret')

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.rds_client')
    def test_lambda_handler_create_secret_step(self, mock_rds, mock_secrets):
        """Test lambda_handler with createSecret step."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        event = {
            'SecretId': self.secret_arn,
            'ClientRequestToken': self.token,
            'Step': 'createSecret'
        }
        
        # Mock that version doesn't exist
        from botocore.exceptions import ClientError
        mock_secrets.get_secret_value.side_effect = [
            ClientError(
                error_response={'Error': {'Code': 'ResourceNotFoundException'}},
                operation_name='GetSecretValue'
            ),
            {'SecretString': '{"username": "test", "password": "pass"}'}
        ]
        
        # Mock random password generation
        mock_secrets.get_random_password.return_value = {
            'RandomPassword': 'new-random-password'
        }
        
        # Call handler
        rotation_handler.lambda_handler(event, {})
        
        # Verify calls were made
        assert mock_secrets.get_secret_value.called
        assert mock_secrets.put_secret_value.called

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.rds_client')  
    @patch('lib.lambda.rotation_handler.psycopg2')
    def test_lambda_handler_set_secret_step(self, mock_psycopg2, mock_rds, mock_secrets):
        """Test lambda_handler with setSecret step."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        event = {
            'SecretId': self.secret_arn,
            'ClientRequestToken': self.token,
            'Step': 'setSecret'
        }
        
        # Mock secret retrieval
        mock_secrets.get_secret_value.side_effect = [
            {'SecretString': '{"username": "testuser", "password": "newpass"}'},
            {'SecretString': '{"username": "testuser", "password": "oldpass"}'}
        ]
        
        # Mock database connection
        mock_conn = unittest.mock.Mock()
        mock_cursor = unittest.mock.Mock()
        mock_context_manager = unittest.mock.MagicMock()
        mock_context_manager.__enter__.return_value = mock_cursor
        mock_context_manager.__exit__.return_value = None
        mock_conn.cursor.return_value = mock_context_manager
        mock_psycopg2.connect.return_value = mock_conn
        
        # Call handler
        rotation_handler.lambda_handler(event, {})
        
        # Verify database operations
        assert mock_psycopg2.connect.called
        assert mock_cursor.execute.called
        assert mock_conn.commit.called

    @patch('lib.lambda.rotation_handler.secrets_client')
    def test_lambda_handler_invalid_step(self, mock_secrets):
        """Test lambda_handler with invalid step raises error."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        event = {
            'SecretId': self.secret_arn,
            'ClientRequestToken': self.token,
            'Step': 'invalidStep'
        }
        
        with self.assertRaises(ValueError) as context:
            rotation_handler.lambda_handler(event, {})
        
        self.assertIn('Invalid step: invalidStep', str(context.exception))

    @patch('lib.lambda.rotation_handler.secrets_client')
    def test_create_secret_already_exists(self, mock_secrets):
        """Test create_secret when version already exists."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock that version exists
        mock_secrets.get_secret_value.return_value = {
            'SecretString': '{"username": "test", "password": "pass"}'
        }
        
        # Call function - should return early without creating
        rotation_handler.create_secret(self.secret_arn, self.token)
        
        # Should not call put_secret_value
        mock_secrets.put_secret_value.assert_not_called()

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.psycopg2')
    def test_set_secret_database_error_handling(self, mock_psycopg2, mock_secrets):
        """Test set_secret handles database connection errors."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock secret retrieval
        mock_secrets.get_secret_value.side_effect = [
            {'SecretString': '{"username": "testuser", "password": "newpass"}'},
            {'SecretString': '{"username": "testuser", "password": "oldpass"}'}
        ]
        
        # Mock database connection error
        mock_psycopg2.connect.side_effect = Exception('Database connection failed')
        
        with self.assertRaises(Exception) as context:
            rotation_handler.set_secret(self.secret_arn, self.token)
        
        self.assertIn('Database connection failed', str(context.exception))

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.psycopg2')
    def test_test_secret_success(self, mock_psycopg2, mock_secrets):
        """Test test_secret with successful connection."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock secret retrieval
        mock_secrets.get_secret_value.return_value = {
            'SecretString': '{"username": "testuser", "password": "newpass"}'
        }
        
        # Mock successful database connection
        mock_conn = unittest.mock.Mock()
        mock_cursor = unittest.mock.Mock()
        mock_cursor.fetchone.return_value = (1,)
        mock_context_manager = unittest.mock.MagicMock()
        mock_context_manager.__enter__.return_value = mock_cursor
        mock_context_manager.__exit__.return_value = None
        mock_conn.cursor.return_value = mock_context_manager
        mock_psycopg2.connect.return_value = mock_conn
        
        # Should not raise exception
        rotation_handler.test_secret(self.secret_arn, self.token)
        
        # Verify test query was executed
        mock_cursor.execute.assert_called_with('SELECT 1')

    @patch('lib.lambda.rotation_handler.secrets_client')
    def test_finish_secret_already_current(self, mock_secrets):
        """Test finish_secret when version is already current."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock describe_secret response where token is already current
        mock_secrets.describe_secret.return_value = {
            'VersionIdsToStages': {
                self.token: ['AWSCURRENT'],
                'old-version': ['AWSPENDING']
            }
        }
        
        # Call function
        rotation_handler.finish_secret(self.secret_arn, self.token)
        
        # Should not update stages
        mock_secrets.update_secret_version_stage.assert_not_called()

    @patch('lib.lambda.rotation_handler.secrets_client')
    def test_create_secret_other_client_error(self, mock_secrets):
        """Test create_secret handles non-ResourceNotFound errors."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock that an unexpected error occurs
        from botocore.exceptions import ClientError
        mock_secrets.get_secret_value.side_effect = ClientError(
            error_response={'Error': {'Code': 'AccessDenied'}},
            operation_name='GetSecretValue'
        )
        
        with self.assertRaises(ClientError):
            rotation_handler.create_secret(self.secret_arn, self.token)

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.psycopg2')
    def test_test_secret_query_error(self, mock_psycopg2, mock_secrets):
        """Test test_secret handles query errors gracefully."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock secret retrieval
        mock_secrets.get_secret_value.return_value = {
            'SecretString': '{"username": "testuser", "password": "newpass"}'
        }
        
        # Mock database connection with query that raises exception
        mock_conn = unittest.mock.Mock()
        mock_cursor = unittest.mock.Mock()
        mock_cursor.execute.side_effect = Exception('Query failed')
        mock_context_manager = unittest.mock.MagicMock()
        mock_context_manager.__enter__.return_value = mock_cursor
        mock_context_manager.__exit__.return_value = None
        mock_conn.cursor.return_value = mock_context_manager
        mock_psycopg2.connect.return_value = mock_conn
        
        with self.assertRaises(Exception) as context:
            rotation_handler.test_secret(self.secret_arn, self.token)
        
        self.assertIn('Query failed', str(context.exception))

    @patch('lib.lambda.rotation_handler.secrets_client')
    @patch('lib.lambda.rotation_handler.psycopg2')
    def test_set_secret_cursor_error(self, mock_psycopg2, mock_secrets):
        """Test set_secret handles cursor execution errors."""
        import importlib
        rotation_handler = importlib.import_module('lib.lambda.rotation_handler')
        
        # Mock secret retrieval
        mock_secrets.get_secret_value.side_effect = [
            {'SecretString': '{"username": "testuser", "password": "newpass"}'},
            {'SecretString': '{"username": "testuser", "password": "oldpass"}'}
        ]
        
        # Mock database connection with cursor error
        mock_conn = unittest.mock.Mock()
        mock_cursor = unittest.mock.Mock()
        mock_cursor.execute.side_effect = Exception('Cursor error')
        mock_context_manager = unittest.mock.MagicMock()
        mock_context_manager.__enter__.return_value = mock_cursor
        mock_context_manager.__exit__.return_value = None
        mock_conn.cursor.return_value = mock_context_manager
        mock_psycopg2.connect.return_value = mock_conn
        
        with self.assertRaises(Exception) as context:
            rotation_handler.set_secret(self.secret_arn, self.token)
        
        self.assertIn('Cursor error', str(context.exception))


if __name__ == '__main__':
    unittest.main()
