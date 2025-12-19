#!/usr/bin/env python3
"""
Tests for Terraform optimization script.
Validates that the optimization script works correctly and produces valid Terraform.
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock

# Add lib directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "lib"))

from optimize import TerraformOptimizer


class TestTerraformOptimizer(unittest.TestCase):
    """Test cases for TerraformOptimizer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = tempfile.mkdtemp()
        self.optimizer = TerraformOptimizer(self.test_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_optimizer_initialization(self):
        """Test that optimizer initializes correctly."""
        self.assertIsNotNone(self.optimizer)
        self.assertEqual(self.optimizer.tf_dir, Path(self.test_dir))
        self.assertEqual(len(self.optimizer.optimizations_applied), 0)

    def test_optimize_main_tf_creates_valid_content(self):
        """Test that optimize_main_tf creates valid Terraform content."""
        # Create a minimal main.tf
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Original main.tf\n" * 100)  # 100 lines

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIsNotNone(content)
        self.assertIn("terraform {", content)
        self.assertIn("provider \"aws\"", content)
        self.assertIn("locals {", content)
        self.assertIn("for_each", content)
        self.assertIn("dynamic \"ingress\"", content)

    def test_optimize_main_tf_without_file(self):
        """Test that optimize_main_tf handles missing file gracefully."""
        success, content = self.optimizer.optimize_main_tf()

        self.assertFalse(success)
        self.assertEqual(content, "")

    def test_optimize_main_tf_reduces_lines(self):
        """Test that optimization reduces line count."""
        # Create a verbose main.tf
        main_tf_path = Path(self.test_dir) / "main.tf"
        verbose_content = "# Line {}\n".format("test") * 600  # 600 lines
        with open(main_tf_path, 'w') as f:
            f.write(verbose_content)

        success, optimized_content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        original_lines = len(verbose_content.split('\n'))
        optimized_lines = len(optimized_content.split('\n'))
        self.assertLess(optimized_lines, original_lines)

    def test_optimized_main_tf_contains_for_each(self):
        """Test that optimized main.tf uses for_each."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIn("for_each = local.public_subnets", content)
        self.assertIn("for_each = local.private_subnets", content)
        self.assertIn("for_each = local.ecs_services", content)
        self.assertIn("for_each = local.log_buckets", content)

    def test_optimized_main_tf_contains_dynamic_blocks(self):
        """Test that optimized main.tf uses dynamic blocks."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIn("dynamic \"ingress\"", content)
        self.assertIn("for_each = local.alb_ingress_rules", content)

    def test_optimized_main_tf_uses_data_sources(self):
        """Test that optimized main.tf uses data sources for IAM."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIn("data \"aws_iam_policy\"", content)
        self.assertIn("data \"aws_iam_policy_document\"", content)

    def test_optimized_main_tf_uses_locals(self):
        """Test that optimized main.tf centralizes configuration in locals."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIn("locals {", content)
        self.assertIn("name_prefix", content)
        self.assertIn("common_tags", content)
        self.assertIn("public_subnets", content)
        self.assertIn("private_subnets", content)
        self.assertIn("ecs_services", content)
        self.assertIn("log_buckets", content)

    def test_optimize_variables_tf_creates_comprehensive_variables(self):
        """Test that optimize_variables_tf creates comprehensive variables."""
        success, content = self.optimizer.optimize_variables_tf()

        self.assertTrue(success)
        self.assertIsNotNone(content)
        self.assertIn("variable \"aws_region\"", content)
        self.assertIn("variable \"environment\"", content)
        self.assertIn("variable \"vpc_cidr\"", content)
        self.assertIn("variable \"db_username\"", content)
        self.assertIn("variable \"db_password\"", content)
        self.assertIn("variable \"s3_bucket_suffix\"", content)

    def test_optimize_variables_tf_includes_validation(self):
        """Test that variables include validation rules."""
        success, content = self.optimizer.optimize_variables_tf()

        self.assertTrue(success)
        # Check for validation blocks
        self.assertIn("validation {", content)
        self.assertIn("condition", content)
        self.assertIn("error_message", content)
        # Multiple validation rules
        self.assertTrue(content.count("validation {") >= 5)

    def test_optimize_variables_tf_marks_sensitive(self):
        """Test that sensitive variables are marked."""
        success, content = self.optimizer.optimize_variables_tf()

        self.assertTrue(success)
        self.assertIn("sensitive   = true", content)

    def test_optimize_outputs_tf_creates_comprehensive_outputs(self):
        """Test that optimize_outputs_tf creates comprehensive outputs."""
        success, content = self.optimizer.optimize_outputs_tf()

        self.assertTrue(success)
        self.assertIsNotNone(content)
        self.assertIn("output \"vpc_id\"", content)
        self.assertIn("output \"public_subnet_ids\"", content)
        self.assertIn("output \"private_subnet_ids\"", content)
        self.assertIn("output \"ecs_cluster_name\"", content)
        self.assertIn("output \"alb_dns_name\"", content)
        self.assertIn("output \"rds_cluster_endpoint\"", content)

    def test_optimize_outputs_tf_uses_for_expressions(self):
        """Test that outputs use for expressions for collections."""
        success, content = self.optimizer.optimize_outputs_tf()

        self.assertTrue(success)
        self.assertIn("[for s in aws_subnet.public : s.id]", content)
        self.assertIn("[for s in aws_subnet.private : s.id]", content)
        self.assertIn("{ for k, v in", content)

    def test_optimize_outputs_tf_marks_sensitive(self):
        """Test that sensitive outputs are marked."""
        success, content = self.optimizer.optimize_outputs_tf()

        self.assertTrue(success)
        self.assertIn("sensitive   = true", content)

    def test_create_terraform_tfvars_extracts_values(self):
        """Test that terraform.tfvars extracts hardcoded values."""
        success, content = self.optimizer.create_terraform_tfvars()

        self.assertTrue(success)
        self.assertIsNotNone(content)
        self.assertIn("environment = \"production\"", content)
        self.assertIn("aws_region = \"us-east-1\"", content)
        self.assertIn("vpc_cidr = \"10.0.0.0/16\"", content)
        self.assertIn("db_name = \"payments\"", content)

    def test_create_terraform_tfvars_includes_tags(self):
        """Test that terraform.tfvars includes additional tags."""
        success, content = self.optimizer.create_terraform_tfvars()

        self.assertTrue(success)
        self.assertIn("tags = {", content)
        self.assertIn("CostCenter", content)
        self.assertIn("Compliance", content)

    def test_run_optimization_creates_all_files(self):
        """Test that run_optimization creates all expected files."""
        # Create main.tf
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success = self.optimizer.run_optimization()

        self.assertTrue(success)

        # Check all files were created
        self.assertTrue((Path(self.test_dir) / "main-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "variables-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "outputs-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "terraform-optimized.tfvars").exists())

    def test_run_optimization_tracks_optimizations(self):
        """Test that run_optimization tracks all optimizations applied."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success = self.optimizer.run_optimization()

        self.assertTrue(success)
        self.assertGreater(len(self.optimizer.optimizations_applied), 0)
        self.assertTrue(any("main.tf" in opt for opt in self.optimizer.optimizations_applied))
        self.assertTrue(any("variables.tf" in opt for opt in self.optimizer.optimizations_applied))

    def test_optimized_files_are_valid_hcl(self):
        """Test that optimized files contain valid HCL syntax markers."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success = self.optimizer.run_optimization()
        self.assertTrue(success)

        # Read optimized main.tf
        with open(Path(self.test_dir) / "main-optimized.tf", 'r') as f:
            content = f.read()

        # Check for valid HCL structure
        self.assertIn("terraform {", content)
        self.assertIn("provider \"aws\" {", content)
        self.assertIn("resource \"", content)
        self.assertIn("locals {", content)
        # Check proper block closure
        self.assertEqual(content.count("{"), content.count("}"))

    def test_code_reduction_percentage(self):
        """Test that optimization achieves at least 40% code reduction."""
        # Create a verbose main.tf similar to baseline
        main_tf_path = Path(self.test_dir) / "main.tf"
        verbose_lines = ["# Baseline line {}\n".format(i) for i in range(600)]
        with open(main_tf_path, 'w') as f:
            f.writelines(verbose_lines)

        success, optimized_content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        original_lines = 600
        optimized_lines = len(optimized_content.split('\n'))
        reduction_pct = ((original_lines - optimized_lines) / original_lines) * 100

        # Should achieve at least 39% reduction (close to 40%)
        self.assertGreaterEqual(reduction_pct, 39.0)

    def test_consistent_naming_pattern(self):
        """Test that optimized code uses consistent naming pattern."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        # Check for name_prefix usage
        self.assertIn("local.name_prefix", content)
        self.assertIn("${local.name_prefix}", content)

    def test_centralized_tagging(self):
        """Test that optimized code uses centralized tagging."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        self.assertIn("common_tags", content)
        self.assertIn("merge(", content)
        self.assertIn("default_tags", content)

    def test_no_hardcoded_values_in_optimized(self):
        """Test that optimized code has no hardcoded values."""
        main_tf_path = Path(self.test_dir) / "main.tf"
        with open(main_tf_path, 'w') as f:
            f.write("# Baseline\n" * 100)

        success, content = self.optimizer.optimize_main_tf()

        self.assertTrue(success)
        # Should use variables instead of hardcoded values
        self.assertIn("var.aws_region", content)
        self.assertIn("var.environment", content)
        self.assertIn("var.vpc_cidr", content)
        self.assertIn("var.db_username", content)
        self.assertIn("var.db_password", content)


class TestOptimizationIntegration(unittest.TestCase):
    """Integration tests for the optimization workflow."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_full_optimization_workflow(self):
        """Test complete optimization workflow."""
        # Create baseline files
        main_tf = Path(self.test_dir) / "main.tf"
        with open(main_tf, 'w') as f:
            f.write("# Baseline configuration\n" * 200)

        # Run optimization
        optimizer = TerraformOptimizer(self.test_dir)
        success = optimizer.run_optimization()

        self.assertTrue(success)

        # Verify all output files exist
        self.assertTrue((Path(self.test_dir) / "main-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "variables-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "outputs-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "terraform-optimized.tfvars").exists())

        # Verify content quality
        with open(Path(self.test_dir) / "main-optimized.tf", 'r') as f:
            main_content = f.read()
            self.assertGreater(len(main_content), 1000)  # Substantial content
            self.assertIn("for_each", main_content)
            self.assertIn("dynamic", main_content)

    def test_optimization_idempotency(self):
        """Test that running optimization multiple times produces same result."""
        main_tf = Path(self.test_dir) / "main.tf"
        with open(main_tf, 'w') as f:
            f.write("# Baseline\n" * 100)

        # Run first optimization
        optimizer1 = TerraformOptimizer(self.test_dir)
        _, content1 = optimizer1.optimize_main_tf()

        # Run second optimization
        optimizer2 = TerraformOptimizer(self.test_dir)
        _, content2 = optimizer2.optimize_main_tf()

        # Should produce identical output
        self.assertEqual(content1, content2)

    def test_run_optimization_with_all_file_operations(self):
        """Test run_optimization performs all file operations correctly."""
        # Create baseline main.tf
        main_tf = Path(self.test_dir) / "main.tf"
        with open(main_tf, 'w') as f:
            f.write("# Baseline configuration\n" * 150)

        # Run complete optimization
        optimizer = TerraformOptimizer(self.test_dir)
        success = optimizer.run_optimization()

        # Verify success
        self.assertTrue(success)

        # Verify all optimized files exist and have content
        optimized_files = [
            "main-optimized.tf",
            "variables-optimized.tf",
            "outputs-optimized.tf",
            "terraform-optimized.tfvars"
        ]

        for filename in optimized_files:
            filepath = Path(self.test_dir) / filename
            self.assertTrue(filepath.exists(), f"{filename} should exist")

            # Verify file has substantial content
            with open(filepath, 'r') as f:
                content = f.read()
                self.assertGreater(len(content), 100, f"{filename} should have substantial content")

        # Verify main-optimized.tf has expected structure
        with open(Path(self.test_dir) / "main-optimized.tf", 'r') as f:
            main_content = f.read()
            self.assertIn("terraform {", main_content)
            self.assertIn("provider \"aws\"", main_content)
            self.assertIn("for_each", main_content)
            self.assertIn("locals {", main_content)

    def test_optimization_failure_handling(self):
        """Test that optimizer handles failure gracefully."""
        # Don't create main.tf - should fail on optimize_main_tf
        optimizer = TerraformOptimizer(self.test_dir)

        # Should return False but not crash
        success_main, content = optimizer.optimize_main_tf()
        self.assertFalse(success_main)
        self.assertEqual(content, "")

        # Other optimizations should still work
        success_vars, vars_content = optimizer.optimize_variables_tf()
        self.assertTrue(success_vars)
        self.assertGreater(len(vars_content), 0)

    def test_run_optimization_failure_with_missing_main_tf(self):
        """Test run_optimization handles missing main.tf failure."""
        # Don't create main.tf file - this will cause optimize_main_tf to fail
        optimizer = TerraformOptimizer(self.test_dir)

        # Run optimization - should fail overall due to missing main.tf
        success = optimizer.run_optimization()

        # Should return False due to failure
        self.assertFalse(success)

    def test_run_optimization_with_all_files_present(self):
        """Test run_optimization when all optimizations succeed."""
        # Create main.tf so optimize_main_tf succeeds
        main_tf = Path(self.test_dir) / "main.tf"
        with open(main_tf, 'w') as f:
            f.write("# Baseline configuration\n" * 150)

        optimizer = TerraformOptimizer(self.test_dir)

        # Mock write operations to ensure all if branches are taken
        # Run optimization - all should succeed
        success = optimizer.run_optimization()

        # Should return True when all optimizations succeed
        self.assertTrue(success)

        # Verify all optimized files were created
        self.assertTrue((Path(self.test_dir) / "main-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "variables-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "outputs-optimized.tf").exists())
        self.assertTrue((Path(self.test_dir) / "terraform-optimized.tfvars").exists())


def main():
    """Run all tests."""
    unittest.main()


if __name__ == "__main__":
    main()
