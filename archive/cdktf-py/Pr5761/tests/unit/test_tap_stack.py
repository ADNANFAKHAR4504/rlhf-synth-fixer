"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackInstantiation:
    """Test suite for Stack Instantiation."""

    def test_tap_stack_instantiates_with_default_values(self):
        """TapStack instantiates successfully with default values."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors
        assert stack is not None

    def test_tap_stack_instantiates_with_custom_values(self):
        """TapStack instantiates successfully with custom values."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackCustom",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
            default_tags={"Team": "Backend", "Environment": "Production"}
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None


class TestDynamoDBConfiguration:
    """Test suite for DynamoDB Table Configuration."""

    def test_dynamodb_table_exists(self):
        """DynamoDB table is created."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        # Find DynamoDB table resource
        dynamodb_tables = [
            r for r in resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        ]

        assert len(dynamodb_tables) == 1

    def test_dynamodb_table_name_includes_environment_suffix(self):
        """DynamoDB table name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="staging")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        assert dynamodb_table['name'] == 'product-reviews-staging'

    def test_dynamodb_table_has_correct_keys(self):
        """DynamoDB table has correct hash and range keys."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        assert dynamodb_table['hash_key'] == 'productId'
        assert dynamodb_table['range_key'] == 'reviewId'

    def test_dynamodb_table_has_correct_attributes(self):
        """DynamoDB table has correct attributes."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        attributes = dynamodb_table['attribute']
        assert len(attributes) == 2
        assert any(attr['name'] == 'productId' and attr['type'] == 'S' for attr in attributes)
        assert any(attr['name'] == 'reviewId' and attr['type'] == 'S' for attr in attributes)

    def test_dynamodb_table_billing_mode(self):
        """DynamoDB table uses PAY_PER_REQUEST billing."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        assert dynamodb_table['billing_mode'] == 'PAY_PER_REQUEST'

    def test_dynamodb_table_point_in_time_recovery_enabled(self):
        """DynamoDB table has point-in-time recovery enabled."""
        app = App()
        stack = TapStack(app, "TestDynamoDBStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        assert dynamodb_table['point_in_time_recovery']['enabled'] is True


class TestS3BucketConfiguration:
    """Test suite for S3 Bucket Configuration."""

    def test_s3_bucket_exists(self):
        """S3 bucket is created."""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        s3_buckets = [
            r for r in resources.get('resource', {}).get('aws_s3_bucket', {}).values()
        ]

        assert len(s3_buckets) == 1

    def test_s3_bucket_name_includes_environment_suffix(self):
        """S3 bucket name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="qa")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        s3_bucket = list(
            resources.get('resource', {}).get('aws_s3_bucket', {}).values()
        )[0]

        assert s3_bucket['bucket'] == 'review-images-qa'

    def test_s3_bucket_public_access_block_configured(self):
        """S3 bucket has public access block configured."""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        public_access_blocks = list(
            resources.get('resource', {}).get('aws_s3_bucket_public_access_block', {}).values()
        )

        assert len(public_access_blocks) == 1
        block = public_access_blocks[0]
        assert block['block_public_acls'] is True
        assert block['block_public_policy'] is True
        assert block['ignore_public_acls'] is True
        assert block['restrict_public_buckets'] is True

    def test_s3_bucket_encryption_configured(self):
        """S3 bucket has server-side encryption configured."""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        encryption_configs = list(
            resources.get('resource', {}).get('aws_s3_bucket_server_side_encryption_configuration', {}).values()
        )

        assert len(encryption_configs) == 1
        config = encryption_configs[0]
        assert config['rule'][0]['apply_server_side_encryption_by_default']['sse_algorithm'] == 'AES256'

    def test_s3_bucket_lifecycle_configuration(self):
        """S3 bucket has lifecycle configuration for Glacier transition."""
        app = App()
        stack = TapStack(app, "TestS3Stack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lifecycle_configs = list(
            resources.get('resource', {}).get('aws_s3_bucket_lifecycle_configuration', {}).values()
        )

        assert len(lifecycle_configs) == 1
        config = lifecycle_configs[0]
        assert config['rule'][0]['status'] == 'Enabled'
        assert config['rule'][0]['transition'][0]['days'] == 90
        assert config['rule'][0]['transition'][0]['storage_class'] == 'GLACIER'


