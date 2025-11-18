"""Unit tests for KMS Encryption construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.kms_encryption import KmsEncryption


class TestKmsEncryption:
    """Test suite for KMS Encryption construct."""

    def test_kms_encryption_creates_key(self):
        """KmsEncryption creates KMS key resource."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms = KmsEncryption(stack, "test_kms", environment_suffix="test")

        # Synthesize and verify
        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_kms_key" in resources

    def test_kms_encryption_enables_key_rotation(self):
        """KmsEncryption enables key rotation."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms = KmsEncryption(stack, "test_kms", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        kms_keys = output_json.get("resource", {}).get("aws_kms_key", {})
        for key_config in kms_keys.values():
            assert key_config.get("enable_key_rotation") is True

    def test_kms_encryption_has_deletion_window(self):
        """KmsEncryption configures deletion window."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms = KmsEncryption(stack, "test_kms", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        kms_keys = output_json.get("resource", {}).get("aws_kms_key", {})
        for key_config in kms_keys.values():
            assert key_config.get("deletion_window_in_days") == 10

    def test_kms_encryption_creates_alias(self):
        """KmsEncryption creates KMS alias."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms = KmsEncryption(stack, "test_kms", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        assert "aws_kms_alias" in output_json.get("resource", {})

    def test_kms_encryption_alias_name_format(self):
        """KmsEncryption alias follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "myenv"
        kms = KmsEncryption(stack, "test_kms", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        aliases = output_json.get("resource", {}).get("aws_kms_alias", {})
        for alias_config in aliases.values():
            alias_name = alias_config.get("name", "")
            assert f"alias/eks-{environment_suffix}" == alias_name

    def test_kms_encryption_tags_include_environment(self):
        """KmsEncryption tags include environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "prod"
        kms = KmsEncryption(stack, "test_kms", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        kms_keys = output_json.get("resource", {}).get("aws_kms_key", {})
        for key_config in kms_keys.values():
            tags = key_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix
            assert tags.get("ManagedBy") == "CDKTF"

    def test_kms_encryption_exposes_arn_property(self):
        """KmsEncryption exposes kms_key_arn property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        kms = KmsEncryption(stack, "test_kms", environment_suffix="test")

        assert hasattr(kms, "kms_key_arn")
        assert kms.kms_key_arn is not None

    def test_kms_encryption_description_includes_suffix(self):
        """KmsEncryption description includes environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "staging"
        kms = KmsEncryption(stack, "test_kms", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        kms_keys = output_json.get("resource", {}).get("aws_kms_key", {})
        for key_config in kms_keys.values():
            description = key_config.get("description", "")
            assert environment_suffix in description
            assert "KMS key for EKS secrets encryption" in description
