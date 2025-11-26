# Lambda Failover Function

resource "aws_cloudwatch_log_group" "lambda_failover" {
  name              = "/aws/lambda/${var.project_name}-failover-${var.resource_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-lambda-logs"
    Environment = var.environment
  }
}

# Create Lambda function code as a local file
resource "local_file" "lambda_code" {
  filename = "${path.module}/lambda_src/index.py"
  content  = <<-EOF
import json
import boto3
import os

def handler(event, context):
    """
    Automated failover function triggered by CloudWatch alarms
    Performs RDS Global Cluster failover from primary to secondary region
    """
    print(f"Failover triggered: {json.dumps(event)}")

    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    secondary_region = os.environ['SECONDARY_REGION']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']

    rds = boto3.client('rds')
    sns = boto3.client('sns')

    try:
        # Initiate Aurora Global Database failover
        print(f"Initiating failover for {{global_cluster_id}} to {{secondary_region}}")
        response = rds.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=f"{{os.environ['GLOBAL_CLUSTER_ID']}}-secondary"
        )

        message = f"DR Failover initiated successfully to {{secondary_region}}"
        print(message)

        # Send SNS notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"DR Failover Initiated - {{os.environ['ENVIRONMENT']}}",
            Message=message
        )

        return {{
            'statusCode': 200,
            'body': json.dumps({{'message': message, 'response': str(response)}})
        }}
    except Exception as e:
        error_msg = f"Failover failed: {{str(e)}}"
        print(error_msg)
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject=f"DR Failover FAILED - {{os.environ['ENVIRONMENT']}}",
            Message=error_msg
        )
        return {{
            'statusCode': 500,
            'body': json.dumps({{'error': error_msg}})
        }}
EOF
}

# Create zip archive for Lambda deployment
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = local_file.lambda_code.filename
  output_path = "${path.module}/failover_function.zip"
}

resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "${var.project_name}-failover-automation-${var.resource_suffix}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300

  environment {
    variables = {
      GLOBAL_CLUSTER_ID    = var.global_cluster_id
      PRIMARY_REGION       = var.primary_region
      SECONDARY_REGION     = var.secondary_region
      SNS_TOPIC_ARN        = var.sns_topic_arn
      PRIMARY_ALB_DNS      = var.primary_alb_dns
      SECONDARY_ALB_DNS    = var.secondary_alb_dns
      ENVIRONMENT          = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-lambda-failover"
    Environment = var.environment
  }

  depends_on = [aws_cloudwatch_log_group.lambda_failover]
}

