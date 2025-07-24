def handler(event, context):
    import os
    secret_key = os.environ['SECRET_KEY']
    print(f"The secret key is: {secret_key}")