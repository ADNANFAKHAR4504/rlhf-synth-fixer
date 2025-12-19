"""Integration tests for TapStack - Testing CDKTF synthesis and infrastructure correctness."""
import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestStackSynthesis:
    """Test CDKTF stack synthesis and basic infrastructure validation."""

    def test_stack_synthesizes_successfully(self):
        """Verify the stack synthesizes without errors."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            default_tags={"tags": {"Environment": "Production"}}
        )

        synthesized = Testing.synth(stack)

        assert synthesized is not None
        assert len(synthesized) > 0

    def test_synthesized_stack_contains_required_resources(self):
        """Verify synthesized stack contains all required AWS resources."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            default_tags={"tags": {"Environment": "Production"}}
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest.get("resource", {})

        # Verify DynamoDB table exists
        assert "aws_dynamodb_table" in resources
        dynamodb_tables = resources["aws_dynamodb_table"]
        assert "reviews_table" in dynamodb_tables

        # Verify S3 bucket exists
        assert "aws_s3_bucket" in resources
        s3_buckets = resources["aws_s3_bucket"]
        assert "images_bucket" in s3_buckets

        # Verify Lambda function exists
        assert "aws_lambda_function" in resources
        lambda_functions = resources["aws_lambda_function"]
        assert "review_processor" in lambda_functions

        # Verify API Gateway exists
        assert "aws_api_gateway_rest_api" in resources
        api_gateways = resources["aws_api_gateway_rest_api"]
        assert "reviews_api" in api_gateways

        # Verify CloudWatch log groups exist
        assert "aws_cloudwatch_log_group" in resources
        log_groups = resources["aws_cloudwatch_log_group"]
        assert "lambda_log_group" in log_groups


class TestDynamoDBConfiguration:
    """Test DynamoDB table configuration."""

    def test_dynamodb_table_has_correct_name_pattern(self):
        """Verify DynamoDB table name includes environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="dev123",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        dynamodb_table = manifest["resource"]["aws_dynamodb_table"]["reviews_table"]
        assert dynamodb_table["name"] == "product-reviews-dev123"

    def test_dynamodb_table_has_correct_key_schema(self):
        """Verify DynamoDB table has correct partition and sort keys."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        dynamodb_table = manifest["resource"]["aws_dynamodb_table"]["reviews_table"]

        assert dynamodb_table["hash_key"] == "productId"
        assert dynamodb_table["range_key"] == "reviewId"

        # Check attributes
        attributes = dynamodb_table["attribute"]
        assert len(attributes) == 2

        product_id_attr = next((a for a in attributes if a["name"] == "productId"), None)
        assert product_id_attr is not None
        assert product_id_attr["type"] == "S"

        review_id_attr = next((a for a in attributes if a["name"] == "reviewId"), None)
        assert review_id_attr is not None
        assert review_id_attr["type"] == "S"

    def test_dynamodb_table_uses_on_demand_billing(self):
        """Verify DynamoDB table uses PAY_PER_REQUEST billing mode."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        dynamodb_table = manifest["resource"]["aws_dynamodb_table"]["reviews_table"]
        assert dynamodb_table["billing_mode"] == "PAY_PER_REQUEST"

    def test_dynamodb_table_has_point_in_time_recovery_enabled(self):
        """Verify DynamoDB table has PITR enabled."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        dynamodb_table = manifest["resource"]["aws_dynamodb_table"]["reviews_table"]
        assert "point_in_time_recovery" in dynamodb_table
        assert dynamodb_table["point_in_time_recovery"]["enabled"] is True


