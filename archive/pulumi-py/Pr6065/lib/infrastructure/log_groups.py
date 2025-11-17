"""
CloudWatch Log Groups infrastructure module.

Creates log groups with 90-day retention for processing tasks, Lambda functions,
and API Gateway access logs as required by the prompt.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig


class LogGroupsStack:
    """
    CloudWatch Log Groups stack for observability infrastructure.
    
    Creates log groups for:
    - Processing tasks
    - Lambda functions  
    - API Gateway access logs
    
    All with 90-day retention and KMS encryption.
    """
    
    def __init__(self, config: ObservabilityConfig, provider_manager: AWSProviderManager):
        """
        Initialize the Log Groups stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.kms_key = None
        
        # Create shared KMS key for log encryption
        self._create_kms_key()
        
        # Create log groups
        self._create_log_groups()
        
        # Create Log Insights queries
        self._create_log_insights_queries()
    
    def _create_kms_key(self) -> None:
        """Create a single KMS key for all log group encryption with proper policy."""
        # Get account ID for KMS policy
        caller_identity = aws.get_caller_identity()
        
        # Create KMS key policy that allows CloudWatch Logs to use it
        key_policy = Output.all(
            account_id=caller_identity.account_id,
            region=self.config.primary_region
        ).apply(lambda args: json.dumps({
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Sid': 'Enable IAM User Permissions',
                    'Effect': 'Allow',
                    'Principal': {
                        'AWS': f'arn:aws:iam::{args["account_id"]}:root'
                    },
                    'Action': 'kms:*',
                    'Resource': '*'
                },
                {
                    'Sid': 'Allow CloudWatch Logs',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': f'logs.{args["region"]}.amazonaws.com'
                    },
                    'Action': [
                        'kms:Encrypt',
                        'kms:Decrypt',
                        'kms:ReEncrypt*',
                        'kms:GenerateDataKey*',
                        'kms:CreateGrant',
                        'kms:DescribeKey'
                    ],
                    'Resource': '*',
                    'Condition': {
                        'ArnLike': {
                            'kms:EncryptionContext:aws:logs:arn': f'arn:aws:logs:{args["region"]}:{args["account_id"]}:*'
                        }
                    }
                }
            ]
        }))
        
        self.kms_key = aws.kms.Key(
            'log-encryption-key',
            description=f'KMS key for CloudWatch Logs encryption - {self.config.environment_suffix}',
            enable_key_rotation=True,
            policy=key_policy,
            tags=self.config.get_tags_for_resource('KMSKey', Purpose='LogEncryption'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Create alias for the key
        aws.kms.Alias(
            'log-encryption-key-alias',
            name=f'alias/{self.config.get_resource_name("log-encryption-key")}',
            target_key_id=self.kms_key.id,
            opts=self.provider_manager.get_resource_options(depends_on=[self.kms_key])
        )
    
    def _create_log_groups(self) -> None:
        """Create CloudWatch Log Groups for different components."""
        log_group_configs = {
            'processing': f'/aws/payment/{self.config.environment_suffix}/processing',
            'lambda': f'/aws/lambda/payment-{self.config.environment_suffix}',
            'api_gateway': f'/aws/apigateway/payment-{self.config.environment_suffix}'
        }
        
        for name, log_group_name in log_group_configs.items():
            self.log_groups[name] = aws.cloudwatch.LogGroup(
                f'log-group-{name}',
                name=log_group_name,
                retention_in_days=self.config.log_retention_days,
                kms_key_id=self.kms_key.arn,
                tags=self.config.get_tags_for_resource(
                    'LogGroup',
                    Component=name.replace('_', '-'),
                    RetentionDays=str(self.config.log_retention_days)
                ),
                opts=self.provider_manager.get_resource_options(depends_on=[self.kms_key])
            )
    
    def _create_log_insights_queries(self) -> None:
        """Create saved queries for common troubleshooting scenarios."""
        queries = [
            {
                'name': 'payment-failures',
                'query': '''
                    fields @timestamp, transactionId, errorMessage, amount
                    | filter status = "FAILED"
                    | sort @timestamp desc
                    | limit 100
                '''
            },
            {
                'name': 'high-latency-transactions',
                'query': '''
                    fields @timestamp, transactionId, processingTime, paymentMethod
                    | filter processingTime > 1000
                    | stats avg(processingTime) as avg_time by paymentMethod
                '''
            },
            {
                'name': 'error-analysis',
                'query': '''
                    fields @timestamp, @message
                    | filter @message like /ERROR/
                    | stats count() by errorType
                    | sort count desc
                '''
            },
            {
                'name': 'transaction-volume-analysis',
                'query': '''
                    fields @timestamp, transactionId, amount, merchantId
                    | stats count() as transaction_count, sum(amount) as total_amount by bin(5m)
                '''
            },
            {
                'name': 'database-connection-errors',
                'query': '''
                    fields @timestamp, @message, connectionPool, errorCode
                    | filter @message like /database connection/
                    | stats count() by errorCode
                '''
            }
        ]
        
        # Get log group names as a list (need to resolve Outputs)
        log_group_names = Output.all(*[lg.name for lg in self.log_groups.values()])
        
        for query_config in queries:
            # Use Output.apply to properly handle the list of log group names
            log_group_names.apply(
                lambda names, qc=query_config: aws.cloudwatch.QueryDefinition(
                    f'query-{qc["name"]}',
                    name=f'payment-{qc["name"]}-{self.config.environment_suffix}',
                    log_group_names=list(names),
                    query_string=qc['query'],
                    opts=self.provider_manager.get_resource_options()
                )
            )
    
    def get_log_group(self, name: str) -> aws.cloudwatch.LogGroup:
        """
        Get a log group by name.
        
        Args:
            name: Log group name key
            
        Returns:
            CloudWatch Log Group
        """
        return self.log_groups.get(name)
    
    def get_log_group_name(self, name: str) -> Output[str]:
        """
        Get a log group name as Output.
        
        Args:
            name: Log group name key
            
        Returns:
            Log group name as Output
        """
        log_group = self.log_groups.get(name)
        return log_group.name if log_group else Output.from_input('')
    
    def get_log_group_arn(self, name: str) -> Output[str]:
        """
        Get a log group ARN as Output.
        
        Args:
            name: Log group name key
            
        Returns:
            Log group ARN as Output
        """
        log_group = self.log_groups.get(name)
        return log_group.arn if log_group else Output.from_input('')
    
    def get_kms_key_id(self) -> Output[str]:
        """
        Get the KMS key ID for log encryption.
        
        Returns:
            KMS key ID as Output
        """
        return self.kms_key.id
    
    def get_kms_key_arn(self) -> Output[str]:
        """
        Get the KMS key ARN for log encryption.
        
        Returns:
            KMS key ARN as Output
        """
        return self.kms_key.arn

