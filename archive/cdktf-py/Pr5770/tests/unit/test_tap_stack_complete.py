"""Comprehensive unit tests for TAP Stack - RDS Migration Infrastructure."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackInstantiation:
    """Test suite for Stack Instantiation."""

    def test_tap_stack_instantiates_with_all_props(self):
        """TapStack instantiates successfully with all configuration properties."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackComplete",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="ap-southeast-1",
            default_tags={"tags": {"Environment": "test", "Project": "RDS-Migration"}}
        )

        assert stack is not None

    def test_tap_stack_instantiates_with_minimal_props(self):
        """TapStack instantiates successfully with minimal properties."""
        app = App()
        stack = TapStack(app, "TestTapStackMinimal")

        assert stack is not None


class TestVPCResources:
    """Test suite for VPC resources."""

    def test_vpc_creation(self):
        """VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(
            app,
            "TestVPC",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify VPC exists
        assert "aws_vpc" in resources
        vpcs = resources["aws_vpc"]
        assert len(vpcs) > 0

        # Verify VPC configuration
        vpc = list(vpcs.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True
        assert "test" in vpc["tags"]["Name"]

    def test_private_subnets_creation(self):
        """Private subnets are created across 2 AZs."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnets",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify subnets exist
        assert "aws_subnet" in resources
        subnets = resources["aws_subnet"]

        # Should have at least 3 subnets (2 private for RDS + 1 app)
        assert len(subnets) >= 3

        # Verify private subnets
        private_subnets = [s for s in subnets.values() if "private" in s["tags"].get("Name", "").lower()]
        assert len(private_subnets) >= 2

        # Verify no public IP assignment
        for subnet in private_subnets:
            assert subnet["map_public_ip_on_launch"] is False

    def test_vpc_endpoints_creation(self):
        """VPC endpoints are created for AWS services."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCEndpoints",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify VPC endpoints exist
        assert "aws_vpc_endpoint" in resources
        endpoints = resources["aws_vpc_endpoint"]

        # Should have at least 2 endpoints (Secrets Manager, CloudWatch Logs)
        assert len(endpoints) >= 2

        # Verify endpoint types
        endpoint_services = [e["service_name"] for e in endpoints.values()]
        assert any("secretsmanager" in service for service in endpoint_services)
        assert any("logs" in service for service in endpoint_services)

        # Verify all are Interface type
        for endpoint in endpoints.values():
            assert endpoint["vpc_endpoint_type"] == "Interface"
            assert endpoint["private_dns_enabled"] is True


class TestSecurityGroups:
    """Test suite for Security Groups."""

    def test_rds_security_group_creation(self):
        """RDS security group is created with correct ingress rules."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSSG",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify security groups exist
        assert "aws_security_group" in resources
        security_groups = resources["aws_security_group"]

        # Find RDS security group
        rds_sg = next((sg for sg in security_groups.values() if "rds" in sg["name"]), None)
        assert rds_sg is not None

        # Verify MySQL port ingress from application subnet
        ingress_rules = rds_sg["ingress"]
        mysql_rule = next((rule for rule in ingress_rules if rule["from_port"] == 3306), None)
        assert mysql_rule is not None
        assert mysql_rule["to_port"] == 3306
        assert mysql_rule["protocol"] == "tcp"
        assert "10.0.1.0/24" in mysql_rule["cidr_blocks"]

    def test_lambda_security_group_creation(self):
        """Lambda security group is created with egress rules."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaSG",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify security groups exist
        assert "aws_security_group" in resources
        security_groups = resources["aws_security_group"]

        # Find Lambda security group
        lambda_sg = next((sg for sg in security_groups.values() if "lambda" in sg["name"]), None)
        assert lambda_sg is not None

        # Verify egress allows all outbound
        egress_rules = lambda_sg["egress"]
        assert len(egress_rules) > 0
        all_traffic_rule = next((rule for rule in egress_rules if rule["protocol"] == "-1"), None)
        assert all_traffic_rule is not None


class TestRDSInstance:
    """Test suite for RDS Instance."""

    def test_rds_instance_creation(self):
        """RDS MySQL instance is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestRDS",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify RDS instance exists
        assert "aws_db_instance" in resources
        rds_instances = resources["aws_db_instance"]
        assert len(rds_instances) > 0

        # Verify RDS configuration
        rds = list(rds_instances.values())[0]
        assert rds["engine"] == "mysql"
        assert rds["engine_version"] == "8.0"
        assert "test" in rds["identifier"]
        assert rds["publicly_accessible"] is False
        assert rds["storage_encrypted"] is True
        assert rds["backup_retention_period"] == 7
        assert rds["skip_final_snapshot"] is True
        assert rds["deletion_protection"] is False

    def test_rds_subnet_group_creation(self):
        """RDS subnet group is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSSubnetGroup",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify DB subnet group exists
        assert "aws_db_subnet_group" in resources
        subnet_groups = resources["aws_db_subnet_group"]
        assert len(subnet_groups) > 0

        # Verify subnet group configuration
        subnet_group = list(subnet_groups.values())[0]
        assert "test" in subnet_group["name"]


class TestSecretsManager:
    """Test suite for Secrets Manager."""

    def test_secrets_manager_secret_creation(self):
        """Secrets Manager secret is created for RDS credentials."""
        app = App()
        stack = TapStack(
            app,
            "TestSecrets",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify secret exists
        assert "aws_secretsmanager_secret" in resources
        secrets = resources["aws_secretsmanager_secret"]
        assert len(secrets) > 0

        # Verify secret configuration
        secret = list(secrets.values())[0]
        assert "credentials" in secret["name"]
        assert "test" in secret["name"]

    def test_secrets_manager_secret_version(self):
        """Secrets Manager secret version is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretVersion",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify secret version exists
        assert "aws_secretsmanager_secret_version" in resources
        secret_versions = resources["aws_secretsmanager_secret_version"]
        assert len(secret_versions) > 0

    def test_secrets_manager_rotation(self):
        """Secrets Manager rotation is configured."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretRotation",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify rotation configuration exists
        assert "aws_secretsmanager_secret_rotation" in resources
        rotations = resources["aws_secretsmanager_secret_rotation"]
        assert len(rotations) > 0

        # Verify rotation rules
        rotation = list(rotations.values())[0]
        assert rotation["rotation_rules"]["automatically_after_days"] == 30


class TestLambdaFunction:
    """Test suite for Lambda Function."""

    def test_lambda_function_creation(self):
        """Lambda validation function is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify Lambda function exists
        assert "aws_lambda_function" in resources
        lambdas = resources["aws_lambda_function"]
        assert len(lambdas) > 0

        # Verify Lambda configuration
        lambda_func = list(lambdas.values())[0]
        assert "validation" in lambda_func["function_name"]
        assert lambda_func["runtime"] == "python3.11"
        assert lambda_func["handler"] == "validation_handler.lambda_handler"
        assert lambda_func["timeout"] == 300
        assert lambda_func["memory_size"] == 256

        # Verify environment variables
        env_vars = lambda_func["environment"]["variables"]
        assert "DB_SECRET_ARN" in env_vars
        assert "DB_ENDPOINT" in env_vars
        assert env_vars["ENVIRONMENT"] == "production"

        # Verify VPC configuration
        assert "vpc_config" in lambda_func
        vpc_config = lambda_func["vpc_config"]
        assert "subnet_ids" in vpc_config
        assert "security_group_ids" in vpc_config

    def test_lambda_iam_role_creation(self):
        """Lambda IAM role is created with correct permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaRole",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify IAM role exists
        assert "aws_iam_role" in resources
        roles = resources["aws_iam_role"]

        # Find Lambda role
        lambda_role = next((role for role in roles.values() if "validation" in role["name"]), None)
        assert lambda_role is not None

        # Verify assume role policy
        assume_policy = json.loads(lambda_role["assume_role_policy"])
        assert assume_policy["Statement"][0]["Principal"]["Service"] == "lambda.amazonaws.com"

    def test_lambda_iam_policies_attached(self):
        """Lambda IAM policies are attached correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaPolicies",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify policy attachments exist
        assert "aws_iam_role_policy_attachment" in resources
        policy_attachments = resources["aws_iam_role_policy_attachment"]

        # Should have at least 3 policies attached (Basic Execution, VPC Access, Custom)
        assert len(policy_attachments) >= 3

        # Verify specific policies
        policy_arns = [p["policy_arn"] for p in policy_attachments.values()]
        assert any("AWSLambdaBasicExecutionRole" in arn for arn in policy_arns)
        assert any("AWSLambdaVPCAccessExecutionRole" in arn for arn in policy_arns)

    def test_lambda_custom_policy_creation(self):
        """Lambda custom policy is created for RDS and Secrets Manager access."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaCustomPolicy",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify custom policy exists
        assert "aws_iam_policy" in resources
        policies = resources["aws_iam_policy"]
        assert len(policies) > 0

        # Verify policy content
        policy = list(policies.values())[0]
        policy_doc = json.loads(policy["policy"])
        statements = policy_doc["Statement"]

        # Verify Secrets Manager permissions
        secrets_statement = next((s for s in statements if "secretsmanager:GetSecretValue" in s["Action"]), None)
        assert secrets_statement is not None

        # Verify RDS permissions
        rds_statement = next((s for s in statements if "rds:DescribeDBInstances" in s["Action"]), None)
        assert rds_statement is not None


class TestEventBridge:
    """Test suite for EventBridge."""

    def test_eventbridge_rule_creation(self):
        """EventBridge rule is created for RDS state changes."""
        app = App()
        stack = TapStack(
            app,
            "TestEventBridge",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify EventBridge rule exists
        assert "aws_cloudwatch_event_rule" in resources
        rules = resources["aws_cloudwatch_event_rule"]
        assert len(rules) > 0

        # Verify rule configuration
        rule = list(rules.values())[0]
        assert "rds" in rule["name"]

        # Verify event pattern
        event_pattern = json.loads(rule["event_pattern"])
        assert event_pattern["source"] == ["aws.rds"]
        assert event_pattern["detail-type"] == ["RDS DB Instance Event"]

    def test_eventbridge_target_creation(self):
        """EventBridge target is created for Lambda function."""
        app = App()
        stack = TapStack(
            app,
            "TestEventBridgeTarget",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify EventBridge target exists
        assert "aws_cloudwatch_event_target" in resources
        targets = resources["aws_cloudwatch_event_target"]
        assert len(targets) > 0

    def test_lambda_permission_for_eventbridge(self):
        """Lambda permission is granted for EventBridge invocation."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaPermission",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify Lambda permission exists
        assert "aws_lambda_permission" in resources
        permissions = resources["aws_lambda_permission"]
        assert len(permissions) > 0

        # Verify permission configuration
        permission = list(permissions.values())[0]
        assert permission["action"] == "lambda:InvokeFunction"
        assert permission["principal"] == "events.amazonaws.com"


