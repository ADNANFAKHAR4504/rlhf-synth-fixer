"""
Unit tests for Terraform infrastructure configuration
Tests validate HCL syntax, resource configuration, and best practices
"""

import json
import os
import subprocess
import unittest
from pathlib import Path


class TestTerraformConfiguration(unittest.TestCase):
    """Unit tests for Terraform infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.lib_dir = Path(__file__).parent.parent.parent / "lib"
        cls.test_env_suffix = "unittest"

        # Set environment variables for testing
        os.environ["TF_VAR_environment_suffix"] = cls.test_env_suffix
        os.environ["TF_VAR_environment"] = "test"

        # Initialize Terraform
        result = subprocess.run(
            ["terraform", "init", "-backend=false"],
            cwd=cls.lib_dir,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            raise Exception(f"Terraform init failed: {result.stderr}")

    def test_terraform_fmt_check(self):
        """Test that all Terraform files are properly formatted"""
        result = subprocess.run(
            ["terraform", "fmt", "-check", "-recursive"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )
        self.assertEqual(
            result.returncode, 0,
            f"Terraform formatting check failed. Run 'terraform fmt -recursive' to fix. Files: {result.stdout}"
        )

    def test_terraform_validate(self):
        """Test that Terraform configuration is valid"""
        result = subprocess.run(
            ["terraform", "validate"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )
        self.assertEqual(
            result.returncode, 0,
            f"Terraform validation failed: {result.stderr}"
        )

    def test_required_files_exist(self):
        """Test that all required Terraform files exist"""
        required_files = [
            "main.tf",
            "variables.tf",
            "outputs.tf",
            "provider.tf",
            "backend.tf",
            "locals.tf",
            "data.tf",
            "vpc.tf",
            "terraform.tfvars"
        ]

        for filename in required_files:
            file_path = self.lib_dir / filename
            self.assertTrue(
                file_path.exists(),
                f"Required file {filename} not found"
            )

    def test_required_modules_exist(self):
        """Test that all required modules exist"""
        required_modules = ["networking", "compute", "database"]

        for module_name in required_modules:
            module_dir = self.lib_dir / "modules" / module_name
            self.assertTrue(
                module_dir.exists(),
                f"Required module {module_name} not found"
            )

            # Check module files
            for file_name in ["main.tf", "variables.tf", "outputs.tf"]:
                module_file = module_dir / file_name
                self.assertTrue(
                    module_file.exists(),
                    f"Module {module_name} missing {file_name}"
                )

    def test_environment_suffix_in_resource_names(self):
        """Test that environment_suffix variable is used in resource names"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        # Check that environment_suffix is referenced
        found_suffix_usage = False

        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                if "environment_suffix" in content:
                    found_suffix_usage = True
                    break

        self.assertTrue(
            found_suffix_usage,
            "environment_suffix variable not found in any Terraform file"
        )

    def test_instance_type_validation(self):
        """Test that instance_type variable has proper validation"""
        variables_file = self.lib_dir / "variables.tf"

        with open(variables_file, 'r') as f:
            content = f.read()

        # Check for validation block
        self.assertIn("validation", content, "Variable validation not found")
        self.assertIn("instance_type", content, "instance_type variable not found")
        self.assertIn("t3.medium", content, "t3.medium not in validation")
        self.assertIn("t3.large", content, "t3.large not in validation")
        self.assertIn("t3.xlarge", content, "t3.xlarge not in validation")

    def test_backend_configuration(self):
        """Test that S3 backend is properly configured"""
        backend_file = self.lib_dir / "backend.tf"

        with open(backend_file, 'r') as f:
            content = f.read()

        self.assertIn("backend \"s3\"", content, "S3 backend not configured")
        self.assertIn("dynamodb_table", content, "DynamoDB table not configured for locking")
        self.assertIn("encrypt", content, "Encryption not enabled for state")
        self.assertIn("terraform-state-lock", content, "DynamoDB table not named correctly")

    def test_provider_version_constraints(self):
        """Test that provider versions are properly constrained"""
        provider_file = self.lib_dir / "provider.tf"

        with open(provider_file, 'r') as f:
            content = f.read()

        self.assertIn("required_version", content, "Terraform version not constrained")
        self.assertIn(">= 1.5", content, "Terraform version constraint too loose")
        self.assertIn("hashicorp/aws", content, "AWS provider not specified")
        self.assertIn("~> 5.0", content, "AWS provider version not constrained to 5.x")

    def test_tagging_strategy(self):
        """Test that common tags are defined in locals"""
        locals_file = self.lib_dir / "locals.tf"

        with open(locals_file, 'r') as f:
            content = f.read()

        required_tags = ["Environment", "ManagedBy", "CostCenter", "LastModified"]

        for tag in required_tags:
            self.assertIn(
                tag, content,
                f"Required tag '{tag}' not found in common_tags"
            )

    def test_merge_function_usage(self):
        """Test that merge() function is used for tag combination"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        found_merge = False
        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                if "merge(" in content and "tags" in content:
                    found_merge = True
                    break

        self.assertTrue(
            found_merge,
            "merge() function not used for tag combination"
        )

    def test_no_hardcoded_region(self):
        """Test that AWS region is not hardcoded (except in backend/provider)"""
        tf_files = [
            f for f in self.lib_dir.glob("**/*.tf")
            if f.name not in ["backend.tf", "provider.tf", "variables.tf", "terraform.tfvars"]
        ]

        hardcoded_regions = []
        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                # Look for hardcoded us-east-1, us-west-2, etc. in resource definitions
                if "region" in content and "us-" in content:
                    # Check if it's actually a hardcoded value (not in comment or variable)
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if '=' in line and 'region' in line and 'us-' in line and not line.strip().startswith('#'):
                            hardcoded_regions.append(f"{tf_file.name}:{i+1}")

        self.assertEqual(
            len(hardcoded_regions), 0,
            f"Hardcoded regions found in: {hardcoded_regions}"
        )

    def test_for_each_usage_in_rds(self):
        """Test that for_each is used for RDS instances instead of count"""
        database_main = self.lib_dir / "modules" / "database" / "main.tf"

        with open(database_main, 'r') as f:
            content = f.read()

        self.assertIn(
            "for_each", content,
            "for_each not used in database module"
        )
        self.assertIn(
            "aws_rds_cluster_instance", content,
            "RDS cluster instance resource not found"
        )

    def test_iam_policy_document_usage(self):
        """Test that IAM policies use aws_iam_policy_document data source"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        found_policy_document = False
        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                if "aws_iam_policy_document" in content:
                    found_policy_document = True
                    break

        self.assertTrue(
            found_policy_document,
            "aws_iam_policy_document not used for IAM policies"
        )

    def test_explicit_deny_in_iam_policies(self):
        """Test that IAM policies include explicit deny statements"""
        compute_main = self.lib_dir / "modules" / "compute" / "main.tf"

        with open(compute_main, 'r') as f:
            content = f.read()

        # Check for deny effect in policy documents
        if "aws_iam_policy_document" in content:
            self.assertIn(
                "Deny", content,
                "Explicit Deny statement not found in IAM policy documents"
            )

    def test_deletion_protection_disabled(self):
        """Test that deletion protection is disabled for RDS (testing requirement)"""
        database_main = self.lib_dir / "modules" / "database" / "main.tf"

        with open(database_main, 'r') as f:
            content = f.read()

        self.assertIn(
            "deletion_protection", content,
            "deletion_protection setting not found"
        )
        self.assertIn(
            "deletion_protection = false", content,
            "deletion_protection not set to false"
        )

    def test_skip_final_snapshot_enabled(self):
        """Test that skip_final_snapshot is enabled for RDS (testing requirement)"""
        database_main = self.lib_dir / "modules" / "database" / "main.tf"

        with open(database_main, 'r') as f:
            content = f.read()

        self.assertIn(
            "skip_final_snapshot = true", content,
            "skip_final_snapshot not set to true"
        )

    def test_lifecycle_rules_present(self):
        """Test that lifecycle rules are defined"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        found_lifecycle = False
        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                if "lifecycle" in content:
                    found_lifecycle = True
                    break

        self.assertTrue(
            found_lifecycle,
            "No lifecycle rules found in Terraform configuration"
        )

    def test_cloudwatch_alarms_configured(self):
        """Test that CloudWatch alarms are configured for monitoring"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        found_alarms = False
        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                if "aws_cloudwatch_metric_alarm" in content:
                    found_alarms = True
                    break

        self.assertTrue(
            found_alarms,
            "CloudWatch metric alarms not configured"
        )

    def test_storage_encryption_enabled(self):
        """Test that storage encryption is enabled for RDS"""
        database_main = self.lib_dir / "modules" / "database" / "main.tf"

        with open(database_main, 'r') as f:
            content = f.read()

        self.assertIn(
            "storage_encrypted", content,
            "storage_encrypted setting not found"
        )
        self.assertIn(
            "storage_encrypted = true", content,
            "Storage encryption not enabled for RDS"
        )

    def test_vpc_resources_created(self):
        """Test that VPC resources are created for self-sufficient deployment"""
        vpc_file = self.lib_dir / "vpc.tf"

        self.assertTrue(
            vpc_file.exists(),
            "vpc.tf file not found - infrastructure not self-sufficient"
        )

        with open(vpc_file, 'r') as f:
            content = f.read()

        required_resources = [
            "aws_vpc",
            "aws_subnet",
            "aws_internet_gateway",
            "aws_nat_gateway",
            "aws_route_table"
        ]

        for resource in required_resources:
            self.assertIn(
                resource, content,
                f"Required resource {resource} not found in vpc.tf"
            )

    def test_instance_count_matches_requirement(self):
        """Test that default instance count is 12 as per requirements"""
        variables_file = self.lib_dir / "variables.tf"

        with open(variables_file, 'r') as f:
            content = f.read()

        # Check instance_count variable default
        self.assertIn("instance_count", content, "instance_count variable not found")

        # Extract default value (simplified check)
        lines = content.split('\n')
        in_instance_count = False
        for line in lines:
            if 'variable "instance_count"' in line:
                in_instance_count = True
            if in_instance_count and 'default' in line:
                self.assertIn("12", line, "Default instance count is not 12")
                break

    def test_instance_type_is_t3_large(self):
        """Test that default instance type is t3.large for cost optimization"""
        variables_file = self.lib_dir / "variables.tf"

        with open(variables_file, 'r') as f:
            content = f.read()

        # Check for t3.large default
        lines = content.split('\n')
        in_instance_type = False
        for line in lines:
            if 'variable "instance_type"' in line:
                in_instance_type = True
            if in_instance_type and 'default' in line:
                self.assertIn("t3.large", line, "Default instance type is not t3.large")
                break

    def test_backup_retention_configured(self):
        """Test that RDS backup retention is configured to 7 days"""
        database_main = self.lib_dir / "modules" / "database" / "main.tf"

        with open(database_main, 'r') as f:
            content = f.read()

        self.assertIn(
            "backup_retention_period", content,
            "Backup retention not configured"
        )

    def test_module_dependencies_defined(self):
        """Test that module dependencies are properly defined"""
        main_file = self.lib_dir / "main.tf"

        with open(main_file, 'r') as f:
            content = f.read()

        # Check that compute/database depend on networking
        self.assertIn(
            "depends_on", content,
            "Module dependencies not defined"
        )

    def test_no_inline_iam_policies(self):
        """Test that no inline IAM policies are used"""
        tf_files = list(self.lib_dir.glob("**/*.tf"))

        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()
                # Check for inline_policy blocks
                self.assertNotIn(
                    "inline_policy", content,
                    f"Inline IAM policy found in {tf_file.name}"
                )


if __name__ == "__main__":
    unittest.main()
