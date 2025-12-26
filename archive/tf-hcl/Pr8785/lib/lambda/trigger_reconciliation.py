import json
import boto3
import os
from urllib.parse import unquote_plus

stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    """
    Triggered by S3 event when CSV file is uploaded.
    Starts Step Functions execution with file details.
    """
    try:
        # Extract S3 event details
        s3_event = event['Records'][0]['s3']
        bucket_name = s3_event['bucket']['name']
        object_key = unquote_plus(s3_event['object']['key'])
        
        # Prepare input for Step Functions
        execution_input = {
            'bucket': bucket_name,
            'key': object_key,
            'timestamp': event['Records'][0]['eventTime']
        }
        
        # Start Step Functions execution
        state_machine_arn = os.environ['STATE_MACHINE_ARN']
        response = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            input=json.dumps(execution_input)
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Reconciliation workflow started',
                'executionArn': response['executionArn']
            })
        }
        
    except Exception as e:
        print(f"Error starting workflow: {str(e)}")
        raise
