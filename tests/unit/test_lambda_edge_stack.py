import pytest
import pulumi
from typing import Dict
from lib.lambda_edge_stack import LambdaEdgeStack

def test_lambda_edge_stack():
    name = "test-lambda-edge"
    environment_suffix = "test"
    dynamodb_table_name = pulumi.Output.from_input("test-table")
    tags: Dict[str, str] = {"environment": "test"}

    lambda_edge_stack = LambdaEdgeStack(
        name,
        environment_suffix,
        dynamodb_table_name,
        tags
    )

    assert lambda_edge_stack is not None
    assert hasattr(lambda_edge_stack, 'viewer_request_function')
    assert hasattr(lambda_edge_stack, 'origin_response_function')
    assert hasattr(lambda_edge_stack, 'viewer_request_function_qualified_arn')
    assert hasattr(lambda_edge_stack, 'origin_response_function_qualified_arn')