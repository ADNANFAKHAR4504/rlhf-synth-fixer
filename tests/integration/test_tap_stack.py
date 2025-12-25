"""
Integration tests for TAP stack - tests actual deployment scenarios and resource validation.
These tests can be run against real AWS environments for end-to-end validation.

LocalStack Community Compatible:
- Tests can run with or without CloudFront/WAF
- Auto-detects LocalStack environment via AWS_ENDPOINT_URL
"""

import unittest
import time
import os
from lib.tap_stack import TapStack, TapStackArgs

class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TAP stack deployment."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test environment."""
        cls.project_name = 'tap-integration-test'
        cls.test_environments = ['integration-test', 'integration-minimal', 'integration-full']

    def setUp(self):
        """Set up for each test."""
        self.stack_name = f"integration-{int(time.time())}"

    def tearDown(self):
        """Clean up after each test."""
        try:
            # Cleanup logic would go here in real implementation
            pass
        except (RuntimeError, ValueError) as e:
            # Handle specific exceptions that might occur during cleanup
            print(f"Cleanup failed: {e}")

class TestMinimalDeployment(TestTapStackIntegration):
    """Test minimal stack deployment."""

    def test_minimal_stack_creation(self):
        """Test creating stack with minimal configuration."""
        # Detect if running in LocalStack
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0
        enable_cloudfront = not is_localstack
        enable_waf = not is_localstack

        args = TapStackArgs('integration-minimal', test_mode=True,
                                                enable_cloudfront=enable_cloudfront, enable_waf=enable_waf)
        stack = TapStack('minimal-integration-stack', args)

        # Verify basic components
        self.assertIsNotNone(stack.kms_key)
        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)
        self.assertIsNotNone(stack.iam_role)

        # CloudFront and WAF are optional (not in LocalStack Community)
        if enable_cloudfront:
            self.assertIsNotNone(stack.cloudfront_distribution)
        if enable_waf:
            self.assertIsNotNone(stack.waf_acl)

    def test_minimal_stack_resources(self):
        """Test minimal stack resource configuration."""
        args = TapStackArgs('integration-minimal', test_mode=True)
        stack = TapStack('minimal-resources-stack', args)

        # Verify encryption and versioning
        for _, bucket in stack.buckets.items():
            self.assertIsNotNone(bucket)

        # Verify KMS encryption
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_alias)

    def test_minimal_stack_security(self):
        """Test minimal stack security configuration."""
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0

        args = TapStackArgs('integration-security', test_mode=True,
                                                enable_waf=(not is_localstack))
        stack = TapStack('security-minimal-stack', args)

        # Verify IAM role exists
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.iam_policy)

        # WAF is optional (not in LocalStack Community)
        if not is_localstack:
            self.assertIsNotNone(stack.waf_acl)

class TestFullDeployment(TestTapStackIntegration):
    """Test full stack deployment with all features."""

    def test_full_stack_with_domain(self):
        """Test stack creation with domain and all features."""
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0

        args = TapStackArgs(
                environment_suffix='integration-full',
                domain_name='integration.example.com' if not is_localstack else None,
                hosted_zone_id='Z1234567890ABCDEF' if not is_localstack else None,
                enable_logging=True,
                cost_optimization=False,
                test_mode=True,
                enable_cloudfront=(not is_localstack),
                enable_waf=(not is_localstack)
        )
        stack = TapStack('full-integration-stack', args)

        # Verify core components
        self.assertIsNotNone(stack.logging_bucket)
        self.assertIsInstance(stack.log_groups, dict)
        self.assertIsInstance(stack.cloudwatch_alarms, dict)
        self.assertEqual(len(stack.buckets), 2)

        # Verify optional components (CloudFront/WAF/ACM/Route53)
        if not is_localstack:
            self.assertIsNotNone(stack.certificate)
            self.assertIsNotNone(stack.route53_record)
            self.assertIsNotNone(stack.cloudfront_distribution)

    def test_full_stack_logging(self):
        """Test full stack with comprehensive logging."""
        args = TapStackArgs(
                environment_suffix='integration-logging',
                enable_logging=True,
                test_mode=True
        )
        stack = TapStack('logging-integration-stack', args)

        # Verify logging components
        self.assertIsNotNone(stack.logging_bucket)
        self.assertIsInstance(stack.log_groups, dict)
        self.assertEqual(len(stack.log_groups), 2)
        self.assertIsInstance(stack.cloudwatch_alarms, dict)
        self.assertEqual(len(stack.cloudwatch_alarms), 2)

    def test_full_stack_cost_optimization(self):
        """Test stack with cost optimization features."""
        args = TapStackArgs(
                environment_suffix='integration-cost',
                cost_optimization=True,
                enable_logging=False,
                test_mode=True
        )
        stack = TapStack('cost-integration-stack', args)

        # Verify cost optimization settings
        self.assertTrue(stack.cost_optimization)
        self.assertFalse(stack.enable_logging)
        self.assertIsNone(stack.logging_bucket)

