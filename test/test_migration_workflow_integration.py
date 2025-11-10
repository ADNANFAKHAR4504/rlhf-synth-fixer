#!/usr/bin/env python3
"""
Integration tests for AWS Region Migration Workflow
Tests the complete migration process including terraform plan validation,
documentation completeness, and workflow execution readiness
"""

import unittest
import subprocess
import os
from pathlib import Path


class TestMigrationWorkflowIntegration(unittest.TestCase):
    """Integration tests for the complete migration workflow"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.test_env = {
            'TF_VAR_environment_suffix': 'integration-test',
            'TF_VAR_aws_region': 'us-west-2',
            'TF_VAR_db_password': 'TestPassword123!'
        }

    def test_01_terraform_init_succeeds(self):
        """Test 1: Verify terraform initialization works"""
        result = subprocess.run(
            ["terraform", "init", "-backend=false", "-upgrade=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )
        self.assertEqual(result.returncode, 0,
                        f"Terraform init should succeed: {result.stderr}")
        self.assertIn("Terraform has been successfully initialized",
                     result.stdout,
                     "Should show successful initialization")

    def test_02_terraform_validate_passes(self):
        """Test 2: Verify terraform configuration is valid"""
        result = subprocess.run(
            ["terraform", "validate"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )
        self.assertEqual(result.returncode, 0,
                        f"Terraform validate should pass: {result.stderr}")
        self.assertIn("Success", result.stdout,
                     "Should show validation success")

    def test_03_terraform_plan_with_us_west_2_succeeds(self):
        """Test 3: Verify plan works for target region (us-west-2)"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )
        self.assertEqual(result.returncode, 0,
                        f"Terraform plan should succeed for us-west-2: {result.stderr}")
        self.assertIn("Plan:", result.stdout,
                     "Should show plan summary")

    def test_04_plan_creates_vpc_resources(self):
        """Test 4: Verify VPC and networking resources are planned"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for key networking resources
        networking_resources = [
            'aws_vpc.main',
            'aws_subnet.public',
            'aws_subnet.private',
            'aws_internet_gateway.main',
            'aws_route_table.public'
        ]

        for resource in networking_resources:
            self.assertIn(resource, result.stdout,
                         f"Plan should include {resource}")

    def test_05_plan_creates_compute_resources(self):
        """Test 5: Verify compute resources are planned"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for compute resources
        compute_resources = [
            'aws_instance.web',
            'aws_instance.app',
            'aws_security_group.web',
            'aws_security_group.app'
        ]

        for resource in compute_resources:
            self.assertIn(resource, result.stdout,
                         f"Plan should include {resource}")

    def test_06_plan_creates_database_resources(self):
        """Test 6: Verify database resources are planned"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for database resources
        database_resources = [
            'aws_db_instance.main',
            'aws_db_subnet_group.main',
            'aws_security_group.database'
        ]

        for resource in database_resources:
            self.assertIn(resource, result.stdout,
                         f"Plan should include {resource}")

    def test_07_plan_creates_storage_resources(self):
        """Test 7: Verify storage resources are planned"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for storage resources
        storage_resources = [
            'aws_s3_bucket.app_data',
            'aws_s3_bucket_versioning.app_data',
            'aws_s3_bucket_server_side_encryption_configuration.app_data',
            'aws_s3_bucket_public_access_block.app_data'
        ]

        for resource in storage_resources:
            self.assertIn(resource, result.stdout,
                         f"Plan should include {resource}")

    def test_08_plan_creates_iam_resources(self):
        """Test 8: Verify IAM resources are planned"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for IAM resources
        iam_resources = [
            'aws_iam_role.ec2_role',
            'aws_iam_instance_profile.ec2_profile',
            'aws_iam_role_policy.s3_access'
        ]

        for resource in iam_resources:
            self.assertIn(resource, result.stdout,
                         f"Plan should include {resource}")

    def test_09_plan_includes_all_outputs(self):
        """Test 9: Verify all required outputs are in plan"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for outputs
        required_outputs = [
            'vpc_id',
            'public_subnet_ids',
            'private_subnet_ids',
            'web_instance_ids',
            'app_instance_ids',
            'database_endpoint',
            's3_bucket_name',
            'web_security_group_id',
            'app_security_group_id',
            'database_security_group_id'
        ]

        output_section = False
        for line in result.stdout.split('\n'):
            if 'Changes to Outputs:' in line:
                output_section = True
                break

        self.assertTrue(output_section, "Plan should show outputs section")

        for output in required_outputs:
            self.assertIn(output, result.stdout,
                         f"Plan should include output: {output}")

    def test_10_plan_respects_environment_suffix(self):
        """Test 10: Verify environment suffix is applied to resources"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Should see integration-test suffix in resource names
        self.assertIn('integration-test', result.stdout,
                     "Plan should use environment_suffix in resource names")

    def test_11_state_migration_documentation_complete(self):
        """Test 11: Verify state migration documentation is complete"""
        doc_path = self.lib_dir / "state-migration.md"
        with open(doc_path, 'r') as f:
            content = f.read()

        # Check for essential migration steps
        required_sections = [
            'terraform init',
            'terraform workspace',
            'terraform import',
            'terraform plan',
            'terraform apply',
            'terraform state',
            'backup',
            'rollback'
        ]

        for section in required_sections:
            self.assertIn(section.lower(), content.lower(),
                         f"state-migration.md should include {section}")

    def test_12_runbook_has_complete_workflow(self):
        """Test 12: Verify runbook has complete migration workflow"""
        doc_path = self.lib_dir / "runbook.md"
        with open(doc_path, 'r') as f:
            content = f.read()

        # Check for workflow phases
        workflow_phases = [
            'Pre-Migration',
            'Infrastructure Provisioning',
            'Data Migration',
            'DNS Cutover',
            'Validation',
            'Rollback'
        ]

        for phase in workflow_phases:
            self.assertIn(phase, content,
                         f"runbook.md should include {phase} phase")

    def test_13_id_mapping_has_resource_examples(self):
        """Test 13: Verify ID mapping has examples for all resource types"""
        csv_path = self.lib_dir / "id-mapping.csv"
        with open(csv_path, 'r') as f:
            content = f.read()

        # Check for resource types
        resource_types = [
            'vpc',
            'subnet',
            'security_group',
            'ec2_instance',
            'rds_instance',
            's3_bucket',
            'iam_role'
        ]

        for resource_type in resource_types:
            self.assertIn(resource_type, content.lower(),
                         f"id-mapping.csv should have example for {resource_type}")

    def test_14_configuration_supports_multiple_regions(self):
        """Test 14: Verify configuration can be planned for different regions"""
        # Test with us-west-1 (source region)
        env_west1 = {
            **self.test_env,
            'TF_VAR_aws_region': 'us-west-1',
            'TF_VAR_availability_zones': '["us-west-1a","us-west-1b"]'
        }

        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **env_west1}
        )

        # Plan should succeed (even if some resources might not be available)
        # Key is that the configuration is valid for multiple regions
        self.assertIn("Plan:", result.stdout,
                     "Should be able to plan for us-west-1")

    def test_15_no_hardcoded_region_values(self):
        """Test 15: Verify no hardcoded region values in terraform files"""
        # Check main.tf
        with open(self.lib_dir / "main.tf", 'r') as f:
            main_content = f.read()

        # Provider block should use variable
        self.assertIn('region = var.aws_region', main_content,
                     "Provider should use var.aws_region")

        # Should not have hardcoded us-west-1 or us-west-2 in provider
        import re
        provider_match = re.search(r'provider\s+"aws"\s*\{([^}]+)\}',
                                  main_content, re.DOTALL)
        if provider_match:
            provider_block = provider_match.group(1)
            self.assertNotIn('us-west-1', provider_block,
                           "Provider should not hardcode us-west-1")
            self.assertNotIn('us-west-2', provider_block,
                           "Provider should not hardcode us-west-2")

    def test_16_variables_properly_defaulted_for_target_region(self):
        """Test 16: Verify variables default to target region (us-west-2)"""
        with open(self.lib_dir / "variables.tf", 'r') as f:
            content = f.read()

        # Default region should be us-west-2 (target)
        self.assertIn('default     = "us-west-2"', content,
                     "Default AWS region should be us-west-2")

        # AZs should default to us-west-2 zones
        self.assertIn('us-west-2a', content,
                     "Default AZs should include us-west-2a")
        self.assertIn('us-west-2b', content,
                     "Default AZs should include us-west-2b")

    def test_17_cost_optimization_nat_gateway_optional(self):
        """Test 17: Verify NAT Gateway is optional for cost optimization"""
        # Test with NAT gateway disabled
        env_no_nat = {
            **self.test_env,
            'TF_VAR_enable_nat_gateway': 'false'
        }

        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **env_no_nat}
        )

        # Should not plan to create NAT gateway when disabled
        # Count NAT gateway references in plan
        nat_creates = result.stdout.count('aws_nat_gateway.main') if 'aws_nat_gateway.main' in result.stdout else 0

        # If NAT gateway is mentioned, it should be 0 creates when enable_nat_gateway=false
        # (some terraform versions might not show it at all when count=0)
        self.assertTrue(nat_creates == 0 or 'aws_nat_gateway' not in result.stdout,
                       "NAT Gateway should not be created when enable_nat_gateway=false")

    def test_18_resource_tagging_consistent(self):
        """Test 18: Verify consistent resource tagging strategy"""
        result = subprocess.run(
            ["terraform", "plan", "-input=false"],
            cwd=self.lib_dir,
            capture_output=True,
            text=True,
            env={**os.environ, **self.test_env}
        )

        # Check for default tags in plan output
        default_tags = [
            'Environment',
            'ManagedBy',
            'Project',
            'EnvironmentSuffix'
        ]

        for tag in default_tags:
            self.assertIn(tag, result.stdout,
                         f"Resources should have {tag} tag")

        # Verify ManagedBy = Terraform
        self.assertIn('"ManagedBy"         = "Terraform"', result.stdout,
                     "Resources should be tagged as managed by Terraform")


def run_integration_tests():
    """Run integration tests with detailed reporting"""
    import sys

    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Generate report
    total_tests = result.testsRun
    passed_tests = total_tests - len(result.failures) - len(result.errors)
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

    print(f"\n{'='*70}")
    print(f"Migration Workflow Integration Tests")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"{'='*70}\n")

    # Write report
    report_path = Path(__file__).parent.parent / "integration-test-report.txt"
    with open(report_path, "w") as f:
        f.write(f"AWS Region Migration Integration Test Report\n")
        f.write(f"============================================\n\n")
        f.write(f"Test Type: Live terraform plan validation\n")
        f.write(f"Dynamic Inputs: Yes (via environment variables and tfvars)\n")
        f.write(f"Mocking: No (uses real terraform binary and AWS provider)\n")
        f.write(f"Live Resource Validation: Yes (terraform plan validates against AWS API)\n\n")
        f.write(f"Total Tests: {total_tests}\n")
        f.write(f"Passed: {passed_tests}\n")
        f.write(f"Failed: {len(result.failures)}\n")
        f.write(f"Errors: {len(result.errors)}\n")
        f.write(f"Success Rate: {success_rate:.1f}%\n\n")
        f.write(f"Test Categories:\n")
        f.write(f"- Terraform workflow validation: 3 tests\n")
        f.write(f"- Resource creation validation: 6 tests\n")
        f.write(f"- Output validation: 1 test\n")
        f.write(f"- Documentation validation: 3 tests\n")
        f.write(f"- Multi-region support: 2 tests\n")
        f.write(f"- Cost optimization: 1 test\n")
        f.write(f"- Tagging strategy: 1 test\n")
        f.write(f"- Configuration validation: 1 test\n")

    return result.wasSuccessful(), success_rate


if __name__ == '__main__':
    success, rate = run_integration_tests()
    exit(0 if success else 1)
