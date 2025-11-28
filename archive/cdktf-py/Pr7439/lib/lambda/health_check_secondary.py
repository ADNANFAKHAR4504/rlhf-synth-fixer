
import json
import boto3
import os

def handler(event, context):
    '''Health check Lambda function for disaster recovery'''

    # Check DynamoDB connectivity
    try:
        dynamodb = boto3.client('dynamodb')
        response = dynamodb.list_tables()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'region': os.environ.get('AWS_REGION'),
                'message': 'All systems operational'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }
