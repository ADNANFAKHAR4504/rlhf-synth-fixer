import pytest
import pulumi
from typing import Dict
from lib.dynamodb_stack import DynamoDBStack

def test_dynamodb_stack():
    name = "test-dynamodb-stack"
    environment_suffix = "test"
    tags: Dict[str, str] = {"environment": "test"}

    dynamodb_stack = DynamoDBStack(
        name,
        environment_suffix,
        tags
    )

    assert dynamodb_stack is not None
    assert hasattr(dynamodb_stack, 'table')
    assert hasattr(dynamodb_stack, 'table_name')