import json
import logging
import boto3
import base64
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sagemaker_runtime = boto3.client('sagemaker-runtime')

def handler(event, context):
    """
    Kinesis consumer Lambda function.
    Processes records from Kinesis stream and invokes SageMaker endpoint.
    """
    try:
        logger.info(f"Processing {len(event['Records'])} records")
        
        endpoint_a = os.environ.get('SAGEMAKER_ENDPOINT_A')
        endpoint_b = os.environ.get('SAGEMAKER_ENDPOINT_B')
        
        results = []
        for record in event['Records']:
            # Decode Kinesis record
            payload = base64.b64decode(record['kinesis']['data'])
            data = json.loads(payload)
            
            # Route to endpoint (simple A/B testing logic)
            endpoint = endpoint_a if hash(str(data)) % 2 == 0 else endpoint_b
            
            try:
                # Invoke SageMaker endpoint
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=endpoint,
                    ContentType='application/json',
                    Body=json.dumps(data)
                )
                
                result = json.loads(response['Body'].read())
                logger.info(f"Inference result: {result}")
                results.append({'success': True, 'result': result})
                
            except Exception as e:
                logger.error(f"Error invoking endpoint: {str(e)}")
                results.append({'success': False, 'error': str(e)})
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(results),
                'results': results
            })
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise

