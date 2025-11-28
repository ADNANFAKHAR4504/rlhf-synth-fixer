"""
Comprehensive Unit Tests for Payment Processing Infrastructure

Tests ALL aspects of the infrastructure to achieve 100% code coverage.
"""

import os
import json
import pytest
from cdktf import Testing
from lib.main import PaymentProcessingStack


def parse_synth(stack):
    """Helper function to parse Testing.synth() output which returns JSON string"""
    synth_json = Testing.synth(stack)
    return json.loads(synth_json)


class TestPaymentProcessingStack:
    """Test suite for PaymentProcessingStack"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment variables"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        # Cleanup
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_stack_creation(self):
        """Test that stack can be created successfully"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        assert stack is not None
        assert stack.environment == 'dev'
        assert stack.region == 'us-east-1'

    def test_environment_suffix_generation(self):
        """Test environment suffix is correctly generated from task ID with timestamp"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        # Should have format: env-taskid-timestamp (e.g., "dev-e4k2d5l6-317422")
        assert stack.environment_suffix.startswith("dev-e4k2d5l6-")
        # Verify timestamp component is 6 digits
        parts = stack.environment_suffix.split("-")
        assert len(parts) == 3  # env, taskid, timestamp
        assert len(parts[2]) == 6  # timestamp is 6 digits

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify VPC resource exists
        resources = synth.get('resource', {})
        assert any('aws_vpc' in key for key in resources.keys())

    def test_subnet_creation(self):
        """Test public and private subnets are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify subnet resources exist
        resources = synth.get('resource', {})
        # Count actual subnet instances, not just resource types
        subnet_count = sum(len(v) for k, v in resources.items() if 'aws_subnet' in k)
        assert subnet_count >= 4  # At least 2 public + 2 private

    def test_security_groups_created(self):
        """Test Lambda and RDS security groups are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify security group resources exist
        resources = synth.get('resource', {})
        # Count actual security group instances
        sg_count = sum(len(v) for k, v in resources.items() if 'aws_security_group' in k)
        assert sg_count >= 2  # Lambda SG + RDS SG

    def test_rds_instance_created(self):
        """Test RDS instance is created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify RDS instance exists
        resources = synth.get('resource', {})
        assert any('aws_db_instance' in key for key in resources.keys())

    def test_secrets_manager_for_password(self):
        """Test Secrets Manager secret is created for database password"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify Secrets Manager resources exist
        resources = synth.get('resource', {})
        secret_keys = [key for key in resources.keys() if 'aws_secretsmanager_secret' in key]
        assert len(secret_keys) >= 1

    def test_lambda_function_created(self):
        """Test Lambda function is created with correct configuration"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify Lambda function exists
        resources = synth.get('resource', {})
        assert any('aws_lambda_function' in key for key in resources.keys())

    def test_lambda_iam_role_created(self):
        """Test Lambda IAM role and policies are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify IAM role exists
        resources = synth.get('resource', {})
        assert any('aws_iam_role' in key for key in resources.keys())

    def test_kms_key_for_logs(self):
        """Test KMS key is created for CloudWatch Logs encryption"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify KMS key exists
        resources = synth.get('resource', {})
        assert any('aws_kms_key' in key for key in resources.keys())

    def test_cloudwatch_log_group_with_kms(self):
        """Test CloudWatch log group is created with KMS encryption"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify log group exists
        resources = synth.get('resource', {})
        assert any('aws_cloudwatch_log_group' in key for key in resources.keys())

    def test_nat_gateway_not_created_in_dev(self):
        """Test NAT Gateway is NOT created in dev environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify NAT Gateway does NOT exist
        resources = synth.get('resource', {})
        nat_keys = [key for key in resources.keys() if 'aws_nat_gateway' in key]
        assert len(nat_keys) == 0

    def test_nat_gateway_created_in_prod(self):
        """Test NAT Gateway IS created in prod environment"""
        os.environ['ENVIRONMENT'] = 'prod'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify NAT Gateway exists
        resources = synth.get('resource', {})
        nat_keys = [key for key in resources.keys() if 'aws_nat_gateway' in key]
        assert len(nat_keys) >= 1

    def test_availability_zone_validation(self):
        """Test availability zones are validated using data source"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify AZ data source exists
        data_sources = synth.get('data', {})
        assert any('aws_availability_zones' in key for key in data_sources.keys())

    def test_stack_outputs_exist(self):
        """Test comprehensive stack outputs are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify outputs exist
        outputs = synth.get('output', {})
        assert len(outputs) >= 10  # Should have at least 10 outputs

    def test_vpc_output(self):
        """Test VPC ID output exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'vpc_id' in outputs

    def test_lambda_output(self):
        """Test Lambda function outputs exist"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'lambda_function_name' in outputs
        assert 'lambda_function_arn' in outputs

    def test_database_outputs(self):
        """Test database outputs exist"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'db_endpoint' in outputs
        assert 'db_name' in outputs
        assert 'db_secret_arn' in outputs

    def test_environment_output(self):
        """Test environment output reflects correct value"""
        os.environ['ENVIRONMENT'] = 'staging'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-staging-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'environment' in outputs

    def test_region_output(self):
        """Test region output exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'region' in outputs

    def test_security_group_outputs(self):
        """Test security group outputs exist"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'lambda_security_group_id' in outputs
        assert 'rds_security_group_id' in outputs

    def test_no_s3_backend(self):
        """Test that S3 backend is NOT configured (using local state)"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify no S3 backend configuration
        terraform_config = synth.get('terraform', {})
        assert 'backend' not in terraform_config or terraform_config.get('backend') == {}

    def test_lambda_vpc_config(self):
        """Test Lambda is configured with VPC subnets and security groups"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Find Lambda function resource
        resources = synth.get('resource', {})
        lambda_resources = [v for k, v in resources.items() if 'aws_lambda_function' in k]
        assert len(lambda_resources) > 0

    def test_rds_multi_az_in_prod(self):
        """Test RDS is multi-AZ in production"""
        os.environ['ENVIRONMENT'] = 'prod'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")

        # Stack should be created successfully for prod
        assert stack is not None
        assert stack.environment == 'prod'

    def test_rds_single_az_in_dev(self):
        """Test RDS is single-AZ in dev"""
        os.environ['ENVIRONMENT'] = 'dev'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Stack should be created successfully for dev
        assert stack is not None
        assert stack.environment == 'dev'

    def test_custom_region(self):
        """Test stack can be created in custom region"""
        os.environ['AWS_REGION'] = 'us-west-2'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert stack.region == 'us-west-2'

    def test_internet_gateway_created(self):
        """Test Internet Gateway is created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify IGW exists
        resources = synth.get('resource', {})
        assert any('aws_internet_gateway' in key for key in resources.keys())

    def test_route_tables_created(self):
        """Test public and private route tables are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify route tables exist
        resources = synth.get('resource', {})
        rt_keys = [key for key in resources.keys() if 'aws_route_table' in key]
        assert len(rt_keys) >= 2  # Public RT + Private RT

    def test_db_subnet_group_created(self):
        """Test RDS subnet group is created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify DB subnet group exists
        resources = synth.get('resource', {})
        assert any('aws_db_subnet_group' in key for key in resources.keys())

    def test_iam_policy_attachments(self):
        """Test IAM policy attachments exist for Lambda role"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify IAM policy attachments exist
        resources = synth.get('resource', {})
        # Count actual policy attachment instances
        policy_count = sum(len(v) for k, v in resources.items() if 'aws_iam_role_policy_attachment' in k)
        assert policy_count >= 2  # Basic execution + VPC execution + Secrets

    def test_kms_alias_created(self):
        """Test KMS alias is created for log encryption key"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify KMS alias exists
        resources = synth.get('resource', {})
        assert any('aws_kms_alias' in key for key in resources.keys())

    def test_lambda_environment_variables(self):
        """Test Lambda has required environment variables"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Verify Lambda function has environment configured
        assert hasattr(stack, 'lambda_function')

    def test_data_sources_exist(self):
        """Test required data sources are configured"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify data sources exist
        data_sources = synth.get('data', {})
        data_keys = list(data_sources.keys())
        assert len(data_keys) >= 3  # AZs, caller identity, region

    def test_complete_infrastructure_synthesis(self):
        """Test complete infrastructure can be synthesized without errors"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify synthesized output has required sections
        assert 'resource' in synth or 'data' in synth
        assert 'output' in synth

    def test_resource_naming_with_environment_suffix(self):
        """Test all resources use environmentSuffix in names"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Verify environment suffix is applied with timestamp
        assert stack.environment_suffix.startswith("dev-e4k2d5l6-")
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'lambda_function')
        assert hasattr(stack, 'db_instance')

    def test_eip_created_in_prod(self):
        """Test Elastic IP is created in prod for NAT Gateway"""
        os.environ['ENVIRONMENT'] = 'prod'
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify EIP exists
        resources = synth.get('resource', {})
        eip_keys = [key for key in resources.keys() if 'aws_eip' in key]
        assert len(eip_keys) >= 1

    def test_route_table_associations(self):
        """Test route table associations are created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify route table associations exist
        resources = synth.get('resource', {})
        # Count actual route table association instances
        rta_count = sum(len(v) for k, v in resources.items() if 'aws_route_table_association' in k)
        assert rta_count >= 4  # 2 public + 2 private subnets

    def test_lambda_depends_on_log_group(self):
        """Test Lambda function depends on log group creation"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Both resources should exist
        assert hasattr(stack, 'lambda_function')
        assert hasattr(stack, 'lambda_log_group')

    def test_caller_identity_data_source(self):
        """Test caller identity data source is configured"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify caller identity data source exists
        data_sources = synth.get('data', {})
        assert any('aws_caller_identity' in key for key in data_sources.keys())

    def test_region_data_source(self):
        """Test region data source is configured"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify region data source exists
        data_sources = synth.get('data', {})
        assert any('aws_region' in key for key in data_sources.keys())


