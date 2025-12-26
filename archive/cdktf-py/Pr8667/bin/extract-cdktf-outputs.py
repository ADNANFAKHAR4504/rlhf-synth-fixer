#!/usr/bin/env python3
"""
Extract CDKTF/Terraform outputs from state files and write to flat-outputs.json.

This script is a fallback for when `cdktf output` doesn't properly generate
output files for the CI/CD pipeline.
"""
import json
import os
import sys
from pathlib import Path


def find_terraform_state_files(base_dir: Path) -> list[Path]:
    """Find all terraform.tfstate files in cdktf.out directory."""
    state_files = []
    cdktf_out = base_dir / "cdktf.out"
    
    if cdktf_out.exists():
        for state_file in cdktf_out.rglob("terraform.tfstate"):
            state_files.append(state_file)
    
    return state_files


def extract_outputs_from_state(state_file: Path) -> dict:
    """Extract outputs from a Terraform state file."""
    outputs = {}
    
    try:
        with open(state_file, 'r') as f:
            state = json.load(f)
        
        # Handle different state file formats
        if "outputs" in state:
            for key, value in state["outputs"].items():
                if isinstance(value, dict) and "value" in value:
                    outputs[key] = value["value"]
                else:
                    outputs[key] = value
        
        # Also check for resources to extract IDs if outputs are empty
        if not outputs and "resources" in state:
            for resource in state["resources"]:
                if resource.get("type") == "aws_vpc":
                    for instance in resource.get("instances", []):
                        outputs["VPC"] = instance.get("attributes", {}).get("id")
                        outputs["VPCCIDR"] = instance.get("attributes", {}).get("cidr_block")
                elif resource.get("type") == "aws_subnet":
                    name = resource.get("name", "")
                    for instance in resource.get("instances", []):
                        subnet_id = instance.get("attributes", {}).get("id")
                        if "public" in name.lower():
                            if "PublicSubnet1" not in outputs:
                                outputs["PublicSubnet1"] = subnet_id
                            else:
                                outputs["PublicSubnet2"] = subnet_id
                        elif "private" in name.lower():
                            if "PrivateSubnet1" not in outputs:
                                outputs["PrivateSubnet1"] = subnet_id
                            else:
                                outputs["PrivateSubnet2"] = subnet_id
                elif resource.get("type") == "aws_internet_gateway":
                    for instance in resource.get("instances", []):
                        outputs["InternetGateway"] = instance.get("attributes", {}).get("id")
                elif resource.get("type") == "aws_nat_gateway":
                    name = resource.get("name", "")
                    for instance in resource.get("instances", []):
                        nat_id = instance.get("attributes", {}).get("id")
                        if "1" in name:
                            outputs["NatGateway1"] = nat_id
                        else:
                            outputs["NatGateway2"] = nat_id
                elif resource.get("type") == "aws_security_group":
                    for instance in resource.get("instances", []):
                        outputs["SecurityGroup"] = instance.get("attributes", {}).get("id")
                elif resource.get("type") == "aws_route_table":
                    name = resource.get("name", "")
                    for instance in resource.get("instances", []):
                        rt_id = instance.get("attributes", {}).get("id")
                        if "public" in name.lower():
                            outputs["PublicRouteTable"] = rt_id
                        elif "private" in name.lower() and "1" in name:
                            outputs["PrivateRouteTable1"] = rt_id
                        elif "private" in name.lower():
                            outputs["PrivateRouteTable2"] = rt_id
    except (json.JSONDecodeError, IOError) as e:
        print(f"Warning: Could not parse state file {state_file}: {e}", file=sys.stderr)
    
    return outputs


def flatten_outputs(outputs: dict) -> dict:
    """Flatten nested output values."""
    flat = {}
    for key, value in outputs.items():
        if isinstance(value, list):
            # Convert list to individual items
            for i, item in enumerate(value):
                flat[f"{key}_{i+1}"] = item
            flat[key] = value  # Also keep the original
        elif isinstance(value, dict):
            # Flatten nested dicts
            for subkey, subvalue in value.items():
                flat[f"{key}_{subkey}"] = subvalue
        else:
            flat[key] = value
    return flat


def main():
    """Main function to extract and write outputs."""
    # Determine project root
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    print(f"🔍 Searching for Terraform state files in {project_root}...")
    
    # Find state files
    state_files = find_terraform_state_files(project_root)
    
    if not state_files:
        print("⚠️  No terraform.tfstate files found in cdktf.out/")
        # Try alternative locations
        alt_locations = [
            project_root / "terraform.tfstate",
            project_root / ".terraform" / "terraform.tfstate",
        ]
        for alt in alt_locations:
            if alt.exists():
                state_files.append(alt)
                print(f"   Found alternative: {alt}")
    
    if not state_files:
        print("❌ No Terraform state files found anywhere")
        return 1
    
    print(f"✅ Found {len(state_files)} state file(s)")
    
    # Extract outputs from all state files
    all_outputs = {}
    for state_file in state_files:
        print(f"   Extracting from: {state_file}")
        outputs = extract_outputs_from_state(state_file)
        all_outputs.update(outputs)
    
    if not all_outputs:
        print("❌ No outputs found in state files")
        return 1
    
    # Flatten outputs
    flat_outputs = flatten_outputs(all_outputs)
    print(f"✅ Extracted {len(flat_outputs)} outputs")
    
    # Create output directories
    cfn_outputs_dir = project_root / "cfn-outputs"
    cdk_outputs_dir = project_root / "cdk-outputs"
    
    cfn_outputs_dir.mkdir(parents=True, exist_ok=True)
    cdk_outputs_dir.mkdir(parents=True, exist_ok=True)
    
    # Write outputs to both locations (CI may check either)
    output_file_cfn = cfn_outputs_dir / "flat-outputs.json"
    output_file_cdk = cdk_outputs_dir / "flat-outputs.json"
    
    for output_file in [output_file_cfn, output_file_cdk]:
        with open(output_file, 'w') as f:
            json.dump(flat_outputs, f, indent=2)
        print(f"✅ Wrote outputs to {output_file}")
    
    # Print outputs for debugging
    print("\n📋 Extracted outputs:")
    for key, value in sorted(flat_outputs.items()):
        print(f"   {key}: {value}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

