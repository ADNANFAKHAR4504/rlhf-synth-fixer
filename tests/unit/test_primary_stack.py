"""Unit tests for PrimaryStack."""
import pytest
import json
from cdktf import Testing
from lib.stacks.primary_stack import PrimaryStack


class TestPrimaryStack:
    """Test suite for PrimaryStack infrastructure."""

    @pytest.fixture
    def stack(self):
        """Create a PrimaryStack instance for testing."""
        app = Testing.app()
        return PrimaryStack(
            app,
            "test-primary",
            region="us-east-1",
            environment_suffix="test"
        )

    @pytest.fixture
    def synthesized(self, stack):
        """Synthesize the stack and return JSON."""
        return Testing.synth(stack)

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert stack.region == "us-east-1"
        assert stack.environment_suffix == "test"

    def test_kms_key_created(self, synthesized):
        """Test that KMS key is created with rotation enabled."""
        resources = json.loads(synthesized)
        kms_keys = [
            r for r in resources.get("resource", {}).get("aws_kms_key", {}).values()
        ]
        assert len(kms_keys) > 0
        kms_key = kms_keys[0]
        assert kms_key["enable_key_rotation"] is True
        assert "healthcare-dr-kms-test" in kms_key["tags"]["Name"]

    def test_kms_alias_created(self, synthesized):
        """Test that KMS alias is created."""
        resources = json.loads(synthesized)
        kms_aliases = [
            r for r in resources.get("resource", {}).get("aws_kms_alias", {}).values()
        ]
        assert len(kms_aliases) > 0
        alias = kms_aliases[0]
        assert alias["name"] == "alias/healthcare-dr-test"

    def test_vpc_created(self, synthesized):
        """Test that VPC is created with correct configuration."""
        resources = json.loads(synthesized)
        vpcs = [
            r for r in resources.get("resource", {}).get("aws_vpc", {}).values()
        ]
        assert len(vpcs) > 0
        vpc = vpcs[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True
        assert "healthcare-dr-vpc-test" in vpc["tags"]["Name"]

    def test_subnets_created(self, synthesized):
        """Test that subnets are created across availability zones."""
        resources = json.loads(synthesized)
        subnets = [
            r for r in resources.get("resource", {}).get("aws_subnet", {}).values()
        ]
        assert len(subnets) == 3  # a, b, c

        # Check CIDR blocks
        cidr_blocks = sorted([s["cidr_block"] for s in subnets])
        assert cidr_blocks == ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]

        # Check all subnets are public
        for subnet in subnets:
            assert subnet["map_public_ip_on_launch"] is True

    def test_internet_gateway_created(self, synthesized):
        """Test that Internet Gateway is created."""
        resources = json.loads(synthesized)
        igws = [
            r for r in resources.get("resource", {}).get("aws_internet_gateway", {}).values()
        ]
        assert len(igws) > 0
        igw = igws[0]
        assert "healthcare-dr-igw-test" in igw["tags"]["Name"]

    def test_route_table_created(self, synthesized):
        """Test that route table is created."""
        resources = json.loads(synthesized)
        route_tables = [
            r for r in resources.get("resource", {}).get("aws_route_table", {}).values()
        ]
        assert len(route_tables) > 0
        rt = route_tables[0]
        assert "healthcare-dr-rt-test" in rt["tags"]["Name"]

    def test_internet_route_created(self, synthesized):
        """Test that internet route is created."""
        resources = json.loads(synthesized)
        routes = [
            r for r in resources.get("resource", {}).get("aws_route", {}).values()
        ]
        assert len(routes) > 0
        route = routes[0]
        assert route["destination_cidr_block"] == "0.0.0.0/0"

    def test_route_table_associations(self, synthesized):
        """Test that route table associations are created for all subnets."""
        resources = json.loads(synthesized)
        associations = [
            r for r in resources.get("resource", {}).get("aws_route_table_association", {}).values()
        ]
        assert len(associations) == 3  # One for each subnet

    def test_security_group_created(self, synthesized):
        """Test that security group is created with correct rules."""
        resources = json.loads(synthesized)
        security_groups = [
            r for r in resources.get("resource", {}).get("aws_security_group", {}).values()
        ]
        assert len(security_groups) > 0
        sg = security_groups[0]
        assert sg["name"] == "healthcare-dr-lambda-sg-test"
        assert sg["description"] == "Security group for Lambda functions"

        # Check egress rule
        assert len(sg["egress"]) == 1
        egress = sg["egress"][0]
        assert egress["from_port"] == 0
        assert egress["to_port"] == 0
        assert egress["protocol"] == "-1"
        assert egress["cidr_blocks"] == ["0.0.0.0/0"]

        # Check ingress rule
        assert len(sg["ingress"]) == 1
        ingress = sg["ingress"][0]
        assert ingress["from_port"] == 443
        assert ingress["to_port"] == 443
        assert ingress["protocol"] == "tcp"

    def test_s3_bucket_created(self, synthesized):
        """Test that S3 bucket is created with correct configuration."""
        resources = json.loads(synthesized)
        buckets = [
            r for r in resources.get("resource", {}).get("aws_s3_bucket", {}).values()
        ]
        assert len(buckets) > 0
        bucket = buckets[0]
        assert bucket["bucket"] == "healthcare-medical-docs-primary-test"
        assert bucket["force_destroy"] is True

    def test_s3_versioning_enabled(self, synthesized):
        """Test that S3 versioning is enabled."""
        resources = json.loads(synthesized)
        versioning = [
            r for r in resources.get("resource", {}).get("aws_s3_bucket_versioning", {}).values()
        ]
        assert len(versioning) > 0
        config = versioning[0]
        assert config["versioning_configuration"]["status"] == "Enabled"

    def test_s3_encryption_configured(self, synthesized):
        """Test that S3 encryption is configured with KMS."""
        resources = json.loads(synthesized)
        encryption = [
            r for r in resources.get("resource", {}).get("aws_s3_bucket_server_side_encryption_configuration", {}).values()
        ]
        assert len(encryption) > 0
        config = encryption[0]
        rule = config["rule"][0]
        assert rule["apply_server_side_encryption_by_default"]["sse_algorithm"] == "aws:kms"

    def test_lambda_role_created(self, synthesized):
        """Test that Lambda IAM role is created with correct assume role policy."""
        resources = json.loads(synthesized)
        roles = [
            r for r in resources.get("resource", {}).get("aws_iam_role", {}).values()
        ]
        assert len(roles) > 0
        role = roles[0]
        assert role["name"] == "healthcare-dr-lambda-role-primary-test"

        # Check assume role policy
        policy = json.loads(role["assume_role_policy"])
        assert policy["Version"] == "2012-10-17"
        assert len(policy["Statement"]) == 1
        statement = policy["Statement"][0]
        assert statement["Effect"] == "Allow"
        assert statement["Principal"]["Service"] == "lambda.amazonaws.com"
        assert statement["Action"] == "sts:AssumeRole"

    def test_lambda_policy_created(self, synthesized):
        """Test that Lambda IAM policy is created with correct permissions."""
        resources = json.loads(synthesized)
        policies = [
            r for r in resources.get("resource", {}).get("aws_iam_policy", {}).values()
        ]
        assert len(policies) > 0
        policy_resource = policies[0]
        assert policy_resource["name"] == "healthcare-dr-lambda-policy-primary-test"

        # Check policy document
        policy = json.loads(policy_resource["policy"])
        assert policy["Version"] == "2012-10-17"
        statements = policy["Statement"]

        # Check DynamoDB permissions
        dynamodb_stmt = next(s for s in statements if "dynamodb:GetItem" in s["Action"])
        assert "dynamodb:PutItem" in dynamodb_stmt["Action"]
        assert "dynamodb:Query" in dynamodb_stmt["Action"]

        # Check S3 permissions
        s3_stmt = next(s for s in statements if "s3:GetObject" in s["Action"])
        assert "s3:PutObject" in s3_stmt["Action"]

        # Check KMS permissions
        kms_stmt = next(s for s in statements if "kms:Decrypt" in s["Action"])
        assert "kms:Encrypt" in kms_stmt["Action"]
        assert "kms:GenerateDataKey" in kms_stmt["Action"]

        # Check CloudWatch Logs permissions
        logs_stmt = next(s for s in statements if "logs:CreateLogGroup" in s["Action"])
        assert "logs:CreateLogStream" in logs_stmt["Action"]
        assert "logs:PutLogEvents" in logs_stmt["Action"]

    def test_lambda_policy_attachments(self, synthesized):
        """Test that Lambda policies are attached to role."""
        resources = json.loads(synthesized)
        attachments = [
            r for r in resources.get("resource", {}).get("aws_iam_role_policy_attachment", {}).values()
        ]
        assert len(attachments) >= 2  # Custom policy + AWSLambdaBasicExecutionRole

        # Check for basic execution role
        basic_exec = next(a for a in attachments if "AWSLambdaBasicExecutionRole" in a["policy_arn"])
        assert basic_exec is not None

    def test_lambda_function_created(self, synthesized):
        """Test that Lambda function is created with correct configuration."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        assert function["function_name"] == "healthcare-dr-api-primary-test"
        assert function["handler"] == "api_handler.handler"
        assert function["runtime"] == "python3.11"
        assert function["memory_size"] == 3072  # 3GB
        assert function["timeout"] == 30

    def test_lambda_no_vpc_config(self, synthesized):
        """Test that Lambda function does not have VPC configuration."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        assert "vpc_config" not in function or function.get("vpc_config") is None

    def test_lambda_environment_variables(self, synthesized):
        """Test that Lambda environment variables are set correctly."""
        resources = json.loads(synthesized)
        functions = [
            r for r in resources.get("resource", {}).get("aws_lambda_function", {}).values()
        ]
        assert len(functions) > 0
        function = functions[0]
        env_vars = function["environment"]["variables"]
        assert env_vars["ENVIRONMENT"] == "production"
        assert env_vars["STAGE"] == "primary"
        # Ensure AWS_REGION is NOT set
        assert "AWS_REGION" not in env_vars

    def test_sns_topic_created(self, synthesized):
        """Test that SNS topic is created."""
        resources = json.loads(synthesized)
        topics = [
            r for r in resources.get("resource", {}).get("aws_sns_topic", {}).values()
        ]
        assert len(topics) > 0
        topic = topics[0]
        assert topic["name"] == "healthcare-dr-failover-primary-test"

    def test_cloudwatch_dashboard_created(self, synthesized):
        """Test that CloudWatch dashboard is created."""
        resources = json.loads(synthesized)
        dashboards = [
            r for r in resources.get("resource", {}).get("aws_cloudwatch_dashboard", {}).values()
        ]
        assert len(dashboards) > 0
        dashboard = dashboards[0]
        assert dashboard["dashboard_name"] == "healthcare-dr-primary-test"

        # Check dashboard body
        body = json.loads(dashboard["dashboard_body"])
        assert "widgets" in body
        assert len(body["widgets"]) >= 2

    def test_cloudwatch_alarm_created(self, synthesized):
        """Test that CloudWatch alarm is created."""
        resources = json.loads(synthesized)
        alarms = [
            r for r in resources.get("resource", {}).get("aws_cloudwatch_metric_alarm", {}).values()
        ]
        assert len(alarms) > 0
        alarm = alarms[0]
        assert alarm["alarm_name"] == "healthcare-dr-lambda-errors-primary-test"
        assert alarm["comparison_operator"] == "GreaterThanThreshold"
        assert alarm["evaluation_periods"] == 2
        assert alarm["metric_name"] == "Errors"
        assert alarm["namespace"] == "AWS/Lambda"
        assert alarm["threshold"] == 5

    def test_common_tags_applied(self, synthesized):
        """Test that common tags are applied to resources."""
        resources = json.loads(synthesized)

        # Check VPC tags
        vpcs = [r for r in resources.get("resource", {}).get("aws_vpc", {}).values()]
        vpc = vpcs[0]
        assert vpc["tags"]["Environment"] == "Production"
        assert vpc["tags"]["DisasterRecovery"] == "Enabled"
        assert vpc["tags"]["Region"] == "Primary"
        assert vpc["tags"]["ManagedBy"] == "CDKTF"

    def test_outputs_exist(self, synthesized):
        """Test that stack outputs are defined."""
        resources = json.loads(synthesized)
        outputs = resources.get("output", {})

        assert "medical_docs_bucket_arn" in outputs
        assert "kms_key_arn" in outputs
        assert "api_endpoint" in outputs

    def test_aws_provider_configured(self, synthesized):
        """Test that AWS provider is configured correctly."""
        resources = json.loads(synthesized)
        providers = resources.get("provider", {}).get("aws", [])
        assert len(providers) > 0
        provider = providers[0]
        assert provider["region"] == "us-east-1"