class TestS3BucketConfiguration:
    """Test S3 bucket configuration."""

    def test_s3_bucket_has_correct_name_pattern(self):
        """Verify S3 bucket name includes environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="prod456",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        s3_bucket = manifest["resource"]["aws_s3_bucket"]["images_bucket"]
        assert s3_bucket["bucket"] == "review-images-prod456"

    def test_s3_bucket_has_public_access_blocked(self):
        """Verify S3 bucket blocks all public access."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        public_access_block = manifest["resource"]["aws_s3_bucket_public_access_block"]["images_bucket_block_public"]
        assert public_access_block["block_public_acls"] is True
        assert public_access_block["block_public_policy"] is True
        assert public_access_block["ignore_public_acls"] is True
        assert public_access_block["restrict_public_buckets"] is True

    def test_s3_bucket_has_encryption_configured(self):
        """Verify S3 bucket has server-side encryption enabled."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        encryption_config = manifest["resource"]["aws_s3_bucket_server_side_encryption_configuration"]["images_bucket_encryption"]
        assert "rule" in encryption_config
        assert len(encryption_config["rule"]) > 0

        encryption_rule = encryption_config["rule"][0]
        assert "apply_server_side_encryption_by_default" in encryption_rule
        assert encryption_rule["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"

    def test_s3_bucket_has_lifecycle_policy_for_glacier_transition(self):
        """Verify S3 bucket has lifecycle rule for Glacier transition after 90 days."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lifecycle_config = manifest["resource"]["aws_s3_bucket_lifecycle_configuration"]["images_bucket_lifecycle"]
        assert "rule" in lifecycle_config
        assert len(lifecycle_config["rule"]) > 0

        rule = lifecycle_config["rule"][0]
        assert rule["id"] == "glacier-transition"
        assert rule["status"] == "Enabled"
        assert "transition" in rule
        assert len(rule["transition"]) > 0

        transition = rule["transition"][0]
        assert transition["days"] == 90
        assert transition["storage_class"] == "GLACIER"

    def test_s3_bucket_has_notification_configuration(self):
        """Verify S3 bucket has Lambda notification configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        notification_config = manifest["resource"]["aws_s3_bucket_notification"]["image_upload_notification"]
        assert "lambda_function" in notification_config
        lambda_configs = notification_config["lambda_function"]

        # Should have 4 configurations for different image types
        assert len(lambda_configs) == 4

        # Check filter suffixes
        suffixes = [config["filter_suffix"] for config in lambda_configs]
        assert ".jpg" in suffixes
        assert ".png" in suffixes
        assert ".jpeg" in suffixes
        assert ".gif" in suffixes

        # All should trigger on ObjectCreated events
        for config in lambda_configs:
            assert "s3:ObjectCreated:*" in config["events"]


class TestLambdaFunctionConfiguration:
    """Test Lambda function configuration."""

    def test_lambda_function_has_correct_name_pattern(self):
        """Verify Lambda function name includes environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="staging789",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_function = manifest["resource"]["aws_lambda_function"]["review_processor"]
        assert lambda_function["function_name"] == "review-processor-staging789"

    def test_lambda_function_has_correct_runtime_and_handler(self):
        """Verify Lambda function uses Node.js 18.x runtime."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_function = manifest["resource"]["aws_lambda_function"]["review_processor"]
        assert lambda_function["runtime"] == "nodejs18.x"
        assert lambda_function["handler"] == "index.handler"

    def test_lambda_function_has_correct_memory_and_timeout(self):
        """Verify Lambda function has correct memory and timeout settings."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_function = manifest["resource"]["aws_lambda_function"]["review_processor"]
        assert lambda_function["memory_size"] == 512
        assert lambda_function["timeout"] == 60

    def test_lambda_function_has_environment_variables(self):
        """Verify Lambda function has required environment variables."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        lambda_function = manifest["resource"]["aws_lambda_function"]["review_processor"]
        assert "environment" in lambda_function
        env_vars = lambda_function["environment"]["variables"]

        assert "DYNAMODB_TABLE_NAME" in env_vars
        assert "S3_BUCKET_NAME" in env_vars

    def test_lambda_function_has_iam_role_with_permissions(self):
        """Verify Lambda function has IAM role configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check IAM role exists
        iam_role = manifest["resource"]["aws_iam_role"]["lambda_role"]
        assert iam_role is not None
        assert iam_role["name"] == "review-processor-role-test"

        # Check inline policy exists
        assert "inline_policy" in iam_role
        policies = iam_role["inline_policy"]
        assert len(policies) > 0

        # Parse policy document
        policy_doc = json.loads(policies[0]["policy"])
        statements = policy_doc["Statement"]

        # Check for DynamoDB permissions
        dynamodb_statement = next((s for s in statements if "dynamodb:PutItem" in s["Action"]), None)
        assert dynamodb_statement is not None

        # Check for S3 permissions
        s3_statement = next((s for s in statements if "s3:GetObject" in s["Action"]), None)
        assert s3_statement is not None

        # Check for CloudWatch logs permissions
        logs_statement = next((s for s in statements if "logs:CreateLogStream" in s["Action"]), None)
        assert logs_statement is not None