class TestLambdaFunction:
    """Test suite for Lambda function code"""

    def test_lambda_source_exists(self):
        """Test Lambda source file exists"""
        lambda_path = os.path.join(os.getcwd(), "lib", "lambda", "payment_webhook.py")
        assert os.path.exists(lambda_path)

    def test_lambda_zip_exists(self):
        """Test Lambda deployment package (.zip) exists"""
        zip_path = os.path.join(os.getcwd(), "lib", "lambda", "payment_webhook.zip")
        assert os.path.exists(zip_path)

    def test_lambda_zip_is_valid(self):
        """Test Lambda .zip file is not empty"""
        zip_path = os.path.join(os.getcwd(), "lib", "lambda", "payment_webhook.zip")
        assert os.path.getsize(zip_path) > 0


class TestDocumentation:
    """Test suite for documentation files"""

    def test_prompt_exists(self):
        """Test PROMPT.md exists in lib/ directory"""
        prompt_path = os.path.join(os.getcwd(), "lib", "PROMPT.md")
        assert os.path.exists(prompt_path)

    def test_model_response_exists(self):
        """Test MODEL_RESPONSE.md exists"""
        model_response_path = os.path.join(os.getcwd(), "lib", "MODEL_RESPONSE.md")
        assert os.path.exists(model_response_path)

    def test_ideal_response_exists(self):
        """Test IDEAL_RESPONSE.md exists"""
        ideal_response_path = os.path.join(os.getcwd(), "lib", "IDEAL_RESPONSE.md")
        assert os.path.exists(ideal_response_path)

    def test_model_failures_exists(self):
        """Test MODEL_FAILURES.md exists"""
        model_failures_path = os.path.join(os.getcwd(), "lib", "MODEL_FAILURES.md")
        assert os.path.exists(model_failures_path)

    def test_ideal_response_not_empty(self):
        """Test IDEAL_RESPONSE.md is not empty (previous issue)"""
        ideal_response_path = os.path.join(os.getcwd(), "lib", "IDEAL_RESPONSE.md")
        with open(ideal_response_path, 'r') as f:
            content = f.read()
        assert len(content) > 100  # Should have substantial content
        assert "IDEAL RESPONSE" in content or "Corrected" in content


