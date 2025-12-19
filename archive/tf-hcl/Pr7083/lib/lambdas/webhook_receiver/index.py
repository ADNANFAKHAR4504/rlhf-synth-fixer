import os
import json
import boto3
from datetime import datetime

# Clients
S3 = boto3.client('s3')
SQS = boto3.client('sqs')
SSM = boto3.client('ssm')

# Cache for SSM parameters to avoid repeated calls on warm invocations
_SSM_CACHE = {}

def get_ssm_param(name, with_decryption=True):
    if name in _SSM_CACHE:
        return _SSM_CACHE[name]
    try:
        resp = SSM.get_parameter(Name=name, WithDecryption=with_decryption)
        val = resp['Parameter']['Value']
        _SSM_CACHE[name] = val
        return val
    except Exception:
        return None


def handler(event, context):
    # Realistic use-case: persist raw webhook payload to S3 and push a message to SQS for processing
    body = event.get('body') if isinstance(event, dict) else None
    if body is None:
        return { 'statusCode': 400, 'body': 'Missing body' }

    # Fetch runtime configuration from environment (SSM parameter names)
    bucket = os.environ.get('PAYLOAD_BUCKET')
    queue_url = os.environ.get('PROCESSING_QUEUE_URL')
    api_key_param = os.environ.get('API_KEY_PARAM')
    api_key = get_ssm_param(api_key_param) if api_key_param else None

    key = f"raw/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}-{context.aws_request_id}.json"
    S3.put_object(Bucket=bucket, Key=key, Body=body.encode('utf-8'))

    message = { 's3_bucket': bucket, 's3_key': key }
    SQS.send_message(QueueUrl=queue_url, MessageBody=json.dumps(message))

    return { 'statusCode': 200, 'body': json.dumps({'accepted': True, 's3_key': key}) }
