#!/usr/bin/env python
"""
Payment Processing Infrastructure - Entry Point

This is the main entry point for the CDKTF application that creates
payment webhook processing infrastructure.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import main infrastructure module
from lib.main import app

# Entry point - app.synth() is already called in lib/main.py
if __name__ == "__main__":
    pass