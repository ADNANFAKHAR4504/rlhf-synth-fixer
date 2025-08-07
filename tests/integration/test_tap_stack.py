import json
import subprocess
import time
import os
import requests

from lib import tap_stack

ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
STACK_NAME = f"{tap_stack.project_name}-{ENVIRONMENT_SUFFIX}"

def run_command(command):
  print(f"Running: {command}")
  process = subprocess.run(
    command,
    shell=True,
    capture_output=True,
    text=True,
    check=True
  )
  print(process.stdout)
  return process.stdout

def test_integration():
  try:
    print(f"--- Selecting Pulumi Stack: {STACK_NAME} ---")
    run_command(f"pulumi stack select {STACK_NAME} --create")

    print("--- Deploying Infrastructure ---")
    run_command("pulumi up --yes --skip-preview --refresh")

    print("--- Fetching Stack Outputs ---")
    alb_dns_json = run_command("pulumi stack output alb_dns_name --json")
  finally:
    print("--- Destroying Infrastructure ---")
    run_command("pulumi destroy --yes --skip-preview")