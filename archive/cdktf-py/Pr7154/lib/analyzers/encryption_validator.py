"""Encryption validator for S3 and RDS resources."""

from typing import List, Dict, Any


class EncryptionValidator:
    """Validates encryption settings on S3 buckets and RDS instances."""

    def __init__(self):
        """Initialize the encryption validator."""
        self.violations = []

    def analyze_synthesized_stack(self, synthesized_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze synthesized CDKTF stack for encryption violations.

        Args:
            synthesized_json: Synthesized Terraform JSON configuration

        Returns:
            List of violations found
        """
        self.violations = []

        # Handle None or invalid input
        if not synthesized_json:
            return self.violations

        if 'resource' in synthesized_json:
            # Check S3 buckets
            s3_buckets = synthesized_json['resource'].get('aws_s3_bucket', {})
            for bucket_name, bucket_config in s3_buckets.items():
                self._check_s3_encryption(bucket_name, bucket_config)

            # Check RDS instances
            rds_instances = synthesized_json['resource'].get('aws_db_instance', {})
            for instance_name, instance_config in rds_instances.items():
                self._check_rds_encryption(instance_name, instance_config, 'aws_db_instance')

            # Check RDS clusters
            rds_clusters = synthesized_json['resource'].get('aws_rds_cluster', {})
            for cluster_name, cluster_config in rds_clusters.items():
                self._check_rds_encryption(cluster_name, cluster_config, 'aws_rds_cluster')

        return self.violations

    def _check_s3_encryption(self, bucket_name: str, config: Dict[str, Any]):
        """Check S3 bucket encryption configuration."""
        encryption_config = config.get('server_side_encryption_configuration', {})

        if not encryption_config:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': 'aws_s3_bucket',
                'resource_name': bucket_name,
                'violation_type': 'MISSING_ENCRYPTION',
                'details': {
                    'resource': bucket_name,
                    'encryption_status': 'disabled'
                },
                'remediation': f'Enable server-side encryption for S3 bucket {bucket_name}. '
                              f'Use AES256 (SSE-S3) or aws:kms (SSE-KMS) encryption.'
            })
            return

        # Check if encryption is properly configured
        rules = encryption_config.get('rule', [])
        if isinstance(rules, dict):
            rules = [rules]

        has_valid_encryption = False
        for rule in rules:
            sse_config = rule.get('apply_server_side_encryption_by_default', {})
            sse_algorithm = sse_config.get('sse_algorithm', '')

            if sse_algorithm in ['AES256', 'aws:kms']:
                has_valid_encryption = True
                break

        if not has_valid_encryption:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': 'aws_s3_bucket',
                'resource_name': bucket_name,
                'violation_type': 'INVALID_ENCRYPTION',
                'details': {
                    'resource': bucket_name,
                    'encryption_status': 'misconfigured'
                },
                'remediation': f'Configure valid encryption algorithm for S3 bucket {bucket_name}. '
                              f'Use AES256 or aws:kms.'
            })

    def _check_rds_encryption(self, resource_name: str, config: Dict[str, Any], resource_type: str):
        """Check RDS encryption configuration."""
        storage_encrypted = config.get('storage_encrypted', False)

        # Convert string 'true'/'false' to boolean if needed
        if isinstance(storage_encrypted, str):
            # Accept 'true', 'TRUE', 'True', etc.
            storage_encrypted = storage_encrypted.lower() == 'true'

        if not storage_encrypted:
            self.violations.append({
                'severity': 'HIGH',
                'resource_type': resource_type,
                'resource_name': resource_name,
                'violation_type': 'RDS_ENCRYPTION_DISABLED',
                'details': {
                    'resource': resource_name,
                    'storage_encrypted': storage_encrypted
                },
                'remediation': f'Enable storage encryption for RDS {resource_type} {resource_name}. '
                              f'Set storage_encrypted=true and optionally specify kms_key_id for KMS encryption.'
            })

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of encryption analysis."""
        return {
            'analyzer': 'EncryptionValidator',
            'total_violations': len(self.violations),
            'high_severity': len([v for v in self.violations if v['severity'] == 'HIGH']),
            'violations': self.violations
        }
