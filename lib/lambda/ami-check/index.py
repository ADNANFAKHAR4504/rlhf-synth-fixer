import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
ssm_client = boto3.client('ssm')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if EC2 instances use approved AMIs.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process EC2 instances
        if resource_type != 'AWS::EC2::Instance':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an EC2 instance')
            }

        # Get the AMI ID from the configuration
        ami_id = configuration_item['configuration'].get('imageId')

        if not ami_id:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'Unable to determine AMI ID'
        else:
            # Get approved AMIs from Parameter Store
            approved_amis_param = os.environ.get('APPROVED_AMIS_PARAM')
            try:
                response = ssm_client.get_parameter(Name=approved_amis_param)
                approved_amis = response['Parameter']['Value'].split(',')
                approved_amis = [ami.strip() for ami in approved_amis]
            except Exception as e:
                print(f"Error getting approved AMIs from Parameter Store: {str(e)}")
                approved_amis = []

            # Check if AMI is approved
            if ami_id in approved_amis:
                compliance_type = 'COMPLIANT'
                annotation = f'Instance uses approved AMI: {ami_id}'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = f'Instance uses unapproved AMI: {ami_id}. Approved AMIs: {", ".join(approved_amis)}'

                # Send SNS notification for non-compliance
                try:
                    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                    message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: EC2 Approved AMI Check
Resource: {resource_id}
Status: NON_COMPLIANT
Details: {annotation}

Please take immediate action to remediate this violation.
"""

                    sns_client.publish(
                        TopicArn=sns_topic_arn,
                        Subject=f'Compliance Violation: Unapproved AMI in {environment_suffix}',
                        Message=message
                    )
                except Exception as e:
                    print(f"Error sending SNS notification: {str(e)}")

        # Put evaluation result
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': compliance_type,
                    'Annotation': annotation,
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Evaluation completed: {compliance_type}')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
