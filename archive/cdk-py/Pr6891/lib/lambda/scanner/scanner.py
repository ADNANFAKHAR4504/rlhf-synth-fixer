import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

s3_client = boto3.client("s3")
ec2_client = boto3.client("ec2")
lambda_client = boto3.client("lambda")
events_client = boto3.client("events")
sns_client = boto3.client("sns")
sts_client = boto3.client("sts")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def scan_current_account() -> Dict[str, Any]:
    """Perform compliance scan on the current AWS account."""
    # Get current account ID
    account_id = sts_client.get_caller_identity()["Account"]

    results = {
        "account_id": account_id,
        "scan_time": datetime.utcnow().isoformat(),
        "resources_scanned": 0,
        "violations": [],
        "compliant": True,
    }

    try:
        # Scan S3 buckets
        buckets = s3_client.list_buckets()

        for bucket in buckets.get("Buckets", []):
            bucket_name = bucket["Name"]
            results["resources_scanned"] += 1

            try:
                encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                # Bucket has encryption
                print(f"Bucket {bucket_name} has encryption configured")
            except s3_client.exceptions.ClientError as e:
                if e.response["Error"]["Code"] == "ServerSideEncryptionConfigurationNotFoundError":
                    results["violations"].append(
                        {
                            "resource_type": "S3",
                            "resource_id": bucket_name,
                            "violation": "No encryption configured",
                            "severity": "HIGH",
                        }
                    )
                    results["compliant"] = False

        # Scan VPCs for flow logs
        vpcs = ec2_client.describe_vpcs()

        for vpc in vpcs.get("Vpcs", []):
            vpc_id = vpc["VpcId"]
            results["resources_scanned"] += 1

            flow_logs = ec2_client.describe_flow_logs(
                Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
            )

            if not flow_logs.get("FlowLogs"):
                results["violations"].append(
                    {
                        "resource_type": "VPC",
                        "resource_id": vpc_id,
                        "violation": "VPC flow logs not enabled",
                        "severity": "MEDIUM",
                    }
                )
                results["compliant"] = False

        # Scan Lambda functions
        functions = lambda_client.list_functions()

        for function in functions.get("Functions", []):
            function_name = function["FunctionName"]
            results["resources_scanned"] += 1

            # Check for X-Ray tracing
            if function.get("TracingConfig", {}).get("Mode") != "Active":
                results["violations"].append(
                    {
                        "resource_type": "Lambda",
                        "resource_id": function_name,
                        "violation": "X-Ray tracing not enabled",
                        "severity": "LOW",
                    }
                )

            # Check for reserved concurrency
            try:
                concurrency = lambda_client.get_function_concurrency(
                    FunctionName=function_name
                )
                if "ReservedConcurrentExecutions" not in concurrency:
                    results["violations"].append(
                        {
                            "resource_type": "Lambda",
                            "resource_id": function_name,
                            "violation": "No reserved concurrent executions set",
                            "severity": "MEDIUM",
                        }
                    )
            except Exception:
                pass

    except Exception as e:
        print(f"Error scanning account {account_id}: {str(e)}")
        results["error"] = str(e)

    return results


def handler(event, context):
    """Main Lambda handler for compliance scanning in current account."""
    print(f"Starting compliance scan. Event: {json.dumps(event)}")

    # Scan the current account
    results = scan_current_account()

    # Send SNS alert for critical violations
    critical_violations = [
        v for v in results.get("violations", []) if v["severity"] == "HIGH"
    ]

    if critical_violations:
        account_id = results["account_id"]
        message = f"""
Critical compliance violations detected in account {account_id}:

{json.dumps(critical_violations, indent=2)}

Scan time: {results['scan_time']}
Total violations: {len(results.get('violations', []))}
        """

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN, Subject="Critical Compliance Alert", Message=message
        )

    # Store scan summary in S3
    summary = {
        "scan_id": context.request_id,
        "scan_time": datetime.utcnow().isoformat(),
        "account_id": results["account_id"],
        "results": results,
    }

    summary_key = f"scans/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET, Key=summary_key, Body=json.dumps(summary, indent=2)
    )

    # Emit completion event for report generation
    events_client.put_events(
        Entries=[
            {
                "Source": "compliance.scanner",
                "DetailType": "Scan Complete",
                "Detail": json.dumps(
                    {"scan_id": context.request_id, "summary_key": summary_key}
                ),
            }
        ]
    )

    return {"statusCode": 200, "body": json.dumps(summary)}
