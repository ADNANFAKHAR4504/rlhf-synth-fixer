# Lambda function for automatic rollback
resource "aws_lambda_function" "rollback" {
  filename      = "${path.module}/lambda/rollback.zip"
  function_name = "migration-rollback-${var.environment_suffix}"
  role          = aws_iam_role.lambda_rollback.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 300

  environment {
    variables = {
      ROUTE53_ZONE_ID    = aws_route53_zone.main.zone_id
      RECORD_NAME        = "app.${var.route53_zone_name}"
      AWS_SET_IDENTIFIER = "aws-${var.environment_suffix}"
      ONPREM_ENDPOINT    = var.onpremises_endpoint
      SNS_TOPIC_ARN      = aws_sns_topic.migration_alerts.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  tags = {
    Name = "migration-rollback-${var.environment_suffix}"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_rollback" {
  name = "lambda-rollback-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "lambda-rollback-role-${var.environment_suffix}"
  }
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_rollback" {
  name = "lambda-rollback-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_rollback.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.rollback_lambda.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "route53:ListResourceRecordSets"
        ]
        Resource = [
          aws_route53_zone.main.arn,
          "arn:aws:route53:::change/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.migration_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for CloudWatch Alarms
resource "aws_lambda_permission" "cloudwatch_alarm" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rollback.function_name
  principal     = "lambda.alarms.cloudwatch.amazonaws.com"
  source_arn    = aws_cloudwatch_metric_alarm.alb_unhealthy_targets.arn
}

# Create lambda deployment package directory
resource "null_resource" "lambda_package" {
  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p ${path.module}/lambda
      cat > ${path.module}/lambda/index.py << 'EOF'
import json
import boto3
import os
from datetime import datetime

route53 = boto3.client('route53')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Rollback function to revert Route53 weighted routing to on-premises
    """
    zone_id = os.environ['ROUTE53_ZONE_ID']
    record_name = os.environ['RECORD_NAME']
    aws_set_id = os.environ['AWS_SET_IDENTIFIER']
    onprem_endpoint = os.environ['ONPREM_ENDPOINT']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']
    
    try:
        # Update Route53 weighted routing to send all traffic to on-premises
        response = route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                'Comment': f'Automatic rollback triggered at {datetime.utcnow().isoformat()}',
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': record_name,
                            'Type': 'A',
                            'SetIdentifier': aws_set_id,
                            'Weight': 0,
                            'TTL': 60,
                            'ResourceRecords': [{'Value': '127.0.0.1'}]  # Effectively disable
                        }
                    }
                ]
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=sns_topic,
            Subject=f'CRITICAL: Migration Rollback Executed - {env_suffix}',
            Message=f'''
Automatic rollback has been triggered due to detected issues.

Environment: {env_suffix}
Timestamp: {datetime.utcnow().isoformat()}
Action: Route53 weighted routing updated to 0% for AWS environment

All traffic is now being directed to on-premises infrastructure.

Route53 Change ID: {response['ChangeInfo']['Id']}
Change Status: {response['ChangeInfo']['Status']}

Please investigate the root cause immediately.
            '''
        )
        
        # Put custom metric
        cloudwatch.put_metric_data(
            Namespace='Migration',
            MetricData=[
                {
                    'MetricName': 'RollbackExecuted',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': env_suffix}
                    ]
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback executed successfully',
                'changeId': response['ChangeInfo']['Id']
            })
        }
        
    except Exception as e:
        error_msg = f'Rollback failed: {str(e)}'
        sns.publish(
            TopicArn=sns_topic,
            Subject=f'ERROR: Migration Rollback Failed - {env_suffix}',
            Message=f'''
CRITICAL: Automatic rollback FAILED!

Environment: {env_suffix}
Timestamp: {datetime.utcnow().isoformat()}
Error: {str(e)}

Manual intervention required immediately!
            '''
        )
        raise
EOF
      cd ${path.module}/lambda && zip rollback.zip index.py
    EOT
  }

  triggers = {
    always_run = timestamp()
  }
}

resource "terraform_data" "lambda_package_dependency" {
  depends_on = [null_resource.lambda_package]
}