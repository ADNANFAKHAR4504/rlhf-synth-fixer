#!/usr/bin/env python3
"""
Unit tests for Terraform Configuration Optimizer

Tests all functions and code paths in lib/optimize.py
"""

import os
import sys
import re
import tempfile
import shutil
import unittest
from unittest.mock import patch, mock_open, MagicMock
from io import StringIO

# Add lib to path so we can import optimize
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
import optimize


class TestTerraformOptimizer(unittest.TestCase):
    """Test suite for TerraformOptimizer class"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.input_file = os.path.join(self.test_dir, 'test-input.tf')
        self.output_dir = os.path.join(self.test_dir, 'output')

        # Sample legacy Terraform configuration
        self.sample_legacy_config = """
resource "aws_security_group" "payment_sg" {
  name = "payment-sg"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.2.0/24"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.3.0/24"]
  }
}

resource "aws_instance" "payment_server" {
  ami           = "ami-12345"
  instance_type = "t2.medium"
}
"""

        # Write sample input file
        with open(self.input_file, 'w', encoding='utf-8') as f:
            f.write(self.sample_legacy_config)

    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_init_with_output_dir(self):
        """Test TerraformOptimizer initialization with output_dir"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        self.assertEqual(optimizer.input_file, self.input_file)
        self.assertEqual(optimizer.output_dir, self.output_dir)
        self.assertEqual(optimizer.legacy_content, "")
        self.assertEqual(optimizer.main_tf, [])
        self.assertEqual(optimizer.variables_tf, [])
        self.assertEqual(optimizer.outputs_tf, [])

    def test_init_without_output_dir(self):
        """Test TerraformOptimizer initialization without output_dir"""
        optimizer = optimize.TerraformOptimizer(self.input_file)
        self.assertEqual(optimizer.output_dir, os.path.dirname(self.input_file))

    def test_init_with_empty_input_dir(self):
        """Test initialization when input file has no directory"""
        optimizer = optimize.TerraformOptimizer('file.tf')
        self.assertEqual(optimizer.output_dir, '.')

    def test_read_input_success(self):
        """Test reading input file successfully"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.read_input()
        self.assertGreater(len(optimizer.legacy_content), 0)
        self.assertIn('aws_security_group', optimizer.legacy_content)

    def test_read_input_file_not_found(self):
        """Test reading non-existent input file"""
        optimizer = optimize.TerraformOptimizer('/nonexistent/file.tf', self.output_dir)
        with self.assertRaises(SystemExit) as cm:
            optimizer.read_input()
        self.assertEqual(cm.exception.code, 1)

    def test_read_input_generic_exception(self):
        """Test handling of generic exception during file read"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)

        # Mock open to raise a generic exception
        with patch('builtins.open', side_effect=IOError("Permission denied")):
            with self.assertRaises(SystemExit) as cm:
                optimizer.read_input()
            self.assertEqual(cm.exception.code, 1)

    def test_extract_security_group_rules_with_matches(self):
        """Test extracting security group rules from legacy config"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.read_input()

        ports, cidr_blocks = optimizer.extract_security_group_rules()

        self.assertIsInstance(ports, list)
        self.assertIsInstance(cidr_blocks, list)
        self.assertIn('80', ports)
        self.assertIn('443', ports)
        self.assertIn('8080', ports)
        self.assertIn('10.0.1.0/24', cidr_blocks)

    def test_extract_security_group_rules_no_matches(self):
        """Test extracting security group rules when none found"""
        empty_file = os.path.join(self.test_dir, 'empty.tf')
        with open(empty_file, 'w', encoding='utf-8') as f:
            f.write("# Empty file")

        optimizer = optimize.TerraformOptimizer(empty_file, self.output_dir)
        optimizer.read_input()

        ports, cidr_blocks = optimizer.extract_security_group_rules()

        # Should return defaults
        self.assertEqual(ports, ["80", "443", "8080", "8443"])
        self.assertEqual(len(cidr_blocks), 10)

    def test_create_variables_file(self):
        """Test creating variables.tf content"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.create_variables_file()

        self.assertIsInstance(optimizer.variables_tf, list)
        self.assertGreater(len(optimizer.variables_tf), 0)

        variables_content = '\n'.join(optimizer.variables_tf)
        self.assertIn('variable "environment_suffix"', variables_content)
        self.assertIn('variable "aws_region"', variables_content)
        self.assertIn('variable "instance_type"', variables_content)
        self.assertIn('variable "allowed_ports"', variables_content)
        self.assertIn('variable "s3_bucket_environments"', variables_content)
        self.assertIn('variable "db_password"', variables_content)
        self.assertIn('sensitive   = true', variables_content)

    def test_create_main_file(self):
        """Test creating main.tf content"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.read_input()
        optimizer.create_main_file()

        self.assertIsInstance(optimizer.main_tf, list)
        self.assertGreater(len(optimizer.main_tf), 0)

        main_content = '\n'.join(optimizer.main_tf)

        # Check for key optimizations
        self.assertIn('terraform {', main_content)
        self.assertIn('required_version = ">= 1.5.0"', main_content)
        self.assertIn('data "aws_ami" "amazon_linux_2"', main_content)
        self.assertIn('dynamic "ingress"', main_content)
        self.assertIn('setproduct(var.allowed_ports, var.allowed_cidr_blocks)', main_content)
        self.assertIn('data "aws_iam_policy_document"', main_content)
        self.assertIn('for_each = toset(var.s3_bucket_environments)', main_content)
        self.assertIn('depends_on = [', main_content)
        self.assertIn('lifecycle {', main_content)
        self.assertIn('ignore_changes = [password]', main_content)
        self.assertIn('merge(', main_content)
        self.assertIn('${var.environment_suffix}', main_content)

    def test_create_outputs_file(self):
        """Test creating outputs.tf content"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.create_outputs_file()

        self.assertIsInstance(optimizer.outputs_tf, list)
        self.assertGreater(len(optimizer.outputs_tf), 0)

        outputs_content = '\n'.join(optimizer.outputs_tf)

        # Check for required outputs
        self.assertIn('output "alb_dns_name"', outputs_content)
        self.assertIn('output "database_endpoint"', outputs_content)
        self.assertIn('sensitive   = true', outputs_content)
        self.assertIn('description =', outputs_content)
        self.assertIn('output "s3_bucket_names"', outputs_content)
        self.assertIn('output "ec2_instance_ids"', outputs_content)

    def test_write_outputs_success(self):
        """Test writing output files successfully"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()
        optimizer.write_outputs()

        # Verify files were created
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'main.tf')))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'variables.tf')))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'outputs.tf')))

        # Verify content
        with open(os.path.join(self.output_dir, 'main.tf'), 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('terraform {', content)

    def test_write_outputs_create_directory(self):
        """Test that write_outputs creates output directory if it doesn't exist"""
        new_output_dir = os.path.join(self.test_dir, 'new_output')
        optimizer = optimize.TerraformOptimizer(self.input_file, new_output_dir)
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()

        self.assertFalse(os.path.exists(new_output_dir))
        optimizer.write_outputs()
        self.assertTrue(os.path.exists(new_output_dir))

    def test_write_outputs_file_write_error(self):
        """Test handling of file write errors"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()

        # Mock open to raise exception on write
        with patch('builtins.open', side_effect=IOError("Disk full")):
            with self.assertRaises(SystemExit) as cm:
                optimizer.write_outputs()
            self.assertEqual(cm.exception.code, 1)

    def test_optimize_full_workflow(self):
        """Test the complete optimization workflow"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.output_dir)

        # Capture stdout to verify print statements
        with patch('sys.stdout', new=StringIO()) as fake_out:
            optimizer.optimize()
            output = fake_out.getvalue()

            # Verify workflow steps
            self.assertIn('[1/5] Reading input file...', output)
            self.assertIn('[2/5] Creating variables.tf...', output)
            self.assertIn('[3/5] Creating optimized main.tf...', output)
            self.assertIn('[4/5] Creating outputs.tf...', output)
            self.assertIn('[5/5] Writing output files...', output)
            self.assertIn('Optimization Complete', output)

        # Verify all files were created
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'main.tf')))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'variables.tf')))
        self.assertTrue(os.path.exists(os.path.join(self.output_dir, 'outputs.tf')))


