"""
DynamoDB module for the serverless infrastructure.

This module creates DynamoDB tables with proper configuration,
indexes, and encryption for data storage.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import dynamodb

from .config import InfrastructureConfig


class DynamoDBStack:
    """
    DynamoDB stack for managing data storage.
    
    Creates DynamoDB tables with proper configuration, indexes,
    and encryption for secure data storage.
    """
    
    def __init__(self, config: InfrastructureConfig, provider: Optional[Any] = None):
        """
        Initialize DynamoDB stack.
        
        Args:
            config: Infrastructure configuration
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        
        # Create main application table
        self._create_main_table()
        
        # Create file metadata table
        self._create_file_metadata_table()
    
    def _create_main_table(self):
        """Create main application DynamoDB table."""
        table_config = self.config.get_dynamodb_config('main')
        
        self.main_table = dynamodb.Table(
            table_config['table_name'],
            name=table_config['table_name'],
            billing_mode=table_config['billing_mode'],
            hash_key='id',
            attributes=[
                {
                    'name': 'id',
                    'type': 'S'
                },
                {
                    'name': 'created_at',
                    'type': 'S'
                }
            ],
            global_secondary_indexes=[
                {
                    'name': 'created-at-index',
                    'hash_key': 'created_at',
                    'projection_type': 'ALL'
                }
            ],
            server_side_encryption={
                'enabled': self.config.enable_encryption
            },
            point_in_time_recovery={
                'enabled': True
            },
            tags=table_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_file_metadata_table(self):
        """Create file metadata DynamoDB table for S3 object tracking."""
        file_metadata_config = self.config.get_dynamodb_config('file-metadata')
        
        self.file_metadata_table = dynamodb.Table(
            file_metadata_config['table_name'],
            name=file_metadata_config['table_name'],
            billing_mode=file_metadata_config['billing_mode'],
            hash_key='file_key',
            attributes=[
                {
                    'name': 'file_key',
                    'type': 'S'
                },
                {
                    'name': 'bucket',
                    'type': 'S'
                },
                {
                    'name': 'last_modified',
                    'type': 'S'
                }
            ],
            global_secondary_indexes=[
                {
                    'name': 'bucket-index',
                    'hash_key': 'bucket',
                    'range_key': 'last_modified',
                    'projection_type': 'ALL'
                }
            ],
            server_side_encryption={
                'enabled': self.config.enable_encryption
            },
            point_in_time_recovery={
                'enabled': True
            },
            tags=file_metadata_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """
        Get DynamoDB stack outputs.
        
        Returns:
            Dictionary containing DynamoDB table outputs
        """
        return {
            "main_table_name": self.main_table.name,
            "main_table_arn": self.main_table.arn,
            "main_table_stream_arn": self.main_table.stream_arn,
            "file_metadata_table_name": self.file_metadata_table.name,
            "file_metadata_table_arn": self.file_metadata_table.arn,
            "file_metadata_table_stream_arn": self.file_metadata_table.stream_arn
        }
