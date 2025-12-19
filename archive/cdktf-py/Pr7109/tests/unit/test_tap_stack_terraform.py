"""Fast unit tests for TAP Stack by testing synthesized Terraform JSON."""
import json
import os
import pytest
from cdktf import App
from lib.tap_stack import TapStack


class TestTapStackTerraform:
    """Unit tests validating synthesized Terraform configuration."""

    @pytest.fixture(scope="class")
    def terraform_json(self):
        """Load or generate synthesized Terraform JSON configuration."""
        # CDKTF synthesizes to cdktf.out/stacks/<stack-name>/cdk.tf.json
        stack_name = "TapStackdev"  # Default from tap.py
        terraform_path = f"cdktf.out/stacks/{stack_name}/cdk.tf.json"

        # If file doesn't exist, generate it
        if not os.path.exists(terraform_path):
            # Try to find any stack directory
            stacks_dir = "cdktf.out/stacks"
            if os.path.exists(stacks_dir):
                stack_dirs = [d for d in os.listdir(stacks_dir) if os.path.isdir(os.path.join(stacks_dir, d))]
                if stack_dirs:
                    terraform_path = f"{stacks_dir}/{stack_dirs[0]}/cdk.tf.json"

        # If still not found, synthesize the stack
        if not os.path.exists(terraform_path):
            app = App()
            TapStack(
                app,
                stack_name,
                environment_suffix='dev',
                state_bucket='iac-rlhf-tf-states',
                state_bucket_region='us-east-1',
                aws_region='us-east-1',
                default_tags={'Environment': 'dev'}
            )
            app.synth()
            
            # Check if file was created
            if not os.path.exists(terraform_path):
                pytest.fail(f"Failed to synthesize Terraform JSON at {terraform_path}")

        with open(terraform_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_terraform_json_structure(self, terraform_json):
        """Verify basic Terraform JSON structure."""
        assert 'terraform' in terraform_json
        assert 'resource' in terraform_json
        assert 'provider' in terraform_json

    def test_aws_provider_configured(self, terraform_json):
        """Test AWS provider is configured."""
        providers = terraform_json.get('provider', {})
        assert 'aws' in providers

    def test_terraform_backend_configured(self, terraform_json):
        """Test Terraform S3 backend is configured."""
        terraform_config = terraform_json.get('terraform', {})
        assert 'backend' in terraform_config
        assert 's3' in terraform_config['backend']

    def test_s3_bucket_resource_exists(self, terraform_json):
        """Test S3 bucket resource for audit logs exists."""
        resources = terraform_json.get('resource', {})
        s3_buckets = resources.get('aws_s3_bucket', {})

        # Check for audit logs bucket
        assert any('audit' in key or 'transaction' in key for key in s3_buckets.keys())

        # Verify force_destroy is set
        for bucket_config in s3_buckets.values():
            assert bucket_config.get('force_destroy') is True

    def test_s3_bucket_versioning_exists(self, terraform_json):
        """Test S3 bucket versioning configuration exists."""
        resources = terraform_json.get('resource', {})
        versioning_configs = resources.get('aws_s3_bucket_versioning', {})

        assert len(versioning_configs) > 0

        # Verify versioning is enabled
        for config in versioning_configs.values():
            versioning_config = config.get('versioning_configuration', {})
            assert versioning_config.get('status') == 'Enabled'

    def test_s3_bucket_encryption_exists(self, terraform_json):
        """Test S3 bucket encryption configuration exists."""
        resources = terraform_json.get('resource', {})
        encryption_configs = resources.get('aws_s3_bucket_server_side_encryption_configuration', {})

        assert len(encryption_configs) > 0

        # Verify encryption rule exists
        for config in encryption_configs.values():
            rules = config.get('rule', [])
            assert len(rules) > 0

    def test_s3_lifecycle_policies_exist(self, terraform_json):
        """Test S3 lifecycle policies are configured."""
        resources = terraform_json.get('resource', {})
        lifecycle_configs = resources.get('aws_s3_bucket_lifecycle_configuration', {})

        assert len(lifecycle_configs) > 0

        # Verify lifecycle rules
        for config in lifecycle_configs.values():
            rules = config.get('rule', [])
            assert len(rules) == 3  # IA, Glacier, Expiration

    def test_dynamodb_table_exists(self, terraform_json):
        """Test DynamoDB table resource exists with correct configuration."""
        resources = terraform_json.get('resource', {})
        dynamodb_tables = resources.get('aws_dynamodb_table', {})

        # Check for transactions table
        assert any('transaction' in key for key in dynamodb_tables.keys())

        # Verify table configuration
        for table_config in dynamodb_tables.values():
            assert table_config.get('billing_mode') == 'PAY_PER_REQUEST'
            assert table_config.get('hash_key') == 'transaction_id'
            assert table_config.get('range_key') == 'timestamp'

            # Verify point-in-time recovery
            pitr = table_config.get('point_in_time_recovery', {})
            assert pitr.get('enabled') is True

    def test_sns_topic_exists(self, terraform_json):
        """Test SNS topic for alerts exists."""
        resources = terraform_json.get('resource', {})
        sns_topics = resources.get('aws_sns_topic', {})

        assert any('alert' in key or 'transaction' in key for key in sns_topics.keys())

    def test_sns_subscriptions_exist(self, terraform_json):
        """Test SNS topic subscriptions exist."""
        resources = terraform_json.get('resource', {})
        subscriptions = resources.get('aws_sns_topic_subscription', {})

        assert len(subscriptions) >= 2  # Email and SMS

    def test_eventbridge_event_bus_exists(self, terraform_json):
        """Test EventBridge custom event bus exists."""
        resources = terraform_json.get('resource', {})
        event_buses = resources.get('aws_cloudwatch_event_bus', {})

        assert any('payment' in key or 'event' in key for key in event_buses.keys())

    def test_eventbridge_dlq_exists(self, terraform_json):
        """Test EventBridge DLQ exists."""
        resources = terraform_json.get('resource', {})
        sqs_queues = resources.get('aws_sqs_queue', {})

        assert any('dlq' in key for key in sqs_queues.keys())

    def test_ecr_repositories_exist(self, terraform_json):
        """Test ECR repositories exist for Lambda container images."""
        resources = terraform_json.get('resource', {})
        ecr_repos = resources.get('aws_ecr_repository', {})

        assert len(ecr_repos) >= 3  # webhook-validator, fraud-detector, archival

        # Verify image scanning is enabled
        for repo_config in ecr_repos.values():
            scan_config = repo_config.get('image_scanning_configuration', {})
            assert scan_config.get('scan_on_push') is True

            # Verify force_delete for CI/CD
            assert repo_config.get('force_delete') is True

    def test_cloudwatch_log_groups_exist(self, terraform_json):
        """Test CloudWatch log groups exist."""
        resources = terraform_json.get('resource', {})
        log_groups = resources.get('aws_cloudwatch_log_group', {})

        assert len(log_groups) >= 5  # Lambda functions, API Gateway, Step Functions

        # Verify retention is 30 days
        for log_group_config in log_groups.values():
            assert log_group_config.get('retention_in_days') == 30

    def test_lambda_iam_role_exists(self, terraform_json):
        """Test IAM role for Lambda functions exists."""
        resources = terraform_json.get('resource', {})
        iam_roles = resources.get('aws_iam_role', {})

        # Check for Lambda execution role
        assert any('lambda' in key for key in iam_roles.keys())

    def test_lambda_iam_policy_attachment_exists(self, terraform_json):
        """Test Lambda IAM managed policy attachment exists."""
        resources = terraform_json.get('resource', {})
        policy_attachments = resources.get('aws_iam_role_policy_attachment', {})

        assert len(policy_attachments) > 0

    def test_lambda_functions_exist(self, terraform_json):
        """Test Lambda functions exist with ZIP-based placeholder configuration."""
        resources = terraform_json.get('resource', {})
        lambda_functions = resources.get('aws_lambda_function', {})

        assert len(lambda_functions) >= 3  # webhook-validator, fraud-detector, archival

        # Verify Lambda configuration
        for func_config in lambda_functions.values():
            # Verify runtime is set (ZIP-based deployment)
            assert func_config.get('runtime') == 'python3.11'
            
            # Verify handler is set
            assert func_config.get('handler') == 'index.lambda_handler'

            # Verify architecture (x86_64 for ZIP-based placeholder)
            architectures = func_config.get('architectures', [])
            assert 'x86_64' in architectures or 'arm64' in architectures

            # Verify X-Ray tracing
            tracing_config = func_config.get('tracing_config', {})
            assert tracing_config.get('mode') == 'Active'

    def test_lambda_webhook_validator_configuration(self, terraform_json):
        """Test webhook validator Lambda has correct configuration."""
        resources = terraform_json.get('resource', {})
        lambda_functions = resources.get('aws_lambda_function', {})

        webhook_validators = {k: v for k, v in lambda_functions.items() if 'webhook' in k and 'validator' in k}

        assert len(webhook_validators) > 0

        for func_config in webhook_validators.values():
            assert func_config.get('memory_size') == 1024
            assert func_config.get('timeout') == 30

    def test_lambda_fraud_detector_configuration(self, terraform_json):
        """Test fraud detector Lambda has correct configuration."""
        resources = terraform_json.get('resource', {})
        lambda_functions = resources.get('aws_lambda_function', {})

        fraud_detectors = {k: v for k, v in lambda_functions.items() if 'fraud' in k}

        assert len(fraud_detectors) > 0

        for func_config in fraud_detectors.values():
            assert func_config.get('memory_size') == 512
            assert func_config.get('timeout') == 60

    def test_lambda_archival_configuration(self, terraform_json):
        """Test archival Lambda has correct configuration."""
        resources = terraform_json.get('resource', {})
        lambda_functions = resources.get('aws_lambda_function', {})

        archival_functions = {k: v for k, v in lambda_functions.items() if 'archival' in k}

        assert len(archival_functions) > 0

        for func_config in archival_functions.values():
            assert func_config.get('timeout') == 300  # 5 minutes for batch processing

    def test_api_gateway_rest_api_exists(self, terraform_json):
        """Test API Gateway REST API exists."""
        resources = terraform_json.get('resource', {})
        rest_apis = resources.get('aws_api_gateway_rest_api', {})

        assert any('webhook' in key or 'api' in key for key in rest_apis.keys())

    def test_api_gateway_resource_exists(self, terraform_json):
        """Test API Gateway /webhook resource exists."""
        resources = terraform_json.get('resource', {})
        api_resources = resources.get('aws_api_gateway_resource', {})

        # Verify /webhook resource
        assert any(
            resource.get('path_part') == 'webhook'
            for resource in api_resources.values()
        )

    def test_api_gateway_method_exists(self, terraform_json):
        """Test API Gateway POST method exists."""
        resources = terraform_json.get('resource', {})
        methods = resources.get('aws_api_gateway_method', {})

        # Verify POST method
        assert any(
            method.get('http_method') == 'POST'
            for method in methods.values()
        )

    def test_api_gateway_integration_exists(self, terraform_json):
        """Test API Gateway Lambda integration exists."""
        resources = terraform_json.get('resource', {})
        integrations = resources.get('aws_api_gateway_integration', {})

        assert len(integrations) > 0

        # Verify AWS_PROXY integration
        for integration in integrations.values():
            assert integration.get('type') == 'AWS_PROXY'
            assert integration.get('integration_http_method') == 'POST'

    def test_api_gateway_lambda_permission_exists(self, terraform_json):
        """Test Lambda permission for API Gateway exists."""
        resources = terraform_json.get('resource', {})
        permissions = resources.get('aws_lambda_permission', {})

        assert len(permissions) > 0

    def test_api_gateway_deployment_exists(self, terraform_json):
        """Test API Gateway deployment exists."""
        resources = terraform_json.get('resource', {})
        deployments = resources.get('aws_api_gateway_deployment', {})

        assert len(deployments) > 0

    def test_api_gateway_stage_exists(self, terraform_json):
        """Test API Gateway stage exists with X-Ray tracing."""
        resources = terraform_json.get('resource', {})
        stages = resources.get('aws_api_gateway_stage', {})

        assert len(stages) > 0

        # Verify X-Ray tracing
        for stage in stages.values():
            assert stage.get('xray_tracing_enabled') is True

    def test_step_functions_iam_role_exists(self, terraform_json):
        """Test Step Functions IAM role exists."""
        resources = terraform_json.get('resource', {})
        iam_roles = resources.get('aws_iam_role', {})

        # Check for Step Functions role
        assert any('step' in key or 'sfn' in key for key in iam_roles.keys())

    def test_step_functions_state_machine_exists(self, terraform_json):
        """Test Step Functions state machine exists."""
        resources = terraform_json.get('resource', {})
        state_machines = resources.get('aws_sfn_state_machine', {})

        assert len(state_machines) > 0

        # Verify EXPRESS type
        for sm in state_machines.values():
            assert sm.get('type') == 'EXPRESS'

            # Verify logging configuration
            logging_config = sm.get('logging_configuration', {})
            assert logging_config.get('level') == 'ALL'
            assert logging_config.get('include_execution_data') is True

            # Verify X-Ray tracing
            tracing_config = sm.get('tracing_configuration', {})
            assert tracing_config.get('enabled') is True

    def test_step_functions_definition_structure(self, terraform_json):
        """Test Step Functions state machine definition has parallel processing."""
        resources = terraform_json.get('resource', {})
        state_machines = resources.get('aws_sfn_state_machine', {})

        assert len(state_machines) > 0

        for sm in state_machines.values():
            definition_str = sm.get('definition', '{}')
            definition = json.loads(definition_str)

            # Verify parallel processing
            states = definition.get('States', {})
            assert 'ProcessTransaction' in states
            assert states['ProcessTransaction']['Type'] == 'Parallel'

    def test_eventbridge_rules_exist(self, terraform_json):
        """Test EventBridge rules for amount-based routing exist."""
        resources = terraform_json.get('resource', {})
        rules = resources.get('aws_cloudwatch_event_rule', {})

        assert len(rules) >= 3  # high-value, medium-value, low-value

    def test_eventbridge_targets_exist(self, terraform_json):
        """Test EventBridge targets exist."""
        resources = terraform_json.get('resource', {})
        targets = resources.get('aws_cloudwatch_event_target', {})

        assert len(targets) >= 2  # high-value and medium-value targets

        # Verify DLQ configuration
        for target in targets.values():
            dlq_config = target.get('dead_letter_config', {})
            assert 'arn' in dlq_config

    def test_eventbridge_target_iam_role_exists(self, terraform_json):
        """Test EventBridge targets IAM role exists."""
        resources = terraform_json.get('resource', {})
        iam_roles = resources.get('aws_iam_role', {})

        # Check for EventBridge target role
        assert any('eventbridge' in key or 'target' in key for key in iam_roles.keys())

    def test_cloudwatch_dashboard_exists(self, terraform_json):
        """Test CloudWatch dashboard exists."""
        resources = terraform_json.get('resource', {})
        dashboards = resources.get('aws_cloudwatch_dashboard', {})

        assert len(dashboards) > 0

    def test_cloudwatch_dashboard_widgets(self, terraform_json):
        """Test CloudWatch dashboard has metric widgets."""
        resources = terraform_json.get('resource', {})
        dashboards = resources.get('aws_cloudwatch_dashboard', {})

        assert len(dashboards) > 0

        for dashboard in dashboards.values():
            dashboard_body_str = dashboard.get('dashboard_body', '{}')
            dashboard_body = json.loads(dashboard_body_str)

            widgets = dashboard_body.get('widgets', [])
            assert len(widgets) >= 7

    def test_resource_naming_includes_environment_suffix(self, terraform_json):
        """Test all named resources include environment suffix reference."""
        resources = terraform_json.get('resource', {})

        # Check for environment suffix in resource names
        resources_with_suffix = 0

        for resource_type, resource_instances in resources.items():
            for resource_config in resource_instances.values():
                # Check various name fields
                name_fields = ['name', 'bucket', 'function_name', 'dashboard_name']

                for field in name_fields:
                    if field in resource_config:
                        name = resource_config[field]
                        if isinstance(name, str) and ('${' in name or '-dev' in name or '-test' in name):
                            resources_with_suffix += 1
                            break

        assert resources_with_suffix > 10  # At least 10 resources should have environment suffix
