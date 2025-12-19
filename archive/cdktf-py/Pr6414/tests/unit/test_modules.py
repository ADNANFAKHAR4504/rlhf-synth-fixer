"""Unit tests for additional modules."""
import json
import pytest
from cdktf import Testing, TerraformStack
from lib.data_processing import DataProcessingModule
from lib.monitoring import MonitoringModule
from lib.networking import NetworkingModule
from lib.security import SecurityModule


class TestDataProcessingModule:
    """Tests for DataProcessingModule."""

    @pytest.fixture
    def module_stack(self):
        """Create module stack."""
        app = Testing.app()
        stack = TerraformStack(app, "test-data")
        module = DataProcessingModule(
            stack, "data-proc",
            environment_suffix="test",
            vpc_id="vpc-123",
            private_subnet_ids=["subnet-1", "subnet-2"],
            security_group_id="sg-123",
            kms_key_arn="arn:aws:kms:us-east-1:123:key/abc",
            lambda_role_arn="arn:aws:iam::123:role/lambda"
        )
        return json.loads(Testing.synth(stack))

    def test_access_logs_bucket_created(self, module_stack):
        """Test access logs bucket."""
        buckets = module_stack["resource"]["aws_s3_bucket"]
        access_logs = [b for b in buckets.values() if "s3-access-logs" in b.get("bucket", "")]
        assert len(access_logs) == 1

    def test_data_bucket_created(self, module_stack):
        """Test data bucket."""
        buckets = module_stack["resource"]["aws_s3_bucket"]
        data_buckets = [b for b in buckets.values() if "secure-data" in b.get("bucket", "")]
        assert len(data_buckets) == 1

    def test_bucket_versioning_enabled(self, module_stack):
        """Test bucket versioning."""
        versioning = module_stack["resource"]["aws_s3_bucket_versioning"]
        assert len(versioning) >= 2
        for v in versioning.values():
            assert v["versioning_configuration"]["status"] == "Enabled"

    def test_bucket_encryption_configured(self, module_stack):
        """Test KMS encryption."""
        encryption = module_stack["resource"]["aws_s3_bucket_server_side_encryption_configuration"]
        assert len(encryption) >= 2
        for enc in encryption.values():
            rule = enc["rule"][0]
            assert rule["apply_server_side_encryption_by_default"]["sse_algorithm"] == "aws:kms"

    def test_bucket_logging_configured(self, module_stack):
        """Test bucket logging."""
        logging = module_stack["resource"]["aws_s3_bucket_logging"]
        assert len(logging) >= 1

    def test_bucket_policy_created(self, module_stack):
        """Test bucket policy."""
        policies = module_stack["resource"]["aws_s3_bucket_policy"]
        policy_list = list(policies.values())
        assert len(policy_list) >= 1
        policy = json.loads(policy_list[0]["policy"])
        assert len(policy["Statement"]) == 2

    def test_lambda_function_created(self, module_stack):
        """Test Lambda function."""
        lambdas = module_stack["resource"]["aws_lambda_function"]
        func = list(lambdas.values())[0]
        assert func["function_name"] == "data-processor-test"
        assert func["runtime"] == "python3.11"

    def test_lambda_vpc_config(self, module_stack):
        """Test Lambda VPC config."""
        lambdas = module_stack["resource"]["aws_lambda_function"]
        func = list(lambdas.values())[0]
        assert "vpc_config" in func

    def test_lambda_environment_variables(self, module_stack):
        """Test Lambda environment."""
        lambdas = module_stack["resource"]["aws_lambda_function"]
        func = list(lambdas.values())[0]
        vars = func["environment"]["variables"]
        assert "BUCKET_NAME" in vars

    def test_secrets_manager_data_source(self, module_stack):
        """Test Secrets Manager reference."""
        data = module_stack.get("data", {})
        secrets = data["aws_secretsmanager_secret"]
        assert len(secrets) >= 1


