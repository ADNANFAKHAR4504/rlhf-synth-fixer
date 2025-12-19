#!/usr/bin/env python
import sys
import os
import shutil
import zipfile
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack


def create_lambda_deployment_package():
    """Create Lambda deployment package if it doesn't exist"""
    zip_path = "lambda_functions.zip"
    if not os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file in os.listdir("lib/lambda"):
                if file.endswith('.py'):
                    file_path = os.path.join("lib/lambda", file)
                    arcname = os.path.join("lambda", file)
                    zf.write(file_path, arcname)
        print(f"Created Lambda deployment package: {zip_path}")
    return zip_path


def copy_lambda_to_output(environment_suffix):
    """Copy Lambda zip to Terraform output directory"""
    src = "lambda_functions.zip"
    if not os.path.exists(src):
        return

    # Determine output directory
    stack_name = f"TapStack{environment_suffix}"
    output_dir = f"cdktf.out/stacks/{stack_name}"

    if os.path.exists(output_dir):
        dest = os.path.join(output_dir, src)
        shutil.copy2(src, dest)
        print(f"Copied Lambda package to: {dest}")

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

# Create Lambda deployment package before synthesis
create_lambda_deployment_package()

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

# Copy Lambda package to output directory for Terraform validation
copy_lambda_to_output(environment_suffix)
