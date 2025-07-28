def handler(event, context):
    print("Hello from ServerlessDemo Lambda!")
    return {
        'statusCode': 200,
        'body': 'Hello from ServerlessDemo Lambda!'
    }