class TestMonitoringModule:
    """Tests for MonitoringModule."""

    @pytest.fixture
    def module_stack(self):
        """Create module stack."""
        app = Testing.app()
        stack = TerraformStack(app, "test-monitoring")
        module = MonitoringModule(
            stack, "monitoring",
            environment_suffix="test",
            kms_key_arn="arn:aws:kms:us-east-1:123:key/abc"
        )
        return json.loads(Testing.synth(stack))

    def test_log_group_created(self, module_stack):
        """Test CloudWatch log group."""
        logs = module_stack["resource"]["aws_cloudwatch_log_group"]
        log_list = list(logs.values())
        assert len(log_list) >= 1
        assert log_list[0]["retention_in_days"] == 90

    def test_metric_filters_created(self, module_stack):
        """Test metric filters."""
        filters = module_stack["resource"]["aws_cloudwatch_log_metric_filter"]
        assert len(filters) >= 3

    def test_unauthorized_api_filter(self, module_stack):
        """Test unauthorized API filter."""
        filters = module_stack["resource"]["aws_cloudwatch_log_metric_filter"]
        unauth_filters = [f for f in filters.values() if "unauthorized-api" in f.get("name", "")]
        assert len(unauth_filters) >= 1

    def test_root_usage_filter(self, module_stack):
        """Test root usage filter."""
        filters = module_stack["resource"]["aws_cloudwatch_log_metric_filter"]
        root_filters = [f for f in filters.values() if "root-account" in f.get("name", "")]
        assert len(root_filters) >= 1

    def test_sns_topic_created(self, module_stack):
        """Test SNS topic."""
        topics = module_stack["resource"]["aws_sns_topic"]
        assert len(topics) >= 1

    def test_cloudwatch_alarms_created(self, module_stack):
        """Test CloudWatch alarms."""
        alarms = module_stack["resource"]["aws_cloudwatch_metric_alarm"]
        assert len(alarms) >= 2

    def test_unauthorized_api_alarm(self, module_stack):
        """Test unauthorized API alarm."""
        alarms = module_stack["resource"]["aws_cloudwatch_metric_alarm"]
        unauth_alarms = [a for a in alarms.values() if "unauthorized-api" in a.get("alarm_name", "")]
        assert len(unauth_alarms) >= 1

    def test_root_usage_alarm(self, module_stack):
        """Test root usage alarm."""
        alarms = module_stack["resource"]["aws_cloudwatch_metric_alarm"]
        root_alarms = [a for a in alarms.values() if "root-account" in a.get("alarm_name", "")]
        assert len(root_alarms) >= 1

    def test_config_bucket_created(self, module_stack):
        """Test AWS Config bucket."""
        buckets = module_stack["resource"]["aws_s3_bucket"]
        config_buckets = [b for b in buckets.values() if "aws-config" in b.get("bucket", "")]
        assert len(config_buckets) >= 1

    def test_config_role_created(self, module_stack):
        """Test AWS Config role."""
        roles = module_stack["resource"]["aws_iam_role"]
        config_roles = [r for r in roles.values() if "config-role" in r.get("name", "")]
        assert len(config_roles) >= 1

    def test_config_recorder_created(self, module_stack):
        """Test Config recorder."""
        recorders = module_stack["resource"]["aws_config_configuration_recorder"]
        assert len(recorders) >= 1

    def test_config_delivery_channel(self, module_stack):
        """Test Config delivery channel."""
        channels = module_stack["resource"]["aws_config_delivery_channel"]
        assert len(channels) >= 1

    def test_config_rule_created(self, module_stack):
        """Test Config rule."""
        rules = module_stack["resource"]["aws_config_config_rule"]
        assert len(rules) >= 1

    def test_eventbridge_rule_created(self, module_stack):
        """Test EventBridge rule."""
        rules = module_stack["resource"]["aws_cloudwatch_event_rule"]
        assert len(rules) >= 1

    def test_eventbridge_target_created(self, module_stack):
        """Test EventBridge target."""
        targets = module_stack["resource"]["aws_cloudwatch_event_target"]
        assert len(targets) >= 1


