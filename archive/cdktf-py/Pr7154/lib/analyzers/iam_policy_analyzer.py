"""IAM policy analyzer for detecting wildcard permissions."""

import json
from typing import List, Dict, Any


class IamPolicyAnalyzer:
    """Analyzes IAM policies for overly permissive wildcard permissions."""

    def __init__(self):
        """Initialize the IAM policy analyzer."""
        self.violations = []

    def analyze_synthesized_stack(self, synthesized_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze synthesized CDKTF stack for IAM policy violations.

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
                if resource_type in ['aws_iam_policy', 'aws_iam_role_policy',
                                     'aws_iam_user_policy', 'aws_iam_group_policy']:
                    for resource_name, resource_config in resources.items():
                        self._check_iam_policy(resource_type, resource_name, resource_config)

                # Check inline policies in roles
                if resource_type == 'aws_iam_role':
                    for resource_name, resource_config in resources.items():
                        inline_policies = resource_config.get('inline_policy', [])
                        if inline_policies:
                            self._check_inline_policies(resource_name, inline_policies)

        return self.violations

    def _check_iam_policy(self, resource_type: str, resource_name: str, config: Dict[str, Any]):
        """Check IAM policy for wildcard violations."""
        policy_str = config.get('policy', '')

        if not policy_str:
            return

        # Parse policy if it's a JSON string
        try:
            if isinstance(policy_str, str):
                policy_doc = json.loads(policy_str)
            else:
                policy_doc = policy_str

            self._analyze_policy_document(resource_type, resource_name, policy_doc)
        except (json.JSONDecodeError, TypeError):
            # Policy might be a reference or invalid JSON
            pass

    def _check_inline_policies(self, resource_name: str, inline_policies: List[Dict[str, Any]]):
        """Check inline policies in IAM roles."""
        for idx, policy in enumerate(inline_policies):
            policy_doc = policy.get('policy', {})
            if policy_doc:
                self._analyze_policy_document('aws_iam_role_inline_policy',
                                             f"{resource_name}[{idx}]",
                                             policy_doc)

    def _analyze_policy_document(self, resource_type: str, resource_name: str,
                                 policy_doc: Dict[str, Any]):
        """Analyze policy document for wildcard violations."""
        statements = policy_doc.get('Statement', [])

        if not isinstance(statements, list):
            statements = [statements]

        for idx, statement in enumerate(statements):
            if statement.get('Effect') == 'Allow':
                self._check_statement(resource_type, resource_name, statement, idx)

    def _check_statement(self, resource_type: str, resource_name: str,
                        statement: Dict[str, Any], stmt_idx: int):
        """Check individual policy statement for wildcards."""
        actions = statement.get('Action', [])
        resources = statement.get('Resource', [])

        if not isinstance(actions, list):
            actions = [actions]
        if not isinstance(resources, list):
            resources = [resources]

        # Check for wildcard actions
        wildcard_actions = [a for a in actions if '*' in a]
        wildcard_resources = [r for r in resources if r == '*']

        if wildcard_actions and wildcard_resources:
            self.violations.append({
                'severity': 'CRITICAL',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'statement_index': stmt_idx,
                'violation_type': 'WILDCARD_PERMISSIONS',
                'details': {
                    'actions': wildcard_actions,
                    'resources': wildcard_resources,
                    'effect': statement.get('Effect')
                },
                'remediation': (
                    f'Replace wildcard permissions in {resource_name} statement {stmt_idx} '
                    f'with specific actions and resources. Apply principle of least privilege '
                    f'by granting only necessary permissions.'
                )
            })
        elif wildcard_actions:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'statement_index': stmt_idx,
                'violation_type': 'WILDCARD_ACTIONS',
                'details': {
                    'actions': wildcard_actions,
                    'resources': resources,
                    'effect': statement.get('Effect')
                },
                'remediation': (
                    f'Replace wildcard actions in {resource_name} statement {stmt_idx} '
                    f'with specific API actions.'
                )
            })
        elif wildcard_resources and any('*' in a for a in actions):
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'statement_index': stmt_idx,
                'violation_type': 'WILDCARD_RESOURCES',
                'details': {
                    'actions': actions,
                    'resources': wildcard_resources,
                    'effect': statement.get('Effect')
                },
                'remediation': (
                    f'Replace wildcard resources in {resource_name} statement {stmt_idx} '
                    f'with specific resource ARNs.'
                )
            })

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of IAM policy analysis."""
        return {
            'analyzer': 'IamPolicyAnalyzer',
            'total_violations': len(self.violations),
            'critical_severity': len([v for v in self.violations if v['severity'] == 'CRITICAL']),
            'high_severity': len([v for v in self.violations if v['severity'] == 'HIGH']),
            'violations': self.violations
        }
