// Module: lambda
// Contains remediation function, archive_file, permissions, and EventBridge wiring

resource "aws_lambda_function" "sg_remediation" {
  filename         = "sg_remediation.zip"
  function_name    = "${var.project_name}-${var.environment_suffix}-sg-remediation"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.sg_remediation.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60
  tags             = var.common_tags
}

data "archive_file" "sg_remediation" {
  type        = "zip"
  output_path = "sg_remediation.zip"
  source {
    content  = <<EOF
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
ec2 = boto3.client('ec2')

def handler(event, context):
    try:
        detail = event['detail']
        if detail['eventName'] not in ['AuthorizeSecurityGroupIngress', 'RevokeSecurityGroupIngress']:
            return
        
        sg_id = detail['requestParameters']['groupId']
        response = ec2.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]
        
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') in [22, 3389]:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        logger.warning(f"Removing dangerous rule from {sg_id}: {rule}")
                        ec2.revoke_security_group_ingress(GroupId=sg_id, IpPermissions=[rule])
                        
        return {'statusCode': 200, 'body': 'Remediation complete'}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
EOF
    filename = "index.py"
  }
}

resource "aws_cloudwatch_event_rule" "sg_changes" {
  name = "${var.project_name}-${var.environment_suffix}-sg-changes"
  event_pattern = jsonencode({
    source        = ["aws.ec2"]
    "detail-type" = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName   = ["AuthorizeSecurityGroupIngress", "RevokeSecurityGroupIngress"]
    }
  })
  tags = var.common_tags
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.sg_changes.name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.sg_remediation.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sg_remediation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sg_changes.arn
}
