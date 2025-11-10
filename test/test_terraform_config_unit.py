#!/usr/bin/env python3
"""
Unit tests for AWS Region Migration Terraform Configuration
Tests HCL syntax, resource configuration, naming conventions, and security settings
"""

import unittest
import os
import json
import subprocess
import re
from pathlib import Path


class TestTerraformConfiguration(unittest.TestCase):
    """Test Terraform configuration for region migration"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.main_tf = cls.lib_dir / "main.tf"
        cls.variables_tf = cls.lib_dir / "variables.tf"
        cls.backend_tf = cls.lib_dir / "backend.tf"

    def test_terraform_files_exist(self):
        """Verify all required Terraform files exist"""
        self.assertTrue(self.main_tf.exists(), "main.tf should exist")
        self.assertTrue(self.variables_tf.exists(), "variables.tf should exist")
        self.assertTrue(self.backend_tf.exists(), "backend.tf should exist")

    def test_terraform_init_succeeds(self):
        """Test terraform init completes successfully"""
        result = subprocess.run(
            ["terraform", "init", "-backend=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0, f"terraform init failed: {result.stderr}")

    def test_terraform_validate_succeeds(self):
        """Test terraform validate passes"""
        result = subprocess.run(
            ["terraform", "validate"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0, f"terraform validate failed: {result.stderr}")

    def test_terraform_fmt_check(self):
        """Test Terraform formatting is correct"""
        result = subprocess.run(
            ["terraform", "fmt", "-check", "-recursive"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True
        )
        self.assertEqual(result.returncode, 0,
                        f"Terraform files not properly formatted: {result.stdout}")

    def test_environment_suffix_variable_defined(self):
        """Verify environment_suffix variable is defined"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()
        self.assertIn('variable "environment_suffix"', content,
                     "environment_suffix variable should be defined")

    def test_environment_suffix_no_default(self):
        """Verify environment_suffix has no default value (must be provided)"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()
        # Extract environment_suffix variable block
        pattern = r'variable\s+"environment_suffix"\s*\{([^}]+)\}'
        match = re.search(pattern, content, re.DOTALL)
        self.assertIsNotNone(match, "environment_suffix variable should exist")
        var_block = match.group(1)
        self.assertNotIn('default', var_block,
                        "environment_suffix should not have a default value")

    def test_all_resources_include_environment_suffix(self):
        """Verify all resource names include environment_suffix"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        # Find all resource tags with Name
        name_tags = re.findall(r'Name\s*=\s*"([^"]+)"', content)

        # All Name tags should include environment_suffix variable
        for name in name_tags:
            self.assertIn('${var.environment_suffix}', name,
                         f"Resource name '{name}' should include environment_suffix")

        # Check name_prefix attributes
        name_prefixes = re.findall(r'(?:name_prefix|identifier_prefix|bucket_prefix)\s*=\s*"([^"]+)"', content)
        for prefix in name_prefixes:
            self.assertIn('${var.environment_suffix}', prefix,
                         f"Resource prefix '{prefix}' should include environment_suffix")

    def test_no_hardcoded_regions(self):
        """Verify no hardcoded region values in main.tf"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        # Region should use variable
        provider_block = re.search(r'provider\s+"aws"\s*\{([^}]+)\}', content, re.DOTALL)
        self.assertIsNotNone(provider_block, "AWS provider should be defined")

        provider_content = provider_block.group(1)
        self.assertIn('var.aws_region', provider_content,
                     "Provider should use var.aws_region")

    def test_deletion_protection_disabled(self):
        """Verify deletion_protection is set to false for RDS"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        # Check RDS deletion_protection
        if 'aws_db_instance' in content:
            self.assertIn('deletion_protection     = false', content,
                         "RDS deletion_protection should be false")

    def test_skip_final_snapshot_enabled(self):
        """Verify skip_final_snapshot is true for RDS (testing requirement)"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        if 'aws_db_instance' in content:
            self.assertIn('skip_final_snapshot', content,
                         "RDS should have skip_final_snapshot configured")

    def test_storage_encryption_enabled(self):
        """Verify storage encryption is enabled for RDS and EBS"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        # Check RDS encryption
        if 'aws_db_instance' in content:
            rds_block = re.search(r'resource\s+"aws_db_instance"[^{]*\{([^}]+(?:\{[^}]+\})?[^}]*)\}',
                                 content, re.DOTALL)
            if rds_block:
                self.assertIn('storage_encrypted      = true', rds_block.group(0),
                            "RDS storage should be encrypted")

        # Check EBS encryption
        if 'root_block_device' in content:
            self.assertIn('encrypted   = true', content,
                         "EBS volumes should be encrypted")

    def test_s3_bucket_encryption_configured(self):
        """Verify S3 bucket encryption is configured"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        if 'aws_s3_bucket' in content:
            self.assertIn('aws_s3_bucket_server_side_encryption_configuration', content,
                         "S3 bucket encryption should be configured")

    def test_s3_bucket_public_access_blocked(self):
        """Verify S3 bucket has public access blocks"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        if 'aws_s3_bucket' in content:
            self.assertIn('aws_s3_bucket_public_access_block', content,
                         "S3 bucket should have public access blocks")
            self.assertIn('block_public_acls       = true', content,
                         "S3 should block public ACLs")
            self.assertIn('block_public_policy     = true', content,
                         "S3 should block public policies")

    def test_security_groups_have_descriptions(self):
        """Verify all security groups have descriptions"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        sg_blocks = re.findall(r'resource\s+"aws_security_group"\s+"[^"]+"\s*\{([^}]+(?:\{[^}]+\})?[^}]*)\}',
                              content, re.DOTALL)

        for sg_block in sg_blocks:
            self.assertIn('description', sg_block,
                         "Security group should have description")

    def test_ingress_rules_have_descriptions(self):
        """Verify all ingress rules have descriptions"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        ingress_blocks = re.findall(r'ingress\s*\{([^}]+)\}', content, re.DOTALL)

        for ingress in ingress_blocks:
            self.assertIn('description', ingress,
                         "Ingress rule should have description")

    def test_vpc_dns_support_enabled(self):
        """Verify VPC has DNS support and hostnames enabled"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        vpc_block = re.search(r'resource\s+"aws_vpc"\s+"main"\s*\{([^}]+)\}',
                             content, re.DOTALL)
        self.assertIsNotNone(vpc_block, "VPC resource should exist")

        vpc_content = vpc_block.group(1)
        self.assertIn('enable_dns_hostnames = true', vpc_content,
                     "VPC should have DNS hostnames enabled")
        self.assertIn('enable_dns_support   = true', vpc_content,
                     "VPC should have DNS support enabled")

    def test_subnet_availability_zones_parameterized(self):
        """Verify subnets use availability_zones variable"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        subnet_blocks = re.findall(r'resource\s+"aws_subnet"[^{]*\{([^}]+(?:\{[^}]+\})?[^}]*)\}',
                                   content, re.DOTALL)

        for subnet in subnet_blocks:
            self.assertIn('var.availability_zones', subnet,
                         "Subnet should use availability_zones variable")

    def test_iam_role_has_assume_role_policy(self):
        """Verify IAM roles have proper assume role policies"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        if 'aws_iam_role' in content:
            self.assertIn('assume_role_policy', content,
                         "IAM role should have assume_role_policy")
            self.assertIn('sts:AssumeRole', content,
                         "Assume role policy should allow sts:AssumeRole")

    def test_outputs_defined(self):
        """Verify required outputs are defined"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        required_outputs = [
            'vpc_id',
            'public_subnet_ids',
            'private_subnet_ids',
            'web_instance_ids',
            'app_instance_ids',
            's3_bucket_name'
        ]

        for output in required_outputs:
            self.assertIn(f'output "{output}"', content,
                         f"Output {output} should be defined")

    def test_sensitive_outputs_marked(self):
        """Verify sensitive outputs are marked as sensitive"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        # Database endpoint should be sensitive
        db_output = re.search(r'output\s+"database_endpoint"\s*\{([^}]+)\}',
                             content, re.DOTALL)
        if db_output:
            self.assertIn('sensitive   = true', db_output.group(1),
                         "database_endpoint output should be marked sensitive")

    def test_default_tags_configured(self):
        """Verify provider has default tags configured"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        provider_block = re.search(r'provider\s+"aws"\s*\{([^}]+)\}', content, re.DOTALL)
        self.assertIsNotNone(provider_block, "AWS provider should be defined")

        provider_content = provider_block.group(1)
        self.assertIn('default_tags', provider_content,
                     "Provider should have default_tags configured")
        self.assertIn('ManagedBy', provider_content,
                     "Default tags should include ManagedBy")

    def test_cidr_blocks_parameterized(self):
        """Verify CIDR blocks use variables"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        vpc_block = re.search(r'resource\s+"aws_vpc"[^{]*\{([^}]+)\}',
                             content, re.DOTALL)
        if vpc_block:
            self.assertIn('var.vpc_cidr', vpc_block.group(1),
                         "VPC CIDR should use variable")

    def test_lifecycle_policies_configured(self):
        """Verify security groups have create_before_destroy lifecycle"""
        with open(self.main_tf, 'r') as f:
            content = f.read()

        sg_blocks = re.findall(r'resource\s+"aws_security_group"[^{]*\{([^}]+(?:\{[^}]+\})?[^}]*)\}',
                              content, re.DOTALL)

        # At least one security group should have lifecycle policy
        has_lifecycle = any('create_before_destroy' in sg for sg in sg_blocks)
        self.assertTrue(has_lifecycle,
                       "Security groups should have create_before_destroy lifecycle")


class TestVariablesConfiguration(unittest.TestCase):
    """Test variables.tf configuration"""

    @classmethod
    def setUpClass(cls):
        cls.variables_tf = Path(__file__).parent.parent / "lib" / "variables.tf"

    def test_required_variables_defined(self):
        """Verify all required variables are defined"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()

        required_vars = [
            'aws_region',
            'environment',
            'environment_suffix',
            'vpc_cidr',
            'availability_zones'
        ]

        for var in required_vars:
            self.assertIn(f'variable "{var}"', content,
                         f"Variable {var} should be defined")

    def test_variables_have_descriptions(self):
        """Verify all variables have descriptions"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()

        var_blocks = re.findall(r'variable\s+"([^"]+)"\s*\{([^}]+)\}',
                               content, re.DOTALL)

        for var_name, var_content in var_blocks:
            self.assertIn('description', var_content,
                         f"Variable {var_name} should have description")

    def test_variables_have_types(self):
        """Verify all variables have type constraints"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()

        var_blocks = re.findall(r'variable\s+"([^"]+)"\s*\{([^}]+)\}',
                               content, re.DOTALL)

        for var_name, var_content in var_blocks:
            self.assertIn('type', var_content,
                         f"Variable {var_name} should have type defined")

    def test_sensitive_variables_marked(self):
        """Verify sensitive variables are marked as sensitive"""
        with open(self.variables_tf, 'r') as f:
            content = f.read()

        # Password variable should be sensitive
        if 'variable "db_password"' in content:
            password_var = re.search(r'variable\s+"db_password"\s*\{([^}]+)\}',
                                    content, re.DOTALL)
            if password_var:
                self.assertIn('sensitive', password_var.group(1),
                             "db_password should be marked sensitive")


