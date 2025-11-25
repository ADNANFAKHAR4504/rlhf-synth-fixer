"""Unit tests for SecurityGroupAnalyzer."""

import pytest
from lib.analyzers.security_group_analyzer import SecurityGroupAnalyzer


class TestSecurityGroupAnalyzer:
    """Test cases for SecurityGroupAnalyzer."""

    def test_init(self):
        """Test analyzer initialization."""
        analyzer = SecurityGroupAnalyzer()
        assert analyzer.violations == []

    def test_analyze_empty_stack(self):
        """Test analysis of empty stack."""
        analyzer = SecurityGroupAnalyzer()
        result = analyzer.analyze_synthesized_stack({})
        assert result == []

    def test_analyze_stack_with_unrestricted_ipv4(self):
        """Test detection of 0.0.0.0/0 in security group."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': [{
                            'cidr_blocks': ['0.0.0.0/0'],
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)

        assert len(violations) == 1
        assert violations[0]['severity'] == 'HIGH'
        assert violations[0]['violation_type'] == 'UNRESTRICTED_INGRESS'
        assert '0.0.0.0/0' in violations[0]['details']['cidr']

    def test_analyze_stack_with_unrestricted_ipv6(self):
        """Test detection of ::/0 in security group."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': [{
                            'ipv6_cidr_blocks': ['::/0'],
                            'from_port': 80,
                            'to_port': 80,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)

        assert len(violations) == 1
        assert violations[0]['severity'] == 'HIGH'
        assert violations[0]['violation_type'] == 'UNRESTRICTED_INGRESS_IPV6'

    def test_analyze_stack_with_restricted_cidr(self):
        """Test that restricted CIDRs don't trigger violations."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': [{
                            'cidr_blocks': ['10.0.0.0/8'],
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_analyze_security_group_rule_resource(self):
        """Test analysis of standalone security group rule."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group_rule': {
                    'test_rule': {
                        'type': 'ingress',
                        'cidr_blocks': ['0.0.0.0/0'],
                        'from_port': 443,
                        'to_port': 443,
                        'protocol': 'tcp'
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_analyze_dict_ingress_rules(self):
        """Test analysis when ingress is a dict instead of list."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': {
                            'cidr_blocks': ['0.0.0.0/0'],
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_get_summary(self):
        """Test get_summary method."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': [{
                            'cidr_blocks': ['0.0.0.0/0'],
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        analyzer.analyze_synthesized_stack(synthesized_json)
        summary = analyzer.get_summary()

        assert summary['analyzer'] == 'SecurityGroupAnalyzer'
        assert summary['total_violations'] == 1
        assert summary['high_severity'] == 1
        assert len(summary['violations']) == 1

    def test_multiple_violations(self):
        """Test detection of multiple violations."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg1': {
                        'ingress': [{
                            'cidr_blocks': ['0.0.0.0/0'],
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }]
                    },
                    'test_sg2': {
                        'ingress': [{
                            'ipv6_cidr_blocks': ['::/0'],
                            'from_port': 80,
                            'to_port': 80,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 2

    def test_egress_rules_ignored(self):
        """Test that egress rules are properly handled."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group_rule': {
                    'test_rule': {
                        'type': 'egress',
                        'cidr_blocks': ['0.0.0.0/0'],
                        'from_port': 0,
                        'to_port': 65535,
                        'protocol': '-1'
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_missing_cidr_blocks(self):
        """Test handling of rules without CIDR blocks."""
        analyzer = SecurityGroupAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_security_group': {
                    'test_sg': {
                        'ingress': [{
                            'from_port': 22,
                            'to_port': 22,
                            'protocol': 'tcp'
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0
