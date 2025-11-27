#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Run cleanup of orphaned resources before deployment
# This ensures a clean slate for Terraform to avoid ResourceAlreadyExists errors
def cleanup_orphaned_resources():
    """Clean up orphaned AWS resources from previous failed deployments."""
    import subprocess

    cleanup_script = os.path.join(os.path.dirname(__file__), 'lib', 'cleanup_resources.py')

    # Only run cleanup in CI/CD or when explicitly requested
    if os.getenv('CI') or os.getenv('RUN_CLEANUP', 'false').lower() == 'true':
        print("🧹 Running pre-deployment cleanup...")
        try:
            result = subprocess.run(
                [sys.executable, cleanup_script],
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode == 0:
                print(result.stdout)
            else:
                print("⚠️ Cleanup encountered issues (may be safe to continue):")
                print(result.stderr)
        except Exception as e:
            print(f"⚠️ Cleanup script failed: {e}")
            print("Continuing with deployment...")
    else:
        print("ℹ️ Skipping cleanup (not in CI environment)")

# Run cleanup before synthesis
cleanup_orphaned_resources()

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix
)

# Synthesize the app to generate the Terraform configuration
app.synth()