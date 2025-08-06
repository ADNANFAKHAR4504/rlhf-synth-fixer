import subprocess
import requests
import time
import json

STACK_NAME = "TapStackpr430"

def run_command(command):
    """Helper function to run shell commands."""
    process = subprocess.run(command, shell=True, capture_output=True, text=True)
    if process.returncode != 0:
        print(f"Error running command: {command}")
        print(process.stderr)
        raise Exception(f"Command failed: {command}")
    print(process.stdout)
    return process.stdout

def test_integration():
    """
    Deploys the stack, checks the ALB endpoint, and destroys the stack.
    """
    try:
        print("--- Deploying Infrastructure ---")
        run_command("pulumi up --yes --skip-preview")

        print("--- Fetching ALB DNS Name ---")
        alb_dns_json = run_command(f"pulumi stack output alb_dns_name --json")
        alb_dns = json.loads(alb_dns_json)
        url = f"http://{alb_dns}"
        
        print(f"--- Testing URL: {url} ---")
        
        time.sleep(60)

        response = requests.get(url, timeout=30)
        
        assert response.status_code == 200
        assert "Dual-Stack Web Application" in response.text
        
        print("✅ Integration Test Passed!")

    finally:
        print("--- Destroying Infrastructure ---")
        run_command("pulumi destroy --yes --skip-preview")

if __name__ == "__main__":
    test_integration()