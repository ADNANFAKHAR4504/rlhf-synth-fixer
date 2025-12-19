# Automated Infrastructure Compliance Scanning System

This Terraform configuration deploys an automated compliance scanning system that analyzes Terraform state files, evaluates resources against AWS Config rules, and generates compliance reports with notifications for critical findings.

## File: main.tf

```hcl
# IAM Role for Lambda execution
resource "aws_iam_role" "compliance_lambda" {
  name = "compliance-scanner-lambda-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy" "compliance_lambda_policy" {
  name = "compliance-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.compliance_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.state_files.arn,
          "${aws_s3_bucket.state_files.arn}/*",
          aws_s3_bucket.reports.arn,
          "${aws_s3_bucket.reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.compliance_results.arn
      },
      {
        Effect = "Allow"
        Action = [
          "config:DescribeConfigRules",
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.compliance_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# S3 Bucket for Terraform State Files
resource "aws_s3_bucket" "state_files" {
  bucket = "compliance-state-files-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_files" {
  bucket = aws_s3_bucket.state_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for PDF Reports
resource "aws_s3_bucket" "reports" {
  bucket = "compliance-reports-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceReports"
    CostCenter  = var.cost_center
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    id     = "delete-old-reports"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# DynamoDB Table for Compliance Results
resource "aws_dynamodb_table" "compliance_results" {
  name         = "compliance-results-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resource_id"
  range_key    = "timestamp"

  attribute {
    name = "resource_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "rule_name"
    type = "S"
  }

  global_secondary_index {
    name            = "rule-index"
    hash_key        = "rule_name"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "compliance-config-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "compliance-config-${var.environment_suffix}"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "compliance-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "compliance-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules
resource "aws_config_config_rule" "ec2_instance_type" {
  name = "ec2-instance-type-check-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "DESIRED_INSTANCE_TYPE"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_config_config_rule" "rds_backup_retention" {
  name = "rds-backup-retention-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "DB_BACKUP_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# Lambda Function for State File Processing
resource "aws_lambda_function" "compliance_scanner" {
  filename         = "lambda_function.zip"
  function_name    = "compliance-scanner-${var.environment_suffix}"
  role            = aws_iam_role.compliance_lambda.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_function.zip")
  runtime         = "python3.11"
  timeout         = 900
  memory_size     = 3072

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.compliance_results.name
      REPORTS_BUCKET = aws_s3_bucket.reports.id
      SNS_TOPIC_ARN  = aws_sns_topic.compliance_alerts.arn
    }
  }

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

# SNS Topic for Compliance Alerts
resource "aws_sns_topic" "compliance_alerts" {
  name         = "compliance-alerts-${var.environment_suffix}"
  display_name = "Compliance Alerts"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceAlerts"
    CostCenter  = var.cost_center
  }
}

# EventBridge Rule for Scheduled Scans
resource "aws_cloudwatch_event_rule" "compliance_scan" {
  name                = "compliance-scan-schedule-${var.environment_suffix}"
  description         = "Trigger compliance scans every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = {
    Environment = var.environment
    Purpose     = "ComplianceScanning"
    CostCenter  = var.cost_center
  }
}

resource "aws_cloudwatch_event_target" "compliance_scan" {
  rule      = aws_cloudwatch_event_rule.compliance_scan.name
  target_id = "ComplianceScannerLambda"
  arn       = aws_lambda_function.compliance_scanner.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_scanner.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_scan.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "compliance" {
  dashboard_name = "compliance-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Scanner Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Scanner Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Activity"
        }
      }
    ]
  })
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-2"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "compliance-operations"
}
```

## File: outputs.tf

```hcl
output "config_rule_arns" {
  description = "ARNs of AWS Config rules"
  value = {
    ec2_instance_type   = aws_config_config_rule.ec2_instance_type.arn
    s3_bucket_encryption = aws_config_config_rule.s3_bucket_encryption.arn
    rds_backup_retention = aws_config_config_rule.rds_backup_retention.arn
  }
}

output "lambda_function_name" {
  description = "Name of the compliance scanner Lambda function"
  value       = aws_lambda_function.compliance_scanner.function_name
}

output "reports_bucket_name" {
  description = "Name of the S3 bucket storing compliance reports"
  value       = aws_s3_bucket.reports.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing compliance results"
  value       = aws_dynamodb_table.compliance_results.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance alerts"
  value       = aws_sns_topic.compliance_alerts.arn
}
```

## File: lambda/index.py

