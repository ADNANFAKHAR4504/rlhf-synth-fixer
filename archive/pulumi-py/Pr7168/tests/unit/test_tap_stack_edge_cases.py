"""
test_tap_stack_edge_cases.py

Edge cases, validation, and integration pattern tests for TapStack.
"""

import unittest
from unittest.mock import Mock, patch
import re
from tests.unit.test_constants import (
    DEFAULT_ENVIRONMENT,
    EMPTY_STRING_CASES,
    WHITESPACE_SUFFIX,
    SPECIAL_CHAR_ENVIRONMENTS,
    VERY_LONG_SUFFIX,
    EDGE_CASE_TAGS,
    RESOURCE_CREATION_ORDER,
    CROSS_REFERENCES,
    SCALABILITY_PATTERNS,
    THROUGHPUT_PATTERNS,
    THROUGHPUT_MIN_PATTERNS,
    BACKUP_PATTERNS,
    BACKUP_MIN_FEATURES,
    HARDCODED_AZ_PATTERNS,
    BROAD_IAM_PERMISSIONS,
    ENCRYPTION_PATTERNS,
    NETWORK_SECURITY_PATTERNS,
    COST_PATTERNS,
    COST_MIN_OPTIMIZATIONS,
    SIZING_PATTERNS,
    AUDIT_COMPONENTS,
    DATA_PROTECTION_PATTERNS,
    DATA_PROTECTION_MIN_FEATURES,
    DLQ_PATTERNS,
    RETRY_PATTERNS,
    RETRY_MIN_PATTERNS,
    ALARM_PATTERNS,
    FINANCIAL_AUDIT_PATTERNS,
    FINANCIAL_AUDIT_MIN_FEATURES,
    RETENTION_PATTERNS,
    RETENTION_MIN_PATTERNS,
    ORDERING_PATTERNS,
    TAP_STACK_FILE_PATH,
)


