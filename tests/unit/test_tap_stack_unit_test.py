"""
Unit tests for Terraform Multi-Region DR Infrastructure
Tests validate Terraform configuration structure, syntax, and best practices
"""

import os
import re
import json
import glob
import subprocess
from pathlib import Path
import pytest


class TestTerraformConfiguration:
    """Test Terraform configuration structure and syntax"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"
        cls.modules_path = cls.lib_path / "modules"

    def read_tf_file(self, filepath):
        """Helper to read Terraform file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def test_backend_configuration_exists(self):
        """Test that backend.tf exists and has S3 backend"""
        backend_file = self.lib_path / "backend.tf"
        assert backend_file.exists(), "backend.tf must exist"

        content = self.read_tf_file(backend_file)
        assert 'backend "s3"' in content, "S3 backend must be configured"
        assert 'encrypt = true' in content, "Backend encryption must be enabled"

    def test_providers_configuration(self):
        """Test provider configuration"""
        providers_file = self.lib_path / "providers.tf"
        assert providers_file.exists(), "providers.tf must exist"

        content = self.read_tf_file(providers_file)
        assert 'required_version = ">= 1.5.0"' in content, "Terraform version must be >= 1.5.0"
        assert 'hashicorp/aws' in content, "AWS provider must be configured"
        assert '~> 5.0' in content, "AWS provider version must be ~> 5.0"
        assert 'alias  = "primary"' in content, "Primary region provider must exist"
        assert 'alias  = "dr"' in content, "DR region provider must exist"
        assert 'alias  = "global"' in content, "Global provider must exist"

    def test_variables_configuration(self):
        """Test variables are properly defined"""
        variables_file = self.lib_path / "variables.tf"
        assert variables_file.exists(), "variables.tf must exist"

        content = self.read_tf_file(variables_file)

        required_variables = [
            'environment_suffix',
            'primary_region',
            'dr_region',
            'db_master_username',
            'db_master_password',
            'availability_zones_primary',
            'availability_zones_dr'
        ]

        for var in required_variables:
            assert f'variable "{var}"' in content, f"Variable {var} must be defined"

    def test_sensitive_variables(self):
        """Test that sensitive variables are marked as sensitive"""
        variables_file = self.lib_path / "variables.tf"
        content = self.read_tf_file(variables_file)

        # Check db_master_password is sensitive
        password_block = re.search(
            r'variable\s+"db_master_password"\s*\{[^}]+\}',
            content,
            re.DOTALL
        )
        assert password_block, "db_master_password variable must exist"
        assert 'sensitive' in password_block.group(0), "db_master_password must be sensitive"

    def test_outputs_configuration(self):
        """Test outputs are properly defined"""
        outputs_file = self.lib_path / "outputs.tf"
        assert outputs_file.exists(), "outputs.tf must exist"

        content = self.read_tf_file(outputs_file)

        expected_outputs = [
            'primary_vpc_id',
            'dr_vpc_id',
            'primary_rds_cluster_endpoint',
            'dr_rds_cluster_endpoint',
            'primary_alb_dns',
            'dr_alb_dns'
        ]

        for output in expected_outputs:
            assert f'output "{output}"' in content, f"Output {output} must be defined"

    def test_main_tf_structure(self):
        """Test main.tf has correct module structure"""
        main_file = self.lib_path / "main.tf"
        assert main_file.exists(), "main.tf must exist"

        content = self.read_tf_file(main_file)

        # Check for module declarations
        required_modules = [
            'vpc_primary',
            'vpc_dr',
            'vpc_peering',
            'rds_primary',
            'rds_dr',
            'dynamodb',
            's3_primary',
            's3_dr',
            'lambda_primary',
            'lambda_dr',
            'alb_primary',
            'alb_dr',
            'route53',
            'cloudwatch_primary',
            'cloudwatch_dr',
            'sns_primary',
            'sns_dr',
            'iam'
        ]

        for module in required_modules:
            assert f'module "{module}"' in content, f"Module {module} must be declared"

    def test_environment_suffix_usage(self):
        """Test that environment_suffix is used in all modules"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        # Find all module blocks - need to match nested braces properly
        # Simple approach: split by "module " and check each block
        module_blocks = content.split('module "')[1:]  # Skip first empty element

        for block in module_blocks:
            # Get module name (first line before {)
            module_name = block.split('"')[0]
            # Get module content (everything up to the next module or end)
            # Check if environment_suffix is used
            assert 'environment_suffix' in block, \
                f"Module must use environment_suffix: {module_name}"

    def test_provider_aliases_in_modules(self):
        """Test that multi-region modules use correct provider aliases"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        # Check primary region modules
        primary_modules = ['vpc_primary', 'rds_primary', 's3_primary', 'lambda_primary', 'alb_primary']
        for module in primary_modules:
            pattern = rf'module\s+"{module}"\s*\{{[^}}]+providers\s*=\s*\{{[^}}]+aws\s*=\s*aws\.primary'
            assert re.search(pattern, content, re.DOTALL), \
                f"{module} must use aws.primary provider"

        # Check DR region modules
        dr_modules = ['vpc_dr', 'rds_dr', 's3_dr', 'lambda_dr', 'alb_dr']
        for module in dr_modules:
            pattern = rf'module\s+"{module}"\s*\{{[^}}]+providers\s*=\s*\{{[^}}]+aws\s*=\s*aws\.dr'
            assert re.search(pattern, content, re.DOTALL), \
                f"{module} must use aws.dr provider"

    def test_rds_dr_depends_on_primary(self):
        """Test that RDS DR module depends on primary"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        # Find rds_dr module block - look for the depends_on anywhere after module "rds_dr"
        assert 'module "rds_dr"' in content, "RDS DR module must exist"

        # Extract the rds_dr module block
        rds_dr_start = content.find('module "rds_dr"')
        # Find the closing brace - count braces to find the matching one
        brace_count = 0
        in_module = False
        rds_dr_end = rds_dr_start
        for i in range(rds_dr_start, len(content)):
            if content[i] == '{':
                brace_count += 1
                in_module = True
            elif content[i] == '}':
                brace_count -= 1
                if in_module and brace_count == 0:
                    rds_dr_end = i + 1
                    break

        rds_dr_block = content[rds_dr_start:rds_dr_end]
        assert 'depends_on' in rds_dr_block and 'module.rds_primary' in rds_dr_block, \
            "RDS DR module must depend on RDS primary"


class TestModuleStructure:
    """Test individual module structure and configuration"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"
        cls.modules_path = cls.lib_path / "modules"

    def read_tf_file(self, filepath):
        """Helper to read Terraform file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    @pytest.mark.parametrize("module_name", [
        "vpc", "vpc-peering", "rds", "dynamodb", "s3",
        "lambda", "alb", "route53", "cloudwatch", "sns", "iam"
    ])
    def test_module_exists(self, module_name):
        """Test that required modules exist"""
        module_path = self.modules_path / module_name
        assert module_path.exists(), f"Module {module_name} must exist"

        main_tf = module_path / "main.tf"
        assert main_tf.exists(), f"Module {module_name}/main.tf must exist"

    @pytest.mark.parametrize("module_name", [
        "vpc", "vpc-peering", "rds", "dynamodb", "s3",
        "lambda", "alb", "route53", "cloudwatch", "sns", "iam"
    ])
    def test_module_has_required_providers(self, module_name):
        """Test that modules have required_providers block"""
        main_tf = self.modules_path / module_name / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'terraform {' in content, f"Module {module_name} must have terraform block"
        assert 'required_providers {' in content, f"Module {module_name} must have required_providers"
        assert 'hashicorp/aws' in content, f"Module {module_name} must require AWS provider"

    @pytest.mark.parametrize("module_name", [
        "vpc", "rds", "dynamodb", "s3", "lambda", "alb", "route53", "cloudwatch", "sns", "iam"
    ])
    def test_module_uses_environment_suffix(self, module_name):
        """Test that modules accept and use environment_suffix"""
        main_tf = self.modules_path / module_name / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'variable "environment_suffix"' in content, \
            f"Module {module_name} must accept environment_suffix variable"

    def test_lambda_module_has_archive_provider(self):
        """Test that lambda module includes archive provider"""
        main_tf = self.modules_path / "lambda" / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'hashicorp/archive' in content, "Lambda module must require archive provider"

    def test_rds_module_configuration(self):
        """Test RDS module has correct configuration"""
        main_tf = self.modules_path / "rds" / "main.tf"
        content = self.read_tf_file(main_tf)

        # Required variables
        required_vars = [
            'environment_suffix', 'region', 'vpc_id', 'private_subnet_ids',
            'availability_zones', 'db_master_username', 'db_master_password',
            'is_primary', 'global_cluster_identifier'
        ]
        for var in required_vars:
            assert f'variable "{var}"' in content, f"RDS module must have {var} variable"

        # Security best practices
        assert 'storage_encrypted         = true' in content, "RDS must have encryption enabled"
        assert 'skip_final_snapshot             = true' in content, "RDS must skip final snapshot for test environments"

        # Global cluster configuration
        assert 'aws_rds_global_cluster' in content, "RDS must support global cluster"
        assert 'aws_rds_cluster' in content, "RDS must create cluster"
        assert 'aws_rds_cluster_instance' in content, "RDS must create cluster instances"

    def test_vpc_module_configuration(self):
        """Test VPC module has correct configuration"""
        main_tf = self.modules_path / "vpc" / "main.tf"
        content = self.read_tf_file(main_tf)

        # Required resources
        assert 'aws_vpc' in content, "VPC module must create VPC"
        assert 'aws_subnet' in content, "VPC module must create subnets"
        assert 'aws_internet_gateway' in content, "VPC module must create internet gateway"
        assert 'aws_nat_gateway' in content, "VPC module must create NAT gateway"
        assert 'aws_route_table' in content, "VPC module must create route tables"

        # DNS configuration
        assert 'enable_dns_hostnames = true' in content, "VPC must enable DNS hostnames"
        assert 'enable_dns_support   = true' in content, "VPC must enable DNS support"

    def test_dynamodb_module_configuration(self):
        """Test DynamoDB module has global table configuration"""
        main_tf = self.modules_path / "dynamodb" / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'aws_dynamodb_table' in content, "DynamoDB module must create table"
        assert 'replica' in content, "DynamoDB must support replication"

    def test_s3_module_configuration(self):
        """Test S3 module has encryption and replication"""
        main_tf = self.modules_path / "s3" / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'aws_s3_bucket' in content, "S3 module must create bucket"
        assert 'server_side_encryption_configuration' in content, "S3 must have encryption"
        assert 'versioning' in content, "S3 must have versioning for replication"

    def test_route53_module_configuration(self):
        """Test Route53 module has failover configuration"""
        main_tf = self.modules_path / "route53" / "main.tf"
        content = self.read_tf_file(main_tf)

        assert 'aws_route53_zone' in content, "Route53 module must create hosted zone"
        assert 'aws_route53_record' in content, "Route53 module must create records"
        assert 'aws_route53_health_check' in content, "Route53 module must create health checks"


class TestSecurityBestPractices:
    """Test security best practices in infrastructure"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"

    def read_tf_file(self, filepath):
        """Helper to read Terraform file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def test_no_hardcoded_credentials(self):
        """Test that no credentials are hardcoded"""
        tf_files = glob.glob(str(self.lib_path / "**/*.tf"), recursive=True)

        sensitive_patterns = [
            r'password\s*=\s*"[^$]',  # Hardcoded passwords (not variables)
            r'secret\s*=\s*"[^$]',    # Hardcoded secrets
            r'access_key\s*=\s*"[^$]', # Hardcoded access keys
        ]

        for tf_file in tf_files:
            content = self.read_tf_file(tf_file)
            for pattern in sensitive_patterns:
                matches = re.search(pattern, content, re.IGNORECASE)
                assert not matches, f"Potential hardcoded credential in {tf_file}"

    def test_rds_encryption_enabled(self):
        """Test that RDS has encryption enabled"""
        rds_module = self.lib_path / "modules" / "rds" / "main.tf"
        content = self.read_tf_file(rds_module)

        # Check global cluster encryption
        assert 'storage_encrypted         = true' in content, \
            "RDS global cluster must have encryption enabled"

    def test_s3_encryption_configured(self):
        """Test that S3 has encryption configured"""
        s3_module = self.lib_path / "modules" / "s3" / "main.tf"
        content = self.read_tf_file(s3_module)

        assert 'server_side_encryption_configuration' in content, \
            "S3 must have server-side encryption configured"

    def test_no_deletion_protection(self):
        """Test that DeletionProtection is not enabled (for test environments)"""
        tf_files = glob.glob(str(self.lib_path / "**/*.tf"), recursive=True)

        for tf_file in tf_files:
            content = self.read_tf_file(tf_file)
            # Check for deletion_protection = true
            if 'deletion_protection' in content.lower():
                assert not re.search(r'deletion_protection\s*=\s*true', content, re.IGNORECASE), \
                    f"DeletionProtection must not be enabled in {tf_file}"

    def test_rds_skip_final_snapshot(self):
        """Test that RDS has skip_final_snapshot enabled"""
        rds_module = self.lib_path / "modules" / "rds" / "main.tf"
        content = self.read_tf_file(rds_module)

        assert 'skip_final_snapshot             = true' in content, \
            "RDS must have skip_final_snapshot enabled for clean teardown"


class TestDisasterRecoveryConfiguration:
    """Test disaster recovery specific configurations"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"

    def read_tf_file(self, filepath):
        """Helper to read Terraform file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def test_multi_region_vpc_deployment(self):
        """Test that VPCs are deployed in both regions"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "vpc_primary"' in content, "Primary VPC must be deployed"
        assert 'module "vpc_dr"' in content, "DR VPC must be deployed"

    def test_vpc_peering_configured(self):
        """Test that VPC peering is configured"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "vpc_peering"' in content, "VPC peering must be configured"

    def test_rds_global_database(self):
        """Test that RDS uses global database"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "rds_primary"' in content, "Primary RDS must be deployed"
        assert 'module "rds_dr"' in content, "DR RDS must be deployed"

        # Check RDS module for global cluster
        rds_module = self.lib_path / "modules" / "rds" / "main.tf"
        rds_content = self.read_tf_file(rds_module)
        assert 'aws_rds_global_cluster' in rds_content, "RDS must use global cluster"

    def test_dynamodb_global_table(self):
        """Test that DynamoDB uses global tables"""
        dynamodb_module = self.lib_path / "modules" / "dynamodb" / "main.tf"
        content = self.read_tf_file(dynamodb_module)

        assert 'replica' in content, "DynamoDB must have replica configuration"

    def test_s3_cross_region_replication(self):
        """Test that S3 has cross-region replication"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "s3_primary"' in content, "Primary S3 must be deployed"
        assert 'module "s3_dr"' in content, "DR S3 must be deployed"

    def test_route53_failover_routing(self):
        """Test that Route53 has failover routing"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "route53"' in content, "Route53 must be configured"

        route53_module = self.lib_path / "modules" / "route53" / "main.tf"
        route53_content = self.read_tf_file(route53_module)
        assert 'aws_route53_health_check' in route53_content, "Route53 must have health checks"

    def test_cloudwatch_monitoring_both_regions(self):
        """Test that CloudWatch monitoring is configured for both regions"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "cloudwatch_primary"' in content, "Primary CloudWatch must be configured"
        assert 'module "cloudwatch_dr"' in content, "DR CloudWatch must be configured"

    def test_sns_notifications_both_regions(self):
        """Test that SNS is configured for both regions"""
        main_file = self.lib_path / "main.tf"
        content = self.read_tf_file(main_file)

        assert 'module "sns_primary"' in content, "Primary SNS must be configured"
        assert 'module "sns_dr"' in content, "DR SNS must be configured"


class TestTerraformSyntax:
    """Test Terraform syntax validity"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"

    def test_terraform_fmt_check(self):
        """Test that Terraform code is properly formatted"""
        os.chdir(self.lib_path)
        result = subprocess.run(
            ['terraform', 'fmt', '-check', '-recursive'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Terraform code is not properly formatted:\n{result.stdout}"

    def test_terraform_validate(self):
        """Test that Terraform configuration is valid"""
        os.chdir(self.lib_path)

        # Initialize if not already done
        init_result = subprocess.run(
            ['terraform', 'init', '-backend=false'],
            capture_output=True,
            text=True
        )
        assert init_result.returncode == 0, f"Terraform init failed:\n{init_result.stderr}"

        # Validate
        validate_result = subprocess.run(
            ['terraform', 'validate'],
            capture_output=True,
            text=True
        )
        assert validate_result.returncode == 0, f"Terraform validation failed:\n{validate_result.stderr}"


class TestResourceNaming:
    """Test resource naming conventions"""

    @classmethod
    def setup_class(cls):
        """Setup test environment"""
        cls.lib_path = Path(__file__).parent.parent.parent / "lib"

    def read_tf_file(self, filepath):
        """Helper to read Terraform file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def test_no_hardcoded_environment_names(self):
        """Test that environment names are not hardcoded"""
        tf_files = glob.glob(str(self.lib_path / "**/*.tf"), recursive=True)

        hardcoded_envs = ['-prod-', '-dev-', '-staging-', '-test-']

        for tf_file in tf_files:
            if 'variables.tf' in tf_file:  # Skip variables file where defaults might have examples
                continue
            content = self.read_tf_file(tf_file)

            for env in hardcoded_envs:
                assert env not in content.lower(), \
                    f"Hardcoded environment name found in {tf_file}: {env}"

    def test_environment_suffix_in_resource_names(self):
        """Test that resource names use environment_suffix"""
        module_files = glob.glob(str(self.lib_path / "modules/**/main.tf"), recursive=True)

        for module_file in module_files:
            content = self.read_tf_file(module_file)

            # Find resource name attributes
            name_patterns = [
                r'name\s*=\s*"[^"]*"',
                r'identifier\s*=\s*"[^"]*"',
                r'cluster_identifier\s*=\s*"[^"]*"'
            ]

            for pattern in name_patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    name_value = match.group(0)
                    # If it's a static string (not a variable/function), it should include environment_suffix
                    if '"$' not in name_value and 'var.environment_suffix' not in name_value:
                        # Check if it's just defining the pattern
                        if '${var.environment_suffix}' in name_value or '-${var.environment_suffix}' in name_value:
                            continue
                        # Allow certain patterns that don't need suffix
                        if 'family =' in content[max(0, match.start()-20):match.start()]:
                            continue
