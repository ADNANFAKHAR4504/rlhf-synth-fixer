"""
Main entry point for the Pulumi TAP Stack.
"""
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Create stack args
args = TapStackArgs(
    environment_suffix=pulumi.get_stack(),
    tags={
        "Project": "TAP",
        "ManagedBy": "Pulumi",
        "Environment": pulumi.get_stack()
    }
)

# Create the stack
stack = TapStack("tap-stack", args)

# Export stack outputs
pulumi.export("stack_name", "tap-stack")
pulumi.export("environment", pulumi.get_stack())
