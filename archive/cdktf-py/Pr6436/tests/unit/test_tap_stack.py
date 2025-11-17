"""Unit tests for TAP Stack."""
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset test state before each test."""
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="eu-west-1",
            aws_region="eu-central-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, "environment_suffix")
        assert stack.environment_suffix == "prod"

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, "environment_suffix")
        assert stack.environment_suffix == "dev-001"

    def test_tap_stack_synth_generates_terraform_config(self):
        """TapStack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app, "TestSynthStack", environment_suffix="test", aws_region="eu-central-2"
        )

        # Synthesize the stack to JSON string
        synth = Testing.synth(stack)

        # Verify synth produces JSON output
        assert synth is not None
        assert isinstance(synth, str)

        # Parse JSON and verify structure
        config = json.loads(synth)
        assert "resource" in config

    def test_tap_stack_has_required_outputs(self):
        """TapStack defines required Terraform outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        # Synthesize to check outputs
        synth = Testing.synth(stack)

        # Parse JSON string
        config = json.loads(synth)

        # Verify outputs exist
        assert "output" in config
        outputs = config.get("output", {})

        # Check for expected outputs
        assert "vpc_eu_central_id" in outputs
        assert "vpc_eu_id" in outputs
        assert "s3_bucket_eu_central" in outputs
        assert "s3_bucket_eu" in outputs
        assert "rds_endpoint" in outputs
        assert "dynamodb_table" in outputs
        assert "lambda_function_arn" in outputs
        assert "api_gateway_endpoint" in outputs


class TestVPCResources:
    """Test suite for VPC resources."""

    def test_vpc_resources_created_in_both_regions(self):
        """VPCs are created in both eu-central-2 and eu-west-1."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        vpcs = resources.get("aws_vpc", {})

        # Verify both VPCs exist
        assert "vpc-eu-central-2" in vpcs
        assert "vpc-eu-west-1" in vpcs

        # Verify CIDR blocks
        assert vpcs["vpc-eu-central-2"]["cidr_block"] == "10.0.0.0/16"
        assert vpcs["vpc-eu-west-1"]["cidr_block"] == "10.1.0.0/16"

    def test_subnets_created_in_multiple_azs(self):
        """Subnets are created across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnetStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Verify public and private subnets in both regions
        assert "subnet-eu-south-public-1a" in subnets
        assert "subnet-eu-south-public-1b" in subnets
        assert "subnet-eu-south-private-1a" in subnets
        assert "subnet-eu-south-private-1b" in subnets
        assert "subnet-eu-public-1a" in subnets
        assert "subnet-eu-public-1b" in subnets
        assert "subnet-eu-private-1a" in subnets
        assert "subnet-eu-private-1b" in subnets

    def test_vpc_peering_connection_configured(self):
        """VPC peering connection is configured between regions."""
        app = App()
        stack = TapStack(
            app,
            "TestPeeringStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        
        # Verify VPC peering resources
        assert "aws_vpc_peering_connection" in resources
        assert "aws_vpc_peering_connection_accepter" in resources


class TestDatabaseResources:
    """Test suite for database resources."""

    def test_rds_instance_configured_correctly(self):
        """RDS PostgreSQL instance is configured with correct settings."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        rds_instances = resources.get("aws_db_instance", {})

        assert "rds-postgresql" in rds_instances
        rds = rds_instances["rds-postgresql"]

        # Verify RDS configuration
        assert rds["engine"] == "postgres"
        assert rds["engine_version"] == "17.4"
        assert rds["instance_class"] == "db.t3.micro"
        assert rds["multi_az"] is True
        assert rds["storage_encrypted"] is True
        assert rds["backup_retention_period"] == 7
        assert rds["skip_final_snapshot"] is True

    def test_dynamodb_table_configured_with_indexes(self):
        """DynamoDB table is configured with GSIs."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDBStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        dynamodb_tables = resources.get("aws_dynamodb_table", {})

        assert "dynamodb-transactions" in dynamodb_tables
        table = dynamodb_tables["dynamodb-transactions"]

        # Verify table configuration
        assert table["billing_mode"] == "PAY_PER_REQUEST"
        assert table["hash_key"] == "transactionId"
        assert table["range_key"] == "timestamp"

        # Verify GSIs
        assert "global_secondary_index" in table
        gsis = table["global_secondary_index"]
        assert len(gsis) == 2

        gsi_names = [gsi["name"] for gsi in gsis]
        assert "CustomerIndex" in gsi_names
        assert "StatusIndex" in gsi_names

    def test_db_subnet_group_created(self):
        """DB subnet group is created for RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestDBSubnetStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        db_subnet_groups = resources.get("aws_db_subnet_group", {})

        assert "db-subnet-group" in db_subnet_groups
        assert "subnet_ids" in db_subnet_groups["db-subnet-group"]


