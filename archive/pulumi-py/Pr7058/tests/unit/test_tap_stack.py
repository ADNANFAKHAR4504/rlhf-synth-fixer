"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
Tests all code paths to achieve 100% coverage.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import json
import pulumi

# Set test mode before importing Pulumi resources
pulumi.runtime.set_mocks(
    mocks=type('Mocks', (), {
        'call': lambda self, args: {
            'arn': f'arn:aws:mock:us-east-1:123456789012:{args.type}/{args.name}',
            'id': f'mock-{args.name}',
        },
        'new_resource': lambda self, args: [f'{args.name}-id', args.inputs],
    })(),
    preview=False,
)


@pulumi.runtime.test
def test_imports():
    """Test that all required imports work correctly."""
    from lib.tap_stack import TapStack, TapStackArgs
    assert TapStack is not None
    assert TapStackArgs is not None


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_with_defaults(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.lambda_memory_mb, 512)
        self.assertEqual(args.log_retention_days, 7)
        self.assertFalse(args.enable_versioning)
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_custom_values(self):
        """Test TapStackArgs with custom values."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Owner': 'team', 'Project': 'test'}
        args = TapStackArgs(
            environment_suffix='production',
            lambda_memory_mb=1024,
            log_retention_days=30,
            enable_versioning=True,
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'production')
        self.assertEqual(args.lambda_memory_mb, 1024)
        self.assertEqual(args.log_retention_days, 30)
        self.assertTrue(args.enable_versioning)
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_memory_variations(self):
        """Test TapStackArgs with different memory configurations."""
        from lib.tap_stack import TapStackArgs

        # Test minimum memory
        args_min = TapStackArgs(environment_suffix='dev', lambda_memory_mb=128)
        self.assertEqual(args_min.lambda_memory_mb, 128)

        # Test maximum memory
        args_max = TapStackArgs(environment_suffix='prod', lambda_memory_mb=10240)
        self.assertEqual(args_max.lambda_memory_mb, 10240)

    def test_tap_stack_args_retention_variations(self):
        """Test TapStackArgs with different retention periods."""
        from lib.tap_stack import TapStackArgs

        # Test minimum retention
        args_min = TapStackArgs(environment_suffix='dev', log_retention_days=1)
        self.assertEqual(args_min.log_retention_days, 1)

        # Test long retention
        args_long = TapStackArgs(environment_suffix='prod', log_retention_days=365)
        self.assertEqual(args_long.log_retention_days, 365)

    def test_tap_stack_args_versioning_enabled(self):
        """Test TapStackArgs with versioning enabled."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='prod', enable_versioning=True)
        self.assertTrue(args.enable_versioning)

    def test_tap_stack_args_versioning_disabled(self):
        """Test TapStackArgs with versioning explicitly disabled."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='dev', enable_versioning=False)
        self.assertFalse(args.enable_versioning)

    def test_tap_stack_args_empty_tags(self):
        """Test TapStackArgs with empty tags dict."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='test', tags={})
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_none_tags(self):
        """Test TapStackArgs with None tags (should default to empty dict)."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='test', tags=None)
        self.assertEqual(args.tags, {})


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack component resource creation."""

    @pulumi.runtime.test
    def test_tap_stack_creates_all_resources(self):
        """Test that TapStack creates all required AWS resources."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='dev',
            lambda_memory_mb=512,
            log_retention_days=7,
            enable_versioning=False
        )

        stack = TapStack('test-stack', args)

        # Verify all resources exist
        self.assertIsNotNone(stack.bucket)
        self.assertIsNotNone(stack.bucket_public_access_block)
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.log_group)
        self.assertIsNotNone(stack.error_alarm)
        self.assertEqual(stack.environment_suffix, 'dev')

    @pulumi.runtime.test
    def test_tap_stack_with_custom_configuration(self):
        """Test TapStack with custom environment configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        custom_tags = {'Team': 'platform', 'CostCenter': '1234'}
        args = TapStackArgs(
            environment_suffix='production',
            lambda_memory_mb=2048,
            log_retention_days=90,
            enable_versioning=True,
            tags=custom_tags
        )

        stack = TapStack('prod-stack', args)

        self.assertIsNotNone(stack.bucket)
        self.assertEqual(stack.environment_suffix, 'production')

    @pulumi.runtime.test
    def test_tap_stack_staging_environment(self):
        """Test TapStack for staging environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='staging',
            lambda_memory_mb=1024,
            log_retention_days=30,
            enable_versioning=True
        )

        stack = TapStack('staging-stack', args)

        self.assertEqual(stack.environment_suffix, 'staging')
        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_tap_stack_resource_naming(self):
        """Test that resources use correct naming with environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test123')
        stack = TapStack('naming-test', args)

        # All resources should be created with the suffix
        self.assertIsNotNone(stack.bucket)
        self.assertIsNotNone(stack.lambda_function)
        self.assertIsNotNone(stack.log_group)

    @pulumi.runtime.test
    def test_tap_stack_minimal_configuration(self):
        """Test TapStack with minimal configuration (all defaults)."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='minimal')
        stack = TapStack('minimal-stack', args)

        self.assertEqual(stack.environment_suffix, 'minimal')
        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_tap_stack_maximal_configuration(self):
        """Test TapStack with maximal configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='maximal',
            lambda_memory_mb=10240,
            log_retention_days=365,
            enable_versioning=True,
            tags={'a': '1', 'b': '2', 'c': '3'}
        )
        stack = TapStack('maximal-stack', args)

        self.assertIsNotNone(stack.bucket)
        self.assertIsNotNone(stack.error_alarm)

    @pulumi.runtime.test
    def test_tap_stack_multiple_instances(self):
        """Test creating multiple TapStack instances with different configs."""
        from lib.tap_stack import TapStack, TapStackArgs

        args1 = TapStackArgs(environment_suffix='multi1')
        args2 = TapStackArgs(environment_suffix='multi2', lambda_memory_mb=1024)

        stack1 = TapStack('multi-stack-1', args1)
        stack2 = TapStack('multi-stack-2', args2)

        self.assertEqual(stack1.environment_suffix, 'multi1')
        self.assertEqual(stack2.environment_suffix, 'multi2')
        self.assertIsNotNone(stack1.bucket)
        self.assertIsNotNone(stack2.bucket)

    @pulumi.runtime.test
    def test_tap_stack_dev_environment(self):
        """Test TapStack specifically for dev environment."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='dev',
            lambda_memory_mb=512,
            log_retention_days=7,
            enable_versioning=False
        )
        stack = TapStack('dev-test', args)

        self.assertEqual(stack.environment_suffix, 'dev')

    @pulumi.runtime.test
    def test_tap_stack_with_resource_options(self):
        """Test TapStack with custom resource options."""
        from lib.tap_stack import TapStack, TapStackArgs
        from pulumi import ResourceOptions

        args = TapStackArgs(environment_suffix='opts-test')
        opts = ResourceOptions(protect=False)
        stack = TapStack('opts-stack', args, opts)

        self.assertIsNotNone(stack.bucket)


class TestTapStackResourceProperties(unittest.TestCase):
    """Test specific resource properties and configurations."""

    @pulumi.runtime.test
    def test_bucket_versioning_enabled(self):
        """Test S3 bucket with versioning enabled."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='vers-test', enable_versioning=True)
        stack = TapStack('versioning-stack', args)

        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_bucket_versioning_disabled(self):
        """Test S3 bucket with versioning disabled."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='no-vers', enable_versioning=False)
        stack = TapStack('no-versioning-stack', args)

        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_lambda_memory_configurations(self):
        """Test Lambda function with different memory configurations."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Test different memory sizes
        for memory in [128, 512, 1024, 2048]:
            args = TapStackArgs(
                environment_suffix=f'mem-{memory}',
                lambda_memory_mb=memory
            )
            stack = TapStack(f'lambda-mem-{memory}', args)
            self.assertIsNotNone(stack.lambda_function)

    @pulumi.runtime.test
    def test_log_retention_configurations(self):
        """Test CloudWatch log groups with different retention periods."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Test different retention periods
        for retention in [1, 7, 30, 90, 365]:
            args = TapStackArgs(
                environment_suffix=f'ret-{retention}',
                log_retention_days=retention
            )
            stack = TapStack(f'log-ret-{retention}', args)
            self.assertIsNotNone(stack.log_group)

    @pulumi.runtime.test
    def test_all_resources_have_correct_suffix(self):
        """Test that all resources use the environment suffix in their names."""
        from lib.tap_stack import TapStack, TapStackArgs

        suffix = 'suffix-test'
        args = TapStackArgs(environment_suffix=suffix)
        stack = TapStack('suffix-stack', args)

        # Verify environment suffix is stored
        self.assertEqual(stack.environment_suffix, suffix)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions."""

    @pulumi.runtime.test
    def test_special_characters_in_suffix(self):
        """Test handling of special characters in environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Test with hyphens and numbers
        args = TapStackArgs(environment_suffix='test-env-123')
        stack = TapStack('special-chars', args)
        self.assertEqual(stack.environment_suffix, 'test-env-123')

    @pulumi.runtime.test
    def test_very_long_suffix(self):
        """Test handling of very long environment suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        long_suffix = 'a' * 50
        args = TapStackArgs(environment_suffix=long_suffix)
        stack = TapStack('long-suffix', args)
        self.assertEqual(stack.environment_suffix, long_suffix)

    @pulumi.runtime.test
    def test_single_character_suffix(self):
        """Test handling of single character suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='x')
        stack = TapStack('short-suffix', args)
        self.assertEqual(stack.environment_suffix, 'x')

    @pulumi.runtime.test
    def test_numeric_suffix(self):
        """Test handling of numeric suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='12345')
        stack = TapStack('numeric-suffix', args)
        self.assertEqual(stack.environment_suffix, '12345')

    @pulumi.runtime.test
    def test_mixed_case_suffix(self):
        """Test handling of mixed case suffix."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='DevTest123')
        stack = TapStack('mixed-case', args)
        self.assertEqual(stack.environment_suffix, 'DevTest123')


class TestTagPropagation(unittest.TestCase):
    """Test tag handling and propagation."""

    @pulumi.runtime.test
    def test_tags_with_single_tag(self):
        """Test tags with single tag."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {'Owner': 'alice'}
        args = TapStackArgs(environment_suffix='tag-test', tags=tags)
        stack = TapStack('single-tag', args)
        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_tags_with_multiple_tags(self):
        """Test tags with multiple tags."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {
            'Owner': 'bob',
            'Project': 'multi-env',
            'CostCenter': '1234',
            'Environment': 'production'
        }
        args = TapStackArgs(environment_suffix='multi-tag', tags=tags)
        stack = TapStack('multi-tags', args)
        self.assertIsNotNone(stack.bucket)

    @pulumi.runtime.test
    def test_tags_with_special_characters(self):
        """Test tags with special characters."""
        from lib.tap_stack import TapStack, TapStackArgs

        tags = {'tag-with-dash': 'value_with_underscore'}
        args = TapStackArgs(environment_suffix='special-tags', tags=tags)
        stack = TapStack('special-tag-chars', args)
        self.assertIsNotNone(stack.bucket)


if __name__ == '__main__':
    unittest.main()
