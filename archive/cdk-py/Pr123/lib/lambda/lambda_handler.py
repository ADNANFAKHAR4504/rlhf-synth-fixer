import os
import json


def handler(event, context):
  try:
    secret_key = os.environ['SECRET_KEY']
  except KeyError:
    return {'statusCode': 500, 'body': json.dumps(
        {'error': 'SECRET_KEY environment variable not set'})}

  print("Lambda function executed successfully with encrypted environment variables")

  return {
      'statusCode': 200,
      'body': json.dumps({'message': 'Success', 'secret_key_present': True})
  }
