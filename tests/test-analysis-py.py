"""
REQUIRED Mock Configuration Setup for FinTech Webhook Infrastructure Analysis Testing
=====================================================================================

This setup is MANDATORY for running and testing FinTech webhook processor infrastructure analysis.
All implementations must follow this testing framework to ensure consistent mocking and validation.

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
   a. Create setup functions for each resource type:
      - API Gateway
      - Lambda Functions
      - DynamoDB Tables
      - SNS Topics
      - SQS Queues
      - CloudWatch resources

3. Create Test Functions (REQUIRED):
   - Test each component of the analysis
   - Validate JSON output structure
   - Verify findings are detected correctly

Standard Implementation:
----------------------
This test suite creates mock FinTech webhook processing infrastructure and validates
that the analysis script correctly identifies security, performance, cost, and
resilience issues.
"""

import json
import os
import subprocess
import sys
import time
import zipfile
from io import BytesIO

import boto3
import pytest


def boto_client(service: str):
    """Create boto3 client with environment configuration."""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def create_lambda_zip():
    """Create a minimal Lambda deployment package."""
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr('lambda_function.py', 'def handler(event, context):\n    return {"statusCode": 200}')
    zip_buffer.seek(0)
    return zip_buffer.read()


def setup_api_gateway():
    """Set up mock API Gateway."""
    apigw = boto_client("apigateway")

    try:
        # Create REST API
        api_response = apigw.create_rest_api(
            name="fintech-webhook-api",
            description="Test FinTech Webhook API"
        )
        api_id = api_response['id']

        # Create API key
        apigw.create_api_key(
            name="test-api-key",
            description="Test API Key",
            enabled=True
        )

        print(f"Created API Gateway: {api_id}")
    except Exception as e:
        print(f"API Gateway setup error: {e}")


def setup_lambda_functions():
    """Set up mock Lambda functions."""
    lambda_client = boto_client("lambda")
    iam = boto_client("iam")

    # Create IAM role for Lambda
    try:
        role_response = iam.create_role(
            RoleName="test-lambda-role",
            AssumeRolePolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )
        role_arn = role_response['Role']['Arn']
    except Exception as e:
        print(f"IAM role already exists: {e}")
        role_arn = "arn:aws:iam::123456789012:role/test-lambda-role"

    # Create Lambda functions
    function_configs = [
        {
            "name": "webhook_handler",
            "runtime": "python3.11",
            "memory": 512,
            "timeout": 30,
            "architecture": ["arm64"]
        },
        {
            "name": "transaction_processor",
            "runtime": "python3.11",
            "memory": 1024,
            "timeout": 60,
            "architecture": ["x86_64"]  # Intentionally not arm64 to trigger finding
        },
        {
            "name": "audit_logger",
            "runtime": "python3.11",
            "memory": 512,
            "timeout": 30,
            "architecture": ["arm64"]
        }
    ]

    zip_content = create_lambda_zip()

    for config in function_configs:
        try:
            lambda_client.create_function(
                FunctionName=config["name"],
                Runtime=config["runtime"],
                Role=role_arn,
                Handler="lambda_function.handler",
                Code={"ZipFile": zip_content},
                MemorySize=config["memory"],
                Timeout=config["timeout"],
                Architectures=config["architecture"],
                Environment={
                    "Variables": {
                        "TOPIC_ARN": "arn:aws:sns:us-east-1:123456789012:test-topic",
                        "EXPECTED_API_KEY_HASH": "test-hash"  # Will trigger security finding
                    }
                }
            )
            print(f"Created Lambda function: {config['name']}")
        except Exception as e:
            print(f"Lambda function {config['name']} setup error: {e}")


