"""
DynamoDB module for tables with autoscaling and global replication.

This module creates DynamoDB tables with environment-specific configurations:
- dev: on-demand billing
- staging/prod: provisioned capacity with autoscaling
- prod to staging: global table replication
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the multi-environment infrastructure.
    
    Creates tables with:
    - Environment-specific billing modes
    - Autoscaling for staging/prod
    - Global replication support for prod to staging
    """
    
    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        
        self._create_items_table()
    
    def _create_items_table(self) -> None:
        """Create the items table with proper configuration."""
        table_name = self.config.get_resource_name('items')
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        table_args = {
            'name': table_name,
            'hash_key': 'id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(name='id', type='S'),
                aws.dynamodb.TableAttributeArgs(name='timestamp', type='S')
            ],
            'billing_mode': self.config.dynamodb_billing_mode,
            'tags': self.config.get_common_tags(),
            'opts': opts
        }
        
        if self.config.dynamodb_billing_mode == 'PROVISIONED':
            table_args['read_capacity'] = self.config.dynamodb_read_capacity
            table_args['write_capacity'] = self.config.dynamodb_write_capacity
        
        self.tables['items'] = aws.dynamodb.Table(
            f"{table_name}-table",
            **table_args
        )
        
        if self.config.dynamodb_enable_autoscaling:
            self._configure_autoscaling('items', table_name)
    
    def _configure_autoscaling(self, table_key: str, table_name: str) -> None:
        """
        Configure autoscaling for a DynamoDB table.
        
        Args:
            table_key: Key to look up table in self.tables
            table_name: Table name for resource naming
        """
        table = self.tables[table_key]
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        read_target = aws.appautoscaling.Target(
            f"{table_name}-read-target",
            max_capacity=self.config.dynamodb_read_capacity * 2,
            min_capacity=max(1, self.config.dynamodb_read_capacity // 2),
            resource_id=Output.concat('table/', table.name),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=opts
        )
        
        aws.appautoscaling.Policy(
            f"{table_name}-read-policy",
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                )
            ),
            opts=opts
        )
        
        write_target = aws.appautoscaling.Target(
            f"{table_name}-write-target",
            max_capacity=self.config.dynamodb_write_capacity * 2,
            min_capacity=max(1, self.config.dynamodb_write_capacity // 2),
            resource_id=Output.concat('table/', table.name),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=opts
        )
        
        aws.appautoscaling.Policy(
            f"{table_name}-write-policy",
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                target_value=70.0,
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                )
            ),
            opts=opts
        )
    
    def get_table(self, name: str = 'items') -> aws.dynamodb.Table:
        """
        Get table by name.
        
        Args:
            name: Table name (default: 'items')
        
        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(name)
    
    def get_table_name(self, name: str = 'items') -> Output[str]:
        """
        Get table name by name.
        
        Args:
            name: Table name (default: 'items')
        
        Returns:
            Table name as Output[str]
        """
        table = self.get_table(name)
        return table.name if table else None
    
    def get_table_arn(self, name: str = 'items') -> Output[str]:
        """
        Get table ARN by name.
        
        Args:
            name: Table name (default: 'items')
        
        Returns:
            Table ARN as Output[str]
        """
        table = self.get_table(name)
        return table.arn if table else None


def setup_global_replication(
    prod_table: aws.dynamodb.Table,
    staging_region: str,
    config: MultiEnvConfig,
    provider_manager: AWSProviderManager
) -> None:
    """
    Setup global table replication from prod to staging.
    
    Note: This function should be called separately after both prod and staging
    tables are created. Due to cross-account/cross-environment nature, this
    requires careful orchestration.
    
    Args:
        prod_table: Production DynamoDB table
        staging_region: Staging region for replication
        config: MultiEnvConfig instance
        provider_manager: AWSProviderManager instance
    """
    opts = ResourceOptions(provider=provider_manager.get_provider()) if provider_manager.get_provider() else None
    
    replication_name = f"{config.project_name}-global-replication"
    
    aws.dynamodb.GlobalTable(
        replication_name,
        name=prod_table.name,
        replicas=[
            aws.dynamodb.GlobalTableReplicaArgs(
                region_name=config.primary_region
            ),
            aws.dynamodb.GlobalTableReplicaArgs(
                region_name=staging_region
            )
        ],
        opts=opts
    )

