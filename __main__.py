import pulumi
from lib.tap_stack import TapStack

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Create the IoT monitoring stack
stack = TapStack(environment_suffix)
