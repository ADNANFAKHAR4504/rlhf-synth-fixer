# Lambda Module - Failover Automation

data "archive_file" "lambda_failover" {
  type        = "zip"
  output_path = "${path.module}/lambda_failover.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      import os
      from datetime import datetime

      cloudwatch = boto3.client('cloudwatch')
      s3 = boto3.client('s3')
      cfn = boto3.client('cloudformation')
      sns = boto3.client('sns')

      def lambda_handler(event, context):
          print(f"Failover triggered: {json.dumps(event)}")

          # Log failure detection
          timestamp = datetime.utcnow().isoformat()
          print(f"Failure detected at: {timestamp}")

          results = {
              's3_health': 'unknown',
              'notifications_sent': False
          }

          # Put custom metric
          cloudwatch.put_metric_data(
              Namespace='FinancialApp/FailoverAutomation',
              MetricData=[
                  {
                      'MetricName': 'FailoverTriggered',
                      'Value': 1,
                      'Unit': 'Count',
                      'Timestamp': datetime.utcnow()
                  }
              ]
          )

          # Check S3 bucket health
          bucket_name = os.environ.get('PRIMARY_BUCKET')
          try:
              s3.head_bucket(Bucket=bucket_name)
              results['s3_health'] = 'healthy'
              print(f"Bucket {bucket_name} is healthy")
          except Exception as e:
              results['s3_health'] = 'failed'
              error_msg = f"Bucket {bucket_name} health check failed: {str(e)}"
              print(error_msg)

              # Send SNS notification for failure
              sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
              if sns_topic_arn:
                  try:
                      sns.publish(
                          TopicArn=sns_topic_arn,
                          Subject='Failover Health Check Alert',
                          Message=json.dumps({
                              'timestamp': timestamp,
                              'bucket': bucket_name,
                              'status': 'failed',
                              'error': str(e),
                              'environment': os.environ.get('ENVIRONMENT')
                          }, indent=2)
                      )
                      results['notifications_sent'] = True
                      print("SNS notification sent successfully")
                  except Exception as sns_error:
                      print(f"Failed to send SNS notification: {str(sns_error)}")

          return {
              'statusCode': 200,
              'body': json.dumps({
                  'message': 'Failover automation executed',
                  'timestamp': timestamp,
                  'results': results
              })
          }
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.lambda_failover.output_path
  function_name    = var.function_name
  role             = var.lambda_role_arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_failover.output_base64sha256
  runtime          = "python3.11"
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = {
      PRIMARY_BUCKET   = var.primary_bucket_id
      SECONDARY_REGION = var.secondary_region
      ENVIRONMENT      = var.environment
      SNS_TOPIC_ARN    = var.sns_topic_arn
    }
  }

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  tags = merge(
    var.tags,
    {
      Name = var.function_name
    }
  )
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count = var.eventbridge_rule_arn != "" ? 1 : 0

  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = var.eventbridge_rule_arn
}

