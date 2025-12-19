"""
Unit tests for Payment Infrastructure CDKTF Stack
Tests all 9 AWS services and multi-region configuration
"""
import json
import pytest
from cdktf import Testing


class TestStackCreation:
    """Test basic stack creation and configuration"""

    def test_stack_creates_successfully(self, stack):
        """Test that stack can be created without errors"""
        assert stack is not None
        assert stack.environment_suffix == 'test123'

    def test_stack_has_correct_regions(self, stack):
        """Test that stack is configured with correct regions"""
        assert stack.primary_region == 'us-east-1'
        assert stack.secondary_region == 'us-west-2'

    def test_stack_has_common_tags(self, stack):
        """Test that stack has common tags defined"""
        assert stack.common_tags is not None
        assert 'Environment' in stack.common_tags
        assert 'Project' in stack.common_tags
        assert 'ManagedBy' in stack.common_tags
        assert stack.common_tags['ManagedBy'] == 'cdktf'
        assert stack.common_tags['EnvironmentSuffix'] == 'test123'


class TestProviders:
    """Test multi-region AWS provider configuration"""

    def test_primary_provider_configured(self, stack, synthesized_config):
        """Test that primary provider is configured correctly"""
        assert stack.primary_provider is not None
        config = synthesized_config

        # Check provider configuration in synthesized output
        assert 'provider' in config
        assert 'aws' in config['provider']

    def test_secondary_provider_configured(self, stack):
        """Test that secondary provider is configured correctly"""
        assert stack.secondary_provider is not None

    def test_providers_have_aliases(self, stack, synthesized_config):
        """Test that providers have correct aliases"""
        config = synthesized_config

        # Verify multiple provider configurations
        aws_providers = config['provider']['aws']
        assert isinstance(aws_providers, list)
        assert len(aws_providers) >= 2


class TestKMSKeys:
    """Test KMS key creation and configuration"""

    def test_dynamodb_kms_key_created(self, stack):
        """Test that DynamoDB KMS key is created"""
        assert stack.kms_key_dynamodb is not None

    def test_s3_kms_key_created(self, stack):
        """Test that S3 KMS key is created"""
        assert stack.kms_key_s3 is not None

    def test_lambda_kms_key_created(self, stack):
        """Test that Lambda KMS key is created"""
        assert stack.kms_key_lambda is not None

    def test_kms_keys_have_rotation_enabled(self, stack, synthesized_config):
        """Test that KMS keys have automatic rotation enabled"""
        config = synthesized_config

        # Check KMS key resources
        kms_keys = [v for k, v in config['resource']['aws_kms_key'].items()]
        assert len(kms_keys) >= 3

        for key in kms_keys:
            assert key.get('enable_key_rotation') is True

    def test_kms_keys_have_deletion_window(self, stack, synthesized_config):
        """Test that KMS keys have deletion window configured"""
        config = synthesized_config

        kms_keys = [v for k, v in config['resource']['aws_kms_key'].items()]
        for key in kms_keys:
            assert key.get('deletion_window_in_days') == 10

    def test_kms_aliases_created(self, stack, synthesized_config):
        """Test that KMS aliases are created"""
        config = synthesized_config

        assert 'aws_kms_alias' in config['resource']
        aliases = config['resource']['aws_kms_alias']
        assert len(aliases) >= 3

    def test_kms_keys_have_environment_suffix_in_name(self, stack, synthesized_config):
        """Test that KMS key descriptions include environment suffix"""
        config = synthesized_config

        kms_keys = [v for k, v in config['resource']['aws_kms_key'].items()]
        for key in kms_keys:
            assert 'test123' in key.get('description', '')