class TestNetworkingModule:
    """Tests for NetworkingModule."""

    @pytest.fixture
    def module_stack(self):
        """Create module stack."""
        app = Testing.app()
        stack = TerraformStack(app, "test-network")
        module = NetworkingModule(
            stack, "network",
            environment_suffix="test",
            vpc_cidr="10.0.0.0/16"
        )
        return json.loads(Testing.synth(stack))

    def test_vpc_created(self, module_stack):
        """Test VPC creation."""
        vpcs = module_stack["resource"]["aws_vpc"]
        vpc = list(vpcs.values())[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True

    def test_private_subnets_created(self, module_stack):
        """Test private subnets."""
        subnets = module_stack["resource"]["aws_subnet"]
        assert len(subnets) == 3
        for subnet in subnets.values():
            assert "10.0." in subnet["cidr_block"]

    def test_flow_logs_bucket_created(self, module_stack):
        """Test VPC flow logs bucket."""
        buckets = module_stack["resource"]["aws_s3_bucket"]
        flow_buckets = [b for b in buckets.values() if "vpc-flow-logs" in b.get("bucket", "")]
        assert len(flow_buckets) >= 1

    def test_vpc_flow_log_created(self, module_stack):
        """Test VPC flow log."""
        flow_logs = module_stack["resource"]["aws_flow_log"]
        flow_log = list(flow_logs.values())[0]
        assert flow_log["traffic_type"] == "ALL"

    def test_vpc_tags(self, module_stack):
        """Test VPC tagging."""
        vpc = list(module_stack["resource"]["aws_vpc"].values())[0]
        assert "tags" in vpc

    def test_subnet_tags(self, module_stack):
        """Test subnet tagging."""
        subnets = module_stack["resource"]["aws_subnet"]
        for subnet in subnets.values():
            assert "tags" in subnet


class TestSecurityModule:
    """Tests for SecurityModule."""

    @pytest.fixture
    def module_stack(self):
        """Create module stack."""
        app = Testing.app()
        stack = TerraformStack(app, "test-security")
        module = SecurityModule(
            stack, "security",
            environment_suffix="test",
            vpc_id="vpc-123"
        )
        return json.loads(Testing.synth(stack))

    def test_kms_key_created(self, module_stack):
        """Test KMS key."""
        keys = module_stack["resource"]["aws_kms_key"]
        key = list(keys.values())[0]
        assert key["enable_key_rotation"] is True

    def test_kms_key_policy(self, module_stack):
        """Test KMS key policy."""
        key = list(module_stack["resource"]["aws_kms_key"].values())[0]
        policy = json.loads(key["policy"])
        assert len(policy["Statement"]) == 2

    def test_kms_alias_created(self, module_stack):
        """Test KMS alias."""
        aliases = module_stack["resource"]["aws_kms_alias"]
        alias = list(aliases.values())[0]
        assert "alias/data-key" in alias["name"]

    def test_lambda_security_group_created(self, module_stack):
        """Test Lambda security group."""
        sgs = module_stack["resource"]["aws_security_group"]
        sg = list(sgs.values())[0]
        assert "lambda" in sg["name"]

    def test_lambda_sg_egress_rules(self, module_stack):
        """Test Lambda SG egress."""
        sg = list(module_stack["resource"]["aws_security_group"].values())[0]
        assert "egress" in sg

    def test_lambda_role_created(self, module_stack):
        """Test Lambda IAM role."""
        roles = module_stack["resource"]["aws_iam_role"]
        role_list = [r for r in roles.values() if "lambda" in r.get("name", "")]
        assert len(role_list) >= 1

    def test_lambda_policy_created(self, module_stack):
        """Test Lambda policy."""
        policies = module_stack["resource"]["aws_iam_policy"]
        assert len(policies) >= 1

    def test_lambda_policy_cloudwatch_logs(self, module_stack):
        """Test Lambda CloudWatch logs permissions."""
        policy = list(module_stack["resource"]["aws_iam_policy"].values())[0]
        policy_doc = json.loads(policy["policy"])
        assert len(policy_doc["Statement"]) >= 3

    def test_lambda_policy_vpc_permissions(self, module_stack):
        """Test Lambda VPC permissions."""
        policy = list(module_stack["resource"]["aws_iam_policy"].values())[0]
        policy_doc = json.loads(policy["policy"])
        actions = str(policy_doc)
        assert "ec2:CreateNetworkInterface" in actions

    def test_lambda_policy_region_restriction(self, module_stack):
        """Test Lambda region restriction."""
        policy = list(module_stack["resource"]["aws_iam_policy"].values())[0]
        policy_doc = json.loads(policy["policy"])
        deny_statements = [s for s in policy_doc["Statement"] if s["Effect"] == "Deny"]
        assert len(deny_statements) >= 1

    def test_policy_attachment_created(self, module_stack):
        """Test policy attachment."""
        attachments = module_stack["resource"]["aws_iam_role_policy_attachment"]
        assert len(attachments) >= 1

    def test_caller_identity_data_source(self, module_stack):
        """Test caller identity data source."""
        data = module_stack.get("data", {})
        assert "aws_caller_identity" in data


class TestModuleIntegration:
    """Integration tests for modules."""

    def test_all_modules_instantiate(self):
        """Test all modules can be instantiated together."""
        app = Testing.app()
        stack = TerraformStack(app, "test-integration")
        
        security = SecurityModule(stack, "security", "test", "vpc-123")
        networking = NetworkingModule(stack, "networking", "test", "10.0.0.0/16")
        monitoring = MonitoringModule(stack, "monitoring", "test", security.kms_key.arn)
        data_proc = DataProcessingModule(
            stack, "data-proc", "test",
            networking.vpc.id,
            networking.private_subnet_ids,
            security.lambda_sg.id,
            security.kms_key.arn,
            security.lambda_role.arn
        )
        
        synth = Testing.synth(stack)
        config = json.loads(synth)
        
        assert "resource" in config
        resources = config["resource"]
        assert len(resources) > 20

    def test_module_dependencies(self):
        """Test module dependencies."""
        app = Testing.app()
        stack = TerraformStack(app, "test-deps")
        
        security = SecurityModule(stack, "security", "test", "vpc-123")
        assert security.kms_key is not None
        assert security.lambda_role is not None
        
        networking = NetworkingModule(stack, "networking", "test", "10.0.0.0/16")
        assert networking.vpc is not None
        assert len(networking.private_subnets) == 3

    def test_environment_suffix_propagation(self):
        """Test environment suffix is used correctly."""
        app = Testing.app()
        stack = TerraformStack(app, "test-env")
        
        security = SecurityModule(stack, "security", "prod", "vpc-123")
        config = json.loads(Testing.synth(stack))
        
        kms_key = list(config["resource"]["aws_kms_key"].values())[0]
        assert "prod" in kms_key["tags"]["Name"]
        
        kms_alias = list(config["resource"]["aws_kms_alias"].values())[0]
        assert kms_alias["name"] == "alias/data-key-prod"
