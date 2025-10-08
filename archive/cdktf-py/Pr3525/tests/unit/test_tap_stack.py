"""Unit tests for TAP Stack."""
import os
import sys
import json
import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TAP Stack."""

    def setup_method(self):
        """Set up test environment."""
        self.app = App()
        self.test_env_suffix = "test123"

    def test_tap_stack_instantiates_with_default_values(self):
        """Test that TapStack instantiates successfully with default values."""
        stack = TapStack(
            self.app,
            "TestStack"
        )

        assert stack is not None
        synthesis = Testing.synth(stack)
        assert synthesis is not None

    def test_tap_stack_instantiates_with_custom_values(self):
        """Test that TapStack instantiates successfully with custom values."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix,
            aws_region="us-west-2",
            state_bucket="custom-bucket",
            state_bucket_region="eu-west-1"
        )

        assert stack is not None
        synthesis = Testing.synth(stack)
        assert synthesis is not None

    def test_s3_bucket_created_with_versioning(self):
        """Test that S3 bucket is created with versioning enabled."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        s3_buckets = [r for r in synthesis['resource'].get('aws_s3_bucket', {}).values()]
        assert len(s3_buckets) > 0

        # Check versioning configuration exists
        versioning_configs = synthesis['resource'].get('aws_s3_bucket_versioning', {})
        assert len(versioning_configs) > 0

    def test_dynamodb_table_created_with_gsi(self):
        """Test that DynamoDB table is created with GSI."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        tables = synthesis['resource'].get('aws_dynamodb_table', {})
        assert len(tables) > 0

        # Check that table has the email GSI
        for table_config in tables.values():
            if 'global_secondary_index' in table_config:
                gsi = table_config['global_secondary_index'][0]
                assert gsi['name'] == 'EmailIndex'
                assert gsi['hash_key'] == 'email'

    def test_api_gateway_created_with_cors(self):
        """Test that API Gateway is created with CORS configuration."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))

        # Check API Gateway REST API exists
        apis = synthesis['resource'].get('aws_api_gateway_rest_api', {})
        assert len(apis) > 0

        # Check OPTIONS method exists for CORS
        methods = synthesis['resource'].get('aws_api_gateway_method', {})
        options_methods = [m for m in methods.values() if m.get('http_method') == 'OPTIONS']
        assert len(options_methods) > 0

    def test_lambda_functions_created_with_environment_variables(self):
        """Test that Lambda functions are created with environment variables."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        lambdas = synthesis['resource'].get('aws_lambda_function', {})
        assert len(lambdas) >= 2  # Should have validation and workflow functions

        # Check environment variables - validation Lambda has both, workflow Lambda has S3_BUCKET
        validation_lambda_found = False
        workflow_lambda_found = False

        for lambda_config in lambdas.values():
            if 'environment' in lambda_config:
                env = lambda_config['environment']
                if isinstance(env, dict) and 'variables' in env:
                    env_vars = env['variables']
                elif isinstance(env, list) and len(env) > 0 and 'variables' in env[0]:
                    env_vars = env[0]['variables']
                else:
                    continue

                # Check if this is validation Lambda (has DYNAMODB_TABLE)
                if 'DYNAMODB_TABLE' in env_vars and 'S3_BUCKET' in env_vars:
                    validation_lambda_found = True
                # Check if this is workflow Lambda (has S3_BUCKET only)
                elif 'S3_BUCKET' in env_vars:
                    workflow_lambda_found = True

        assert validation_lambda_found, "Validation Lambda with DYNAMODB_TABLE and S3_BUCKET not found"
        assert workflow_lambda_found, "Workflow Lambda with S3_BUCKET not found"

    def test_cloudwatch_alarms_created(self):
        """Test that CloudWatch alarms are created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        alarms = synthesis['resource'].get('aws_cloudwatch_metric_alarm', {})
        assert len(alarms) > 0

        # Check error rate alarm configuration
        for alarm_config in alarms.values():
            if 'lambda_errors' in alarm_config.get('alarm_name', ''):
                assert alarm_config['threshold'] == 5
                assert alarm_config['evaluation_periods'] == 2

    def test_ses_configuration_created(self):
        """Test that SES configuration is created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))

        # Check SES email identity
        email_identities = synthesis['resource'].get('aws_ses_email_identity', {})
        assert len(email_identities) > 0

        # Check SES template
        templates = synthesis['resource'].get('aws_ses_template', {})
        assert len(templates) > 0

    def test_step_functions_state_machine_created(self):
        """Test that Step Functions state machine is created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        state_machines = synthesis['resource'].get('aws_sfn_state_machine', {})
        assert len(state_machines) > 0

        # Check state machine configuration
        for sm_config in state_machines.values():
            assert 'definition' in sm_config
            definition = json.loads(sm_config['definition'])
            assert 'States' in definition
            # Check for key states in the workflow
            assert 'ValidateForm' in definition['States']
            assert 'CheckFormType' in definition['States']

    def test_iam_roles_and_policies_created(self):
        """Test that IAM roles and policies are created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))

        # Check IAM roles
        roles = synthesis['resource'].get('aws_iam_role', {})
        assert len(roles) >= 2  # Lambda role and Step Functions role

        # Check IAM policies
        policies = synthesis['resource'].get('aws_iam_policy', {})
        assert len(policies) > 0

    def test_api_gateway_usage_plan_created(self):
        """Test that API Gateway usage plan is created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))

        # Check usage plan
        usage_plans = synthesis['resource'].get('aws_api_gateway_usage_plan', {})
        assert len(usage_plans) > 0

        # Check throttle settings
        for plan_config in usage_plans.values():
            if 'throttle_settings' in plan_config:
                throttle = plan_config['throttle_settings']
                if isinstance(throttle, list) and len(throttle) > 0:
                    throttle = throttle[0]
                assert throttle['rate_limit'] == 500
                assert throttle['burst_limit'] == 1000

    def test_terraform_outputs_created(self):
        """Test that Terraform outputs are created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        outputs = synthesis.get('output', {})

        # Check key outputs exist
        expected_outputs = ['api_endpoint', 'dynamodb_table', 's3_bucket', 'state_machine_arn']
        for output_name in expected_outputs:
            assert output_name in outputs

    def test_s3_lifecycle_configuration(self):
        """Test that S3 lifecycle configuration is set up."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        lifecycle_configs = synthesis['resource'].get('aws_s3_bucket_lifecycle_configuration', {})
        assert len(lifecycle_configs) > 0

        # Check lifecycle rule configuration
        for config in lifecycle_configs.values():
            rule = config['rule'][0]
            assert rule['status'] == 'Enabled'
            assert rule['transition'][0]['days'] == 90
            assert rule['transition'][0]['storage_class'] == 'GLACIER'

    def test_cloudwatch_log_groups_created(self):
        """Test that CloudWatch log groups are created."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))
        log_groups = synthesis['resource'].get('aws_cloudwatch_log_group', {})
        assert len(log_groups) >= 2  # Lambda logs and Step Functions logs

        # Check retention settings
        for log_group in log_groups.values():
            assert log_group['retention_in_days'] == 7

    def test_environment_suffix_applied_to_resources(self):
        """Test that environment suffix is applied to resource names."""
        stack = TapStack(
            self.app,
            "TestStack",
            environment_suffix=self.test_env_suffix
        )

        synthesis = json.loads(Testing.synth(stack))

        # Check S3 bucket name includes suffix
        buckets = synthesis['resource'].get('aws_s3_bucket', {})
        for bucket in buckets.values():
            assert self.test_env_suffix in bucket['bucket']

        # Check DynamoDB table name includes suffix
        tables = synthesis['resource'].get('aws_dynamodb_table', {})
        for table in tables.values():
            assert self.test_env_suffix in table['name']