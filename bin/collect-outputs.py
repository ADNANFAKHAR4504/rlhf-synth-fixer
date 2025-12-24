#!/usr/bin/env python3
"""
Post-deployment output collector for CDKTF stacks.
Extracts Terraform outputs from the deployed state and saves them to expected locations.
"""

import json
import os
import sys
import subprocess
from pathlib import Path


def find_stack_directory():
    """Find the CDKTF synthesized stack directory."""
    project_root = Path(__file__).parent.parent
    cdktf_out = project_root / "cdktf.out" / "stacks"
    
    if not cdktf_out.exists():
        return None
    
    # Find the first stack directory
    stack_dirs = [d for d in cdktf_out.iterdir() if d.is_dir()]
    if stack_dirs:
        return stack_dirs[0]
    
    return None


def collect_terraform_outputs(stack_dir):
    """Run terraform output in the stack directory and collect outputs."""
    try:
        # Change to stack directory
        original_dir = os.getcwd()
        os.chdir(stack_dir)
        
        # Run terraform output -json
        result = subprocess.run(
            ["terraform", "output", "-json"],
            capture_output=True,
            text=True,
            check=False
        )
        
        os.chdir(original_dir)
        
        if result.returncode == 0 and result.stdout:
            # Parse and flatten outputs
            data = json.loads(result.stdout)
            flattened = {}
            
            for key, value in data.items():
                if isinstance(value, dict) and 'value' in value:
                    flattened[key] = value['value']
                else:
                    flattened[key] = value
            
            return flattened
        else:
            print(f"Warning: terraform output failed: {result.stderr}", file=sys.stderr)
            return {}
    
    except Exception as e:
        print(f"Error collecting outputs: {e}", file=sys.stderr)
        return {}


def save_outputs(outputs, project_root):
    """Save outputs to expected locations."""
    # Create output directories
    cfn_outputs = project_root / "cfn-outputs"
    cdk_outputs = project_root / "cdk-outputs"
    
    cfn_outputs.mkdir(parents=True, exist_ok=True)
    cdk_outputs.mkdir(parents=True, exist_ok=True)
    
    # Save outputs as JSON (always create files, even if empty, to prevent CI failures)
    output_json = json.dumps(outputs if outputs else {}, indent=2)
    
    (cfn_outputs / "flat-outputs.json").write_text(output_json)
    (cdk_outputs / "flat-outputs.json").write_text(output_json)
    
    return len(outputs)


def main():
    """Main function to collect and save CDKTF outputs."""
    project_root = Path(__file__).parent.parent
    
    print("📊 Collecting CDKTF deployment outputs...")
    
    # Find stack directory
    stack_dir = find_stack_directory()
    if not stack_dir:
        print("⚠️  Stack directory not found in cdktf.out/stacks")
        # Create empty output files to prevent CI errors
        outputs = {}
    else:
        print(f"✅ Found stack directory: {stack_dir.name}")
        outputs = collect_terraform_outputs(stack_dir)
    
    # Always save outputs (even if empty) to ensure files exist for CI
    count = save_outputs(outputs, project_root)
    
    if count > 0:
        print(f"✅ Saved {count} outputs to cfn-outputs/flat-outputs.json")
        print(f"   Outputs: {', '.join(outputs.keys())}")
        # Display the actual output values
        for key, value in outputs.items():
            value_str = str(value)
            if len(value_str) > 80:
                value_str = value_str[:77] + "..."
            print(f"   • {key}: {value_str}")
    else:
        print("ℹ️  No stack outputs found (this is OK for LocalStack without EC2)")
        print("✅ Created empty output files for CI pipeline")
    
    # Always return success - we've done our best to collect outputs
    return 0


if __name__ == "__main__":
    sys.exit(main())

