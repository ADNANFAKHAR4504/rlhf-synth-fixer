"""tap_stack.py
Main CDK stack for the serverless file processing system.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from .file_processing_stack import FileProcessingStack, FileProcessingStackProps


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stack for file processing resources
        class NestedFileProcessingStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.file_processing = FileProcessingStack(self, "Resource", props=props)

        processing_props = FileProcessingStackProps(
            environment_suffix=environment_suffix
        )

        file_processing_stack = NestedFileProcessingStack(
            self,
            f"FileProcessingStack{environment_suffix}",
            props=processing_props
        )
