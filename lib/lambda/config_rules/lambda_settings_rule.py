import json
import boto3

config_client = boto3.client("config")
lambda_client = boto3.client("lambda")


def evaluate_compliance(configuration_item):
    """Evaluate Lambda function settings compliance."""
    function_name = configuration_item.get("resourceName")

    try:
        # Get function configuration
        response = lambda_client.get_function_configuration(FunctionName=function_name)

        # Check X-Ray tracing
        tracing_mode = response.get("TracingConfig", {}).get("Mode")
        if tracing_mode != "Active":
            return "NON_COMPLIANT"

        # Check reserved concurrency
        try:
            concurrency = lambda_client.get_function_concurrency(
                FunctionName=function_name
            )
            if "ReservedConcurrentExecutions" not in concurrency:
                return "NON_COMPLIANT"
        except lambda_client.exceptions.ResourceNotFoundException:
            return "NON_COMPLIANT"

        return "COMPLIANT"

    except Exception as e:
        print(f"Error evaluating Lambda settings: {str(e)}")
        return "NOT_APPLICABLE"


def handler(event, context):
    """Config rule Lambda for Lambda settings."""
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
