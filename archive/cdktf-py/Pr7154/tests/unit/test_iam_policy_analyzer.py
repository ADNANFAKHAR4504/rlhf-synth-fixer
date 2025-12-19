"""Unit tests for IamPolicyAnalyzer."""

import json
import pytest
from lib.analyzers.iam_policy_analyzer import IamPolicyAnalyzer


class TestIamPolicyAnalyzer:
    """Test cases for IamPolicyAnalyzer."""

    def test_init(self):
        """Test analyzer initialization."""
        analyzer = IamPolicyAnalyzer()
        assert analyzer.violations == []

    def test_analyze_empty_stack(self):
        """Test analysis of empty stack."""
        analyzer = IamPolicyAnalyzer()
        result = analyzer.analyze_synthesized_stack({})
        assert result == []

    def test_wildcard_actions_and_resources(self):
        """Test detection of wildcard actions and resources."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['severity'] == 'CRITICAL'
        assert violations[0]['violation_type'] == 'WILDCARD_PERMISSIONS'

    def test_wildcard_actions_only(self):
        """Test detection of wildcard actions with specific resources."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:*',
                'Resource': 'arn:aws:s3:::my-bucket/*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['severity'] == 'HIGH'
        assert violations[0]['violation_type'] == 'WILDCARD_ACTIONS'

    def test_wildcard_resources_only(self):
        """Test detection of wildcard resources with wildcard actions."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:Get*',
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        # This is actually CRITICAL because both have wildcards
        assert violations[0]['severity'] == 'CRITICAL'
        assert violations[0]['violation_type'] == 'WILDCARD_PERMISSIONS'

    def test_specific_permissions(self):
        """Test that specific permissions don't trigger violations."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:GetObject',
                'Resource': 'arn:aws:s3:::my-bucket/*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_deny_statements_ignored(self):
        """Test that Deny statements are not analyzed."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Deny',
                'Action': '*',
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_inline_policies_in_roles(self):
        """Test analysis of inline policies in IAM roles."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_role': {
                    'test_role': {
                        'inline_policy': [{
                            'name': 'inline_policy',
                            'policy': policy_doc
                        }]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_action_list(self):
        """Test handling of actions as list."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': ['s3:*', 'ec2:*'],
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_invalid_json_policy(self):
        """Test handling of invalid JSON policy."""
        analyzer = IamPolicyAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': 'invalid json'
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_get_summary(self):
        """Test get_summary method."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': json.dumps(policy_doc)
                    }
                }
            }
        }

        analyzer.analyze_synthesized_stack(synthesized_json)
        summary = analyzer.get_summary()

        assert summary['analyzer'] == 'IamPolicyAnalyzer'
        assert summary['total_violations'] == 1
        assert summary['critical_severity'] == 1

    def test_role_policy_resource_types(self):
        """Test various IAM policy resource types."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }]
        }

        for resource_type in ['aws_iam_role_policy', 'aws_iam_user_policy', 'aws_iam_group_policy']:
            synthesized_json = {
                'resource': {
                    resource_type: {
                        'test_policy': {
                            'policy': json.dumps(policy_doc)
                        }
                    }
                }
            }

            violations = analyzer.analyze_synthesized_stack(synthesized_json)
            assert len(violations) == 1