class TestDynamoDBTable:
    """Test DynamoDB Global Table configuration"""

    def test_dynamodb_table_created(self, stack):
        """Test that DynamoDB table is created"""
        assert stack.dynamodb_table is not None

    def test_dynamodb_table_has_correct_name(self, stack, synthesized_config):
        """Test that table name includes environment suffix"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        assert 'payment-test123-payments' in table['name']

    def test_dynamodb_table_has_pay_per_request_billing(self, stack, synthesized_config):
        """Test that table uses on-demand billing"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        assert table['billing_mode'] == 'PAY_PER_REQUEST'

    def test_dynamodb_table_has_correct_keys(self, stack, synthesized_config):
        """Test that table has correct partition and sort keys"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        assert table['hash_key'] == 'payment_id'
        assert table['range_key'] == 'timestamp'

    def test_dynamodb_table_has_stream_enabled(self, stack, synthesized_config):
        """Test that DynamoDB streams are enabled"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        assert table['stream_enabled'] is True
        assert table['stream_view_type'] == 'NEW_AND_OLD_IMAGES'

    def test_dynamodb_table_has_attributes(self, stack, synthesized_config):
        """Test that table has all required attributes"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        attributes = table['attribute']

        attribute_names = [attr['name'] for attr in attributes]
        assert 'payment_id' in attribute_names
        assert 'timestamp' in attribute_names
        assert 'status' in attribute_names
        assert 'customer_id' in attribute_names

    def test_dynamodb_table_has_global_secondary_indexes(self, stack, synthesized_config):
        """Test that table has GSIs configured"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        gsis = table['global_secondary_index']

        assert len(gsis) == 2
        gsi_names = [gsi['name'] for gsi in gsis]
        assert 'status-index' in gsi_names
        assert 'customer-index' in gsi_names

    def test_dynamodb_table_has_replica(self, stack, synthesized_config):
        """Test that table is configured as global table with replica"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        replica = table['replica']

        assert len(replica) == 1
        assert replica[0]['region_name'] == 'us-west-2'
        assert replica[0]['point_in_time_recovery'] is True

    def test_dynamodb_table_has_point_in_time_recovery(self, stack, synthesized_config):
        """Test that PITR is enabled"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        pitr = table['point_in_time_recovery']
        assert pitr['enabled'] is True

    def test_dynamodb_table_has_encryption(self, stack, synthesized_config):
        """Test that table has encryption enabled with KMS"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        encryption = table['server_side_encryption']
        assert encryption['enabled'] is True
        assert 'kms_key_arn' in encryption

    def test_dynamodb_table_has_tags(self, stack, synthesized_config, environment_suffix):
        """Test that table has required tags"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        tags = table.get('tags', {})
        assert tags.get('Environment') == environment_suffix
        assert tags.get('Project') == 'payment-infrastructure'
        assert tags.get('ManagedBy') == 'cdktf'


class TestS3Bucket:
    """Test S3 bucket configuration"""

    def test_s3_bucket_created(self, stack):
        """Test that S3 bucket is created"""
        assert stack.s3_bucket is not None

    def test_s3_bucket_has_correct_name(self, stack, synthesized_config):
        """Test that bucket name includes environment suffix"""
        config = synthesized_config

        bucket = config['resource']['aws_s3_bucket']['s3_logs']
        assert 'payment-test123-logs' in bucket['bucket']

    def test_s3_bucket_has_versioning_enabled(self, stack, synthesized_config):
        """Test that versioning is enabled"""
        config = synthesized_config

        versioning = config['resource']['aws_s3_bucket_versioning']['s3_versioning']
        assert versioning['versioning_configuration']['status'] == 'Enabled'

    def test_s3_bucket_has_encryption(self, stack, synthesized_config):
        """Test that encryption is enabled with KMS"""
        config = synthesized_config

        encryption = config['resource']['aws_s3_bucket_server_side_encryption_configuration']['s3_encryption']
        rule = encryption['rule'][0]
        sse_config = rule['apply_server_side_encryption_by_default']
        assert sse_config['sse_algorithm'] == 'aws:kms'
        assert rule['bucket_key_enabled'] is True

    def test_s3_bucket_has_lifecycle_policy(self, stack, synthesized_config):
        """Test that lifecycle policy is configured"""
        config = synthesized_config

        lifecycle = config['resource']['aws_s3_bucket_lifecycle_configuration']['s3_lifecycle']
        rules = lifecycle['rule']
        assert len(rules) >= 1
        assert rules[0]['status'] == 'Enabled'
        assert rules[0]['transition'][0]['storage_class'] == 'GLACIER'

    def test_s3_bucket_blocks_public_access(self, stack, synthesized_config):
        """Test that public access is blocked"""
        config = synthesized_config

        public_access = config['resource']['aws_s3_bucket_public_access_block']['s3_public_access_block']
        assert public_access['block_public_acls'] is True
        assert public_access['block_public_policy'] is True
        assert public_access['ignore_public_acls'] is True
        assert public_access['restrict_public_buckets'] is True

    def test_s3_bucket_has_tags(self, stack, synthesized_config, environment_suffix):
        """Test that bucket has required tags"""
        config = synthesized_config

        bucket = config['resource']['aws_s3_bucket']['s3_logs']
        tags = bucket.get('tags', {})
        assert tags.get('Environment') == environment_suffix
        assert tags.get('ManagedBy') == 'cdktf'


