#!/usr/bin/env python3

"""
AWS Nova Model Breaking - Infrastructure as Code
Main application entry point for CDKTF deployment

This file serves as the entry point for the CDKTF application,
orchestrating the deployment of AWS infrastructure components.
"""

from cdktf import App
from lib.tap_stack import TapStack


def main():
    """
    Main function to initialize and synthesize the CDKTF application.
    
    Creates the CDKTF app and instantiates the AWS VPC infrastructure stack
    with all required components for the Nova development environment.
    """
    # Initialize the CDKTF application
    app = App()
    
    # Create the AWS VPC infrastructure stack
    TapStack(
        app, 
        "aws-nova-vpc-infrastructure",
        description="AWS VPC infrastructure for Nova Model Breaking project"
    )
    
    # Synthesize the Terraform configuration
    app.synth()


if __name__ == "__main__":
    main()