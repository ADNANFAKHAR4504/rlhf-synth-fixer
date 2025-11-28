"""
Unit tests for CloudWatch Observability Platform Terraform configuration
Tests all resources, configurations, and compliance requirements
"""

import json
import os
import re
import subprocess
from pathlib import Path

import pytest


class TestTerraformConfiguration:
    """Test Terraform configuration validity and structure"""

    @pytest.fixture(scope="class")
    def terraform_dir(self):
        """Get terraform directory path"""
        return Path(__file__).parent.parent / "lib"

    @pytest.fixture(scope="class")
    def terraform_plan(self, terraform_dir):
        """Generate and parse terraform plan"""
        os.chdir(terraform_dir)

        # Set required environment variable
        env = os.environ.copy()
        env['TF_VAR_environment_suffix'] = 'test-unit'

        # Run terraform plan
        result = subprocess.run(
            ['terraform', 'plan', '-out=tfplan.binary'],
            capture_output=True,
            text=True,
            env=env
        )

        if result.returncode != 0:
            pytest.fail(f"Terraform plan failed: {result.stderr}")

        # Convert binary plan to JSON
        result = subprocess.run(
            ['terraform', 'show', '-json', 'tfplan.binary'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            pytest.fail(f"Terraform show failed: {result.stderr}")

        return json.loads(result.stdout)

    def test_terraform_init(self, terraform_dir):
        """Test that terraform init succeeds"""
        os.chdir(terraform_dir)
        result = subprocess.run(
            ['terraform', 'init', '-upgrade'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform init failed: {result.stderr}"

    def test_terraform_validate(self, terraform_dir):
        """Test that terraform validate succeeds"""
        os.chdir(terraform_dir)
        result = subprocess.run(
            ['terraform', 'validate'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform validate failed: {result.stderr}"

    def test_terraform_fmt(self, terraform_dir):
        """Test that all files are properly formatted"""
        os.chdir(terraform_dir)
        result = subprocess.run(
            ['terraform', 'fmt', '-check', '-recursive'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform fmt check failed - files need formatting: {result.stdout}"


class TestResourceNaming:
    """Test that all resources include environment_suffix"""

    @pytest.fixture(scope="class")
    def terraform_files(self):
        """Get all terraform files"""
        tf_dir = Path(__file__).parent.parent / "lib"
        return list(tf_dir.glob("*.tf"))

    def test_environment_suffix_in_resource_names(self, terraform_files):
        """Test that all named resources include environment_suffix"""
        resources_without_suffix = []

        for tf_file in terraform_files:
            content = tf_file.read_text()

            # Find resource definitions with name attributes
            resource_blocks = re.finditer(
                r'resource\s+"([^"]+)"\s+"([^"]+)"\s+{([^}]+(?:{[^}]+}[^}]+)*)}',
                content,
                re.DOTALL
            )

            for match in resource_blocks:
                resource_type = match.group(1)
                resource_name = match.group(2)
                resource_body = match.group(3)

                # Skip resources that don't have name attributes
                skip_types = [
                    'aws_iam_role_policy_attachment',
                    'aws_s3_bucket_public_access_block',
                    'aws_s3_bucket_server_side_encryption_configuration',
                    'aws_s3_bucket_lifecycle_configuration',
                    'aws_s3_bucket_versioning',
                    'aws_s3_bucket_policy',
                    'aws_lambda_permission',
                    'data'
                ]

                if any(resource_type.startswith(skip) for skip in skip_types):
                    continue

                # Check if resource has name attribute with environment_suffix
                name_match = re.search(r'name\s*=\s*"([^"]*\$\{[^}]*environment_suffix[^}]*\}[^"]*)"', resource_body)
                if not name_match and 'name' in resource_body:
                    # Check for local.name_prefix which includes environment_suffix
                    if 'local.name_prefix' not in resource_body:
                        resources_without_suffix.append(f"{tf_file.name}: {resource_type}.{resource_name}")

        assert len(resources_without_suffix) == 0, \
            f"Resources without environment_suffix: {resources_without_suffix}"


class TestRequiredTags:
    """Test that all resources have required tags"""

    @pytest.fixture(scope="class")
    def terraform_files(self):
        """Get all terraform files"""
        tf_dir = Path(__file__).parent.parent / "lib"
        return list(tf_dir.glob("*.tf"))

    def test_required_tags_present(self, terraform_files):
        """Test that resources have required tags"""
        required_tags = ['CostCenter', 'Environment', 'DataClassification']

        # Default tags are set in provider, so we just verify that's configured
        main_tf = Path(__file__).parent.parent / "lib" / "main.tf"
        content = main_tf.read_text()

        for tag in required_tags:
            assert tag in content, f"Required tag {tag} not found in default_tags"

        # Verify default_tags block exists
        assert 'default_tags' in content, "default_tags block not found in provider configuration"


class TestS3Configuration:
    """Test S3 bucket configurations"""

    @pytest.fixture(scope="class")
    def s3_config(self):
        """Read S3 configuration"""
        s3_file = Path(__file__).parent.parent / "lib" / "s3.tf"
        return s3_file.read_text()

    def test_s3_public_access_blocked(self, s3_config):
        """Test that S3 buckets have public access blocked"""
        assert 'aws_s3_bucket_public_access_block' in s3_config
        assert 'block_public_acls       = true' in s3_config
        assert 'block_public_policy     = true' in s3_config

    def test_s3_encryption_enabled(self, s3_config):
        """Test that S3 buckets have encryption enabled"""
        assert 'aws_s3_bucket_server_side_encryption_configuration' in s3_config
        assert 'sse_algorithm' in s3_config

    def test_s3_lifecycle_policy(self, s3_config):
        """Test that S3 buckets have lifecycle policies"""
        assert 'aws_s3_bucket_lifecycle_configuration' in s3_config
        assert 'STANDARD_IA' in s3_config
        assert 'GLACIER_IR' in s3_config
        assert 'DEEP_ARCHIVE' in s3_config
        assert 'var.metric_retention_days' in s3_config


class TestLambdaConfiguration:
    """Test Lambda function configurations"""

    @pytest.fixture(scope="class")
    def lambda_config(self):
        """Read Lambda configuration"""
        lambda_file = Path(__file__).parent.parent / "lib" / "lambda.tf"
        return lambda_file.read_text()

    def test_lambda_arm_architecture(self, lambda_config):
        """Test that Lambda functions use ARM architecture (Graviton2)"""
        # Count Lambda function definitions
        lambda_count = lambda_config.count('resource "aws_lambda_function"')
        # Count ARM architecture specifications
        arm_count = lambda_config.count('architectures = ["arm64"]')

        assert lambda_count > 0, "No Lambda functions defined"
        assert arm_count == lambda_count, \
            f"Not all Lambda functions use ARM architecture: {arm_count}/{lambda_count}"

    def test_lambda_runtime(self, lambda_config):
        """Test that Lambda functions use supported runtimes"""
        assert 'runtime' in lambda_config
        # Should use Python 3.x runtime
        assert 'python3.' in lambda_config

    def test_lambda_iam_role(self, lambda_config):
        """Test that Lambda functions have IAM roles"""
        lambda_count = lambda_config.count('resource "aws_lambda_function"')
        role_references = lambda_config.count('role')
        assert role_references >= lambda_count


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configurations"""

    @pytest.fixture(scope="class")
    def alarm_config(self):
        """Read CloudWatch alarms configuration"""
        alarm_file = Path(__file__).parent.parent / "lib" / "cloudwatch_alarms.tf"
        return alarm_file.read_text()

    def test_composite_alarms_exist(self, alarm_config):
        """Test that composite alarms are defined"""
        assert 'aws_cloudwatch_composite_alarm' in alarm_config

    def test_alarm_actions_configured(self, alarm_config):
        """Test that alarms have actions configured"""
        assert 'alarm_actions' in alarm_config
        assert 'sns' in alarm_config.lower()

    def test_multiple_metrics_in_composite_alarms(self, alarm_config):
        """Test that composite alarms monitor multiple metrics"""
        # Find composite alarm definitions
        composite_alarms = re.findall(
            r'resource "aws_cloudwatch_composite_alarm"[^{]*{[^}]*alarm_rule\s*=\s*"([^"]*)"',
            alarm_config,
            re.DOTALL
        )

        assert len(composite_alarms) > 0, "No composite alarms found"

        # Check that alarm rules contain AND/OR logic
        for alarm_rule in composite_alarms:
            has_logic = 'AND' in alarm_rule or 'OR' in alarm_rule
            assert has_logic, f"Composite alarm missing AND/OR logic: {alarm_rule}"


class TestMetricStreams:
    """Test CloudWatch Metric Streams configuration"""

    @pytest.fixture(scope="class")
    def metric_streams_config(self):
        """Read metric streams configuration"""
        streams_file = Path(__file__).parent.parent / "lib" / "metric_streams.tf"
        return streams_file.read_text()

    def test_metric_stream_to_s3(self, metric_streams_config):
        """Test that metric streams send data to S3"""
        assert 'aws_cloudwatch_metric_stream' in metric_streams_config
        assert 'firehose_arn' in metric_streams_config

    def test_metric_stream_format(self, metric_streams_config):
        """Test that metric streams use appropriate format"""
        assert 'output_format' in metric_streams_config


class TestAnomalyDetectors:
    """Test CloudWatch anomaly detector configurations"""

    @pytest.fixture(scope="class")
    def anomaly_config(self):
        """Read anomaly detectors configuration"""
        anomaly_file = Path(__file__).parent.parent / "lib" / "anomaly_detectors.tf"
        return anomaly_file.read_text()

    def test_anomaly_detectors_exist(self, anomaly_config):
        """Test that anomaly detectors are defined"""
        assert 'aws_cloudwatch_anomaly_detector' in anomaly_config

    def test_anomaly_detector_metrics(self, anomaly_config):
        """Test that anomaly detectors monitor metrics"""
        assert 'metric_name' in anomaly_config
        assert 'namespace' in anomaly_config


class TestDashboard:
    """Test CloudWatch dashboard configurations"""

    @pytest.fixture(scope="class")
    def dashboard_config(self):
        """Read dashboard configuration"""
        dashboard_file = Path(__file__).parent.parent / "lib" / "dashboard.tf"
        return dashboard_file.read_text()

    def test_dashboard_exists(self, dashboard_config):
        """Test that dashboard is defined"""
        assert 'aws_cloudwatch_dashboard' in dashboard_config

    def test_dashboard_widgets(self, dashboard_config):
        """Test that dashboard has multiple widget types"""
        # Dashboard body should be in JSON format with widgets
        assert 'dashboard_body' in dashboard_config
        assert 'widgets' in dashboard_config


class TestSynthetics:
    """Test CloudWatch Synthetics configurations"""

    @pytest.fixture(scope="class")
    def synthetics_config(self):
        """Read synthetics configuration"""
        synthetics_file = Path(__file__).parent.parent / "lib" / "synthetics.tf"
        return synthetics_file.read_text()

    def test_multi_region_canaries(self, synthetics_config):
        """Test that canaries are deployed in multiple regions"""
        primary_canary = 'api_health_primary' in synthetics_config
        secondary_canary = 'api_health_secondary' in synthetics_config

        assert primary_canary and secondary_canary, \
            "Canaries not deployed in multiple regions"

    def test_canary_runtime_version(self, synthetics_config):
        """Test that canaries use specified runtime version"""
        assert 'runtime_version' in synthetics_config

    def test_canary_artifacts_to_s3(self, synthetics_config):
        """Test that canary artifacts are stored in S3"""
        assert 'artifact_s3_location' in synthetics_config


class TestContainerInsights:
    """Test Container Insights configurations"""

    @pytest.fixture(scope="class")
    def container_insights_config(self):
        """Read container insights configuration"""
        ci_file = Path(__file__).parent.parent / "lib" / "container_insights.tf"
        return ci_file.read_text()

    def test_container_insights_enabled(self, container_insights_config):
        """Test that Container Insights is enabled"""
        assert 'container_insights' in container_insights_config.lower()


class TestCrossAccount:
    """Test cross-account observability configurations"""

    @pytest.fixture(scope="class")
    def cross_account_config(self):
        """Read cross-account configuration"""
        ca_file = Path(__file__).parent.parent / "lib" / "cross_account.tf"
        return ca_file.read_text()

    def test_cross_account_sharing(self, cross_account_config):
        """Test that cross-account sharing is configured"""
        assert 'aws_cloudwatch_' in cross_account_config or 'aws_oam_' in cross_account_config


class TestIAM:
    """Test IAM configurations"""

    @pytest.fixture(scope="class")
    def iam_config(self):
        """Read IAM configuration"""
        iam_file = Path(__file__).parent.parent / "lib" / "iam.tf"
        return iam_file.read_text()

    def test_iam_roles_exist(self, iam_config):
        """Test that IAM roles are defined"""
        assert 'aws_iam_role' in iam_config

    def test_iam_policies_exist(self, iam_config):
        """Test that IAM policies are defined"""
        assert 'aws_iam_role_policy' in iam_config or 'aws_iam_policy' in iam_config

    def test_least_privilege_policies(self, iam_config):
        """Test that IAM policies use specific resources where possible"""
        # Should not have wildcards for all resources in critical permissions
        policy_count = iam_config.count('"Resource"')
        wildcard_count = iam_config.count('"Resource": "*"')

        # At least some policies should be resource-specific
        assert policy_count > wildcard_count


class TestSNS:
    """Test SNS configurations"""

    @pytest.fixture(scope="class")
    def sns_config(self):
        """Read SNS configuration"""
        sns_file = Path(__file__).parent.parent / "lib" / "sns.tf"
        return sns_file.read_text()

    def test_sns_topics_exist(self, sns_config):
        """Test that SNS topics are defined"""
        assert 'aws_sns_topic' in sns_config

    def test_sns_subscription_filters(self, sns_config):
        """Test that SNS has subscription filters"""
        assert 'aws_sns_topic_subscription' in sns_config or 'filter_policy' in sns_config


class TestMetricFilters:
    """Test CloudWatch Logs metric filter configurations"""

    @pytest.fixture(scope="class")
    def logs_config(self):
        """Read CloudWatch Logs configuration"""
        logs_file = Path(__file__).parent.parent / "lib" / "cloudwatch_logs.tf"
        return logs_file.read_text()

    def test_metric_filters_exist(self, logs_config):
        """Test that metric filters are defined"""
        assert 'aws_cloudwatch_log_metric_filter' in logs_config

    def test_metric_transformation(self, logs_config):
        """Test that metric filters have transformations"""
        assert 'metric_transformation' in logs_config


class TestOutputs:
    """Test that required outputs are defined"""

    @pytest.fixture(scope="class")
    def outputs_config(self):
        """Read outputs configuration"""
        outputs_file = Path(__file__).parent.parent / "lib" / "outputs.tf"
        return outputs_file.read_text()

    def test_outputs_exist(self, outputs_config):
        """Test that outputs are defined"""
        assert 'output' in outputs_config

    def test_key_outputs_defined(self, outputs_config):
        """Test that key infrastructure outputs are defined"""
        # Should output key resource IDs/ARNs for integration testing
        assert len(outputs_config) > 100  # Should have substantial output definitions


class TestNoRetainPolicies:
    """Test that no resources have retain policies"""

    @pytest.fixture(scope="class")
    def all_tf_files(self):
        """Get all terraform files"""
        tf_dir = Path(__file__).parent.parent / "lib"
        content = ""
        for tf_file in tf_dir.glob("*.tf"):
            content += tf_file.read_text()
        return content

    def test_no_retain_lifecycle(self, all_tf_files):
        """Test that no resources have prevent_destroy or retain lifecycle policies"""
        assert 'prevent_destroy = true' not in all_tf_files
        assert 'DeletionPolicy' not in all_tf_files or 'DeletionPolicy: Retain' not in all_tf_files


class TestVariables:
    """Test variable configurations"""

    @pytest.fixture(scope="class")
    def variables_config(self):
        """Read variables configuration"""
        vars_file = Path(__file__).parent.parent / "lib" / "variables.tf"
        return vars_file.read_text()

    def test_environment_suffix_variable(self, variables_config):
        """Test that environment_suffix variable is defined"""
        assert 'variable "environment_suffix"' in variables_config

    def test_required_variables(self, variables_config):
        """Test that all required variables are defined"""
        required_vars = [
            'environment_suffix',
            'region',
            'cost_center',
            'environment',
            'data_classification'
        ]

        for var in required_vars:
            assert f'variable "{var}"' in variables_config

    def test_metric_retention_variable(self, variables_config):
        """Test that metric retention variable is defined with 15 months default"""
        assert 'variable "metric_retention_days"' in variables_config
        assert '450' in variables_config  # 15 months = 450 days
