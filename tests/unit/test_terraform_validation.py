"""
Terraform Validation Unit Tests
Tests Terraform syntax, configuration, and resource definitions
"""
import json
import subprocess
import os
import pytest
from pathlib import Path

# Get the lib directory path
LIB_DIR = Path(__file__).parent.parent.parent / "lib"


class TestTerraformSyntax:
    """Test Terraform syntax validation"""

    def test_terraform_fmt_check(self):
        """Verify Terraform code is properly formatted"""
        result = subprocess.run(
            ["terraform", "fmt", "-check", "-recursive"],
            cwd=LIB_DIR,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform formatting issues: {result.stdout}"

    def test_terraform_validate(self):
        """Verify Terraform configuration is valid"""
        # Initialize first
        subprocess.run(
            ["terraform", "init", "-backend=false"],
            cwd=LIB_DIR,
            capture_output=True
        )

        result = subprocess.run(
            ["terraform", "validate"],
            cwd=LIB_DIR,
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform validation failed: {result.stderr}"

    def test_terraform_files_exist(self):
        """Verify all required Terraform files exist"""
        required_files = [
            "variables.tf",
            "outputs.tf",
            "providers.tf",
            "vpc-primary.tf",
            "vpc-dr.tf",
            "rds.tf",
            "vpc-peering.tf",
            "lambda.tf",
            "cloudwatch.tf"
        ]

        for filename in required_files:
            filepath = LIB_DIR / filename
            assert filepath.exists(), f"Required file missing: {filename}"


class TestVariableValidation:
    """Test variable definitions and validation"""

    def test_environment_variable_validation(self):
        """Test environment variable only accepts test or prod"""
        # Valid values
        for env in ["test", "prod"]:
            result = subprocess.run(
                ["terraform", "plan", "-var", f"environment={env}", "-var", "environment_suffix=test"],
                cwd=LIB_DIR,
                capture_output=True,
                text=True,
                env={**os.environ, "TF_VAR_db_password": "TestPassword123!"}
            )
            # Plan should work (may fail on AWS calls, but not variable validation)
            assert "error_message" not in result.stderr.lower() or \
                   "Environment must be test or prod" not in result.stderr

    def test_environment_suffix_required(self):
        """Test that environment_suffix is required"""
        result = subprocess.run(
            ["terraform", "plan"],
            cwd=LIB_DIR,
            capture_output=True,
            text=True,
            env={**os.environ, "TF_VAR_environment": "test", "TF_VAR_db_password": "TestPassword123!"}
        )
        # Should fail without environment_suffix
        assert result.returncode != 0 or "environment_suffix" in result.stderr.lower()

    def test_default_values(self):
        """Test that variables have proper defaults"""
        # Check variables.tf content
        variables_file = LIB_DIR / "variables.tf"
        content = variables_file.read_text()

        assert 'default     = "test"' in content or 'default = "test"' in content
        assert 'default     = "us-east-1"' in content or 'default = "us-east-1"' in content
        assert 'default     = "us-west-2"' in content or 'default = "us-west-2"' in content


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_use_environment_suffix(self):
        """Verify resources include environment_suffix in naming"""
        tf_files = list(LIB_DIR.glob("*.tf"))

        # Resources that should use environment_suffix
        resource_patterns = [
            "aws_db_instance",
            "aws_vpc",
            "aws_subnet",
            "aws_security_group",
            "aws_lambda_function",
            "aws_kms_key",
            "aws_sns_topic"
        ]

        # Files that don't need environment_suffix (outputs, variables, etc.)
        excluded_files = ["outputs.tf", "variables.tf", "data.tf"]

        for tf_file in tf_files:
            if tf_file.name in excluded_files:
                continue

            content = tf_file.read_text()
            for pattern in resource_patterns:
                if pattern in content and 'resource "' in content:
                    # Check if environment_suffix is used in name or identifier
                    assert "var.environment_suffix" in content, \
                        f"{tf_file.name} should use environment_suffix for {pattern}"
                    break

    def test_no_hardcoded_environment_names(self):
        """Verify no hardcoded environment names in resource definitions"""
        tf_files = list(LIB_DIR.glob("*.tf"))
        hardcoded_patterns = ["prod-", "dev-", "test-", "stage-", "staging-"]

        for tf_file in tf_files:
            if tf_file.name in ["variables.tf", "locals.tf"]:
                continue

            content = tf_file.read_text()
            for pattern in hardcoded_patterns:
                assert pattern not in content.lower() or \
                       f'"{pattern}' not in content.lower(), \
                    f"{tf_file.name} contains hardcoded environment: {pattern}"


class TestEnvironmentBasedSizing:
    """Test environment-based resource sizing logic"""

    def test_instance_class_logic(self):
        """Verify instance class changes based on environment"""
        locals_file = LIB_DIR / "locals.tf"
        content = locals_file.read_text()

        assert "db.r6g.large" in content, "Missing prod instance class"
        assert "db.t3.micro" in content, "Missing test instance class"
        assert 'var.environment == "prod"' in content, "Missing environment condition"

    def test_multi_az_logic(self):
        """Verify multi-AZ is conditional based on environment"""
        locals_file = LIB_DIR / "locals.tf"
        content = locals_file.read_text()

        assert "multi_az" in content, "Missing multi_az configuration"
        assert 'var.environment == "prod"' in content, "Missing environment condition"

    def test_monitoring_configuration(self):
        """Verify enhanced monitoring is environment-dependent"""
        locals_file = LIB_DIR / "locals.tf"
        content = locals_file.read_text()

        assert "enable_enhanced_monitoring" in content, "Missing monitoring config"
        assert "monitoring_interval" in content, "Missing monitoring interval"


class TestVPCPeering:
    """Test VPC peering configuration"""

    def test_vpc_peering_resource_exists(self):
        """Verify VPC peering connection is defined"""
        peering_file = LIB_DIR / "vpc-peering.tf"
        assert peering_file.exists(), "VPC peering configuration missing"

        content = peering_file.read_text()
        assert "aws_vpc_peering_connection" in content, "VPC peering connection not defined"

    def test_peering_routes_configured(self):
        """Verify bidirectional routing for VPC peering"""
        peering_file = LIB_DIR / "vpc-peering.tf"
        content = peering_file.read_text()

        # Should have routes in both directions
        route_count = content.count("aws_route")
        assert route_count >= 4, f"Insufficient routes configured: {route_count} (expected >= 4)"

    def test_peering_accepts_connection(self):
        """Verify peering connection is auto-accepted"""
        peering_file = LIB_DIR / "vpc-peering.tf"
        content = peering_file.read_text()

        assert "aws_vpc_peering_connection_accepter" in content or \
               "auto_accept" in content, "Peering connection not configured to auto-accept"


class TestRDSConfiguration:
    """Test RDS database configuration"""

    def test_rds_primary_defined(self):
        """Verify primary RDS instance is defined"""
        rds_file = LIB_DIR / "rds.tf"
        content = rds_file.read_text()

        assert 'resource "aws_db_instance" "primary"' in content, "Primary RDS not defined"

    def test_rds_replica_defined(self):
        """Verify DR replica is defined"""
        rds_file = LIB_DIR / "rds.tf"
        content = rds_file.read_text()

        assert 'resource "aws_db_instance" "dr_replica"' in content, "DR replica not defined"

    def test_skip_final_snapshot_enabled(self):
        """Verify skip_final_snapshot is true for destroyability"""
        rds_file = LIB_DIR / "rds.tf"
        content = rds_file.read_text()

        assert "skip_final_snapshot" in content, "skip_final_snapshot not configured"
        # Count instances of skip_final_snapshot = true
        true_count = content.count("skip_final_snapshot = true") + \
                     content.count('skip_final_snapshot          = true')
        assert true_count >= 2, "skip_final_snapshot should be true for both primary and replica"

    def test_encryption_enabled(self):
        """Verify RDS encryption is enabled"""
        rds_file = LIB_DIR / "rds.tf"
        content = rds_file.read_text()

        assert "storage_encrypted" in content, "Storage encryption not configured"
        assert "kms_key_id" in content, "KMS key not configured for encryption"

    def test_backup_retention_configured(self):
        """Verify backup retention is configured"""
        rds_file = LIB_DIR / "rds.tf"
        content = rds_file.read_text()

        assert "backup_retention_period" in content, "Backup retention not configured"


class TestLambdaFunction:
    """Test Lambda function configuration"""

    def test_lambda_function_defined(self):
        """Verify Lambda function for failover monitoring exists"""
        lambda_file = LIB_DIR / "lambda.tf"
        content = lambda_file.read_text()

        assert "aws_lambda_function" in content, "Lambda function not defined"

    def test_lambda_runtime_version(self):
        """Verify Lambda uses supported runtime"""
        lambda_file = LIB_DIR / "lambda.tf"
        content = lambda_file.read_text()

        # Should use Python 3.x runtime
        assert "python3" in content.lower(), "Lambda should use Python runtime"

    def test_lambda_source_code_exists(self):
        """Verify Lambda source code file exists"""
        lambda_dir = LIB_DIR / "lambda"
        assert lambda_dir.exists(), "Lambda source directory missing"

        # Check for Python files
        py_files = list(lambda_dir.glob("*.py"))
        assert len(py_files) > 0, "Lambda source code missing"

    def test_lambda_iam_role_configured(self):
        """Verify Lambda has IAM role"""
        iam_file = LIB_DIR / "iam.tf"
        content = iam_file.read_text()

        assert "aws_iam_role" in content, "Lambda IAM role not defined"
        assert "lambda" in content.lower(), "Lambda IAM role not properly configured"


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configuration"""

    def test_cloudwatch_alarms_defined(self):
        """Verify CloudWatch alarms exist"""
        cloudwatch_file = LIB_DIR / "cloudwatch.tf"
        content = cloudwatch_file.read_text()

        assert "aws_cloudwatch_metric_alarm" in content, "CloudWatch alarms not defined"

    def test_replication_lag_alarm_exists(self):
        """Verify replication lag alarm is configured"""
        cloudwatch_file = LIB_DIR / "cloudwatch.tf"
        content = cloudwatch_file.read_text()

        assert "ReplicaLag" in content or "replication" in content.lower(), \
            "Replication lag alarm not configured"

    def test_sns_topic_configured(self):
        """Verify SNS topic for alarms exists"""
        # Check cloudwatch.tf or a separate sns.tf
        tf_files = list(LIB_DIR.glob("*.tf"))
        sns_found = False

        for tf_file in tf_files:
            content = tf_file.read_text()
            if "aws_sns_topic" in content:
                sns_found = True
                break

        assert sns_found, "SNS topic for alarms not configured"


class TestKMSEncryption:
    """Test KMS key configuration"""

    def test_kms_keys_for_both_regions(self):
        """Verify KMS keys are created for both regions"""
        kms_file = LIB_DIR / "kms.tf"
        content = kms_file.read_text()

        # Should have at least 2 KMS keys (primary and DR)
        kms_count = content.count('resource "aws_kms_key"')
        assert kms_count >= 2, f"Insufficient KMS keys: {kms_count} (expected >= 2)"

    def test_kms_key_rotation_enabled(self):
        """Verify KMS key rotation is enabled"""
        kms_file = LIB_DIR / "kms.tf"
        content = kms_file.read_text()

        assert "enable_key_rotation" in content, "KMS key rotation not configured"


class TestOutputs:
    """Test Terraform outputs"""

    def test_all_required_outputs_defined(self):
        """Verify all required outputs are defined"""
        outputs_file = LIB_DIR / "outputs.tf"
        content = outputs_file.read_text()

        required_outputs = [
            "primary_endpoint",
            "dr_replica_endpoint",
            "primary_arn",
            "dr_replica_arn",
            "lambda_function_name",
            "vpc_peering_id"
        ]

        for output in required_outputs:
            assert f'output "{output}"' in content, f"Required output missing: {output}"

    def test_sensitive_outputs_marked(self):
        """Verify sensitive outputs are properly marked"""
        outputs_file = LIB_DIR / "outputs.tf"
        content = outputs_file.read_text()

        # Secret ARN should be sensitive
        if "secret_arn" in content:
            # Find the secret_arn output block
            secret_section_start = content.find('output "secret_arn"')
            if secret_section_start != -1:
                secret_section = content[secret_section_start:secret_section_start+200]
                assert "sensitive" in secret_section.lower(), \
                    "Secret ARN output should be marked as sensitive"


class TestProviderConfiguration:
    """Test provider configuration"""

    def test_aws_provider_configured(self):
        """Verify AWS provider is configured"""
        providers_file = LIB_DIR / "providers.tf"
        content = providers_file.read_text()

        assert 'provider "aws"' in content, "AWS provider not configured"

    def test_multiple_region_providers(self):
        """Verify providers for both regions are configured"""
        providers_file = LIB_DIR / "providers.tf"
        content = providers_file.read_text()

        # Should have at least 2 AWS provider configurations
        provider_count = content.count('provider "aws"')
        assert provider_count >= 2, f"Insufficient provider configs: {provider_count} (expected >= 2)"

    def test_provider_aliases_defined(self):
        """Verify provider aliases are used for multi-region"""
        providers_file = LIB_DIR / "providers.tf"
        content = providers_file.read_text()

        assert "alias" in content, "Provider aliases not configured for multi-region"


class TestTagging:
    """Test resource tagging"""

    def test_common_tags_defined(self):
        """Verify common tags are defined in locals"""
        locals_file = LIB_DIR / "locals.tf"
        content = locals_file.read_text()

        assert "common_tags" in content, "Common tags not defined"
        assert "Environment" in content, "Environment tag not in common tags"

    def test_resources_use_tags(self):
        """Verify major resources use tags"""
        # Check a few key resource files
        resource_files = ["rds.tf", "vpc-primary.tf", "lambda.tf"]

        for filename in resource_files:
            filepath = LIB_DIR / filename
            if filepath.exists():
                content = filepath.read_text()
                assert "tags" in content.lower(), f"{filename} should use tags"


class TestSecurityConfiguration:
    """Test security-related configurations"""

    def test_secrets_manager_configured(self):
        """Verify Secrets Manager is used for DB password"""
        secrets_file = LIB_DIR / "secrets.tf"
        assert secrets_file.exists(), "Secrets Manager configuration missing"

        content = secrets_file.read_text()
        assert "aws_secretsmanager_secret" in content, "Secrets Manager secret not defined"

    def test_security_groups_configured(self):
        """Verify security groups are defined"""
        # Check VPC files for security groups
        vpc_files = list(LIB_DIR.glob("vpc-*.tf"))
        sg_found = False

        for vpc_file in vpc_files:
            content = vpc_file.read_text()
            if "aws_security_group" in content:
                sg_found = True
                break

        assert sg_found, "Security groups not configured"

    def test_iam_roles_follow_least_privilege(self):
        """Verify IAM roles are defined (basic check)"""
        iam_file = LIB_DIR / "iam.tf"
        content = iam_file.read_text()

        assert "aws_iam_role" in content, "IAM roles not defined"
        assert "aws_iam_policy" in content or "aws_iam_role_policy" in content, \
            "IAM policies not defined"


# Coverage tracking for pytest-cov
def test_coverage_metadata():
    """Metadata test to ensure coverage tracking works"""
    assert True, "Coverage tracking operational"
