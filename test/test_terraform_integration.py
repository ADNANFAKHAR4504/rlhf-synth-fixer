#!/usr/bin/env python3
"""
Integration tests for AWS Region Migration Terraform Configuration
Tests terraform plan output, resource dependencies, and configuration validity
These tests validate the infrastructure would deploy correctly without actually deploying
"""

import unittest
import subprocess
import json
import re
from pathlib import Path


class TestTerraformPlanIntegration(unittest.TestCase):
    """Integration tests using terraform plan"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment and run terraform plan"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.plan_file = cls.lib_dir / "test.tfplan"

        # Ensure terraform is initialized
        init_result = subprocess.run(
            ["terraform", "init", "-backend=false"],
            cwd=cls.lib_dir,
            capture_output=True,
            text=True
        )
        if init_result.returncode != 0:
            raise Exception(f"Terraform init failed: {init_result.stderr}")

        # Run terraform plan
        plan_result = subprocess.run(
            ["terraform", "plan", "-out=test.tfplan"],
            cwd=cls.lib_dir,
            capture_output=True,
            text=True
        )
        cls.plan_output = plan_result.stdout
        cls.plan_returncode = plan_result.returncode

        # Get plan in JSON format for detailed analysis
        show_result = subprocess.run(
            ["terraform", "show", "-json", "test.tfplan"],
            cwd=cls.lib_dir,
            capture_output=True,
            text=True
        )
        if show_result.returncode == 0:
            cls.plan_json = json.loads(show_result.stdout)
        else:
            cls.plan_json = None

    def test_terraform_plan_succeeds(self):
        """Verify terraform plan completes without errors"""
        self.assertEqual(self.plan_returncode, 0,
                        "Terraform plan should complete successfully")

    def test_plan_creates_expected_resource_count(self):
        """Verify plan creates expected number of resources"""
        # Extract resource count from plan output
        match = re.search(r'Plan:\s*(\d+)\s*to add', self.plan_output)
        self.assertIsNotNone(match, "Plan should show resources to add")

        resource_count = int(match.group(1))
        # Expected: VPC, subnets (4), IGW, route tables (2), route table associations (4),
        # security groups (3), EC2 instances (2), RDS, S3, IAM role, instance profile, IAM policy
        # DB subnet group, S3 encryption, S3 versioning, S3 public access block
        # Total: ~26 resources
        self.assertGreaterEqual(resource_count, 20,
                               f"Should create at least 20 resources, got {resource_count}")

    def test_plan_has_no_errors(self):
        """Verify plan output contains no error messages"""
        error_keywords = ['Error:', 'error:', 'ERROR:', 'Failed:', 'FAILED:']
        for keyword in error_keywords:
            self.assertNotIn(keyword, self.plan_output,
                           f"Plan output should not contain {keyword}")

    def test_vpc_configuration_valid(self):
        """Verify VPC is configured correctly in plan"""
        self.assertIn('aws_vpc.main', self.plan_output,
                     "Plan should include VPC resource")

        if self.plan_json:
            # Find VPC resource in plan
            vpc_resource = self._find_resource_in_plan('aws_vpc', 'main')
            if vpc_resource:
                vpc_config = vpc_resource.get('values', {})
                self.assertTrue(vpc_config.get('enable_dns_hostnames'),
                              "VPC should have DNS hostnames enabled")
                self.assertTrue(vpc_config.get('enable_dns_support'),
                              "VPC should have DNS support enabled")

    def test_subnets_distributed_across_azs(self):
        """Verify subnets are distributed across availability zones"""
        if self.plan_json:
            public_subnets = self._find_all_resources_in_plan('aws_subnet', 'public')
            private_subnets = self._find_all_resources_in_plan('aws_subnet', 'private')

            # Should have subnets in multiple AZs
            self.assertGreater(len(public_subnets), 0,
                             "Should have public subnets")
            self.assertGreater(len(private_subnets), 0,
                             "Should have private subnets")

            # Check AZ distribution for public subnets
            azs = set()
            for subnet in public_subnets:
                az = subnet.get('values', {}).get('availability_zone')
                if az:
                    azs.add(az)
            self.assertGreaterEqual(len(azs), 2,
                                  "Public subnets should span at least 2 AZs")

    def test_security_groups_properly_referenced(self):
        """Verify security groups are properly referenced in resources"""
        if self.plan_json:
            # Check EC2 instances reference security groups
            web_instances = self._find_all_resources_in_plan('aws_instance', 'web')
            for instance in web_instances:
                sg_ids = instance.get('values', {}).get('vpc_security_group_ids', [])
                self.assertGreater(len(sg_ids), 0,
                                 "Web instances should have security groups")

    def test_rds_configuration_valid(self):
        """Verify RDS instance is configured correctly"""
        if self.plan_json:
            rds_resource = self._find_resource_in_plan('aws_db_instance', 'main')
            if rds_resource:
                rds_config = rds_resource.get('values', {})

                # Check encryption
                self.assertTrue(rds_config.get('storage_encrypted'),
                              "RDS should have storage encryption enabled")

                # Check deletion protection is false
                self.assertFalse(rds_config.get('deletion_protection'),
                               "RDS deletion protection should be false for testing")

                # Check skip final snapshot
                self.assertTrue(rds_config.get('skip_final_snapshot'),
                              "RDS should skip final snapshot for testing")

                # Check backup retention
                retention = rds_config.get('backup_retention_period', 0)
                self.assertGreaterEqual(retention, 7,
                                      "RDS should have backup retention >= 7 days")

    def test_s3_bucket_configuration_valid(self):
        """Verify S3 bucket is configured with security features"""
        if self.plan_json:
            # Check bucket exists
            bucket = self._find_resource_in_plan('aws_s3_bucket', 'app_data')
            self.assertIsNotNone(bucket, "S3 bucket should be in plan")

            # Check encryption configuration
            encryption = self._find_resource_in_plan(
                'aws_s3_bucket_server_side_encryption_configuration',
                'app_data'
            )
            self.assertIsNotNone(encryption,
                               "S3 bucket should have encryption configured")

            # Check public access block
            public_access = self._find_resource_in_plan(
                'aws_s3_bucket_public_access_block',
                'app_data'
            )
            self.assertIsNotNone(public_access,
                               "S3 bucket should have public access blocked")

            if public_access:
                pa_config = public_access.get('values', {})
                self.assertTrue(pa_config.get('block_public_acls'),
                              "Should block public ACLs")
                self.assertTrue(pa_config.get('block_public_policy'),
                              "Should block public policy")

    def test_iam_role_configuration_valid(self):
        """Verify IAM roles are configured correctly"""
        if self.plan_json:
            role = self._find_resource_in_plan('aws_iam_role', 'ec2_role')
            if role:
                role_config = role.get('values', {})
                assume_policy = role_config.get('assume_role_policy')

                # Verify assume role policy exists
                self.assertIsNotNone(assume_policy,
                                   "IAM role should have assume role policy")

                # Check if policy allows EC2 to assume role
                if assume_policy:
                    self.assertIn('ec2.amazonaws.com', assume_policy,
                                "Assume role policy should allow EC2 service")

    def test_ec2_instances_use_iam_profile(self):
        """Verify EC2 instances are assigned IAM instance profile"""
        if self.plan_json:
            web_instances = self._find_all_resources_in_plan('aws_instance', 'web')
            for instance in web_instances:
                profile = instance.get('values', {}).get('iam_instance_profile')
                self.assertIsNotNone(profile,
                                   "EC2 instances should have IAM instance profile")

    def test_route_tables_configured(self):
        """Verify route tables are properly configured"""
        if self.plan_json:
            # Public route table should have IGW route
            public_rt = self._find_resource_in_plan('aws_route_table', 'public')
            if public_rt:
                routes = public_rt.get('values', {}).get('route', [])
                has_igw_route = False
                for route in routes:
                    if route.get('cidr_block') == '0.0.0.0/0' and route.get('gateway_id'):
                        has_igw_route = True
                        break
                self.assertTrue(has_igw_route,
                              "Public route table should have IGW route")

    def test_resource_naming_includes_suffix(self):
        """Verify all resources include environment suffix in their names/tags"""
        if self.plan_json:
            # Sample some resources to check naming
            resources_to_check = [
                ('aws_vpc', 'main'),
                ('aws_security_group', 'web'),
                ('aws_db_subnet_group', 'main')
            ]

            for resource_type, resource_name in resources_to_check:
                resource = self._find_resource_in_plan(resource_type, resource_name)
                if resource:
                    values = resource.get('values', {})
                    tags = values.get('tags', {})
                    name_tag = tags.get('Name', '')

                    # Should include suffix (in this test it's synth101000888)
                    self.assertIn('synth101000888', name_tag,
                                f"{resource_type}.{resource_name} should include suffix in name")

    def test_resource_dependencies_valid(self):
        """Verify resource dependencies are properly configured"""
        if self.plan_json and 'resource_changes' in self.plan_json:
            changes = self.plan_json['resource_changes']

            # Find resources that depend on VPC
            vpc_dependent_resources = [
                'aws_subnet',
                'aws_security_group',
                'aws_internet_gateway'
            ]

            for change in changes:
                resource_type = change.get('type', '')
                if resource_type in vpc_dependent_resources:
                    # These resources should reference VPC
                    values = change.get('change', {}).get('after', {})
                    self.assertIsNotNone(values.get('vpc_id'),
                                       f"{resource_type} should reference VPC")

    def test_outputs_will_be_created(self):
        """Verify outputs will be created after apply"""
        self.assertIn('Changes to Outputs:', self.plan_output,
                     "Plan should show output changes")

        # Check for key outputs
        expected_outputs = [
            'vpc_id',
            'public_subnet_ids',
            'private_subnet_ids',
            's3_bucket_name'
        ]

        for output in expected_outputs:
            self.assertIn(output, self.plan_output,
                         f"Plan should include {output} in outputs")

    def test_no_resource_deletions(self):
        """Verify plan doesn't delete any resources (new infrastructure)"""
        # Extract deletion count from plan
        match = re.search(r'(\d+)\s*to destroy', self.plan_output)
        if match:
            delete_count = int(match.group(1))
            self.assertEqual(delete_count, 0,
                           "Plan should not delete any resources")

    def test_cost_optimization_features(self):
        """Verify cost optimization features are configured"""
        if self.plan_json:
            # NAT Gateway should be optional (disabled in test config)
            nat_gateways = self._find_all_resources_in_plan('aws_nat_gateway', 'main')
            # With enable_nat_gateway=false, should not create NAT gateway
            self.assertEqual(len(nat_gateways), 0,
                           "NAT Gateway should be disabled for cost optimization")

            # Check instance types are cost-effective
            web_instances = self._find_all_resources_in_plan('aws_instance', 'web')
            for instance in web_instances:
                instance_type = instance.get('values', {}).get('instance_type', '')
                self.assertTrue(instance_type.startswith('t3.') or instance_type.startswith('t4g.'),
                              f"Should use cost-effective instance type, got {instance_type}")

    # Helper methods
    def _find_resource_in_plan(self, resource_type, resource_name):
        """Find a specific resource in the plan JSON"""
        if not self.plan_json or 'resource_changes' not in self.plan_json:
            return None

        for change in self.plan_json['resource_changes']:
            if (change.get('type') == resource_type and
                change.get('name') == resource_name):
                return change.get('change', {}).get('after', {})
        return None

    def _find_all_resources_in_plan(self, resource_type, resource_name_pattern=None):
        """Find all resources of a specific type in the plan"""
        if not self.plan_json or 'resource_changes' not in self.plan_json:
            return []

        resources = []
        for change in self.plan_json['resource_changes']:
            if change.get('type') == resource_type:
                if resource_name_pattern is None or resource_name_pattern in change.get('name', ''):
                    resources.append(change.get('change', {}).get('after', {}))
        return resources


