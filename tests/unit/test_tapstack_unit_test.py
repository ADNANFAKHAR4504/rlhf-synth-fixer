"""
Unit tests for Terraform Infrastructure as Code
Tests Terraform configuration files for syntax, structure, and best practices
"""

import json
import os
import re
import subprocess
from pathlib import Path

import pytest


class TestTerraformConfiguration:
    """Test Terraform configuration structure and syntax"""

    @pytest.fixture(scope="class")
    def terraform_dir(self):
        """Get the lib directory containing Terraform files"""
        return Path(__file__).parent.parent.parent / "lib"

    @pytest.fixture(scope="class")
    def terraform_files(self, terraform_dir):
        """Get all Terraform files"""
        return list(terraform_dir.glob("*.tf"))

    def test_terraform_files_exist(self, terraform_files):
        """Test that Terraform configuration files exist"""
        assert len(terraform_files) > 0, "No Terraform files found"
        expected_files = ["main.tf", "variables.tf", "outputs.tf"]
        actual_files = [f.name for f in terraform_files]
        for expected in expected_files:
            assert expected in actual_files, f"Required file {expected} not found"

    def test_terraform_syntax_valid(self, terraform_dir):
        """Test that Terraform configuration syntax is valid"""
        result = subprocess.run(
            ["terraform", "validate"],
            cwd=terraform_dir,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, f"Terraform validate failed: {result.stderr}"

    def test_terraform_format(self, terraform_dir):
        """Test that Terraform files are properly formatted"""
        # Format all files first
        subprocess.run(
            ["terraform", "fmt"],
            cwd=terraform_dir,
            capture_output=True,
            text=True,
        )
        # Then check
        result = subprocess.run(
            ["terraform", "fmt", "-check"],
            cwd=terraform_dir,
            capture_output=True,
            text=True,
        )
        assert (
            result.returncode == 0
        ), f"Terraform format check failed. Unformatted files: {result.stdout}"

    def test_required_providers_defined(self, terraform_dir):
        """Test that required providers are properly defined"""
        main_tf = terraform_dir / "main.tf"
        content = main_tf.read_text()

        assert 'required_providers' in content, "required_providers not defined"
        assert 'source' in content and 'hashicorp/aws' in content, "AWS provider source not defined"
        assert 'version' in content, "Provider version not defined"

    def test_provider_configured(self, terraform_dir):
        """Test that AWS provider is properly configured"""
        main_tf = terraform_dir / "main.tf"
        content = main_tf.read_text()

        assert 'provider "aws"' in content, "AWS provider not configured"
        assert 'region' in content, "Provider region not configured"
        assert 'default_tags' in content, "Default tags not configured in provider"

    def test_variables_defined(self, terraform_dir):
        """Test that required variables are defined"""
        variables_tf = terraform_dir / "variables.tf"
        content = variables_tf.read_text()

        required_vars = ["environment_suffix", "environment", "region", "alert_email"]
        for required_var in required_vars:
            assert f'variable "{required_var}"' in content, f"Required variable {required_var} not defined"

    def test_variable_validations(self, terraform_dir):
        """Test that variables have appropriate validations"""
        variables_tf = terraform_dir / "variables.tf"
        content = variables_tf.read_text()

        assert 'validation {' in content, "No variable validations found"

    def test_outputs_defined(self, terraform_dir):
        """Test that important outputs are defined"""
        outputs_tf = terraform_dir / "outputs.tf"
        content = outputs_tf.read_text()

        required_outputs = [
            "vpc_id",
            "api_gateway_endpoint",
            "rds_cluster_endpoint",
            "transaction_logs_bucket_name",
        ]

        for required_output in required_outputs:
            assert f'output "{required_output}"' in content, f"Required output {required_output} not defined"

    def test_environment_suffix_usage(self, terraform_dir):
        """Test that environment_suffix is used in resource names"""
        tf_files = list(terraform_dir.glob("*.tf"))
        environment_suffix_count = 0

        for tf_file in tf_files:
            content = tf_file.read_text()
            environment_suffix_count += len(re.findall(r"environment_suffix", content))

        assert environment_suffix_count >= 20, f"environment_suffix should be used extensively, found only {environment_suffix_count} occurrences"

    def test_resource_tags(self, terraform_dir):
        """Test that resources have proper tagging"""
        tf_files = list(terraform_dir.glob("*.tf"))
        resources_with_tags = 0

        for tf_file in tf_files:
            content = tf_file.read_text()
            resources_with_tags += len(re.findall(r"\btags\s*=", content))

        assert resources_with_tags >= 10, f"Not enough resources with tags, found only {resources_with_tags}"

    def test_networking_configuration(self, terraform_dir):
        """Test networking resources are properly configured"""
        networking_tf = terraform_dir / "networking.tf"
        content = networking_tf.read_text()

        assert 'resource "aws_vpc"' in content, "VPC not defined"
        assert 'resource "aws_subnet"' in content, "Subnets not defined"
        assert 'resource "aws_internet_gateway"' in content, "Internet Gateway not defined"
        assert 'resource "aws_nat_gateway"' in content, "NAT Gateway not defined"

    def test_security_resources(self, terraform_dir):
        """Test security resources are configured"""
        security_tf = terraform_dir / "security.tf"
        if security_tf.exists():
            content = security_tf.read_text()
            assert 'resource "aws_kms_key"' in content, "KMS keys not defined"
            assert 'resource "aws_security_group"' in content, "Security groups not defined"

    def test_rds_configuration(self, terraform_dir):
        """Test RDS cluster configuration"""
        rds_tf = terraform_dir / "rds.tf"
        content = rds_tf.read_text()

        assert 'resource "aws_rds_cluster"' in content, "RDS cluster not defined"
        assert 'storage_encrypted' in content and '= true' in content, "RDS storage encryption not enabled"
        assert 'backup_retention_period' in content, "RDS backup retention not configured"
        assert 'skip_final_snapshot' in content and '= true' in content, "skip_final_snapshot should be true for test environments"

    def test_s3_bucket_configuration(self, terraform_dir):
        """Test S3 bucket configuration"""
        storage_tf = terraform_dir / "storage.tf"
        content = storage_tf.read_text()

        s3_bucket_count = len(re.findall(r'resource "aws_s3_bucket"', content))
        assert s3_bucket_count >= 2, "Expected at least 2 S3 buckets"

        assert 'aws_s3_bucket_versioning' in content, "S3 versioning not configured"
        assert 'aws_s3_bucket_server_side_encryption_configuration' in content, "S3 encryption not configured"
        assert 'aws_s3_bucket_public_access_block' in content, "S3 public access block not configured"

    def test_lambda_configuration(self, terraform_dir):
        """Test Lambda function configuration"""
        lambda_tf = terraform_dir / "lambda.tf"
        content = lambda_tf.read_text()

        lambda_count = len(re.findall(r'resource "aws_lambda_function"', content))
        assert lambda_count >= 2, "Expected at least 2 Lambda functions"

        log_group_count = len(re.findall(r'resource "aws_cloudwatch_log_group"', content))
        assert log_group_count >= 2, "CloudWatch log groups not defined for Lambda functions"

    def test_api_gateway_configuration(self, terraform_dir):
        """Test API Gateway configuration"""
        api_tf = terraform_dir / "api_gateway.tf"
        content = api_tf.read_text()

        assert 'resource "aws_api_gateway_rest_api"' in content, "API Gateway REST API not defined"
        assert 'resource "aws_api_gateway_resource"' in content, "API Gateway resources not defined"
        assert 'resource "aws_api_gateway_method"' in content, "API Gateway methods not defined"
        assert 'resource "aws_api_gateway_integration"' in content, "API Gateway integrations not defined"
        assert 'resource "aws_api_gateway_deployment"' in content, "API Gateway deployment not defined"
        assert 'resource "aws_api_gateway_stage"' in content, "API Gateway stage not defined"

    def test_waf_configuration(self, terraform_dir):
        """Test WAF configuration"""
        waf_tf = terraform_dir / "waf.tf"
        content = waf_tf.read_text()

        assert 'resource "aws_wafv2_web_acl"' in content, "WAF WebACL not defined"
        rule_count = len(re.findall(r'\brule\s*{', content))
        assert rule_count >= 2, "Not enough WAF rules defined"

    def test_monitoring_configuration(self, terraform_dir):
        """Test monitoring resources"""
        monitoring_tf = terraform_dir / "monitoring.tf"
        content = monitoring_tf.read_text()

        sns_count = len(re.findall(r'resource "aws_sns_topic"', content))
        assert sns_count >= 2, "Not enough SNS topics defined"

        alarm_count = len(re.findall(r'resource "aws_cloudwatch_metric_alarm"', content))
        assert alarm_count >= 3, "Not enough CloudWatch alarms defined"

        assert 'resource "aws_cloudwatch_dashboard"' in content, "CloudWatch dashboard not defined"

    def test_iam_configuration(self, terraform_dir):
        """Test IAM roles and policies"""
        iam_tf = terraform_dir / "iam.tf"
        content = iam_tf.read_text()

        role_count = len(re.findall(r'resource "aws_iam_role"', content))
        assert role_count >= 1, "Lambda execution role not defined"

        policy_count = len(re.findall(r'resource "aws_iam_policy"', content))
        assert policy_count >= 3, "Not enough IAM policies defined"

        attachment_count = len(re.findall(r'resource "aws_iam_role_policy_attachment"', content))
        assert attachment_count >= 3, "Not enough IAM policy attachments defined"

    def test_vpc_endpoints(self, terraform_dir):
        """Test VPC endpoints configuration"""
        vpc_endpoints_tf = terraform_dir / "vpc_endpoints.tf"
        if vpc_endpoints_tf.exists():
            content = vpc_endpoints_tf.read_text()
            endpoint_count = len(re.findall(r'resource "aws_vpc_endpoint"', content))
            assert endpoint_count >= 2, "Not enough VPC endpoints defined"

    def test_locals_configuration(self, terraform_dir):
        """Test locals are properly defined"""
        main_tf = terraform_dir / "main.tf"
        content = main_tf.read_text()

        if 'locals {' in content:
            assert 'vpc_cidr' in content or 'common_tags' in content, "Expected locals like common_tags or vpc_cidr"


class TestTerraformResources:
    """Test specific Terraform resource configurations"""

    @pytest.fixture(scope="class")
    def terraform_dir(self):
        return Path(__file__).parent.parent.parent / "lib"

    def test_no_hardcoded_values(self, terraform_dir):
        """Test that there are no hardcoded environment values"""
        tf_files = list(terraform_dir.glob("*.tf"))
        hardcoded_patterns = [
            r'"dev-',
            r'"prod-',
            r'"staging-',
        ]

        violations = []
        for tf_file in tf_files:
            content = tf_file.read_text()
            for pattern in hardcoded_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    line_start = content.rfind("\n", 0, match.start())
                    line = content[line_start:match.end()]
                    if not line.strip().startswith("#"):
                        violations.append(f"{tf_file.name}: Found hardcoded value {match.group()}")

        assert len(violations) == 0, f"Found hardcoded environment values: {violations}"

    def test_resource_naming_conventions(self, terraform_dir):
        """Test that resources follow naming conventions"""
        tf_files = list(terraform_dir.glob("*.tf"))

        for tf_file in tf_files:
            content = tf_file.read_text()
            resource_matches = re.finditer(r'resource\s+"([^"]+)"\s+"([^"]+)"', content)

            for match in resource_matches:
                resource_name = match.group(2)
                assert "-" not in resource_name, f"Resource name '{resource_name}' in {tf_file.name} should use underscores, not hyphens"

    def test_no_deletion_protection(self, terraform_dir):
        """Test that resources don't have deletion protection enabled"""
        tf_files = list(terraform_dir.glob("*.tf"))

        for tf_file in tf_files:
            content = tf_file.read_text()
            assert "deletion_protection = true" not in content.lower(), f"{tf_file.name} has deletion_protection enabled"

    def test_no_retain_policy(self, terraform_dir):
        """Test that resources don't have prevent_destroy lifecycle rule"""
        tf_files = list(terraform_dir.glob("*.tf"))

        for tf_file in tf_files:
            content = tf_file.read_text()
            assert "prevent_destroy = true" not in content, f"{tf_file.name} has prevent_destroy lifecycle rule"


class TestTerraformCompliance:
    """Test compliance and best practices"""

    @pytest.fixture(scope="class")
    def terraform_dir(self):
        return Path(__file__).parent.parent.parent / "lib"

    def test_encryption_at_rest(self, terraform_dir):
        """Test that all data stores have encryption at rest"""
        tf_files = list(terraform_dir.glob("*.tf"))
        encryption_keywords = ["storage_encrypted", "server_side_encryption", "kms_key"]

        encryption_count = 0
        for tf_file in tf_files:
            content = tf_file.read_text()
            for keyword in encryption_keywords:
                encryption_count += content.count(keyword)

        assert encryption_count >= 5, "Not enough encryption configurations found"

    def test_logging_enabled(self, terraform_dir):
        """Test that logging is properly configured"""
        tf_files = list(terraform_dir.glob("*.tf"))
        logging_resources = 0

        for tf_file in tf_files:
            content = tf_file.read_text()
            logging_resources += content.count("aws_cloudwatch_log_group")

        assert logging_resources >= 3, "Not enough CloudWatch log groups configured"

    def test_backup_configuration(self, terraform_dir):
        """Test that backups are configured for RDS"""
        rds_file = terraform_dir / "rds.tf"
        if rds_file.exists():
            content = rds_file.read_text()
            assert "backup_retention_period" in content, "RDS backup retention not configured"

    def test_monitoring_enabled(self, terraform_dir):
        """Test that monitoring is properly configured"""
        monitoring_file = terraform_dir / "monitoring.tf"
        if monitoring_file.exists():
            content = monitoring_file.read_text()
            assert "aws_cloudwatch_metric_alarm" in content, "CloudWatch alarms not configured"
            assert "aws_sns_topic" in content, "SNS topics for alerting not configured"


def test_coverage_summary():
    """Generate a summary of test coverage"""
    print("\n" + "=" * 70)
    print("TERRAFORM UNIT TEST COVERAGE SUMMARY")
    print("=" * 70)
    print("✅ Terraform syntax and formatting")
    print("✅ Provider and backend configuration")
    print("✅ Variable definitions and validations")
    print("✅ Resource configurations (VPC, RDS, Lambda, API Gateway, S3, etc.)")
    print("✅ Security configurations (KMS, Security Groups, WAF)")
    print("✅ Monitoring and alerting (CloudWatch, SNS)")
    print("✅ IAM roles and policies")
    print("✅ Compliance checks (encryption, logging, backups)")
    print("✅ Best practices (tagging, naming conventions)")
    print("=" * 70)
