import json
import boto3
import os
import time
from datetime import datetime

cfn = boto3.client('cloudformation')
sns = boto3.client('sns')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Detects drift in CloudFormation stacks.
    Generates report and sends notifications for drifted stacks.
    """
    print(f'Received event: {json.dumps(event)}')

    drift_results = []

    try:
        # Get all CloudFormation stacks
        paginator = cfn.get_paginator('list_stacks')
        page_iterator = paginator.paginate(
            StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
        )

        for page in page_iterator:
            for stack in page['StackSummaries']:
                stack_name = stack['StackName']

                try:
                    # Check drift status
                    drift_info = cfn.detect_stack_drift(StackName=stack_name)
                    drift_detection_id = drift_info['StackDriftDetectionId']

                    # Wait for drift detection to complete
                    for _ in range(30):
                        status = cfn.describe_stack_drift_detection_status(
                            StackDriftDetectionId=drift_detection_id
                        )
                        if status['DetectionStatus'] == 'DETECTION_COMPLETE':
                            break
                        time.sleep(2)

                    drift_status = status.get('StackDriftStatus', 'UNKNOWN')

                    if drift_status in ['DRIFTED', 'UNKNOWN']:
                        drift_results.append({
                            'StackName': stack_name,
                            'DriftStatus': drift_status,
                            'Timestamp': datetime.utcnow().isoformat()
                        })

                except Exception as e:
                    print(f'Error checking drift for {stack_name}: {str(e)}')
                    continue

        # Generate report
        report = {
            'Timestamp': datetime.utcnow().isoformat(),
            'DriftedStacks': len(drift_results),
            'Details': drift_results
        }

        # Store report in S3
        report_key = f"drift-detection/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}.json"
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send SNS notification if drift detected
        if drift_results:
            message = f"CloudFormation Stack Drift Detected\n\n"
            message += f"Total Drifted Stacks: {len(drift_results)}\n\n"
            message += "Details:\n"
            for result in drift_results:
                message += f"- Stack: {result['StackName']} - Status: {result['DriftStatus']}\n"

            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='CloudFormation Stack Drift Alert',
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Drift detection completed',
                'driftedStacks': len(drift_results)
            })
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        raise
