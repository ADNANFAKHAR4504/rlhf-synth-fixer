"""Utility functions for tests"""

import json
import os


def load_flat_outputs():
  """
  Load CloudFormation outputs from flat-outputs.json file.

  Returns:
      dict: CloudFormation outputs as a dictionary or empty dict if file doesn't exist
  """
  base_dir = os.path.dirname(os.path.abspath(__file__))
  flat_outputs_path = os.path.join(
      base_dir, '..', 'cfn-outputs', 'flat-outputs.json'
  )

  if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
      flat_outputs = f.read()
  else:
    flat_outputs = '{}'

  return json.loads(flat_outputs)