class TestAPIGatewayConfiguration:
    """Test API Gateway configuration."""

    def test_api_gateway_has_correct_name_pattern(self):
        """Verify API Gateway name includes environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="api123",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        api_gateway = manifest["resource"]["aws_api_gateway_rest_api"]["reviews_api"]
        assert api_gateway["name"] == "reviews-api-api123"

    def test_api_gateway_has_reviews_resource(self):
        """Verify API Gateway has /reviews resource."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        reviews_resource = manifest["resource"]["aws_api_gateway_resource"]["reviews_resource"]
        assert reviews_resource["path_part"] == "reviews"

    def test_api_gateway_has_product_id_parameter_resource(self):
        """Verify API Gateway has /reviews/{productId} resource."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        product_reviews_resource = manifest["resource"]["aws_api_gateway_resource"]["product_reviews_resource"]
        assert product_reviews_resource["path_part"] == "{productId}"

    def test_api_gateway_has_post_method_with_iam_auth(self):
        """Verify API Gateway POST method has AWS_IAM authorization."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        post_method = manifest["resource"]["aws_api_gateway_method"]["post_reviews_method"]
        assert post_method["http_method"] == "POST"
        assert post_method["authorization"] == "AWS_IAM"

    def test_api_gateway_has_get_method(self):
        """Verify API Gateway GET method exists."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        get_method = manifest["resource"]["aws_api_gateway_method"]["get_reviews_method"]
        assert get_method["http_method"] == "GET"
        assert get_method["authorization"] == "NONE"

    def test_api_gateway_has_lambda_integrations(self):
        """Verify API Gateway has Lambda integrations configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        # Check POST integration
        post_integration = manifest["resource"]["aws_api_gateway_integration"]["post_reviews_integration"]
        assert post_integration["type"] == "AWS_PROXY"
        assert post_integration["integration_http_method"] == "POST"

        # Check GET integration
        get_integration = manifest["resource"]["aws_api_gateway_integration"]["get_reviews_integration"]
        assert get_integration["type"] == "AWS_PROXY"
        assert get_integration["integration_http_method"] == "POST"

    def test_api_gateway_has_stage_deployed(self):
        """Verify API Gateway stage is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        stage = manifest["resource"]["aws_api_gateway_stage"]["api_stage"]
        assert stage["stage_name"] == "prod"

    def test_api_gateway_has_throttling_configured(self):
        """Verify API Gateway has throttling settings."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        method_settings = manifest["resource"]["aws_api_gateway_method_settings"]["api_throttling"]
        assert method_settings["method_path"] == "*/*"

        settings = method_settings["settings"]
        assert settings["throttling_burst_limit"] == 100
        assert settings["throttling_rate_limit"] == 100
        assert settings["logging_level"] == "INFO"


class TestCloudWatchLogsConfiguration:
    """Test CloudWatch Logs configuration."""

    def test_lambda_log_group_has_correct_name_pattern(self):
        """Verify Lambda log group name includes environment suffix."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="logs123",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        log_group = manifest["resource"]["aws_cloudwatch_log_group"]["lambda_log_group"]
        assert log_group["name"] == "/aws/lambda/review-processor-logs123"

    def test_lambda_log_group_has_7_day_retention(self):
        """Verify Lambda log group has 7-day retention policy."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        log_group = manifest["resource"]["aws_cloudwatch_log_group"]["lambda_log_group"]
        assert log_group["retention_in_days"] == 7

    def test_api_gateway_log_group_exists(self):
        """Verify API Gateway log group is configured."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        api_log_group = manifest["resource"]["aws_cloudwatch_log_group"]["api_log_group"]
        assert api_log_group is not None
        assert api_log_group["retention_in_days"] == 7


class TestStackOutputs:
    """Test stack outputs configuration."""

    def test_stack_has_all_required_outputs(self):
        """Verify stack defines all required outputs."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        outputs = manifest.get("output", {})

        # Check all required outputs exist
        assert "api_endpoint" in outputs
        assert "api_id" in outputs
        assert "dynamodb_table_name" in outputs
        assert "s3_bucket_name" in outputs
        assert "lambda_function_name" in outputs
        assert "lambda_function_arn" in outputs

    def test_outputs_have_descriptions(self):
        """Verify stack outputs have descriptions."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        outputs = manifest.get("output", {})

        # Check outputs have descriptions
        assert "description" in outputs["api_endpoint"]
        assert "description" in outputs["dynamodb_table_name"]
        assert "description" in outputs["lambda_function_name"]


class TestMultiEnvironmentSupport:
    """Test multi-environment deployment support."""

    def test_resources_use_environment_suffix_in_names(self):
        """Verify all resources include environment suffix in their names."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="multi-env-test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest.get("resource", {})

        # Check DynamoDB table name
        dynamodb_table = resources["aws_dynamodb_table"]["reviews_table"]
        assert "multi-env-test" in dynamodb_table["name"]

        # Check S3 bucket name
        s3_bucket = resources["aws_s3_bucket"]["images_bucket"]
        assert "multi-env-test" in s3_bucket["bucket"]

        # Check Lambda function name
        lambda_function = resources["aws_lambda_function"]["review_processor"]
        assert "multi-env-test" in lambda_function["function_name"]

        # Check API Gateway name
        api_gateway = resources["aws_api_gateway_rest_api"]["reviews_api"]
        assert "multi-env-test" in api_gateway["name"]

    def test_resources_have_production_environment_tags(self):
        """Verify resources are tagged with Environment: Production."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        resources = manifest.get("resource", {})

        # Check DynamoDB table tags
        dynamodb_table = resources["aws_dynamodb_table"]["reviews_table"]
        assert dynamodb_table["tags"]["Environment"] == "Production"

        # Check S3 bucket tags
        s3_bucket = resources["aws_s3_bucket"]["images_bucket"]
        assert s3_bucket["tags"]["Environment"] == "Production"

        # Check Lambda function tags
        lambda_function = resources["aws_lambda_function"]["review_processor"]
        assert lambda_function["tags"]["Environment"] == "Production"

    def test_stack_uses_correct_aws_region(self):
        """Verify stack uses the specified AWS region."""
        app = Testing.app()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        synthesized = Testing.synth(stack)
        manifest = json.loads(synthesized)

        provider = manifest.get("provider", {}).get("aws", [{}])[0]
        assert provider["region"] == "ap-southeast-1"
