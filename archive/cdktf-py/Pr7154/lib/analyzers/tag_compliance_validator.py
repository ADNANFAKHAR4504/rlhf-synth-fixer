"""Tag compliance validator for ensuring mandatory tags."""

from typing import List, Dict, Any, Set


class TagComplianceValidator:
    """Validates that all resources have required tags."""

    REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']

    # Resource types that support tagging
    TAGGABLE_RESOURCES = [
        'aws_s3_bucket',
        'aws_instance',
        'aws_db_instance',
        'aws_rds_cluster',
        'aws_lambda_function',
        'aws_ecs_cluster',
        'aws_ecs_service',
        'aws_vpc',
        'aws_subnet',
        'aws_security_group',
        'aws_elb',
        'aws_lb',
        'aws_dynamodb_table',
        'aws_kms_key',
        'aws_cloudwatch_log_group',
    ]

    def __init__(self):
        """Initialize the tag compliance validator."""
        self.violations = []

    def analyze_synthesized_stack(self, synthesized_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze synthesized CDKTF stack for tag compliance violations.

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
                if resource_type in self.TAGGABLE_RESOURCES:
                    for resource_name, resource_config in resources.items():
                        self._check_resource_tags(resource_type, resource_name, resource_config)

        return self.violations

    def _check_resource_tags(self, resource_type: str, resource_name: str, config: Dict[str, Any]):
        """Check if resource has all required tags."""
        tags = config.get('tags', {})

        # Handle tags_all which might be used by CDKTF
        if not tags:
            tags = config.get('tags_all', {})

        missing_tags = self._get_missing_tags(tags)

        if missing_tags:
            self.violations.append({
                'severity': 'MEDIUM',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'violation_type': 'MISSING_REQUIRED_TAGS',
                'details': {
                    'missing_tags': list(missing_tags),
                    'current_tags': list(tags.keys()) if tags else [],
                    'required_tags': self.REQUIRED_TAGS
                },
                'remediation': f'Add missing tags to {resource_name}: {", ".join(missing_tags)}. '
                              f'Required tags are: {", ".join(self.REQUIRED_TAGS)}'
            })

    def _get_missing_tags(self, tags: Dict[str, Any]) -> Set[str]:
        """Get set of missing required tags."""
        if not tags:
            return set(self.REQUIRED_TAGS)

        current_tags = set(tags.keys())
        required_tags = set(self.REQUIRED_TAGS)
        return required_tags - current_tags

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of tag compliance analysis."""
        return {
            'analyzer': 'TagComplianceValidator',
            'total_violations': len(self.violations),
            'medium_severity': len([v for v in self.violations if v['severity'] == 'MEDIUM']),
            'required_tags': self.REQUIRED_TAGS,
            'violations': self.violations
        }