class TestExtractionEdgeCases(unittest.TestCase):
    """Test suite for edge cases in security group rule extraction"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.input_file = os.path.join(self.test_dir, 'test.tf')

    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_extract_duplicate_ports_and_cidrs(self):
        """Test extracting rules with duplicate ports and CIDR blocks"""
        # Create config with duplicate ports and CIDRs
        config_with_duplicates = """
resource "aws_security_group" "test" {
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["10.0.1.0/24"] }
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["10.0.1.0/24"] }
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["10.0.2.0/24"] }
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["10.0.2.0/24"] }
}
"""
        with open(self.input_file, 'w', encoding='utf-8') as f:
            f.write(config_with_duplicates)

        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.read_input()

        ports, cidr_blocks = optimizer.extract_security_group_rules()

        # Should deduplicate
        self.assertEqual(len(ports), 2)
        self.assertEqual(len(cidr_blocks), 2)
        self.assertIn('80', ports)
        self.assertIn('443', ports)
        self.assertIn('10.0.1.0/24', cidr_blocks)
        self.assertIn('10.0.2.0/24', cidr_blocks)


class TestMain(unittest.TestCase):
    """Test suite for main function and CLI"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.input_file = os.path.join(self.test_dir, 'test.tf')

        with open(self.input_file, 'w', encoding='utf-8') as f:
            f.write("resource \"aws_instance\" \"test\" { ami = \"ami-123\" }")

    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_main_with_required_args(self):
        """Test main function with required arguments"""
        test_args = ['optimize.py', '--input', self.input_file]

        with patch('sys.argv', test_args):
            with patch('sys.stdout', new=StringIO()):
                optimize.main()

        # Verify output files were created
        output_dir = os.path.dirname(self.input_file)
        self.assertTrue(os.path.exists(os.path.join(output_dir, 'main.tf')))

    def test_main_with_output_dir(self):
        """Test main function with output-dir argument"""
        output_dir = os.path.join(self.test_dir, 'output')
        test_args = ['optimize.py', '--input', self.input_file, '--output-dir', output_dir]

        with patch('sys.argv', test_args):
            with patch('sys.stdout', new=StringIO()):
                optimize.main()

        # Verify output files in specified directory
        self.assertTrue(os.path.exists(os.path.join(output_dir, 'main.tf')))

    def test_main_with_version(self):
        """Test main function with --version argument"""
        test_args = ['optimize.py', '--version']

        with patch('sys.argv', test_args):
            with self.assertRaises(SystemExit) as cm:
                optimize.main()
            # Version flag causes exit with code 0
            self.assertEqual(cm.exception.code, 0)

    def test_main_missing_input_arg(self):
        """Test main function without required --input argument"""
        test_args = ['optimize.py']

        with patch('sys.argv', test_args):
            with self.assertRaises(SystemExit):
                optimize.main()

    def test_main_entry_point(self):
        """Test __main__ entry point by executing script directly"""
        test_args = ['python', 'lib/optimize.py', '--input', self.input_file]

        # Execute the script as a subprocess to test __main__ block
        import subprocess
        result = subprocess.run(
            test_args,
            cwd=os.path.join(os.path.dirname(__file__), '..'),
            capture_output=True,
            text=True,
            timeout=10
        )

        # Should succeed
        self.assertEqual(result.returncode, 0)

        # Verify output was created
        output_dir = os.path.dirname(self.input_file)
        self.assertTrue(os.path.exists(os.path.join(output_dir, 'main.tf')))


