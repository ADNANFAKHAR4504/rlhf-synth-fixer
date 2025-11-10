#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the fraud detection
pipeline infrastructure. The stack uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""

# Import the tap_stack module which defines all infrastructure resources
import lib.tap_stack  # pylint: disable=unused-import
