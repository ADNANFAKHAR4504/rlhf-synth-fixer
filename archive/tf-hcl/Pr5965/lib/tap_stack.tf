# KMS Key for S3 Encryption
resource "aws_kms_key" "document_storage" {
  description             = "KMS key for document storage encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "document-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_kms_alias" "document_storage" {
  name          = "alias/document-storage-${var.environment_suffix}"
  target_key_id = aws_kms_key.document_storage.key_id
}

# S3 Bucket for Document Storage
resource "aws_s3_bucket" "documents" {
  bucket = "secure-documents-${var.environment_suffix}"

  tags = {
    Name        = "documents-bucket-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.document_storage.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-documents"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "documents" {
  bucket = aws_s3_bucket.documents.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "document-logs-${var.environment_suffix}"

  tags = {
    Name        = "logs-bucket-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "documents" {
  comment = "OAI for secure document access - ${var.environment_suffix}"
}

# S3 Bucket Policy for CloudFront OAI
resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.documents.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.documents.arn}/*"
      }
    ]
  })
}

# CloudWatch Log Group for CloudFront
resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/aws/cloudfront/documents-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name        = "cloudfront-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/waf/documents-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name        = "waf-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for Lambda@Edge
resource "aws_cloudwatch_log_group" "lambda_edge" {
  name              = "/aws/lambda/us-east-1.document-auth-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name        = "lambda-edge-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for Lambda@Edge
resource "aws_iam_role" "lambda_edge" {
  name = "lambda-edge-execution-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "lambda-edge-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_edge_secrets" {
  name = "lambda-edge-secrets-${var.environment_suffix}"
  role = aws_iam_role.lambda_edge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.jwt_secret.arn
      }
    ]
  })
}

# Lambda@Edge Function for JWT Validation
data "archive_file" "lambda_edge" {
  type        = "zip"
  output_path = "${path.module}/lambda_edge.zip"

  source {
    content  = <<EOF
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

let cachedSecret = null;
let cacheExpiry = 0;

async function getJwtSecret() {
  const now = Date.now();
  if (cachedSecret && now < cacheExpiry) {
    return cachedSecret;
  }

  const secretArn = process.env.JWT_SECRET_ARN;
  const response = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
  cachedSecret = JSON.parse(response.SecretString).jwt_secret;
  cacheExpiry = now + (5 * 60 * 1000); // Cache for 5 minutes

  return cachedSecret;
}

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Check for Authorization header
  if (!headers.authorization || headers.authorization.length === 0) {
    console.log('Missing Authorization header');
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Missing authorization token'
    };
  }

  const authHeader = headers.authorization[0].value;
  const token = authHeader.replace('Bearer ', '');

  try {
    const jwtSecret = await getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);

    console.log('Token validated successfully for user:', decoded.sub);

    // Add user info to custom headers for downstream processing
    request.headers['x-user-id'] = [{ key: 'X-User-Id', value: decoded.sub }];

    return request;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return {
      status: '403',
      statusDescription: 'Forbidden',
      body: 'Invalid or expired token'
    };
  }
};
EOF
    filename = "index.js"
  }

  source {
    content  = <<EOF
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  }
}
EOF
    filename = "package.json"
  }
}

resource "aws_lambda_function" "auth_viewer_request" {
  filename         = data.archive_file.lambda_edge.output_path
  function_name    = "document-auth-${var.environment_suffix}"
  role             = aws_iam_role.lambda_edge.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_edge.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 5
  publish          = true

  environment {
    variables = {
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }

  tags = {
    Name        = "lambda-auth-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "cloudfront" {
  name  = "document-waf-${var.environment_suffix}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "SQLInjectionProtection"
    priority = 2

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          body {
            oversize_handling = "CONTINUE"
          }
        }

        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "DocumentWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "waf-acl-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "cloudfront" {
  resource_arn            = aws_wafv2_web_acl.cloudfront.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "documents" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Secure document distribution - ${var.environment_suffix}"
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn

  origin {
    domain_name = aws_s3_bucket.documents.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.documents.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.documents.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.documents.id}"

    forwarded_values {
      query_string = false
      headers      = ["Authorization"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.auth_viewer_request.qualified_arn
      include_body = false
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Name        = "cloudfront-distribution-${var.environment_suffix}"
    Environment = var.environment_suffix
  }

  depends_on = [
    aws_cloudwatch_log_group.cloudfront,
    aws_lambda_function.auth_viewer_request
  ]
}

# DynamoDB Table for Document Metadata
resource "aws_dynamodb_table" "document_metadata" {
  name         = "document-metadata-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "documentId"
  range_key    = "version"

  attribute {
    name = "documentId"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.document_storage.arn
  }

  tags = {
    Name        = "document-metadata-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Secrets Manager for API Keys
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "api-keys-${var.environment_suffix}"
  description             = "API keys for document management system"
  recovery_window_in_days = 7

  tags = {
    Name        = "api-keys-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key    = "initial-key-${var.environment_suffix}"
    created_at = timestamp()
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Secrets Manager for JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "jwt-secret-${var.environment_suffix}"
  description             = "JWT secret for Lambda@Edge authentication"
  recovery_window_in_days = 7

  tags = {
    Name        = "jwt-secret-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    jwt_secret = var.jwt_secret
  })
}

# IAM Role for Secrets Rotation Lambda
resource "aws_iam_role" "secrets_rotation" {
  name = "secrets-rotation-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "secrets-rotation-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "secrets_rotation_basic" {
  role       = aws_iam_role.secrets_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "secrets_rotation" {
  name = "secrets-rotation-policy-${var.environment_suffix}"
  role = aws_iam_role.secrets_rotation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      }
    ]
  })
}

# Lambda Function for Secrets Rotation
data "archive_file" "secrets_rotation" {
  type        = "zip"
  output_path = "${path.module}/secrets_rotation.zip"

  source {
    content  = <<EOF
import json
import boto3
import os
import secrets

client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    if step == "createSecret":
        # Generate new API key
        new_api_key = secrets.token_urlsafe(32)
        current = client.get_secret_value(SecretId=arn, VersionStage='AWSCURRENT')
        current_dict = json.loads(current['SecretString'])

        # Create new version with AWSPENDING stage
        new_secret = {
            'api_key': new_api_key,
            'previous_key': current_dict.get('api_key'),
            'created_at': context.invoked_function_arn
        }

        client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(new_secret),
            VersionStages=['AWSPENDING']
        )

    elif step == "setSecret":
        # In production, update dependent services here
        pass

    elif step == "testSecret":
        # Test the new secret
        pass

    elif step == "finishSecret":
        # Move AWSCURRENT stage to new version
        client.update_secret_version_stage(
            SecretId=arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=client.describe_secret(SecretId=arn)['VersionIdsToStages']
        )

    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully completed {step}')
    }
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "secrets_rotation" {
  filename         = data.archive_file.secrets_rotation.output_path
  function_name    = "secrets-rotation-${var.environment_suffix}"
  role             = aws_iam_role.secrets_rotation.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.secrets_rotation.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30

  tags = {
    Name        = "secrets-rotation-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_lambda_permission" "secrets_rotation" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Secrets Rotation Schedule
resource "aws_secretsmanager_secret_rotation" "api_keys" {
  secret_id           = aws_secretsmanager_secret.api_keys.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_lambda_permission.secrets_rotation]
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "security-alerts-${var.environment_suffix}"

  tags = {
    Name        = "security-alerts-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarm for WAF Blocks
resource "aws_cloudwatch_metric_alarm" "waf_blocks" {
  alarm_name          = "waf-high-blocks-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 3600
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Alert when WAF blocks exceed 50 requests per hour"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.cloudfront.name
    Region = "us-east-1"
    Rule   = "ALL"
  }

  tags = {
    Name        = "waf-alarm-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Systems Manager Parameter Store
resource "aws_ssm_parameter" "allowed_extensions" {
  name        = "/document-management/${var.environment_suffix}/allowed-extensions"
  description = "Allowed file extensions for document uploads"
  type        = "StringList"
  value       = join(",", var.allowed_file_extensions)

  tags = {
    Name        = "allowed-extensions-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_ssm_parameter" "cloudfront_url" {
  name        = "/document-management/${var.environment_suffix}/cloudfront-url"
  description = "CloudFront distribution URL for document access"
  type        = "String"
  value       = aws_cloudfront_distribution.documents.domain_name

  tags = {
    Name        = "cloudfront-url-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_ssm_parameter" "dynamodb_table" {
  name        = "/document-management/${var.environment_suffix}/dynamodb-table"
  description = "DynamoDB table name for document metadata"
  type        = "String"
  value       = aws_dynamodb_table.document_metadata.name

  tags = {
    Name        = "dynamodb-table-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
