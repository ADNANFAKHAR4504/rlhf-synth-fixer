resource "aws_lambda_function" "rollback_function" {
  filename         = "rollback_function.zip"
  function_name    = "${var.environment_suffix}-${var.project_name}-rollback-function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.rollback_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = 300

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.pipeline_notifications.arn
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-rollback-function"
    Environment = var.environment_suffix
  })
}

data "archive_file" "rollback_zip" {
  type        = "zip"
  output_path = "rollback_function.zip"
  source {
    content  = <<EOF
import json
import boto3
import os

def handler(event, context):
    sns = boto3.client('sns')
    
    # Send rollback notification
    message = f"Production deployment failed. Initiating rollback procedure."
    
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Message=message,
        Subject='Production Deployment Rollback Initiated'
    )
    
    # Add your rollback logic here
    # This could include:
    # - Reverting CloudFormation stacks
    # - Rolling back database migrations
    # - Switching traffic back to previous version
    
    return {
        'statusCode': 200,
        'body': json.dumps('Rollback initiated successfully')
    }
EOF
    filename = "index.py"
  }
}