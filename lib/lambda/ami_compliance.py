import json
import boto3
import os
from datetime import datetime

ec2 = boto3.client('ec2')
sns = boto3.client('sns')
s3 = boto3.client('s3')
ssm = boto3.client('ssm')

def lambda_handler(event, context):
    """
    Validates that all EC2 instances use approved AMIs.
    Approved AMI list is stored in Systems Manager Parameter Store.
    """
    print(f'Received event: {json.dumps(event)}')

    non_compliant_instances = []

    try:
        # Get approved AMIs from Parameter Store
        try:
            param = ssm.get_parameter(Name=os.environ['APPROVED_AMIS_PARAM'])
            approved_amis = json.loads(param['Parameter']['Value'])
        except:
            approved_amis = []
            print('No approved AMIs configured in Parameter Store')

        # Check all running instances
        instances = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running', 'stopped']}]
        )

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                ami_id = instance['ImageId']

                if approved_amis and ami_id not in approved_amis:
                    non_compliant_instances.append({
                        'InstanceId': instance_id,
                        'AMI': ami_id,
                        'State': instance['State']['Name'],
                        'LaunchTime': instance['LaunchTime'].isoformat()
                    })

        # Generate compliance report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'ApprovedAMIs': approved_amis,
            'TotalInstancesChecked': sum(len(r['Instances']) for r in instances['Reservations']),
            'NonCompliantInstances': len(non_compliant_instances),
            'Details': non_compliant_instances
        }

        # Store report in S3
        report_key = f"ami-compliance/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if non-compliant instances found
        if non_compliant_instances:
            message = f"AMI Compliance Violation Detected\n\n"
            message += f"Total Non-Compliant Instances: {len(non_compliant_instances)}\n\n"
            message += "Details:\n"
            for instance in non_compliant_instances[:10]:
                message += f"- Instance: {instance['InstanceId']} using unapproved AMI: {instance['AMI']}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='Infrastructure AMI Compliance Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'AMI compliance check completed',
                'nonCompliantInstances': len(non_compliant_instances)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
