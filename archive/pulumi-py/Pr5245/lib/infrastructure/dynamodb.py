"""
DynamoDB module for the serverless transaction pipeline.

This module creates DynamoDB tables for transactions and validation results
with global secondary indexes.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the transaction pipeline.
    
    Creates tables for transactions and validation-results with GSI on timestamp.
    """
    
    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        
        self._create_transactions_table()
        self._create_validation_results_table()
    
    def _create_transactions_table(self):
        """Create transactions table with GSI on timestamp."""
        table_name = self.config.get_resource_name('transactions')
        
        table = aws.dynamodb.Table(
            "transactions-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.tables['transactions'] = table
    
    def _create_validation_results_table(self):
        """Create validation-results table with GSI on timestamp."""
        table_name = self.config.get_resource_name('validation-results')
        
        table = aws.dynamodb.Table(
            "validation-results-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="validation_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="validation_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.tables['validation-results'] = table
    
    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """Get a table by name."""
        return self.tables[table_name]
    
    def get_table_name(self, table_name: str) -> Output[str]:
        """Get table name."""
        return self.tables[table_name].name
    
    def get_table_arn(self, table_name: str) -> Output[str]:
        """Get table ARN."""
        return self.tables[table_name].arn