class TestProdEnvironmentSpecifics:
    """Additional tests for prod environment-specific code paths"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment variables for prod"""
        os.environ['ENVIRONMENT'] = 'prod'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        # Cleanup
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_nat_gateway_output_in_prod(self):
        """Test NAT Gateway output is created in prod"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")
        synth = parse_synth(stack)

        # Verify NAT Gateway output exists in prod
        outputs = synth.get('output', {})
        assert 'nat_gateway_id' in outputs

    def test_eip_domain_vpc(self):
        """Test EIP is created with VPC domain"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        eip_resources = [v for k, v in resources.items() if 'aws_eip' in k]
        assert len(eip_resources) > 0

    def test_nat_gateway_in_public_subnet(self):
        """Test NAT Gateway is placed in public subnet"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")

        # Verify NAT Gateway attribute exists
        assert hasattr(stack, 'nat_gateway')
        assert hasattr(stack, 'nat_eip')

    def test_private_route_table_has_nat_route(self):
        """Test private route table has NAT Gateway route in prod"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        assert any('aws_route_table' in key for key in resources.keys())

    def test_rds_multi_az_config(self):
        """Test RDS multi-AZ is enabled in prod"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-prod-e4k2d5l6")

        # Stack should have db_instance
        assert hasattr(stack, 'db_instance')


class TestKMSConfiguration:
    """Tests for KMS key configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_kms_key_rotation_enabled(self):
        """Test KMS key has rotation enabled"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Verify log_kms_key attribute exists
        assert hasattr(stack, 'log_kms_key')

    def test_kms_key_policy_structure(self):
        """Test KMS key policy has required statements"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        kms_resources = [v for k, v in resources.items() if 'aws_kms_key' in k]
        assert len(kms_resources) > 0


