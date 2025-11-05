"""Main entry point for the Pulumi program."""
import pulumi
from lib.tap_stack import TapStack


def main():
    """Create and configure the transaction monitoring stack."""
    config = pulumi.Config()

    # Get environment suffix from config or use stack name
    environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()

    # Get region from config or use default
    region = config.get("aws:region") or "ap-northeast-1"

    # Create the stack
    stack = TapStack(
        environment_suffix=environment_suffix,
        region=region
    )

    pulumi.log.info(f"Transaction Monitoring System deployed to {region}")


if __name__ == "__main__":
    main()
