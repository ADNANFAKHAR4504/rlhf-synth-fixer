#!/usr/bin/env python
import sys
import os
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

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

app = App()

# Create the TapStack with the calculated properties
stack = TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()

# Post-synthesis: Attempt to collect outputs if this is being run after deployment
# This runs when cdktf output is called after deployment
def collect_outputs_post_deployment():
    """Collect Terraform outputs after deployment completes."""
    try:
        project_root = Path(__file__).parent
        stacks_dir = project_root / "cdktf.out" / "stacks"
        
        if not stacks_dir.exists():
            return
        
        # Find all stack directories
        for stack_path in stacks_dir.iterdir():
            if not stack_path.is_dir():
                continue
                
            state_file = stack_path / "terraform.tfstate"
            if not state_file.exists():
                continue
            
            # Found a deployed stack - collect its outputs
            try:
                result = subprocess.run(
                    ["terraform", "output", "-json"],
                    cwd=str(stack_path),
                    capture_output=True,
                    text=True,
                    timeout=10,
                    check=False
                )
                
                if result.returncode != 0 or not result.stdout.strip():
                    continue
                
                # Parse Terraform outputs
                tf_outputs = json.loads(result.stdout)
                
                # Flatten the outputs (Terraform wraps them in {"value": ..., "type": ...})
                flat_outputs = {}
                for key, value in tf_outputs.items():
                    if isinstance(value, dict) and "value" in value:
                        output_value = value["value"]
                        # Parse JSON-encoded strings back to objects for flattening
                        if isinstance(output_value, str):
                            try:
                                output_value = json.loads(output_value)
                            except (json.JSONDecodeError, TypeError):
                                pass
                        flat_outputs[key] = output_value
                    else:
                        flat_outputs[key] = value
                
                if not flat_outputs:
                    continue
                
                # Write outputs to expected locations
                for dir_name in ["cfn-outputs", "cdk-outputs"]:
                    output_dir = project_root / dir_name
                    output_dir.mkdir(parents=True, exist_ok=True)
                    output_file = output_dir / "flat-outputs.json"
                    output_file.write_text(json.dumps(flat_outputs, indent=2))
                
                print(f"✅ Collected {len(flat_outputs)} outputs from {stack_path.name}", file=sys.stderr)
                return  # Success - exit after first stack with outputs
                
            except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception):
                continue
        
        # If we get here, no outputs were collected - create empty files
        for dir_name in ["cfn-outputs", "cdk-outputs"]:
            output_dir = project_root / dir_name
            output_dir.mkdir(parents=True, exist_ok=True)
            (output_dir / "flat-outputs.json").write_text("{}")
            
    except Exception:
        # Silently fail - this is a best-effort collection
        pass

# Run output collection (will only work if state exists)
collect_outputs_post_deployment()
