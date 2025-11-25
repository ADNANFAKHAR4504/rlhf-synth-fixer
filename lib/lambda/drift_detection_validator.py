import json
import boto3
import time
import os

cfn = boto3.client('cloudformation')
config_client = boto3.client('config')
sns = boto3.client('sns')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Detects CloudFormation stack drift and reports compliance status
    """
    configuration_item = json.loads(event['configurationItem'])
    resource_type = configuration_item['resourceType']
    resource_id = configuration_item['resourceId']

    # Only process CloudFormation stacks
    if resource_type != 'AWS::CloudFormation::Stack':
        return {'statusCode': 200, 'body': 'Not a CloudFormation stack'}

    stack_name = resource_id

    try:
        # Initiate drift detection
        drift_response = cfn.detect_stack_drift(StackName=stack_name)
        drift_detection_id = drift_response['StackDriftDetectionId']

        # Poll for drift detection completion
        max_attempts = 60  # 5 minutes max
        attempt = 0
        while attempt < max_attempts:
            status_response = cfn.describe_stack_drift_detection_status(
                StackDriftDetectionId=drift_detection_id
            )
            status = status_response['DetectionStatus']

            if status == 'DETECTION_COMPLETE':
                drift_status = status_response['StackDriftStatus']
                break
            elif status == 'DETECTION_FAILED':
                return {'statusCode': 500, 'body': 'Drift detection failed'}

            time.sleep(5)
            attempt += 1

        if attempt >= max_attempts:
            return {'statusCode': 500, 'body': 'Drift detection timed out'}

        # Determine compliance
        compliance_type = 'COMPLIANT' if drift_status == 'IN_SYNC' else 'NON_COMPLIANT'
        annotation = f'Stack drift status: {drift_status}'

        evaluation = {
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance_type,
            'Annotation': annotation,
            'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
        }

        # Submit evaluation to AWS Config
        config_client.put_evaluations(
            Evaluations=[evaluation],
            ResultToken=event['resultToken']
        )

        # Handle non-compliant stacks
        if compliance_type == 'NON_COMPLIANT':
            # Get detailed drift information
            drifts = cfn.describe_stack_resource_drifts(StackName=stack_name)
            timestamp = status_response.get('Timestamp', '')
            detection_time = timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)
            report = {
                'stack_name': stack_name,
                'drift_status': drift_status,
                'detection_time': detection_time,
                'drifted_resources': drifts.get('StackResourceDrifts', [])
            }

            # Store drift report in S3
            reports_bucket = os.environ.get('REPORTS_BUCKET')
            if reports_bucket:
                s3.put_object(
                    Bucket=reports_bucket,
                    Key=f'drift-reports/{stack_name}-{int(time.time())}.json',
                    Body=json.dumps(report, default=str),
                    ContentType='application/json'
                )

            # Send SNS notification
            sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
            if sns_topic_arn:
                drifted_count = len([d for d in drifts.get('StackResourceDrifts', [])
                                    if d.get('StackResourceDriftStatus') == 'MODIFIED'])
                sns.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'CloudFormation Stack Drift Detected: {stack_name}',
                    Message=f'''Stack drift detected for {stack_name}

Drift Status: {drift_status}
Drifted Resources: {drifted_count}
Detection Time: {status_response['Timestamp']}

A detailed drift report has been saved to S3 bucket: {reports_bucket}

Please review and remediate the drift to maintain infrastructure compliance.
'''
                )

        return {'statusCode': 200, 'body': json.dumps(evaluation)}

    except Exception as e:
        # Handle boto3 ClientError for stack validation issues
        if hasattr(e, 'response') and 'Error' in e.response:
            error_code = e.response['Error']['Code']
            if error_code == 'ValidationError':
                # Stack might not support drift detection
                return {'statusCode': 200, 'body': f'Stack does not support drift detection: {str(e)}'}
        print(f'Error processing drift detection: {str(e)}')
        return {'statusCode': 500, 'body': str(e)}
