Here's a Terraform HCL implementation for an automated compliance monitoring system using AWS Config, Lambda, CloudWatch, and SNS.

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "security_team_emails" {
  description = "List of security team email addresses for alerts"
  type        = list(string)
  default     = ["security@example.com"]
}

variable "config_evaluation_frequency" {
  description = "Frequency for Config rule evaluation in hours"
  type        = number
  default     = 6
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 180
}

variable "dashboard_refresh_interval" {
  description = "CloudWatch dashboard refresh interval in seconds"
  type        = number
  default     = 300
}
```

## File: main.tf

```hcl
# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config_bucket" {
  bucket = "compliance-config-${var.environment_suffix}"
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "config-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetBucketLocation"
      ]
      Resource = [
        aws_s3_bucket.config_bucket.arn,
        "${aws_s3_bucket.config_bucket.arn}/*"
      ]
    }]
  })
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "compliance-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
    include_global_resources = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "compliance-channel-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rule: S3 Bucket Encryption
resource "aws_config_config_rule" "s3_encryption" {
  name = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rule: RDS Public Access
resource "aws_config_config_rule" "rds_public_access" {
  name = "rds-instance-public-access-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_INSTANCE_PUBLIC_ACCESS_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# SNS Topics for Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "compliance-critical-${var.environment_suffix}"
}

resource "aws_sns_topic" "warning_alerts" {
  name = "compliance-warning-${var.environment_suffix}"
}

resource "aws_sns_topic_subscription" "critical_email" {
  count     = length(var.security_team_emails)
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_emails[count.index]
}

resource "aws_sns_topic_subscription" "warning_email" {
  count     = length(var.security_team_emails)
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_emails[count.index]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "compliance_lambda_logs" {
  name              = "/aws/lambda/compliance-analyzer-${var.environment_suffix}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "tagging_lambda_logs" {
  name              = "/aws/lambda/compliance-tagger-${var.environment_suffix}"
  retention_in_days = 14
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "compliance-lambda-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "compliance-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule",
          "config:DescribeConfigRules"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.critical_alerts.arn,
          aws_sns_topic.warning_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "s3:PutBucketTagging",
          "rds:AddTagsToResource"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function: Compliance Analyzer
resource "aws_lambda_function" "compliance_analyzer" {
  filename      = "lambda/compliance_analyzer.zip"
  function_name = "compliance-analyzer-${var.environment_suffix}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_timeout

  environment {
    variables = {
      CRITICAL_TOPIC_ARN = aws_sns_topic.critical_alerts.arn
      WARNING_TOPIC_ARN  = aws_sns_topic.warning_alerts.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  depends_on = [aws_cloudwatch_log_group.compliance_lambda_logs]
}

# Lambda Function: Resource Tagger
resource "aws_lambda_function" "compliance_tagger" {
  filename      = "lambda/compliance_tagger.zip"
  function_name = "compliance-tagger-${var.environment_suffix}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_timeout

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  depends_on = [aws_cloudwatch_log_group.tagging_lambda_logs]
}

# EventBridge Rule: Daily Compliance Analysis
resource "aws_cloudwatch_event_rule" "daily_compliance_check" {
  name                = "daily-compliance-check-${var.environment_suffix}"
  description         = "Trigger compliance analysis daily"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "compliance_analyzer_target" {
  rule      = aws_cloudwatch_event_rule.daily_compliance_check.name
  target_id = "ComplianceAnalyzerTarget"
  arn       = aws_lambda_function.compliance_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge_analyzer" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_compliance_check.arn
}

# EventBridge Rule: Config Compliance Change
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "config-compliance-change-${var.environment_suffix}"
  description = "Trigger on Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
  })
}

resource "aws_cloudwatch_event_target" "tagger_target" {
  rule      = aws_cloudwatch_event_rule.config_compliance_change.name
  target_id = "ComplianceTaggerTarget"
  arn       = aws_lambda_function.compliance_tagger.arn
}

resource "aws_lambda_permission" "allow_eventbridge_tagger" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_tagger.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "compliance_dashboard" {
  dashboard_name = "compliance-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["ComplianceMetrics", "CompliancePercentage", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Overall Compliance Percentage"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["ComplianceMetrics", "NonCompliantResources", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Non-Compliant Resources"
        }
      }
    ]
  })
}

