"""
Lambda function for processing regional S3 data
"""
import json
import os
import boto3
from typing import Dict, Any

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process data from regional S3 buckets

    Args:
        event: Lambda event containing S3 notification or API Gateway request
        context: Lambda context

    Returns:
        Response dict with status code and body
    """
    try:
        bucket_name = os.environ.get('BUCKET_NAME')
        region = os.environ.get('REGION')
        environment = os.environ.get('ENVIRONMENT')
        table_name = f"sessions-{environment}"

        print(f"Processing event in {region} for {environment}")

        # Handle S3 event notification
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    s3_bucket = record['s3']['bucket']['name']
                    s3_key = record['s3']['object']['key']

                    print(f"Processing S3 object: s3://{s3_bucket}/{s3_key}")

                    # Get object from S3
                    response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
                    data = response['Body'].read().decode('utf-8')

                    # Process data and store session in DynamoDB
                    table = dynamodb.Table(table_name)
                    table.put_item(
                        Item={
                            'session_id': s3_key,
                            'data': data,
                            'region': region,
                            'processed_at': context.request_id
                        }
                    )

                    print(f"Successfully processed {s3_key}")

        # Handle API Gateway request
        elif 'requestContext' in event:
            body = json.loads(event.get('body', '{}'))
            session_id = body.get('session_id')

            if session_id:
                table = dynamodb.Table(table_name)
                response = table.get_item(Key={'session_id': session_id})

                if 'Item' in response:
                    return {
                        'statusCode': 200,
                        'body': json.dumps(response['Item']),
                        'headers': {'Content-Type': 'application/json'}
                    }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing complete',
                'region': region,
                'environment': environment
            }),
            'headers': {'Content-Type': 'application/json'}
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json'}
        }
