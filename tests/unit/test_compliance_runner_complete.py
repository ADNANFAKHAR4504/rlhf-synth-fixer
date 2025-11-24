"""Additional tests for ComplianceRunner to achieve 100% coverage."""

import json
import os
import sys
import pytest
from lib.compliance_runner import ComplianceRunner, main


class TestComplianceRunnerComplete:
    """Additional test cases for ComplianceRunner complete coverage."""

    def test_run_analysis_prints_progress(self, tmp_path, capsys):
        """Test that analysis prints progress messages."""
        stack_file = tmp_path / "stack.json"
        stack_content = {
            'resource': {
                'aws_s3_bucket': {'bucket': {}}
            }
        }
        stack_file.write_text(json.dumps(stack_content))

        runner = ComplianceRunner(str(stack_file))
        report = runner.run_analysis()

        captured = capsys.readouterr()
        assert "Running infrastructure compliance analysis..." in captured.out
        assert "[1/5] Analyzing security groups..." in captured.out
        assert "[2/5] Analyzing IAM policies..." in captured.out
        assert "[3/5] Validating tag compliance..." in captured.out
        assert "[4/5] Analyzing network configuration..." in captured.out
        assert "[5/5] Validating encryption settings..." in captured.out

    def test_save_and_display_report_pass(self, tmp_path, capsys):
        """Test save_and_display_report with passing status."""
        runner = ComplianceRunner('/tmp/dummy.json')
        report = {
            'summary': {
                'status': 'PASS',
                'compliance_score': 100.0,
                'total_violations': 0,
                'violations_by_severity': {
                    'CRITICAL': 0,
                    'HIGH': 0,
                    'MEDIUM': 0
                }
            },
            'recommendations': []
        }

        output_file = tmp_path / "report.json"
        result = runner.save_and_display_report(report, str(output_file))

        assert result is True
        assert output_file.exists()

        captured = capsys.readouterr()
        assert "COMPLIANCE VALIDATION SUMMARY" in captured.out
        assert "Status: PASS" in captured.out
        assert "Compliance Score: 100.0" in captured.out

    def test_save_and_display_report_fail(self, tmp_path, capsys):
        """Test save_and_display_report with failing status."""
        runner = ComplianceRunner('/tmp/dummy.json')
        report = {
            'summary': {
                'status': 'FAIL',
                'compliance_score': 65.0,
                'total_violations': 3,
                'violations_by_severity': {
                    'CRITICAL': 1,
                    'HIGH': 1,
                    'MEDIUM': 1
                }
            },
            'recommendations': [
                {
                    'priority': 'IMMEDIATE',
                    'category': 'Critical Issues',
                    'action': 'Fix critical violations',
                    'impact': 'High security risk'
                }
            ]
        }

        output_file = tmp_path / "report.json"
        result = runner.save_and_display_report(report, str(output_file))

        assert result is False

        captured = capsys.readouterr()
        assert "Status: FAIL" in captured.out
        assert "RECOMMENDATIONS:" in captured.out
        assert "IMMEDIATE" in captured.out

    def test_load_synthesized_stack_with_exit(self, tmp_path, monkeypatch):
        """Test that load_synthesized_stack can trigger system exit."""
        stack_file = tmp_path / "stack.json"
        stack_file.write_text('invalid json')

        runner = ComplianceRunner(str(stack_file))

        # Mock sys.exit to capture the call
        exit_called = []

        def mock_exit(code):
            exit_called.append(code)
            raise SystemExit(code)

        # Test that run_analysis handles load failure
        with pytest.raises(SystemExit):
            runner.synthesized_json = None
            monkeypatch.setattr(sys, 'exit', mock_exit)
            runner.run_analysis()


class TestMainFunction:
    """Test cases for main function."""

    def test_main_with_no_args(self, monkeypatch, capsys):
        """Test main function with no arguments."""
        monkeypatch.setattr(sys, 'argv', ['compliance_runner.py'])

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

        captured = capsys.readouterr()
        assert "Usage:" in captured.out
        assert "Example:" in captured.out

    def test_main_with_valid_file_pass(self, tmp_path, monkeypatch, capsys):
        """Test main function with valid file that passes."""
        stack_file = tmp_path / "stack.json"
        stack_content = {
            'resource': {
                'aws_s3_bucket': {
                    'bucket': {
                        'server_side_encryption_configuration': {
                            'rule': {
                                'apply_server_side_encryption_by_default': {
                                    'sse_algorithm': 'AES256'
                                }
                            }
                        },
                        'tags': {
                            'Environment': 'dev',
                            'Owner': 'team',
                            'CostCenter': '12345'
                        }
                    }
                }
            }
        }
        stack_file.write_text(json.dumps(stack_content))

        output_file = tmp_path / "report.json"
        monkeypatch.setattr(sys, 'argv', ['compliance_runner.py', str(stack_file)])
        monkeypatch.setenv('COMPLIANCE_REPORT_PATH', str(output_file))

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 0
        assert output_file.exists()

    def test_main_with_valid_file_fail(self, tmp_path, monkeypatch, capsys):
        """Test main function with valid file that fails."""
        stack_file = tmp_path / "stack.json"
        stack_content = {
            'resource': {
                'aws_security_group': {
                    'sg': {
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

        output_file = tmp_path / "report.json"
        monkeypatch.setattr(sys, 'argv', ['compliance_runner.py', str(stack_file)])
        monkeypatch.setenv('COMPLIANCE_REPORT_PATH', str(output_file))

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1
        assert output_file.exists()

    def test_main_with_default_output_path(self, tmp_path, monkeypatch):
        """Test main function uses default output path."""
        stack_file = tmp_path / "stack.json"
        stack_content = {'resource': {}}
        stack_file.write_text(json.dumps(stack_content))

        monkeypatch.setattr(sys, 'argv', ['compliance_runner.py', str(stack_file)])
        monkeypatch.delenv('COMPLIANCE_REPORT_PATH', raising=False)
        monkeypatch.chdir(tmp_path)

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 0
        default_report = tmp_path / "compliance-report.json"
        assert default_report.exists()
