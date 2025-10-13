"""
DynamoDB module for the serverless infrastructure.

This module creates DynamoDB tables with on-demand capacity mode and
AWS-managed encryption, addressing the model failures about encryption semantics.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class DynamoDBStack:
    """
    DynamoDB stack for managing the primary data store.
    
    Creates DynamoDB tables with:
    - On-demand capacity mode
    - AWS-managed encryption (explicitly configured)
    - Proper indexing for efficient queries
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create main application table
        self.main_table = self._create_main_table()
        
        # Create audit log table
        self.audit_table = self._create_audit_table()
    
    def _create_main_table(self):
        """Create the main application DynamoDB table."""
        table_name = f"{self.config.get_resource_name('dynamodb-table', 'main')}-{self.config.environment}"
        
        # Define table attributes
        attributes = [
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S"
            ),
            aws.dynamodb.TableAttributeArgs(
                name="created_at",
                type="S"
            ),
            aws.dynamodb.TableAttributeArgs(
                name="status",
                type="S"
            )
        ]
        
        # Define global secondary indexes
        global_secondary_indexes = [
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="status-created_at-index",
                hash_key="status",
                range_key="created_at",
                projection_type="ALL"
            )
        ]
        
        # Create the table with explicit AWS-managed encryption
        table = aws.dynamodb.Table(
            table_name,
            attributes=attributes,
            hash_key="id",
            billing_mode=self.config.dynamodb_billing_mode,
            global_secondary_indexes=global_secondary_indexes,
            # Explicitly configure AWS-managed encryption
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=None  # AWS-managed key
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return table
    
    def _create_audit_table(self):
        """Create audit log DynamoDB table."""
        table_name = f"{self.config.get_resource_name('dynamodb-table', 'audit')}-{self.config.environment}"
        
        # Define table attributes for audit logs
        attributes = [
            aws.dynamodb.TableAttributeArgs(
                name="timestamp",
                type="S"
            ),
            aws.dynamodb.TableAttributeArgs(
                name="event_type",
                type="S"
            )
        ]
        
        # Define global secondary index for audit queries
        global_secondary_indexes = [
            aws.dynamodb.TableGlobalSecondaryIndexArgs(
                name="event_type-timestamp-index",
                hash_key="event_type",
                range_key="timestamp",
                projection_type="ALL"
            )
        ]
        
        # Create the audit table
        table = aws.dynamodb.Table(
            table_name,
            attributes=attributes,
            hash_key="timestamp",
            billing_mode=self.config.dynamodb_billing_mode,
            global_secondary_indexes=global_secondary_indexes,
            # Explicitly configure AWS-managed encryption
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=None  # AWS-managed key
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return table
    
    def get_main_table_name(self) -> pulumi.Output[str]:
        """Get main table name."""
        return self.main_table.name
    
    def get_main_table_arn(self) -> pulumi.Output[str]:
        """Get main table ARN."""
        return self.main_table.arn
    
    def get_audit_table_name(self) -> pulumi.Output[str]:
        """Get audit table name."""
        return self.audit_table.name
    
    def get_audit_table_arn(self) -> pulumi.Output[str]:
        """Get audit table ARN."""
        return self.audit_table.arn
