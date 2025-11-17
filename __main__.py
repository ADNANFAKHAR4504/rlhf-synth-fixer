"""Pulumi program entry point for serverless fraud detection pipeline."""
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get the Pulumi configuration
config = pulumi.Config()

# Get environment suffix from Pulumi config
environment_suffix = config.get("environmentSuffix") or "dev"

# Create the main infrastructure stack
stack = TapStack(
    f"tap-stack-{environment_suffix}",
    TapStackArgs(environment_suffix=environment_suffix)
)

# The outputs are already exported within the TapStack class
