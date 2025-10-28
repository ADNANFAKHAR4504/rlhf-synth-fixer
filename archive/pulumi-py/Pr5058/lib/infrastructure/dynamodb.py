"""
DynamoDB table management for serverless application.

This module creates DynamoDB tables with proper configuration
including streams, billing mode, and encryption.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class DynamoDBStack(pulumi.ComponentResource):
    """
    Manages DynamoDB tables for the serverless application.
    
    Creates tables with:
    - Configurable billing mode (PAY_PER_REQUEST or PROVISIONED)
    - DynamoDB Streams for event-driven processing
    - Server-side encryption
    - Point-in-time recovery
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize DynamoDB stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:dynamodb:DynamoDBStack",
            config.get_resource_name("dynamodb"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        
        # Create items table
        self.items_table = self._create_items_table()
        
        self.register_outputs({
            "items_table_name": self.items_table.name,
            "items_table_arn": self.items_table.arn,
        })
    
    def _create_items_table(self) -> aws.dynamodb.Table:
        """
        Create the main items table.
        
        Schema:
        - Partition key: item_id (String)
        - Sort key: timestamp (Number)
        - GSI: status-timestamp-index for querying by status
        
        Returns:
            DynamoDB Table resource
        """
        # Build table configuration
        table_config = {
            "resource_name": self.config.get_dynamodb_table_name("items"),
            "name": self.config.get_dynamodb_table_name("items"),
            "hash_key": "item_id",
            "range_key": "timestamp",
            "attributes": [
                aws.dynamodb.TableAttributeArgs(
                    name="item_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="status",
                    type="S"
                ),
            ],
            "global_secondary_indexes": [
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="status-timestamp-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL",
                )
            ],
            "tags": self.config.get_common_tags(),
            "opts": pulumi.ResourceOptions(parent=self, provider=self.provider)
        }
        
        # Add billing mode configuration
        if self.config.dynamodb_billing_mode == "PROVISIONED":
            table_config["billing_mode"] = "PROVISIONED"
            table_config["read_capacity"] = self.config.dynamodb_read_capacity
            table_config["write_capacity"] = self.config.dynamodb_write_capacity
            # GSI also needs capacity for PROVISIONED mode
            table_config["global_secondary_indexes"][0].read_capacity = self.config.dynamodb_read_capacity
            table_config["global_secondary_indexes"][0].write_capacity = self.config.dynamodb_write_capacity
        else:
            table_config["billing_mode"] = "PAY_PER_REQUEST"
        
        # Add stream configuration if enabled
        if self.config.enable_dynamodb_streams:
            table_config["stream_enabled"] = True
            table_config["stream_view_type"] = "NEW_AND_OLD_IMAGES"
        
        # Enable point-in-time recovery
        table_config["point_in_time_recovery"] = aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        )
        
        # Enable server-side encryption
        table_config["server_side_encryption"] = aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True
        )
        
        return aws.dynamodb.Table(**table_config)

