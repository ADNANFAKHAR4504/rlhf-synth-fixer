import json
import logging
import os

# Set up basic logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logger = logging.getLogger()
logger.setLevel(LOG_LEVEL)


def main(event, context):
  """
  Lambda entry point for the /status endpoint.

  Returns a JSON response indicating the service is healthy.
  Logs the incoming request and execution context.
  """
  logger.info("Received event: %s", json.dumps(event))

  try:
    response = {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Service is up and running!",
            "environment": os.environ.get("ENVIRONMENT", "Production")
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }
    logger.info("Response: %s", response)
    return response
  except Exception as e:
    logger.exception("Unhandled exception occurred")
    return {
        "statusCode": 500,
        "body": json.dumps({"error": "Internal Server Error"})
    }
