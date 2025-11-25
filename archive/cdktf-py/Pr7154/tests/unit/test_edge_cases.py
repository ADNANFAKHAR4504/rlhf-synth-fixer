"""Edge case tests for 100% coverage."""

import json
import pytest
from lib.analyzers.iam_policy_analyzer import IamPolicyAnalyzer
from lib.analyzers.encryption_validator import EncryptionValidator


class TestIamPolicyAnalyzerEdgeCases:
    """Edge case tests for IAM Policy Analyzer."""

    def test_policy_string_as_dict(self):
        """Test handling of policy as dict instead of string."""
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
                        'policy': policy_doc  # Dict instead of string
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_policy_empty_string(self):
        """Test handling of empty policy string."""
        analyzer = IamPolicyAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_iam_policy': {
                    'test_policy': {
                        'policy': ''
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_statement_not_list(self):
        """Test handling of single statement as dict."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': {  # Single statement as dict
                'Effect': 'Allow',
                'Action': '*',
                'Resource': '*'
            }
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

    def test_action_and_resource_as_strings(self):
        """Test handling of Action and Resource as strings not lists."""
        analyzer = IamPolicyAnalyzer()
        policy_doc = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:*',  # String not list
                'Resource': '*'    # String not list
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

    def test_inline_policies_empty(self):
        """Test handling of empty inline policies."""
        analyzer = IamPolicyAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_iam_role': {
                    'test_role': {
                        'inline_policy': []
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_inline_policy_without_policy_key(self):
        """Test handling of inline policy without policy key."""
        analyzer = IamPolicyAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_iam_role': {
                    'test_role': {
                        'inline_policy': [
                            {'name': 'policy1'}  # No 'policy' key
                        ]
                    }
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0


class TestEncryptionValidatorEdgeCases:
    """Edge case tests for Encryption Validator."""

    def test_rds_encryption_string_true(self):
        """Test RDS encryption with string 'true'."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_db_instance': {
                    'test_db': {
                        'storage_encrypted': 'true'  # String instead of boolean
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_rds_encryption_string_false(self):
        """Test RDS encryption with string 'false'."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_db_instance': {
                    'test_db': {
                        'storage_encrypted': 'false'  # String 'false'
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_rds_encryption_string_invalid(self):
        """Test RDS encryption with invalid string."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_db_instance': {
                    'test_db': {
                        'storage_encrypted': 'invalid'  # Invalid string
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_rds_cluster_string_encryption(self):
        """Test RDS cluster with string encryption value."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_rds_cluster': {
                    'test_cluster': {
                        'storage_encrypted': 'TRUE'  # Uppercase string
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        # Should pass because 'TRUE' is truthy
        assert len(violations) == 0

    def test_s3_encryption_config_missing_rule_key(self):
        """Test S3 encryption without rule key."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {}  # No 'rule' key
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_s3_encryption_rule_empty(self):
        """Test S3 encryption with empty rule list."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': []
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_s3_encryption_rule_missing_sse_algorithm(self):
        """Test S3 encryption rule without sse_algorithm."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': {
                                'apply_server_side_encryption_by_default': {}
                            }
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
