import json
import boto3
import os
from datetime import datetime

ec2_client = boto3.client('ec2')
ssm_client = boto3.client('ssm')

# Default tag values
DEFAULT_TAGS = {
    'Environment': 'untagged',
    'Owner': 'unknown',
    'CostCenter': 'unassigned'
}

def lambda_handler(event, context):
    """
    Lambda function to remediate missing tags on EC2 instances.
    Triggered by CloudWatch Events when instances are launched or tag compliance issues are detected.
    """

    print(f"Received event: {json.dumps(event)}")

    # Get all instances
    try:
        response = ec2_client.describe_instances()

        remediated_instances = []

        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                existing_tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

                # Check for missing required tags
                missing_tags = {}
                for required_tag, default_value in DEFAULT_TAGS.items():
                    if required_tag not in existing_tags:
                        missing_tags[required_tag] = default_value

                # Apply missing tags
                if missing_tags:
                    print(f"Adding missing tags to {instance_id}: {missing_tags}")

                    tags_list = [{'Key': k, 'Value': v} for k, v in missing_tags.items()]
                    ec2_client.create_tags(
                        Resources=[instance_id],
                        Tags=tags_list
                    )

                    remediated_instances.append({
                        'instance_id': instance_id,
                        'tags_added': missing_tags
                    })

        # Store compliance report in Parameter Store
        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'remediated_count': len(remediated_instances),
            'instances': remediated_instances
        }

        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        parameter_name = f'/compliance/reports/{environment_suffix}/latest'

        ssm_client.put_parameter(
            Name=parameter_name,
            Value=json.dumps(report),
            Type='String',
            Overwrite=True
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Tag remediation completed',
                'remediated_count': len(remediated_instances)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
