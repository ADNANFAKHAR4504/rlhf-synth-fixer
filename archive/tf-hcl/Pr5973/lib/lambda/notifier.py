import json

def lambda_handler(event, context):
    """
    Sends notifications for processed webhooks
    """
    print(f"Received event: {json.dumps(event)}")

    for record in event['Records']:
        try:
            # Parse message body
            body = json.loads(record['body'])

            # Send notification (simplified - just log)
            print(f"Notification for webhook {body['webhookId']}: {body['processingStatus']}")

        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            raise

    return {
        'statusCode': 200,
        'body': json.dumps('Notification complete')
    }
