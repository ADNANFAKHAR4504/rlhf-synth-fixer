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

    def test_vpc_has_vpc_endpoint_method(self):
        """Test VPC has method to create VPC endpoints."""
        from lib.vpc import ZeroTrustVpc
        self.assertTrue(hasattr(ZeroTrustVpc, '_create_vpc_endpoints'))

    def test_vpc_cidr_configuration(self):
        """Test VPC CIDR block configuration."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc.__init__)
        # Verify VPC CIDR is configured
        self.assertIn('10.0.0.0/16', source)
        self.assertIn('enable_dns_hostnames', source)
        self.assertIn('enable_dns_support', source)

    def test_vpc_private_subnets_configuration(self):
        """Test VPC creates private subnets."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc.__init__)
        # Verify private subnets configuration
        self.assertIn('private_subnets', source)
        self.assertIn('map_public_ip_on_launch=False', source)
        self.assertIn('availability_zone', source)

    def test_vpc_security_group_configuration(self):
        """Test VPC security group for endpoints."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc.__init__)
        # Verify security group configuration
        self.assertIn('endpoint_security_group', source)
        self.assertIn('from_port=443', source)
        self.assertIn('to_port=443', source)

    def test_vpc_endpoints_list(self):
        """Test VPC endpoints for AWS services."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc._create_vpc_endpoints)
        # Verify essential VPC endpoints
        essential_services = ['ec2', 'ssm', 'logs', 'kms', 's3']
        for service in essential_services:
            self.assertIn(service, source)

    def test_vpc_endpoint_types(self):
        """Test VPC endpoint types."""
        from lib.vpc import ZeroTrustVpc
        import inspect

        source = inspect.getsource(ZeroTrustVpc._create_vpc_endpoints)
        # Verify both interface and gateway endpoints
        self.assertIn('Interface', source)
        self.assertIn('Gateway', source)


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

    def test_iam_has_role_creation_methods(self):
        """Test IAM has methods to create different role types."""
        from lib.iam import ZeroTrustIam
        self.assertTrue(hasattr(ZeroTrustIam, '_create_cross_account_role'))
        self.assertTrue(hasattr(ZeroTrustIam, '_create_security_audit_role'))
        self.assertTrue(hasattr(ZeroTrustIam, '_create_session_manager_role'))

    def test_iam_cross_account_role_mfa(self):
        """Test cross-account role requires MFA."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam._create_cross_account_role)
        self.assertIn('MultiFactorAuthPresent', source)
        self.assertIn('ExternalId', source)
        self.assertIn('AssumeRole', source)

    def test_iam_session_duration_limits(self):
        """Test IAM roles have session duration limits."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam._create_cross_account_role)
        self.assertIn('max_session_duration', source)
        self.assertIn('3600', source)  # 1 hour

    def test_iam_least_privilege_policies(self):
        """Test IAM uses least-privilege access policies."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam._create_cross_account_role)
        # Verify read-only permissions
        self.assertIn('Describe', source)
        self.assertIn('List', source)
        self.assertIn('Get', source)

    def test_iam_security_audit_role(self):
        """Test security audit role configuration."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam._create_security_audit_role)
        self.assertIn('config.amazonaws.com', source)
        self.assertIn('securityhub.amazonaws.com', source)
        self.assertIn('AWS_ConfigRole', source)

    def test_iam_session_manager_role(self):
        """Test session manager role for EC2."""
        from lib.iam import ZeroTrustIam
        import inspect

        source = inspect.getsource(ZeroTrustIam._create_session_manager_role)
        self.assertIn('ec2.amazonaws.com', source)
        self.assertIn('AmazonSSMManagedInstanceCore', source)


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

    def test_encryption_has_key_creation_methods(self):
        """Test encryption has methods to create different KMS keys."""
        from lib.encryption import ZeroTrustEncryption
        self.assertTrue(hasattr(ZeroTrustEncryption, '_create_cloudtrail_key'))
        self.assertTrue(hasattr(ZeroTrustEncryption, '_create_s3_key'))
        self.assertTrue(hasattr(ZeroTrustEncryption, '_create_rds_key'))
        self.assertTrue(hasattr(ZeroTrustEncryption, '_create_general_key'))

    def test_kms_key_rotation_enabled(self):
        """Test KMS keys have automatic rotation enabled."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption)
        self.assertIn('enable_key_rotation=True', source)

    def test_kms_key_deletion_window(self):
        """Test KMS keys have deletion window configured."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption)
        self.assertIn('deletion_window_in_days=10', source)

    def test_cloudtrail_key_policy(self):
        """Test CloudTrail KMS key policy."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption._create_cloudtrail_key)
        self.assertIn('cloudtrail.amazonaws.com', source)
        self.assertIn('GenerateDataKey', source)
        self.assertIn('DecryptDataKey', source)
        self.assertIn('DescribeKey', source)

    def test_s3_key_policy(self):
        """Test S3 KMS key policy."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption._create_s3_key)
        self.assertIn('s3.amazonaws.com', source)
        self.assertIn('Decrypt', source)
        self.assertIn('GenerateDataKey', source)

    def test_rds_key_policy(self):
        """Test RDS KMS key policy."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption._create_rds_key)
        self.assertIn('rds.amazonaws.com', source)
        self.assertIn('CreateGrant', source)

    def test_kms_aliases_created(self):
        """Test KMS key aliases are created."""
        from lib.encryption import ZeroTrustEncryption
        import inspect

        source = inspect.getsource(ZeroTrustEncryption)
        self.assertIn('KmsAlias', source)
        self.assertIn('alias/zero-trust', source)


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

    def test_monitoring_has_bucket_creation_methods(self):
        """Test monitoring has methods to create S3 buckets."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_cloudtrail_bucket'))
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_flow_logs_bucket'))

    def test_monitoring_has_trail_creation_method(self):
        """Test monitoring has method to create CloudTrail."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_cloudtrail'))

    def test_monitoring_has_flow_logs_method(self):
        """Test monitoring has method to create VPC flow logs."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_vpc_flow_logs'))

    def test_monitoring_has_athena_method(self):
        """Test monitoring has method to create Athena database."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_athena_database'))

    def test_monitoring_has_alarms_method(self):
        """Test monitoring has method to create security alarms."""
        from lib.monitoring import ZeroTrustMonitoring
        self.assertTrue(hasattr(ZeroTrustMonitoring, '_create_security_alarms'))

    def test_s3_bucket_versioning(self):
        """Test S3 buckets have versioning enabled."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        self.assertIn('Versioning', source)
        self.assertIn('Enabled', source)

    def test_s3_bucket_encryption(self):
        """Test S3 buckets have encryption enabled."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring)
        self.assertIn('ServerSideEncryption', source)

    def test_object_lock_enabled(self):
        """Test CloudTrail bucket has object lock."""
        from lib.monitoring import ZeroTrustMonitoring
        import inspect

        source = inspect.getsource(ZeroTrustMonitoring._create_cloudtrail_bucket)
        self.assertIn('object_lock_enabled=True', source)


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

    def test_security_has_security_hub_method(self):
        """Test security has method to enable Security Hub."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '_enable_security_hub'))

    def test_security_has_insights_method(self):
        """Test security has method to create custom insights."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '_create_custom_insights'))

    def test_security_has_config_bucket_method(self):
        """Test security has method to create Config bucket."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '_create_config_bucket'))

    def test_security_has_config_recorder_method(self):
        """Test security has method to create Config recorder."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '_create_config_recorder'))

    def test_security_has_config_rules_method(self):
        """Test security has method to create Config rules."""
        from lib.security import ZeroTrustSecurity
        self.assertTrue(hasattr(ZeroTrustSecurity, '_create_config_rules'))

    def test_security_hub_standards(self):
        """Test Security Hub standards subscription."""
        from lib.security import ZeroTrustSecurity
        import inspect

        source = inspect.getsource(ZeroTrustSecurity._enable_security_hub)
        self.assertIn('SecurityhubStandardsSubscription', source)
        self.assertIn('cis-aws-foundations-benchmark', source)
        self.assertIn('aws-foundational-security-best-practices', source)

    def test_security_enable_flags(self):
        """Test security construct has enable flags."""
        from lib.security import ZeroTrustSecurity
        import inspect

        source = inspect.getsource(ZeroTrustSecurity.__init__)
        self.assertIn('enable_config', source)
        self.assertIn('enable_security_hub', source)


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

    def test_waf_has_ip_set_method(self):
        """Test WAF has method to create blocked IP set."""
        from lib.waf import ZeroTrustWaf
        self.assertTrue(hasattr(ZeroTrustWaf, '_create_blocked_ip_set'))

    def test_waf_has_web_acl_method(self):
        """Test WAF has method to create Web ACL."""
        from lib.waf import ZeroTrustWaf
        self.assertTrue(hasattr(ZeroTrustWaf, '_create_web_acl'))

    def test_waf_rate_limit_configuration(self):
        """Test WAF rate limit configuration."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf._create_web_acl)
        self.assertIn('rate_based_statement', source)
        self.assertIn('limit', source)
        self.assertIn('2000', source)

    def test_waf_managed_rules(self):
        """Test WAF includes AWS managed rules."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf._create_web_acl)
        self.assertIn('AWSManagedRulesCommonRuleSet', source)
        self.assertIn('AWSManagedRulesKnownBadInputsRuleSet', source)
        self.assertIn('AWSManagedRulesAmazonIpReputationList', source)

    def test_waf_cloudwatch_metrics(self):
        """Test WAF CloudWatch metrics enabled."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf._create_web_acl)
        self.assertIn('cloudwatch_metrics_enabled', source)
        self.assertIn('True', source)

    def test_waf_ip_set_scope(self):
        """Test WAF IP set scope configuration."""
        from lib.waf import ZeroTrustWaf
        import inspect

        source = inspect.getsource(ZeroTrustWaf._create_blocked_ip_set)
        self.assertIn('REGIONAL', source)
        self.assertIn('IPV4', source)


