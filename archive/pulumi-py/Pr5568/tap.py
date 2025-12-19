"""
tap.py

Main entry point for the Pulumi program.

This module instantiates the TapStack component resource,
which orchestrates all infrastructure components.
"""

import os

from lib.tap_stack import TapStack, TapStackArgs

environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

stack = TapStack(
    'serverless-stack',
    TapStackArgs(
        environment_suffix=environment_suffix
    )
)
