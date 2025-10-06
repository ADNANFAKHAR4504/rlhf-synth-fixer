"""
Main Pulumi program for the image processing pipeline.
Entry point that orchestrates all infrastructure components.
"""

import pulumi
from infrastructure.main import create_infrastructure

# Create the complete infrastructure
infrastructure = create_infrastructure()
