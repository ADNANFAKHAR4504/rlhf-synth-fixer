import json
import os
import boto3
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
stepfunctions = boto3.client('stepfunctions')

# Environment variables
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')


def lambda_handler(event, context):
    """
    Process DynamoDB stream events and trigger Step Functions workflow
    """
    try:
        logger.info(f"Processing {len(event['Records'])} DynamoDB stream records")

        for record in event['Records']:
            # Only process INSERT events (new bugs)
            if record['eventName'] == 'INSERT':
                new_image = record['dynamodb']['NewImage']

                bug_id = new_image.get('bugId', {}).get('S')
                status = new_image.get('status', {}).get('S')

                # Only trigger workflow for new bugs
                if status == 'new' and bug_id:
                    logger.info(f"New bug detected: {bug_id}, triggering triage workflow")

                    # Start Step Functions execution
                    stepfunctions.start_execution(
                        stateMachineArn=STATE_MACHINE_ARN,
                        name=f"triage-{bug_id}-{context.request_id[:8]}",
                        input=json.dumps({
                            'bugId': bug_id
                        })
                    )

                    logger.info(f"Started triage workflow for bug {bug_id}")

        return {
            'statusCode': 200,
            'body': json.dumps('Stream processed successfully')
        }

    except Exception as e:
        logger.error(f"Error processing stream: {str(e)}", exc_info=True)
        raise
