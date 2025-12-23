"""Comprehensive unit tests for all analyzers and components."""

import json
import pytest
import os
import sys
from lib.analyzers.tag_compliance_validator import TagComplianceValidator
from lib.analyzers.network_analyzer import NetworkAnalyzer
from lib.analyzers.encryption_validator import EncryptionValidator
from lib.analyzers.compliance_reporter import ComplianceReporter
from lib.compliance_runner import ComplianceRunner


class TestTagComplianceValidator:
    """Test cases for TagComplianceValidator."""

    def test_init(self):
        """Test initialization."""
        validator = TagComplianceValidator()
        assert validator.violations == []
        assert TagComplianceValidator.REQUIRED_TAGS == ['Environment', 'Owner', 'CostCenter']

    def test_missing_all_tags(self):
        """Test detection of all missing tags."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {}
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['severity'] == 'MEDIUM'
        assert len(violations[0]['details']['missing_tags']) == 3

    def test_missing_some_tags(self):
        """Test detection of some missing tags."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'tags': {
                            'Environment': 'dev'
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert set(violations[0]['details']['missing_tags']) == {'Owner', 'CostCenter'}

    def test_all_required_tags_present(self):
        """Test no violations when all tags present."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'tags': {
                            'Environment': 'dev',
                            'Owner': 'team',
                            'CostCenter': '12345'
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_tags_all_field(self):
        """Test handling of tags_all field."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'tags_all': {
                            'Environment': 'dev',
                            'Owner': 'team',
                            'CostCenter': '12345'
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_multiple_resource_types(self):
        """Test validation across multiple resource types."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {}
                },
                'aws_instance': {
                    'test_instance': {}
                },
                'aws_lambda_function': {
                    'test_lambda': {}
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 3

    def test_get_summary(self):
        """Test get_summary method."""
        validator = TagComplianceValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {}
                }
            }
        }

        validator.analyze_synthesized_stack(synthesized_json)
        summary = validator.get_summary()

        assert summary['analyzer'] == 'TagComplianceValidator'
        assert summary['total_violations'] == 1
        assert summary['medium_severity'] == 1


class TestNetworkAnalyzer:
    """Test cases for NetworkAnalyzer."""

    def test_init(self):
        """Test initialization."""
        analyzer = NetworkAnalyzer()
        assert analyzer.violations == []
        assert analyzer.vpc_cidrs == {}

    def test_no_vpcs(self):
        """Test analysis with no VPCs."""
        analyzer = NetworkAnalyzer()
        result = analyzer.analyze_synthesized_stack({})
        assert result == []

    def test_non_overlapping_cidrs(self):
        """Test non-overlapping CIDR blocks."""
        analyzer = NetworkAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_vpc': {
                    'vpc1': {'cidr_block': '10.0.0.0/16'},
                    'vpc2': {'cidr_block': '10.1.0.0/16'}
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_overlapping_cidrs(self):
        """Test overlapping CIDR blocks."""
        analyzer = NetworkAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_vpc': {
                    'vpc1': {'cidr_block': '10.0.0.0/16'},
                    'vpc2': {'cidr_block': '10.0.0.0/16'}
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['severity'] == 'CRITICAL'
        assert violations[0]['violation_type'] == 'CIDR_OVERLAP'

    def test_partial_overlap(self):
        """Test partially overlapping CIDR blocks."""
        analyzer = NetworkAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_vpc': {
                    'vpc1': {'cidr_block': '10.0.0.0/16'},
                    'vpc2': {'cidr_block': '10.0.1.0/24'}
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_invalid_cidr(self):
        """Test handling of invalid CIDR blocks."""
        analyzer = NetworkAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_vpc': {
                    'vpc1': {'cidr_block': 'invalid'},
                    'vpc2': {'cidr_block': 'also-invalid'}
                }
            }
        }

        violations = analyzer.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_validate_multi_environment(self):
        """Test multi-environment CIDR validation."""
        analyzer = NetworkAnalyzer()
        environments = [
            {'name': 'dev', 'vpc_cidrs': ['10.0.0.0/16']},
            {'name': 'prod', 'vpc_cidrs': ['10.0.0.0/16']}
        ]

        violations = analyzer.validate_multi_environment(environments)
        assert len(violations) == 1
        assert violations[0]['violation_type'] == 'CROSS_ENVIRONMENT_CIDR_OVERLAP'

    def test_get_summary(self):
        """Test get_summary method."""
        analyzer = NetworkAnalyzer()
        synthesized_json = {
            'resource': {
                'aws_vpc': {
                    'vpc1': {'cidr_block': '10.0.0.0/16'},
                    'vpc2': {'cidr_block': '10.0.0.0/16'}
                }
            }
        }

        analyzer.analyze_synthesized_stack(synthesized_json)
        summary = analyzer.get_summary()

        assert summary['analyzer'] == 'NetworkAnalyzer'
        assert summary['total_violations'] == 1
        assert summary['vpc_count'] == 2


class TestEncryptionValidator:
    """Test cases for EncryptionValidator."""

    def test_init(self):
        """Test initialization."""
        validator = EncryptionValidator()
        assert validator.violations == []

    def test_s3_bucket_without_encryption(self):
        """Test detection of S3 bucket without encryption."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {}
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['severity'] == 'HIGH'
        assert violations[0]['violation_type'] == 'MISSING_ENCRYPTION'

    def test_s3_bucket_with_aes256_encryption(self):
        """Test S3 bucket with valid AES256 encryption."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': {
                                'apply_server_side_encryption_by_default': {
                                    'sse_algorithm': 'AES256'
                                }
                            }
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_s3_bucket_with_kms_encryption(self):
        """Test S3 bucket with valid KMS encryption."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': {
                                'apply_server_side_encryption_by_default': {
                                    'sse_algorithm': 'aws:kms'
                                }
                            }
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_s3_bucket_with_invalid_encryption(self):
        """Test S3 bucket with invalid encryption algorithm."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': {
                                'apply_server_side_encryption_by_default': {
                                    'sse_algorithm': 'invalid'
                                }
                            }
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_rds_instance_without_encryption(self):
        """Test RDS instance without encryption."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_db_instance': {
                    'test_db': {
                        'storage_encrypted': False
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1
        assert violations[0]['violation_type'] == 'RDS_ENCRYPTION_DISABLED'

    def test_rds_instance_with_encryption(self):
        """Test RDS instance with encryption enabled."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_db_instance': {
                    'test_db': {
                        'storage_encrypted': True
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_rds_cluster_encryption(self):
        """Test RDS cluster encryption validation."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_rds_cluster': {
                    'test_cluster': {
                        'storage_encrypted': False
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 1

    def test_encryption_rule_list(self):
        """Test S3 encryption with rule as list."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {
                        'server_side_encryption_configuration': {
                            'rule': [{
                                'apply_server_side_encryption_by_default': {
                                    'sse_algorithm': 'AES256'
                                }
                            }]
                        }
                    }
                }
            }
        }

        violations = validator.analyze_synthesized_stack(synthesized_json)
        assert len(violations) == 0

    def test_get_summary(self):
        """Test get_summary method."""
        validator = EncryptionValidator()
        synthesized_json = {
            'resource': {
                'aws_s3_bucket': {
                    'test_bucket': {}
                }
            }
        }

        validator.analyze_synthesized_stack(synthesized_json)
        summary = validator.get_summary()

        assert summary['analyzer'] == 'EncryptionValidator'
        assert summary['total_violations'] == 1
        assert summary['high_severity'] == 1


class TestComplianceReporter:
    """Test cases for ComplianceReporter."""

    def test_init(self):
        """Test initialization."""
        reporter = ComplianceReporter()
        assert reporter.report == {}

    def test_generate_report_no_violations(self):
        """Test report generation with no violations."""
        reporter = ComplianceReporter()
        report = reporter.generate_report([], [], [], [], [])

        assert report['summary']['status'] == 'PASS'
        assert report['summary']['total_violations'] == 0
        assert report['summary']['compliance_score'] == 100.0

    def test_generate_report_with_violations(self):
        """Test report generation with violations."""
        reporter = ComplianceReporter()
        violations = [{'severity': 'CRITICAL'}]

        report = reporter.generate_report(violations, [], [], [], [])

        assert report['summary']['status'] == 'FAIL'
        assert report['summary']['total_violations'] == 1
        assert report['summary']['compliance_score'] == 80.0

    def test_compliance_score_calculation(self):
        """Test compliance score calculation."""
        reporter = ComplianceReporter()

        # Test with different severity levels
        score = reporter._calculate_compliance_score(1, 1, 1)
        assert score == 65.0  # 100 - 20 - 10 - 5

        # Test minimum score
        score = reporter._calculate_compliance_score(10, 10, 10)
        assert score == 0.0

    def test_recommendations_generation(self):
        """Test recommendations generation."""
        reporter = ComplianceReporter()
        violations = [
            {'severity': 'CRITICAL', 'violation_type': 'WILDCARD_PERMISSIONS'},
            {'severity': 'HIGH', 'violation_type': 'UNRESTRICTED_INGRESS'},
            {'severity': 'MEDIUM', 'violation_type': 'MISSING_REQUIRED_TAGS'}
        ]

        report = reporter.generate_report(violations, [], [], [], [])
        recommendations = report['recommendations']

        assert len(recommendations) >= 3
        assert any(r['priority'] == 'IMMEDIATE' for r in recommendations)
        assert any(r['priority'] == 'HIGH' for r in recommendations)
        assert any(r['priority'] == 'MEDIUM' for r in recommendations)

    def test_get_exit_code_pass(self):
        """Test exit code for passing compliance."""
        reporter = ComplianceReporter()
        reporter.generate_report([], [], [], [], [])

        assert reporter.get_exit_code() == 0

    def test_get_exit_code_fail(self):
        """Test exit code for failing compliance."""
        reporter = ComplianceReporter()
        reporter.generate_report([{'severity': 'HIGH'}], [], [], [], [])

        assert reporter.get_exit_code() == 1

    def test_save_report(self, tmp_path):
        """Test saving report to file."""
        reporter = ComplianceReporter()
        reporter.generate_report([], [], [], [], [])

        output_file = tmp_path / "report.json"
        reporter.save_report(str(output_file))

        assert output_file.exists()
        with open(output_file, 'r') as f:
            saved_report = json.load(f)
        assert saved_report['summary']['status'] == 'PASS'


class TestComplianceRunner:
    """Test cases for ComplianceRunner."""

    def test_init(self):
        """Test initialization."""
        runner = ComplianceRunner('/path/to/stack.json')
        assert runner.synthesized_stack_path == '/path/to/stack.json'
        assert runner.synthesized_json is None

    def test_load_synthesized_stack_not_found(self):
        """Test loading non-existent stack file."""
        runner = ComplianceRunner('/nonexistent/path.json')
        result = runner.load_synthesized_stack()
        assert result is False

    def test_load_synthesized_stack_success(self, tmp_path):
        """Test loading valid stack file."""
        stack_file = tmp_path / "stack.json"
        stack_file.write_text('{"resource": {}}')

        runner = ComplianceRunner(str(stack_file))
        result = runner.load_synthesized_stack()

        assert result is True
        assert runner.synthesized_json == {"resource": {}}

    def test_load_invalid_json(self, tmp_path):
        """Test loading invalid JSON file."""
        stack_file = tmp_path / "stack.json"
        stack_file.write_text('invalid json')

        runner = ComplianceRunner(str(stack_file))
        result = runner.load_synthesized_stack()

        assert result is False

    def test_run_analysis(self, tmp_path):
        """Test running complete analysis."""
        stack_file = tmp_path / "stack.json"
        stack_content = {
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
        stack_file.write_text(json.dumps(stack_content))

        runner = ComplianceRunner(str(stack_file))
        report = runner.run_analysis()

        assert report is not None
        assert 'summary' in report
        assert report['summary']['status'] == 'FAIL'
        assert report['summary']['total_violations'] > 0
