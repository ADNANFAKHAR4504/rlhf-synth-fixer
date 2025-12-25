import json
import os
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sfn_client = boto3.client('stepfunctions')
state_machine_arn = os.environ.get('STATE_MACHINE_ARN')

def lambda_handler(event, context):
    """
    Triggered by SNS, starts Step Functions execution
    """
    logger.info(f"Received SNS event: {json.dumps(event)}")

    try:
        # Extract SNS message
        for record in event.get('Records', []):
            sns_message = json.loads(record['Sns']['Message'])

            # Start Step Functions execution
            response = sfn_client.start_execution(
                stateMachineArn=state_machine_arn,
                input=json.dumps(sns_message)
            )

            logger.info(f"Started Step Functions execution: {response['executionArn']}")

        return {
            'statusCode': 200,
            'body': json.dumps('Step Functions execution started')
        }

    except Exception as e:
        logger.error(f"Trigger error: {str(e)}")
        raise
