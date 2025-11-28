#!/usr/bin/env python
"""CDKTF Application Entry Point"""

import sys
from pathlib import Path

# Add parent directory to path so we can import lib
sys.path.insert(0, str(Path(__file__).parent.parent))

from cdktf import App
from lib.transaction_api_stack import TransactionApiStack

app = App()
TransactionApiStack(app, "TransactionApiStack")
app.synth()
