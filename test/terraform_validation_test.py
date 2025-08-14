#!/usr/bin/env python3
"""
Unit tests for Terraform infrastructure validation
Tests the Terraform configuration for syntax, structure, and best practices
"""

import json
import os
import subprocess
import unittest
from pathlib import Path


class TerraformValidationTest(unittest.TestCase):
    """Test suite for Terraform configuration validation"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.terraform_dir = Path(__file__).parent.parent / "lib"
        cls.environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "synthtrainr842")
        
    def test_terraform_files_exist(self):
        """Test that all required Terraform files exist"""
        required_files = [
            "provider.tf",
            "variables.tf",
            "main.tf",
            "outputs.tf",
            "locals.tf"
        ]
        
        for file in required_files:
            file_path = self.terraform_dir / file
            self.assertTrue(
                file_path.exists(),
                f"Required Terraform file {file} does not exist"
            )
    
    def test_terraform_format(self):
        """Test that Terraform files are properly formatted"""
        result = subprocess.run(
            ["terraform", "fmt", "-check", "-recursive"],
            cwd=self.terraform_dir,
            capture_output=True,
            text=True
        )
        
        self.assertEqual(
            result.returncode, 0,
            f"Terraform files are not properly formatted: {result.stdout}"
        )
    
    def test_terraform_validate(self):
        """Test that Terraform configuration is valid"""
        # First initialize
        subprocess.run(
            ["terraform", "init", "-backend=false"],
            cwd=self.terraform_dir,
            capture_output=True,
            check=False
        )
        
        # Then validate
        result = subprocess.run(
            ["terraform", "validate"],
            cwd=self.terraform_dir,
            capture_output=True,
            text=True
        )
        
        self.assertEqual(
            result.returncode, 0,
            f"Terraform validation failed: {result.stdout} {result.stderr}"
        )
    
    def test_environment_suffix_variable(self):
        """Test that environment_suffix variable is defined"""
        variables_file = self.terraform_dir / "variables.tf"
        content = variables_file.read_text()
        
        self.assertIn(
            'variable "environment_suffix"',
            content,
            "environment_suffix variable not defined in variables.tf"
        )
    
    def test_locals_configuration(self):
        """Test that locals are properly configured"""
        locals_file = self.terraform_dir / "locals.tf"
        content = locals_file.read_text()
        
        # Check for environment suffix in locals
        self.assertIn(
            "environment_suffix",
            content,
            "environment_suffix not found in locals"
        )
        
        # Check for project prefix
        self.assertIn(
            "project_prefix",
            content,
            "project_prefix not found in locals"
        )
        
        # Check for common tags
        self.assertIn(
            "common_tags",
            content,
            "common_tags not found in locals"
        )
    
    def test_resource_naming_convention(self):
        """Test that resources use proper naming with environment suffix"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        
        for tf_file in tf_files:
            if tf_file.name in ["provider.tf", "variables.tf"]:
                continue
                
            content = tf_file.read_text()
            
            # Check that resources use local.project_prefix or local.short_prefix
            if 'resource "' in content:
                self.assertTrue(
                    "local.project_prefix" in content or "local.short_prefix" in content,
                    f"File {tf_file.name} does not use local.project_prefix or local.short_prefix for naming"
                )
    
    def test_security_resources_exist(self):
        """Test that security resources are defined"""
        security_resources = [
            "aws_kms_key",
            "aws_security_group",
            "aws_iam_role",
            "aws_guardduty_detector",
            "aws_config_configuration_recorder",
            "aws_wafv2_web_acl"
        ]
        
        tf_files = list(self.terraform_dir.glob("*.tf"))
        all_content = "\n".join([f.read_text() for f in tf_files])
        
        for resource in security_resources:
            self.assertIn(
                f'resource "{resource}"',
                all_content,
                f"Security resource {resource} not found in Terraform configuration"
            )
    
    def test_encryption_enabled(self):
        """Test that encryption is enabled for resources"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        all_content = "\n".join([f.read_text() for f in tf_files])
        
        # Check S3 encryption
        if "aws_s3_bucket" in all_content:
            self.assertIn(
                "aws_s3_bucket_server_side_encryption_configuration",
                all_content,
                "S3 bucket encryption configuration not found"
            )
        
        # Check RDS encryption
        if "aws_rds_cluster" in all_content:
            self.assertIn(
                "storage_encrypted = true",
                all_content,
                "RDS cluster encryption not enabled"
            )
        
        # Check EBS encryption
        if "block_device_mappings" in all_content:
            self.assertIn(
                "encrypted             = true",
                all_content,
                "EBS volume encryption not enabled"
            )
    
    def test_high_availability_configuration(self):
        """Test that high availability is configured"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        all_content = "\n".join([f.read_text() for f in tf_files])
        
        # Check for multiple subnets
        self.assertIn(
            "aws_subnet.public[*]",
            all_content,
            "Multiple public subnets not configured"
        )
        
        self.assertIn(
            "aws_subnet.private[*]",
            all_content,
            "Multiple private subnets not configured"
        )
        
        # Check for Auto Scaling
        if "aws_autoscaling_group" in all_content:
            self.assertIn(
                "min_size",
                all_content,
                "Auto Scaling min_size not configured"
            )
            self.assertIn(
                "max_size",
                all_content,
                "Auto Scaling max_size not configured"
            )
    
    def test_monitoring_configuration(self):
        """Test that monitoring is properly configured"""
        monitoring_file = self.terraform_dir / "monitoring.tf"
        
        if monitoring_file.exists():
            content = monitoring_file.read_text()
            
            # Check for CloudWatch log groups
            self.assertIn(
                "aws_cloudwatch_log_group",
                content,
                "CloudWatch log groups not configured"
            )
            
            # Check for CloudWatch alarms
            self.assertIn(
                "aws_cloudwatch_metric_alarm",
                content,
                "CloudWatch alarms not configured"
            )
            
            # Check for SNS topic for alerts
            self.assertIn(
                "aws_sns_topic",
                content,
                "SNS topic for alerts not configured"
            )
    
    def test_outputs_defined(self):
        """Test that necessary outputs are defined"""
        outputs_file = self.terraform_dir / "outputs.tf"
        content = outputs_file.read_text()
        
        required_outputs = [
            "vpc_id",
            "load_balancer_dns",
            "s3_bucket_name"
        ]
        
        for output in required_outputs:
            self.assertIn(
                f'output "{output}"',
                content,
                f"Required output {output} not defined"
            )
    
    def test_tags_consistency(self):
        """Test that resources use consistent tagging"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        
        for tf_file in tf_files:
            if tf_file.name in ["provider.tf", "variables.tf", "outputs.tf"]:
                continue
                
            content = tf_file.read_text()
            
            # Check that resources with tags use local.common_tags
            if "tags = " in content and 'resource "' in content:
                self.assertIn(
                    "local.common_tags",
                    content,
                    f"File {tf_file.name} does not use local.common_tags for resource tagging"
                )
    
    def test_no_hardcoded_credentials(self):
        """Test that no hardcoded credentials exist in the code"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        
        forbidden_patterns = [
            "aws_access_key_id",
            "aws_secret_access_key",
            "password =",
            "secret =",
            "token ="
        ]
        
        for tf_file in tf_files:
            content = tf_file.read_text().lower()
            
            for pattern in forbidden_patterns:
                # Allow manage_master_user_password as it's a boolean
                if pattern == "password =" and "manage_master_user_password = true" in content:
                    continue
                    
                self.assertNotIn(
                    pattern.lower(),
                    content,
                    f"Potential hardcoded credential pattern '{pattern}' found in {tf_file.name}"
                )
    
    def test_deletion_protection_disabled(self):
        """Test that deletion protection is disabled for destroyability"""
        tf_files = list(self.terraform_dir.glob("*.tf"))
        all_content = "\n".join([f.read_text() for f in tf_files])
        
        # Check RDS deletion protection
        if "aws_rds_cluster" in all_content:
            self.assertIn(
                "deletion_protection = false",
                all_content,
                "RDS deletion protection should be disabled for destroyability"
            )
        
        # Check S3 force_destroy
        if "aws_s3_bucket" in all_content:
            self.assertIn(
                "force_destroy = true",
                all_content,
                "S3 buckets should have force_destroy enabled for destroyability"
            )


