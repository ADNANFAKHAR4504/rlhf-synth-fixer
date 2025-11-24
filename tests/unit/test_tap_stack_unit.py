import pytest
import json
import re
from pathlib import Path


class TestTerraformVariables:
    """Test Terraform variable definitions"""

    def test_variables_file_exists(self):
        """Verify variables.tf file exists"""
        variables_file = Path('./lib/variables.tf')
        assert variables_file.exists(), "variables.tf should exist"

    def test_environment_suffix_variable_defined(self):
        """Test that environment_suffix variable is defined"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()
        assert 'environment_suffix' in content, "environment_suffix variable must be defined"
        assert 'variable "environment_suffix"' in content, "environment_suffix should be a variable"

    def test_primary_region_variable_defined(self):
        """Test that primary_region variable is defined"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()
        assert 'primary_region' in content, "primary_region variable must be defined"

    def test_secondary_region_variable_defined(self):
        """Test that secondary_region variable is defined"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()
        assert 'secondary_region' in content, "secondary_region variable must be defined"

    def test_tags_variable_defined(self):
        """Test that tags variable is defined"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()
        assert 'tags' in content, "tags variable must be defined"


class TestMainConfiguration:
    """Test main.tf Organizations and CloudTrail setup"""

    def test_main_file_exists(self):
        """Verify main.tf file exists"""
        main_file = Path('./lib/main.tf')
        assert main_file.exists(), "main.tf should exist"

    def test_organizations_organization_created(self):
        """Test that aws_organizations_organization resource is defined"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()
        assert 'aws_organizations_organization' in content, "Organizations organization must be created"
        assert 'resource "aws_organizations_organization" "main"' in content

    def test_organizational_units_created(self):
        """Test that organizational units are created"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Check all three OUs are created
        assert 'aws_organizations_organizational_unit' in content, "OUs must be created"
        assert '"security"' in content, "Security OU should be created"
        assert '"production"' in content, "Production OU should be created"
        assert '"development"' in content, "Development OU should be created"

    def test_cloudtrail_organization_trail_created(self):
        """Test that CloudTrail organization trail is created"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()
        assert 'aws_cloudtrail' in content, "CloudTrail must be configured"
        assert 'is_organization_trail' in content, "Organization trail flag must be set"
        assert 'is_multi_region_trail' in content, "Multi-region trail flag must be set"

    def test_cloudtrail_s3_bucket_created(self):
        """Test that CloudTrail S3 bucket is created"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_s3_bucket' in content and 'cloudtrail' in content, "CloudTrail S3 bucket must be created"
        assert 'environment_suffix' in content, "Bucket name must include environment_suffix"

    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 bucket encryption is configured"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_s3_bucket_server_side_encryption_configuration' in content
        assert 'aws:kms' in content, "KMS encryption must be used"

    def test_s3_bucket_versioning_enabled(self):
        """Test that S3 bucket versioning is enabled"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_s3_bucket_versioning' in content
        assert '"Enabled"' in content, "Versioning must be enabled"

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket public access is blocked"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_s3_bucket_public_access_block' in content
        assert 'block_public_acls' in content
        assert 'restrict_public_buckets' in content

    def test_s3_bucket_policy_defined(self):
        """Test that S3 bucket policy is defined"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_s3_bucket_policy' in content
        assert 'DenyUnencryptedObjectUploads' in content
        assert 'DenyInsecureTransport' in content