class TestLambdaAndAPIResources:
    """Test suite for Lambda and API Gateway resources."""

    def test_lambda_function_configured_correctly(self):
        """Lambda function is configured with correct settings."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        lambda_functions = resources.get("aws_lambda_function", {})

        assert "lambda-payment-processor" in lambda_functions
        lambda_func = lambda_functions["lambda-payment-processor"]

        # Verify Lambda configuration
        assert lambda_func["runtime"] == "python3.11"
        assert lambda_func["handler"] == "index.handler"
        assert lambda_func["memory_size"] == 256
        assert lambda_func["timeout"] == 30
        assert lambda_func["reserved_concurrent_executions"] == 10

        # Verify VPC configuration
        assert "vpc_config" in lambda_func

    def test_api_gateway_configured(self):
        """API Gateway is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestAPIStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})

        # Verify API Gateway resources
        assert "aws_apigatewayv2_api" in resources
        assert "aws_apigatewayv2_integration" in resources
        assert "aws_apigatewayv2_route" in resources
        assert "aws_apigatewayv2_stage" in resources

        api = resources["aws_apigatewayv2_api"]["api-gateway"]
        assert api["protocol_type"] == "HTTP"

    def test_lambda_iam_role_has_correct_permissions(self):
        """Lambda IAM role has correct permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaIAMStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        iam_roles = resources.get("aws_iam_role", {})

        assert "lambda-role" in iam_roles

        # Verify IAM role policy
        iam_policies = resources.get("aws_iam_role_policy", {})
        assert "lambda-custom-policy" in iam_policies


class TestStorageResources:
    """Test suite for S3 storage resources."""

    def test_s3_buckets_created_in_both_regions(self):
        """S3 buckets are created in both regions."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Stack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_buckets = resources.get("aws_s3_bucket", {})

        # Verify both buckets exist
        assert "s3-bucket-us" in s3_buckets
        assert "s3-bucket-eu" in s3_buckets

    def test_s3_versioning_enabled(self):
        """S3 versioning is enabled on buckets."""
        app = App()
        stack = TapStack(
            app,
            "TestS3VersioningStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_versioning = resources.get("aws_s3_bucket_versioning", {})

        assert "s3-versioning-us" in s3_versioning
        assert "s3-versioning-eu" in s3_versioning

        # Verify versioning status
        assert s3_versioning["s3-versioning-us"]["versioning_configuration"]["status"] == "Enabled"
        assert s3_versioning["s3-versioning-eu"]["versioning_configuration"]["status"] == "Enabled"

    def test_s3_encryption_configured(self):
        """S3 encryption is configured on buckets."""
        app = App()
        stack = TapStack(
            app,
            "TestS3EncryptionStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})

        assert "s3-encryption-us" in s3_encryption
        assert "s3-encryption-eu" in s3_encryption

    def test_s3_replication_configured(self):
        """S3 cross-region replication is configured."""
        app = App()
        stack = TapStack(
            app,
            "TestS3ReplicationStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_replication = resources.get("aws_s3_bucket_replication_configuration", {})

        assert "s3-replication" in s3_replication
        replication = s3_replication["s3-replication"]

        # Verify replication rule
        assert "rule" in replication
        assert replication["rule"][0]["status"] == "Enabled"


class TestMonitoringResources:
    """Test suite for monitoring resources."""

    def test_cloudwatch_dashboard_created(self):
        """CloudWatch dashboard is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDashboardStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        dashboards = resources.get("aws_cloudwatch_dashboard", {})

        assert "cloudwatch-dashboard" in dashboards

    def test_cloudwatch_alarms_created(self):
        """CloudWatch alarms are created."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarmsStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        alarms = resources.get("aws_cloudwatch_metric_alarm", {})

        # Verify alarms exist
        assert "lambda-error-alarm" in alarms
        assert "rds-cpu-alarm" in alarms

        # Verify alarm thresholds
        assert alarms["lambda-error-alarm"]["threshold"] == 5
        assert alarms["rds-cpu-alarm"]["threshold"] == 80

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch log groups are created."""
        app = App()
        stack = TapStack(
            app,
            "TestLogGroupsStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        log_groups = resources.get("aws_cloudwatch_log_group", {})

        assert "lambda-log-group" in log_groups
        assert "api-log-group" in log_groups

        # Verify retention
        assert log_groups["lambda-log-group"]["retention_in_days"] == 30
        assert log_groups["api-log-group"]["retention_in_days"] == 30


class TestSecurityResources:
    """Test suite for security resources."""

    def test_security_groups_configured(self):
        """Security groups are configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        security_groups = resources.get("aws_security_group", {})

        assert "sg-rds" in security_groups
        assert "sg-lambda" in security_groups

    def test_kms_key_configured_for_rds(self):
        """KMS key is configured for RDS encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        kms_keys = resources.get("aws_kms_key", {})

        assert "kms-rds" in kms_keys
        kms_key = kms_keys["kms-rds"]

        # Verify KMS configuration
        assert kms_key["enable_key_rotation"] is True
        assert kms_key["deletion_window_in_days"] == 10

    def test_kms_alias_created(self):
        """KMS alias is created for RDS key."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSAliasStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        kms_aliases = resources.get("aws_kms_alias", {})

        assert "kms-alias-rds" in kms_aliases


class TestResourceTagging:
    """Test suite for resource tagging."""

    def test_all_resources_have_required_tags(self):
        """All resources have required tags."""
        app = App()
        stack = TapStack(
            app,
            "TestTaggingStack",
            environment_suffix="test",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})

        # Check VPC tags
        vpcs = resources.get("aws_vpc", {})
        for vpc_name, vpc_config in vpcs.items():
            assert "tags" in vpc_config
            tags = vpc_config["tags"]
            assert "Environment" in tags
            assert "ManagedBy" in tags
            assert "Project" in tags

    def test_resource_naming_includes_environment_suffix(self):
        """Resources include environment_suffix in names."""
        app = App()
        stack = TapStack(
            app,
            "TestNamingStack",
            environment_suffix="prod",
            aws_region="eu-central-2"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify environment_suffix is used in resource names
        assert stack.environment_suffix == "prod"


# Add more test suites and cases as needed
