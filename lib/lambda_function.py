"""
Simple Lambda function for enterprise security stack.
"""


def handler(event, context):  # pylint: disable=unused-argument
  """
  Lambda handler function.
  
  Args:
    event: The event data passed to the function
    context: Runtime information about the Lambda function
    
  Returns:
    dict: Response with status code and body
  """
  return {
    'statusCode': 200,
    'body': {
      'message': 'Hello from secure Lambda!',
      'environment': 'production',
      'timestamp': context.aws_request_id if context else 'unknown'
    }
  }
