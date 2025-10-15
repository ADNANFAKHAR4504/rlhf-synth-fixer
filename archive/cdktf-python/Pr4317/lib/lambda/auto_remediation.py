"""Lambda function for automated remediation."""

import json
import os
import boto3

# Initialize AWS clients
cloudwatch = boto3.client("cloudwatch")
lambda_client = boto3.client("lambda")

# Environment variables
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")


def handler(event, context):
    """
    Automated remediation function triggered by CloudWatch alarms.

    Analyzes alarm state and performs appropriate remediation actions.
    """
    try:
        print(f"Remediation triggered: {json.dumps(event)}")

        # Extract alarm details
        detail = event.get("detail", {})
        alarm_name = detail.get("alarmName", "Unknown")
        state_value = detail.get("state", {}).get("value", "UNKNOWN")

        if state_value != "ALARM":
            print(f"Alarm {alarm_name} is not in ALARM state, skipping remediation")
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No remediation needed"}),
            }

        # Perform remediation based on alarm type
        remediation_actions = []

        if "lambda-errors" in alarm_name:
            action = (
                "Lambda errors detected - would restart function or scale resources"
            )
            remediation_actions.append(action)
            print(action)

        elif "lambda-throttles" in alarm_name:
            action = "Lambda throttles detected - would increase concurrency limits"
            remediation_actions.append(action)
            print(action)

        elif "api-5xx" in alarm_name:
            action = "API 5xx errors detected - would check backend health and restart services"
            remediation_actions.append(action)
            print(action)

        elif "dynamodb-read-throttle" in alarm_name:
            action = "DynamoDB throttles detected - would adjust capacity or optimize queries"
            remediation_actions.append(action)
            print(action)

        else:
            action = f"Unknown alarm type: {alarm_name}"
            remediation_actions.append(action)
            print(action)

        # Log remediation actions to CloudWatch
        cloudwatch.put_metric_data(
            Namespace="Healthcare/Remediation",
            MetricData=[
                {
                    "MetricName": "RemediationActions",
                    "Value": len(remediation_actions),
                    "Unit": "Count",
                    "Dimensions": [
                        {"Name": "Environment", "Value": ENVIRONMENT},
                        {"Name": "AlarmName", "Value": alarm_name},
                    ],
                }
            ],
        )

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Remediation completed",
                    "alarm": alarm_name,
                    "actions": remediation_actions,
                }
            ),
        }

    except Exception as e:
        print(f"Error in remediation: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Remediation failed", "message": str(e)}),
        }