class TestLambdaConfiguration:
    """Test suite for Lambda Function Configuration."""

    def test_lambda_function_exists(self):
        """Lambda function is created."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_functions = [
            r for r in resources.get('resource', {}).get('aws_lambda_function', {}).values()
        ]

        assert len(lambda_functions) == 1

    def test_lambda_function_name_includes_environment_suffix(self):
        """Lambda function name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="dev")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_function = list(
            resources.get('resource', {}).get('aws_lambda_function', {}).values()
        )[0]

        assert lambda_function['function_name'] == 'review-processor-dev'

    def test_lambda_function_runtime_and_handler(self):
        """Lambda function has correct runtime and handler."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_function = list(
            resources.get('resource', {}).get('aws_lambda_function', {}).values()
        )[0]

        assert lambda_function['runtime'] == 'nodejs18.x'
        assert lambda_function['handler'] == 'index.handler'

    def test_lambda_function_memory_and_timeout(self):
        """Lambda function has correct memory and timeout settings."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_function = list(
            resources.get('resource', {}).get('aws_lambda_function', {}).values()
        )[0]

        assert lambda_function['memory_size'] == 512
        assert lambda_function['timeout'] == 60

    def test_lambda_function_environment_variables(self):
        """Lambda function has correct environment variables."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_function = list(
            resources.get('resource', {}).get('aws_lambda_function', {}).values()
        )[0]

        env_vars = lambda_function['environment']['variables']
        assert 'DYNAMODB_TABLE_NAME' in env_vars
        assert 'S3_BUCKET_NAME' in env_vars

    def test_lambda_permissions_exist(self):
        """Lambda permissions are created for S3 and API Gateway."""
        app = App()
        stack = TapStack(app, "TestLambdaStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_permissions = [
            r for r in resources.get('resource', {}).get('aws_lambda_permission', {}).values()
        ]

        assert len(lambda_permissions) == 2

        # Check S3 permission
        s3_permission = next((p for p in lambda_permissions if p['statement_id'] == 'AllowS3Invoke'), None)
        assert s3_permission is not None
        assert s3_permission['action'] == 'lambda:InvokeFunction'
        assert s3_permission['principal'] == 's3.amazonaws.com'

        # Check API Gateway permission
        api_permission = next((p for p in lambda_permissions if p['statement_id'] == 'AllowAPIGatewayInvoke'), None)
        assert api_permission is not None
        assert api_permission['action'] == 'lambda:InvokeFunction'
        assert api_permission['principal'] == 'apigateway.amazonaws.com'


class TestIAMRoleConfiguration:
    """Test suite for IAM Role Configuration."""

    def test_iam_role_exists(self):
        """IAM role is created for Lambda."""
        app = App()
        stack = TapStack(app, "TestIAMStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        iam_roles = [
            r for r in resources.get('resource', {}).get('aws_iam_role', {}).values()
        ]

        assert len(iam_roles) == 1

    def test_iam_role_name_includes_environment_suffix(self):
        """IAM role name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestIAMStack", environment_suffix="prod")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        iam_role = list(
            resources.get('resource', {}).get('aws_iam_role', {}).values()
        )[0]

        assert iam_role['name'] == 'review-processor-role-prod'

    def test_iam_role_has_lambda_assume_role_policy(self):
        """IAM role has correct assume role policy for Lambda."""
        app = App()
        stack = TapStack(app, "TestIAMStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        iam_role = list(
            resources.get('resource', {}).get('aws_iam_role', {}).values()
        )[0]

        assume_role_policy = json.loads(iam_role['assume_role_policy'])
        assert assume_role_policy['Statement'][0]['Action'] == 'sts:AssumeRole'
        assert assume_role_policy['Statement'][0]['Principal']['Service'] == 'lambda.amazonaws.com'
        assert assume_role_policy['Statement'][0]['Effect'] == 'Allow'

    def test_iam_role_has_inline_policy_with_permissions(self):
        """IAM role has inline policy with DynamoDB, S3, and CloudWatch permissions."""
        app = App()
        stack = TapStack(app, "TestIAMStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        iam_role = list(
            resources.get('resource', {}).get('aws_iam_role', {}).values()
        )[0]

        inline_policies = iam_role['inline_policy']
        assert len(inline_policies) == 1

        policy = json.loads(inline_policies[0]['policy'])
        statements = policy['Statement']

        # Check DynamoDB permissions
        dynamodb_statement = next((s for s in statements if 'dynamodb:PutItem' in s['Action']), None)
        assert dynamodb_statement is not None
        assert 'dynamodb:GetItem' in dynamodb_statement['Action']
        assert 'dynamodb:Query' in dynamodb_statement['Action']

        # Check S3 permissions
        s3_statement = next((s for s in statements if 's3:GetObject' in s['Action']), None)
        assert s3_statement is not None
        assert 's3:PutObject' in s3_statement['Action']

        # Check CloudWatch Logs permissions
        logs_statement = next((s for s in statements if 'logs:CreateLogStream' in s['Action']), None)
        assert logs_statement is not None
        assert 'logs:PutLogEvents' in logs_statement['Action']


