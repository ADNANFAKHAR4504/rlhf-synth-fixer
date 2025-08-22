# Lambda handler for secure-env
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('Lambda function invoked')
    logger.info(f'Event: {json.dumps(event)}')
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello from secure-env Lambda!'})
    }