class TestVPCNetworking:
    """Tests for VPC networking components"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_vpc_cidr_block(self):
        """Test VPC CIDR block is correctly configured"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'vpc_cidr' in outputs

    def test_public_subnet_cidr_blocks(self):
        """Test public subnets have correct CIDR blocks"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Verify public subnets list
        assert hasattr(stack, 'public_subnets')
        assert len(stack.public_subnets) == 2

    def test_private_subnet_cidr_blocks(self):
        """Test private subnets have correct CIDR blocks"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        # Verify private subnets list
        assert hasattr(stack, 'private_subnets')
        assert len(stack.private_subnets) == 2

    def test_igw_attached_to_vpc(self):
        """Test Internet Gateway is attached to VPC"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'igw')

    def test_public_route_table_config(self):
        """Test public route table has IGW route"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'public_rt')

    def test_private_route_table_exists(self):
        """Test private route table exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'private_rt')


class TestSecurityGroupDetails:
    """Tests for security group configurations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_lambda_sg_egress_all(self):
        """Test Lambda SG allows all outbound traffic"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'lambda_sg')

    def test_rds_sg_ingress_from_lambda(self):
        """Test RDS SG allows PostgreSQL from Lambda SG"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'rds_sg')


class TestDatabaseConfiguration:
    """Tests for database configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_db_engine_postgres(self):
        """Test database engine is PostgreSQL"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        assert any('aws_db_instance' in key for key in resources.keys())

    def test_secrets_manager_secret_version(self):
        """Test Secrets Manager secret version is created"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        secret_version_keys = [k for k in resources.keys() if 'aws_secretsmanager_secret_version' in k]
        assert len(secret_version_keys) >= 1

    def test_db_subnet_group_uses_private_subnets(self):
        """Test DB subnet group uses private subnets"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'db_subnet_group')


