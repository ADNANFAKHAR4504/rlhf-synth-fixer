"""Pulumi entry point for multi-environment infrastructure deployment."""
import pulumi
from lib.tap_stack import TapStack

# Initialize and deploy the stack
stack = TapStack()
