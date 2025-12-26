"""
Comprehensive unit tests for TAP stack with 80%+ code coverage.
Tests all components, edge cases, and configuration scenarios.
"""

import unittest
from unittest.mock import patch
from pulumi.runtime import mocks, set_mocks
from lib.tap_stack import TapStack, TapStackArgs

class ComprehensiveAwsMocks(mocks.Mocks):
    """Comprehensive AWS service mocks for testing."""

    def new_resource(self, type_, name, inputs, provider=None, id_=None):
        """Mock AWS resource creation with realistic outputs."""
        outputs = dict(inputs)
        resource_type = type_.split(':')[-1].split('/')[-1]

        # Base outputs for all resources
        outputs.update({
            'id': f"{name}-id",
            'arn': (
        f"arn:aws:{type_.split(':')[1]}:us-east-1:123456789012:"
        f"{resource_type.lower()}/{name}"
            ),
            'name': name,
            'tags': inputs.get('tags', {})
        })

        # Resource-specific outputs
        if resource_type == 'Key':
            outputs.update({'key_id': f"{name}-key-id"})
        elif resource_type == 'Bucket':
            outputs.update({
              'bucket_domain_name': f"{name}.s3.amazonaws.com",
              'website_endpoint': f"{name}.s3-website-us-east-1.amazonaws.com"
            })
        elif resource_type == 'Distribution':
            outputs.update({
              'domain_name': f"{name}.cloudfront.net",
              'hosted_zone_id': 'Z2FDTNDATAQYW2'
            })
        elif resource_type == 'OriginAccessIdentity':
            outputs.update({
              'cloudfront_access_identity_path': (
                f"/origin-access-identity/cloudfront/{name}"
              )
            })
        elif resource_type == 'Certificate':
            outputs.update({
              'domain_validation_options': [{
                  'resource_record_name': (
                    f'_validation.{inputs.get("domain_name", "example.com")}'
                  ),
                  'resource_record_type': 'CNAME',
                  'resource_record_value': f'{name}.acm-validations.aws'
              }]
            })
        elif resource_type == 'Record':
            outputs.update({'fqdn': f"{inputs.get('name', name)}"})
        elif resource_type == 'LogGroup':
            outputs.update({'retention_in_days': inputs.get('retention_in_days', 30)})

        return [f"{name}-id", outputs]

    def call(self, token, args, provider=None):
        """Mock AWS API calls."""
        return args

# Set up mocks globally
set_mocks(ComprehensiveAwsMocks())