```python
import json
import boto3
import os
from datetime import datetime
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
config = boto3.client('config')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
REPORTS_BUCKET = os.environ['REPORTS_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Process Terraform state files and evaluate compliance
    """
    table = dynamodb.Table(DYNAMODB_TABLE)

    # Get list of state files from S3
    state_bucket = event.get('state_bucket', 'terraform-states')
    state_key = event.get('state_key', 'terraform.tfstate')

    try:
        # Read state file
        response = s3.get_object(Bucket=state_bucket, Key=state_key)
        state_content = json.loads(response['Body'].read())

        # Extract resources
        resources = extract_resources(state_content)

        # Evaluate compliance for each resource
        compliance_results = []
        for resource in resources:
            result = evaluate_resource_compliance(resource)
            compliance_results.append(result)

            # Store in DynamoDB
            store_compliance_result(table, result)

            # Check for critical non-compliance
            if result.get('severity', 0) > 8:
                send_critical_alert(result)

        # Generate PDF report
        report_key = generate_pdf_report(compliance_results)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance scan completed',
                'resources_scanned': len(resources),
                'report_location': f's3://{REPORTS_BUCKET}/{report_key}'
            })
        }

    except Exception as e:
        print(f"Error processing state file: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def extract_resources(state_content):
    """Extract resources from Terraform state file"""
    resources = []

    if 'resources' in state_content:
        for resource in state_content['resources']:
            resources.append({
                'type': resource.get('type'),
                'name': resource.get('name'),
                'id': resource.get('instances', [{}])[0].get('attributes', {}).get('id'),
                'attributes': resource.get('instances', [{}])[0].get('attributes', {})
            })

    return resources

def evaluate_resource_compliance(resource):
    """Evaluate resource against compliance rules"""
    compliance_status = 'COMPLIANT'
    severity = 0
    issues = []

    resource_type = resource.get('type', '')
    attributes = resource.get('attributes', {})

    # EC2 Instance Type Check
    if resource_type == 'aws_instance':
        instance_type = attributes.get('instance_type', '')
        if instance_type.startswith('t2.'):
            compliance_status = 'NON_COMPLIANT'
            severity = 5
            issues.append('Legacy instance type detected')

    # S3 Bucket Encryption Check
    elif resource_type == 'aws_s3_bucket':
        encryption = attributes.get('server_side_encryption_configuration')
        if not encryption:
            compliance_status = 'NON_COMPLIANT'
            severity = 9
            issues.append('S3 bucket encryption not enabled')

    # RDS Backup Retention Check
    elif resource_type == 'aws_db_instance':
        backup_retention = attributes.get('backup_retention_period', 0)
        if backup_retention < 7:
            compliance_status = 'NON_COMPLIANT'
            severity = 8
            issues.append('RDS backup retention period less than 7 days')

    return {
        'resource_id': resource.get('id', 'unknown'),
        'resource_type': resource_type,
        'resource_name': resource.get('name', 'unknown'),
        'compliance_status': compliance_status,
        'rule_name': f'{resource_type}_compliance_check',
        'timestamp': int(datetime.now().timestamp()),
        'severity': severity,
        'issues': issues
    }

def store_compliance_result(table, result):
    """Store compliance result in DynamoDB"""
    table.put_item(Item=result)

def send_critical_alert(result):
    """Send SNS notification for critical non-compliance"""
    message = f"""
    Critical Compliance Issue Detected

    Resource ID: {result['resource_id']}
    Resource Type: {result['resource_type']}
    Status: {result['compliance_status']}
    Severity: {result['severity']}
    Issues: {', '.join(result['issues'])}

    Immediate action required.
    """

    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject='Critical Compliance Alert',
        Message=message
    )

def generate_pdf_report(compliance_results):
    """Generate PDF compliance report"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    # Report header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "Infrastructure Compliance Report")

    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Summary
    total_resources = len(compliance_results)
    compliant = sum(1 for r in compliance_results if r['compliance_status'] == 'COMPLIANT')
    non_compliant = total_resources - compliant

    c.drawString(100, 700, f"Total Resources Scanned: {total_resources}")
    c.drawString(100, 680, f"Compliant: {compliant}")
    c.drawString(100, 660, f"Non-Compliant: {non_compliant}")

    # Detailed results
    y_position = 620
    for result in compliance_results[:20]:  # Limit to first 20 for space
        if result['compliance_status'] == 'NON_COMPLIANT':
            c.setFont("Helvetica-Bold", 10)
            c.drawString(100, y_position, f"{result['resource_type']}: {result['resource_name']}")
            y_position -= 15
            c.setFont("Helvetica", 9)
            c.drawString(120, y_position, f"Severity: {result['severity']} - {', '.join(result['issues'])}")
            y_position -= 20

    c.save()

    # Upload to S3
    buffer.seek(0)
    report_key = f"compliance-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"
    s3.put_object(
        Bucket=REPORTS_BUCKET,
        Key=report_key,
        Body=buffer.getvalue(),
        ContentType='application/pdf'
    )

    return report_key
```