class TestEdgeCasesAndValidation(unittest.TestCase):
    """Test edge cases and input validation."""

    def test_empty_environment_suffix_handling(self):
        """Test handling of empty or whitespace environment suffix."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Test truly empty cases
            empty_cases = EMPTY_STRING_CASES
            
            for case in empty_cases:
                with self.subTest(case=case):
                    args = TapStackArgs(environment_suffix=case)
                    self.assertEqual(args.environment_suffix, DEFAULT_ENVIRONMENT,
                                   f"Empty case '{case}' should default to '{DEFAULT_ENVIRONMENT}'")
            
            # Test whitespace case (preserves the whitespace as-is)
            args_whitespace = TapStackArgs(environment_suffix=WHITESPACE_SUFFIX)
            self.assertEqual(args_whitespace.environment_suffix, WHITESPACE_SUFFIX,
                           "Whitespace should be preserved if provided")

    def test_special_character_environment_suffix(self):
        """Test environment suffix with special characters."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Test valid characters
            valid_cases = SPECIAL_CHAR_ENVIRONMENTS
            
            for case in valid_cases:
                with self.subTest(case=case):
                    args = TapStackArgs(environment_suffix=case)
                    self.assertEqual(args.environment_suffix, case)

    def test_very_long_environment_suffix(self):
        """Test very long environment suffix."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            long_suffix = VERY_LONG_SUFFIX
            args = TapStackArgs(environment_suffix=long_suffix)
            self.assertEqual(args.environment_suffix, long_suffix)

    def test_tags_edge_cases(self):
        """Test edge cases for tags parameter."""
        with patch.dict('sys.modules', {'pulumi_aws': Mock(), 'pulumi': Mock()}):
            from lib.tap_stack import TapStackArgs
            
            # Empty nested structures
            edge_case_tags = EDGE_CASE_TAGS
            
            for tags in edge_case_tags:
                with self.subTest(tags=tags):
                    args = TapStackArgs(tags=tags)
                    self.assertEqual(args.tags, tags)


class TestResourceDependencyPatterns(unittest.TestCase):
    """Test resource dependency and ordering patterns."""

    def test_resource_creation_order_dependencies(self):
        """Test that resources are created in logical dependency order."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Extract method calls from __init__ method
        init_method_match = re.search(r'def __init__\(.*?\n(.*?)def ', source_code, re.DOTALL)
        if init_method_match:
            init_body = init_method_match.group(1)
            
            # Find order of _create_* method calls
            create_calls = re.findall(r'self\.(_create_\w+)\(\)', init_body)
            
            # Expected logical order (dependencies first)
            expected_order = RESOURCE_CREATION_ORDER
            
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
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Expected cross-references
        cross_references = CROSS_REFERENCES
        
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
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Scalability indicators
        scalability_patterns = SCALABILITY_PATTERNS
        
        for pattern in scalability_patterns:
            with self.subTest(pattern=pattern):
                self.assertIn(pattern, source_code,
                            f"Scalability pattern {pattern} should be present")

    def test_throughput_optimization_patterns(self):
        """Test patterns that optimize for high throughput."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Throughput patterns
        throughput_patterns = THROUGHPUT_PATTERNS
        
        throughput_found = 0
        for pattern in throughput_patterns:
            if pattern in source_code:
                throughput_found += 1
        
        self.assertGreaterEqual(throughput_found, THROUGHPUT_MIN_PATTERNS,
                              "Should have multiple throughput optimization patterns")


class TestDisasterRecoveryPatterns(unittest.TestCase):
    """Test disaster recovery and backup patterns."""

    def test_backup_and_recovery_features(self):
        """Test backup and recovery capabilities."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Backup/recovery patterns
        backup_patterns = BACKUP_PATTERNS
        
        backup_features = 0
        for pattern in backup_patterns:
            if pattern in source_code:
                backup_features += 1
        
        self.assertGreaterEqual(backup_features, BACKUP_MIN_FEATURES,
                              "Should have multiple backup/recovery features")

    def test_multi_az_readiness_patterns(self):
        """Test patterns that indicate multi-AZ readiness."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Multi-AZ patterns (should NOT have AZ-specific hardcoding)
        az_specific_patterns = HARDCODED_AZ_PATTERNS
        
        for pattern in az_specific_patterns:
            with self.subTest(pattern=pattern):
                self.assertNotIn(pattern, source_code,
                                f"Should not hardcode AZ: {pattern}")


class TestSecurityHardening(unittest.TestCase):
    """Test security hardening patterns."""

    def test_principle_of_least_privilege_implementation(self):
        """Test implementation of least privilege principle."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Find all IAM policy actions
        action_pattern = r'"Action":\s*\[\s*([^\]]+)\]'
        action_matches = re.findall(action_pattern, source_code)
        
        # Check for overly broad permissions
        broad_permissions = BROAD_IAM_PERMISSIONS
        
        for actions in action_matches:
            for broad_perm in broad_permissions:
                with self.subTest(actions=actions, permission=broad_perm):
                    self.assertNotIn(broad_perm, actions,
                                   f"Should avoid broad permission {broad_perm}")

    def test_encryption_at_rest_coverage(self):
        """Test encryption at rest for all data stores."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Data stores that should have encryption
        encryption_patterns = ENCRYPTION_PATTERNS
        
        for service, encryption_key in encryption_patterns:
            with self.subTest(service=service, key=encryption_key):
                # Check if service exists and has encryption
                if f'aws.{service}' in source_code:
                    self.assertIn(encryption_key, source_code,
                                f"{service} should have {encryption_key}")

    def test_network_security_patterns(self):
        """Test network security configurations."""
        with open(TAP_STACK_FILE_PATH, 'r') as f:
            source_code = f.read()
        
        # Network security patterns
        network_security_patterns = NETWORK_SECURITY_PATTERNS
        
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