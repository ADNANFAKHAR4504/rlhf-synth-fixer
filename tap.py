#!/usr/bin/env python
import sys
import os
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def extract_outputs():
    """Extract outputs from Terraform state and write to flat-outputs.json."""
    project_root = Path(__file__).resolve().parent
    
    # Run the extraction script
    extract_script = project_root / "bin" / "extract-cdktf-outputs.py"
    if extract_script.exists():
        result = subprocess.run([sys.executable, str(extract_script)], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return result.returncode == 0
    
    # Fallback: try to extract from state files directly
    print("🔍 Searching for Terraform state files...")
    cdktf_out = project_root / "cdktf.out"
    outputs = {}
    
    for state_file in cdktf_out.rglob("terraform.tfstate"):
        print(f"   Found: {state_file}")
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
            if "outputs" in state:
                for key, value in state["outputs"].items():
                    if isinstance(value, dict) and "value" in value:
                        outputs[key] = value["value"]
                    else:
                        outputs[key] = value
        except Exception as e:
            print(f"   Warning: Could not parse {state_file}: {e}")
    
    if outputs:
        # Write to expected locations
        for out_dir in ["cfn-outputs", "cdk-outputs"]:
            out_path = project_root / out_dir
            out_path.mkdir(parents=True, exist_ok=True)
            out_file = out_path / "flat-outputs.json"
            with open(out_file, 'w') as f:
                json.dump(outputs, f, indent=2)
            print(f"✅ Wrote {len(outputs)} outputs to {out_file}")
        return True
    
    print("❌ No outputs found in state files")
    return False


def main():
    """Main entry point for CDKTF app."""
    # Check for special commands
    if len(sys.argv) > 1:
        if sys.argv[1] in ("--extract-outputs", "extract-outputs", "outputs"):
            success = extract_outputs()
            sys.exit(0 if success else 1)
    
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


if __name__ == "__main__":
    main()
