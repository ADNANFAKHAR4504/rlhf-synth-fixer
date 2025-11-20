import json
import boto3
import os

sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')

def handler(event, context):
    """Remediate GuardDuty findings."""
    try:
        # Parse GuardDuty finding
        detail = event.get('detail', {})
        finding_type = detail.get('type', 'Unknown')
        severity = detail.get('severity', 0)
        resource = detail.get('resource', {})

        print(f"Processing GuardDuty finding: {finding_type} (Severity: {severity})")

        remediation_actions = []

        # Implement remediation logic based on finding type
        if 'UnauthorizedAccess' in finding_type:
            # Example: Revoke security group rules
            if 'instanceDetails' in resource:
                instance_id = resource['instanceDetails'].get('instanceId')
                if instance_id:
                    # Get security groups
                    response = ec2_client.describe_instances(InstanceIds=[instance_id])
                    sg_ids = []
                    for reservation in response['Reservations']:
                        for instance in reservation['Instances']:
                            sg_ids.extend([sg['GroupId'] for sg in instance['SecurityGroups']])

                    remediation_actions.append(f"Identified security groups: {sg_ids}")
                    # In production: implement actual remediation

        elif 'Backdoor' in finding_type:
            remediation_actions.append("Backdoor detected - manual intervention required")

        # Publish to SNS for alerting
        # Note: SNS topic ARN would be passed as environment variable
        alert_message = {
            'finding_type': finding_type,
            'severity': severity,
            'resource': resource,
            'remediation_actions': remediation_actions,
            'timestamp': detail.get('updatedAt')
        }

        print(f"Remediation actions: {json.dumps(remediation_actions)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Remediation processed',
                'actions': remediation_actions
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
