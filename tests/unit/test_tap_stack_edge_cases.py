"""
test_tap_stack_edge_cases.py

Edge cases, validation, and integration pattern tests for TapStack.
"""

import unittest
from unittest.mock import Mock, patch
import re


class TestEdgeCasesAndValidation(unittest.TestCase):
    """Test edge cases and input validation."""

    def test_empty_environment_suffix_handling(self):
        """Test handling of empty or whitespace environment suffix."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Test truly empty cases
            empty_cases = ['', None]
            
            for case in empty_cases:
                with self.subTest(case=case):
                    args = TapStackArgs(environment_suffix=case)
                    self.assertEqual(args.environment_suffix, 'dev',
                                   f"Empty case '{case}' should default to 'dev'")
            
            # Test whitespace case (preserves the whitespace as-is)
            args_whitespace = TapStackArgs(environment_suffix='   ')
            self.assertEqual(args_whitespace.environment_suffix, '   ',
                           "Whitespace should be preserved if provided")

    def test_special_character_environment_suffix(self):
        """Test environment suffix with special characters."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Test valid characters
            valid_cases = ['dev-1', 'test_env', 'staging-v2', 'prod-us-east-1']
            
            for case in valid_cases:
                with self.subTest(case=case):
                    args = TapStackArgs(environment_suffix=case)
                    self.assertEqual(args.environment_suffix, case)

    def test_very_long_environment_suffix(self):
        """Test very long environment suffix."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            long_suffix = 'very-long-environment-suffix-that-might-cause-issues-with-aws-resource-naming-limits'
            args = TapStackArgs(environment_suffix=long_suffix)
            self.assertEqual(args.environment_suffix, long_suffix)

    def test_tags_edge_cases(self):
        """Test edge cases for tags parameter."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Empty nested structures
            edge_case_tags = [
                {},
                {'': ''},  # Empty key-value
                {'ValidKey': ''},  # Empty value
                {'': 'ValidValue'},  # Empty key
                {'Key1': 'Value1', 'Key2': ''},  # Mixed
            ]
            
            for tags in edge_case_tags:
                with self.subTest(tags=tags):
                    args = TapStackArgs(tags=tags)
                    self.assertEqual(args.tags, tags)


class TestResourceDependencyPatterns(unittest.TestCase):
    """Test resource dependency and ordering patterns."""

    def test_resource_creation_order_dependencies(self):
        """Test that resources are created in logical dependency order."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Extract method calls from __init__ method
        init_method_match = re.search(r'def __init__\(.*?\n(.*?)def ', source_code, re.DOTALL)
        if init_method_match:
            init_body = init_method_match.group(1)
            
            # Find order of _create_* method calls
            create_calls = re.findall(r'self\.(_create_\w+)\(\)', init_body)
            
            # Expected logical order (dependencies first)
            expected_order = [
                '_create_kms_key',         # First - needed for encryption
                '_create_vpc_endpoints',    # Network setup
                '_create_dynamodb_tables', # Data stores
                '_create_s3_buckets',      # File storage
                '_create_sqs_queues',      # Messaging
                '_create_sns_topics',      # Notifications
                '_create_iam_roles',       # Security (needs to be before Lambda)
                '_create_lambda_functions', # Compute
                '_create_eventbridge_rules', # Event routing
                '_create_step_functions',   # Orchestration
                '_create_cloudwatch_alarms' # Monitoring (last)
            ]
            
            # Check that the actual order matches expected dependencies
            for i in range(len(expected_order) - 1):
                current_method = expected_order[i]
                if current_method in create_calls:
                    current_index = create_calls.index(current_method)
                    for j in range(i + 1, len(expected_order)):
                        later_method = expected_order[j]
                        if later_method in create_calls:
                            later_index = create_calls.index(later_method)
                            with self.subTest(current=current_method, later=later_method):
                                self.assertLess(current_index, later_index,
                                              f"{current_method} should come before {later_method}")
                            break

    def test_cross_service_resource_references(self):
        """Test that resources properly reference each other."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Expected cross-references
        cross_references = [
            ('kms_key', 'arn'),           # KMS key used in other resources
            ('lambda_role', 'arn'),       # IAM role used by Lambda
            ('transaction_queue', 'arn'), # SQS queue referenced in policies
            ('processing_table', 'name'), # DynamoDB table name in env vars
            ('reports_bucket', 'bucket'), # S3 bucket name in env vars
        ]
        
        for resource, property_name in cross_references:
            with self.subTest(resource=resource, property=property_name):
                reference_pattern = f"self\\.{resource}\\.{property_name}"
                matches = re.findall(reference_pattern, source_code)
                self.assertGreaterEqual(len(matches), 1,
                                      f"Resource {resource}.{property_name} should be referenced")


class TestScalabilityPatterns(unittest.TestCase):
    """Test scalability and performance patterns."""

    def test_auto_scaling_configuration_hints(self):
        """Test hints that resources are configured for auto-scaling."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Scalability indicators
        scalability_patterns = [
            'PAY_PER_REQUEST',           # DynamoDB on-demand scaling
            'reserved_concurrent_executions', # Lambda scaling control
            'batch_size',                # SQS batch processing
            'arm64',                     # Graviton for better price/performance
            'intelligent_tiering'        # S3 cost optimization
        ]
        
        for pattern in scalability_patterns:
            with self.subTest(pattern=pattern):
                self.assertIn(pattern, source_code,
                            f"Scalability pattern {pattern} should be present")

    def test_throughput_optimization_patterns(self):
        """Test patterns that optimize for high throughput."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Throughput patterns
        throughput_patterns = [
            'perMessageGroupId',         # FIFO throughput per group
            'batch_size',               # Batch processing
            'visibility_timeout',       # Message processing time
            'memory_size',              # Lambda performance tuning
        ]
        
        throughput_found = 0
        for pattern in throughput_patterns:
            if pattern in source_code:
                throughput_found += 1
        
        self.assertGreaterEqual(throughput_found, 3,
                              "Should have multiple throughput optimization patterns")


