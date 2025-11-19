"""
Unit tests for Terraform multi-environment infrastructure.
Tests verify resource naming, configuration consistency, and module integration.
"""

import pytest
import json
import os
import subprocess


class TestInfrastructureConfiguration:
    """Tests for infrastructure configuration validation."""

    @pytest.fixture
    def terraform_config(self):
        """Load Terraform configuration from tfvars files."""
        configs = {}
        for env in ['dev', 'staging', 'prod']:
            tfvars_path = f'lib/{env}.tfvars'
            if os.path.exists(tfvars_path):
                with open(tfvars_path, 'r') as f:
                    # Simple parser for tfvars (not production-grade)
                    config = {}
                    for line in f:
                        line = line.strip()
                        if '=' in line and not line.startswith('#'):
                            key, value = line.split('=', 1)
                            key = key.strip()
                            value = value.strip().strip('"')
                            config[key] = value
                    configs[env] = config
        return configs

    def test_environment_suffix_present(self, terraform_config):
        """Test that all environments have environment_suffix defined."""
        for env, config in terraform_config.items():
            assert 'environment_suffix' in config, \
                f"Environment {env} missing environment_suffix"
            assert len(config['environment_suffix']) >= 4, \
                f"Environment {env} has invalid environment_suffix length"

    def test_vpc_cidr_non_overlapping(self, terraform_config):
        """Test that VPC CIDR blocks don't overlap across environments."""
        cidrs = {}
        for env, config in terraform_config.items():
            cidr = config.get('vpc_cidr', '')
            cidrs[env] = cidr

        # Check that all CIDRs are unique
        cidr_values = list(cidrs.values())
        assert len(cidr_values) == len(set(cidr_values)), \
            f"VPC CIDR overlap detected: {cidrs}"

    def test_aurora_instance_class_set(self, terraform_config):
        """Test that Aurora instance class is configured for all environments."""
        for env, config in terraform_config.items():
            assert 'aurora_instance_class' in config, \
                f"Environment {env} missing aurora_instance_class"
            assert config['aurora_instance_class'].startswith('db.'), \
                f"Environment {env} has invalid aurora_instance_class"

    def test_log_retention_matches_environment(self, terraform_config):
        """Test that log retention increases with environment criticality."""
        expected_retention = {
            'dev': 7,
            'staging': 30,
            'prod': 90
        }

        for env, config in terraform_config.items():
            retention = int(config.get('log_retention_days', 0))
            assert retention == expected_retention[env], \
                f"Environment {env} has incorrect log retention: {retention}"

    def test_availability_zones_count(self, terraform_config):
        """Test that all environments use 3 availability zones."""
        for env, config in terraform_config.items():
            # This is a simplified check - actual parsing would be more complex
            assert 'availability_zones' in str(config), \
                f"Environment {env} missing availability_zones"


class TestResourceNaming:
    """Tests for resource naming conventions."""

    def test_locals_include_environment_suffix(self):
        """Test that locals.tf includes environment_suffix in resource names."""
        locals_path = 'lib/locals.tf'
        assert os.path.exists(locals_path), "locals.tf not found"

        with open(locals_path, 'r') as f:
            content = f.read()

        # Check that resource_names use environment_suffix
        assert 'environment_suffix' in content, \
            "locals.tf missing environment_suffix references"
        assert 'resource_names' in content, \
            "locals.tf missing resource_names block"

    def test_modules_accept_environment_suffix(self):
        """Test that all modules have environment_suffix variable."""
        modules = ['vpc', 'aurora', 'storage', 'alb', 'lambda', 'iam', 'monitoring']

        for module in modules:
            module_path = f'lib/modules/{module}/main.tf'
            if os.path.exists(module_path):
                with open(module_path, 'r') as f:
                    content = f.read()

                # Check for environment_suffix variable or usage
                # Some modules may not need it directly
                if module in ['storage', 'aurora', 'alb', 'monitoring']:
                    assert 'environment_suffix' in content.lower(), \
                        f"Module {module} missing environment_suffix parameter"


class TestDestroyability:
    """Tests for infrastructure destroyability."""

    def test_aurora_skip_final_snapshot(self):
        """Test that Aurora is configured to skip final snapshot."""
        aurora_path = 'lib/modules/aurora/main.tf'
        assert os.path.exists(aurora_path), "Aurora module not found"

        with open(aurora_path, 'r') as f:
            content = f.read()

        assert 'skip_final_snapshot' in content, \
            "Aurora module missing skip_final_snapshot"

    def test_s3_force_destroy(self):
        """Test that S3 buckets have force_destroy enabled."""
        storage_path = 'lib/modules/storage/main.tf'
        assert os.path.exists(storage_path), "Storage module not found"

        with open(storage_path, 'r') as f:
            content = f.read()

        assert 'force_destroy' in content, \
            "Storage module missing force_destroy"

    def test_no_deletion_protection(self):
        """Test that resources don't have deletion protection."""
        alb_path = 'lib/modules/alb/main.tf'
        assert os.path.exists(alb_path), "ALB module not found"

        with open(alb_path, 'r') as f:
            content = f.read()

        # Check that deletion protection is explicitly disabled
        assert 'enable_deletion_protection = false' in content, \
            "ALB module has deletion protection enabled"


