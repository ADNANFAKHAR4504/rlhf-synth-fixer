"""
Integration test for the TapStack. Deploys the infrastructure,
checks the public endpoint, and then destroys it.
"""
import subprocess
import time
import json
import os
import requests

ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
STACK_NAME = f"TapStack{ENVIRONMENT_SUFFIX}"

def run_command(command):
  """Helper function to run shell commands and handle errors."""
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
  """
  Deploys the stack, verifies the endpoint, and destroys the stack.
  """
  try:
    print(f"--- Selecting Pulumi Stack: {STACK_NAME} ---")
    run_command(f"pulumi stack select {STACK_NAME} --create")

    print("--- Deploying Infrastructure ---")
    run_command("pulumi up --yes --skip-preview")

    print("--- Fetching ALB DNS Name ---")
    alb_dns_json = run_command("pulumi stack output alb_dns_name --json")
    alb_dns = json.loads(alb_dns_json)
    url = f"http://{alb_dns}"

    print(f"--- Testing URL: {url} ---")

    max_retries = 16
    response = None
    for i in range(max_retries):
      try:
        response = requests.get(url, timeout=10)
        print(f"Attempt {i+1}/{max_retries}: Got status code {response.status_code}")
        if response.status_code == 200:
          print("✅ Website is up and running!")
          break
      except requests.exceptions.RequestException as e:
        print(f"Attempt {i+1}/{max_retries}: Website not ready yet ({e})...")

      if i < max_retries - 1:
        time.sleep(15)

    assert response is not None, "Failed to get any response from the server."
    assert response.status_code == 200
    assert "Dual-Stack Web App" in response.text

    print("✅ Integration Test Passed!")

  finally:
    print("--- Destroying Infrastructure ---")
    run_command("pulumi destroy --yes --skip-preview")

if __name__ == "__main__":
  test_integration()