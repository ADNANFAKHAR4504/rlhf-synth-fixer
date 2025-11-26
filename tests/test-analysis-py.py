"""
REQUIRED Mock Configuration Setup for EventBridge Analysis Testing
==================================================================

This setup is MANDATORY for running and testing EventBridge analysis tasks.
All new implementations must follow this testing framework to ensure consistent
mocking and validation of EventBridge resources.

Required Setup Steps:
--------------------
1. Environment Configuration (REQUIRED):
   - Configure boto3 with credentials and region
   - Set environment variables:
     * AWS_ENDPOINT_URL
     * AWS_DEFAULT_REGION
     * AWS_ACCESS_KEY_ID
     * AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Implement a setup function (e.g., setup_eventbridge_resources()):
      - Use boto_client(service_name) to initialize AWS clients
      - Create mock EventBridge buses, rules, and targets via boto3 API calls
      - Ensure idempotency so resources are not duplicated
      - Handle existing resources gracefully (ResourceAlreadyExists)

3. Create Test Function (REQUIRED):
   a. Implement a test function (e.g., test_eventbridge_analysis())
   b. Invoke the setup function to prepare mock resources
   c. Call run_analysis_script() to perform the analysis
   d. Validate the JSON output by asserting:
      - Correct sections exist in the results
      - Structure and required fields are present
      - Resource counts and computed metrics are accurate
      - Specific resource attributes and findings match expectations

The analysis must also emit tabulated console output when run via scripts/analysis.sh.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta

import boto3
import pytest
from botocore.exceptions import ClientError


def ensure_env():
    os.environ.setdefault("AWS_ENDPOINT_URL", "http://localhost:5001")
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")


def boto_client(service: str):
    ensure_env()
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def _create_queue(name: str, attributes: dict = None):
    sqs = boto_client("sqs")
    attributes = attributes or {}
    try:
        url = sqs.create_queue(QueueName=name, Attributes=attributes)["QueueUrl"]
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "QueueAlreadyExists":
            url = sqs.get_queue_url(QueueName=name)["QueueUrl"]
        else:
            raise
    attrs = sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["QueueArn"])["Attributes"]
    return url, attrs["QueueArn"]


def setup_eventbridge_resources():
    """Create EventBridge buses, rules, targets, and DLQs for testing."""
    events = boto_client("events")
    sqs = boto_client("sqs")

    # Queues for targets and DLQ
    dlq_url, dlq_arn = _create_queue("eventbridge-dlq")
    sqs.send_message(QueueUrl=dlq_url, MessageBody="dead-letter-payload")

    target_url, target_arn = _create_queue("orders-queue")
    fifo_url, fifo_arn = _create_queue("orders.fifo", {"FifoQueue": "true"})

    # Event buses
    for name in ["prod-payments", "analytics-bus"]:
        try:
            bus_resp = events.create_event_bus(Name=name)
            bus_arn = bus_resp["EventBusArn"]
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ResourceAlreadyExistsException":
                bus_arn = events.describe_event_bus(Name=name)["Arn"]
            else:
                raise
        tag_payload = [{"Key": "DataClassification", "Value": "sensitive"}] if name == "prod-payments" else []
        if name == "analytics-bus":
            tag_payload.append({"Key": "RuleCountOverride", "Value": "120"})
        if tag_payload:
            events.tag_resource(ResourceARN=bus_arn, Tags=tag_payload)

    # Broad rule with DLQ (tests DLQ monitoring + overly broad pattern)
    pattern_broad = json.dumps({"source": ["*"]})
    events.put_rule(
        Name="broad-capture",
        EventBusName="prod-payments",
        EventPattern=pattern_broad,
        State="ENABLED",
        Description="Broad capture rule for testing",
    )
    events.put_targets(
        Rule="broad-capture",
        EventBusName="prod-payments",
        Targets=[
            {
                "Id": "broad-target",
                "Arn": target_arn,
                "DeadLetterConfig": {"Arn": dlq_arn},
            }
        ],
    )
    broad_arn = events.describe_rule(Name="broad-capture", EventBusName="prod-payments")["Arn"]
    events.tag_resource(
        ResourceARN=broad_arn,
        Tags=[
            {"Key": "Metric:DailyInvocations", "Value": "25"},
            {"Key": "Owner", "Value": "ops"},
        ],
    )

    # Critical rule without DLQ and missing required tags
    pattern_critical = json.dumps({"source": ["aws.order"], "detail-type": ["order.created"]})
    events.put_rule(
        Name="critical-payment-rule",
        EventBusName="prod-payments",
        EventPattern=pattern_critical,
        State="ENABLED",
        Description="Critical payment rule",
    )
    events.put_targets(
        Rule="critical-payment-rule",
        EventBusName="prod-payments",
        Targets=[{"Id": "critical-target", "Arn": target_arn}],
    )
    critical_arn = events.describe_rule(Name="critical-payment-rule", EventBusName="prod-payments")["Arn"]
    events.tag_resource(
        ResourceARN=critical_arn,
        Tags=[
            {"Key": "Metric:DailyInvocations", "Value": "50"},
            {"Key": "Metric:FailedInvocations", "Value": "5"},
            {"Key": "Criticality", "Value": "high"},
            {"Key": "TimeSensitive", "Value": "true"},
        ],
    )

    # FIFO rule missing MessageGroupId
    pattern_fifo = json.dumps({"source": ["aws.order"], "detail-type": ["order.fifo"]})
    events.put_rule(
        Name="fifo-rule",
        EventBusName="prod-payments",
        EventPattern=pattern_fifo,
        State="ENABLED",
        Description="FIFO rule missing message group id",
    )
    events.put_targets(
        Rule="fifo-rule",
        EventBusName="prod-payments",
        Targets=[
            {
                "Id": "fifo-target",
                "Arn": fifo_arn,
                # Provide SqsParameters with empty MessageGroupId to satisfy moto while
                # allowing analyzer to flag it as missing/invalid.
                "SqsParameters": {"MessageGroupId": ""},
            }
        ],
    )
    fifo_arn_rule = events.describe_rule(Name="fifo-rule", EventBusName="prod-payments")["Arn"]
    events.tag_resource(
        ResourceARN=fifo_arn_rule,
        Tags=[{"Key": "Metric:DailyInvocations", "Value": "15"}],
    )

    # Disabled rule older than 30 days on analytics bus
    pattern_disabled = json.dumps({"source": ["aws.analytics"]})
    events.put_rule(
        Name="disabled-old-rule",
        EventBusName="analytics-bus",
        EventPattern=pattern_disabled,
        State="DISABLED",
        Description="Disabled rule for duration testing",
    )
    disabled_arn = events.describe_rule(Name="disabled-old-rule", EventBusName="analytics-bus")["Arn"]
    thirty_five_days_ago = (datetime.utcnow() - timedelta(days=45)).isoformat()
    events.tag_resource(
        ResourceARN=disabled_arn,
        Tags=[
            {"Key": "DisabledSince", "Value": thirty_five_days_ago},
            {"Key": "Metric:DailyInvocations", "Value": "20"},
        ],
    )


def setup_low_traffic_rule():
    """Create a rule with low daily invocations to validate threshold filtering."""
    events = boto_client("events")
    try:
        events.put_rule(
            Name="low-traffic-rule",
            EventBusName="prod-payments",
            EventPattern=json.dumps({"source": ["aws.order"]}),
            State="ENABLED",
        )
    except ClientError:
        # Rule may already exist; continue
        pass
    # Tag with low invocation count to stay below inclusion threshold
    rule_arn = events.describe_rule(Name="low-traffic-rule", EventBusName="prod-payments")["Arn"]
    events.tag_resource(
        ResourceARN=rule_arn,
        Tags=[{"Key": "Metric:DailyInvocations", "Value": "5"}],
    )
    # Attach a simple target so the rule is valid
    _, target_arn = _create_queue("low-traffic-queue")
    events.put_targets(
        Rule="low-traffic-rule",
        EventBusName="prod-payments",
        Targets=[{"Id": "low-traffic-target", "Arn": target_arn}],
    )


def run_analysis_script():
    """Run lib/analyse.py and return parsed JSON plus stdout for validation."""
    ensure_env()
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "eventbridge_analysis.json")

    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )

    payload = {}
    if os.path.exists(json_output):
        with open(json_output, "r") as fh:
            payload = json.load(fh)
    else:
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")

    return payload, result.stdout


def test_eventbridge_summary_and_structure():
    setup_eventbridge_resources()
    results, stdout = run_analysis_script()

    # Validate top-level sections
    for section in ["event_buses", "rules", "dlq_analysis", "event_pattern_analysis", "summary"]:
        assert section in results, f"{section} missing from analysis output"

    summary = results["summary"]
    for field in ["rules_audited", "buses_audited", "total_daily_events", "failed_invocations"]:
        assert field in summary

    # Ensure tabulated output was printed
    assert "EventBridge Analysis Report" in stdout
    assert "|" in stdout  # Tabulated table formatting


def test_event_buses_findings():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()

    buses = {bus["name"]: bus for bus in results["event_buses"]}
    assert "prod-payments" in buses
    assert "analytics-bus" in buses

    prod_issues = {i["type"] for i in buses["prod-payments"]["issues"]}
    assert "archive_disabled" in prod_issues
    assert "missing_resource_policy" in prod_issues
    assert "no_cross_region_replication" in prod_issues
    assert "unused_event_bus" in prod_issues
    assert "no_encryption" in prod_issues

    analytics_issues = {i["type"] for i in buses["analytics-bus"]["issues"]}
    assert "excessive_rules" in analytics_issues


def test_summary_counts_and_topology_artifacts():
    setup_eventbridge_resources()
    results, stdout = run_analysis_script()

    # Summary counts should reflect resources created
    assert results["summary"]["buses_audited"] >= 2
    assert results["summary"]["rules_audited"] == len(results["rules"])

    # Artifacts are generated
    assert os.path.exists(os.path.join(os.path.dirname(__file__), "..", "event_routing_topology.html"))
    assert os.path.exists(os.path.join(os.path.dirname(__file__), "..", "dlq_monitoring_setup.sh"))
    assert "EventBridge Analysis Report" in stdout


def test_rule_issue_detection_and_metrics():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()

    rules = {f"{r['event_bus']}/{r['name']}": r for r in results["rules"]}
    assert "prod-payments/critical-payment-rule" in rules
    assert "prod-payments/broad-capture" in rules
    assert "prod-payments/fifo-rule" in rules
    assert "analytics-bus/disabled-old-rule" in rules

    critical = rules["prod-payments/critical-payment-rule"]
    critical_issues = {i["type"] for i in critical["issues"]}
    assert {"no_dlq", "single_target", "inefficient_retry_policy", "missing_tags"}.issubset(critical_issues)
    assert critical["metrics"]["failure_rate"] > 5

    broad = rules["prod-payments/broad-capture"]
    broad_issues = {i["type"] for i in broad["issues"]}
    assert "overly_broad_pattern" in broad_issues
    assert "no_input_transformation" in broad_issues

    fifo_rule = rules["prod-payments/fifo-rule"]
    fifo_issues = {i["type"] for i in fifo_rule["issues"]}
    assert "sqs_fifo_no_group_id" in fifo_issues

    disabled = rules["analytics-bus/disabled-old-rule"]
    disabled_issues = {i["type"] for i in disabled["issues"]}
    assert "disabled_rule" in disabled_issues


def test_low_invocation_rule_filtered_out():
    setup_eventbridge_resources()
    setup_low_traffic_rule()
    results, _ = run_analysis_script()
    rule_keys = {f"{r['event_bus']}/{r['name']}" for r in results["rules"]}
    assert "prod-payments/low-traffic-rule" not in rule_keys, "Low traffic rule should be excluded (<10/day)"


def test_dlq_and_pattern_outputs():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()

    # DLQ should show message count and unmonitored issue
    assert results["dlq_analysis"], "DLQ analysis should not be empty"
    dlq_entry = results["dlq_analysis"][0]
    assert dlq_entry["metrics"]["message_count"] >= 1
    dlq_issue_types = {i["type"] for i in dlq_entry["issues"]}
    assert "unmonitored_dlq" in dlq_issue_types

    # Pattern optimizations should exist for broad rule
    patterns = results["event_pattern_analysis"]
    assert patterns, "Event pattern analysis should not be empty"
    broad_pattern = next((p for p in patterns if p["rule"] == "broad-capture"), None)
    assert broad_pattern is not None
    assert broad_pattern["optimizations"], "Broad pattern should have optimization suggestions"


def test_pattern_issue_flagging_and_retry_policy():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()
    rules = {f"{r['event_bus']}/{r['name']}": r for r in results["rules"]}

    # Broad pattern flagged and optimized
    broad = rules["prod-payments/broad-capture"]
    broad_issue_types = {i["type"] for i in broad["issues"]}
    assert "overly_broad_pattern" in broad_issue_types

    # Time-sensitive rule should surface retry policy issue
    critical = rules["prod-payments/critical-payment-rule"]
    critical_issue_types = {i["type"] for i in critical["issues"]}
    assert "inefficient_retry_policy" in critical_issue_types


def test_target_specific_findings():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()
    rules = {f"{r['event_bus']}/{r['name']}": r for r in results["rules"]}

    fifo_targets = rules["prod-payments/fifo-rule"]["targets"]
    fifo_target_issues = {i["type"] for t in fifo_targets for i in t.get("issues", [])}
    assert "sqs_fifo_no_group_id" in fifo_target_issues

    dlq_targets = rules["prod-payments/broad-capture"]["targets"]
    assert any(t.get("dlq_configured") for t in dlq_targets), "Broad capture rule should have DLQ configured"


def test_dlq_monitoring_script_lists_queues():
    setup_eventbridge_resources()
    results, _ = run_analysis_script()
    script_path = os.path.join(os.path.dirname(__file__), "..", "dlq_monitoring_setup.sh")
    assert os.path.exists(script_path), "DLQ monitoring script should be generated"
    with open(script_path, "r") as fh:
        content = fh.read()
    # Queue name from setup should be present in the script when DLQ has messages
    assert "eventbridge-dlq" in content or any(
        dlq["arn"].split(":")[-1] in content for dlq in results.get("dlq_analysis", [])
    )
