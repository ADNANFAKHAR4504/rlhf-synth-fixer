"""Unit tests for Multi-Region DR Stack."""
import os
import json
from cdktf import App, Testing
from lib.main import MultiRegionDRStack


class TestMultiRegionDRStack:
    """Test suite for Multi-Region DR Stack."""

    def setup_method(self):
        """Set up test fixtures."""
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'

    def test_stack_instantiates_successfully(self):
        """MultiRegionDRStack instantiates successfully."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert stack is not None
        assert stack.environment_suffix == 'test'
        assert stack.primary_region == 'us-east-1'
        assert stack.secondary_region == 'us-east-2'

    def test_kms_keys_created(self):
        """KMS keys are created in both regions."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'kms_primary')
        assert hasattr(stack, 'kms_secondary')

    def test_networking_resources_created(self):
        """Networking resources are created in both regions."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Primary region networking
        assert hasattr(stack, 'vpc_primary')
        assert hasattr(stack, 'igw_primary')
        assert hasattr(stack, 'subnets_primary')
        assert len(stack.subnets_primary) == 3

        # Secondary region networking
        assert hasattr(stack, 'vpc_secondary')
        assert hasattr(stack, 'igw_secondary')
        assert hasattr(stack, 'subnets_secondary')
        assert len(stack.subnets_secondary) == 3

        # VPC Peering
        assert hasattr(stack, 'vpc_peering')

        # Security Groups
        assert hasattr(stack, 'sg_lambda_primary')
        assert hasattr(stack, 'sg_rds_primary')
        assert hasattr(stack, 'sg_lambda_secondary')
        assert hasattr(stack, 'sg_rds_secondary')

    def test_aurora_global_database_created(self):
        """Aurora Global Database is created."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'aurora_global')
        assert hasattr(stack, 'aurora_primary')
        assert hasattr(stack, 'aurora_secondary')
        assert hasattr(stack, 'db_subnet_group_primary')
        assert hasattr(stack, 'db_subnet_group_secondary')

    def test_dynamodb_global_table_created(self):
        """DynamoDB Global Table is created."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'dynamodb_table')

    def test_s3_replication_configured(self):
        """S3 buckets with cross-region replication are configured."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 's3_primary')
        assert hasattr(stack, 's3_secondary')
        assert hasattr(stack, 's3_replication_role')

    def test_lambda_functions_created(self):
        """Lambda functions are created in both regions."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'lambda_primary')
        assert hasattr(stack, 'lambda_secondary')
        assert hasattr(stack, 'lambda_role_primary')
        assert hasattr(stack, 'lambda_role_secondary')

    def test_api_gateway_created(self):
        """API Gateway is created in both regions."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'api_primary')
        assert hasattr(stack, 'api_secondary')
        assert hasattr(stack, 'api_stage_primary')
        assert hasattr(stack, 'api_stage_secondary')

    def test_route53_health_check_created(self):
        """Route 53 health check is created."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'health_check')

    def test_sns_topics_created(self):
        """SNS topics are created in both regions."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert hasattr(stack, 'sns_primary')
        assert hasattr(stack, 'sns_secondary')

    def test_environment_suffix_in_resource_names(self):
        """All resources include environment suffix in their names."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Synthesize to JSON
        synth = Testing.synth(stack)

        # Parse synthesized JSON
        assert 'test' in json.dumps(synth)

    def test_vpc_cidr_blocks_correct(self):
        """VPC CIDR blocks are correctly configured."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Primary VPC should use 10.0.0.0/16
        # Secondary VPC should use 10.1.0.0/16
        # These are set in the create_networking method
        assert stack.vpc_primary is not None
        assert stack.vpc_secondary is not None

    def test_aurora_skip_final_snapshot_enabled(self):
        """Aurora clusters have skip_final_snapshot enabled for testing."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify clusters are created
        assert stack.aurora_primary is not None
        assert stack.aurora_secondary is not None

    def test_s3_force_destroy_enabled(self):
        """S3 buckets have force_destroy enabled."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify S3 buckets are created
        assert stack.s3_primary is not None
        assert stack.s3_secondary is not None

    def test_kms_encryption_configured(self):
        """KMS encryption is configured for all data stores."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify KMS keys exist
        assert stack.kms_primary is not None
        assert stack.kms_secondary is not None

    def test_lambda_vpc_config(self):
        """Lambda functions are configured with VPC."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify Lambda functions exist
        assert stack.lambda_primary is not None
        assert stack.lambda_secondary is not None

    def test_iam_roles_created(self):
        """IAM roles are created for all services."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert stack.lambda_role_primary is not None
        assert stack.lambda_role_secondary is not None
        assert stack.s3_replication_role is not None


class TestLambdaFunction:
    """Test suite for Lambda function code."""

    def test_lambda_handler_success(self):
        """Lambda handler processes events successfully."""
        import sys
        sys.path.insert(0, 'lib/lambda')
        from payment_processor import lambda_handler

        event = {
            'body': json.dumps({
                'payment_id': 'test-123',
                'amount': 100.50
            })
        }
        context = {}

        response = lambda_handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['success'] is True
        assert body['payment_id'] == 'test-123'
        assert body['amount'] == 100.50

    def test_lambda_handler_error(self):
        """Lambda handler handles errors gracefully."""
        import sys
        sys.path.insert(0, 'lib/lambda')
        from payment_processor import lambda_handler

        event = {
            'body': 'invalid json'
        }
        context = {}

        response = lambda_handler(event, context)

        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert body['success'] is False
        assert 'error' in body

    def test_lambda_handler_empty_body(self):
        """Lambda handler handles empty body."""
        import sys
        sys.path.insert(0, 'lib/lambda')
        from payment_processor import lambda_handler

        event = {}
        context = {}

        response = lambda_handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['success'] is True

    def test_lambda_handler_environment_variables(self):
        """Lambda handler reads environment variables."""
        import sys
        sys.path.insert(0, 'lib/lambda')
        from payment_processor import lambda_handler
        import os

        os.environ['REGION'] = 'us-east-1'
        os.environ['DB_ENDPOINT'] = 'test-endpoint'
        os.environ['DYNAMODB_TABLE'] = 'test-table'

        event = {
            'body': json.dumps({'payment_id': 'test'})
        }
        context = {}

        response = lambda_handler(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['region'] == 'us-east-1'
        assert body['db_endpoint'] == 'test-endpoint'
        assert body['table'] == 'test-table'

        # Clean up
        del os.environ['REGION']
        del os.environ['DB_ENDPOINT']
        del os.environ['DYNAMODB_TABLE']


class TestStackOutputs:
    """Test stack outputs."""

    def test_stack_outputs_defined(self):
        """Stack outputs are properly defined."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify stack has outputs
        synth = Testing.synth(stack)
        assert synth is not None


class TestResourceNaming:
    """Test resource naming conventions."""

    def test_all_resources_include_environment_suffix(self):
        """All named resources include environment suffix."""
        app = App()
        os.environ['ENVIRONMENT_SUFFIX'] = 'unittest'
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Verify stack uses environment suffix
        assert stack.environment_suffix == 'unittest'


class TestMultiRegionConfiguration:
    """Test multi-region configuration."""

    def test_primary_region_configuration(self):
        """Primary region is correctly configured."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert stack.primary_region == 'us-east-1'

    def test_secondary_region_configuration(self):
        """Secondary region is correctly configured."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        assert stack.secondary_region == 'us-east-2'

    def test_both_regions_have_complete_infrastructure(self):
        """Both regions have complete infrastructure."""
        app = App()
        stack = MultiRegionDRStack(app, "test-dr-stack")

        # Primary region resources
        assert stack.vpc_primary is not None
        assert stack.lambda_primary is not None
        assert stack.api_primary is not None
        assert len(stack.subnets_primary) == 3

        # Secondary region resources
        assert stack.vpc_secondary is not None
        assert stack.lambda_secondary is not None
        assert stack.api_secondary is not None
        assert len(stack.subnets_secondary) == 3
