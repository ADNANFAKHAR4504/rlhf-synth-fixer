#!/usr/bin/env python
from constructs import Construct
from cdktf import App
from lib.tap_stack import TapStack
import os


def main():
    """
    Main entry point for CDKTF application

    This creates a multi-region disaster recovery infrastructure for a healthcare platform
    with automatic failover capabilities between us-east-1 and us-west-2.
    """
    app = App()

    # Get environment suffix from environment variable or use default
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    # Create the disaster recovery stack
    TapStack(app, "tap", environment_suffix=environment_suffix)

    app.synth()


if __name__ == "__main__":
    main()
