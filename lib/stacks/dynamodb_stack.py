"""dynamodb_stack.py
This module defines the DynamoDB stack for request metadata storage.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    RemovalPolicy,
    NestedStack,
    aws_dynamodb as dynamodb,
)
from constructs import Construct


class DynamoDBStackProps:
    """
    DynamoDBStackProps defines the properties for the DynamoDB stack.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        
    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix


class DynamoDBStack(cdk.Stack):
    """
    DynamoDB stack for request metadata storage.
    
    This stack creates:
    - DynamoDB table for logging request metadata with request_id as partition key
    """
    
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[DynamoDBStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix
        environment_suffix = props.environment_suffix if props else 'dev'
        
        # DynamoDB table for logging request metadata
        self.table = dynamodb.Table(
            self, "RequestTable",
            table_name=f"tap-{environment_suffix}-requests",
            partition_key=dynamodb.Attribute(
                name="request_id",
                type=dynamodb.AttributeType.STRING
            ),
            removal_policy=RemovalPolicy.DESTROY,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )


class NestedDynamoDBStack(NestedStack):
    """
    Nested DynamoDB stack wrapper.
    
    This nested stack wraps the DynamoDB stack to be used within the main TapStack.
    """
    
    def __init__(self, scope, construct_id, props=None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        # Use the original DynamoDBStack logic here
        self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
        self.table = self.ddb_stack.table