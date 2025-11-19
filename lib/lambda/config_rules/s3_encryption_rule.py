import json
import boto3

config_client = boto3.client("config")


def evaluate_compliance(configuration_item):
    """Evaluate S3 bucket encryption compliance."""
    # This is a placeholder for custom rule logic
    # In production, AWS managed rule S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED is used
    return "COMPLIANT"


def handler(event, context):
    """Config rule Lambda for S3 bucket encryption."""
    print(f"Config rule evaluation: {json.dumps(event)}")

    # Extract configuration item
    invoking_event = json.loads(event.get("invokingEvent", "{}"))
    configuration_item = invoking_event.get("configurationItem", {})

    compliance_status = evaluate_compliance(configuration_item)

    # Report evaluation result back to Config
    response = config_client.put_evaluations(
        Evaluations=[
            {
                "ComplianceResourceType": configuration_item.get("resourceType"),
                "ComplianceResourceId": configuration_item.get("resourceId"),
                "ComplianceType": compliance_status,
                "OrderingTimestamp": configuration_item.get("configurationItemCaptureTime"),
            }
        ],
        ResultToken=event.get("resultToken"),
    )

    return response
