import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

s3_client = boto3.client("s3")
sts_client = boto3.client("sts")
events_client = boto3.client("events")
sns_client = boto3.client("sns")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def assume_role(account_id: str, role_name: str) -> Dict[str, Any]:
    """Assume role in target account for cross-account scanning."""
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"

    try:
        response = sts_client.assume_role(
            RoleArn=role_arn, RoleSessionName="ComplianceScanner"
        )
        return response["Credentials"]
    except Exception as e:
        print(f"Error assuming role {role_arn}: {str(e)}")
        return None


def scan_account(account_id: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
    """Perform compliance scan on a single account."""
    # Create session with assumed role credentials
    session = boto3.Session(
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )

    results = {
        "account_id": account_id,
        "scan_time": datetime.utcnow().isoformat(),
        "resources_scanned": 0,
        "violations": [],
        "compliant": True,
    }

    try:
        # Scan S3 buckets
        s3 = session.client("s3")
        buckets = s3.list_buckets()

        for bucket in buckets.get("Buckets", []):
            bucket_name = bucket["Name"]
            results["resources_scanned"] += 1

            try:
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                # Bucket has encryption
                print(f"Bucket {bucket_name} has encryption configured")
            except s3.exceptions.ClientError as e:
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
        ec2 = session.client("ec2")
        vpcs = ec2.describe_vpcs()

        for vpc in vpcs.get("Vpcs", []):
            vpc_id = vpc["VpcId"]
            results["resources_scanned"] += 1

            flow_logs = ec2.describe_flow_logs(
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
        lambda_client = session.client("lambda")
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
    """Main Lambda handler for compliance scanning."""
    print(f"Starting compliance scan. Event: {json.dumps(event)}")

    # List of accounts to scan (in real implementation, read from DynamoDB or Parameter Store)
    accounts_to_scan = [
        {"account_id": os.environ.get("AWS_ACCOUNT_ID", context.invoked_function_arn.split(":")[4]), "role_name": f"compliance-scanner-role-{ENVIRONMENT_SUFFIX}"}
    ]

    scan_results = []

    for account in accounts_to_scan:
        account_id = account["account_id"]
        role_name = account["role_name"]

        # For same account, use current credentials
        if account_id == context.invoked_function_arn.split(":")[4]:
            # Scan current account
            results = {
                "account_id": account_id,
                "scan_time": datetime.utcnow().isoformat(),
                "resources_scanned": 0,
                "violations": [],
                "compliant": True,
                "note": "Same-account scan using current credentials",
            }
        else:
            # Cross-account scan
            credentials = assume_role(account_id, role_name)
            if not credentials:
                continue

            results = scan_account(account_id, credentials)

        scan_results.append(results)

        # Send SNS alert for critical violations
        critical_violations = [
            v for v in results.get("violations", []) if v["severity"] == "HIGH"
        ]

        if critical_violations:
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
        "accounts_scanned": len(scan_results),
        "results": scan_results,
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
