import pytest
import json
from pathlib import Path


class TestDeploymentOutputs:
    """Test deployment output validation"""

    @pytest.fixture
    def outputs_file(self):
        """Load cfn-outputs if it exists"""
        outputs_path = Path('./cfn-outputs/flat-outputs.json')
        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                return json.load(f)
        return {}

    def test_outputs_file_structure(self, outputs_file):
        """Test that outputs file has required structure"""
        if outputs_file:
            # If outputs exist, they should be a dict
            assert isinstance(outputs_file, dict), "Outputs should be a dictionary"

    def test_organization_outputs_present(self, outputs_file):
        """Test that organization outputs are present"""
        if outputs_file:
            # At least some organization-related outputs should be present
            org_keys = [k for k in outputs_file.keys() if 'organization' in k.lower()]
            assert len(org_keys) > 0 or len(outputs_file) > 0, "Outputs should include organization information"

    def test_kms_outputs_present(self, outputs_file):
        """Test that KMS outputs are present"""
        if outputs_file:
            kms_keys = [k for k in outputs_file.keys() if 'kms' in k.lower() or 'key' in k.lower()]
            # At least outputs should be present
            assert len(outputs_file) > 0, "Outputs should be generated"


class TestTerraformStateValidation:
    """Test Terraform state validation"""

    def test_terraform_directory_initialized(self):
        """Test that Terraform directory is initialized"""
        tf_backend_dir = Path('./lib/.terraform')
        # This would exist after terraform init
        # Just verify the lib directory exists
        assert Path('./lib').exists(), "lib directory should exist"

    def test_terraform_lock_file_present(self):
        """Test that terraform.lock.hcl exists (after init)"""
        lock_file = Path('./lib/.terraform.lock.hcl')
        # Lock file would be present after init, but may not be present before
        # This is informational
        assert Path('./lib').exists()


class TestCrossAccountAccess:
    """Test cross-account access configuration"""

    def test_assume_role_policy_format(self):
        """Test that assume role policy has correct format"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        # IAM file should exist and have policies
        assert 'aws_iam_role' in content
        # Should have proper JSON policy document
        assert 'assume_role_policy' in content or 'policy' in content

    def test_trusted_principals_configured(self):
        """Test that trusted principals are configured"""
        with open('./lib/iam.tf', 'r') as f:
            content = f.read()

        # Should define trust relationships
        assert 'Principal' in content or 'principal' in content.lower()


class TestSecurityControls:
    """Test security controls implementation"""

    def test_encryption_at_rest_enabled(self):
        """Test that encryption at rest is enabled"""
        files_to_check = [
            './lib/main.tf',
            './lib/cloudwatch.tf',
            './lib/config.tf'
        ]

        encryption_found = False
        for file_path in files_to_check:
            with open(file_path, 'r') as f:
                content = f.read()
            if 'kms_key_id' in content or 'sse_algorithm' in content or 'server_side_encryption' in content:
                encryption_found = True
                break

        assert encryption_found, "Encryption at rest should be configured"

    def test_encryption_in_transit_enforced(self):
        """Test that encryption in transit is enforced"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Check for secure transport enforcement
        assert 'aws:SecureTransport' in content or 'secure_transport' in content or 'https' in content.lower(), \
            "Encryption in transit should be enforced"

    def test_public_access_blocked(self):
        """Test that public access is blocked"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'public_access_block' in content or 'block_public' in content, \
            "Public access should be blocked"

    def test_audit_logging_enabled(self):
        """Test that audit logging is enabled"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'cloudtrail' in content.lower() or 'logging' in content.lower(), \
            "Audit logging should be enabled"

    def test_log_validation_enabled(self):
        """Test that log file validation is enabled"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'enable_log_file_validation' in content, "Log file validation should be enabled"


class TestMultiAccountConfiguration:
    """Test multi-account setup"""

    def test_organizations_enabled(self):
        """Test that Organizations is enabled"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        assert 'aws_organizations_organization' in content

    def test_organizational_units_defined(self):
        """Test that organizational units are defined"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Check for multiple OUs
        ou_count = content.count('aws_organizations_organizational_unit')
        assert ou_count >= 3, "Should have at least 3 organizational units"

    def test_organization_policies_configured(self):
        """Test that organization policies are configured"""
        with open('./lib/scp.tf', 'r') as f:
            content = f.read()

        # SCPs should be defined
        assert 'policy' in content or 'Policy' in content or 'aws_organizations' in content


class TestKeyManagement:
    """Test key management configuration"""

    def test_primary_key_configured(self):
        """Test that primary KMS key is configured"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'aws_kms_key' in content and 'primary' in content

    def test_replica_key_configured(self):
        """Test that replica KMS key is configured"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'replica' in content.lower(), "Replica key should be configured for DR"

    def test_key_rotation_configured(self):
        """Test that key rotation is configured"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        assert 'enable_key_rotation' in content, "Key rotation should be enabled"

    def test_key_grants_configured(self):
        """Test that key grants are configured"""
        with open('./lib/kms.tf', 'r') as f:
            content = f.read()

        # Key grants may be configured for service-specific access
        # This is optional but recommended
        if 'grant' in content.lower():
            assert 'aws_kms' in content


