#!/usr/bin/env python
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

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

# Package Lambda function before synthesis
print("📦 Packaging Lambda function...")
script_dir = Path(__file__).parent
lambda_source_dir = script_dir / "lib" / "lambda"
lambda_zip_path = script_dir / "lambda_function.zip"
package_script = script_dir / "scripts" / "package_lambda.py"

# Remove old zip if exists
if lambda_zip_path.exists():
    lambda_zip_path.unlink()
    print(f"🗑️  Removed old Lambda package: {lambda_zip_path}")

# Run the packaging script
result = subprocess.run(
    [sys.executable, str(package_script), str(lambda_source_dir), str(lambda_zip_path)],
    check=True,
    capture_output=True,
    text=True
)
print(result.stdout)

if not lambda_zip_path.exists():
    print(f"❌ Failed to create Lambda package: {lambda_zip_path}")
    sys.exit(1)

print(f"✅ Lambda function packaged successfully: {lambda_zip_path}")

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()