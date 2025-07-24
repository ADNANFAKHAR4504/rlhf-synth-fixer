def handler(event, context):
    import os
    secret_key = os.environ['SECRET_KEY']
    print("Lambda function executed successfully with encrypted environment variables")