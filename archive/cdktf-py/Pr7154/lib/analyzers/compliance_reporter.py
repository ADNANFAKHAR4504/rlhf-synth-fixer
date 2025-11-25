"""Compliance reporter for generating detailed JSON reports."""

import json
from datetime import datetime, timezone
from typing import List, Dict, Any


class ComplianceReporter:
    """Generates detailed compliance reports with remediation guidance."""

    def __init__(self):
        """Initialize the compliance reporter."""
        self.report = {}

    def generate_report(
        self,
        security_violations: List[Dict[str, Any]],
        iam_violations: List[Dict[str, Any]],
        tag_violations: List[Dict[str, Any]],
        network_violations: List[Dict[str, Any]],
        encryption_violations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive compliance report.

        Args:
            security_violations: Security group violations
            iam_violations: IAM policy violations
            tag_violations: Tag compliance violations
            network_violations: Network CIDR violations
            encryption_violations: Encryption violations

        Returns:
            Complete compliance report
        """
        all_violations = (
            security_violations +
            iam_violations +
            tag_violations +
            network_violations +
            encryption_violations
        )

        total_violations = len(all_violations)
        critical_count = len([v for v in all_violations if v.get('severity') == 'CRITICAL'])
        high_count = len([v for v in all_violations if v.get('severity') == 'HIGH'])
        medium_count = len([v for v in all_violations if v.get('severity') == 'MEDIUM'])

        # Determine overall pass/fail status
        status = 'PASS' if total_violations == 0 else 'FAIL'

        # Calculate compliance score (0-100)
        compliance_score = self._calculate_compliance_score(
            critical_count, high_count, medium_count
        )

        self.report = {
            'report_metadata': {
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'report_version': '1.0',
                'analysis_type': 'infrastructure_compliance'
            },
            'summary': {
                'status': status,
                'compliance_score': compliance_score,
                'total_violations': total_violations,
                'violations_by_severity': {
                    'CRITICAL': critical_count,
                    'HIGH': high_count,
                    'MEDIUM': medium_count
                }
            },
            'violations_by_category': {
                'security_groups': {
                    'count': len(security_violations),
                    'violations': security_violations
                },
                'iam_policies': {
                    'count': len(iam_violations),
                    'violations': iam_violations
                },
                'tag_compliance': {
                    'count': len(tag_violations),
                    'violations': tag_violations
                },
                'network': {
                    'count': len(network_violations),
                    'violations': network_violations
                },
                'encryption': {
                    'count': len(encryption_violations),
                    'violations': encryption_violations
                }
            },
            'recommendations': self._generate_recommendations(all_violations)
        }

        return self.report

    def _calculate_compliance_score(self, critical: int, high: int, medium: int) -> float:
        """
        Calculate compliance score based on violations.

        Score starts at 100 and deducts:
        - 20 points per CRITICAL violation
        - 10 points per HIGH violation
        - 5 points per MEDIUM violation
        """
        score = 100.0
        score -= (critical * 20)
        score -= (high * 10)
        score -= (medium * 5)

        return max(0.0, score)

    def _generate_recommendations(self, violations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate prioritized remediation recommendations."""
        recommendations = []

        # Group violations by severity
        critical_violations = [v for v in violations if v.get('severity') == 'CRITICAL']
        high_violations = [v for v in violations if v.get('severity') == 'HIGH']
        medium_violations = [v for v in violations if v.get('severity') == 'MEDIUM']

        if critical_violations:
            recommendations.append({
                'priority': 'IMMEDIATE',
                'category': 'Critical Security Issues',
                'action': f'Address {len(critical_violations)} critical violations immediately',
                'impact': 'Critical violations pose immediate security risks and must be resolved before deployment',
                'violations': [v.get('violation_type') for v in critical_violations]
            })

        if high_violations:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'High Priority Issues',
                'action': f'Resolve {len(high_violations)} high severity violations',
                'impact': 'High severity issues significantly increase security risk and should be addressed promptly',
                'violations': [v.get('violation_type') for v in high_violations]
            })

        if medium_violations:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Compliance Standards',
                'action': f'Fix {len(medium_violations)} medium severity violations',
                'impact': 'Medium severity issues affect compliance and operational best practices',
                'violations': [v.get('violation_type') for v in medium_violations]
            })

        # Add general recommendations
        if not violations:
            recommendations.append({
                'priority': 'INFO',
                'category': 'All Checks Passed',
                'action': 'Continue monitoring infrastructure for configuration drift',
                'impact': 'No violations detected. Maintain current security posture through regular validation'
            })

        return recommendations

    def save_report(self, output_path: str) -> None:
        """Save report to JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)

    def get_exit_code(self) -> int:
        """Get exit code for CI/CD integration (0 = pass, 1 = fail)."""
        return 0 if self.report.get('summary', {}).get('status') == 'PASS' else 1
