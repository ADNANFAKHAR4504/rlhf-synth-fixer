import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
ssm_client = boto3.client('ssm')
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if RDS instances have sufficient backup retention.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process RDS instances
        if resource_type != 'AWS::RDS::DBInstance':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an RDS instance')
            }

        # Get the backup retention period from the configuration
        backup_retention_period = configuration_item['configuration'].get('backupRetentionPeriod', 0)

        # Get minimum backup retention from Parameter Store
        min_retention_param = os.environ.get('MIN_BACKUP_RETENTION_PARAM')
        try:
            response = ssm_client.get_parameter(Name=min_retention_param)
            min_backup_retention = int(response['Parameter']['Value'])
        except Exception as e:
            print(f"Error getting minimum backup retention from Parameter Store: {str(e)}")
            min_backup_retention = 7  # Default to 7 days

        # Check if backup retention meets minimum requirement
        if backup_retention_period >= min_backup_retention:
            compliance_type = 'COMPLIANT'
            annotation = f'RDS instance has backup retention of {backup_retention_period} days (minimum: {min_backup_retention} days)'
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = f'RDS instance has insufficient backup retention: {backup_retention_period} days (minimum required: {min_backup_retention} days)'

            # Send SNS notification for non-compliance
            try:
                sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: RDS Backup Retention Check
Resource: {resource_id}
Status: NON_COMPLIANT
Details: {annotation}

Current Retention: {backup_retention_period} days
Required Minimum: {min_backup_retention} days

Please update the backup retention period for this RDS instance.
"""

                sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'Compliance Violation: Insufficient RDS Backup Retention in {environment_suffix}',
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
