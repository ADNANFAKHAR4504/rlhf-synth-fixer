"""DynamoDB Stack for TapStack Architecture

This module defines the DynamoDB stack responsible for creating 
the DynamoDB table with encryption and GSI for visit logs.
"""

from typing import Optional

from aws_cdk import RemovalPolicy, Tags
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_kms as kms
from constructs import Construct


class DynamoDBStackProps:
  """Properties for DynamoDB Stack"""
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class DynamoDBStack(Construct):
  """DynamoDB Stack for visit logs table"""
  
  def __init__(self, scope: Construct, construct_id: str, props: DynamoDBStackProps):
    super().__init__(scope, construct_id)
    
    # Store environment suffix for potential future use
    self.environment_suffix = props.environment_suffix
    
    # Create KMS key for DynamoDB encryption
    self.dynamodb_kms_key = kms.Key(
      self,
      "DynamoDBEncryptionKey",
      description="KMS key for DynamoDB table encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )
    
    # DynamoDB Table for visit logs with KMS encryption and GSI
    self.table = dynamodb.Table(
      self,
      "VisitsTable",
      partition_key=dynamodb.Attribute(
        name="id",
        type=dynamodb.AttributeType.STRING
      ),
      encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryption_key=self.dynamodb_kms_key,
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
    )
    
    # Add GSI for timestamp-based queries
    self.table.add_global_secondary_index(
      index_name="timestamp-index",
      partition_key=dynamodb.Attribute(
        name="timestamp",
        type=dynamodb.AttributeType.STRING
      ),
      projection_type=dynamodb.ProjectionType.ALL
    )
    
    # Tag table with environment: production
    Tags.of(self.table).add("environment", "production")
