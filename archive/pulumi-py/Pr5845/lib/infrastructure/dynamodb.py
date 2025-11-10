"""
DynamoDB module for table management.

This module creates and manages DynamoDB tables with autoscaling,
encryption, point-in-time recovery, and contributor insights.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class DynamoDBStack:
    """Manages DynamoDB tables with autoscaling and encryption."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        
        self._create_tables()
    
    def _create_tables(self):
        """Create DynamoDB tables."""
        self.tables['data'] = self._create_table('data')
    
    def _create_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Create a DynamoDB table with all required features.
        
        Args:
            table_name: Name identifier for the table
            
        Returns:
            DynamoDB Table resource
        """
        resource_name = self.config.get_resource_name(f'table-{table_name}')
        
        table = aws.dynamodb.Table(
            f'dynamodb-table-{table_name}',
            name=resource_name,
            billing_mode=self.config.dynamodb_billing_mode,
            hash_key=self.config.dynamodb_partition_key,
            range_key=self.config.dynamodb_sort_key,
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_partition_key,
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_sort_key,
                    type='N'
                )
            ],
            read_capacity=self.config.dynamodb_read_capacity if self.config.dynamodb_billing_mode == 'PROVISIONED' else None,
            write_capacity=self.config.dynamodb_write_capacity if self.config.dynamodb_billing_mode == 'PROVISIONED' else None,
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('dynamodb')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.config.enable_point_in_time_recovery
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        if self.config.enable_contributor_insights:
            aws.dynamodb.ContributorInsights(
                f'dynamodb-insights-{table_name}',
                table_name=table.name,
                opts=self.provider_manager.get_resource_options(depends_on=[table])
            )
        
        if self.config.dynamodb_billing_mode == 'PROVISIONED':
            self._setup_autoscaling(table_name, table)
        
        return table
    
    def _setup_autoscaling(self, table_name: str, table: aws.dynamodb.Table):
        """
        Setup autoscaling for DynamoDB table.
        
        Args:
            table_name: Name identifier for the table
            table: DynamoDB Table resource
        """
        read_target = aws.appautoscaling.Target(
            f'dynamodb-read-target-{table_name}',
            max_capacity=self.config.dynamodb_autoscaling_max_read,
            min_capacity=self.config.dynamodb_autoscaling_min_read,
            resource_id=table.name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options(depends_on=[table])
        )
        
        aws.appautoscaling.Policy(
            f'dynamodb-read-policy-{table_name}',
            name=self.config.get_resource_name(f'read-scaling-{table_name}'),
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                ),
                target_value=float(self.config.dynamodb_autoscaling_target_utilization)
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[read_target])
        )
        
        write_target = aws.appautoscaling.Target(
            f'dynamodb-write-target-{table_name}',
            max_capacity=self.config.dynamodb_autoscaling_max_write,
            min_capacity=self.config.dynamodb_autoscaling_min_write,
            resource_id=table.name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options(depends_on=[table])
        )
        
        aws.appautoscaling.Policy(
            f'dynamodb-write-policy-{table_name}',
            name=self.config.get_resource_name(f'write-scaling-{table_name}'),
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                ),
                target_value=float(self.config.dynamodb_autoscaling_target_utilization)
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[write_target])
        )
    
    def get_table_name(self, table_name: str) -> Output[str]:
        """
        Get DynamoDB table name.
        
        Args:
            table_name: Name identifier for the table
            
        Returns:
            Table name as Output
        """
        return self.tables[table_name].name
    
    def get_table_arn(self, table_name: str) -> Output[str]:
        """
        Get DynamoDB table ARN.
        
        Args:
            table_name: Name identifier for the table
            
        Returns:
            Table ARN as Output
        """
        return self.tables[table_name].arn

