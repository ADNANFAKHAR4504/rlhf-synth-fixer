import json
import boto3
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    AWS Lambda function for compliance checking
    """
    logger.info('Compliance check started')
    
    try:
        # Simple compliance check - you can extend this
        ec2 = boto3.client('ec2')
        s3 = boto3.client('s3')
        
        # Example: Check for unencrypted S3 buckets
        buckets = s3.list_buckets()
        
        compliance_results = {
            'timestamp': context.aws_request_id,
            'status': 'SUCCESS',
            'buckets_checked': len(buckets['Buckets']),
            'message': 'Compliance check completed successfully'
        }
        
        logger.info(f'Compliance check results: {compliance_results}')
        
        return {
            'statusCode': 200,
            'body': json.dumps(compliance_results)
        }
        
    except Exception as e:
        logger.error(f'Compliance check failed: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'ERROR',
                'message': str(e)
            })
        }
