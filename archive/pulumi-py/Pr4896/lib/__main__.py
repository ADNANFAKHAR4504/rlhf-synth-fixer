"""
Pulumi program entrypoint for IoT sensor data processing infrastructure.

This file instantiates the TapStack component with the required configuration.
"""

import os
import pulumi
from tap_stack import TapStack, TapStackArgs

# Get environment suffix from environment variable
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "synth6711828194")

# Create the stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags={
        "Environment": environment_suffix,
        "Project": "IoT-Sensor-Processing",
        "ManagedBy": "Pulumi"
    }
)

# Instantiate the TapStack component
tap_stack = TapStack(
    name=f"TapStack",
    args=stack_args
)
