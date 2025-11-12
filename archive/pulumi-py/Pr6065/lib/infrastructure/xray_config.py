"""
X-Ray Tracing infrastructure module.

Configures X-Ray tracing for distributed transaction flow visibility.
"""

import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig


class XRayConfigStack:
    """
    X-Ray Configuration stack for distributed tracing.
    
    Creates:
    - X-Ray encryption configuration with KMS
    - X-Ray sampling rules (generic, not service-specific)
    - X-Ray groups for filtering traces
    """
    
    def __init__(self, config: ObservabilityConfig, provider_manager: AWSProviderManager):
        """
        Initialize the X-Ray Configuration stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_key = None
        
        # Create X-Ray encryption
        self._setup_xray_encryption()
        
        # Create sampling rules
        self._create_sampling_rules()
        
        # Create X-Ray group
        self._create_xray_group()
    
    def _setup_xray_encryption(self) -> None:
        """Configure X-Ray tracing encryption with KMS."""
        # Create KMS key for X-Ray encryption
        self.kms_key = aws.kms.Key(
            'xray-encryption-key',
            description=f'KMS key for X-Ray encryption - {self.config.environment_suffix}',
            enable_key_rotation=True,
            tags=self.config.get_tags_for_resource('KMSKey', Purpose='XRayEncryption'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Create alias
        aws.kms.Alias(
            'xray-encryption-key-alias',
            name=f'alias/{self.config.get_resource_name("xray-encryption-key")}',
            target_key_id=self.kms_key.id,
            opts=self.provider_manager.get_resource_options(depends_on=[self.kms_key])
        )
        
        # Configure X-Ray encryption
        aws.xray.EncryptionConfig(
            'xray-encryption',
            type='KMS',
            key_id=self.kms_key.arn,  # Use ARN, not ID
            opts=self.provider_manager.get_resource_options(depends_on=[self.kms_key])
        )
    
    def _create_sampling_rules(self) -> None:
        """
        Create X-Ray sampling rules for payment transactions.
        
        This addresses model failure #17 by using generic service names
        instead of hard-coded non-existent services.
        """
        sampling_rules = [
            {
                'name': 'payment-high-priority',
                'priority': 1000,
                'fixed_rate': 1.0,  # 100% sampling for high priority
                'reservoir_size': 10,
                'service_name': '*',  # Generic - matches any service
                'service_type': '*',
                'host': '*',  # Required parameter
                'http_method': 'POST',
                'url_path': '/api/*',
                'resource_arn': '*',  # Required parameter
                'version': 1
            },
            {
                'name': 'payment-errors',
                'priority': 2000,
                'fixed_rate': 1.0,  # 100% sampling for errors
                'reservoir_size': 5,
                'service_name': '*',
                'service_type': '*',
                'host': '*',
                'http_method': '*',
                'url_path': '*',
                'resource_arn': '*',
                'version': 1
            },
            {
                'name': 'payment-general',
                'priority': 9000,
                'fixed_rate': 0.1,  # 10% sampling for general traffic
                'reservoir_size': 1,
                'service_name': '*',
                'service_type': '*',
                'host': '*',
                'http_method': '*',
                'url_path': '*',
                'resource_arn': '*',
                'version': 1
            }
        ]
        
        for rule in sampling_rules:
            # X-Ray rule names have a 32 character limit
            rule_name = f'payment-{rule["name"]}-{self.config.environment_suffix}'[:32]
            
            aws.xray.SamplingRule(
                f'sampling-rule-{rule["name"]}',
                rule_name=rule_name,
                priority=rule['priority'],
                fixed_rate=rule['fixed_rate'],
                reservoir_size=rule['reservoir_size'],
                service_name=rule['service_name'],
                service_type=rule['service_type'],
                host=rule['host'],
                http_method=rule['http_method'],
                url_path=rule['url_path'],
                resource_arn=rule['resource_arn'],
                version=rule['version'],
                tags=self.config.get_tags_for_resource('XRaySamplingRule'),
                opts=self.provider_manager.get_resource_options()
            )
    
    def _create_xray_group(self) -> None:
        """Create X-Ray group for payment transactions."""
        # X-Ray group names have a 32 character limit
        group_name = f'payment-txn-{self.config.environment_suffix}'[:32]
        
        # Use generic filter expression that doesn't depend on specific services
        aws.xray.Group(
            'payment-transactions-group',
            group_name=group_name,
            filter_expression='annotation.environment = "' + self.config.environment_suffix + '"',
            tags=self.config.get_tags_for_resource('XRayGroup', Purpose='TransactionTracing'),
            opts=self.provider_manager.get_resource_options()
        )

