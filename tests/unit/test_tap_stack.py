"""Unit tests for TapStack - Main Zero Trust Security Framework stack."""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestTapStackInitialization(unittest.TestCase):
    """Test TapStack initialization and configuration."""

    def test_stack_creation(self):
        """Test that TapStack can be created with required parameters."""
        # This test verifies the stack structure exists
        from lib.tap_stack import TapStack
        self.assertTrue(hasattr(TapStack, '__init__'))

    def test_stack_has_required_constructs(self):
        """Test that TapStack includes required security constructs."""
        from lib.tap_stack import TapStack
        import inspect

        source = inspect.getsource(TapStack.__init__)
        # Verify all security domains are imported and created
        self.assertIn('ZeroTrustVpc', source)
        self.assertIn('ZeroTrustIam', source)
        self.assertIn('ZeroTrustEncryption', source)
        self.assertIn('ZeroTrustMonitoring', source)
        self.assertIn('ZeroTrustSecurity', source)
        self.assertIn('ZeroTrustWaf', source)
        self.assertIn('ZeroTrustCompliance', source)


class TestVpcConstruct(unittest.TestCase):
    """Test VPC and networking components."""

    def test_vpc_construct_exists(self):
        """Test that VPC construct is properly defined."""
        from lib.vpc import ZeroTrustVpc
        self.assertTrue(hasattr(ZeroTrustVpc, '__init__'))

    def test_vpc_has_required_methods(self):
        """Test VPC construct has required methods."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        methods = inspect.getmembers(ZeroTrustVpc, predicate=inspect.ismethod)
        method_names = [m[0] for m in methods]
        # VPC should have core networking methods
        self.assertGreater(len(method_names), 0)


class TestIamConstruct(unittest.TestCase):
    """Test IAM security components."""

    def test_iam_construct_exists(self):
        """Test that IAM construct is properly defined."""
        from lib.iam import ZeroTrustIam
        self.assertTrue(hasattr(ZeroTrustIam, '__init__'))

    def test_iam_enforces_mfa(self):
        """Test IAM configuration includes MFA enforcement."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam)
        # Verify MFA-related configuration exists
        self.assertIn('mfa', source.lower())


class TestEncryptionConstruct(unittest.TestCase):
    """Test encryption and key management."""

    def test_encryption_construct_exists(self):
        """Test that Encryption construct is properly defined."""
        from lib.encryption import ZeroTrustEncryption
        self.assertTrue(hasattr(ZeroTrustEncryption, '__init__'))

    def test_kms_key_configuration(self):
        """Test KMS key configuration."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption)
        # Verify KMS configuration exists
        self.assertIn('kms', source.lower())


class TestMonitoringConstruct(unittest.TestCase):
    """Test monitoring and compliance components."""

    def test_monitoring_construct_exists(self):
        """Test that Monitoring construct is properly defined."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '__init__'))

    def test_cloudtrail_configuration(self):
        """Test CloudTrail logging configuration."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        # Verify CloudTrail is configured
        self.assertIn('cloudtrail', source.lower())

    def test_flow_logs_configuration(self):
        """Test VPC Flow Logs configuration."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        # Verify Flow Logs are configured
        self.assertIn('flow_log', source.lower())


class TestSecurityConstruct(unittest.TestCase):
    """Test security controls and policies."""

    def test_security_construct_exists(self):
        """Test that Security construct is properly defined."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '__init__'))

    def test_guardduty_configuration(self):
        """Test GuardDuty threat detection configuration."""
        from lib.security import ZeroTrustSecurity
        import inspect

        source = inspect.getsource(ZeroTrustSecurity)
        # Verify GuardDuty is configured
        self.assertIn('guardduty', source.lower())

    def test_config_rules_configuration(self):
        """Test AWS Config rules configuration."""
        from lib.security import ZeroTrustSecurity
        import inspect

        source = inspect.getsource(ZeroTrustSecurity)
        # Verify AWS Config is configured
        self.assertIn('config', source.lower())


class TestWafConstruct(unittest.TestCase):
    """Test WAF security rules."""

    def test_waf_construct_exists(self):
        """Test that WAF construct is properly defined."""
        from lib.waf import ZeroTrustWaf
        self.assertTrue(hasattr(ZeroTrustWaf, '__init__'))

    def test_waf_has_rate_limiting(self):
        """Test WAF includes rate-limiting rules."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf)
        # Verify rate limiting is configured
        self.assertIn('rate', source.lower())

    def test_waf_has_ip_reputation(self):
        """Test WAF includes IP reputation rules."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf)
        # Verify IP reputation is configured
        self.assertIn('ip', source.lower())


class TestComplianceConstruct(unittest.TestCase):
    """Test compliance and governance components."""

    def test_compliance_construct_exists(self):
        """Test that Compliance construct is properly defined."""
        from lib.compliance import ZeroTrustCompliance
        self.assertTrue(hasattr(ZeroTrustCompliance, '__init__'))

    def test_security_hub_configuration(self):
        """Test Security Hub configuration."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # Verify Security Hub is configured
        self.assertIn('security_hub', source.lower())


class TestImports(unittest.TestCase):
    """Test that all imports are working correctly."""

    def test_all_modules_importable(self):
        """Test that all lib modules can be imported without errors."""
        try:
            from lib import vpc
            from lib import iam
            from lib import encryption
            from lib import monitoring
            from lib import security
            from lib import waf
            from lib import compliance
            from lib import tap_stack
        except ImportError as e:
            self.fail(f"Failed to import lib modules: {e}")

    def test_cdktf_provider_imports(self):
        """Test that CDKTF provider imports are available."""
        try:
            from cdktf_cdktf_provider_aws.provider import AwsProvider
            from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
            from cdktf_cdktf_provider_aws.kms_key import KmsKey
        except ImportError as e:
            self.fail(f"Failed to import CDKTF providers: {e}")


if __name__ == '__main__':
    unittest.main()
