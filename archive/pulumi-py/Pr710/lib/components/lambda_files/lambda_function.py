import json

def lambda_handler(event, context):
    # Print the event to CloudWatch logs (useful for debugging)
    print("Received event: " + json.dumps(event))

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }