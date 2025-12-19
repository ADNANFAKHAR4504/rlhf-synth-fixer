"""
DynamoDB module for table configuration.

This module creates DynamoDB tables with on-demand billing, point-in-time recovery,
and contributor insights for the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the financial data pipeline.
    
    Creates tables with PITR, contributor insights, and on-demand billing.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        
        self._create_market_data_table()
    
    def _create_market_data_table(self):
        """Create DynamoDB table for market data with symbol and timestamp keys."""
        table_name = self.config.get_resource_name('market-data')
        
        self.market_data_table = aws.dynamodb.Table(
            "market-data-table",
            name=table_name,
            billing_mode=self.config.dynamodb_billing_mode,
            hash_key="symbol",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="symbol",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        aws.dynamodb.ContributorInsights(
            "market-data-table-insights",
            table_name=self.market_data_table.name,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.market_data_table
            )
        )
        
        self.market_data_table_arn = self.market_data_table.arn
        self.market_data_table_name = self.market_data_table.name
    
    def get_table_arn(self) -> Output[str]:
        """Get the market data table ARN."""
        return self.market_data_table_arn
    
    def get_table_name(self) -> Output[str]:
        """Get the market data table name."""
        return self.market_data_table_name




