"""Integration tests for TapStack infrastructure."""
import json
import subprocess
import time
import os
try:
    import requests
except ImportError:
    requests = None

ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
PULUMI_ORG = os.environ.get("PULUMI_ORG")
PROJECT = os.environ.get("PULUMI_PROJECT", "TapStack")
STACK = f"TapStack{ENVIRONMENT_SUFFIX}"
FULL_STACK = f"{PULUMI_ORG}/{PROJECT}/{STACK}" if PULUMI_ORG else STACK


def run_command(command: str) -> str:
    """Execute shell command and return output."""
    print(f"Running: {command}")
    result = subprocess.run(
        command, shell=True, capture_output=True, text=True, check=True
    )
    print(result.stdout)
    return result.stdout


def test_infrastructure_deployment():
    """Test complete infrastructure deployment and validation."""
    backend = os.environ.get("PULUMI_BACKEND_URL")
    if backend:
        print(f"--- Logging into Pulumi backend: {backend} ---")
        run_command(f"pulumi login {backend}")

    print(f"--- Selecting Pulumi Stack: {FULL_STACK} ---")
    run_command(f"pulumi stack select {FULL_STACK} --create")

    print("--- Cancelling any pending operations ---")
    run_command("pulumi cancel --yes")

    print("--- Deploying Infrastructure ---")
    run_command("pulumi up --yes --skip-preview")

    print("--- Fetching Stack Outputs ---")
    outputs = _get_stack_outputs()
    
    # Validate core outputs exist
    assert "alb_dns_name" in outputs
    assert "application_url" in outputs
    assert "vpc_id" in outputs
    
    alb_dns = outputs["alb_dns_name"]
    app_url = outputs["application_url"]
    
    print(f"Application URL: {app_url}")
    
    # Test application accessibility
    if requests:
        _test_application_health(app_url)
    else:
        print("Requests not available, skipping HTTP tests")


def _get_stack_outputs() -> dict:
    """Get all stack outputs as dictionary."""
    output_json = run_command("pulumi stack output --json")
    return json.loads(output_json)


def _test_application_health(url: str):
    """Test application health and responsiveness."""
    print(f"--- Testing Application Health: {url} ---")
    
    # Wait for ALB to be ready
    max_retries = 12
    retry_delay = 30
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                print("✅ Application is healthy!")
                assert "Dual-Stack Web Application" in response.text
                return
            else:
                print(f"Attempt {attempt + 1}: Got status {response.status_code}")
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1}: Request failed - {e}")
        
        if attempt < max_retries - 1:
            print(f"Waiting {retry_delay} seconds before retry...")
            time.sleep(retry_delay)
    
    raise AssertionError("Application failed to become healthy within timeout")


def test_infrastructure_outputs():
    """Test that all expected outputs are present and valid."""
    outputs = _get_stack_outputs()
    
    # Required outputs
    required_outputs = [
        "vpc_id", "vpc_ipv4_cidr", "vpc_ipv6_cidr",
        "public_subnet_ids", "availability_zones",
        "ec2_instance_ids", "ec2_public_ips", "ec2_ipv6_addresses",
        "alb_arn", "alb_dns_name", "alb_zone_id",
        "target_group_arn", "application_url",
        "deployment_summary", "deployment_instructions"
    ]
    
    for output in required_outputs:
        assert output in outputs, f"Missing required output: {output}"
    
    # Validate specific output formats
    assert outputs["vpc_ipv4_cidr"] == "10.0.0.0/16"
    assert outputs["vpc_ipv6_cidr"].endswith("::/56")
    assert len(outputs["public_subnet_ids"]) == 2
    assert len(outputs["ec2_instance_ids"]) == 2
    assert outputs["alb_dns_name"].endswith(".elb.amazonaws.com")
    assert outputs["application_url"].startswith("http://")
    
    # Validate deployment summary
    summary = outputs["deployment_summary"]
    assert summary["dual_stack_enabled"] is True
    assert summary["high_availability"] is True
    assert summary["monitoring_enabled"] is True


if __name__ == "__main__":
    test_infrastructure_deployment()
    test_infrastructure_outputs()
    print("✅ All integration tests passed!")
