"""
DynamoDB tables for the event processing pipeline.

This module creates individual DynamoDB tables per region with AWS-managed encryption.
Global Tables are not used as each region processes events independently,
with EventBridge handling cross-region event routing rather than DynamoDB replication.
"""

from typing import Dict, List

import pulumi
from aws_provider import AWSProviderManager
from pulumi_aws import dynamodb

from config import PipelineConfig


class DynamoDBStack:
    """Creates DynamoDB Global Tables for event processing."""
    
    def __init__(self, config: PipelineConfig, provider_manager: AWSProviderManager):
        self.config = config
        self.provider_manager = provider_manager
        self.tables: Dict[str, dynamodb.Table] = {}
        self.global_table: dynamodb.GlobalTable = None
        
        self._create_tables()
        # NOTE: Global Tables not needed for this event processing pipeline
        # - Each region processes events independently (no cross-region data consistency required)
        # - EventBridge handles cross-region event routing, not DynamoDB replication
        # - Individual tables provide better performance and cost optimization
        # - Eventual consistency is sufficient for trading event processing

    def _create_tables(self):
        """Create DynamoDB tables in each region."""
        for region in self.config.regions:
            table_name = self.config.get_resource_name('trading-events', region)
            
            # Define attributes
            attributes = [
                dynamodb.TableAttributeArgs(
                    name="PK",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="SK", 
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="GSI1PK",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="GSI1SK",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="GSI2PK",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="GSI2SK",
                    type="S"
                )
            ]
            
            # Define global secondary indexes
            global_secondary_indexes = [
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="GSI1",
                    hash_key="GSI1PK",
                    range_key="GSI1SK",
                    projection_type="ALL",
                    read_capacity=self.config.dynamodb_read_capacity,
                    write_capacity=self.config.dynamodb_write_capacity
                ),
                dynamodb.TableGlobalSecondaryIndexArgs(
                    name="GSI2", 
                    hash_key="GSI2PK",
                    range_key="GSI2SK",
                    projection_type="ALL",
                    read_capacity=self.config.dynamodb_read_capacity,
                    write_capacity=self.config.dynamodb_write_capacity
                )
            ]
            
            # Create table with AWS-managed CMK encryption
            self.tables[region] = dynamodb.Table(
                f"trading-events-{region}",
                name=table_name,
                billing_mode=self.config.dynamodb_billing_mode,
                hash_key="PK",
                range_key="SK",
                attributes=attributes,
                global_secondary_indexes=global_secondary_indexes,
            server_side_encryption=dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
                point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
                    enabled=True
                ),
                ttl=dynamodb.TableTtlArgs(
                    attribute_name="TTL",
                    enabled=True
                ),
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_global_table(self):
        """Create DynamoDB Global Table for cross-region replication."""
        # Get replica configurations
        replicas = []
        for region in self.config.regions:
            replicas.append(dynamodb.GlobalTableReplicaArgs(
                region_name=region
            ))
        
        # Create Global Table - depends on tables being created first
        # Use the same name as the primary table for Global Table
        primary_table_name = self.config.get_resource_name('trading-events', self.config.primary_region)
        
        self.global_table = dynamodb.GlobalTable(
            "trading-events-global",
            name=primary_table_name,
            replicas=replicas,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_primary_provider(),
                depends_on=list(self.tables.values())
            )
        )
    
    def get_table_arn(self, region: str) -> pulumi.Output[str]:
        """Get DynamoDB table ARN for a region."""
        return self.tables[region].arn
    
    def get_table_name(self, region: str) -> pulumi.Output[str]:
        """Get DynamoDB table name for a region."""
        return self.tables[region].name
    
    def get_global_table_arn(self) -> pulumi.Output[str]:
        """Get Global Table ARN."""
        return self.global_table.arn
