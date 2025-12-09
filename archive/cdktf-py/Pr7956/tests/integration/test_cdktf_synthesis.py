"""Integration tests for CDKTF synthesis and Terraform code generation."""

import unittest
import subprocess
import json
import os
import sys


class TestCdktfSynthesis(unittest.TestCase):
    """Test CDKTF synthesis and code generation."""

    def setUp(self):
        """Set up test environment."""
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.cdktf_out = os.path.join(self.project_root, 'cdktf.out')

    def test_cdktf_synth_succeeds(self):
        """Test that CDKTF synthesis completes successfully."""
        result = subprocess.run(
            ['npm', 'run', 'cdktf:synth'],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        self.assertEqual(result.returncode, 0,
                        f"CDKTF synthesis failed:\n{result.stderr}")

    def test_terraform_json_output_exists(self):
        """Test that Terraform JSON files are generated."""
        result = subprocess.run(
            ['npm', 'run', 'cdktf:synth'],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        self.assertEqual(result.returncode, 0)

        # Check if cdktf.out directory exists
        self.assertTrue(os.path.exists(self.cdktf_out),
                       f"cdktf.out directory not found: {self.cdktf_out}")



class TestStackConfiguration(unittest.TestCase):
    """Test stack configuration and resource definitions."""

    def setUp(self):
        """Set up test environment."""
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

    def test_metadata_json_exists(self):
        """Test that metadata.json exists and is valid."""
        metadata_file = os.path.join(self.project_root, 'metadata.json')
        self.assertTrue(os.path.exists(metadata_file),
                       f"metadata.json not found: {metadata_file}")

        with open(metadata_file, 'r') as f:
            try:
                metadata = json.load(f)
            except json.JSONDecodeError:
                self.fail("metadata.json is not valid JSON")

        # Verify required fields
        required_fields = ['platform', 'language', 'complexity', 'po_id', 'team']
        for field in required_fields:
            self.assertIn(field, metadata,
                         f"Required field '{field}' not found in metadata.json")

    def test_cdktf_json_exists(self):
        """Test that cdktf.json exists and is valid."""
        cdktf_file = os.path.join(self.project_root, 'cdktf.json')
        self.assertTrue(os.path.exists(cdktf_file),
                       f"cdktf.json not found: {cdktf_file}")

        with open(cdktf_file, 'r') as f:
            try:
                config = json.load(f)
            except json.JSONDecodeError:
                self.fail("cdktf.json is not valid JSON")

        # Verify configuration
        self.assertEqual(config.get('language'), 'python',
                        "Language should be Python")
        self.assertIn('app', config,
                     "App entry point should be defined")

    def test_lib_modules_exist(self):
        """Test that all lib module files exist."""
        lib_dir = os.path.join(self.project_root, 'lib')
        required_modules = [
            'tap_stack.py',
            'vpc.py',
            'iam.py',
            'encryption.py',
            'monitoring.py',
            'security.py',
            'waf.py',
            'compliance.py'
        ]

        for module in required_modules:
            module_path = os.path.join(lib_dir, module)
            self.assertTrue(os.path.exists(module_path),
                           f"Required module not found: {module_path}")


class TestSecurityImplementation(unittest.TestCase):
    """Test security-specific implementation details."""

    def setUp(self):
        """Set up test environment."""
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        sys.path.insert(0, self.project_root)

    def test_vpc_endpoints_defined(self):
        """Test that VPC endpoints are properly defined."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc)
        self.assertIn('vpc_endpoint', source.lower(),
                     "VPC endpoints should be defined")

    def test_s3_bucket_policies_defined(self):
        """Test that S3 bucket policies enforce encryption."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        self.assertIn('bucket_policy', source.lower(),
                     "S3 bucket policies should be defined")

    def test_kms_key_policies_defined(self):
        """Test that KMS key policies are configured."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption)
        self.assertIn('policy', source.lower(),
                     "KMS key policies should be defined")

    def test_cloudtrail_enabled(self):
        """Test that CloudTrail logging is enabled."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        self.assertIn('cloudtrail', source.lower(),
                     "CloudTrail should be configured")

    def test_guardduty_enabled(self):
        """Test that GuardDuty threat detection is enabled."""
        from lib.security import ZeroTrustSecurity
        import inspect

        source = inspect.getsource(ZeroTrustSecurity)
        self.assertIn('guardduty', source.lower(),
                     "GuardDuty should be configured")

    def test_waf_rules_configured(self):
        """Test that WAF rules are properly configured."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf)
        # Check for rate-based rules
        self.assertIn('rate', source.lower(),
                     "Rate-based WAF rules should be configured")


class TestCodeQuality(unittest.TestCase):
    """Test code quality and standards."""

    def setUp(self):
        """Set up test environment."""
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        sys.path.insert(0, self.project_root)

    def test_all_python_files_are_importable(self):
        """Test that all Python files can be imported without syntax errors."""
        lib_dir = os.path.join(self.project_root, 'lib')
        python_files = [f for f in os.listdir(lib_dir) if f.endswith('.py')]

        for py_file in python_files:
            module_name = py_file[:-3]
            try:
                __import__(f'lib.{module_name}')
            except Exception as e:
                self.fail(f"Failed to import lib.{module_name}: {e}")



if __name__ == '__main__':
    unittest.main()