class TestCloudWatchLogGroups:
    """Test suite for CloudWatch Log Groups."""

    def test_lambda_log_group_exists(self):
        """Lambda log group is created."""
        app = App()
        stack = TapStack(app, "TestLogsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        log_groups = [
            r for r in resources.get('resource', {}).get('aws_cloudwatch_log_group', {}).values()
        ]

        assert len(log_groups) == 2

    def test_lambda_log_group_name_includes_environment_suffix(self):
        """Lambda log group name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestLogsStack", environment_suffix="staging")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        log_groups = list(
            resources.get('resource', {}).get('aws_cloudwatch_log_group', {}).values()
        )

        lambda_log = next((lg for lg in log_groups if '/aws/lambda/' in lg['name']), None)
        assert lambda_log is not None
        assert lambda_log['name'] == '/aws/lambda/review-processor-staging'

    def test_api_log_group_name_includes_environment_suffix(self):
        """API Gateway log group name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestLogsStack", environment_suffix="staging")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        log_groups = list(
            resources.get('resource', {}).get('aws_cloudwatch_log_group', {}).values()
        )

        api_log = next((lg for lg in log_groups if '/aws/apigateway/' in lg['name']), None)
        assert api_log is not None
        assert api_log['name'] == '/aws/apigateway/reviews-api-staging'

    def test_log_groups_retention_period(self):
        """Log groups have correct retention period."""
        app = App()
        stack = TapStack(app, "TestLogsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        log_groups = list(
            resources.get('resource', {}).get('aws_cloudwatch_log_group', {}).values()
        )

        for log_group in log_groups:
            assert log_group['retention_in_days'] == 7


