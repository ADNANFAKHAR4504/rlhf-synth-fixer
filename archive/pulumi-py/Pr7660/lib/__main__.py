#!/usr/bin/env python3
"""
Alternative entry point for Pulumi using __main__.py convention.

This file allows running the Pulumi program using the standard __main__.py pattern.
It imports and executes the same logic as tap.py.
"""
# Import the tap module to execute its stack definition
import tap  # pylint: disable=unused-import
