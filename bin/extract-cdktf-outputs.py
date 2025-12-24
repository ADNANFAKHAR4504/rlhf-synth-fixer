#!/usr/bin/env python3
"""
Extract CDKTF outputs from terraform state and write to output files.

This script is a fallback for when 'cdktf output --outputs-file' fails.
It reads the terraform state directly and writes outputs to the expected
locations for the CI/CD pipeline.

Usage:
    python bin/extract-cdktf-outputs.py
    
    # Or with custom paths:
    python bin/extract-cdktf-outputs.py --state-dir cdktf.out/stacks/tap-serverless-stack

The script will:
1. Find terraform state files in cdktf.out/stacks/*/
2. Extract outputs from the state
3. Write flattened outputs to cfn-outputs/flat-outputs.json and cdk-outputs/flat-outputs.json
"""

import json
import os
import sys
from pathlib import Path


def find_state_files(base_dir: Path) -> list:
    """Find all terraform.tfstate files in the stacks directory."""
    state_files = []
    stacks_dir = base_dir / "cdktf.out" / "stacks"
    
    if stacks_dir.exists():
        for stack_dir in stacks_dir.iterdir():
            if stack_dir.is_dir():
                state_file = stack_dir / "terraform.tfstate"
                if state_file.exists():
                    state_files.append(state_file)
    
    return state_files


def extract_outputs_from_state(state_file: Path) -> dict:
    """Extract outputs from a terraform state file."""
    outputs = {}
    
    try:
        with open(state_file, 'r') as f:
            state = json.load(f)
        
        # Terraform state v4 format
        if 'outputs' in state:
            for key, value in state['outputs'].items():
                if isinstance(value, dict) and 'value' in value:
                    outputs[key] = value['value']
                else:
                    outputs[key] = value
    except (json.JSONDecodeError, IOError) as e:
        print(f"Warning: Could not read state file {state_file}: {e}", file=sys.stderr)
    
    return outputs


def write_outputs(outputs: dict, base_dir: Path) -> None:
    """Write outputs to the expected output file locations."""
    cfn_outputs_dir = base_dir / "cfn-outputs"
    cdk_outputs_dir = base_dir / "cdk-outputs"
    
    # Create directories if they don't exist
    cfn_outputs_dir.mkdir(parents=True, exist_ok=True)
    cdk_outputs_dir.mkdir(parents=True, exist_ok=True)
    
    # Write outputs to both locations
    output_content = json.dumps(outputs, indent=2)
    
    cfn_file = cfn_outputs_dir / "flat-outputs.json"
    cdk_file = cdk_outputs_dir / "flat-outputs.json"
    
    with open(cfn_file, 'w') as f:
        f.write(output_content)
    print(f"✅ Wrote {len(outputs)} outputs to {cfn_file}")
    
    with open(cdk_file, 'w') as f:
        f.write(output_content)
    print(f"✅ Wrote {len(outputs)} outputs to {cdk_file}")


def main():
    """Main function to extract and write CDKTF outputs."""
    # Determine the project root
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    # Handle command line argument for custom state directory
    if len(sys.argv) > 2 and sys.argv[1] == '--state-dir':
        state_dir = Path(sys.argv[2])
        if state_dir.is_absolute():
            state_files = [state_dir / "terraform.tfstate"]
        else:
            state_files = [project_root / state_dir / "terraform.tfstate"]
        state_files = [f for f in state_files if f.exists()]
    else:
        state_files = find_state_files(project_root)
    
    if not state_files:
        print("❌ No terraform state files found in cdktf.out/stacks/*/", file=sys.stderr)
        print("   Make sure 'cdktf deploy' has been run successfully.", file=sys.stderr)
        sys.exit(1)
    
    print(f"📂 Found {len(state_files)} state file(s)")
    
    # Extract outputs from all state files
    all_outputs = {}
    for state_file in state_files:
        print(f"   Processing: {state_file}")
        outputs = extract_outputs_from_state(state_file)
        all_outputs.update(outputs)
    
    if not all_outputs:
        print("❌ No outputs found in terraform state", file=sys.stderr)
        sys.exit(1)
    
    print(f"\n📊 Extracted {len(all_outputs)} outputs:")
    for key, value in all_outputs.items():
        # Truncate long values for display
        display_value = str(value)
        if len(display_value) > 60:
            display_value = display_value[:57] + "..."
        print(f"   {key}: {display_value}")
    
    print()
    write_outputs(all_outputs, project_root)
    print("\n✅ Output extraction complete!")


if __name__ == "__main__":
    main()