class TestAPIGatewayConfiguration:
    """Test suite for API Gateway Configuration."""

    def test_api_gateway_rest_api_exists(self):
        """API Gateway REST API is created."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        rest_apis = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_rest_api', {}).values()
        ]

        assert len(rest_apis) == 1

    def test_api_gateway_name_includes_environment_suffix(self):
        """API Gateway name includes environment suffix."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="prod")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        rest_api = list(
            resources.get('resource', {}).get('aws_api_gateway_rest_api', {}).values()
        )[0]

        assert rest_api['name'] == 'reviews-api-prod'

    def test_api_gateway_resources_exist(self):
        """API Gateway resources /reviews and /reviews/{productId} exist."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        api_resources = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_resource', {}).values()
        ]

        assert len(api_resources) == 2

        # Check /reviews resource
        reviews_resource = next((r for r in api_resources if r['path_part'] == 'reviews'), None)
        assert reviews_resource is not None

        # Check /reviews/{productId} resource
        product_reviews_resource = next((r for r in api_resources if r['path_part'] == '{productId}'), None)
        assert product_reviews_resource is not None

    def test_api_gateway_methods_exist(self):
        """API Gateway methods POST /reviews and GET /reviews/{productId} exist."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        api_methods = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_method', {}).values()
        ]

        assert len(api_methods) == 2

        # Check POST method
        post_method = next((m for m in api_methods if m['http_method'] == 'POST'), None)
        assert post_method is not None
        assert post_method['authorization'] == 'AWS_IAM'

        # Check GET method
        get_method = next((m for m in api_methods if m['http_method'] == 'GET'), None)
        assert get_method is not None
        assert get_method['authorization'] == 'NONE'

    def test_api_gateway_integrations_exist(self):
        """API Gateway integrations are configured."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        api_integrations = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_integration', {}).values()
        ]

        assert len(api_integrations) == 2

        for integration in api_integrations:
            assert integration['type'] == 'AWS_PROXY'
            assert integration['integration_http_method'] == 'POST'

    def test_api_gateway_deployment_exists(self):
        """API Gateway deployment is created."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        deployments = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_deployment', {}).values()
        ]

        assert len(deployments) == 1

    def test_api_gateway_stage_exists(self):
        """API Gateway stage is created."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        stages = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_stage', {}).values()
        ]

        assert len(stages) == 1
        assert stages[0]['stage_name'] == 'prod'

    def test_api_gateway_method_settings_configured(self):
        """API Gateway method settings are configured with throttling."""
        app = App()
        stack = TapStack(app, "TestAPIStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        method_settings = [
            r for r in resources.get('resource', {}).get('aws_api_gateway_method_settings', {}).values()
        ]

        assert len(method_settings) == 1
        settings = method_settings[0]['settings']
        assert settings['throttling_burst_limit'] == 100
        assert settings['throttling_rate_limit'] == 100
        assert settings['logging_level'] == 'INFO'
        assert settings['data_trace_enabled'] is True
        assert settings['metrics_enabled'] is True


class TestS3BucketNotification:
    """Test suite for S3 Bucket Notification Configuration."""

    def test_s3_bucket_notification_exists(self):
        """S3 bucket notification is configured."""
        app = App()
        stack = TapStack(app, "TestNotificationStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        notifications = [
            r for r in resources.get('resource', {}).get('aws_s3_bucket_notification', {}).values()
        ]

        assert len(notifications) == 1

    def test_s3_bucket_notification_lambda_functions(self):
        """S3 bucket notification has Lambda function configurations for image types."""
        app = App()
        stack = TapStack(app, "TestNotificationStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        notification = list(
            resources.get('resource', {}).get('aws_s3_bucket_notification', {}).values()
        )[0]

        lambda_functions = notification['lambda_function']
        assert len(lambda_functions) == 4

        # Check for different image file extensions
        suffixes = [lf['filter_suffix'] for lf in lambda_functions]
        assert '.jpg' in suffixes
        assert '.png' in suffixes
        assert '.jpeg' in suffixes
        assert '.gif' in suffixes

        # All should trigger on object created events
        for lf in lambda_functions:
            assert 's3:ObjectCreated:*' in lf['events']


class TestStackOutputs:
    """Test suite for Stack Outputs."""

    def test_stack_outputs_exist(self):
        """Stack outputs are configured."""
        app = App()
        stack = TapStack(app, "TestOutputsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        outputs = resources.get('output', {})

        assert 'api_endpoint' in outputs
        assert 'api_id' in outputs
        assert 'dynamodb_table_name' in outputs
        assert 's3_bucket_name' in outputs
        assert 'lambda_function_name' in outputs
        assert 'lambda_function_arn' in outputs

    def test_stack_outputs_have_descriptions(self):
        """Stack outputs have descriptions."""
        app = App()
        stack = TapStack(app, "TestOutputsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        outputs = resources.get('output', {})

        for output_name, output_config in outputs.items():
            assert 'description' in output_config


class TestAwsProviderConfiguration:
    """Test suite for AWS Provider Configuration."""

    def test_aws_provider_exists(self):
        """AWS provider is configured."""
        app = App()
        stack = TapStack(app, "TestProviderStack", environment_suffix="test", aws_region="us-west-2")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        providers = resources.get('provider', {}).get('aws', [])

        assert len(providers) > 0

    def test_aws_provider_uses_specified_region(self):
        """AWS provider uses the specified region."""
        app = App()
        stack = TapStack(app, "TestProviderStack", environment_suffix="test", aws_region="ap-southeast-1")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        providers = resources.get('provider', {}).get('aws', [])
        provider = providers[0] if isinstance(providers, list) else providers

        assert provider['region'] == 'ap-southeast-1'

    def test_aws_provider_has_default_tags(self):
        """AWS provider has default tags configured."""
        app = App()
        stack = TapStack(
            app,
            "TestProviderStack",
            environment_suffix="test",
            aws_region="us-east-1",
            default_tags={"Team": "Engineering", "Project": "Reviews"}
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        providers = resources.get('provider', {}).get('aws', [])
        provider = providers[0] if isinstance(providers, list) else providers

        assert 'default_tags' in provider
        assert isinstance(provider['default_tags'], list)


class TestResourceTags:
    """Test suite for Resource Tags."""

    def test_dynamodb_table_has_tags(self):
        """DynamoDB table has tags."""
        app = App()
        stack = TapStack(app, "TestTagsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        dynamodb_table = list(
            resources.get('resource', {}).get('aws_dynamodb_table', {}).values()
        )[0]

        assert 'tags' in dynamodb_table
        assert dynamodb_table['tags']['Environment'] == 'Production'

    def test_s3_bucket_has_tags(self):
        """S3 bucket has tags."""
        app = App()
        stack = TapStack(app, "TestTagsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        s3_bucket = list(
            resources.get('resource', {}).get('aws_s3_bucket', {}).values()
        )[0]

        assert 'tags' in s3_bucket
        assert s3_bucket['tags']['Environment'] == 'Production'

    def test_lambda_function_has_tags(self):
        """Lambda function has tags."""
        app = App()
        stack = TapStack(app, "TestTagsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        lambda_function = list(
            resources.get('resource', {}).get('aws_lambda_function', {}).values()
        )[0]

        assert 'tags' in lambda_function
        assert lambda_function['tags']['Environment'] == 'Production'

    def test_api_gateway_has_tags(self):
        """API Gateway has tags."""
        app = App()
        stack = TapStack(app, "TestTagsStack", environment_suffix="test")

        synth = Testing.synth(stack)
        resources = json.loads(synth)

        rest_api = list(
            resources.get('resource', {}).get('aws_api_gateway_rest_api', {}).values()
        )[0]

        assert 'tags' in rest_api
        assert rest_api['tags']['Environment'] == 'Production'