def setup_dynamodb_tables():
    """Set up mock DynamoDB tables."""
    dynamodb = boto_client("dynamodb")

    # Create tables matching the webhook processor design
    tables = [
        {
            "name": "transactions",
            "key_schema": [
                {"AttributeName": "transaction_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "attribute_definitions": [
                {"AttributeName": "transaction_id", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"}
            ]
        },
        {
            "name": "audit_logs",
            "key_schema": [
                {"AttributeName": "event_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            "attribute_definitions": [
                {"AttributeName": "event_id", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"}
            ]
        }
    ]

    for table_config in tables:
        try:
            dynamodb.create_table(
                TableName=table_config["name"],
                KeySchema=table_config["key_schema"],
                AttributeDefinitions=table_config["attribute_definitions"],
                BillingMode="PAY_PER_REQUEST"
            )
            print(f"Created DynamoDB table: {table_config['name']}")
        except Exception as e:
            print(f"DynamoDB table {table_config['name']} setup error: {e}")


def setup_sns_topics():
    """Set up mock SNS topics."""
    sns = boto_client("sns")
    lambda_client = boto_client("lambda")

    try:
        # Create payment events topic
        topic_response = sns.create_topic(Name="payment_events")
        topic_arn = topic_response['TopicArn']

        # Create subscriptions
        lambda_functions = ["transaction_processor", "audit_logger"]
        for func_name in lambda_functions:
            try:
                func_arn = f"arn:aws:lambda:us-east-1:123456789012:function:{func_name}"
                sns.subscribe(
                    TopicArn=topic_arn,
                    Protocol="lambda",
                    Endpoint=func_arn
                )
            except Exception as e:
                print(f"SNS subscription error for {func_name}: {e}")

        # Create alarm notification topic
        sns.create_topic(Name="fintech-webhook-alarms")

        print(f"Created SNS topics")
    except Exception as e:
        print(f"SNS setup error: {e}")


def setup_sqs_queues():
    """Set up mock SQS Dead Letter Queues."""
    sqs = boto_client("sqs")

    dlq_names = [
        "webhook-handler-dlq",
        "transaction-processor-dlq"
    ]

    for queue_name in dlq_names:
        try:
            sqs.create_queue(
                QueueName=queue_name,
                Attributes={
                    "MessageRetentionPeriod": "1209600"  # 14 days
                }
            )
            print(f"Created SQS queue: {queue_name}")
        except Exception as e:
            print(f"SQS queue {queue_name} setup error: {e}")


def setup_cloudwatch_alarms():
    """Set up mock CloudWatch alarms."""
    cloudwatch = boto_client("cloudwatch")

    try:
        # Create error rate alarm
        cloudwatch.put_metric_alarm(
            AlarmName="transaction-processor-error-rate",
            ComparisonOperator="GreaterThanThreshold",
            EvaluationPeriods=1,
            MetricName="Errors",
            Namespace="AWS/Lambda",
            Period=300,
            Statistic="Average",
            Threshold=1.0,
            ActionsEnabled=True,
            AlarmDescription="Transaction processor error rate > 1%"
        )

        print("Created CloudWatch alarms")
    except Exception as e:
        print(f"CloudWatch alarm setup error: {e}")


def setup_log_groups():
    """Set up mock CloudWatch log groups."""
    logs = boto_client("logs")

    log_groups = [
        "/aws/lambda/webhook_handler",
        "/aws/lambda/transaction_processor",
        "/aws/lambda/audit_logger"
    ]

    for log_group_name in log_groups:
        try:
            logs.create_log_group(logGroupName=log_group_name)

            # Set retention for some but not all (to trigger findings)
            if "webhook_handler" in log_group_name:
                logs.put_retention_policy(
                    logGroupName=log_group_name,
                    retentionInDays=30
                )

            print(f"Created log group: {log_group_name}")
        except Exception as e:
            print(f"Log group {log_group_name} setup error: {e}")


def run_analysis_script():
    """Helper to run the analysis script and return JSON results."""
    # Path to script and output file
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "lib", "analysis-results.json")

    # Remove old JSON file if it exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    # Read and parse the JSON output file
    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_infrastructure_discovery():
    """Test that the analysis discovers all infrastructure components."""
    # Setup all infrastructure
    setup_api_gateway()
    setup_lambda_functions()
    setup_dynamodb_tables()
    setup_sns_topics()
    setup_sqs_queues()
    setup_cloudwatch_alarms()
    setup_log_groups()

    # Run analysis
    results = run_analysis_script()

    # Validate structure
    assert "summary" in results, "Summary section missing from results"
    assert "findings" in results, "Findings section missing from results"
    assert "infrastructure" in results, "Infrastructure section missing from results"

    # Check infrastructure discovery
    summary = results["summary"]
    assert summary["total_lambda_functions"] >= 3, f"Expected at least 3 Lambda functions, got {summary['total_lambda_functions']}"
    assert summary["total_dynamodb_tables"] >= 2, f"Expected at least 2 DynamoDB tables, got {summary['total_dynamodb_tables']}"
    assert summary["total_sns_topics"] >= 2, f"Expected at least 2 SNS topics, got {summary['total_sns_topics']}"
    assert summary["total_sqs_queues"] >= 2, f"Expected at least 2 SQS queues, got {summary['total_sqs_queues']}"


def test_security_findings():
    """Test that security issues are detected."""
    # Setup infrastructure
    setup_lambda_functions()
    setup_dynamodb_tables()

    # Run analysis
    results = run_analysis_script()

    # Check for security findings
    findings = results.get("findings", [])
    security_findings = [f for f in findings if f["category"] == "Security"]

    assert len(security_findings) > 0, "Expected security findings to be detected"

    # Check for specific security issues
    finding_issues = [f["issue"] for f in security_findings]

    # Should detect sensitive environment variables
    has_env_var_finding = any("environment variable" in issue.lower() for issue in finding_issues)
    assert has_env_var_finding, "Expected finding about sensitive environment variables"


def test_performance_findings():
    """Test that performance issues are detected."""
    # Setup infrastructure
    setup_lambda_functions()

    # Run analysis
    results = run_analysis_script()

    # Check for performance findings
    findings = results.get("findings", [])
    performance_findings = [f for f in findings if f["category"] == "Performance"]

    assert len(performance_findings) > 0, "Expected performance findings to be detected"


def test_cost_optimization_findings():
    """Test that cost optimization opportunities are detected."""
    # Setup infrastructure
    setup_lambda_functions()
    setup_dynamodb_tables()
    setup_log_groups()

    # Run analysis
    results = run_analysis_script()

    # Check for cost findings
    findings = results.get("findings", [])
    cost_findings = [f for f in findings if f["category"] == "Cost"]

    assert len(cost_findings) > 0, "Expected cost optimization findings to be detected"

    # Should detect non-ARM64 architecture
    architecture_findings = [f for f in cost_findings if "arm64" in f["issue"].lower()]
    assert len(architecture_findings) > 0, "Expected finding about ARM64 architecture"


def test_resilience_findings():
    """Test that resilience issues are detected."""
    # Setup infrastructure
    setup_lambda_functions()
    setup_sqs_queues()
    setup_cloudwatch_alarms()

    # Run analysis
    results = run_analysis_script()

    # Check for resilience findings
    findings = results.get("findings", [])
    resilience_findings = [f for f in findings if f["category"] == "Resilience"]

    assert len(resilience_findings) > 0, "Expected resilience findings to be detected"


def test_monitoring_findings():
    """Test that monitoring gaps are detected."""
    # Setup infrastructure without comprehensive monitoring
    setup_lambda_functions()
    # Don't set up alarms to trigger monitoring findings

    # Run analysis
    results = run_analysis_script()

    # Check for monitoring findings
    findings = results.get("findings", [])
    monitoring_findings = [f for f in findings if f["category"] == "Monitoring"]

    # Should detect missing alarms
    assert len(monitoring_findings) > 0, "Expected monitoring findings to be detected"


def test_findings_severity_levels():
    """Test that findings have appropriate severity levels."""
    # Setup infrastructure
    setup_lambda_functions()
    setup_dynamodb_tables()
    setup_sqs_queues()

    # Run analysis
    results = run_analysis_script()

    # Check severity distribution
    findings_by_severity = results.get("findings_by_severity", {})

    assert "high" in findings_by_severity, "High severity findings missing"
    assert "medium" in findings_by_severity, "Medium severity findings missing"
    assert "low" in findings_by_severity, "Low severity findings missing"

    # Validate findings have proper structure
    findings = results.get("findings", [])
    for finding in findings:
        assert "category" in finding, "Finding missing category"
        assert "severity" in finding, "Finding missing severity"
        assert "resource_type" in finding, "Finding missing resource_type"
        assert "resource_id" in finding, "Finding missing resource_id"
        assert "issue" in finding, "Finding missing issue"
        assert "recommendation" in finding, "Finding missing recommendation"

        # Validate severity values
        assert finding["severity"] in ["HIGH", "MEDIUM", "LOW"], f"Invalid severity: {finding['severity']}"


def test_json_report_structure():
    """Test that the JSON report has the correct structure."""
    # Setup minimal infrastructure
    setup_lambda_functions()

    # Run analysis
    results = run_analysis_script()

    # Validate top-level structure
    required_keys = ["timestamp", "region", "summary", "findings_by_severity",
                     "findings_by_category", "findings", "infrastructure"]

    for key in required_keys:
        assert key in results, f"Required key '{key}' missing from results"

    # Validate summary structure
    summary = results["summary"]
    summary_keys = ["total_api_gateways", "total_lambda_functions", "total_dynamodb_tables",
                    "total_sns_topics", "total_sqs_queues", "total_cloudwatch_alarms", "total_findings"]

    for key in summary_keys:
        assert key in summary, f"Required key '{key}' missing from summary"

    # Validate findings structure
    findings = results["findings"]
    assert isinstance(findings, list), "Findings should be a list"

    # Validate infrastructure structure
    infrastructure = results["infrastructure"]
    assert isinstance(infrastructure, dict), "Infrastructure should be a dictionary"


def test_dynamodb_pitr_detection():
    """Test detection of missing PITR on DynamoDB tables."""
    # Setup DynamoDB tables (moto may not fully support PITR, but we test the logic)
    setup_dynamodb_tables()

    # Run analysis
    results = run_analysis_script()

    # Check for PITR findings
    findings = results.get("findings", [])
    pitr_findings = [f for f in findings
                    if "point-in-time recovery" in f["issue"].lower() or "pitr" in f["issue"].lower()]

    # Should detect PITR issues on tables
    assert len(pitr_findings) > 0, "Expected to detect missing PITR on DynamoDB tables"


def test_lambda_architecture_detection():
    """Test detection of non-ARM64 Lambda functions."""
    # Setup Lambda functions (transaction_processor uses x86_64)
    setup_lambda_functions()

    # Run analysis
    results = run_analysis_script()

    # Check for architecture findings
    findings = results.get("findings", [])
    arch_findings = [f for f in findings if "arm64" in f["issue"].lower()]

    # Should detect at least one function not using ARM64
    assert len(arch_findings) >= 1, "Expected to detect Lambda function not using ARM64 architecture"

    # Verify it found the transaction_processor
    transaction_proc_findings = [f for f in arch_findings if "transaction_processor" in f["resource_id"]]
    assert len(transaction_proc_findings) > 0, "Expected to flag transaction_processor for not using ARM64"
