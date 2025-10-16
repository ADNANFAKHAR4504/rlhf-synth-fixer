#!/usr/bin/env python3
"""
Test to verify the config module can be imported.
"""
import os
import sys

# Add lib directory to Python path
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

try:
    from infrastructure.config import PipelineConfig
    print("✅ Config import successful!")
    
    # Try to create a config instance
    config = PipelineConfig()
    print("✅ Config creation successful!")
    print(f"Environment: {config.environment}")
    print(f"Primary region: {config.primary_region}")
    print(f"Regions: {config.regions}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