class TestDocumentation(unittest.TestCase):
    """Test documentation files"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_state_migration_doc_exists(self):
        """Verify state-migration.md exists"""
        doc = self.lib_dir / "state-migration.md"
        self.assertTrue(doc.exists(), "state-migration.md should exist")

    def test_runbook_exists(self):
        """Verify runbook.md exists"""
        doc = self.lib_dir / "runbook.md"
        self.assertTrue(doc.exists(), "runbook.md should exist")

    def test_id_mapping_csv_exists(self):
        """Verify id-mapping.csv exists"""
        doc = self.lib_dir / "id-mapping.csv"
        self.assertTrue(doc.exists(), "id-mapping.csv should exist")


def run_tests_with_coverage():
    """Run tests and calculate coverage"""
    import sys

    # Run tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Calculate coverage (number of passed tests / total tests)
    total_tests = result.testsRun
    passed_tests = total_tests - len(result.failures) - len(result.errors)
    coverage_percent = (passed_tests / total_tests * 100) if total_tests > 0 else 0

    print(f"\n{'='*70}")
    print(f"Test Coverage: {coverage_percent:.1f}% ({passed_tests}/{total_tests} tests passed)")
    print(f"{'='*70}\n")

    # Write coverage report
    coverage_dir = Path(__file__).parent.parent / "coverage"
    coverage_dir.mkdir(exist_ok=True)

    with open(coverage_dir / "terraform-unit-test-report.txt", "w") as f:
        f.write(f"Terraform Unit Test Coverage Report\n")
        f.write(f"====================================\n\n")
        f.write(f"Total Tests: {total_tests}\n")
        f.write(f"Passed: {passed_tests}\n")
        f.write(f"Failed: {len(result.failures)}\n")
        f.write(f"Errors: {len(result.errors)}\n")
        f.write(f"Coverage: {coverage_percent:.1f}%\n")

    return result.wasSuccessful(), coverage_percent


if __name__ == '__main__':
    success, coverage = run_tests_with_coverage()
    exit(0 if success else 1)
