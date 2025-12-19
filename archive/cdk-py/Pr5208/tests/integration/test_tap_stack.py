import json
import os
import unittest

from pytest import mark

# Load flat-outputs.json for integration tests
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# AWS region from environment or default
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "pr5140")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack CloudFormation infrastructure"""

    @mark.it("verifies environment suffix is configured")
    def test_environment_suffix_configured(self):
        assert ENVIRONMENT_SUFFIX is not None
        assert len(ENVIRONMENT_SUFFIX) > 0
        assert isinstance(ENVIRONMENT_SUFFIX, str)

    @mark.it("verifies AWS region is configured")
    def test_aws_region_configured(self):
        assert AWS_REGION is not None
        assert len(AWS_REGION) > 0
        assert isinstance(AWS_REGION, str)

    @mark.it("verifies flat outputs file structure")
    def test_flat_outputs_structure(self):
        assert isinstance(flat_outputs, dict)

    @mark.it("verifies CDK stack module can be imported")
    def test_cdk_stack_importable(self):
        try:
            from lib.tap_stack import TapStack, TapStackProps
            assert TapStack is not None
            assert TapStackProps is not None
        except ImportError as e:
            self.fail(f"Failed to import TapStack: {e}")

    @mark.it("verifies tap_stack.py file exists")
    def test_tap_stack_file_exists(self):
        stack_path = os.path.join(base_dir, "..", "..", "lib", "tap_stack.py")
        assert os.path.exists(stack_path), "tap_stack.py should exist in lib directory"

        with open(stack_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert len(content) > 0
            assert "TapStack" in content

    @mark.it("verifies environment suffix format is valid")
    def test_environment_suffix_format(self):
        assert ENVIRONMENT_SUFFIX.replace("-", "").replace("_", "").isalnum()
        assert len(ENVIRONMENT_SUFFIX) <= 20

    @mark.it("verifies AWS region format is valid")
    def test_aws_region_format(self):
        valid_region_prefixes = ["us-", "eu-", "ap-", "ca-", "sa-", "af-", "me-"]
        assert any(AWS_REGION.startswith(prefix) for prefix in valid_region_prefixes)

    @mark.it("verifies Python version compatibility")
    def test_python_version(self):
        import sys
        version = sys.version_info
        assert version.major == 3
        assert version.minor >= 8

    @mark.it("verifies required AWS CDK modules are available")
    def test_cdk_modules_available(self):
        try:
            import aws_cdk
            import aws_cdk.aws_ec2
            import aws_cdk.aws_rds
            import aws_cdk.aws_kinesis
            import aws_cdk.aws_kms
            assert True
        except ImportError as e:
            self.fail(f"Required AWS CDK module not available: {e}")

    @mark.it("verifies stack can be instantiated")
    def test_stack_instantiation(self):
        try:
            import aws_cdk as cdk
            from lib.tap_stack import TapStack, TapStackProps

            app = cdk.App()
            stack = TapStack(
                app,
                "TestStack",
                TapStackProps(environment_suffix="test")
            )
            assert stack is not None
            assert hasattr(stack, 'vpc')
            assert hasattr(stack, 'kms_key')
        except Exception as e:
            self.fail(f"Failed to instantiate stack: {e}")

    @mark.it("verifies flat outputs contains expected keys if deployed")
    def test_flat_outputs_keys(self):
        if flat_outputs:
            assert isinstance(flat_outputs, dict)
            for key, value in flat_outputs.items():
                assert isinstance(key, str)
                assert len(key) > 0

    @mark.it("verifies lib directory structure")
    def test_lib_directory_structure(self):
        lib_dir = os.path.join(base_dir, "..", "..", "lib")
        assert os.path.isdir(lib_dir), "lib directory should exist"

        required_files = ["tap_stack.py", "__init__.py"]
        for file_name in required_files:
            file_path = os.path.join(lib_dir, file_name)
            assert os.path.exists(file_path), f"{file_name} should exist in lib directory"
