import json, os, boto3
from botocore.exceptions import ClientError

secrets = boto3.client("secretsmanager")

def lambda_handler(event, context):
    try:
        secret_arn = os.environ.get("SECRET_ARN")
        resp = secrets.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(resp.get("SecretString", "{}"))
    except ClientError as e:
        secret_data = {"error": str(e)}

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello from Lambda",
            "env": os.environ.get("APP_ENV"),
            "secret_keys": list(secret_data.keys())
        }),
        "headers": {"Content-Type": "application/json"}
    }
