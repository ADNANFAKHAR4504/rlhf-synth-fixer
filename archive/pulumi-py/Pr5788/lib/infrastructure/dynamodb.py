"""
DynamoDB module for managing tables with GSIs and auto-scaling.

This module creates DynamoDB tables with Global Secondary Indexes,
auto-scaling, and point-in-time recovery.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class DynamoDBStack:
    """Manages DynamoDB tables with GSIs and auto-scaling."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        self.autoscaling_targets: Dict[str, Dict[str, aws.appautoscaling.Target]] = {}
        self.autoscaling_policies: Dict[str, Dict[str, aws.appautoscaling.Policy]] = {}
        
        self._create_tables()
    
    def _create_tables(self):
        """Create DynamoDB tables."""
        self._create_transactions_table()
    
    def _create_transactions_table(self):
        """Create transactions table with GSIs for merchant and date range queries."""
        table_name = self.config.get_resource_name('transactions-table')
        
        table = aws.dynamodb.Table(
            'transactions-table',
            name=table_name,
            billing_mode='PROVISIONED',
            read_capacity=5,
            write_capacity=5,
            hash_key='transaction_id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='merchant_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_date',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='status',
                    type='S'
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='merchant-date-index',
                    hash_key='merchant_id',
                    range_key='transaction_date',
                    projection_type='ALL',
                    read_capacity=5,
                    write_capacity=5
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='status-date-index',
                    hash_key='status',
                    range_key='transaction_date',
                    projection_type='ALL',
                    read_capacity=5,
                    write_capacity=5
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.config.dynamodb_pitr_enabled
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('dynamodb')
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': table_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.tables['transactions'] = table
        
        self._setup_autoscaling('transactions', table.name)
    
    def _setup_autoscaling(self, table_key: str, table_name: Output[str]):
        """
        Setup DynamoDB auto-scaling with 70% target utilization.
        
        Args:
            table_key: Internal key for the table
            table_name: DynamoDB table name
        """
        self.autoscaling_targets[table_key] = {}
        self.autoscaling_policies[table_key] = {}
        
        read_target = aws.appautoscaling.Target(
            f'{table_key}-read-target',
            max_capacity=100,
            min_capacity=5,
            resource_id=table_name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options()
        )
        
        read_policy = aws.appautoscaling.Policy(
            f'{table_key}-read-policy',
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                ),
                target_value=self.config.dynamodb_target_utilization
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        write_target = aws.appautoscaling.Target(
            f'{table_key}-write-target',
            max_capacity=100,
            min_capacity=5,
            resource_id=table_name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options()
        )
        
        write_policy = aws.appautoscaling.Policy(
            f'{table_key}-write-policy',
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                ),
                target_value=self.config.dynamodb_target_utilization
            ),
            opts=self.provider_manager.get_resource_options()
        )
        
        self.autoscaling_targets[table_key]['read'] = read_target
        self.autoscaling_targets[table_key]['write'] = write_target
        self.autoscaling_policies[table_key]['read'] = read_policy
        self.autoscaling_policies[table_key]['write'] = write_policy
    
    def get_table_name(self, table_key: str) -> Output[str]:
        """Get DynamoDB table name."""
        return self.tables[table_key].name
    
    def get_table_arn(self, table_key: str) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.tables[table_key].arn