class TestStackOutputs:
    """Test suite for Stack Outputs."""

    def test_stack_outputs_defined(self):
        """All required stack outputs are defined."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputs",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        outputs = json.loads(synth)["output"]

        # Verify all required outputs exist
        required_outputs = [
            "vpc_id",
            "rds_endpoint",
            "rds_instance_id",
            "db_secret_arn",
            "validation_lambda_arn",
            "private_subnet_ids"
        ]

        for output_name in required_outputs:
            assert output_name in outputs
            assert outputs[output_name]["value"] is not None


class TestResourceTags:
    """Test suite for Resource Tagging."""

    def test_resources_have_environment_suffix_in_names(self):
        """All resources include environment suffix in their names."""
        app = App()
        stack = TapStack(
            app,
            "TestResourceNaming",
            environment_suffix="prod",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check VPC
        if "aws_vpc" in resources:
            for vpc in resources["aws_vpc"].values():
                assert "prod" in vpc["tags"]["Name"]

        # Check RDS
        if "aws_db_instance" in resources:
            for rds in resources["aws_db_instance"].values():
                assert "prod" in rds["identifier"]

        # Check Lambda
        if "aws_lambda_function" in resources:
            for lambda_func in resources["aws_lambda_function"].values():
                assert "prod" in lambda_func["function_name"]

    def test_resources_have_required_tags(self):
        """All resources have required tags (Environment, MigrationDate)."""
        app = App()
        stack = TapStack(
            app,
            "TestResourceTags",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check VPC tags
        if "aws_vpc" in resources:
            for vpc in resources["aws_vpc"].values():
                assert "Environment" in vpc["tags"]
                assert "MigrationDate" in vpc["tags"]
                assert vpc["tags"]["Environment"] == "production"

        # Check RDS tags
        if "aws_db_instance" in resources:
            for rds in resources["aws_db_instance"].values():
                assert "Environment" in rds["tags"]
                assert "MigrationDate" in rds["tags"]


class TestBackendConfiguration:
    """Test suite for Backend Configuration."""

    def test_s3_backend_configured(self):
        """S3 backend is configured for state management."""
        app = App()
        stack = TapStack(
            app,
            "TestBackend",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        backend = json.loads(synth)["terraform"]["backend"]["s3"]

        assert backend["bucket"] == "test-state-bucket"
        assert backend["region"] == "us-east-1"
        assert "test" in backend["key"]
        assert backend["encrypt"] is True

    def test_no_backend_when_bucket_empty(self):
        """No S3 backend is configured when bucket is empty."""
        app = App()
        stack = TapStack(
            app,
            "TestNoBackend",
            environment_suffix="test",
            state_bucket="",
            aws_region="ap-southeast-1"
        )
        synth = Testing.synth(stack)
        terraform_config = json.loads(synth)["terraform"]

        # Backend should not be configured
        assert "backend" not in terraform_config or terraform_config["backend"] == {}
