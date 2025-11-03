"""
DynamoDB module for table management.

This module creates DynamoDB tables with on-demand capacity, proper schemas,
Contributor Insights, and KMS encryption.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class DynamoDBStack:
    """
    Manages DynamoDB tables.
    
    Creates tables with on-demand capacity, proper schemas, Contributor Insights,
    and KMS encryption for data at rest.
    """
    
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
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        self.contributor_insights: Dict[str, aws.dynamodb.ContributorInsights] = {}
        
        self._create_users_table()
        self._create_orders_table()
        self._create_products_table()
    
    def _create_users_table(self):
        """Create users table with userId as partition key."""
        table_name = self.config.get_resource_name('users-table', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        table = aws.dynamodb.Table(
            'users-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='userId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='userId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='email', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='email-index',
                    hash_key='email',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.tables['users'] = table
        
        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('users', table.name)
    
    def _create_orders_table(self):
        """Create orders table with orderId as partition key."""
        table_name = self.config.get_resource_name('orders-table', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        table = aws.dynamodb.Table(
            'orders-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='orderId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='orderId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='userId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='status', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='userId-index',
                    hash_key='userId',
                    projection_type='ALL'
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='status-index',
                    hash_key='status',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.tables['orders'] = table
        
        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('orders', table.name)
    
    def _create_products_table(self):
        """Create products table with productId as partition key."""
        table_name = self.config.get_resource_name('products-table', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        table = aws.dynamodb.Table(
            'products-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='productId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='productId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='category', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='category-index',
                    hash_key='category',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.tables['products'] = table
        
        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('products', table.name)
    
    def _enable_contributor_insights(self, table_key: str, table_name: pulumi.Output[str]):
        """
        Enable Contributor Insights for a table.
        
        Args:
            table_key: Key to store the insights resource
            table_name: Table name as Output
        """
        opts = self.provider_manager.get_resource_options()
        
        insights = aws.dynamodb.ContributorInsights(
            f'{table_key}-contributor-insights',
            table_name=table_name,
            opts=opts
        )
        
        self.contributor_insights[table_key] = insights
    
    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Get a table by name.
        
        Args:
            table_name: Name of the table
            
        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(table_name)
    
    def get_table_name(self, table_name: str) -> pulumi.Output[str]:
        """
        Get the name of a table.
        
        Args:
            table_name: Key of the table
            
        Returns:
            Table name as Output
        """
        table = self.get_table(table_name)
        return table.name if table else None
    
    def get_table_arn(self, table_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a table.
        
        Args:
            table_name: Key of the table
            
        Returns:
            Table ARN as Output
        """
        table = self.get_table(table_name)
        return table.arn if table else None