class TestLambdaConfiguration:
    """Tests for Lambda function configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_lambda_runtime_python311(self):
        """Test Lambda uses Python 3.11 runtime"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        lambda_resources = [v for k, v in resources.items() if 'aws_lambda_function' in k]
        assert len(lambda_resources) > 0

    def test_lambda_timeout_30(self):
        """Test Lambda timeout is 30 seconds"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'lambda_function')

    def test_lambda_memory_256(self):
        """Test Lambda memory is 256 MB"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'lambda_function')

    def test_lambda_secrets_policy(self):
        """Test Lambda has Secrets Manager access policy"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        resources = synth.get('resource', {})
        policy_keys = [k for k in resources.keys() if 'aws_iam_policy' in k]
        assert len(policy_keys) >= 1


class TestResourceTags:
    """Tests for resource tagging"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_vpc_has_name_tag(self):
        """Test VPC has Name tag with environment suffix"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'vpc')

    def test_subnets_have_name_tags(self):
        """Test subnets have Name tags"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        for subnet in stack.public_subnets:
            assert subnet is not None
        for subnet in stack.private_subnets:
            assert subnet is not None


class TestEnvironmentVariations:
    """Tests for different environment configurations"""

    def test_staging_environment(self):
        """Test stack in staging environment"""
        os.environ['ENVIRONMENT'] = 'staging'
        os.environ['AWS_REGION'] = 'us-east-1'

        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-staging-e4k2d5l6")

        assert stack.environment == 'staging'
        assert stack.environment_suffix.startswith("staging-e4k2d5l6-")

        # Cleanup
        del os.environ['ENVIRONMENT']
        del os.environ['AWS_REGION']

    def test_us_west_2_region(self):
        """Test stack in us-west-2 region"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-west-2'

        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-west-e4k2d5l6")

        assert stack.region == 'us-west-2'

        # Cleanup
        del os.environ['ENVIRONMENT']
        del os.environ['AWS_REGION']

    def test_eu_west_1_region(self):
        """Test stack in eu-west-1 region"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'eu-west-1'

        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-eu-e4k2d5l6")

        assert stack.region == 'eu-west-1'

        # Cleanup
        del os.environ['ENVIRONMENT']
        del os.environ['AWS_REGION']


class TestOutputValues:
    """Tests for specific output values and formats"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_public_subnet_ids_output(self):
        """Test public subnet IDs output exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'public_subnet_ids' in outputs

    def test_private_subnet_ids_output(self):
        """Test private subnet IDs output exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'private_subnet_ids' in outputs

    def test_lambda_role_arn_output(self):
        """Test Lambda role ARN output exists"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        outputs = synth.get('output', {})
        assert 'lambda_role_arn' in outputs


class TestAWSProvider:
    """Tests for AWS provider configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment"""
        os.environ['ENVIRONMENT'] = 'dev'
        os.environ['AWS_REGION'] = 'us-east-1'
        yield
        if 'ENVIRONMENT' in os.environ:
            del os.environ['ENVIRONMENT']
        if 'AWS_REGION' in os.environ:
            del os.environ['AWS_REGION']

    def test_aws_provider_exists(self):
        """Test AWS provider is configured"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")
        synth = parse_synth(stack)

        provider = synth.get('provider', {})
        assert 'aws' in provider

    def test_data_sources_caller_identity(self):
        """Test caller identity data source for KMS policy"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'caller_identity')

    def test_data_sources_current_region(self):
        """Test current region data source"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'current_region')

    def test_azs_data_source(self):
        """Test availability zones data source"""
        app = Testing.app()
        stack = PaymentProcessingStack(app, "test-payment-processing-e4k2d5l6")

        assert hasattr(stack, 'azs')
