import json
def handler(event, context):
    print(f"Processing event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps('Security function executed successfully')
    }