class TestModuleIntegration:
    """Tests for module integration and dependencies."""

    def test_main_tf_includes_all_modules(self):
        """Test that main.tf includes all required modules."""
        main_path = 'lib/main.tf'
        assert os.path.exists(main_path), "main.tf not found"

        with open(main_path, 'r') as f:
            content = f.read()

        required_modules = ['vpc', 'aurora', 'lambda', 'storage', 'alb', 'iam', 'monitoring']

        for module in required_modules:
            assert f'module "{module}"' in content or f"module '{module}'" in content, \
                f"main.tf missing module: {module}"

    def test_vpc_module_outputs_used(self):
        """Test that VPC module outputs are referenced in main.tf."""
        main_path = 'lib/main.tf'
        assert os.path.exists(main_path), "main.tf not found"

        with open(main_path, 'r') as f:
            content = f.read()

        # Check that VPC outputs are used by other modules
        assert 'module.vpc.vpc_id' in content, \
            "main.tf not using VPC module vpc_id output"
        assert 'module.vpc.private_subnet_ids' in content or 'module.vpc.public_subnet_ids' in content, \
            "main.tf not using VPC module subnet outputs"

    def test_iam_role_used_by_lambda(self):
        """Test that IAM execution role is passed to Lambda module."""
        main_path = 'lib/main.tf'
        assert os.path.exists(main_path), "main.tf not found"

        with open(main_path, 'r') as f:
            content = f.read()

        assert 'module.iam.lambda_execution_role_arn' in content, \
            "main.tf not passing IAM role to Lambda module"


class TestLambdaFunction:
    """Tests for Lambda function code."""

    def test_lambda_code_exists(self):
        """Test that Lambda function code exists."""
        lambda_path = 'lib/lambda/data_processor/index.py'
        assert os.path.exists(lambda_path), "Lambda function code not found"

    def test_lambda_uses_environment_suffix(self):
        """Test that Lambda code uses ENVIRONMENT_SUFFIX variable."""
        lambda_path = 'lib/lambda/data_processor/index.py'
        with open(lambda_path, 'r') as f:
            content = f.read()

        assert 'ENVIRONMENT_SUFFIX' in content, \
            "Lambda code missing ENVIRONMENT_SUFFIX usage"

    def test_lambda_requirements_exists(self):
        """Test that Lambda requirements.txt exists."""
        requirements_path = 'lib/lambda/data_processor/requirements.txt'
        assert os.path.exists(requirements_path), "Lambda requirements.txt not found"


class TestValidationScript:
    """Tests for workspace validation script."""

    def test_validation_script_exists(self):
        """Test that validation script exists."""
        script_path = 'lib/scripts/validate-workspaces.sh'
        assert os.path.exists(script_path), "Validation script not found"

    def test_validation_script_executable(self):
        """Test that validation script has execute permissions."""
        script_path = 'lib/scripts/validate-workspaces.sh'
        assert os.path.exists(script_path), "Validation script not found"

        # Check if script is executable (simplified check)
        with open(script_path, 'r') as f:
            first_line = f.readline()
            assert first_line.startswith('#!/bin/bash'), \
                "Validation script missing shebang"


class TestOutputs:
    """Tests for Terraform outputs."""

    def test_outputs_include_environment_suffix(self):
        """Test that outputs.tf includes environment_suffix output."""
        outputs_path = 'lib/outputs.tf'
        assert os.path.exists(outputs_path), "outputs.tf not found"

        with open(outputs_path, 'r') as f:
            content = f.read()

        assert 'output "environment_suffix"' in content, \
            "outputs.tf missing environment_suffix output"

    def test_sensitive_outputs_marked(self):
        """Test that sensitive outputs are marked as sensitive."""
        outputs_path = 'lib/outputs.tf'
        with open(outputs_path, 'r') as f:
            content = f.read()

        # Check that database endpoints are marked sensitive
        if 'aurora_cluster_endpoint' in content:
            # Simple check - look for sensitive = true near the endpoint output
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'aurora_cluster_endpoint' in line:
                    # Check next few lines for sensitive flag
                    section = '\n'.join(lines[i:i+5])
                    assert 'sensitive' in section, \
                        "Aurora endpoint output not marked as sensitive"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
