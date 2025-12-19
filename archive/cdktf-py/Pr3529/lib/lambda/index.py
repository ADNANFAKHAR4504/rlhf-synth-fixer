import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients - will be done inside handler to allow mocking
dynamodb = None
sns = None
ecr = None

def initialize_clients():
    """Initialize AWS clients."""
    global dynamodb, sns, ecr
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb')
    if sns is None:
        sns = boto3.client('sns')
    if ecr is None:
        ecr = boto3.client('ecr')

# Get environment variables - will be loaded at runtime
TABLE_NAME = None
SNS_TOPIC_ARN = None

def handler(event, context):
    """Process ECR scan results and send alerts for critical vulnerabilities."""

    # Initialize AWS clients
    initialize_clients()

    # Load environment variables
    global TABLE_NAME, SNS_TOPIC_ARN
    TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'ecr-image-metadata')
    SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

    # Check if this is a cleanup event from EventBridge Scheduler
    if event.get('action') == 'cleanup':
        return handle_cleanup(event)

    # Parse ECR scan completion event
    detail = event['detail']
    repository_name = detail['repository-name']
    image_digest = detail['image-digest']
    image_tags = detail.get('image-tags', [])

    # Get scan findings from ECR
    try:
        response = ecr.describe_image_scan_findings(
            repositoryName=repository_name,
            imageId={'imageDigest': image_digest}
        )

        findings = response['imageScanFindings']
        finding_counts = findings.get('findingSeverityCounts', {})

        # Count vulnerabilities by severity
        critical_count = finding_counts.get('CRITICAL', 0)
        high_count = finding_counts.get('HIGH', 0)
        medium_count = finding_counts.get('MEDIUM', 0)
        low_count = finding_counts.get('LOW', 0)

        # Store metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        timestamp = int(datetime.now().timestamp())

        table.put_item(
            Item={
                'image_digest': image_digest,
                'push_timestamp': timestamp,
                'repository_name': repository_name,
                'image_tags': image_tags,
                'critical_vulnerabilities': critical_count,
                'high_vulnerabilities': high_count,
                'medium_vulnerabilities': medium_count,
                'low_vulnerabilities': low_count,
                'scan_status': 'COMPLETE',
                'scan_timestamp': timestamp
            }
        )

        # Send SNS alert if critical vulnerabilities found
        if critical_count > 0:
            message = {
                'repository': repository_name,
                'image_digest': image_digest,
                'image_tags': image_tags,
                'critical_vulnerabilities': critical_count,
                'high_vulnerabilities': high_count,
                'message': (f'CRITICAL: Image {repository_name}:'
                           f'{image_tags[0] if image_tags else image_digest[:12]} '
                           f'has {critical_count} critical vulnerabilities!')
            }

            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f'ECR Security Alert - {critical_count} Critical Vulnerabilities',
                Message=json.dumps(message, indent=2)
            )

            print(f"Alert sent for {critical_count} critical vulnerabilities")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Scan results processed successfully',
                'repository': repository_name,
                'image_digest': image_digest,
                'vulnerabilities': finding_counts
            })
        }

    except Exception as e:
        print(f"Error processing scan results: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_cleanup(event):
    """Handle periodic cleanup tasks."""
    repository_name = event.get('repository')

    # This function could be extended to perform additional cleanup tasks
    # For now, lifecycle policies handle image cleanup automatically

    print(f"Cleanup task executed for repository: {repository_name}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Cleanup task completed',
            'repository': repository_name
        })
    }