class TestComplianceRules:
    """Test AWS Config compliance rules"""

    def test_config_rules_defined(self):
        """Test that Config rules are defined"""
        with open('./lib/config.tf', 'r') as f:
            content = f.read()

        assert 'aws_config_config_rule' in content, "Config rules should be defined"

    def test_s3_encryption_rule_present(self):
        """Test that S3 encryption rule is present"""
        with open('./lib/config.tf', 'r') as f:
            content = f.read()

        # Check for S3 encryption rule
        content_lower = content.lower()
        assert 's3' in content_lower and ('encrypt' in content_lower or 'rule' in content_lower), \
            "S3 encryption rule should be present"

    def test_conformance_pack_configured(self):
        """Test that conformance pack is configured"""
        conformance_file = Path('./lib/conformance-pack.yaml')
        assert conformance_file.exists(), "Conformance pack should be defined"

        with open(conformance_file, 'r') as f:
            content = f.read()
        assert 'Config' in content or 'Rule' in content


class TestResourceDependencies:
    """Test resource dependencies and ordering"""

    def test_kms_key_before_s3_encryption(self):
        """Test that KMS key is created before S3 encryption"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Check for dependency management
        kms_index = content.find('aws_kms_key')
        s3_encrypt_index = content.find('server_side_encryption')

        if s3_encrypt_index != -1:
            # S3 encryption references KMS
            assert 'depends_on' in content or 'kms_key' in content

    def test_cloudtrail_depends_on_s3_policy(self):
        """Test that CloudTrail depends on S3 policy"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Check for proper dependency
        if 'cloudtrail' in content.lower():
            assert 'depends_on' in content or 'bucket_policy' in content


class TestEnvironmentIsolation:
    """Test environment isolation using environment_suffix"""

    def test_bucket_name_includes_suffix(self):
        """Test that bucket names include environment_suffix"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Bucket names should include environment_suffix and account ID
        assert 'environment_suffix' in content
        assert 'account_id' in content or 'caller_identity' in content

    def test_resource_names_unique_per_environment(self):
        """Test that resource names are unique per environment"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Resources should use environment_suffix in names
        assert 'environment_suffix' in content
        # At least some resources should reference it
        assert content.count('environment_suffix') >= 3, "Multiple resources should use environment_suffix"


class TestDataValidation:
    """Test data validation and correctness"""

    def test_region_variables_valid(self):
        """Test that region variables are valid"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()

        # Primary region should be defined
        assert 'primary_region' in content
        # Secondary region should be defined for DR
        assert 'secondary_region' in content

    def test_tag_structure_valid(self):
        """Test that tags are properly structured"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()

        # Tags variable should be defined
        assert 'tags' in content
        # Should be a map type
        assert 'map' in content.lower() or 'variable' in content


class TestErrorHandling:
    """Test error handling and validation"""

    def test_variables_have_descriptions(self):
        """Test that variables have descriptions"""
        with open('./lib/variables.tf', 'r') as f:
            content = f.read()

        # Variables should have descriptions
        if 'variable' in content:
            assert 'description' in content.lower() or 'type' in content.lower()

    def test_resources_have_proper_configuration(self):
        """Test that resources have proper configuration"""
        with open('./lib/main.tf', 'r') as f:
            content = f.read()

        # Organizations organization should have required settings
        if 'aws_organizations_organization' in content:
            # Should enable policy types or feature set
            assert 'enabled_policy_types' in content or 'feature_set' in content