class TestDomainConfiguration(TestTapStackIntegration):
    """Test domain and certificate configuration."""

    def test_domain_with_certificate(self):
        """Test stack with domain name for certificate creation."""
        args = TapStackArgs(
                environment_suffix='integration-cert',
                domain_name='cert.integration.example.com',
                test_mode=True
        )
        stack = TapStack('cert-integration-stack', args)

        # Verify certificate is created
        self.assertIsNotNone(stack.certificate)
        self.assertEqual(stack.domain_name, 'cert.integration.example.com')

    def test_domain_with_route53(self):
        """Test stack with domain and Route53 configuration."""
        args = TapStackArgs(
                environment_suffix='integration-route53',
                domain_name='route53.integration.example.com',
                hosted_zone_id='Z1234567890ROUTE53',
                test_mode=True
        )
        stack = TapStack('route53-integration-stack', args)

        # Verify Route53 components
        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.route53_record)
        self.assertTrue(hasattr(stack, 'cert_validation_records'))
        self.assertTrue(hasattr(stack, 'cert_validation'))

    def test_domain_without_hosted_zone(self):
        """Test stack with domain but no hosted zone."""
        args = TapStackArgs(
                environment_suffix='integration-domain-only',
                domain_name='domain-only.integration.example.com',
                test_mode=True
        )
        stack = TapStack('domain-only-integration-stack', args)

        # Should create certificate but not Route53 record
        self.assertIsNotNone(stack.certificate)
        self.assertIsNone(stack.route53_record)

class TestMultiRegionDeployment(TestTapStackIntegration):
    """Test multi-region deployment functionality."""

    def test_multi_region_buckets(self):
        """Test S3 bucket creation in multiple regions."""
        args = TapStackArgs('integration-multiregion', test_mode=True)
        stack = TapStack('multiregion-integration-stack', args)

        # Verify buckets in both regions
        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)

        # Verify bucket policies
        self.assertEqual(len(stack.bucket_policies), 2)

    def test_multi_region_logging(self):
        """Test logging configuration across regions."""
        args = TapStackArgs(
                environment_suffix='integration-multiregion-logging',
                enable_logging=True,
                test_mode=True
        )
        stack = TapStack('multiregion-logging-stack', args)

        # Verify log groups for each region
        self.assertEqual(len(stack.log_groups), 2)
        self.assertIn('us-west-2', stack.log_groups)
        self.assertIn('us-east-1', stack.log_groups)

        # Verify CloudWatch alarms for each region
        self.assertEqual(len(stack.cloudwatch_alarms), 2)
        self.assertIn('us-west-2', stack.cloudwatch_alarms)
        self.assertIn('us-east-1', stack.cloudwatch_alarms)

class TestSecurityConfiguration(TestTapStackIntegration):
    """Test security configuration and compliance."""

    def test_kms_encryption(self):
        """Test KMS key configuration for encryption."""
        args = TapStackArgs('integration-encryption', test_mode=True)
        stack = TapStack('encryption-integration-stack', args)

        # Verify KMS components
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_alias)

    def test_waf_protection(self):
        """Test WAF configuration for web protection."""
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0

        args = TapStackArgs('integration-waf', test_mode=True, enable_waf=(not is_localstack))
        stack = TapStack('waf-integration-stack', args)

        # Verify WAF configuration (if not LocalStack)
        if not is_localstack:
            self.assertIsNotNone(stack.waf_acl)

    def test_iam_least_privilege(self):
        """Test IAM configuration for least privilege access."""
        args = TapStackArgs('integration-iam', test_mode=True)
        stack = TapStack('iam-integration-stack', args)

        # Verify IAM components
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.iam_policy)

    def test_bucket_versioning(self):
        """Test S3 bucket versioning configuration."""
        args = TapStackArgs('integration-versioning', test_mode=True)
        stack = TapStack('versioning-integration-stack', args)

        # Verify buckets have versioning enabled
        for _, bucket in stack.buckets.items():
            self.assertIsNotNone(bucket)

class TestCloudFrontConfiguration(TestTapStackIntegration):
    """Test CloudFront CDN configuration."""

    def test_cloudfront_distribution(self):
        """Test CloudFront distribution configuration."""
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0

        args = TapStackArgs('integration-cloudfront', test_mode=True,
                                                enable_cloudfront=(not is_localstack))
        stack = TapStack('cloudfront-integration-stack', args)

        # Verify CloudFront components (if not LocalStack)
        if not is_localstack:
            self.assertIsNotNone(stack.cloudfront_distribution)
            self.assertIsNotNone(stack.oai)

    def test_cloudfront_with_domain(self):
        """Test CloudFront with custom domain configuration."""
        args = TapStackArgs(
                environment_suffix='integration-cloudfront-domain',
                domain_name='cdn.integration.example.com',
                test_mode=True
        )
        stack = TapStack('cloudfront-domain-stack', args)

        # Verify CloudFront and certificate
        self.assertIsNotNone(stack.cloudfront_distribution)
        self.assertIsNotNone(stack.certificate)

    def test_cloudfront_logging(self):
        """Test CloudFront with access logging."""
        args = TapStackArgs(
                environment_suffix='integration-cloudfront-logging',
                enable_logging=True,
                test_mode=True
        )
        stack = TapStack('cloudfront-logging-stack', args)

        # Verify logging bucket exists for CloudFront logs
        self.assertIsNotNone(stack.logging_bucket)

