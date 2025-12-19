import json
import boto3
import cfnresponse

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    Custom Resource to validate S3 bucket policies post-deployment.

    This function checks that S3 bucket policies contain explicit Deny statements
    for security compliance. If no Deny statements are found, it sends an SNS
    notification to alert the security team.

    Args:
        event: CloudFormation custom resource event
        context: Lambda context object

    Returns:
        Sends response to CloudFormation via cfnresponse
    """
    print(f'Event: {json.dumps(event)}')

    request_type = event['RequestType']

    # Handle Delete requests gracefully
    if request_type == 'Delete':
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
        return

    try:
        # Get bucket name and SNS topic from resource properties
        bucket_name = event['ResourceProperties']['BucketName']
        sns_topic_arn = event['ResourceProperties']['SNSTopicArn']

        print(f'Validating bucket policy for: {bucket_name}')

        # Retrieve bucket policy
        try:
            response = s3_client.get_bucket_policy(Bucket=bucket_name)
            policy = json.loads(response['Policy'])
        except s3_client.exceptions.NoSuchBucketPolicy:
            message = f'ALERT: Bucket {bucket_name} has no bucket policy attached'
            print(message)
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='S3 Bucket Policy Compliance Alert',
                Message=message
            )
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Status': 'No Policy'})
            return

        # Validate policy contains explicit Deny statements
        has_deny = False
        deny_statements = []
        required_deny_actions = ['s3:PutObject', 's3:*']

        for statement in policy.get('Statement', []):
            if statement.get('Effect') == 'Deny':
                has_deny = True
                deny_statements.append({
                    'Sid': statement.get('Sid', 'Unknown'),
                    'Action': statement.get('Action', [])
                })

        # Send compliance notification
        if not has_deny:
            message = (
                f'WARNING: Bucket {bucket_name} policy does not contain explicit Deny statements.\n\n'
                f'This violates security best practices and may pose a compliance risk.\n\n'
                f'Recommended actions:\n'
                f'1. Add Deny statement for unencrypted uploads\n'
                f'2. Add Deny statement for insecure transport (non-HTTPS)\n'
                f'3. Review and update bucket policy immediately\n'
            )
            print(message)
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject='URGENT: S3 Bucket Policy Compliance Alert',
                Message=message
            )
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Status': 'Non-Compliant',
                'Message': 'No explicit Deny statements found'
            })
        else:
            message = (
                f'SUCCESS: Bucket {bucket_name} policy is compliant.\n\n'
                f'Found {len(deny_statements)} Deny statement(s):\n'
            )
            for stmt in deny_statements:
                message += f"- {stmt['Sid']}: {stmt['Action']}\n"

            print(message)
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Status': 'Compliant',
                'DenyStatementCount': len(deny_statements)
            })

    except Exception as e:
        error_message = f'Error validating bucket policy: {str(e)}'
        print(error_message)
        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': error_message})
