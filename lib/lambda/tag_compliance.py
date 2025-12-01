import json
import boto3
import os
from datetime import datetime

ec2 = boto3.client('ec2')
sns = boto3.client('sns')
s3 = boto3.client('s3')

REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']

def lambda_handler(event, context):
    """
    Validates that all EC2 instances have required tags.
    Generates compliance report and sends SNS notification for violations.
    """
    print(f'Received event: {json.dumps(event)}')

    non_compliant_resources = []

    try:
        # Check EC2 instances for required tags
        instances = ec2.describe_instances()

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

                if missing_tags:
                    non_compliant_resources.append({
                        'ResourceType': 'EC2Instance',
                        'ResourceId': instance_id,
                        'MissingTags': missing_tags,
                        'ExistingTags': list(tags.keys())
                    })

        # Generate compliance report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'TotalResourcesChecked': len(instances['Reservations']),
            'NonCompliantResources': len(non_compliant_resources),
            'Details': non_compliant_resources
        }

        # Store report in S3
        report_key = f"tag-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if non-compliant resources found
        if non_compliant_resources:
            message = f"Tag Compliance Violation Detected\n\n"
            message += f"Total Non-Compliant Resources: {len(non_compliant_resources)}\n\n"
            message += "Details:\n"
            for resource in non_compliant_resources[:10]:  # Limit to first 10
                message += f"- {resource['ResourceType']}: {resource['ResourceId']}\n"
                message += f"  Missing Tags: {', '.join(resource['MissingTags'])}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='Infrastructure Tag Compliance Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tag compliance check completed',
                'nonCompliantResources': len(non_compliant_resources)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
