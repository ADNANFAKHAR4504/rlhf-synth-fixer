"""Network analyzer for detecting VPC CIDR overlaps."""

import ipaddress
from typing import List, Dict, Any, Set


class NetworkAnalyzer:
    """Analyzes VPC CIDR ranges for overlaps across environments."""

    def __init__(self):
        """Initialize the network analyzer."""
        self.violations = []
        self.vpc_cidrs = {}

    def analyze_synthesized_stack(self, synthesized_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze synthesized CDKTF stack for network violations.

        Args:
            synthesized_json: Synthesized Terraform JSON configuration

        Returns:
            List of violations found
        """
        self.violations = []
        self.vpc_cidrs = {}

        # Handle None or invalid input
        if not synthesized_json:
            return self.violations

        # Collect all VPC CIDR blocks
        if 'resource' in synthesized_json:
            vpc_resources = synthesized_json['resource'].get('aws_vpc', {})
            for vpc_name, vpc_config in vpc_resources.items():
                cidr_block = vpc_config.get('cidr_block', '')
                if cidr_block:
                    self.vpc_cidrs[vpc_name] = cidr_block

        # Check for overlaps
        self._check_cidr_overlaps()

        return self.violations

    def _check_cidr_overlaps(self):
        """Check for CIDR overlaps between VPCs."""
        vpc_names = list(self.vpc_cidrs.keys())

        for i, vpc1_name in enumerate(vpc_names):
            for vpc2_name in vpc_names[i + 1:]:
                cidr1 = self.vpc_cidrs[vpc1_name]
                cidr2 = self.vpc_cidrs[vpc2_name]

                if self._cidrs_overlap(cidr1, cidr2):
                    self.violations.append({
                        'severity': 'CRITICAL',
                        'resource_type': 'aws_vpc',
                        'resource_name': f'{vpc1_name}, {vpc2_name}',
                        'violation_type': 'CIDR_OVERLAP',
                        'details': {
                            'vpc1': vpc1_name,
                            'vpc1_cidr': cidr1,
                            'vpc2': vpc2_name,
                            'vpc2_cidr': cidr2
                        },
                        'remediation': (
                            f'CIDR blocks {cidr1} and {cidr2} overlap between {vpc1_name} and '
                            f'{vpc2_name}. Use non-overlapping CIDR ranges to enable VPC peering '
                            f'and avoid routing conflicts. Common non-overlapping ranges: '
                            f'10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16'
                        )
                    })

    def _cidrs_overlap(self, cidr1: str, cidr2: str) -> bool:
        """Check if two CIDR blocks overlap."""
        try:
            network1 = ipaddress.ip_network(cidr1, strict=False)
            network2 = ipaddress.ip_network(cidr2, strict=False)

            return network1.overlaps(network2)
        except (ValueError, ipaddress.AddressValueError):
            # Invalid CIDR format
            return False

    def validate_multi_environment(self, environments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate CIDR ranges across multiple environments.

        Args:
            environments: List of environment configs with VPC CIDR info

        Returns:
            List of violations found
        """
        self.violations = []

        for i, env1 in enumerate(environments):
            for env2 in environments[i + 1:]:
                env1_cidrs = env1.get('vpc_cidrs', [])
                env2_cidrs = env2.get('vpc_cidrs', [])

                for cidr1 in env1_cidrs:
                    for cidr2 in env2_cidrs:
                        if self._cidrs_overlap(cidr1, cidr2):
                            self.violations.append({
                                'severity': 'CRITICAL',
                                'resource_type': 'multi_environment',
                                'resource_name': f"{env1['name']}, {env2['name']}",
                                'violation_type': 'CROSS_ENVIRONMENT_CIDR_OVERLAP',
                                'details': {
                                    'environment1': env1['name'],
                                    'cidr1': cidr1,
                                    'environment2': env2['name'],
                                    'cidr2': cidr2
                                },
                                'remediation': (
                                    f'Environments {env1["name"]} and {env2["name"]} have overlapping '
                                    f'CIDRs. Assign distinct CIDR ranges per environment for proper '
                                    f'network isolation.'
                                )
                            })

        return self.violations

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of network analysis."""
        return {
            'analyzer': 'NetworkAnalyzer',
            'total_violations': len(self.violations),
            'critical_severity': len([v for v in self.violations if v['severity'] == 'CRITICAL']),
            'vpc_count': len(self.vpc_cidrs),
            'violations': self.violations
        }