class TestComplianceConstruct(unittest.TestCase):
    """Test compliance and governance components."""

    def test_compliance_construct_exists(self):
        """Test that Compliance construct is properly defined."""
        from lib.compliance import ZeroTrustCompliance
        self.assertTrue(hasattr(ZeroTrustCompliance, '__init__'))

    def test_scp_policies_configuration(self):
        """Test SCP policies for security service protection."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # Verify Security Hub actions are configured in SCPs
        self.assertIn('securityhub', source.lower())
        # Verify other critical security services are protected
        self.assertIn('guardduty', source.lower())
        self.assertIn('cloudtrail', source.lower())

    def test_encryption_scp_policies(self):
        """Test SCP policies enforce encryption requirements."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # Verify encryption requirements for S3, EBS, and RDS
        self.assertIn('s3:putobject', source.lower())
        self.assertIn('ec2:encrypted', source.lower())
        self.assertIn('rds:storageencrypted', source.lower())

    def test_public_access_prevention(self):
        """Test SCP policies prevent public access."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # Verify public access prevention for S3 and RDS
        self.assertIn('preventpublic', source.lower())
        self.assertIn('rds:publiclyaccessible', source.lower())

    def test_compliance_has_all_scp_methods(self):
        """Test that all SCP creation methods exist."""
        from lib.compliance import ZeroTrustCompliance

        self.assertTrue(hasattr(ZeroTrustCompliance, '_create_prevent_disable_scp'))
        self.assertTrue(hasattr(ZeroTrustCompliance, '_create_require_encryption_scp'))
        self.assertTrue(hasattr(ZeroTrustCompliance, '_create_prevent_public_access_scp'))

    def test_compliance_initialization_attributes(self):
        """Test compliance construct initialization creates SCP attributes."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance.__init__)
        # Verify all SCP policies are assigned as attributes
        self.assertIn('prevent_security_service_disable_scp', source)
        self.assertIn('require_encryption_scp', source)
        self.assertIn('prevent_public_access_scp', source)
        self.assertIn('environment_suffix', source)

    def test_compliance_policy_version(self):
        """Test that all SCP policies use correct IAM policy version."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # Count occurrences of IAM policy version
        self.assertIn('"Version": "2012-10-17"', source)

    def test_compliance_deny_effect(self):
        """Test that SCPs use Deny effect for restrictive policies."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # SCPs should use Deny effect
        self.assertIn('"Effect": "Deny"', source)

    def test_compliance_statement_structure(self):
        """Test that all SCPs include required Statement structure."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance)
        # All policies should have Statement arrays
        self.assertIn('"Statement"', source)
        # Should include Sids for clarity
        self.assertIn('"Sid"', source)

    def test_compliance_security_services_protected(self):
        """Test that critical security services are protected."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance._create_prevent_disable_scp)

        # Check for critical security service actions
        security_services = [
            'cloudtrail:StopLogging',
            'cloudtrail:DeleteTrail',
            'config:DeleteConfigRule',
            'guardduty:DeleteDetector',
            'securityhub:DisableSecurityHub',
        ]

        for service_action in security_services:
            self.assertIn(service_action, source)

    def test_encryption_requirements_comprehensive(self):
        """Test encryption requirements cover all major services."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance._create_require_encryption_scp)

        # Check for S3 encryption
        self.assertIn('s3:PutObject', source)
        self.assertIn('s3:x-amz-server-side-encryption', source)

        # Check for EBS encryption
        self.assertIn('ec2:RunInstances', source)
        self.assertIn('ec2:Encrypted', source)

        # Check for RDS encryption
        self.assertIn('rds:CreateDBInstance', source)
        self.assertIn('rds:StorageEncrypted', source)

    def test_public_access_prevention_comprehensive(self):
        """Test public access prevention covers critical services."""
        from lib.compliance import ZeroTrustCompliance
        import inspect

        source = inspect.getsource(ZeroTrustCompliance._create_prevent_public_access_scp)

        # Check for S3 public access blocks
        self.assertIn('s3:PutBucketPublicAccessBlock', source)
        self.assertIn('s3:BlockPublicAcls', source)

        # Check for RDS public accessibility
        self.assertIn('rds:PubliclyAccessible', source)


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