class TestOptimizationDetails(unittest.TestCase):
    """Test suite for specific optimization features"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.input_file = os.path.join(self.test_dir, 'test.tf')

        # Sample config with multiple ingress rules
        self.config_with_rules = """
resource "aws_security_group" "test" {
  ingress { from_port = 80; to_port = 80; protocol = "tcp"; cidr_blocks = ["10.0.1.0/24"] }
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["10.0.2.0/24"] }
  ingress { from_port = 8080; to_port = 8080; protocol = "tcp"; cidr_blocks = ["10.0.3.0/24"] }
  ingress { from_port = 8443; to_port = 8443; protocol = "tcp"; cidr_blocks = ["10.0.4.0/24"] }
}
"""
        with open(self.input_file, 'w', encoding='utf-8') as f:
            f.write(self.config_with_rules)

    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_optimization_1_dynamic_blocks(self):
        """Test Optimization #1: Dynamic blocks for security group rules"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.read_input()
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify dynamic blocks are used
        self.assertIn('dynamic "ingress"', main_content)
        self.assertIn('for_each = [', main_content)
        self.assertIn('setproduct(var.allowed_ports, var.allowed_cidr_blocks)', main_content)
        self.assertIn('ingress.value.port', main_content)
        self.assertIn('ingress.value.cidr', main_content)

    def test_optimization_2_data_sources(self):
        """Test Optimization #2: Replace hardcoded values with data sources"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify data sources
        self.assertIn('data "aws_ami" "amazon_linux_2"', main_content)
        self.assertIn('data "aws_availability_zones" "available"', main_content)
        self.assertIn('most_recent = true', main_content)

    def test_optimization_3_explicit_dependencies(self):
        """Test Optimization #3: Explicit dependencies for RDS"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify depends_on is present
        self.assertIn('depends_on = [', main_content)
        self.assertIn('aws_security_group.rds_sg', main_content)
        self.assertIn('aws_db_subnet_group.payment_db_subnet', main_content)

    def test_optimization_4_iam_policy_documents(self):
        """Test Optimization #4: IAM policy documents instead of inline"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify policy documents
        self.assertIn('data "aws_iam_policy_document" "ec2_assume_role"', main_content)
        self.assertIn('data "aws_iam_policy_document" "ec2_s3_access"', main_content)
        self.assertIn('statement {', main_content)
        self.assertIn('principals {', main_content)

    def test_optimization_5_for_each_buckets(self):
        """Test Optimization #5: Consolidate S3 buckets with for_each"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify for_each usage
        self.assertIn('for_each = toset(var.s3_bucket_environments)', main_content)
        self.assertIn('resource "aws_s3_bucket" "transaction_logs"', main_content)
        self.assertIn('each.key', main_content)
        self.assertIn('each.value', main_content)

    def test_optimization_6_lifecycle_ignore_changes(self):
        """Test Optimization #6: Lifecycle ignore_changes for RDS password"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify lifecycle block
        self.assertIn('lifecycle {', main_content)
        self.assertIn('ignore_changes = [password]', main_content)

    def test_optimization_7_tagging_merge(self):
        """Test Optimization #7: Tagging strategy with merge()"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify merge() usage in tags
        self.assertIn('tags = merge(', main_content)
        self.assertIn('var.common_tags,', main_content)

        # Count occurrences - should be used in multiple resources
        merge_count = main_content.count('tags = merge(')
        self.assertGreater(merge_count, 5)

    def test_optimization_8_sensitive_outputs(self):
        """Test Optimization #8: Sensitive outputs with descriptions"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_outputs_file()

        outputs_content = '\n'.join(optimizer.outputs_tf)

        # Verify sensitive markers
        sensitive_count = outputs_content.count('sensitive   = true')
        self.assertGreaterEqual(sensitive_count, 2)

        # Verify descriptions
        description_count = outputs_content.count('description =')
        self.assertGreater(description_count, 5)

        # Verify specific sensitive outputs
        self.assertIn('output "database_endpoint"', outputs_content)
        self.assertIn('output "database_address"', outputs_content)

    def test_environment_suffix_usage(self):
        """Test that environment_suffix is used throughout"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Count environment_suffix usage - should be widespread
        suffix_count = main_content.count('${var.environment_suffix}')
        self.assertGreater(suffix_count, 10)

    def test_destroyability_settings(self):
        """Test that all resources are destroyable"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Verify destroyability settings
        self.assertIn('skip_final_snapshot = true', main_content)
        self.assertIn('deletion_protection = false', main_content)
        self.assertIn('enable_deletion_protection = false', main_content)


class TestNewImprovements(unittest.TestCase):
    """Test suite for 10 new improvements from IDEAL_RESPONSE"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.input_file = os.path.join(self.test_dir, 'test.tf')
        with open(self.input_file, 'w', encoding='utf-8') as f:
            f.write("resource \"aws_instance\" \"test\" { ami = \"ami-123\" }")

    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_fix_1_permission_error_handling(self):
        """Test FIX #1: PermissionError handling in read_input"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        with patch('builtins.open', side_effect=PermissionError("Access denied")):
            with self.assertRaises(SystemExit) as cm:
                optimizer.read_input()
            self.assertEqual(cm.exception.code, 1)

    def test_fix_1_unicode_decode_error_handling(self):
        """Test FIX #1: UnicodeDecodeError handling in read_input"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        with patch('builtins.open', side_effect=UnicodeDecodeError('utf-8', b'', 0, 1, 'invalid')):
            with self.assertRaises(SystemExit) as cm:
                optimizer.read_input()
            self.assertEqual(cm.exception.code, 1)

    def test_fix_2_compiled_regex_pattern(self):
        """Test FIX #2: Compiled regex pattern at class level"""
        # Verify INGRESS_PATTERN exists as class attribute
        self.assertTrue(hasattr(optimize.TerraformOptimizer, 'INGRESS_PATTERN'))
        # Verify it's a compiled pattern
        import re
        self.assertIsInstance(optimize.TerraformOptimizer.INGRESS_PATTERN, re.Pattern)

    def test_fix_3_variable_validation_constraints(self):
        """Test FIX #3: Variable validation blocks present"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_variables_file()

        variables_content = '\n'.join(optimizer.variables_tf)

        # Check for validation blocks
        self.assertIn('validation {', variables_content)
        self.assertIn('condition', variables_content)
        self.assertIn('error_message', variables_content)

        # Check specific validations
        self.assertIn('can(regex("^[a-z0-9-]+$", var.environment_suffix))', variables_content)
        self.assertIn('can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))', variables_content)
        self.assertIn('alltrue([for port in var.allowed_ports : port >= 1 && port <= 65535])', variables_content)
        self.assertIn('length(var.db_password) >= 8', variables_content)

    def test_fix_3_log_retention_variable(self):
        """Test FIX #3: New log_retention_days variable with validation"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_variables_file()

        variables_content = '\n'.join(optimizer.variables_tf)
        self.assertIn('variable "log_retention_days"', variables_content)
        self.assertIn('var.log_retention_days >= 30 && var.log_retention_days <= 365', variables_content)

    def test_fix_4_comprehensive_iam_permissions(self):
        """Test FIX #4: Complete IAM permissions"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for extended permissions
        self.assertIn('s3:DeleteObject', main_content)
        self.assertIn('logs:DescribeLogStreams', main_content)
        self.assertIn('ec2:DescribeInstances', main_content)
        self.assertIn('ec2:DescribeTags', main_content)
        self.assertIn('ec2:DescribeVolumes', main_content)
        self.assertIn('ssm:GetParameter', main_content)

        # Check for statement IDs
        self.assertIn('sid    = "S3LogAccess"', main_content)
        self.assertIn('sid    = "CloudWatchLogs"', main_content)
        self.assertIn('sid    = "EC2Describe"', main_content)
        self.assertIn('sid    = "SSMParameterAccess"', main_content)

    def test_fix_5_rds_cloudwatch_log_exports(self):
        """Test FIX #5: RDS CloudWatch log exports"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for CloudWatch log exports
        self.assertIn('enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]', main_content)
        self.assertIn('performance_insights_enabled    = true', main_content)
        self.assertIn('performance_insights_retention_period = 7', main_content)

    def test_fix_6_s3_lifecycle_policies(self):
        """Test FIX #6: S3 lifecycle policies"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for lifecycle configuration
        self.assertIn('resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs"', main_content)
        self.assertIn('transition {', main_content)
        self.assertIn('storage_class = "STANDARD_IA"', main_content)
        self.assertIn('storage_class = "GLACIER"', main_content)
        self.assertIn('expiration {', main_content)
        self.assertIn('days = var.log_retention_days', main_content)
        self.assertIn('abort_incomplete_multipart_upload {', main_content)

    def test_fix_7_alb_access_logs(self):
        """Test FIX #7: ALB access logs"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for ALB logs bucket
        self.assertIn('resource "aws_s3_bucket" "alb_logs"', main_content)
        self.assertIn('data "aws_elb_service_account" "main"', main_content)
        self.assertIn('resource "aws_s3_bucket_policy" "alb_logs"', main_content)

        # Check for access_logs configuration
        self.assertIn('access_logs {', main_content)
        self.assertIn('bucket  = aws_s3_bucket.alb_logs.id', main_content)
        self.assertIn('enabled = true', main_content)

        # Check for additional ALB features
        self.assertIn('enable_http2              = true', main_content)
        self.assertIn('enable_cross_zone_load_balancing = true', main_content)

    def test_fix_8_target_group_optimizations(self):
        """Test FIX #8: Target group deregistration_delay and stickiness"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for deregistration_delay
        self.assertIn('deregistration_delay = 30', main_content)

        # Check for stickiness
        self.assertIn('stickiness {', main_content)
        self.assertIn('type            = "lb_cookie"', main_content)
        self.assertIn('enabled         = true', main_content)
        self.assertIn('cookie_duration = 86400', main_content)

    def test_fix_9_enhanced_user_data(self):
        """Test FIX #9: Enhanced user_data with error handling"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_main_file()

        main_content = '\n'.join(optimizer.main_tf)

        # Check for monitoring and metadata options
        self.assertIn('monitoring = true', main_content)
        self.assertIn('metadata_options {', main_content)
        self.assertIn('http_tokens                 = "required"', main_content)

        # Check for enhanced user_data
        self.assertIn('set -e', main_content)
        self.assertIn('exec > >(tee /var/log/user-data.log)', main_content)
        self.assertIn('exec 2>&1', main_content)
        self.assertIn('|| { echo "Failed to update packages"; exit 1; }', main_content)
        # Check for the CloudWatch agent error handling (may be split across lines)
        self.assertIn('Failed to install CloudWatch agent', main_content)

        # Check for CloudWatch configuration
        self.assertIn('cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json', main_content)
        self.assertIn('"mem_used_percent"', main_content)
        self.assertIn('"disk_used_percent"', main_content)

    def test_fix_10_directory_creation_error_handling(self):
        """Test FIX #10: Directory creation with error handling"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()

        # Mock os.makedirs to raise PermissionError
        with patch('os.makedirs', side_effect=PermissionError("No write access")):
            with self.assertRaises(SystemExit) as cm:
                optimizer.write_outputs()
            self.assertEqual(cm.exception.code, 1)

    def test_fix_10_file_write_with_encoding(self):
        """Test FIX #10: File write with explicit UTF-8 encoding"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()

        # Patch open to capture encoding parameter
        original_open = open
        encoding_used = []

        def mock_open_wrapper(*args, **kwargs):
            if 'encoding' in kwargs:
                encoding_used.append(kwargs['encoding'])
            return original_open(*args, **kwargs)

        with patch('builtins.open', side_effect=mock_open_wrapper):
            optimizer.write_outputs()

        # Verify UTF-8 encoding was used
        self.assertIn('utf-8', encoding_used)

    def test_all_optimizations_present(self):
        """Integration test: Verify all 10 fixes are present"""
        optimizer = optimize.TerraformOptimizer(self.input_file, self.test_dir)
        optimizer.read_input()
        optimizer.create_variables_file()
        optimizer.create_main_file()
        optimizer.create_outputs_file()

        main_content = '\n'.join(optimizer.main_tf)
        variables_content = '\n'.join(optimizer.variables_tf)
        outputs_content = '\n'.join(optimizer.outputs_tf)

        # FIX #2: Compiled regex
        self.assertIsInstance(optimize.TerraformOptimizer.INGRESS_PATTERN, re.Pattern)

        # FIX #3: Validation blocks
        self.assertGreater(variables_content.count('validation {'), 5)

        # FIX #4: Extended IAM
        self.assertIn('ec2:DescribeInstances', main_content)

        # FIX #5: RDS CloudWatch
        self.assertIn('enabled_cloudwatch_logs_exports', main_content)

        # FIX #6: S3 lifecycle
        self.assertIn('aws_s3_bucket_lifecycle_configuration', main_content)

        # FIX #7: ALB logs
        self.assertIn('aws_s3_bucket.alb_logs', main_content)

        # FIX #8: Target group optimizations
        self.assertIn('deregistration_delay = 30', main_content)
        self.assertIn('stickiness {', main_content)

        # FIX #9: Enhanced user_data
        self.assertIn('http_tokens                 = "required"', main_content)
        self.assertIn('set -e', main_content)

        # FIX #10: Output with ALB logs bucket
        self.assertIn('output "alb_logs_bucket"', outputs_content)


if __name__ == '__main__':
    unittest.main()
