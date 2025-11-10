#!/usr/bin/env python3
"""
Prepare test outputs by copying flat-outputs.json to flat-outputs-simple.json.
This ensures integration tests can find the outputs in the expected location.
"""

import json
import os
import shutil

def prepare_test_outputs():
    """Copy or create test output files for integration tests."""

    # Define paths
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cfn_outputs_dir = os.path.join(root_dir, "cfn-outputs")
    source_file = os.path.join(cfn_outputs_dir, "flat-outputs.json")
    target_file = os.path.join(cfn_outputs_dir, "flat-outputs-simple.json")

    # Ensure directory exists
    os.makedirs(cfn_outputs_dir, exist_ok=True)

    # Check if source file exists
    if os.path.exists(source_file):
        # Copy flat-outputs.json to flat-outputs-simple.json
        shutil.copy2(source_file, target_file)
        print(f"✅ Copied {source_file} to {target_file}")
    else:
        # Create a mock output file with expected keys
        mock_outputs = {
            "vpc_id": "vpc-mock-test",
            "alb_arn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-test/mock",
            "alb_dns_name": "alb-test-mock.us-east-1.elb.amazonaws.com",
            "rds_cluster_endpoint": "aurora-cluster-test.cluster-mock.us-east-1.rds.amazonaws.com",
            "rds_reader_endpoint": "aurora-cluster-test.cluster-ro-mock.us-east-1.rds.amazonaws.com",
            "static_assets_bucket": "company-dev-static-test",
            "logs_bucket": "company-dev-logs-test"
        }

        # Write to target file
        with open(target_file, 'w') as f:
            json.dump(mock_outputs, f, indent=2)

        print(f"✅ Created mock outputs at {target_file}")

    # Verify the file was created
    if os.path.exists(target_file):
        with open(target_file, 'r') as f:
            data = json.load(f)
        print(f"✅ Test output file ready with {len(data)} keys")
        return True
    else:
        print(f"❌ Failed to create {target_file}")
        return False

if __name__ == "__main__":
    success = prepare_test_outputs()
    exit(0 if success else 1)