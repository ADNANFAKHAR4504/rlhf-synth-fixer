"""Compliance validation runner for analyzing CDKTF stacks."""

import json
import sys
import os
from typing import Dict, Any

from lib.analyzers.security_group_analyzer import SecurityGroupAnalyzer
from lib.analyzers.iam_policy_analyzer import IamPolicyAnalyzer
from lib.analyzers.tag_compliance_validator import TagComplianceValidator
from lib.analyzers.network_analyzer import NetworkAnalyzer
from lib.analyzers.encryption_validator import EncryptionValidator
from lib.analyzers.compliance_reporter import ComplianceReporter


class ComplianceRunner:
    """Main runner for infrastructure compliance validation."""

    def __init__(self, synthesized_stack_path: str):
        """
        Initialize compliance runner.

        Args:
            synthesized_stack_path: Path to synthesized CDKTF stack JSON
        """
        self.synthesized_stack_path = synthesized_stack_path
        self.synthesized_json = None

    def load_synthesized_stack(self) -> bool:
        """Load synthesized stack from file."""
        try:
            with open(self.synthesized_stack_path, 'r', encoding='utf-8') as f:
                self.synthesized_json = json.load(f)
            return True
        except FileNotFoundError:
            print(f"ERROR: Synthesized stack not found at {self.synthesized_stack_path}")
            return False
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in synthesized stack: {e}")
            return False

    def run_analysis(self) -> Dict[str, Any]:
        """
        Run all compliance analyzers.

        Returns:
            Complete compliance report
        """
        if not self.synthesized_json:
            if not self.load_synthesized_stack():
                sys.exit(1)

        print("Running infrastructure compliance analysis...")

        # Initialize analyzers
        sg_analyzer = SecurityGroupAnalyzer()
        iam_analyzer = IamPolicyAnalyzer()
        tag_validator = TagComplianceValidator()
        network_analyzer = NetworkAnalyzer()
        encryption_validator = EncryptionValidator()
        reporter = ComplianceReporter()

        # Run analysis
        print("  [1/5] Analyzing security groups...")
        sg_violations = sg_analyzer.analyze_synthesized_stack(self.synthesized_json)

        print("  [2/5] Analyzing IAM policies...")
        iam_violations = iam_analyzer.analyze_synthesized_stack(self.synthesized_json)

        print("  [3/5] Validating tag compliance...")
        tag_violations = tag_validator.analyze_synthesized_stack(self.synthesized_json)

        print("  [4/5] Analyzing network configuration...")
        network_violations = network_analyzer.analyze_synthesized_stack(self.synthesized_json)

        print("  [5/5] Validating encryption settings...")
        encryption_violations = encryption_validator.analyze_synthesized_stack(self.synthesized_json)

        # Generate report
        print("\nGenerating compliance report...")
        report = reporter.generate_report(
            sg_violations,
            iam_violations,
            tag_violations,
            network_violations,
            encryption_violations
        )

        return report

    def save_and_display_report(self, report: Dict[str, Any], output_path: str):
        """Save report and display summary."""
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"\nCompliance report saved to: {output_path}")

        # Display summary
        summary = report.get('summary', {})
        print("\n" + "=" * 70)
        print("COMPLIANCE VALIDATION SUMMARY")
        print("=" * 70)
        print(f"Status: {summary.get('status')}")
        print(f"Compliance Score: {summary.get('compliance_score'):.1f}/100")
        print(f"Total Violations: {summary.get('total_violations')}")
        print("\nViolations by Severity:")
        for severity, count in summary.get('violations_by_severity', {}).items():
            print(f"  {severity}: {count}")
        print("=" * 70)

        # Display recommendations
        recommendations = report.get('recommendations', [])
        if recommendations:
            print("\nRECOMMENDATIONS:")
            for idx, rec in enumerate(recommendations, 1):
                print(f"\n{idx}. [{rec.get('priority')}] {rec.get('category')}")
                print(f"   Action: {rec.get('action')}")
                print(f"   Impact: {rec.get('impact')}")

        return summary.get('status') == 'PASS'


def main():
    """Main entry point for compliance validation."""
    if len(sys.argv) < 2:
        print("Usage: python lib/compliance_runner.py <path-to-synthesized-stack.json>")
        print("\nExample:")
        print("  cdktf synth")
        print("  python lib/compliance_runner.py cdktf.out/stacks/TapStackdev/cdk.tf.json")
        sys.exit(1)

    stack_path = sys.argv[1]
    output_path = os.getenv('COMPLIANCE_REPORT_PATH', 'compliance-report.json')

    runner = ComplianceRunner(stack_path)
    report = runner.run_analysis()
    passed = runner.save_and_display_report(report, output_path)

    # Exit with appropriate code for CI/CD
    sys.exit(0 if passed else 1)


if __name__ == '__main__':
    main()
