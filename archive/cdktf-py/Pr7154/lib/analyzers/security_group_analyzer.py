"""Security group analyzer for detecting overly permissive rules."""

import json
from typing import List, Dict, Any


class SecurityGroupAnalyzer:
    """Analyzes security group rules for overly permissive configurations."""

    def __init__(self):
        """Initialize the security group analyzer."""
        self.violations = []

    def analyze_synthesized_stack(self, synthesized_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze synthesized CDKTF stack for security group violations.

        Args:
            synthesized_json: Synthesized Terraform JSON configuration

        Returns:
            List of violations found
        """
        self.violations = []

        # Handle None or invalid input
        if not synthesized_json:
            return self.violations

        # Traverse resources in synthesized JSON
        if 'resource' in synthesized_json:
            for resource_type, resources in synthesized_json['resource'].items():
                if resource_type in ['aws_security_group', 'aws_security_group_rule']:
                    for resource_name, resource_config in resources.items():
                        self._check_security_group(resource_type, resource_name, resource_config)

        return self.violations

    def _check_security_group(self, resource_type: str, resource_name: str, config: Dict[str, Any]):
        """Check individual security group for violations."""
        # Check ingress rules
        ingress_rules = config.get('ingress', [])
        if isinstance(ingress_rules, list):
            for idx, rule in enumerate(ingress_rules):
                self._check_rule(resource_type, resource_name, rule, idx, 'ingress')
        elif isinstance(ingress_rules, dict):
            self._check_rule(resource_type, resource_name, ingress_rules, 0, 'ingress')

        # Check standalone security group rules
        if resource_type == 'aws_security_group_rule':
            rule_type = config.get('type', 'unknown')
            if rule_type == 'ingress':
                self._check_rule(resource_type, resource_name, config, 0, 'ingress')

    def _check_rule(self, resource_type: str, resource_name: str, rule: Dict[str, Any],
                    rule_idx: int, rule_direction: str):
        """Check individual rule for 0.0.0.0/0 violations."""
        cidr_blocks = rule.get('cidr_blocks', [])
        ipv6_cidr_blocks = rule.get('ipv6_cidr_blocks', [])
        from_port = rule.get('from_port', 0)
        to_port = rule.get('to_port', 0)
        protocol = rule.get('protocol', 'unknown')

        # Check for overly permissive IPv4
        if '0.0.0.0/0' in cidr_blocks:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'rule_index': rule_idx,
                'violation_type': 'UNRESTRICTED_INGRESS',
                'details': {
                    'cidr': '0.0.0.0/0',
                    'from_port': from_port,
                    'to_port': to_port,
                    'protocol': protocol,
                    'direction': rule_direction
                },
                'remediation': (
                    f'Restrict {resource_name} ingress rule {rule_idx} to specific IP ranges '
                    f'instead of 0.0.0.0/0. Use security groups or specific CIDR blocks for '
                    f'source traffic.'
                )
            })

        # Check for overly permissive IPv6
        if '::/0' in ipv6_cidr_blocks:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'rule_index': rule_idx,
                'violation_type': 'UNRESTRICTED_INGRESS_IPV6',
                'details': {
                    'cidr': '::/0',
                    'from_port': from_port,
                    'to_port': to_port,
                    'protocol': protocol,
                    'direction': rule_direction
                },
                'remediation': (
                    f'Restrict {resource_name} ingress rule {rule_idx} to specific IPv6 '
                    f'ranges instead of ::/0.'
                )
            })

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of security group analysis."""
        return {
            'analyzer': 'SecurityGroupAnalyzer',
            'total_violations': len(self.violations),
            'high_severity': len([v for v in self.violations if v['severity'] == 'HIGH']),
            'violations': self.violations
        }
