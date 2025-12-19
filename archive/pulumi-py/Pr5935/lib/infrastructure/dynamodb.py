"""
DynamoDB module for metadata storage.

This module creates DynamoDB tables with KMS encryption and
point-in-time recovery enabled.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class DynamoDBStack:
    """
    Manages DynamoDB tables for metadata storage.
    
    Creates DynamoDB tables with:
    - KMS encryption
    - Point-in-time recovery
    - On-demand billing for auto-scaling
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables = {}
        
        self._create_file_metadata_table()
    
    def _create_file_metadata_table(self):
        """Create the file metadata table."""
        table_name = 'file-metadata'
        resource_name = self.config.get_resource_name(table_name)
        
        dynamodb_key = self.kms_stack.get_key('dynamodb')
        
        table = aws.dynamodb.Table(
            table_name,
            name=resource_name,
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='file_id',
                    type='S'
                )
            ],
            hash_key='file_id',
            billing_mode=self.config.dynamodb_billing_mode,
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=dynamodb_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File metadata storage'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[dynamodb_key])
        )
        
        self.tables[table_name] = table
    
    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Get a DynamoDB table by name.
        
        Args:
            table_name: Name of the table
            
        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(table_name)
    
    def get_table_name(self, table_name: str) -> Output[str]:
        """
        Get the name of a DynamoDB table.
        
        Args:
            table_name: Name of the table
            
        Returns:
            Table name as Output
        """
        table = self.get_table(table_name)
        return table.name if table else None
    
    def get_table_arn(self, table_name: str) -> Output[str]:
        """
        Get the ARN of a DynamoDB table.
        
        Args:
            table_name: Name of the table
            
        Returns:
            Table ARN as Output
        """
        table = self.get_table(table_name)
        return table.arn if table else None

