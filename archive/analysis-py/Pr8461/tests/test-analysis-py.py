"""
CloudWatch Logs Analysis Testing
"""

import json
import os
import subprocess
import sys
import time

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


def setup_cloudwatch_logs():
    logs = boto_client("logs")
    ec2 = boto_client("ec2")
    ts = int(time.time() * 1000)

    # Create various log groups with different characteristics
    log_groups = [
        "/aws/lambda/my-app",  # Application log
        "/aws/lambda/debug-function",  # Debug log
        "/aws/lambda/audit-service",  # Audit log
        "/aws/lambda/test-function",  # Should be excluded
        "/aws/lambda/dev-function",  # Should be excluded
        "vpc-flow-logs/vpc-12345",  # VPC Flow Logs
        "/aws/ecs/my-service",  # ECS logs
    ]

    for lg_name in log_groups:
        try:
            # Create log group
            logs.create_log_group(logGroupName=lg_name)

            # Set retention based on type
            if "debug" in lg_name:
                logs.put_retention_policy(logGroupName=lg_name, retentionInDays=90)  # Excessive for debug
            elif "audit" in lg_name:
                logs.put_retention_policy(logGroupName=lg_name, retentionInDays=30)  # Excessive for audit
            elif "vpc-flow" in lg_name:
                # No retention set - indefinite
                pass
            else:
                logs.put_retention_policy(logGroupName=lg_name, retentionInDays=60)

            # Create log streams and add events
            logs.create_log_stream(logGroupName=lg_name, logStreamName="stream1")
            logs.create_log_stream(logGroupName=lg_name, logStreamName="stream2")

            # Add events to simulate stored bytes
            event_size = 1000 if "vpc-flow" in lg_name else 100  # Larger for VPC flow logs
            logs.put_log_events(
                logGroupName=lg_name,
                logStreamName="stream1",
                logEvents=[{"timestamp": ts, "message": "x" * event_size}]
            )
            logs.put_log_events(
                logGroupName=lg_name,
                logStreamName="stream2",
                logEvents=[{"timestamp": ts, "message": "x" * event_size}]
            )

            # Add tags
            if "my-app" in lg_name:
                logs.tag_log_group(
                    logGroupName=lg_name,
                    tags={"DataClassification": "confidential"}
                )
            elif "vpc-flow" in lg_name:
                logs.tag_log_group(
                    logGroupName=lg_name,
                    tags={"Criticality": "high"}
                )

        except logs.exceptions.ResourceAlreadyExistsException:
            pass  # Already exists

    # Create a VPC and Flow Log for VPC Flow Logs testing
    try:
        vpc = ec2.create_vpc(CidrBlock="10.0.0.0/16")
        vpc_id = vpc['Vpc']['VpcId']

        # Create flow log with ALL traffic
        ec2.create_flow_logs(
            ResourceIds=[vpc_id],
            ResourceType="VPC",
            TrafficType="ALL",
            LogGroupName="vpc-flow-logs/vpc-12345",
            DeliverLogsPermissionArn="arn:aws:iam::123456789012:role/flow-logs-role"
        )
    except Exception:
        pass  # May fail in mock, but log group exists


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    # Import the analyzer and run it directly instead of as subprocess
    # This ensures it runs in the same process/context as the test
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))

    from analyse import CloudWatchLogsAnalyzer

    # Remove old JSON file if it exists
    json_output = os.path.join(os.path.dirname(__file__), "..", "aws_audit_results.json")
    if os.path.exists(json_output):
        os.remove(json_output)

    # Run the analyzer
    analyzer = CloudWatchLogsAnalyzer()
    analyzer.run()

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        return {}


def test_cloudwatch_logs_analysis():
    # Setup CloudWatch log groups and streams
    setup_cloudwatch_logs()

    results = run_analysis_script()

    # Check that CloudWatchLogs section exists in JSON
    assert "CloudWatchLogs" in results, "CloudWatchLogs key missing from JSON"

    # Check structure
    logs_section = results["CloudWatchLogs"]
    assert "log_groups" in logs_section, "log_groups key missing from CloudWatchLogs"
    assert "monitoring_gaps" in logs_section, "monitoring_gaps key missing from CloudWatchLogs"
    assert "summary" in logs_section, "summary key missing from CloudWatchLogs"

    # Check summary
    summary = logs_section["summary"]
    assert "total_log_groups" in summary, "total_log_groups key missing from summary"
    assert "total_monthly_cost" in summary, "total_monthly_cost key missing from summary"
    assert "total_stored_gb" in summary, "total_stored_gb key missing from summary"
    assert "optimized_monthly_cost" in summary, "optimized_monthly_cost key missing from summary"
    assert "total_savings" in summary, "total_savings key missing from summary"

    # Should have analyzed log groups (excluding dev/test prefixes)
    log_groups = logs_section["log_groups"]
    assert len(log_groups) >= 4, f"Expected at least 4 log groups, got {len(log_groups)}"

    # Check that each log group has required fields
    for lg in log_groups:
        assert "log_group_name" in lg
        assert "retention_days" in lg
        assert "stored_bytes" in lg
        assert "daily_ingestion_mb" in lg
        assert "monthly_cost" in lg
        assert "issues" in lg
        assert "optimization" in lg

        # Check optimization structure
        opt = lg["optimization"]
        assert "recommended_retention" in opt
        assert "metric_filters" in opt
        assert "estimated_savings" in opt

    # Find specific log groups and validate their analysis
    debug_lg = next((lg for lg in log_groups if "debug-function" in lg["log_group_name"]), None)
    assert debug_lg is not None, "Debug log group not found in results"

    # Debug log should have excessive retention issue
    debug_issues = [issue for issue in debug_lg["issues"] if issue["type"] == "excessive_debug_retention"]
    assert len(debug_issues) > 0, "Debug log should have excessive retention issue"

    # Audit log
    audit_lg = next((lg for lg in log_groups if "audit-service" in lg["log_group_name"]), None)
    assert audit_lg is not None, "Audit log group not found in results"

    audit_issues = [issue for issue in audit_lg["issues"] if issue["type"] == "excessive_audit_retention"]
    assert len(audit_issues) > 0, "Audit log should have excessive retention issue"

    # Confidential log
    confidential_lg = next((lg for lg in log_groups if "my-app" in lg["log_group_name"]), None)
    assert confidential_lg is not None, "Confidential log group not found in results"

    # Should have encryption issue
    encryption_issues = [issue for issue in confidential_lg["issues"] if issue["type"] == "no_encryption"]
    assert len(encryption_issues) > 0, "Confidential log should have encryption issue"

    # VPC Flow Logs
    vpc_lg = next((lg for lg in log_groups if "vpc-flow" in lg["log_group_name"]), None)
    assert vpc_lg is not None, "VPC Flow log group not found in results"

    # Should have indefinite retention issue
    indefinite_issues = [issue for issue in vpc_lg["issues"] if issue["type"] == "indefinite_retention"]
    assert len(indefinite_issues) > 0, "VPC Flow log should have indefinite retention issue"

    # Check monitoring gaps
    gaps = logs_section["monitoring_gaps"]
    # Should have gaps for Lambda/EC2 resources without logs
    assert isinstance(gaps, list), "monitoring_gaps should be a list"

    # Validate total costs are reasonable
    assert summary["total_monthly_cost"] >= 0, "Total cost should be non-negative"
    assert summary["total_savings"] >= 0, "Total savings should be non-negative"
