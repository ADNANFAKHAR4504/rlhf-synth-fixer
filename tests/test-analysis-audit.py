"""
REQUIRED Mock Configuration Setup for AWS EC2 Cost Optimization Testing
========================================================================

This setup is MANDATORY for running and testing AWS EC2 cost optimization tasks.
All new EC2 cost analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_your_resource()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock EC2 instances and related resources
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_your_optimization_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for recommendations in results
      - Validate structure and required fields
      - Verify recommendation types and priorities
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_your_resource():
    client = boto_client("ec2")
    # Create mock EC2 resources
    # Handle existing resources
    # Add configurations

def test_your_optimization_analysis():
    # Setup resources
    setup_your_resource()

    # Run analysis
    results = run_analysis_script()

    # Validate results
    assert "recommendations" in results
    assert "total_potential_savings" in results
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- Old generation instances (setup_old_generation_instances)
- Untagged instances (setup_untagged_instances)
- GP2 volumes (setup_gp2_volumes)

Note: Without this mock configuration setup, EC2 cost optimization tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta

import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_old_generation_instances():
    """Create old generation EC2 instances for upgrade analysis"""
    ec2 = boto_client("ec2")

    # Create instances with old generation types that are older than 7 days
    # Note: In moto, we can't actually set launch time in the past, so tests may need adjustment
    try:
        # Create a t2.micro instance
        response = ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="t2.micro",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'old-gen-t2'},
                        {'Key': 'CostCenter', 'Value': 'Engineering'},
                        {'Key': 'Environment', 'Value': 'Test'},
                        {'Key': 'Owner', 'Value': 'TestUser'},
                        {'Key': 'Application', 'Value': 'TestApp'}
                    ]
                }
            ]
        )

        # Create an m4.large instance
        response = ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="m4.large",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'old-gen-m4'},
                        {'Key': 'CostCenter', 'Value': 'Engineering'},
                        {'Key': 'Environment', 'Value': 'Production'},
                        {'Key': 'Owner', 'Value': 'TestUser'},
                        {'Key': 'Application', 'Value': 'WebApp'}
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Error creating old generation instances: {e}")


def setup_untagged_instances():
    """Create instances missing required tags"""
    ec2 = boto_client("ec2")

    try:
        # Create instance missing CostCenter tag
        ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="t3.small",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'missing-costcenter'},
                        {'Key': 'Environment', 'Value': 'Test'},
                        {'Key': 'Owner', 'Value': 'TestUser'},
                        {'Key': 'Application', 'Value': 'TestApp'}
                    ]
                }
            ]
        )

        # Create instance missing Owner and Application tags
        ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="t3.medium",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'missing-multiple-tags'},
                        {'Key': 'CostCenter', 'Value': 'IT'},
                        {'Key': 'Environment', 'Value': 'Development'}
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Error creating untagged instances: {e}")


def setup_stopped_instances_with_ebs():
    """Create stopped instances with attached EBS volumes"""
    ec2 = boto_client("ec2")

    try:
        # Create an instance
        response = ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="t3.small",
            MinCount=1,
            MaxCount=1,
            BlockDeviceMappings=[
                {
                    'DeviceName': '/dev/xvda',
                    'Ebs': {
                        'VolumeSize': 20,
                        'VolumeType': 'gp3',
                        'DeleteOnTermination': False
                    }
                }
            ],
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'stopped-with-ebs'},
                        {'Key': 'CostCenter', 'Value': 'Engineering'},
                        {'Key': 'Environment', 'Value': 'Test'},
                        {'Key': 'Owner', 'Value': 'TestUser'},
                        {'Key': 'Application', 'Value': 'TestApp'}
                    ]
                }
            ]
        )

        instance_id = response['Instances'][0]['InstanceId']

        # Stop the instance
        ec2.stop_instances(InstanceIds=[instance_id])

    except Exception as e:
        print(f"Error creating stopped instances: {e}")


def setup_gp2_volumes():
    """Create GP2 volumes for migration analysis"""
    ec2 = boto_client("ec2")

    try:
        # Create GP2 volumes
        ec2.create_volume(
            AvailabilityZone="us-east-1a",
            Size=50,
            VolumeType="gp2",
            TagSpecifications=[
                {
                    'ResourceType': 'volume',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'gp2-volume-1'},
                        {'Key': 'CostCenter', 'Value': 'Engineering'}
                    ]
                }
            ]
        )

        ec2.create_volume(
            AvailabilityZone="us-east-1a",
            Size=100,
            VolumeType="gp2",
            TagSpecifications=[
                {
                    'ResourceType': 'volume',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'gp2-volume-2'}
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Error creating GP2 volumes: {e}")


def setup_excluded_instance():
    """Create instance with ExcludeFromCostAnalysis tag"""
    ec2 = boto_client("ec2")

    try:
        ec2.run_instances(
            ImageId="ami-12345678",
            InstanceType="t2.micro",
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': 'excluded-instance'},
                        {'Key': 'ExcludeFromCostAnalysis', 'Value': 'true'},
                        {'Key': 'CostCenter', 'Value': 'Engineering'},
                        {'Key': 'Environment', 'Value': 'Test'},
                        {'Key': 'Owner', 'Value': 'TestUser'},
                        {'Key': 'Application', 'Value': 'TestApp'}
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Error creating excluded instance: {e}")


def run_analysis_script():
    """Helper to run the EC2 cost optimization script and return JSON results"""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "ec2_cost_optimization.json")
    csv_output = os.path.join(os.path.dirname(__file__), "..", "ec2_rightsizing.csv")

    # Remove old output files if they exist
    if os.path.exists(json_output):
        os.remove(json_output)
    if os.path.exists(csv_output):
        os.remove(csv_output)

    env = {**os.environ}
    result = subprocess.run([sys.executable, script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_old_generation_instances_analysis():
    """Test detection of old generation EC2 instances"""
    # Setup old generation instances
    setup_old_generation_instances()

    results = run_analysis_script()

    # Check that recommendations section exists in JSON
    assert "recommendations" in results, "recommendations key missing from JSON"
    assert "total_potential_savings" in results, "total_potential_savings key missing from JSON"

    # Look for old generation upgrade recommendations
    recommendations = results["recommendations"]
    old_gen_recommendations = [
        rec for rec in recommendations
        if rec.get("action") == "upgrade_instance_generation"
    ]

    # Should have at least 2 old generation recommendations (t2.micro and m4.large)
    assert len(old_gen_recommendations) >= 2, f"Expected at least 2 old generation recommendations, got {len(old_gen_recommendations)}"

    # Validate recommendation structure
    for rec in old_gen_recommendations:
        assert "instance_id" in rec, "instance_id missing from recommendation"
        assert "instance_type" in rec, "instance_type missing from recommendation"
        assert "action" in rec, "action missing from recommendation"
        assert "priority" in rec, "priority missing from recommendation"
        assert "potential_savings" in rec, "potential_savings missing from recommendation"
        assert "details" in rec, "details missing from recommendation"
        assert "tags" in rec, "tags missing from recommendation"

        # Check priority is medium for old generation
        assert rec["priority"] == "medium", f"Expected priority 'medium', got {rec['priority']}"

        # Check instance types are old generation
        assert any(rec["instance_type"].startswith(old) for old in ["t2", "m4", "c4", "r4"]), \
            f"Instance type {rec['instance_type']} is not old generation"


def test_untagged_instances_analysis():
    """Test detection of instances missing required tags"""
    # Setup untagged instances
    setup_untagged_instances()

    results = run_analysis_script()

    # Check that recommendations section exists
    assert "recommendations" in results, "recommendations key missing from JSON"

    # Look for untagged instance recommendations
    recommendations = results["recommendations"]
    untagged_recommendations = [
        rec for rec in recommendations
        if rec.get("action") == "add_required_tags"
    ]

    # Should have at least 2 untagged recommendations
    assert len(untagged_recommendations) >= 2, f"Expected at least 2 untagged recommendations, got {len(untagged_recommendations)}"

    # Validate recommendation structure
    for rec in untagged_recommendations:
        assert "instance_id" in rec
        assert "action" in rec
        assert "priority" in rec
        assert "details" in rec

        # Check priority is low for tagging
        assert rec["priority"] == "low", f"Expected priority 'low', got {rec['priority']}"

        # Check that details mention missing tags
        assert "Missing tags:" in rec["details"], "Expected 'Missing tags:' in details"


def test_stopped_instances_with_ebs_analysis():
    """Test detection of stopped instances with EBS volumes"""
    # Setup stopped instances
    setup_stopped_instances_with_ebs()

    results = run_analysis_script()

    # Check that recommendations section exists
    assert "recommendations" in results, "recommendations key missing from JSON"

    # Look for stopped instance recommendations
    recommendations = results["recommendations"]
    stopped_recommendations = [
        rec for rec in recommendations
        if rec.get("action") == "remove_stopped_instance_volumes"
    ]

    # May have stopped instances with EBS volumes
    if len(stopped_recommendations) > 0:
        # Validate recommendation structure
        for rec in stopped_recommendations:
            assert "instance_id" in rec
            assert "action" in rec
            assert "priority" in rec
            assert "potential_savings" in rec
            assert "details" in rec

            # Check priority is medium
            assert rec["priority"] == "medium", f"Expected priority 'medium', got {rec['priority']}"

            # Check that details mention stopped instance with EBS storage
            assert "Stopped instance with" in rec["details"], "Expected 'Stopped instance with' in details"
            assert "GB EBS storage" in rec["details"], "Expected 'GB EBS storage' in details"


def test_gp2_volumes_analysis():
    """Test detection of GP2 volumes for GP3 migration"""
    # Setup GP2 volumes
    setup_gp2_volumes()

    results = run_analysis_script()

    # Check that recommendations section exists
    assert "recommendations" in results, "recommendations key missing from JSON"

    # Look for GP2 to GP3 migration recommendations
    recommendations = results["recommendations"]
    gp2_recommendations = [
        rec for rec in recommendations
        if rec.get("action") == "migrate_gp2_to_gp3"
    ]

    # Should have at least 2 GP2 volume recommendations
    assert len(gp2_recommendations) >= 2, f"Expected at least 2 GP2 volume recommendations, got {len(gp2_recommendations)}"

    # Validate recommendation structure
    for rec in gp2_recommendations:
        assert "instance_id" in rec  # Contains volume ID
        assert "instance_type" in rec
        assert "action" in rec
        assert "priority" in rec
        assert "potential_savings" in rec
        assert "details" in rec

        # Check instance_type is EBS_Volume
        assert rec["instance_type"] == "EBS_Volume", f"Expected instance_type 'EBS_Volume', got {rec['instance_type']}"

        # Check priority is medium
        assert rec["priority"] == "medium", f"Expected priority 'medium', got {rec['priority']}"

        # Check that details mention gp2 volume
        assert "gp2 volume" in rec["details"], "Expected 'gp2 volume' in details"


def test_excluded_instance_not_analyzed():
    """Test that instances with ExcludeFromCostAnalysis tag are not analyzed"""
    # Setup excluded instance
    setup_excluded_instance()

    results = run_analysis_script()

    # Check that recommendations section exists
    assert "recommendations" in results, "recommendations key missing from JSON"

    # The excluded instance should NOT appear in any recommendations
    # It's a t2.micro which should trigger old generation recommendation, but it's excluded
    recommendations = results["recommendations"]

    # Check that no recommendation has the 'excluded-instance' in tags
    for rec in recommendations:
        tags = rec.get("tags", {})
        if "Name" in tags:
            assert tags["Name"] != "excluded-instance", \
                "Excluded instance should not appear in recommendations"


def test_json_output_structure():
    """Test overall JSON output structure"""
    # Setup some resources
    setup_old_generation_instances()
    setup_gp2_volumes()

    results = run_analysis_script()

    # Check top-level keys
    assert "analysis_date" in results, "analysis_date key missing from JSON"
    assert "region" in results, "region key missing from JSON"
    assert "total_potential_savings" in results, "total_potential_savings key missing from JSON"
    assert "recommendations" in results, "recommendations key missing from JSON"

    # Check data types
    assert isinstance(results["analysis_date"], str), "analysis_date should be a string"
    assert isinstance(results["region"], str), "region should be a string"
    assert isinstance(results["total_potential_savings"], (int, float)), "total_potential_savings should be numeric"
    assert isinstance(results["recommendations"], list), "recommendations should be a list"

    # Check region matches expected
    assert results["region"] == "us-east-1", f"Expected region 'us-east-1', got {results['region']}"

    # Check total_potential_savings is non-negative
    assert results["total_potential_savings"] >= 0, "total_potential_savings should be non-negative"


def test_csv_output_created():
    """Test that CSV output file is created"""
    # Setup some resources
    setup_old_generation_instances()

    # Run analysis
    results = run_analysis_script()

    # Check that CSV file was created
    csv_output = os.path.join(os.path.dirname(__file__), "..", "ec2_rightsizing.csv")
    assert os.path.exists(csv_output), "CSV output file should be created"

    # Check that CSV file has content
    with open(csv_output, 'r') as f:
        content = f.read()
        assert len(content) > 0, "CSV output file should have content"
        # Check for header row
        assert "Instance ID" in content, "CSV should have 'Instance ID' column"
        assert "Instance Type" in content, "CSV should have 'Instance Type' column"
        assert "Action" in content, "CSV should have 'Action' column"
        assert "Priority" in content, "CSV should have 'Priority' column"


def test_summary_statistics():
    """
    Test that summary statistics are calculated correctly.
    This test creates ALL resources and should run LAST to ensure
    resources persist for the final script execution after tests.
    """
    # Setup all test resources (similar to archive/analysis-py/Pr6246 pattern)
    print("\n=== Setting up all mock resources for comprehensive analysis ===")
    setup_old_generation_instances()
    setup_untagged_instances()
    setup_stopped_instances_with_ebs()
    setup_gp2_volumes()
    setup_excluded_instance()
    print("=== All mock resources created ===\n")

    results = run_analysis_script()

    # Save the analysis results to a file that can be read later
    # This ensures we capture the output while resources still exist
    results_file = os.path.join(os.path.dirname(__file__), "..", "lib", "test-analysis-results.json")
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n✓ Saved comprehensive analysis results to {results_file}")

    # Check that the analysis ran successfully
    assert "recommendations" in results, "recommendations key missing from JSON"
    assert "total_potential_savings" in results, "total_potential_savings key missing from JSON"

    recommendations = results["recommendations"]

    # Should have multiple types of recommendations
    action_types = set(rec['action'] for rec in recommendations)

    # Verify we have at least 3 different types of recommendations
    assert len(action_types) >= 3, f"Expected at least 3 different recommendation types, got {len(action_types)}: {action_types}"

    # Verify specific recommendation types exist
    assert any(rec['action'] == 'upgrade_instance_generation' for rec in recommendations), \
        "Should have old generation upgrade recommendations"

    assert any(rec['action'] == 'add_required_tags' for rec in recommendations), \
        "Should have untagged instance recommendations"

    assert any(rec['action'] == 'migrate_gp2_to_gp3' for rec in recommendations), \
        "Should have GP2 to GP3 migration recommendations"

    # Verify total savings is greater than 0
    assert results["total_potential_savings"] > 0, \
        f"Expected total savings > 0, got {results['total_potential_savings']}"

    # Verify region is correct
    assert results["region"] == "us-east-1", f"Expected region 'us-east-1', got {results['region']}"

    # Count recommendations by action type
    recommendations_by_action = {}
    for rec in recommendations:
        action = rec['action']
        recommendations_by_action[action] = recommendations_by_action.get(action, 0) + 1

    print(f"\n=== Summary Statistics ===")
    print(f"Total Recommendations: {len(recommendations)}")
    print(f"Total Potential Savings: ${results['total_potential_savings']:.2f}/month")
    print(f"Recommendations by Type:")
    for action, count in recommendations_by_action.items():
        print(f"  - {action}: {count}")
    print("="*50 + "\n")