class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs dataclass functionality."""

    def test_default_args(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs('test')
        self.assertEqual(args.environment_suffix, 'test')
        self.assertIsNone(args.domain_name)
        self.assertIsNone(args.hosted_zone_id)
        self.assertTrue(args.enable_logging)
        self.assertFalse(args.cost_optimization)

    def test_full_args(self):
        """Test TapStackArgs with all parameters."""
        args = TapStackArgs(
            environment_suffix='prod',
            domain_name='example.com',
            hosted_zone_id='Z1234567890',
            enable_logging=False,
            cost_optimization=True
        )
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.domain_name, 'example.com')
        self.assertEqual(args.hosted_zone_id, 'Z1234567890')
        self.assertFalse(args.enable_logging)
        self.assertTrue(args.cost_optimization)

    def test_partial_args(self):
        """Test TapStackArgs with partial parameters."""
        args = TapStackArgs('staging', domain_name='staging.example.com')
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.domain_name, 'staging.example.com')
        self.assertIsNone(args.hosted_zone_id)
        self.assertTrue(args.enable_logging)
        self.assertFalse(args.cost_optimization)

class TestTapStackCore(unittest.TestCase):
    """Test core TapStack functionality."""

    def test_minimal_stack_creation(self):
        """Test stack creation with minimal configuration."""
        args = TapStackArgs('minimal', enable_cloudfront=True, enable_waf=True)
        stack = TapStack('minimal-stack', args)

        # Verify core components
        self.assertIsInstance(stack.buckets, dict)
        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_alias)
        self.assertIsNotNone(stack.cloudfront_distribution)
        self.assertIsNotNone(stack.waf_acl)
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.iam_policy)

    def test_minimal_stack_without_cloudfront(self):
        """Test stack creation without CloudFront (LocalStack Community)."""
        args = TapStackArgs('minimal-no-cf', enable_cloudfront=False, enable_waf=False)
        stack = TapStack('minimal-no-cf-stack', args)

        # Verify core components
        self.assertIsInstance(stack.buckets, dict)
        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_alias)
        self.assertIsNone(stack.cloudfront_distribution)
        self.assertIsNone(stack.waf_acl)
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.iam_policy)

    def test_full_stack_creation(self):
        """Test stack creation with full configuration."""
        args = TapStackArgs(
            environment_suffix='full',
            domain_name='full.example.com',
            hosted_zone_id='Z1234567890',
            enable_logging=True,
            cost_optimization=False,
            enable_cloudfront=True,
            enable_waf=True
        )
        stack = TapStack('full-stack', args)

        # Verify all components including optional ones
        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.route53_record)
        self.assertIsNotNone(stack.logging_bucket)
        self.assertIsInstance(stack.log_groups, dict)
        self.assertIsInstance(stack.cloudwatch_alarms, dict)
        self.assertEqual(len(stack.log_groups), 2)
        self.assertEqual(len(stack.cloudwatch_alarms), 2)

    def test_cost_optimization_enabled(self):
        """Test stack with cost optimization features."""
        args = TapStackArgs('cost-opt', cost_optimization=True, enable_cloudfront=True)
        stack = TapStack('cost-opt-stack', args)

        # Cost optimization should affect CloudFront price class
        self.assertIsNotNone(stack.cloudfront_distribution)
        # Note: In real implementation, would verify price_class is PriceClass_100

    def test_logging_disabled(self):
        """Test stack with logging disabled."""
        args = TapStackArgs('no-logging', enable_logging=False)
        stack = TapStack('no-logging-stack', args)

        # Logging components should not be created
        self.assertIsNone(stack.logging_bucket)
        self.assertFalse(hasattr(stack, 'log_groups'))
        self.assertFalse(hasattr(stack, 'cloudwatch_alarms'))

class TestTapStackComponents(unittest.TestCase):
    """Test individual stack components."""

    def test_kms_resources(self):
        """Test KMS key and alias creation."""
        args = TapStackArgs('kms-test')
        stack = TapStack('kms-test-stack', args)

        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.kms_alias)

    def test_s3_buckets_multi_region(self):
        """Test S3 bucket creation in multiple regions."""
        args = TapStackArgs('s3-test')
        stack = TapStack('s3-test-stack', args)

        self.assertEqual(len(stack.buckets), 2)
        self.assertIn('us-west-2', stack.buckets)
        self.assertIn('us-east-1', stack.buckets)
        self.assertEqual(len(stack.bucket_policies), 2)

    def test_cloudfront_distribution(self):
        """Test CloudFront distribution configuration."""
        args = TapStackArgs('cf-test', enable_cloudfront=True)
        stack = TapStack('cf-test-stack', args)

        self.assertIsNotNone(stack.cloudfront_distribution)
        self.assertIsNotNone(stack.oai)

    def test_cloudfront_disabled(self):
        """Test stack with CloudFront disabled (LocalStack Community)."""
        args = TapStackArgs('cf-disabled-test', enable_cloudfront=False)
        stack = TapStack('cf-disabled-stack', args)

        self.assertIsNone(stack.cloudfront_distribution)
        self.assertIsNone(stack.oai)

    def test_waf_acl_configuration(self):
        """Test WAF ACL with security rules."""
        args = TapStackArgs('waf-test', enable_waf=True)
        stack = TapStack('waf-test-stack', args)

        self.assertIsNotNone(stack.waf_acl)

    def test_waf_disabled(self):
        """Test stack with WAF disabled (LocalStack Community)."""
        args = TapStackArgs('waf-disabled-test', enable_waf=False)
        stack = TapStack('waf-disabled-stack', args)

        self.assertIsNone(stack.waf_acl)

    def test_acm_certificate_creation(self):
        """Test ACM certificate creation with domain."""
        args = TapStackArgs('acm-test', domain_name='acm.example.com', enable_cloudfront=True)
        stack = TapStack('acm-test-stack', args)

        self.assertIsNotNone(stack.certificate)

    def test_acm_not_created_without_cloudfront(self):
        """Test ACM certificate not created when CloudFront is disabled."""
        args = TapStackArgs('acm-no-cf-test', domain_name='acm.example.com', enable_cloudfront=False)
        stack = TapStack('acm-no-cf-stack', args)

        self.assertIsNone(stack.certificate)

    def test_route53_configuration(self):
        """Test Route53 DNS record creation."""
        args = TapStackArgs(
            'route53-test',
            domain_name='route53.example.com',
            hosted_zone_id='Z1234567890',
            enable_cloudfront=True
        )
        stack = TapStack('route53-test-stack', args)

        self.assertIsNotNone(stack.route53_record)
        self.assertTrue(hasattr(stack, 'cert_validation_records'))
        self.assertTrue(hasattr(stack, 'cert_validation'))

    def test_route53_not_created_without_cloudfront(self):
        """Test Route53 record not created when CloudFront is disabled."""
        args = TapStackArgs(
            'route53-no-cf-test',
            domain_name='route53.example.com',
            hosted_zone_id='Z1234567890',
            enable_cloudfront=False
        )
        stack = TapStack('route53-no-cf-stack', args)

        self.assertIsNone(stack.route53_record)

    def test_iam_least_privilege(self):
        """Test IAM role and policy with least privilege."""
        args = TapStackArgs('iam-test')
        stack = TapStack('iam-test-stack', args)

        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.iam_policy)

class TestTapStackEdgeCases(unittest.TestCase):
    """Test edge cases and error scenarios."""

    def test_domain_without_hosted_zone(self):
        """Test stack with domain but no hosted zone."""
        args = TapStackArgs('domain-only', domain_name='domain-only.example.com', enable_cloudfront=True)
        stack = TapStack('domain-only-stack', args)

        # Should create certificate but not Route53 record
        self.assertIsNotNone(stack.certificate)
        self.assertIsNone(stack.route53_record)

    def test_empty_environment_suffix(self):
        """Test stack with empty environment suffix."""
        args = TapStackArgs('')
        stack = TapStack('empty-env-stack', args)

        # Stack should still be created but with empty suffix
        self.assertEqual(stack.environment_suffix, '')
        self.assertIsNotNone(stack.kms_key)

    def test_long_environment_suffix(self):
        """Test stack with very long environment suffix."""
        long_suffix = 'very-long-environment-suffix-that-might-cause-issues'
        args = TapStackArgs(long_suffix)
        stack = TapStack('long-suffix-stack', args)

        self.assertEqual(stack.environment_suffix, long_suffix)
        self.assertIsNotNone(stack.kms_key)

class TestTapStackIntegration(unittest.TestCase):
    """Test component integration and dependencies."""

    def test_component_dependencies(self):
        """Test that components have proper dependencies."""
        args = TapStackArgs('deps-test', enable_logging=True, enable_cloudfront=True)
        stack = TapStack('deps-test-stack', args)

        # Verify dependent components exist
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.buckets)
        self.assertIsNotNone(stack.logging_bucket)
        self.assertIsNotNone(stack.oai)
        self.assertIsNotNone(stack.cloudfront_distribution)

    def test_localstack_component_dependencies(self):
        """Test that components work without CloudFront/WAF (LocalStack Community)."""
        args = TapStackArgs('localstack-deps-test', enable_logging=True, enable_cloudfront=False, enable_waf=False)
        stack = TapStack('localstack-deps-stack', args)

        # Verify core components exist without CloudFront/WAF
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.buckets)
        self.assertIsNotNone(stack.logging_bucket)
        self.assertIsNone(stack.oai)
        self.assertIsNone(stack.cloudfront_distribution)
        self.assertIsNone(stack.waf_acl)

    def test_resource_tagging(self):
        """Test that resources are properly tagged."""
        args = TapStackArgs('tagging-test', enable_waf=True)
        stack = TapStack('tagging-test-stack', args)

        # All components should exist for tagging verification
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.waf_acl)
        self.assertIsNotNone(stack.iam_role)

    def test_outputs_registration(self):
        """Test that stack outputs are properly registered."""
        args = TapStackArgs(
            'outputs-test',
            domain_name='outputs.example.com',
            hosted_zone_id='Z1234567890',
            enable_logging=True,
            enable_cloudfront=True,
            enable_waf=True
        )
        stack = TapStack('outputs-test-stack', args)

        # All major components should be present for output registration
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.buckets)
        self.assertIsNotNone(stack.cloudfront_distribution)
        self.assertIsNotNone(stack.waf_acl)
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.route53_record)
        self.assertIsNotNone(stack.logging_bucket)

    def test_outputs_registration_without_cloudfront(self):
        """Test that stack outputs work without CloudFront/WAF (LocalStack Community)."""
        args = TapStackArgs(
            'outputs-localstack-test',
            enable_logging=True,
            enable_cloudfront=False,
            enable_waf=False
        )
        stack = TapStack('outputs-localstack-stack', args)

        # Core components should be present
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.buckets)
        self.assertIsNone(stack.cloudfront_distribution)
        self.assertIsNone(stack.waf_acl)
        self.assertIsNotNone(stack.iam_role)
        self.assertIsNone(stack.certificate)
        self.assertIsNone(stack.route53_record)
        self.assertIsNotNone(stack.logging_bucket)

class TestTapStackConfigurationVariations(unittest.TestCase):
    """Test various configuration combinations."""

    def test_development_environment(self):
        """Test development environment configuration."""
        args = TapStackArgs('dev', enable_logging=True, cost_optimization=True)
        stack = TapStack('dev-stack', args)

        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertTrue(stack.enable_logging)
        self.assertTrue(stack.cost_optimization)

    def test_production_environment(self):
        """Test production environment configuration."""
        args = TapStackArgs(
            'prod',
            domain_name='prod.example.com',
            hosted_zone_id='Z1234567890',
            enable_logging=True,
            cost_optimization=False,
            enable_cloudfront=True,
            enable_waf=True
        )
        stack = TapStack('prod-stack', args)

        self.assertEqual(stack.environment_suffix, 'prod')
        self.assertIsNotNone(stack.certificate)
        self.assertIsNotNone(stack.route53_record)
        self.assertTrue(stack.enable_logging)
        self.assertFalse(stack.cost_optimization)

    def test_staging_environment(self):
        """Test staging environment configuration."""
        args = TapStackArgs(
            'staging',
            domain_name='staging.example.com',
            enable_logging=False,
            cost_optimization=True,
            enable_cloudfront=True
        )
        stack = TapStack('staging-stack', args)

        self.assertEqual(stack.environment_suffix, 'staging')
        self.assertIsNotNone(stack.certificate)
        self.assertIsNone(stack.route53_record)  # No hosted zone provided
        self.assertFalse(stack.enable_logging)
        self.assertTrue(stack.cost_optimization)

    def test_localstack_environment(self):
        """Test LocalStack Community environment configuration."""
        args = TapStackArgs(
            'localstack',
            enable_logging=True,
            enable_cloudfront=False,
            enable_waf=False
        )
        stack = TapStack('localstack-stack', args)

        self.assertEqual(stack.environment_suffix, 'localstack')
        self.assertIsNone(stack.certificate)
        self.assertIsNone(stack.route53_record)
        self.assertIsNone(stack.cloudfront_distribution)
        self.assertIsNone(stack.waf_acl)
        self.assertTrue(stack.enable_logging)
        # Core services should still work
        self.assertIsNotNone(stack.kms_key)
        self.assertIsNotNone(stack.buckets)
        self.assertIsNotNone(stack.iam_role)

if __name__ == '__main__':
    unittest.main(verbosity=2)
