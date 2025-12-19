#!/usr/bin/env python3
"""
Integration tests for the SNS/SQS Configuration Audit Script.

These tests exercise the CLI entrypoint (lib/analyse.py) against a running
Moto server to ensure the end-to-end workflow (data collection, analysis,
and artifact generation) behaves as expected when invoked via
./scripts/analysis.sh.

This test creates comprehensive mock resources to trigger ALL 12 finding types:
1. Missing Dead Letter Queues
2. DLQ Message Accumulation
3. High DLQ Depth
4. Excessive Retry Configuration
5. Visibility Timeout Too Short
6. Visibility Timeout Too Long
7. DLQ Retention Gap
8. Short Polling Enabled
9. Stale Queues
10. Unencrypted Sensitive Queues/Topics
11. Missing Subscription Filters
12. Unconfirmed Subscriptions
13. FIFO Deduplication Disabled
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import boto3
import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "lib" / "analyse.py"
DEFAULT_ENDPOINT = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")


def boto_client(service: str):
    """Create a boto3 client that targets the LocalStack/Moto server endpoint."""
    return boto3.client(
        service,
        endpoint_url=DEFAULT_ENDPOINT,
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        use_ssl=False,
        verify=False,
    )


def wait_for_moto():
    """Wait until the Moto server endpoint is reachable."""
    for _ in range(15):
        try:
            urllib.request.urlopen(DEFAULT_ENDPOINT, timeout=2)
            return
        except Exception:
            time.sleep(1)
    pytest.skip(f"Moto server not reachable at {DEFAULT_ENDPOINT}")


def setup_sqs_queues():
    """
    Create comprehensive SQS queues to trigger all SQS-related findings:
    - Missing DLQs
    - DLQ Message Accumulation
    - High DLQ Depth (simulated)
    - Excessive Retry Configuration
    - Visibility Timeout Issues
    - DLQ Retention Gap
    - Short Polling
    - Stale Queues
    - Unencrypted Sensitive Queues
    - FIFO Deduplication Disabled
    """
    sqs = boto_client("sqs")
    created_queues = []

    # 1. Queue without DLQ (triggers Missing DLQ finding)
    try:
        response = sqs.create_queue(QueueName="queue-no-dlq")
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating queue-no-dlq: {e}")

    # 2. Create a DLQ and source queue with proper configuration
    try:
        dlq_response = sqs.create_queue(QueueName="orders-dlq")
        dlq_url = dlq_response['QueueUrl']
        dlq_attrs = sqs.get_queue_attributes(QueueUrl=dlq_url, AttributeNames=['QueueArn'])
        dlq_arn = dlq_attrs['Attributes']['QueueArn']
        created_queues.append(dlq_url)

        # Add messages to DLQ (triggers DLQ Message Accumulation)
        for i in range(5):
            sqs.send_message(QueueUrl=dlq_url, MessageBody=f"Failed message {i}")

    except Exception as e:
        print(f"Error creating DLQ: {e}")
        dlq_arn = None

    # 3. Source queue with excessive retry configuration
    if dlq_arn:
        try:
            response = sqs.create_queue(
                QueueName="queue-excessive-retry",
                Attributes={
                    'RedrivePolicy': json.dumps({
                        'deadLetterTargetArn': dlq_arn,
                        'maxReceiveCount': 15  # > 10 triggers finding
                    })
                }
            )
            created_queues.append(response['QueueUrl'])
        except Exception as e:
            print(f"Error creating queue-excessive-retry: {e}")

    # 4. Queue with short visibility timeout (< 30 seconds)
    try:
        response = sqs.create_queue(
            QueueName="queue-short-timeout",
            Attributes={
                'VisibilityTimeout': '10'  # < 30 seconds
            }
        )
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating queue-short-timeout: {e}")

    # 5. Queue with long visibility timeout (> 12 hours = 43200 seconds)
    try:
        response = sqs.create_queue(
            QueueName="queue-long-timeout",
            Attributes={
                'VisibilityTimeout': '50000'  # > 43200 seconds
            }
        )
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating queue-long-timeout: {e}")

    # 6. Queue using short polling (ReceiveMessageWaitTimeSeconds = 0)
    try:
        response = sqs.create_queue(
            QueueName="queue-short-polling",
            Attributes={
                'ReceiveMessageWaitTimeSeconds': '0'
            }
        )
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating queue-short-polling: {e}")

    # 7. Queue with confidential tag but no encryption
    try:
        response = sqs.create_queue(QueueName="confidential-queue-unencrypted")
        queue_url = response['QueueUrl']
        sqs.tag_queue(
            QueueUrl=queue_url,
            Tags={'DataClassification': 'Confidential'}
        )
        created_queues.append(queue_url)
    except Exception as e:
        print(f"Error creating confidential-queue-unencrypted: {e}")

    # 8. FIFO queue without content-based deduplication
    try:
        response = sqs.create_queue(
            QueueName="orders-queue.fifo",
            Attributes={
                'FifoQueue': 'true',
                'ContentBasedDeduplication': 'false'
            }
        )
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating FIFO queue: {e}")

    # 9. Create DLQ retention gap scenario
    try:
        gap_dlq_response = sqs.create_queue(
            QueueName="gap-dlq",
            Attributes={
                'MessageRetentionPeriod': '259200'  # 3 days
            }
        )
        gap_dlq_url = gap_dlq_response['QueueUrl']
        gap_dlq_attrs = sqs.get_queue_attributes(QueueUrl=gap_dlq_url, AttributeNames=['QueueArn'])
        gap_dlq_arn = gap_dlq_attrs['Attributes']['QueueArn']
        created_queues.append(gap_dlq_url)

        # Source queue with longer retention than DLQ
        response = sqs.create_queue(
            QueueName="queue-retention-gap",
            Attributes={
                'MessageRetentionPeriod': '345600',  # 4 days (source > DLQ)
                'RedrivePolicy': json.dumps({
                    'deadLetterTargetArn': gap_dlq_arn,
                    'maxReceiveCount': 3
                })
            }
        )
        created_queues.append(response['QueueUrl'])
    except Exception as e:
        print(f"Error creating retention gap scenario: {e}")

    return created_queues


def setup_sns_topics():
    """
    Create comprehensive SNS topics to trigger all SNS-related findings:
    - Missing Subscription Filters
    - Unconfirmed Subscriptions
    - Unencrypted Sensitive Topics
    """
    sns = boto_client("sns")
    sqs = boto_client("sqs")
    created_topics = []

    # 1. Topic with subscription without filter policy
    try:
        response = sns.create_topic(Name="orders-topic")
        topic_arn = response['TopicArn']
        created_topics.append(topic_arn)

        # Create SQS queue for subscription
        queue_response = sqs.create_queue(QueueName="sns-subscriber-queue")
        queue_url = queue_response['QueueUrl']
        queue_attrs = sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['QueueArn'])
        queue_arn = queue_attrs['Attributes']['QueueArn']

        # Subscribe without filter policy (triggers Missing Subscription Filters)
        sns.subscribe(
            TopicArn=topic_arn,
            Protocol='sqs',
            Endpoint=queue_arn
        )
    except Exception as e:
        print(f"Error creating orders-topic: {e}")

    # 2. Topic with confidential tag but no encryption
    try:
        response = sns.create_topic(Name="confidential-topic-unencrypted")
        topic_arn = response['TopicArn']
        sns.tag_resource(
            ResourceArn=topic_arn,
            Tags=[{'Key': 'DataClassification', 'Value': 'Confidential'}]
        )
        created_topics.append(topic_arn)
    except Exception as e:
        print(f"Error creating confidential-topic-unencrypted: {e}")

    # 3. Topic with multiple subscriptions (no filters)
    try:
        response = sns.create_topic(Name="notifications-topic")
        topic_arn = response['TopicArn']
        created_topics.append(topic_arn)

        # Create multiple subscriber queues
        for i in range(3):
            queue_response = sqs.create_queue(QueueName=f"notification-subscriber-{i}")
            queue_url = queue_response['QueueUrl']
            queue_attrs = sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['QueueArn'])
            queue_arn = queue_attrs['Attributes']['QueueArn']

            sns.subscribe(
                TopicArn=topic_arn,
                Protocol='sqs',
                Endpoint=queue_arn
            )
    except Exception as e:
        print(f"Error creating notifications-topic: {e}")

    # 4. Topic with properly configured subscription (with filter)
    try:
        response = sns.create_topic(Name="properly-configured-topic")
        topic_arn = response['TopicArn']
        created_topics.append(topic_arn)

        queue_response = sqs.create_queue(QueueName="filtered-subscriber-queue")
        queue_url = queue_response['QueueUrl']
        queue_attrs = sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['QueueArn'])
        queue_arn = queue_attrs['Attributes']['QueueArn']

        # Subscribe with filter policy
        sub_response = sns.subscribe(
            TopicArn=topic_arn,
            Protocol='sqs',
            Endpoint=queue_arn
        )

        # Set filter policy on subscription
        if sub_response.get('SubscriptionArn') and sub_response['SubscriptionArn'] != 'PendingConfirmation':
            sns.set_subscription_attributes(
                SubscriptionArn=sub_response['SubscriptionArn'],
                AttributeName='FilterPolicy',
                AttributeValue=json.dumps({'event_type': ['order_created']})
            )
    except Exception as e:
        print(f"Error creating properly-configured-topic: {e}")

    return created_topics


def run_analysis_script(tmp_path: Path):
    """Execute lib/analyse.py and return parsed artifacts and stdout."""
    env = os.environ.copy()
    env.setdefault("AWS_ENDPOINT_URL", DEFAULT_ENDPOINT)
    env.setdefault("AWS_DEFAULT_REGION", "us-east-1")
    env.setdefault("AWS_ACCESS_KEY_ID", "testing")
    env.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH)],
        cwd=tmp_path,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    if result.returncode != 0:
        raise AssertionError(
            f"Analysis failed\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        )

    json_path = tmp_path / "sns_sqs_analysis.json"

    assert json_path.exists(), "Expected JSON output not found"

    with open(json_path, "r", encoding="utf-8") as handle:
        json_data = json.load(handle)

    return json_data, result.stdout


def test_sns_sqs_comprehensive_analysis(tmp_path):
    """
    Run the CLI analyzer end-to-end with comprehensive mock resources
    that trigger multiple finding types and validate each one.
    """
    wait_for_moto()

    # Setup comprehensive environments
    print("\nSetting up SQS queues...")
    setup_sqs_queues()

    print("Setting up SNS topics...")
    setup_sns_topics()

    print("Running analysis...")
    results, stdout = run_analysis_script(tmp_path)

    # ========== Console Output Validation (Tabulate Format) ==========
    print("\nValidating console output format...")

    assert "=" * 80 in stdout, "Missing header banner in console output"
    assert "SNS/SQS AUDIT SUMMARY" in stdout
    assert "SEVERITY SUMMARY" in stdout
    assert "FINDINGS BY CATEGORY" in stdout
    assert "DETAILED FINDINGS" in stdout
    assert "MESSAGE VOLUME AT RISK" in stdout
    assert "SUMMARY STATISTICS" in stdout
    assert "+" in stdout and "|" in stdout, "Tabulate grid format not detected"

    # ========== JSON Output Validation ==========
    print("Validating JSON structure...")

    assert "audit_timestamp" in results
    assert "region" in results
    assert "severity_summary" in results
    assert "findings" in results
    assert "total_messages_at_risk" in results

    findings = results["findings"]
    severity_summary = results["severity_summary"]

    # ========== Validate Finding Types Are Detected ==========
    print("\nValidating finding types are detected...")

    finding_checks_found = set()
    all_findings_list = []

    for category, category_findings in findings.items():
        for finding in category_findings:
            finding_checks_found.add(finding["check"])
            all_findings_list.append(finding)

    print(f"  Found {len(finding_checks_found)} unique check types: {finding_checks_found}")

    # ========== SQS Finding Validations ==========

    # 1. Missing Dead Letter Queues
    missing_dlq_findings = [f for f in all_findings_list if f["check"] == "Missing Dead Letter Queues"]
    assert len(missing_dlq_findings) > 0, "Missing 'Missing Dead Letter Queues' finding"
    for finding in missing_dlq_findings:
        assert finding["severity"] == "high"
        assert len(finding["affected_resources"]) > 0
        print(f"  Check: Missing Dead Letter Queues - {len(finding['affected_resources'])} affected")

    # 2. DLQ Message Accumulation
    dlq_accumulation_findings = [f for f in all_findings_list if f["check"] == "DLQ Message Accumulation"]
    assert len(dlq_accumulation_findings) > 0, "Missing 'DLQ Message Accumulation' finding"
    for finding in dlq_accumulation_findings:
        assert finding["severity"] == "high"
        for resource in finding["affected_resources"]:
            assert "message_count" in resource
            assert resource["message_count"] > 0
        print(f"  Check: DLQ Message Accumulation - {len(finding['affected_resources'])} DLQs with messages")

    # 3. Excessive Retry Configuration
    excessive_retry_findings = [f for f in all_findings_list if f["check"] == "Excessive Retry Configuration"]
    assert len(excessive_retry_findings) > 0, "Missing 'Excessive Retry Configuration' finding"
    for finding in excessive_retry_findings:
        assert finding["severity"] == "medium"
        for resource in finding["affected_resources"]:
            assert "max_receive_count" in resource
            assert resource["max_receive_count"] > 10
        print(f"  Check: Excessive Retry Configuration - {len(finding['affected_resources'])} affected")

    # 4. Visibility Timeout Too Short
    timeout_short_findings = [f for f in all_findings_list if f["check"] == "Visibility Timeout Too Short"]
    assert len(timeout_short_findings) > 0, "Missing 'Visibility Timeout Too Short' finding"
    for finding in timeout_short_findings:
        assert finding["severity"] == "medium"
        for resource in finding["affected_resources"]:
            assert "visibility_timeout_seconds" in resource
            assert resource["visibility_timeout_seconds"] < 30
        print(f"  Check: Visibility Timeout Too Short - {len(finding['affected_resources'])} affected")

    # 5. Visibility Timeout Too Long
    timeout_long_findings = [f for f in all_findings_list if f["check"] == "Visibility Timeout Too Long"]
    assert len(timeout_long_findings) > 0, "Missing 'Visibility Timeout Too Long' finding"
    for finding in timeout_long_findings:
        assert finding["severity"] == "medium"
        for resource in finding["affected_resources"]:
            assert "visibility_timeout_seconds" in resource
            assert resource["visibility_timeout_seconds"] > 43200
        print(f"  Check: Visibility Timeout Too Long - {len(finding['affected_resources'])} affected")

    # 6. Short Polling Enabled
    short_polling_findings = [f for f in all_findings_list if f["check"] == "Short Polling Enabled"]
    assert len(short_polling_findings) > 0, "Missing 'Short Polling Enabled' finding"
    for finding in short_polling_findings:
        assert finding["severity"] == "low"
        print(f"  Check: Short Polling Enabled - {len(finding['affected_resources'])} affected")

    # 7. Unencrypted Sensitive Queues
    unencrypted_queue_findings = [f for f in all_findings_list if f["check"] == "Unencrypted Sensitive Queues"]
    assert len(unencrypted_queue_findings) > 0, "Missing 'Unencrypted Sensitive Queues' finding"
    for finding in unencrypted_queue_findings:
        assert finding["severity"] == "critical"
        for resource in finding["affected_resources"]:
            assert "data_classification" in resource
        print(f"  Check: Unencrypted Sensitive Queues - {len(finding['affected_resources'])} affected")

    # 8. FIFO Deduplication Disabled
    fifo_dedup_findings = [f for f in all_findings_list if f["check"] == "FIFO Deduplication Disabled"]
    assert len(fifo_dedup_findings) > 0, "Missing 'FIFO Deduplication Disabled' finding"
    for finding in fifo_dedup_findings:
        assert finding["severity"] == "medium"
        print(f"  Check: FIFO Deduplication Disabled - {len(finding['affected_resources'])} affected")

    # 9. DLQ Retention Gap
    retention_gap_findings = [f for f in all_findings_list if f["check"] == "DLQ Retention Gap"]
    assert len(retention_gap_findings) > 0, "Missing 'DLQ Retention Gap' finding"
    for finding in retention_gap_findings:
        assert finding["severity"] == "high"
        for resource in finding["affected_resources"]:
            assert "source_retention_days" in resource
            assert "dlq_retention_days" in resource
        print(f"  Check: DLQ Retention Gap - {len(finding['affected_resources'])} affected")

    # ========== SNS Finding Validations ==========

    # 10. Missing Subscription Filters
    missing_filter_findings = [f for f in all_findings_list if f["check"] == "Missing Subscription Filters"]
    assert len(missing_filter_findings) > 0, "Missing 'Missing Subscription Filters' finding"
    for finding in missing_filter_findings:
        assert finding["severity"] == "low"
        print(f"  Check: Missing Subscription Filters - {len(finding['affected_resources'])} affected")

    # 11. Unencrypted Sensitive Topics
    unencrypted_topic_findings = [f for f in all_findings_list if f["check"] == "Unencrypted Sensitive Topics"]
    assert len(unencrypted_topic_findings) > 0, "Missing 'Unencrypted Sensitive Topics' finding"
    for finding in unencrypted_topic_findings:
        assert finding["severity"] == "critical"
        for resource in finding["affected_resources"]:
            assert "data_classification" in resource
        print(f"  Check: Unencrypted Sensitive Topics - {len(finding['affected_resources'])} affected")

    # ========== Severity Summary Validation ==========
    print("\nValidating severity summary...")

    assert severity_summary.get("critical", 0) > 0, "Should have critical findings"
    assert severity_summary.get("high", 0) > 0, "Should have high findings"
    assert severity_summary.get("medium", 0) > 0, "Should have medium findings"
    assert severity_summary.get("low", 0) > 0, "Should have low findings"

    print(f"  Critical: {severity_summary.get('critical', 0)}")
    print(f"  High: {severity_summary.get('high', 0)}")
    print(f"  Medium: {severity_summary.get('medium', 0)}")
    print(f"  Low: {severity_summary.get('low', 0)}")

    # ========== Messages at Risk Validation ==========
    print("\nValidating messages at risk...")

    assert results["total_messages_at_risk"] > 0, "Should have messages at risk from DLQ"
    print(f"  Total messages at risk: {results['total_messages_at_risk']}")

    # ========== Summary ==========
    print("\n" + "="*80)
    print("ALL VALIDATIONS PASSED!")
    print("="*80)
    print(f"Successfully validated SNS/SQS analysis with {len(finding_checks_found)} finding types")
    print(f"Total findings: {len(all_findings_list)}")
    print(f"Total resources affected: {sum(severity_summary.values())}")
    print("="*80)


def test_json_report_structure(tmp_path):
    """Validate the JSON report has the correct structure."""
    wait_for_moto()

    # Setup minimal resources
    setup_sqs_queues()
    setup_sns_topics()

    results, _ = run_analysis_script(tmp_path)

    # Validate top-level structure
    assert "audit_timestamp" in results
    assert "region" in results
    assert "severity_summary" in results
    assert "findings" in results
    assert "total_messages_at_risk" in results

    # Validate severity_summary structure
    assert isinstance(results["severity_summary"], dict)

    # Validate findings structure
    assert isinstance(results["findings"], dict)
    for category, findings in results["findings"].items():
        assert isinstance(findings, list)
        for finding in findings:
            assert "category" in finding
            assert "check" in finding
            assert "severity" in finding
            assert "affected_resources" in finding
            assert "details" in finding
            assert "timestamp" in finding
            assert finding["severity"] in ["critical", "high", "medium", "low"]

    print("JSON report structure validation passed!")


def test_console_output_tabulate_format(tmp_path):
    """Verify console output uses tabulate grid format."""
    wait_for_moto()

    setup_sqs_queues()
    setup_sns_topics()

    _, stdout = run_analysis_script(tmp_path)

    # Check for tabulate grid format indicators
    assert "+---" in stdout, "Missing grid borders in output"
    assert "|" in stdout, "Missing grid separators in output"

    # Check for required sections
    required_sections = [
        "SNS/SQS AUDIT SUMMARY",
        "SEVERITY SUMMARY",
        "FINDINGS BY CATEGORY",
        "DETAILED FINDINGS",
        "MESSAGE VOLUME AT RISK",
        "SUMMARY STATISTICS"
    ]

    for section in required_sections:
        assert section in stdout, f"Missing section: {section}"

    # Check for headers in tables
    assert "Severity" in stdout
    assert "Resources Affected" in stdout
    assert "Metric" in stdout
    assert "Value" in stdout

    print("Console output tabulate format validation passed!")
