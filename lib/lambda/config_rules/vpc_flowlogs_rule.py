import json
import boto3

config_client = boto3.client("config")
ec2_client = boto3.client("ec2")


def evaluate_compliance(configuration_item):
    """Evaluate VPC flow logs compliance."""
    vpc_id = configuration_item.get("resourceId")

    try:
        # Check if flow logs are enabled
        response = ec2_client.describe_flow_logs(
            Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
        )

        flow_logs = response.get("FlowLogs", [])

        if not flow_logs:
            return "NON_COMPLIANT"

        # Check naming convention
        for flow_log in flow_logs:
            log_group_name = flow_log.get("LogGroupName", "")
            if "audit-flowlogs" in log_group_name:
                return "COMPLIANT"

        return "NON_COMPLIANT"

    except Exception as e:
        print(f"Error evaluating VPC flow logs: {str(e)}")
        return "NOT_APPLICABLE"


def handler(event, context):
    """Config rule Lambda for VPC flow logs."""
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
