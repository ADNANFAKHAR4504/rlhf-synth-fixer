"""s3_stack.py
This module defines the S3 stack for request payload storage.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    RemovalPolicy,
    NestedStack,
    aws_s3 as s3,
)
from constructs import Construct


class S3StackProps:
    """
    S3StackProps defines the properties for the S3 stack.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        
    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """
    
    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix


class S3Stack(cdk.Stack):
    """
    S3 stack for request payload storage.
    
    This stack creates:
    - S3 bucket for storing request payloads
    """
    
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[S3StackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix
        environment_suffix = props.environment_suffix if props else 'dev'
        
        # S3 bucket for storing request payloads
        self.bucket = s3.Bucket(
            self, "RequestBucket",
            bucket_name=f"tap-{environment_suffix}-bucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            versioned=False,
        )


class NestedS3Stack(NestedStack):
    """
    Nested S3 stack wrapper.
    
    This nested stack wraps the S3 stack to be used within the main TapStack.
    """
    
    def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the original S3Stack logic here
        self.s3_stack = S3Stack(self, "Resource", props=props)
        self.bucket = self.s3_stack.bucket