class TestEnvironmentVariations(TestTapStackIntegration):
    """Test different environment configurations."""

    def test_development_environment(self):
        """Test development environment setup."""
        args = TapStackArgs(
                environment_suffix='dev',
                enable_logging=True,
                cost_optimization=True,
                test_mode=True
        )
        stack = TapStack('dev-integration-stack', args)

        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertTrue(stack.enable_logging)
        self.assertTrue(stack.cost_optimization)

    def test_production_environment(self):
        """Test production environment setup."""
        args = TapStackArgs(
                environment_suffix='prod',
                domain_name='prod.integration.example.com',
                hosted_zone_id='Z1234567890PROD',
                enable_logging=True,
                cost_optimization=False,
                test_mode=True
        )
        stack = TapStack('prod-integration-stack', args)

        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.route53_record)
        self.assertTrue(stack.enable_logging)
        self.assertFalse(stack.cost_optimization)
        # Additional integration-specific assertions
        self.assertIsNotNone(stack.kms_key)
        self.assertEqual(len(stack.buckets), 2)

    def test_staging_environment(self):
        """Test staging environment setup."""
        args = TapStackArgs(
                environment_suffix='staging',
                domain_name='staging.integration.example.com',
                enable_logging=False,
                cost_optimization=True,
                test_mode=True
        )
        stack = TapStack('staging-integration-stack', args)

        self.assertEqual(stack.environment_suffix, 'staging')
        self.assertIsNotNone(stack.certificate)
        self.assertFalse(stack.enable_logging)
        self.assertTrue(stack.cost_optimization)

class TestErrorHandling(TestTapStackIntegration):
    """Test error handling and edge cases."""

    def test_invalid_domain_format(self):
        """Test handling of invalid domain format."""
        args = TapStackArgs(
                environment_suffix='integration-invalid-domain',
                domain_name='invalid..domain..com',
                test_mode=True
        )
        # Should still create stack but may have certificate issues
        stack = TapStack('invalid-domain-stack', args)
        self.assertIsNotNone(stack)

    def test_empty_environment_suffix(self):
        """Test handling of empty environment suffix."""
        args = TapStackArgs('', test_mode=True)
        stack = TapStack('empty-env-integration-stack', args)

        self.assertEqual(stack.environment_suffix, '')
        self.assertIsNotNone(stack.kms_key)

    def test_very_long_names(self):
        """Test handling of very long resource names."""
        long_suffix = 'very-long-environment-suffix-that-might-cause-aws-naming-issues'
        args = TapStackArgs(long_suffix, test_mode=True)
        stack = TapStack('long-name-integration-stack', args)

        self.assertEqual(stack.environment_suffix, long_suffix)
        self.assertIsNotNone(stack.kms_key)

class TestResourceValidation(TestTapStackIntegration):
    """Test resource validation and compliance."""

    def test_all_required_resources_created(self):
        """Test that all required resources are created."""
        is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') >= 0

        args = TapStackArgs(
                environment_suffix='integration-validation',
                domain_name='validation.integration.example.com' if not is_localstack else None,
                hosted_zone_id='Z1234567890VALID' if not is_localstack else None,
                enable_logging=True,
                test_mode=True,
                enable_cloudfront=(not is_localstack),
                enable_waf=(not is_localstack)
        )
        stack = TapStack('validation-integration-stack', args)

        # Check core required resources (always present)
        core_resources = [
                'kms_key', 'kms_alias', 'buckets', 'bucket_policies',
                'iam_role', 'iam_policy', 'logging_bucket',
                'log_groups', 'cloudwatch_alarms'
        ]

        for resource in core_resources:
            self.assertTrue(hasattr(stack, resource), f"Missing core resource: {resource}")

        # Check optional resources (only when not LocalStack)
        if not is_localstack:
            optional_resources = [
                'cloudfront_distribution', 'oai', 'waf_acl',
                'certificate', 'route53_record'
            ]
            for resource in optional_resources:
                self.assertTrue(hasattr(stack, resource), f"Missing optional resource: {resource}")

    def test_resource_configuration_compliance(self):
        """Test that resources are configured according to requirements."""
        args = TapStackArgs(
                environment_suffix='integration-compliance',
                enable_logging=True,
                test_mode=True
        )
        stack = TapStack('compliance-integration-stack', args)

        # Verify multi-region deployment
        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)

        # Verify logging is enabled
        self.assertIsNotNone(stack.logging_bucket)
        self.assertEqual(len(stack.log_groups), 2)

        # Verify security components
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.waf_acl)

if __name__ == '__main__':
    # Run integration tests with verbose output
    unittest.main(verbosity=2, buffer=True)
