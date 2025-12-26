# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<-EOF
import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    bucket_name = os.environ.get('S3_AUDIT_BUCKET')

    if 'httpMethod' in event:
        body = json.loads(event.get('body', '{}'))
        pattern_id = body.get('pattern_id', 'unknown')
        timestamp_val = Decimal(str(int(time.time() * 1000)))

        table = dynamodb.Table(table_name)
        table.put_item(Item={
            'pattern_id': pattern_id,
            'timestamp': timestamp_val,
            'event_data': json.dumps(body)
        })

        s3.put_object(
            Bucket=bucket_name,
            Key=f"audit/{datetime.utcnow().strftime('%Y/%m/%d')}/{pattern_id}.json",
            Body=json.dumps({'event': body, 'processed_at': datetime.utcnow().isoformat()})
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Fraud pattern processed', 'pattern_id': pattern_id})
        }
    else:
        return {'statusCode': 200, 'body': json.dumps({'message': 'Batch processing complete'})}
EOF
    filename = "index.py"
  }
}

# Lambda Function for Fraud Detection
resource "aws_lambda_function" "fraud_detector" {
  function_name    = "fraud-detector-${var.environment_suffix}"
  role             = aws_iam_role.lambda_fraud_detector.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.fraud_patterns.name
      S3_AUDIT_BUCKET     = aws_s3_bucket.audit_trail.id
      KMS_KEY_ID          = aws_kms_key.fraud_detection.id
      ENVIRONMENT_SUFFIX  = var.environment_suffix
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.fraud_detection_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_fraud_detector,
    aws_iam_role_policy.lambda_logs
  ]

  tags = {
    Name = "fraud-detector-${var.environment_suffix}"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.fraud_detection.execution_arn}/*/*"
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridgeInvoke-${var.environment_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.batch_processing.arn
}