# CloudWatch Metric Alarms
resource "aws_cloudwatch_metric_alarm" "low_compliance" {
  alarm_name          = "low-compliance-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CompliancePercentage"
  namespace           = "ComplianceMetrics"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when compliance falls below 80%"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
}
```

## File: lambda/compliance_analyzer/index.js

```javascript
const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand, GetComplianceDetailsByConfigRuleCommand } = require('@aws-sdk/client-config-service');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Starting compliance analysis...');

    // Get compliance summary
    const complianceCommand = new DescribeComplianceByConfigRuleCommand({});
    const complianceData = await configClient.send(complianceCommand);

    let totalRules = 0;
    let compliantRules = 0;
    let nonCompliantResources = 0;

    if (complianceData.ComplianceByConfigRules) {
      for (const rule of complianceData.ComplianceByConfigRules) {
        totalRules++;

        if (rule.Compliance && rule.Compliance.ComplianceType === 'COMPLIANT') {
          compliantRules++;
        } else if (rule.Compliance && rule.Compliance.ComplianceType === 'NON_COMPLIANT') {
          // Get details of non-compliant resources
          const detailsCommand = new GetComplianceDetailsByConfigRuleCommand({
            ConfigRuleName: rule.ConfigRuleName,
            ComplianceTypes: ['NON_COMPLIANT']
          });

          const details = await configClient.send(detailsCommand);
          if (details.EvaluationResults) {
            nonCompliantResources += details.EvaluationResults.length;
          }
        }
      }
    }

    const compliancePercentage = totalRules > 0 ? (compliantRules / totalRules) * 100 : 100;

    // Put metrics to CloudWatch
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'ComplianceMetrics',
      MetricData: [
        {
          MetricName: 'CompliancePercentage',
          Value: compliancePercentage,
          Unit: 'Percent',
          Timestamp: new Date()
        },
        {
          MetricName: 'NonCompliantResources',
          Value: nonCompliantResources,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }));

    // Send alerts if compliance is low
    if (compliancePercentage < 80) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.CRITICAL_TOPIC_ARN,
        Subject: 'CRITICAL: Compliance Below 80%',
        Message: `Compliance percentage: ${compliancePercentage.toFixed(2)}%\nNon-compliant resources: ${nonCompliantResources}`
      }));
    } else if (compliancePercentage < 95) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.WARNING_TOPIC_ARN,
        Subject: 'WARNING: Compliance Below 95%',
        Message: `Compliance percentage: ${compliancePercentage.toFixed(2)}%\nNon-compliant resources: ${nonCompliantResources}`
      }));
    }

    console.log(`Compliance analysis complete. Percentage: ${compliancePercentage.toFixed(2)}%`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        compliancePercentage,
        nonCompliantResources,
        totalRules,
        compliantRules
      })
    };
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    throw error;
  }
};
```

## File: lambda/compliance_tagger/index.js

```javascript
const { EC2Client, CreateTagsCommand } = require('@aws-sdk/client-ec2');
const { S3Client, PutBucketTaggingCommand, GetBucketTaggingCommand } = require('@aws-sdk/client-s3');
const { RDSClient, AddTagsToResourceCommand, ListTagsForResourceCommand } = require('@aws-sdk/client-rds');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Config compliance change event:', JSON.stringify(event, null, 2));

    const detail = event.detail;
    const resourceType = detail.resourceType;
    const resourceId = detail.resourceId;
    const complianceType = detail.newEvaluationResult.complianceType;

    if (complianceType !== 'NON_COMPLIANT') {
      console.log('Resource is compliant, no tagging needed');
      return { statusCode: 200 };
    }

    const tags = [
      {
        Key: 'ComplianceStatus',
        Value: 'NonCompliant'
      },
      {
        Key: 'ComplianceCheckDate',
        Value: new Date().toISOString()
      }
    ];

    // Tag based on resource type
    if (resourceType === 'AWS::S3::Bucket') {
      console.log(`Tagging S3 bucket: ${resourceId}`);

      // Get existing tags
      let existingTags = [];
      try {
        const getTagsResponse = await s3Client.send(new GetBucketTaggingCommand({ Bucket: resourceId }));
        existingTags = getTagsResponse.TagSet || [];
      } catch (err) {
        console.log('No existing tags or error getting tags');
      }

      // Merge tags
      const mergedTags = [...existingTags, ...tags];

      await s3Client.send(new PutBucketTaggingCommand({
        Bucket: resourceId,
        Tagging: { TagSet: mergedTags }
      }));

    } else if (resourceType === 'AWS::RDS::DBInstance') {
      console.log(`Tagging RDS instance: ${resourceId}`);

      await rdsClient.send(new AddTagsToResourceCommand({
        ResourceName: resourceId,
        Tags: tags.map(t => ({ Key: t.Key, Value: t.Value }))
      }));

    } else if (resourceType.startsWith('AWS::EC2::')) {
      console.log(`Tagging EC2 resource: ${resourceId}`);

      await ec2Client.send(new CreateTagsCommand({
        Resources: [resourceId],
        Tags: tags
      }));
    }

    console.log(`Successfully tagged ${resourceType}: ${resourceId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource tagged successfully' })
    };
  } catch (error) {
    console.error('Error tagging resource:', error);
    throw error;
  }
};
```

## File: outputs.tf

```hcl
output "config_bucket_name" {
  description = "Name of the S3 bucket for AWS Config"
  value       = aws_s3_bucket.config_bucket.bucket
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "compliance_analyzer_function_name" {
  description = "Name of the compliance analyzer Lambda function"
  value       = aws_lambda_function.compliance_analyzer.function_name
}

output "compliance_tagger_function_name" {
  description = "Name of the compliance tagger Lambda function"
  value       = aws_lambda_function.compliance_tagger.function_name
}

output "dashboard_url" {
  description = "URL to the CloudWatch compliance dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.compliance_dashboard.dashboard_name}"
}
```

## File: README.md

```markdown
# AWS Compliance Monitoring Infrastructure

This Terraform configuration deploys a comprehensive compliance monitoring system for AWS infrastructure.

## Architecture

- **AWS Config**: Monitors S3 encryption and RDS public access
- **Lambda Functions**: Analyze compliance and tag non-compliant resources
- **CloudWatch**: Metrics, dashboards, and event triggers
- **SNS**: Multi-level alerting (critical and warning)

## Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured
- Node.js 18.x (for Lambda functions)

## Deployment

1. Install Lambda dependencies and create deployment packages:
   ```bash
   cd lambda/compliance_analyzer
   npm install
   zip -r ../compliance_analyzer.zip .
   cd ../compliance_tagger
   npm install
   zip -r ../compliance_tagger.zip .
   cd ../..
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Plan deployment:
   ```bash
   terraform plan -var="environment_suffix=dev"
   ```

4. Apply configuration:
   ```bash
   terraform apply -var="environment_suffix=dev"
   ```

## Configuration

Update `variables.tf` or provide values via command line:

- `environment_suffix`: Unique identifier for resources
- `security_team_emails`: Email addresses for alerts
- `aws_region`: Deployment region (default: eu-central-1)
- `lambda_timeout`: Lambda execution timeout (default: 180 seconds)

## Outputs

- `config_bucket_name`: S3 bucket for Config data
- `critical_alerts_topic_arn`: SNS topic for critical alerts
- `warning_alerts_topic_arn`: SNS topic for warning alerts
- `dashboard_url`: CloudWatch dashboard URL
```
