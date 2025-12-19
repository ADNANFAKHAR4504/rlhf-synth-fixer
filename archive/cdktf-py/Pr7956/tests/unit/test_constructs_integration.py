"""Integration tests that execute actual construct code for coverage."""

import unittest
import sys
import os
from cdktf import App, TerraformStack
from constructs import Construct

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestVpcConstructIntegration(unittest.TestCase):
    """Integration tests for VPC construct."""

    def test_vpc_construct_execution(self):
        """Test VPC construct instantiation and execution."""
        from lib.vpc import ZeroTrustVpc
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-vpc-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute VPC construct
        vpc = ZeroTrustVpc(
            stack,
            "vpc",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        # Verify execution
        self.assertIsNotNone(vpc.vpc)
        self.assertEqual(len(vpc.private_subnets), 3)
        self.assertIsNotNone(vpc.private_route_table)
        self.assertIsNotNone(vpc.endpoint_security_group)


class TestIamConstructIntegration(unittest.TestCase):
    """Integration tests for IAM construct."""

    def test_iam_construct_execution(self):
        """Test IAM construct instantiation and execution."""
        from lib.iam import ZeroTrustIam
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-iam-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute IAM construct
        iam = ZeroTrustIam(
            stack,
            "iam",
            environment_suffix="test",
            account_id="123456789012"
        )

        # Verify execution
        self.assertIsNotNone(iam.cross_account_role)
        self.assertIsNotNone(iam.security_audit_role)
        self.assertIsNotNone(iam.session_manager_role)


class TestEncryptionConstructIntegration(unittest.TestCase):
    """Integration tests for Encryption construct."""

    def test_encryption_construct_execution(self):
        """Test Encryption construct instantiation and execution."""
        from lib.encryption import ZeroTrustEncryption
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-encryption-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Encryption construct
        encryption = ZeroTrustEncryption(
            stack,
            "encryption",
            environment_suffix="test",
            account_id="123456789012",
            aws_region="us-east-1"
        )

        # Verify execution
        self.assertIsNotNone(encryption.cloudtrail_key)
        self.assertIsNotNone(encryption.s3_key)
        self.assertIsNotNone(encryption.rds_key)
        self.assertIsNotNone(encryption.general_key)


class TestMonitoringConstructIntegration(unittest.TestCase):
    """Integration tests for Monitoring construct."""

    def test_monitoring_construct_execution(self):
        """Test Monitoring construct instantiation and execution."""
        from lib.monitoring import ZeroTrustMonitoring
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-monitoring-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Monitoring construct
        monitoring = ZeroTrustMonitoring(
            stack,
            "monitoring",
            environment_suffix="test",
            account_id="123456789012",
            aws_region="us-east-1",
            vpc_id="vpc-test123",
            kms_key_id="key-test123"
        )

        # Verify execution
        self.assertIsNotNone(monitoring.cloudtrail_bucket)
        self.assertIsNotNone(monitoring.flow_logs_bucket)
        self.assertIsNotNone(monitoring.trail)
        self.assertIsNotNone(monitoring.flow_logs)
        self.assertIsNotNone(monitoring.athena_db)


class TestSecurityConstructIntegration(unittest.TestCase):
    """Integration tests for Security construct."""

    def test_security_construct_execution_disabled(self):
        """Test Security construct with features disabled."""
        from lib.security import ZeroTrustSecurity
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-security-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Security construct with features disabled
        security = ZeroTrustSecurity(
            stack,
            "security",
            environment_suffix="test",
            aws_region="us-east-1",
            config_role_arn="arn:aws:iam::123456789012:role/config",
            enable_config=False,
            enable_security_hub=False
        )

        # Verify execution
        self.assertIsNotNone(security)
        self.assertFalse(security.enable_config)
        self.assertFalse(security.enable_security_hub)


class TestWafConstructIntegration(unittest.TestCase):
    """Integration tests for WAF construct."""

    def test_waf_construct_execution(self):
        """Test WAF construct instantiation and execution."""
        from lib.waf import ZeroTrustWaf
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-waf-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute WAF construct
        waf = ZeroTrustWaf(
            stack,
            "waf",
            environment_suffix="test"
        )

        # Verify execution
        self.assertIsNotNone(waf.blocked_ip_set)
        self.assertIsNotNone(waf.web_acl)


class TestComplianceConstructIntegration(unittest.TestCase):
    """Integration tests for Compliance construct."""

    def test_compliance_construct_execution(self):
        """Test Compliance construct instantiation and execution."""
        from lib.compliance import ZeroTrustCompliance

        app = App()
        stack = TerraformStack(app, "test-compliance-stack")

        # Execute Compliance construct
        compliance = ZeroTrustCompliance(
            stack,
            "compliance",
            environment_suffix="test"
        )

        # Verify execution and policy structure
        self.assertIsNotNone(compliance)
        self.assertIsInstance(compliance.prevent_security_service_disable_scp, dict)
        self.assertIsInstance(compliance.require_encryption_scp, dict)
        self.assertIsInstance(compliance.prevent_public_access_scp, dict)

        # Verify policy content
        prevent_scp = compliance.prevent_security_service_disable_scp
        self.assertEqual(prevent_scp['Version'], '2012-10-17')
        self.assertIn('Statement', prevent_scp)
        self.assertGreater(len(prevent_scp['Statement']), 0)

        # Verify encryption SCP
        enc_scp = compliance.require_encryption_scp
        self.assertEqual(len(enc_scp['Statement']), 3)

        # Verify public access SCP
        pub_scp = compliance.prevent_public_access_scp
        self.assertEqual(len(pub_scp['Statement']), 2)


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for main TapStack."""

    def test_tap_stack_execution(self):
        """Test TapStack instantiation and execution."""
        from lib.tap_stack import TapStack

        app = App()

        # Execute TapStack
        stack = TapStack(
            app,
            "tap-stack",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"Environment": "test"}
        )

        # Verify execution
        self.assertIsNotNone(stack)


class TestSecurityConstructIntegrationEnabled(unittest.TestCase):
    """Integration tests for Security construct with features enabled."""

    def test_security_construct_with_security_hub_enabled(self):
        """Test Security construct with Security Hub enabled."""
        from lib.security import ZeroTrustSecurity
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-security-hub-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Security construct with Security Hub enabled
        security = ZeroTrustSecurity(
            stack,
            "security",
            environment_suffix="test",
            aws_region="us-east-1",
            config_role_arn="arn:aws:iam::123456789012:role/config",
            enable_config=False,
            enable_security_hub=True
        )

        # Verify execution
        self.assertIsNotNone(security)
        self.assertTrue(security.enable_security_hub)
        self.assertIsNotNone(security.security_hub)

    def test_security_construct_with_config_enabled(self):
        """Test Security construct with AWS Config enabled."""
        from lib.security import ZeroTrustSecurity
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-config-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Security construct with Config enabled
        security = ZeroTrustSecurity(
            stack,
            "security",
            environment_suffix="test",
            aws_region="us-east-1",
            config_role_arn="arn:aws:iam::123456789012:role/config",
            enable_config=True,
            enable_security_hub=False
        )

        # Verify execution
        self.assertIsNotNone(security)
        self.assertTrue(security.enable_config)
        self.assertIsNotNone(security.config_bucket)
        self.assertIsNotNone(security.config_recorder)

    def test_security_construct_with_all_enabled(self):
        """Test Security construct with all features enabled."""
        from lib.security import ZeroTrustSecurity
        from cdktf_cdktf_provider_aws.provider import AwsProvider

        app = App()
        stack = TerraformStack(app, "test-all-enabled-stack")
        AwsProvider(stack, "aws", region="us-east-1")

        # Execute Security construct with all features enabled
        security = ZeroTrustSecurity(
            stack,
            "security",
            environment_suffix="test",
            aws_region="us-east-1",
            config_role_arn="arn:aws:iam::123456789012:role/config",
            enable_config=True,
            enable_security_hub=True
        )

        # Verify execution
        self.assertIsNotNone(security)
        self.assertTrue(security.enable_config)
        self.assertTrue(security.enable_security_hub)
        self.assertIsNotNone(security.security_hub)
        self.assertIsNotNone(security.config_bucket)
        self.assertIsNotNone(security.config_recorder)
        self.assertIsNotNone(security.config_delivery_channel)


if __name__ == '__main__':
    unittest.main()