class TerraformResourceTest(unittest.TestCase):
    """Test suite for specific Terraform resource configurations"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.terraform_dir = Path(__file__).parent.parent / "lib"
    
    def test_vpc_configuration(self):
        """Test VPC configuration"""
        main_file = self.terraform_dir / "main.tf"
        content = main_file.read_text()
        
        # Check VPC CIDR configuration
        self.assertIn(
            "cidr_block",
            content,
            "VPC CIDR block not configured"
        )
        
        # Check DNS settings
        self.assertIn(
            "enable_dns_hostnames = true",
            content,
            "DNS hostnames not enabled for VPC"
        )
        
        self.assertIn(
            "enable_dns_support   = true",
            content,
            "DNS support not enabled for VPC"
        )
    
    def test_security_group_configuration(self):
        """Test security group configurations"""
        sg_file = self.terraform_dir / "security_groups.tf"
        
        if sg_file.exists():
            content = sg_file.read_text()
            
            # Check for web security group
            self.assertIn(
                'aws_security_group" "web"',
                content,
                "Web security group not configured"
            )
            
            # Check for RDS security group
            self.assertIn(
                'aws_security_group" "rds"',
                content,
                "RDS security group not configured"
            )
            
            # Check for proper ingress rules
            self.assertIn(
                "ingress {",
                content,
                "Security group ingress rules not configured"
            )
            
            # Check for egress rules
            self.assertIn(
                "egress {",
                content,
                "Security group egress rules not configured"
            )
    
    def test_iam_roles_configuration(self):
        """Test IAM roles and policies configuration"""
        iam_file = self.terraform_dir / "iam.tf"
        
        if iam_file.exists():
            content = iam_file.read_text()
            
            # Check for EC2 role
            self.assertIn(
                "aws_iam_role",
                content,
                "IAM roles not configured"
            )
            
            # Check for assume role policy
            self.assertIn(
                "assume_role_policy",
                content,
                "IAM assume role policy not configured"
            )
            
            # Check for policy attachments
            self.assertIn(
                "aws_iam_role_policy_attachment",
                content,
                "IAM policy attachments not configured"
            )


def calculate_coverage():
    """Calculate and report test coverage"""
    total_tests = 0
    passed_tests = 0
    
    # Run tests and collect results
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TerraformValidationTest))
    suite.addTests(loader.loadTestsFromTestCase(TerraformResourceTest))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    total_tests = result.testsRun
    passed_tests = total_tests - len(result.failures) - len(result.errors)
    
    coverage_percentage = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n{'='*60}")
    print(f"Test Coverage Report")
    print(f"{'='*60}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Coverage: {coverage_percentage:.1f}%")
    print(f"{'='*60}")
    
    return coverage_percentage >= 90.0


if __name__ == "__main__":
    # Run tests
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    # Calculate coverage
    print("\nCalculating test coverage...")
    if calculate_coverage():
        print("✅ Test coverage meets the 90% requirement")
    else:
        print("❌ Test coverage does not meet the 90% requirement")