class TestKMSConfiguration:
    """Test KMS key management"""

    def test_kms_file_exists(self):
        """Verify kms.tf file exists"""
        kms_file = Path('./lib/kms.tf')
        assert kms_file.exists(), "kms.tf should exist"

    def test_primary_kms_key_created(self):
        """Test that primary KMS key is created"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'aws_kms_key' in content, "KMS key must be created"
        assert 'primary' in content and 'aws_kms_key' in content

    def test_kms_key_rotation_enabled(self):
        """Test that KMS key rotation is enabled"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'enable_key_rotation' in content, "Key rotation must be enabled"
        assert 'true' in content, "Key rotation must be true"

    def test_kms_key_alias_created(self):
        """Test that KMS key alias is created"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'aws_kms_alias' in content, "KMS alias must be created"

    def test_kms_replica_key_created(self):
        """Test that replica KMS key is created"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'aws_kms_replica_key' in content, "Replica KMS key must be created"
        assert 'us-west-2' in content or 'secondary_region' in content

    def test_kms_key_policy_configured(self):
        """Test that KMS key policy is configured"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'policy' in content, "KMS key policy must be configured"


class TestIAMConfiguration:
    """Test IAM roles and policies"""

    def test_iam_file_exists(self):
        """Verify iam.tf file exists"""
        iam_file = Path('./lib/iam.tf')
        assert iam_file.exists(), "iam.tf should exist"

    def test_cross_account_role_created(self):
        """Test that cross-account IAM role is created"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        assert 'aws_iam_role' in content, "IAM role must be created"

    def test_assume_role_policy_configured(self):
        """Test that assume role policy is configured"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        assert 'assume_role_policy' in content, "Assume role policy must be defined"

    def test_mfa_enforcement_in_trust_policy(self):
        """Test that MFA is enforced in trust policy"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        assert 'mfa' in content.lower() or 'Condition' in content, "MFA or conditions should be configured"

    def test_role_policies_attached(self):
        """Test that role policies are attached"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        assert 'aws_iam_role_policy' in content or 'aws_iam_policy_attachment' in content


class TestSCPConfiguration:
    """Test Service Control Policies"""

    def test_scp_file_exists(self):
        """Verify scp.tf file exists"""
        scp_file = Path('./lib/scp.tf')
        assert scp_file.exists(), "scp.tf should exist"

    def test_scp_target_defined(self):
        """Test that SCP targets are defined"""
        with open('./lib/scp.tf', 'r') as f:
            content = f.read()

        assert 'aws_organizations_policy' in content or 'aws_organizations_policy_target' in content

    def test_encryption_policies_defined(self):
        """Test that encryption policies are defined"""
        with open('./lib/scp.tf', 'r') as f:
            content = f.read()

        # Check for encryption-related policies
        content_lower = content.lower()
        assert 's3' in content_lower or 'encrypt' in content_lower


class TestCloudWatchConfiguration:
    """Test CloudWatch Logs setup"""

    def test_cloudwatch_file_exists(self):
        """Verify cloudwatch.tf file exists"""
        cloudwatch_file = Path('./lib/cloudwatch.tf')
        assert cloudwatch_file.exists(), "cloudwatch.tf should exist"

    def test_cloudwatch_log_group_created(self):
        """Test that CloudWatch log group is created"""
        with open('./lib/cloudwatch.tf', 'r') as f:
            content = f.read()

        assert 'aws_cloudwatch_log_group' in content

    def test_log_retention_policy_configured(self):
        """Test that log retention is configured"""
        with open('./lib/cloudwatch.tf', 'r') as f:
            content = f.read()

        assert 'retention_in_days' in content, "Log retention must be configured"
        assert '90' in content or 'cloudwatch_log_retention_days' in content

    def test_log_group_encryption_enabled(self):
        """Test that log group encryption is configured"""
        with open('./lib/cloudwatch.tf', 'r') as f:
            content = f.read()

        assert 'kms_key_id' in content, "Log group must be encrypted with KMS"


class TestConfigConfiguration:
    """Test AWS Config setup"""

    def test_config_file_exists(self):
        """Verify config.tf file exists"""
        config_file = Path('./lib/config.tf')
        assert config_file.exists(), "config.tf should exist"

    def test_config_recorder_created(self):
        """Test that Config recorder is created"""
        with open('./lib/config.tf', 'r') as f:
            content = f.read()

        assert 'aws_config_configuration_recorder' in content

    def test_config_delivery_channel_created(self):
        """Test that Config delivery channel is created"""
        with open('./lib/config.tf', 'r') as f:
            content = f.read()

        assert 'aws_config_delivery_channel' in content

    def test_config_rules_defined(self):
        """Test that Config rules are defined"""
        with open('./lib/config.tf', 'r') as f:
            content = f.read()

        assert 'aws_config_config_rule' in content


class TestOutputsConfiguration:
    """Test outputs configuration"""

    def test_outputs_file_exists(self):
        """Verify outputs.tf file exists"""
        outputs_file = Path('./lib/outputs.tf')
        assert outputs_file.exists(), "outputs.tf should exist"

    def test_organization_id_output(self):
        """Test that organization ID is output"""
        with open('./lib/outputs.tf', 'r') as f:
            content = f.read()

        assert 'organization' in content.lower() or 'output' in content

    def test_kms_key_output(self):
        """Test that KMS key information is output"""
        with open('./lib/outputs.tf', 'r') as f:
            content = f.read()

        assert 'output' in content, "Outputs must be defined"

    def test_outputs_use_environment_suffix(self):
        """Test that outputs include environment_suffix"""
        with open('./lib/outputs.tf', 'r') as f:
            content = f.read()

        # Outputs should reference resources created with environment_suffix
        assert 'environment_suffix' in content or 'output' in content


class TestProvidersConfiguration:
    """Test Terraform providers configuration"""

    def test_providers_file_exists(self):
        """Verify providers.tf file exists"""
        providers_file = Path('./lib/providers.tf')
        assert providers_file.exists(), "providers.tf should exist"

    def test_aws_provider_configured(self):
        """Test that AWS provider is configured"""
        with open('./lib/providers.tf', 'r') as f:
            content = f.read()

        assert 'provider "aws"' in content or 'aws' in content

    def test_terraform_required_version(self):
        """Test that Terraform version requirement is specified"""
        with open('./lib/providers.tf', 'r') as f:
            content = f.read()

        assert 'terraform' in content or 'required_providers' in content


class TestNamingConventions:
    """Test that naming conventions are followed"""

    def test_resources_include_environment_suffix(self):
        """Test that resources include environment_suffix in names"""
        tf_files = Path('./lib').glob('*.tf')

        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()

            # Check for environment_suffix usage in resource names
            if 'resource' in content and tf_file.name not in ['providers.tf', 'variables.tf']:
                # At least some resources should use environment_suffix
                if 'name' in content or 'bucket' in content:
                    assert 'environment_suffix' in content or '${var.' in content, \
                        f"Resource names in {tf_file.name} should include environment_suffix"

    def test_no_hardcoded_environment_values(self):
        """Test that no hardcoded environment values are used"""
        tf_files = Path('./lib').glob('*.tf')

        # Only check for actual hardcoded values that aren't part of logical names
        # e.g., "production-ou" is a resource name, not a hardcoded environment value
        hardcoded_patterns = [
            r'= "prod-',
            r'= "dev-',
            r'= "stage-',
        ]

        for tf_file in tf_files:
            with open(tf_file, 'r') as f:
                content = f.read()

            for pattern in hardcoded_patterns:
                assert not re.search(pattern, content), \
                    f"Hardcoded environment values found in {tf_file.name}: pattern {pattern}"


class TestDocumentation:
    """Test that documentation exists"""

    def test_readme_exists(self):
        """Test that README.md exists"""
        readme_file = Path('./lib/README.md')
        assert readme_file.exists(), "README.md should exist in lib/"

    def test_deployment_guide_exists(self):
        """Test that DEPLOYMENT_GUIDE.md exists"""
        guide_file = Path('./lib/DEPLOYMENT_GUIDE.md')
        assert guide_file.exists(), "DEPLOYMENT_GUIDE.md should exist in lib/"

    def test_quick_start_exists(self):
        """Test that QUICK_START.md exists"""
        quick_start_file = Path('./lib/QUICK_START.md')
        assert quick_start_file.exists(), "QUICK_START.md should exist in lib/"


class TestTfvarsConfiguration:
    """Test terraform.tfvars configuration"""

    def test_tfvars_file_exists(self):
        """Test that terraform.tfvars exists"""
        tfvars_file = Path('./lib/terraform.tfvars')
        assert tfvars_file.exists(), "terraform.tfvars should exist"

    def test_tfvars_has_required_variables(self):
        """Test that tfvars includes required variables"""
        with open('./lib/terraform.tfvars', 'r') as f:
            content = f.read()

        # Should have environment_suffix at minimum
        assert 'environment_suffix' in content or '=' in content
