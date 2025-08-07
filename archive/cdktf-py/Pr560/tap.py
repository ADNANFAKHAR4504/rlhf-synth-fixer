#!/usr/bin/env python3

"""
AWS Production Infrastructure - CDKTF Application Entry Point

This file serves as the entry point for the CDKTF application,
orchestrating the deployment of production-grade AWS infrastructure
components with comprehensive security and high availability.
"""

from cdktf import App

from lib.tap_stack import TapStack


def main():
  """
  Main function to initialize and synthesize the CDKTF application.
  
  Creates the CDKTF app and instantiates the AWS production infrastructure stack
  with all required components including VPC, subnets, security groups,
  Bastion host, and S3 storage with comprehensive security measures.
  """
  # Initialize the CDKTF application
  app = App()
  
  # Create the AWS production infrastructure stack
  TapStack(
    app, 
    "aws-production-infrastructure",
    description="Production-grade AWS infrastructure with Bastion host and security controls"
  )
  
  # Synthesize the Terraform configuration
  app.synth()


if __name__ == "__main__":
  main()
