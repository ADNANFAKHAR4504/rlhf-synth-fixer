"""
EC2 Tag Checker Lambda Function

Checks EC2 instances for required tags and reports compliance status.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

ec2_client = boto3.client('ec2')
dynamodb_client = boto3.client('dynamodb')
sns_client = boto3.client('sns')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for EC2 tag compliance checking.

    Args:
        event: Lambda event containing Config rule evaluation or scheduled trigger
        context: Lambda context

    Returns:
        Dict with evaluation results
    """
    try:
        print(f"Event received: {json.dumps(event)}")

        # Get all EC2 instances
        response = ec2_client.describe_instances()

        evaluation_results = []
        non_compliant_resources = []

        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance['InstanceId']
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                # Check for required tags
                missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

                is_compliant = len(missing_tags) == 0
                compliance_type = 'COMPLIANT' if is_compliant else 'NON_COMPLIANT'

                timestamp = datetime.utcnow().isoformat()

                # Store evaluation in DynamoDB
                dynamodb_client.put_item(
                    TableName=DYNAMODB_TABLE,
                    Item={
                        'resource_id': {'S': instance_id},
                        'evaluation_timestamp': {'S': timestamp},
                        'compliance_type': {'S': compliance_type},
                        'resource_type': {'S': 'AWS::EC2::Instance'},
                        'missing_tags': {'S': json.dumps(missing_tags)},
                        'rule': {'S': 'ec2-required-tags'}
                    }
                )

                evaluation_results.append({
                    'resource_id': instance_id,
                    'compliance_type': compliance_type,
                    'missing_tags': missing_tags
                })

                if not is_compliant:
                    non_compliant_resources.append({
                        'instance_id': instance_id,
                        'missing_tags': missing_tags
                    })

        # Send SNS alert if non-compliant resources found
        if non_compliant_resources:
            message = f"EC2 Tag Compliance Alert\n\n"
            message += f"Found {len(non_compliant_resources)} non-compliant EC2 instances:\n\n"
            for resource in non_compliant_resources:
                message += f"Instance: {resource['instance_id']}\n"
                message += f"Missing Tags: {', '.join(resource['missing_tags'])}\n\n"

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="EC2 Tag Compliance Violation",
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'EC2 tag compliance check completed',
                'total_instances': len(evaluation_results),
                'non_compliant': len(non_compliant_resources)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
