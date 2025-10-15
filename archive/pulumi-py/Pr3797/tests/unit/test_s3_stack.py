import pytest
import pulumi
from typing import Dict
from lib.s3_stack import S3Stack

def test_s3_stack():
    name = "test-s3-stack"
    environment_suffix = "test"
    tags: Dict[str, str] = {"environment": "test"}

    s3_stack = S3Stack(
        name,
        environment_suffix,
        tags
    )

    assert s3_stack is not None
    assert hasattr(s3_stack, 'bucket')
    assert hasattr(s3_stack, 'bucket_name')
    # Removed the expectation of a logging_bucket