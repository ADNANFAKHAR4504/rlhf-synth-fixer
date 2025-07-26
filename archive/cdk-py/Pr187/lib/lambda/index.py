def handler(event, context):
    return {
        "statusCode": 200,
        "body": "Hello from Lambda in region: " + context.invoked_function_arn.split(":")[3]
    }