class TestIAMRole:
    """Test IAM role and policies"""

    def test_lambda_role_created(self, stack):
        """Test that Lambda IAM role is created"""
        assert stack.lambda_role is not None

    def test_lambda_role_has_correct_name(self, stack, synthesized_config):
        """Test that role name includes environment suffix"""
        config = synthesized_config

        role = config['resource']['aws_iam_role']['lambda_role']
        assert 'payment-test123-lambda-role' in role['name']

    def test_lambda_role_has_assume_role_policy(self, stack, synthesized_config):
        """Test that role has correct trust policy"""
        config = synthesized_config

        role = config['resource']['aws_iam_role']['lambda_role']
        policy = json.loads(role['assume_role_policy'])

        assert policy['Version'] == '2012-10-17'
        assert policy['Statement'][0]['Effect'] == 'Allow'
        assert policy['Statement'][0]['Principal']['Service'] == 'lambda.amazonaws.com'

    def test_lambda_role_has_policy(self, stack, synthesized_config):
        """Test that role has inline policy attached"""
        config = synthesized_config

        assert 'aws_iam_role_policy' in config['resource']
        policy_resource = config['resource']['aws_iam_role_policy']['lambda_policy']
        assert policy_resource is not None

    def test_lambda_policy_has_cloudwatch_permissions(self, stack, synthesized_config):
        """Test that policy includes CloudWatch Logs permissions"""
        config = synthesized_config

        policy_resource = config['resource']['aws_iam_role_policy']['lambda_policy']
        policy = json.loads(policy_resource['policy'])

        # Find CloudWatch statement
        cw_statement = next((s for s in policy['Statement'] if 'logs:' in str(s['Action'])), None)
        assert cw_statement is not None
        assert 'logs:CreateLogGroup' in cw_statement['Action']

    def test_lambda_policy_has_dynamodb_permissions(self, stack, synthesized_config):
        """Test that policy includes DynamoDB permissions"""
        config = synthesized_config

        policy_resource = config['resource']['aws_iam_role_policy']['lambda_policy']
        policy = json.loads(policy_resource['policy'])

        # Find DynamoDB statement
        db_statement = next((s for s in policy['Statement'] if 'dynamodb:' in str(s['Action'])), None)
        assert db_statement is not None
        assert 'dynamodb:PutItem' in db_statement['Action']

    def test_lambda_policy_has_s3_permissions(self, stack, synthesized_config):
        """Test that policy includes S3 permissions"""
        config = synthesized_config

        policy_resource = config['resource']['aws_iam_role_policy']['lambda_policy']
        policy = json.loads(policy_resource['policy'])

        # Find S3 statement
        s3_statement = next((s for s in policy['Statement'] if 's3:' in str(s['Action'])), None)
        assert s3_statement is not None
        assert 's3:PutObject' in s3_statement['Action']

    def test_lambda_policy_has_kms_permissions(self, stack, synthesized_config):
        """Test that policy includes KMS permissions"""
        config = synthesized_config

        policy_resource = config['resource']['aws_iam_role_policy']['lambda_policy']
        policy = json.loads(policy_resource['policy'])

        # Find KMS statement
        kms_statement = next((s for s in policy['Statement'] if 'kms:' in str(s['Action'])), None)
        assert kms_statement is not None
        assert 'kms:Decrypt' in kms_statement['Action']


