import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client("s3")
sns_client = boto3.client("sns")

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def enable_s3_encryption(bucket_name: str) -> bool:
    """Enable default encryption on S3 bucket."""
    try:
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
        )
        print(f"Enabled encryption on bucket: {bucket_name}")
        return True
    except Exception as e:
        print(f"Error enabling encryption on {bucket_name}: {str(e)}")
        return False


def handler(event, context):
    """Auto-remediation Lambda for compliance violations."""
    print(f"Processing remediation. Event: {json.dumps(event)}")

    # Extract Config rule evaluation details
    detail = event.get("detail", {})
    config_rule_name = detail.get("configRuleName")
    resource_type = detail.get("resourceType")
    resource_id = detail.get("resourceId")
    compliance_type = detail.get("newEvaluationResult", {}).get("complianceType")

    if compliance_type != "NON_COMPLIANT":
        return {"statusCode": 200, "body": "Resource is compliant, no action needed"}

    remediation_log = {
        "timestamp": datetime.utcnow().isoformat(),
        "config_rule": config_rule_name,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": "none",
        "success": False,
    }

    # S3 bucket encryption remediation
    if resource_type == "AWS::S3::Bucket" and "encryption" in config_rule_name.lower():
        bucket_name = resource_id

        # Check if bucket name contains 'compliance' or 'audit' - extra safety
        if "compliance" in bucket_name or "audit" in bucket_name:
            print(f"Skipping remediation for critical bucket: {bucket_name}")
            remediation_log["action"] = "skipped_critical_bucket"
        else:
            success = enable_s3_encryption(bucket_name)
            remediation_log["action"] = "enable_encryption"
            remediation_log["success"] = success

            # Send SNS notification
            message = f"""
Automatic Remediation Performed

Resource Type: {resource_type}
Resource ID: {resource_id}
Action: Enable S3 bucket encryption
Success: {success}
Time: {remediation_log['timestamp']}
Config Rule: {config_rule_name}
            """

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="Auto-Remediation Notification",
                Message=message,
            )

    print(f"Remediation log: {json.dumps(remediation_log)}")

    return {
        "statusCode": 200,
        "body": json.dumps(remediation_log),
    }
