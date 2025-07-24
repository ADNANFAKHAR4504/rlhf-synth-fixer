import json
import os
from datetime import datetime, timezone
from typing import Any, Dict

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayHttpResolver()

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


@app.get("/<path>")
@tracer.capture_method
def handle_visit(path: str) -> Dict[str, Any]:
  """Handle visit tracking for GET requests."""
  try:
    # Get request context
    event = app.current_event
    timestamp = datetime.now(timezone.utc).isoformat()
    ip = event.request_context.http.source_ip

    # Log visit details
    logger.info("Recording visit", extra={
        "path": path,
        "ip": ip,
        "timestamp": timestamp
    })

    # Store visit in DynamoDB
    item = {
        'id': event.request_context.request_id,
        'timestamp': timestamp,
        'ip': ip,
        'path': f"/{path}"
    }

    table.put_item(Item=item)

    # Record metrics
    metrics.add_metric(name="VisitsRecorded", unit=MetricUnit.Count, value=1)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Visit logged successfully',
            'path': path
        })
    }
  except Exception:
    logger.exception("Error recording visit")
    metrics.add_metric(name="VisitErrors", unit=MetricUnit.Count, value=1)
    return {
        'statusCode': 500,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Internal server error'
        })
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_HTTP)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
  """Main Lambda handler with Powertools decorators for observability."""
  return app.resolve(event, context)
