#!/usr/bin/env python
"""Extract outputs from Terraform state."""
import json
import subprocess
import sys

def get_state():
    """Get terraform state."""
    try:
        result = subprocess.run(
            ["terraform", "state", "pull"],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error getting state: {e}")
        return None

def extract_outputs(state):
    """Extract important outputs from state."""
    outputs = {}

    if not state or "resources" not in state:
        return outputs

    for resource in state["resources"]:
        if resource["type"] == "aws_ecr_repository":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["ECRRepositoryName"] = attrs.get("name", "")
                outputs["ECRRepositoryArn"] = attrs.get("arn", "")
                outputs["ECRRepositoryUrl"] = attrs.get("repository_url", "")

        elif resource["type"] == "aws_dynamodb_table":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["DynamoDBTableName"] = attrs.get("name", "")
                outputs["DynamoDBTableArn"] = attrs.get("arn", "")

        elif resource["type"] == "aws_lambda_function":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["LambdaFunctionName"] = attrs.get("function_name", "")
                outputs["LambdaFunctionArn"] = attrs.get("arn", "")

        elif resource["type"] == "aws_sns_topic":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["SNSTopicArn"] = attrs.get("arn", "")
                outputs["SNSTopicName"] = attrs.get("name", "")

        elif resource["type"] == "aws_cloudwatch_event_rule":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["EventRuleName"] = attrs.get("name", "")
                outputs["EventRuleArn"] = attrs.get("arn", "")

        elif resource["type"] == "aws_cloudwatch_dashboard":
            for instance in resource.get("instances", []):
                attrs = instance.get("attributes", {})
                outputs["DashboardName"] = attrs.get("dashboard_name", "")
                outputs["DashboardArn"] = attrs.get("dashboard_arn", "")

    return outputs

if __name__ == "__main__":
    state = get_state()
    if state:
        outputs = extract_outputs(state)

        # Save flat outputs
        with open("flat-outputs.json", "w") as f:
            json.dump(outputs, f, indent=2)

        print(json.dumps(outputs, indent=2))
        sys.exit(0)
    else:
        sys.exit(1)