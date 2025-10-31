"""
DynamoDB module for the serverless infrastructure.

This module creates DynamoDB tables with the correct schema (symbol + timestamp)
and enables contributor insights as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class DynamoDBStack:
    """
    Manages DynamoDB tables for the serverless infrastructure.
    
    Model failure fix: Uses correct partition key (symbol) and sort key (timestamp).
    Enables contributor insights as required.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize DynamoDB Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.tables = {}
        
        # Create main data table
        self.data_table = self._create_data_table()
    
    def _create_data_table(self) -> aws.dynamodb.Table:
        """
        Create DynamoDB table with correct schema.
        
        Model failure fix:
        - Partition key: symbol (not id)
        - Sort key: timestamp
        - Enables contributor insights
        
        Returns:
            DynamoDB Table resource
        """
        table_name = self.config.get_resource_name("data-table", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create table with correct schema
        table = aws.dynamodb.Table(
            "data-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",  # On-demand for serverless
            hash_key=self.config.dynamodb_partition_key,  # symbol
            range_key=self.config.dynamodb_sort_key,  # timestamp
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_partition_key,
                    type="S"  # String
                ),
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_sort_key,
                    type="N"  # Number (Unix timestamp)
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Enable contributor insights (model failure fix)
        if self.config.enable_contributor_insights:
            aws.dynamodb.ContributorInsights(
                "data-table-insights",
                table_name=table.name,
                opts=opts
            )
        
        self.tables['data'] = table
        return table
    
    def get_table_name(self) -> Output[str]:
        """Get data table name."""
        return self.data_table.name
    
    def get_table_arn(self) -> Output[str]:
        """Get data table ARN."""
        return self.data_table.arn