class TestDisasterRecoveryPatterns(unittest.TestCase):
    """Test disaster recovery and backup patterns."""

    def test_backup_and_recovery_features(self):
        """Test backup and recovery capabilities."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Backup/recovery patterns
        backup_patterns = [
            'point_in_time_recovery',
            'retention',
            'lifecycle',
            'versioning'  # Check if S3 versioning is mentioned
        ]
        
        backup_features = 0
        for pattern in backup_patterns:
            if pattern in source_code:
                backup_features += 1
        
        self.assertGreaterEqual(backup_features, 2,
                              "Should have multiple backup/recovery features")

    def test_multi_az_readiness_patterns(self):
        """Test patterns that indicate multi-AZ readiness."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Multi-AZ patterns (should NOT have AZ-specific hardcoding)
        az_specific_patterns = ['us-east-1a', 'us-east-1b', 'us-west-2a']
        
        for pattern in az_specific_patterns:
            with self.subTest(pattern=pattern):
                self.assertNotIn(pattern, source_code,
                                f"Should not hardcode AZ: {pattern}")


class TestSecurityHardening(unittest.TestCase):
    """Test security hardening patterns."""

    def test_principle_of_least_privilege_implementation(self):
        """Test implementation of least privilege principle."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Find all IAM policy actions
        action_pattern = r'"Action":\s*\[\s*([^\]]+)\]'
        action_matches = re.findall(action_pattern, source_code)
        
        # Check for overly broad permissions
        broad_permissions = ['"*"', '"s3:*"', '"dynamodb:*"', '"sqs:*"']
        
        for actions in action_matches:
            for broad_perm in broad_permissions:
                with self.subTest(actions=actions, permission=broad_perm):
                    self.assertNotIn(broad_perm, actions,
                                   f"Should avoid broad permission {broad_perm}")

    def test_encryption_at_rest_coverage(self):
        """Test encryption at rest for all data stores."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Data stores that should have encryption
        encryption_patterns = [
            ('dynamodb', 'server_side_encryption'),
            ('s3', 'server_side_encryption'),
            ('sqs', 'kms_master_key_id'),
            ('sns', 'kms_master_key_id'),
        ]
        
        for service, encryption_key in encryption_patterns:
            with self.subTest(service=service, key=encryption_key):
                # Check if service exists and has encryption
                if f'aws.{service}' in source_code:
                    self.assertIn(encryption_key, source_code,
                                f"{service} should have {encryption_key}")

    def test_network_security_patterns(self):
        """Test network security configurations."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Network security patterns
        network_security_patterns = [
            'block_public_acls=True',
            'block_public_policy=True',
            'ignore_public_acls=True',
            'restrict_public_buckets=True',
        ]
        
        for pattern in network_security_patterns:
            with self.subTest(pattern=pattern):
                self.assertIn(pattern, source_code,
                            f"Network security pattern {pattern} should be present")


class TestCostOptimizationPatterns(unittest.TestCase):
    """Test cost optimization patterns."""

    def test_cost_optimization_features(self):
        """Test cost optimization configurations."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Cost optimization patterns
        cost_patterns = [
            'PAY_PER_REQUEST',           # DynamoDB on-demand
            'arm64',                     # Graviton for lower cost
            'intelligent_tiering',       # S3 cost optimization
            'STANDARD_IA',              # S3 infrequent access
            'GLACIER',                  # S3 archival
            'DEEP_ARCHIVE'              # S3 deep archive
        ]
        
        cost_optimizations = 0
        for pattern in cost_patterns:
            if pattern in source_code:
                cost_optimizations += 1
        
        self.assertGreaterEqual(cost_optimizations, 4,
                              "Should have multiple cost optimization patterns")

    def test_resource_right_sizing_hints(self):
        """Test that resources are configured with appropriate sizing."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Right-sizing patterns
        sizing_patterns = [
            'memory_size',              # Lambda memory configuration
            'timeout',                  # Lambda timeout limits
            'reserved_concurrent_executions', # Lambda concurrency limits
            'batch_size',               # SQS batch processing
            'visibility_timeout'        # SQS message processing time
        ]
        
        for pattern in sizing_patterns:
            with self.subTest(pattern=pattern):
                self.assertIn(pattern, source_code,
                            f"Right-sizing pattern {pattern} should be present")


class TestComplianceAndGovernance(unittest.TestCase):
    """Test compliance and governance patterns."""

    def test_audit_trail_completeness(self):
        """Test comprehensive audit trail capabilities."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Audit trail components
        audit_components = [
            'tracing',                  # X-Ray tracing
            'point_in_time_recovery',   # DynamoDB backup
            'enable_key_rotation',      # KMS key rotation
            'retention'                 # Log retention
        ]
        
        for component in audit_components:
            with self.subTest(component=component):
                self.assertIn(component, source_code,
                            f"Audit component {component} should be present")

    def test_data_classification_handling(self):
        """Test data classification and handling patterns."""
        with open('lib/tap_stack.py', 'r') as f:
            source_code = f.read()
        
        # Data protection patterns for financial data
        data_protection_patterns = [
            'kms',                      # Encryption
            'server_side_encryption',   # At-rest encryption
            'block_public',             # Access controls
            'dead_letter'               # Error handling
        ]
        
        protection_features = 0
        for pattern in data_protection_patterns:
            if pattern in source_code:
                protection_features += 1
        
        self.assertGreaterEqual(protection_features, 4,
                              "Should have comprehensive data protection")


if __name__ == '__main__':
    unittest.main()