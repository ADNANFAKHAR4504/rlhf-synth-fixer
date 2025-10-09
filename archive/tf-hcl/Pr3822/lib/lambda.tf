# lambda.tf

# Lambda function for log transformation
resource "aws_lambda_function" "log_transformer" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "${local.name_prefix}-log-transformer"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 256

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }

  tags = var.tags
}

# Create Lambda function code
resource "local_file" "lambda_code" {
  content = <<-EOF
import base64
import json
import gzip
from datetime import datetime

def handler(event, context):
    output = []

    for record in event['records']:
        try:
            # Decode the base64 encoded data
            payload = base64.b64decode(record['data'])

            # Decompress if gzipped
            try:
                payload = gzip.decompress(payload)
            except:
                pass

            # Parse the CloudWatch log event
            log_event = json.loads(payload)

            # Transform each log event
            if 'logEvents' in log_event:
                for log in log_event['logEvents']:
                    # Extract application name from log group
                    log_group = log_event.get('logGroup', '')
                    app_name = log_group.split('/')[-1] if log_group else 'unknown'

                    # Create structured log entry
                    transformed_log = {
                        'timestamp': log.get('timestamp'),
                        'message': log.get('message'),
                        'application': app_name,
                        'logGroup': log_event.get('logGroup'),
                        'logStream': log_event.get('logStream'),
                        'processed_at': datetime.utcnow().isoformat()
                    }

                    # Encode the transformed log
                    output_data = json.dumps(transformed_log) + '\n'
                    output_record = {
                        'recordId': record['recordId'],
                        'result': 'Ok',
                        'data': base64.b64encode(output_data.encode()).decode()
                    }
                    output.append(output_record)
            else:
                # If not a CloudWatch log event, pass through
                output.append({
                    'recordId': record['recordId'],
                    'result': 'Ok',
                    'data': record['data']
                })

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            # Return failed record
            output.append({
                'recordId': record['recordId'],
                'result': 'ProcessingFailed',
                'data': record['data']
            })

    return {'records': output}
EOF

  filename = "${path.module}/lambda/index.py"
}

# Create zip file for Lambda
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/lambda/function.zip"

  depends_on = [local_file.lambda_code]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name_prefix}-log-transformer"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.logging_key.arn

  tags = var.tags

  depends_on = [aws_kms_key_policy.logging_key]
}