class TestLambdaFunction:
    """Test Lambda function configuration"""

    def test_lambda_function_created(self, stack):
        """Test that Lambda function is created"""
        assert stack.lambda_function is not None

    def test_lambda_function_has_correct_name(self, stack, synthesized_config):
        """Test that function name includes environment suffix"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert 'payment-test123-processor' in function['function_name']

    def test_lambda_function_has_correct_runtime(self, stack, synthesized_config):
        """Test that function uses Python 3.11"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert function['runtime'] == 'python3.11'

    def test_lambda_function_has_correct_handler(self, stack, synthesized_config):
        """Test that function has correct handler"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert function['handler'] == 'handler.lambda_handler'

    def test_lambda_function_has_environment_variables(self, stack, synthesized_config):
        """Test that function has required environment variables"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        env_vars = function['environment']['variables']

        assert 'TABLE_NAME' in env_vars
        assert 'BUCKET_NAME' in env_vars
        assert 'KMS_KEY_ID' in env_vars
        assert 'ENVIRONMENT_SUFFIX' in env_vars

    def test_lambda_function_has_kms_encryption(self, stack, synthesized_config):
        """Test that function uses KMS for environment variable encryption"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert 'kms_key_arn' in function

    def test_lambda_function_has_correct_timeout(self, stack, synthesized_config):
        """Test that function has 60 second timeout"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert function['timeout'] == 60

    def test_lambda_function_has_correct_memory(self, stack, synthesized_config):
        """Test that function has 512 MB memory"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert function['memory_size'] == 512

    def test_lambda_log_group_created(self, stack, synthesized_config):
        """Test that CloudWatch Log Group is created"""
        config = synthesized_config

        log_group = config['resource']['aws_cloudwatch_log_group']['lambda_log_group']
        assert log_group is not None
        assert log_group['retention_in_days'] == 7


class TestAPIGateway:
    """Test API Gateway configuration"""

    def test_api_gateway_created(self, stack):
        """Test that API Gateway is created"""
        assert stack.api_gateway is not None

    def test_api_gateway_has_correct_name(self, stack, synthesized_config):
        """Test that API name includes environment suffix"""
        config = synthesized_config

        api = config['resource']['aws_api_gateway_rest_api']['payment_api']
        assert 'payment-test123-api' in api['name']

    def test_api_gateway_is_regional(self, stack, synthesized_config):
        """Test that API is regional"""
        config = synthesized_config

        api = config['resource']['aws_api_gateway_rest_api']['payment_api']
        assert api['endpoint_configuration']['types'] == ['REGIONAL']

    def test_api_gateway_has_resource(self, stack, synthesized_config):
        """Test that API has resource created"""
        config = synthesized_config

        resource = config['resource']['aws_api_gateway_resource']['payment_resource']
        assert resource['path_part'] == 'process'

    def test_api_gateway_has_post_method(self, stack, synthesized_config):
        """Test that API has POST method"""
        config = synthesized_config

        method = config['resource']['aws_api_gateway_method']['payment_method']
        assert method['http_method'] == 'POST'
        assert method['api_key_required'] is True

    def test_api_gateway_has_lambda_integration(self, stack, synthesized_config):
        """Test that API has Lambda integration"""
        config = synthesized_config

        integration = config['resource']['aws_api_gateway_integration']['payment_integration']
        assert integration['type'] == 'AWS_PROXY'
        assert integration['integration_http_method'] == 'POST'

    def test_api_gateway_has_lambda_permission(self, stack, synthesized_config):
        """Test that Lambda permission is created for API Gateway"""
        config = synthesized_config

        permission = config['resource']['aws_lambda_permission']['api_lambda_permission']
        assert permission['action'] == 'lambda:InvokeFunction'
        assert permission['principal'] == 'apigateway.amazonaws.com'

    def test_api_gateway_has_deployment(self, stack, synthesized_config):
        """Test that API has deployment"""
        config = synthesized_config

        assert 'aws_api_gateway_deployment' in config['resource']

    def test_api_gateway_has_stage(self, stack, synthesized_config):
        """Test that API has stage"""
        config = synthesized_config

        stage = config['resource']['aws_api_gateway_stage']['api_stage']
        assert stage['stage_name'] == 'prod'

    def test_api_key_created(self, stack, synthesized_config):
        """Test that API key is created"""
        config = synthesized_config

        api_key = config['resource']['aws_api_gateway_api_key']['api_key']
        assert 'payment-test123-api-key' in api_key['name']

    def test_usage_plan_created(self, stack, synthesized_config):
        """Test that usage plan is created"""
        config = synthesized_config

        usage_plan = config['resource']['aws_api_gateway_usage_plan']['usage_plan']
        assert usage_plan is not None

    def test_usage_plan_key_created(self, stack, synthesized_config):
        """Test that usage plan key is created"""
        config = synthesized_config

        usage_plan_key = config['resource']['aws_api_gateway_usage_plan_key']['usage_plan_key']
        assert usage_plan_key['key_type'] == 'API_KEY'


class TestCloudWatch:
    """Test CloudWatch alarms and monitoring"""

    def test_sns_topic_created(self, stack):
        """Test that SNS topic for alarms is created"""
        assert stack.sns_topic is not None

    def test_sns_topic_has_correct_name(self, stack, synthesized_config):
        """Test that SNS topic name includes environment suffix"""
        config = synthesized_config

        topic = config['resource']['aws_sns_topic']['alarm_topic']
        assert 'payment-test123-alarms' in topic['name']

    def test_lambda_error_alarm_created(self, stack, synthesized_config):
        """Test that Lambda error alarm is created"""
        config = synthesized_config

        alarm = config['resource']['aws_cloudwatch_metric_alarm']['lambda_error_alarm']
        assert alarm['metric_name'] == 'Errors'
        assert alarm['namespace'] == 'AWS/Lambda'
        assert alarm['threshold'] == 5

    def test_lambda_duration_alarm_created(self, stack, synthesized_config):
        """Test that Lambda duration alarm is created"""
        config = synthesized_config

        alarm = config['resource']['aws_cloudwatch_metric_alarm']['lambda_duration_alarm']
        assert alarm['metric_name'] == 'Duration'
        assert alarm['threshold'] == 30000

    def test_dynamodb_throttle_alarm_created(self, stack, synthesized_config):
        """Test that DynamoDB throttle alarm is created"""
        config = synthesized_config

        alarm = config['resource']['aws_cloudwatch_metric_alarm']['dynamodb_throttle_alarm']
        assert alarm['metric_name'] == 'UserErrors'
        assert alarm['namespace'] == 'AWS/DynamoDB'

    def test_alarms_send_to_sns(self, stack, synthesized_config):
        """Test that alarms send notifications to SNS topic"""
        config = synthesized_config

        alarms = config['resource']['aws_cloudwatch_metric_alarm']
        for alarm_name, alarm in alarms.items():
            assert 'alarm_actions' in alarm


class TestRoute53:
    """Test Route 53 health check"""

    def test_health_check_created(self, stack):
        """Test that health check is created"""
        assert stack.health_check is not None

    def test_health_check_uses_https(self, stack, synthesized_config):
        """Test that health check uses HTTPS"""
        config = synthesized_config

        health_check = config['resource']['aws_route53_health_check']['api_health_check']
        assert health_check['type'] == 'HTTPS'

    def test_health_check_has_correct_path(self, stack, synthesized_config):
        """Test that health check has correct path"""
        config = synthesized_config

        health_check = config['resource']['aws_route53_health_check']['api_health_check']
        # Check for Terraform interpolation pattern (uses stage name dynamically)
        assert '/process' in health_check['resource_path']
        assert 'stage_name' in health_check['resource_path']


class TestSSMParameters:
    """Test SSM Parameter Store configuration"""

    def test_ssm_table_name_parameter_created(self, stack, synthesized_config):
        """Test that table name parameter is created"""
        config = synthesized_config

        param = config['resource']['aws_ssm_parameter']['ssm_table_name']
        assert '/payment/test123/table-name' in param['name']
        assert param['type'] == 'String'

    def test_ssm_bucket_name_parameter_created(self, stack, synthesized_config):
        """Test that bucket name parameter is created"""
        config = synthesized_config

        param = config['resource']['aws_ssm_parameter']['ssm_bucket_name']
        assert '/payment/test123/bucket-name' in param['name']

    def test_ssm_api_key_parameter_created(self, stack, synthesized_config):
        """Test that API key parameter is created"""
        config = synthesized_config

        param = config['resource']['aws_ssm_parameter']['ssm_api_key']
        assert '/payment/test123/api-key' in param['name']
        assert param['type'] == 'SecureString'


class TestOutputs:
    """Test Terraform outputs"""

    def test_api_endpoint_output_created(self, stack, synthesized_config):
        """Test that API endpoint output is created"""
        config = synthesized_config

        assert 'api_endpoint' in config['output']

    def test_api_key_outputs_created(self, stack, synthesized_config):
        """Test that API key outputs are created"""
        config = synthesized_config

        assert 'api_key_id' in config['output']
        assert 'api_key_value' in config['output']
        assert config['output']['api_key_value']['sensitive'] is True

    def test_dynamodb_outputs_created(self, stack, synthesized_config):
        """Test that DynamoDB outputs are created"""
        config = synthesized_config

        assert 'dynamodb_table_name' in config['output']
        assert 'dynamodb_table_arn' in config['output']

    def test_s3_output_created(self, stack, synthesized_config):
        """Test that S3 bucket output is created"""
        config = synthesized_config

        assert 's3_bucket_name' in config['output']

    def test_lambda_outputs_created(self, stack, synthesized_config):
        """Test that Lambda outputs are created"""
        config = synthesized_config

        assert 'lambda_function_arn' in config['output']
        assert 'lambda_function_name' in config['output']

    def test_kms_output_created(self, stack, synthesized_config):
        """Test that KMS key output is created"""
        config = synthesized_config

        assert 'kms_key_id' in config['output']

    def test_sns_output_created(self, stack, synthesized_config):
        """Test that SNS topic output is created"""
        config = synthesized_config

        assert 'sns_topic_arn' in config['output']


class TestResourceNaming:
    """Test that all resources follow naming conventions"""

    def test_all_resources_include_environment_suffix(self, stack, synthesized_config):
        """Test that all resources include environment suffix in names"""
        config = synthesized_config

        # Check various resource names
        resources_to_check = [
            ('aws_dynamodb_table', 'payments_table', 'name'),
            ('aws_s3_bucket', 's3_logs', 'bucket'),
            ('aws_lambda_function', 'payment_processor', 'function_name'),
            ('aws_api_gateway_rest_api', 'payment_api', 'name'),
            ('aws_iam_role', 'lambda_role', 'name')
        ]

        for resource_type, resource_id, name_field in resources_to_check:
            resource = config['resource'][resource_type][resource_id]
            assert 'test123' in resource[name_field], f"{resource_type}.{resource_id} missing environment suffix"


class TestTags:
    """Test that all resources have required tags"""

    def test_resources_have_common_tags(self, stack, synthesized_config):
        """Test that resources have all common tags"""
        config = synthesized_config

        # Check tags on various resources
        resource_types_with_tags = [
            'aws_dynamodb_table',
            'aws_s3_bucket',
            'aws_lambda_function',
            'aws_api_gateway_rest_api',
            'aws_iam_role',
            'aws_kms_key',
            'aws_sns_topic'
        ]

        for resource_type in resource_types_with_tags:
            if resource_type in config['resource']:
                resources = config['resource'][resource_type]
                for resource_id, resource in resources.items():
                    if 'tags' in resource:
                        tags = resource['tags']
                        assert 'ManagedBy' in tags, f"{resource_type}.{resource_id} missing ManagedBy tag"
                        assert tags['ManagedBy'] == 'cdktf'


class TestEncryption:
    """Test that encryption is properly configured"""

    def test_dynamodb_uses_encryption(self, stack, synthesized_config):
        """Test that DynamoDB table uses encryption"""
        config = synthesized_config

        table = config['resource']['aws_dynamodb_table']['payments_table']
        assert table['server_side_encryption']['enabled'] is True

    def test_s3_uses_encryption(self, stack, synthesized_config):
        """Test that S3 bucket uses encryption"""
        config = synthesized_config

        encryption = config['resource']['aws_s3_bucket_server_side_encryption_configuration']['s3_encryption']
        assert encryption is not None

    def test_lambda_environment_uses_encryption(self, stack, synthesized_config):
        """Test that Lambda environment variables are encrypted"""
        config = synthesized_config

        function = config['resource']['aws_lambda_function']['payment_processor']
        assert 'kms_key_arn' in function


class TestResourceCount:
    """Test that all 9 AWS services are present"""

    def test_all_nine_services_present(self, stack, synthesized_config):
        """Test that all 9 AWS services are represented in the stack"""
        config = synthesized_config

        # Check for resources from all 9 services
        required_services = [
            'aws_api_gateway_rest_api',        # 1. API Gateway
            'aws_lambda_function',              # 2. Lambda
            'aws_dynamodb_table',               # 3. DynamoDB
            'aws_route53_health_check',         # 4. Route 53
            'aws_s3_bucket',                    # 5. S3
            'aws_cloudwatch_metric_alarm',     # 6. CloudWatch
            'aws_iam_role',                     # 7. IAM
            'aws_kms_key',                      # 8. KMS
            'aws_ssm_parameter'                 # 9. SSM
        ]

        for service in required_services:
            assert service in config['resource'], f"Service {service} not found in stack"

    def test_stack_has_minimum_resource_count(self, stack, synthesized_config):
        """Test that stack has reasonable number of resources"""
        config = synthesized_config

        total_resources = sum(len(resources) for resources in config['resource'].values())
        # Should have at least 30 resources across all services
        assert total_resources >= 30, f"Stack has only {total_resources} resources, expected at least 30"