class TestDocumentationIntegration(unittest.TestCase):
    """Integration tests for migration documentation"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_state_migration_doc_has_terraform_commands(self):
        """Verify state migration doc includes terraform commands"""
        doc_path = self.lib_dir / "state-migration.md"
        with open(doc_path, 'r') as f:
            content = f.read()

        # Should have terraform commands
        terraform_commands = [
            'terraform init',
            'terraform workspace',
            'terraform plan',
            'terraform apply',
            'terraform state'
        ]

        for cmd in terraform_commands:
            self.assertIn(cmd, content,
                         f"state-migration.md should include {cmd} command")

    def test_runbook_has_execution_steps(self):
        """Verify runbook has detailed execution steps"""
        doc_path = self.lib_dir / "runbook.md"
        with open(doc_path, 'r') as f:
            content = f.read()

        # Should have key sections
        sections = [
            'Pre-Migration',
            'Migration',
            'Rollback',
            'Validation'
        ]

        for section in sections:
            self.assertIn(section, content,
                         f"runbook.md should have {section} section")

    def test_id_mapping_has_sample_data(self):
        """Verify id-mapping.csv has sample resource mappings"""
        csv_path = self.lib_dir / "id-mapping.csv"
        with open(csv_path, 'r') as f:
            content = f.read()

        # Should have headers
        self.assertIn('resource', content, "CSV should have resource column")
        self.assertIn('old_id', content, "CSV should have old_id column")
        self.assertIn('new_id', content, "CSV should have new_id column")

        # Should have sample data for key resources
        resources = ['vpc', 'subnet', 'security_group', 'ec2_instance']
        for resource in resources:
            self.assertIn(resource, content,
                         f"CSV should have sample data for {resource}")


def run_integration_tests():
    """Run integration tests"""
    import sys

    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Generate report
    total_tests = result.testsRun
    passed_tests = total_tests - len(result.failures) - len(result.errors)

    print(f"\n{'='*70}")
    print(f"Integration Tests: {passed_tests}/{total_tests} passed")
    print(f"{'='*70}\n")

    # Write report
    test_dir = Path(__file__).parent
    with open(test_dir.parent / "integration-test-report.txt", "w") as f:
        f.write(f"Terraform Integration Test Report\n")
        f.write(f"==================================\n\n")
        f.write(f"Total Tests: {total_tests}\n")
        f.write(f"Passed: {passed_tests}\n")
        f.write(f"Failed: {len(result.failures)}\n")
        f.write(f"Errors: {len(result.errors)}\n")
        f.write(f"Success Rate: {(passed_tests/total_tests*100):.1f}%\n")

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_integration_tests()
    exit(0 if success else 1)
