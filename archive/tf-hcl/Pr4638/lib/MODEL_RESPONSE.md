### Reasoning Trace

---

This is a comprehensive request for a CloudFront-based content delivery system for distributing e-books. Let me break down all the requirements and create the necessary Terraform files:

1. **versions.tf**: Terraform >= 1.5, AWS provider >= 5.0, archive provider
2. **providers.tf**: AWS provider with region variable, us-east-1 alias for ACM/Lambda@Edge
3. **variables.tf**: All input variables
4. **s3.tf**: Origin bucket, logging bucket, versioning, lifecycle, encryption, bucket policies
5. **kms.tf**: CMK for S3 encryption
6. **cloudfront.tf**: Distribution, OAI, cache behaviors, custom domain, SSL, WAF association, logging, public key and key group
7. **acm.tf**: Certificate in us-east-1, DNS validation
8. **route53.tf**: Hosted zone if needed, A and AAAA records
9. **lambda-edge-auth.tf**: Lambda function, IAM role/policy, CloudFront association
10. **lambda-edge-auth/index.py**: Authentication logic
11. **dynamodb.tf**: Subscribers table if enabled
12. **lambda-log-processor.tf**: Log processing Lambda
13. **lambda-log-processor/index.py**: Log parsing logic
14. **waf.tf**: WebACL with managed rules
15. **monitoring.tf**: CloudWatch alarms
16. **athena.tf**: Glue database and table if enabled
17. **secrets.tf**: Secrets Manager for private key and JWT secret
18. **outputs.tf**: All outputs
19. **README.md**: Comprehensive documentation

Let me create each file carefully.

### Answer

---

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4.0"
    }
  }
}
```

```hcl
# providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Application = "Publishing"
      Owner       = var.owner_email
      ManagedBy   = "Terraform"
      ContentType = "EBooks"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
      Application = "Publishing"
      Owner       = var.owner_email
      ManagedBy   = "Terraform"
      ContentType = "EBooks"
    }
  }
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources (except ACM and Lambda@Edge)"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "owner_email" {
  description = "Email address of the resource owner"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for CloudFront distribution (e.g., cdn.publishingco.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID. If empty, a new zone will be created"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "glacier_transition_days" {
  description = "Days before transitioning objects to Glacier"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Days to retain CloudFront access logs"
  type        = number
  default     = 365
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  type        = string
}

variable "auth_type" {
  description = "Authentication type for Lambda@Edge (jwt, api, dynamodb)"
  type        = string
  default     = "jwt"
  validation {
    condition     = contains(["jwt", "api", "dynamodb"], var.auth_type)
    error_message = "auth_type must be one of: jwt, api, dynamodb"
  }
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for subscriber authentication"
  type        = string
  default     = "publishing-subscribers"
}

variable "auth_api_endpoint" {
  description = "External API endpoint for authentication (if auth_type=api)"
  type        = string
  default     = ""
}

variable "public_key_pem" {
  description = "Public key PEM for CloudFront signed URLs"
  type        = string
}

variable "create_subscriber_table" {
  description = "Whether to create DynamoDB subscribers table"
  type        = bool
  default     = false
}

variable "enable_athena" {
  description = "Whether to enable Athena integration for log analysis"
  type        = bool
  default     = false
}

variable "rate_limit" {
  description = "WAF rate limit (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "geo_restriction_type" {
  description = "Geo-restriction type (whitelist, blacklist, none)"
  type        = string
  default     = "none"
  validation {
    condition     = contains(["whitelist", "blacklist", "none"], var.geo_restriction_type)
    error_message = "geo_restriction_type must be one of: whitelist, blacklist, none"
  }
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo-restriction"
  type        = list(string)
  default     = []
}

variable "min_ttl" {
  description = "Minimum TTL for cache behavior (seconds)"
  type        = number
  default     = 0
}

variable "default_ttl" {
  description = "Default TTL for cache behavior (seconds)"
  type        = number
  default     = 86400
}

variable "max_ttl" {
  description = "Maximum TTL for cache behavior (seconds)"
  type        = number
  default     = 31536000
}
```

```hcl
# s3.tf
data "aws_caller_identity" "current" {}

# Origin bucket for e-books
resource "aws_s3_bucket" "origin" {
  bucket = "publishing-ebooks-${var.environment}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "origin" {
  bucket = aws_s3_bucket.origin.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "origin" {
  bucket = aws_s3_bucket.origin.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = var.glacier_transition_days
      storage_class = "GLACIER"
    }
  }
}

# Logging bucket
resource "aws_s3_bucket" "logs" {
  bucket = "cloudfront-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

# Origin bucket policy allowing CloudFront OAI
data "aws_iam_policy_document" "origin_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontOAI"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.origin.arn}/*"]
  }

  statement {
    sid    = "AllowCloudFrontListBucket"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }

    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.origin.arn]
  }
}

resource "aws_s3_bucket_policy" "origin" {
  bucket = aws_s3_bucket.origin.id
  policy = data.aws_iam_policy_document.origin_bucket_policy.json
}

# Logging bucket policy for CloudFront
data "aws_iam_policy_document" "logs_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontLogging"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/cdn-access-logs/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
      values   = [aws_kms_key.s3.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.logs_bucket_policy.json
}

# Enable S3 access logging on origin bucket
resource "aws_s3_bucket_logging" "origin" {
  bucket = aws_s3_bucket.origin.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}
```

```hcl
# kms.tf
data "aws_iam_policy_document" "kms_policy" {
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "Allow CloudFront to use the key"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "Allow S3 to use the key"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "Allow Lambda to use the key"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms_policy.json
}

resource "aws_kms_alias" "s3" {
  name          = "alias/kms-publishing-cdn"
  target_key_id = aws_kms_key.s3.key_id
}
```

```hcl
# cloudfront.tf
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.domain_name}"
}

resource "aws_cloudfront_public_key" "signing" {
  name       = "publishing-signing-key-${var.environment}"
  encoded_key = var.public_key_pem
  comment    = "Public key for CloudFront signed URLs"
}

resource "aws_cloudfront_key_group" "signing" {
  name    = "publishing-key-group-${var.environment}"
  items   = [aws_cloudfront_public_key.signing.id]
  comment = "Key group for signed URL generation"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "E-book distribution for ${var.domain_name}"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = [var.domain_name]
  web_acl_id          = aws_wafv2_web_acl.cdn.arn

  origin {
    domain_name = aws_s3_bucket.origin.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.origin.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # Default cache behavior for free content
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.origin.id}"
    compress         = true

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.min_ttl
    default_ttl            = var.default_ttl
    max_ttl                = var.max_ttl

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }
  }

  # Cache behavior for premium content requiring signed URLs
  ordered_cache_behavior {
    path_pattern     = "premium/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.origin.id}"
    compress         = true

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = var.min_ttl
    default_ttl            = var.default_ttl
    max_ttl                = var.max_ttl

    trusted_key_groups = [aws_cloudfront_key_group.signing.id]

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type == "none" ? "none" : var.geo_restriction_type
      locations        = var.geo_restriction_type == "none" ? [] : var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cdn-access-logs/"
    include_cookies = false
  }

  http_version = "http2and3"

  depends_on = [
    aws_s3_bucket_policy.origin,
    aws_s3_bucket_policy.logs
  ]
}
```

```hcl
# acm.tf
resource "aws_acm_certificate" "main" {
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = local.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

```hcl
# route53.tf
locals {
  create_zone = var.hosted_zone_id == ""
  zone_id     = local.create_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.existing[0].zone_id
}

resource "aws_route53_zone" "main" {
  count = local.create_zone ? 1 : 0
  name  = var.domain_name
}

data "aws_route53_zone" "existing" {
  count   = local.create_zone ? 0 : 1
  zone_id = var.hosted_zone_id
}

resource "aws_route53_record" "cdn_a" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cdn_aaaa" {
  zone_id = local.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
```

```hcl
# lambda-edge-auth.tf
data "archive_file" "edge_auth" {
  type        = "zip"
  output_path = "${path.module}/lambda-edge-auth.zip"

  source {
    content  = file("${path.module}/lambda-edge-auth/index.py")
    filename = "index.py"
  }
}

data "aws_iam_policy_document" "edge_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = [
        "lambda.amazonaws.com",
        "edgelambda.amazonaws.com"
      ]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "edge_auth" {
  provider = aws.us_east_1

  name               = "lambda-edge-auth-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.edge_assume_role.json
}

data "aws_iam_policy_document" "edge_auth" {
  statement {
    sid    = "BasicLambdaPermissions"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"]
  }

  statement {
    sid    = "SecretsManagerAccess"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue"
    ]

    resources = [
      aws_secretsmanager_secret.jwt_secret.arn
    ]
  }

  dynamic "statement" {
    for_each = var.auth_type == "dynamodb" ? [1] : []

    content {
      sid    = "DynamoDBAccess"
      effect = "Allow"

      actions = [
        "dynamodb:GetItem"
      ]

      resources = [
        var.create_subscriber_table ? aws_dynamodb_table.subscribers[0].arn : "arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_table_name}"
      ]
    }
  }
}

resource "aws_iam_role_policy" "edge_auth" {
  provider = aws.us_east_1

  name   = "edge-auth-policy"
  role   = aws_iam_role.edge_auth.id
  policy = data.aws_iam_policy_document.edge_auth.json
}

resource "aws_iam_role_policy_attachment" "edge_auth_basic" {
  provider = aws.us_east_1

  role       = aws_iam_role.edge_auth.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "edge_auth" {
  provider = aws.us_east_1

  filename         = data.archive_file.edge_auth.output_path
  function_name    = "publishing-edge-auth-${var.environment}"
  role            = aws_iam_role.edge_auth.arn
  handler         = "index.handler"
  runtime         = "python3.12"
  source_code_hash = data.archive_file.edge_auth.output_base64sha256
  timeout         = 5
  publish         = true

  environment {
    variables = {
      AUTH_TYPE        = var.auth_type
      DYNAMODB_TABLE   = var.dynamodb_table_name
      API_ENDPOINT     = var.auth_api_endpoint
      JWT_SECRET_ARN   = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}
```

```python
# lambda-edge-auth/index.py
import json
import base64
import boto3
import jwt
from urllib.parse import parse_qs
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

AUTH_TYPE = os.environ.get('AUTH_TYPE', 'jwt')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
API_ENDPOINT = os.environ.get('API_ENDPOINT')
JWT_SECRET_ARN = os.environ.get('JWT_SECRET_ARN')

# Initialize clients
if AUTH_TYPE == 'dynamodb':
    dynamodb = boto3.client('dynamodb')
secrets_client = boto3.client('secretsmanager')

def get_jwt_secret():
    """Retrieve JWT secret from Secrets Manager"""
    try:
        response = secrets_client.get_secret_value(SecretId=JWT_SECRET_ARN)
        return json.loads(response['SecretString'])['jwt_secret']
    except Exception as e:
        logger.error(f"Failed to get JWT secret: {str(e)}")
        return None

def handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']
    uri = request['uri']

    # Extract authentication token
    auth_token = None
    if 'cookie' in headers:
        cookies = headers['cookie'][0]['value']
        for cookie in cookies.split(';'):
            if 'auth_token=' in cookie:
                auth_token = cookie.split('auth_token=')[1].strip()
                break

    if not auth_token and 'authorization' in headers:
        auth_header = headers['authorization'][0]['value']
        if auth_header.startswith('Bearer '):
            auth_token = auth_header[7:]

    # Check if this is a premium content request
    is_premium = uri.startswith('/premium/')

    if is_premium:
        # Premium content requires authentication
        if not auth_token:
            return unauthorized_response()

        # Validate token based on auth type
        is_valid = False

        if AUTH_TYPE == 'jwt':
            is_valid = validate_jwt(auth_token)
        elif AUTH_TYPE == 'dynamodb':
            is_valid = validate_dynamodb(auth_token)
        elif AUTH_TYPE == 'api':
            is_valid = validate_api(auth_token)

        if not is_valid:
            return unauthorized_response()

    # Add cache headers
    if 'cache-control' not in headers:
        headers['cache-control'] = [{
            'key': 'Cache-Control',
            'value': 'public, max-age=86400' if not is_premium else 'private, no-cache'
        }]

    return request

def validate_jwt(token):
    """Validate JWT token"""
    try:
        jwt_secret = get_jwt_secret()
        if not jwt_secret:
            return False

        decoded = jwt.decode(token, jwt_secret, algorithms=['HS256'])

        # Check if user has premium subscription
        return decoded.get('subscription_tier') == 'premium'
    except jwt.ExpiredSignatureError:
        logger.info("JWT token expired")
        return False
    except jwt.InvalidTokenError:
        logger.info("Invalid JWT token")
        return False

def validate_dynamodb(token):
    """Validate token against DynamoDB"""
    try:
        response = dynamodb.get_item(
            TableName=DYNAMODB_TABLE,
            Key={'subscriber_id': {'S': token}}
        )

        if 'Item' not in response:
            return False

        item = response['Item']
        tier = item.get('subscription_tier', {}).get('S', '')

        # Check expiration if present
        if 'expiration_timestamp' in item:
            import time
            expiration = int(item['expiration_timestamp']['N'])
            if expiration < time.time():
                return False

        return tier == 'premium'
    except Exception as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return False

def validate_api(token):
    """Validate token against external API"""
    import urllib3
    http = urllib3.PoolManager()

    try:
        response = http.request(
            'GET',
            f"{API_ENDPOINT}/validate",
            headers={'Authorization': f'Bearer {token}'}
        )

        if response.status != 200:
            return False

        data = json.loads(response.data.decode('utf-8'))
        return data.get('subscription_tier') == 'premium'
    except Exception as e:
        logger.error(f"API validation error: {str(e)}")
        return False

def unauthorized_response():
    """Return 403 Forbidden response"""
    return {
        'status': '403',
        'statusDescription': 'Forbidden',
        'headers': {
            'content-type': [{
                'key': 'Content-Type',
                'value': 'application/json'
            }]
        },
        'body': json.dumps({
            'error': 'Unauthorized',
            'message': 'Premium subscription required to access this content'
        })
    }
```

```hcl
# dynamodb.tf
resource "aws_dynamodb_table" "subscribers" {
  count = var.create_subscriber_table ? 1 : 0

  name           = var.dynamodb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "subscriber_id"

  attribute {
    name = "subscriber_id"
    type = "S"
  }

  global_secondary_index {
    name            = "tier-index"
    hash_key        = "subscription_tier"
    projection_type = "ALL"
  }

  attribute {
    name = "subscription_tier"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.s3.arn
  }
}
```

```hcl
# lambda-log-processor.tf
data "archive_file" "log_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda-log-processor.zip"

  source {
    content  = file("${path.module}/lambda-log-processor/index.py")
    filename = "index.py"
  }
}

data "aws_iam_policy_document" "log_processor_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "log_processor" {
  name               = "lambda-log-processor-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.log_processor_assume_role.json
}

data "aws_iam_policy_document" "log_processor" {
  statement {
    sid    = "S3ReadLogs"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.logs.arn,
      "${aws_s3_bucket.logs.arn}/*"
    ]
  }

  statement {
    sid    = "CloudWatchMetrics"
    effect = "Allow"

    actions = [
      "cloudwatch:PutMetricData"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "KMSDecrypt"
    effect = "Allow"

    actions = [
      "kms:Decrypt"
    ]

    resources = [aws_kms_key.s3.arn]
  }
}

resource "aws_iam_role_policy" "log_processor" {
  name   = "log-processor-policy"
  role   = aws_iam_role.log_processor.id
  policy = data.aws_iam_policy_document.log_processor.json
}

resource "aws_iam_role_policy_attachment" "log_processor_basic" {
  role       = aws_iam_role.log_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "log_processor" {
  filename         = data.archive_file.log_processor.output_path
  function_name    = "publishing-log-processor-${var.environment}"
  role            = aws_iam_role.log_processor.arn
  handler         = "index.handler"
  runtime         = "python3.12"
  source_code_hash = data.archive_file.log_processor.output_base64sha256
  timeout         = 300
  memory_size      = 512

  environment {
    variables = {
      LOG_BUCKET = aws_s3_bucket.logs.id
      LOG_PREFIX = "cdn-access-logs/"
    }
  }
}

resource "aws_cloudwatch_event_rule" "daily_log_processing" {
  name                = "daily-log-processing-${var.environment}"
  description         = "Trigger log processing Lambda daily"
  schedule_expression = "cron(0 1 * * ? *)"
}

resource "aws_cloudwatch_event_target" "log_processor" {
  rule      = aws_cloudwatch_event_rule.daily_log_processing.name
  target_id = "LogProcessorLambda"
  arn       = aws_lambda_function.log_processor.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_log_processing.arn
}
```

```python
# lambda-log-processor/index.py
import json
import boto3
import gzip
import re
from datetime import datetime, timedelta
from collections import defaultdict
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudwatch_client = boto3.client('cloudwatch')

LOG_BUCKET = os.environ['LOG_BUCKET']
LOG_PREFIX = os.environ['LOG_PREFIX']

def handler(event, context):
    """Process CloudFront logs and publish metrics to CloudWatch"""

    # Get yesterday's date for processing
    yesterday = datetime.now() - timedelta(days=1)
    date_str = yesterday.strftime('%Y-%m-%d')

    logger.info(f"Processing logs for date: {date_str}")

    # Initialize metrics
    metrics = {
        'total_requests': 0,
        'premium_requests': 0,
        'free_requests': 0,
        'cache_hits': 0,
        'cache_misses': 0,
        'response_times': [],
        'status_codes': defaultdict(int),
        'top_content': defaultdict(int),
        'geo_distribution': defaultdict(int)
    }

    # List and process log files
    try:
        response = s3_client.list_objects_v2(
            Bucket=LOG_BUCKET,
            Prefix=f"{LOG_PREFIX}{date_str}"
        )

        if 'Contents' not in response:
            logger.info(f"No log files found for {date_str}")
            return

        for obj in response['Contents']:
            process_log_file(obj['Key'], metrics)

        # Calculate derived metrics
        cache_hit_ratio = (metrics['cache_hits'] / metrics['total_requests'] * 100) if metrics['total_requests'] > 0 else 0
        avg_response_time = sum(metrics['response_times']) / len(metrics['response_times']) if metrics['response_times'] else 0

        # Publish metrics to CloudWatch
        publish_metrics(metrics, cache_hit_ratio, avg_response_time, date_str)

        # Generate summary report
        report = generate_report(metrics, cache_hit_ratio, avg_response_time, date_str)

        # Save report to S3
        save_report(report, date_str)

    except Exception as e:
        logger.error(f"Error processing logs: {str(e)}")
        raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Successfully processed logs for {date_str}',
            'total_requests': metrics['total_requests']
        })
    }

def process_log_file(key, metrics):
    """Process a single CloudFront log file"""
    try:
        # Download and decompress log file
        response = s3_client.get_object(Bucket=LOG_BUCKET, Key=key)
        content = gzip.decompress(response['Body'].read()).decode('utf-8')

        # Parse log lines
        for line in content.strip().split('\n'):
            if line.startswith('#'):
                continue

            fields = line.split('\t')
            if len(fields) < 23:
                continue

            # Extract fields
            uri = fields[7]
            status_code = fields[8]
            bytes_sent = fields[3]
            time_taken = float(fields[14]) if fields[14] != '-' else 0
            cache_status = fields[13]
            country_code = fields[23] if len(fields) > 23 else 'Unknown'

            # Update metrics
            metrics['total_requests'] += 1

            if uri.startswith('/premium/'):
                metrics['premium_requests'] += 1
            else:
                metrics['free_requests'] += 1

            if cache_status in ['Hit', 'RefreshHit']:
                metrics['cache_hits'] += 1
            else:
                metrics['cache_misses'] += 1

            metrics['response_times'].append(time_taken)
            metrics['status_codes'][status_code] += 1
            metrics['top_content'][uri] += 1
            metrics['geo_distribution'][country_code] += 1

    except Exception as e:
        logger.error(f"Error processing file {key}: {str(e)}")

def publish_metrics(metrics, cache_hit_ratio, avg_response_time, date_str):
    """Publish metrics to CloudWatch"""
    namespace = 'Publishing/CDN'

    metric_data = [
        {
            'MetricName': 'TotalRequests',
            'Value': metrics['total_requests'],
            'Unit': 'Count',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        },
        {
            'MetricName': 'PremiumRequests',
            'Value': metrics['premium_requests'],
            'Unit': 'Count',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        },
        {
            'MetricName': 'FreeRequests',
            'Value': metrics['free_requests'],
            'Unit': 'Count',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        },
        {
            'MetricName': 'CacheHitRatio',
            'Value': cache_hit_ratio,
            'Unit': 'Percent',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        },
        {
            'MetricName': 'AverageResponseTime',
            'Value': avg_response_time,
            'Unit': 'Milliseconds',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        }
    ]

    # Publish status code metrics
    for status_code, count in metrics['status_codes'].items():
        metric_data.append({
            'MetricName': f'StatusCode{status_code}',
            'Value': count,
            'Unit': 'Count',
            'Timestamp': datetime.strptime(date_str, '%Y-%m-%d')
        })

    # Publish in batches of 20
    for i in range(0, len(metric_data), 20):
        batch = metric_data[i:i+20]
        cloudwatch_client.put_metric_data(
            Namespace=namespace,
            MetricData=batch
        )

def generate_report(metrics, cache_hit_ratio, avg_response_time, date_str):
    """Generate summary report"""
    # Get top 10 e-books
    top_books = sorted(metrics['top_content'].items(), key=lambda x: x[1], reverse=True)[:10]

    # Get top 10 countries
    top_countries = sorted(metrics['geo_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]

    report = {
        'date': date_str,
        'summary': {
            'total_requests': metrics['total_requests'],
            'premium_requests': metrics['premium_requests'],
            'free_requests': metrics['free_requests'],
            'cache_hit_ratio': f"{cache_hit_ratio:.2f}%",
            'average_response_time': f"{avg_response_time:.2f}ms"
        },
        'top_ebooks': [{'uri': uri, 'downloads': count} for uri, count in top_books],
        'geographic_distribution': [{'country': country, 'requests': count} for country, count in top_countries],
        'status_codes': dict(metrics['status_codes'])
    }

    return report

def save_report(report, date_str):
    """Save report to S3"""
    report_key = f"reports/{date_str}-cdn-report.json"

    s3_client.put_object(
        Bucket=LOG_BUCKET,
        Key=report_key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json'
    )

    logger.info(f"Report saved to s3://{LOG_BUCKET}/{report_key}")
```

```hcl
# waf.tf
resource "aws_wafv2_web_acl" "cdn" {
  provider = aws.us_east_1

  name  = "publishing-cdn-waf-${var.environment}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Rule - Common Rule Set (OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate-based rule
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Custom rule - Block requests without valid User-Agent
  rule {
    name     = "RequireUserAgent"
    priority = 4

    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          byte_match_statement {
            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"
            search_string         = "Mozilla"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "UserAgentMetric"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule (if enabled)
  dynamic "rule" {
    for_each = var.geo_restriction_type != "none" ? [1] : []

    content {
      name     = "GeoBlockingRule"
      priority = 5

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.geo_restriction_locations
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockingMetric"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PublishingCDNWAF"
    sampled_requests_enabled   = true
  }
}
```

```hcl
# monitoring.tf
resource "aws_cloudwatch_metric_alarm" "error_4xx" {
  alarm_name          = "cdn-4xx-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "4xxErrorRate"
  namespace          = "AWS/CloudFront"
  period             = "300"
  statistic          = "Average"
  threshold          = "5"
  alarm_description  = "This metric monitors 4xx error rate"
  alarm_actions      = [var.sns_topic_arn]
  treat_missing_data = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }
}

resource "aws_cloudwatch_metric_alarm" "error_5xx" {
  alarm_name          = "cdn-5xx-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "5xxErrorRate"
  namespace          = "AWS/CloudFront"
  period             = "300"
  statistic          = "Average"
  threshold          = "1"
  alarm_description  = "This metric monitors 5xx error rate"
  alarm_actions      = [var.sns_topic_arn]
  treat_missing_data = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }
}

resource "aws_cloudwatch_metric_alarm" "total_error_rate" {
  alarm_name          = "cdn-total-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "TotalErrorRate"
  namespace          = "AWS/CloudFront"
  period             = "300"
  statistic          = "Average"
  threshold          = "5"
  alarm_description  = "This metric monitors total error rate"
  alarm_actions      = [var.sns_topic_arn]
  treat_missing_data = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }
}

resource "aws_cloudwatch_metric_alarm" "request_count_low" {
  alarm_name          = "cdn-request-count-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Requests"
  namespace          = "AWS/CloudFront"
  period             = "300"
  statistic          = "Sum"
  threshold          = "100"
  alarm_description  = "This metric monitors for low request count indicating potential outage"
  alarm_actions      = [var.sns_topic_arn]
  treat_missing_data = "breaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }
}
```

```hcl
# athena.tf
resource "aws_glue_catalog_database" "cloudfront_logs" {
  count = var.enable_athena ? 1 : 0

  name = "cloudfront_logs_${var.environment}"
}

resource "aws_glue_catalog_table" "cloudfront_logs" {
  count = var.enable_athena ? 1 : 0

  name          = "cloudfront_access_logs"
  database_name = aws_glue_catalog_database.cloudfront_logs[0].name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "skip.header.line.count" = "2"
    "compressionType"        = "gzip"
    "typeOfData"            = "file"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.logs.id}/cdn-access-logs/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "CloudFrontLogsSerde"
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"

      parameters = {
        "field.delim" = "\t"
      }
    }

    columns {
      name = "date"
      type = "date"
    }

    columns {
      name = "time"
      type = "string"
    }

    columns {
      name = "x_edge_location"
      type = "string"
    }

    columns {
      name = "sc_bytes"
      type = "bigint"
    }

    columns {
      name = "c_ip"
      type = "string"
    }

    columns {
      name = "cs_method"
      type = "string"
    }

    columns {
      name = "cs_host"
      type = "string"
    }

    columns {
      name = "cs_uri_stem"
      type = "string"
    }

    columns {
      name = "sc_status"
      type = "int"
    }

    columns {
      name = "cs_referer"
      type = "string"
    }

    columns {
      name = "cs_user_agent"
      type = "string"
    }

    columns {
      name = "cs_uri_query"
      type = "string"
    }

    columns {
      name = "cs_cookie"
      type = "string"
    }

    columns {
      name = "x_edge_result_type"
      type = "string"
    }

    columns {
      name = "x_edge_request_id"
      type = "string"
    }

    columns {
      name = "x_host_header"
      type = "string"
    }

    columns {
      name = "cs_protocol"
      type = "string"
    }

    columns {
      name = "cs_bytes"
      type = "bigint"
    }

    columns {
      name = "time_taken"
      type = "double"
    }

    columns {
      name = "x_forwarded_for"
      type = "string"
    }

    columns {
      name = "ssl_protocol"
      type = "string"
    }

    columns {
      name = "ssl_cipher"
      type = "string"
    }

    columns {
      name = "x_edge_response_result_type"
      type = "string"
    }

    columns {
      name = "cs_protocol_version"
      type = "string"
    }

    columns {
      name = "fle_status"
      type = "string"
    }

    columns {
      name = "fle_encrypted_fields"
      type = "int"
    }

    columns {
      name = "c_port"
      type = "int"
    }

    columns {
      name = "time_to_first_byte"
      type = "double"
    }

    columns {
      name = "x_edge_detailed_result_type"
      type = "string"
    }

    columns {
      name = "sc_content_type"
      type = "string"
    }

    columns {
      name = "sc_content_len"
      type = "bigint"
    }

    columns {
      name = "sc_range_start"
      type = "bigint"
    }

    columns {
      name = "sc_range_end"
      type = "bigint"
    }
  }
}
```

```hcl
# secrets.tf
resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "publishing-jwt-secret-${var.environment}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id

  # Placeholder - user must update this value
  secret_string = jsonencode({
    jwt_secret = "PLACEHOLDER_JWT_SECRET_PLEASE_UPDATE"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "signing_private_key" {
  name = "publishing-signing-private-key-${var.environment}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_secretsmanager_secret_version" "signing_private_key" {
  secret_id = aws_secretsmanager_secret.signing_private_key.id

  # Placeholder - user must update with actual private key
  secret_string = jsonencode({
    private_key = "PLACEHOLDER_PRIVATE_KEY_PLEASE_UPDATE"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
```

```hcl
# outputs.tf
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 origin bucket"
  value       = aws_s3_bucket.origin.id
}

output "route53_record_fqdn" {
  description = "Fully qualified domain name of the Route 53 record"
  value       = aws_route53_record.cdn_a.fqdn
}

output "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.oai.id
}

output "lambda_edge_function_arn" {
  description = "ARN of the Lambda@Edge authentication function"
  value       = aws_lambda_function.edge_auth.qualified_arn
}

output "log_bucket_name" {
  description = "Name of the CloudFront logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.cdn.arn
}

output "public_key_id" {
  description = "CloudFront public key ID for signed URLs"
  value       = aws_cloudfront_public_key.signing.id
}

output "key_group_id" {
  description = "CloudFront key group ID for signed URLs"
  value       = aws_cloudfront_key_group.signing.id
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "private_key_secret_arn" {
  description = "ARN of the private key secret in Secrets Manager"
  value       = aws_secretsmanager_secret.signing_private_key.arn
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB subscribers table (if created)"
  value       = var.create_subscriber_table ? aws_dynamodb_table.subscribers[0].name : null
}

output "glue_database_name" {
  description = "Name of the Glue database for Athena queries (if enabled)"
  value       = var.enable_athena ? aws_glue_catalog_database.cloudfront_logs[0].name : null
}
```

```markdown
# README.md

# Publishing Company E-Book CDN Infrastructure

This Terraform configuration deploys a production-ready CloudFront-based content delivery system for distributing e-books to premium subscribers.

## Architecture Overview
```

┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ Publishers │────▶│ S3 Origin │◀────│ CloudFront │
└─────────────┘ └──────────────┘ └─────────────┘
│ │
▼ │
┌──────────────┐ │
│ Lifecycle │ ▼
│ (→ Glacier) │ ┌─────────────┐
└──────────────┘ │ Lambda@Edge │
│ Auth │
└─────────────┘
│
┌──────────────┐ ▼
│ DynamoDB │◀──────────────┘
│ Subscribers │
└──────────────┘

┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│ CloudWatch │◀────│ Lambda │◀────│ S3 Logs │
│ Metrics │ │ Log Processor│ │ Bucket │
└─────────────┘ └──────────────┘ └─────────────┘

````

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.5.0
- An SNS topic for CloudWatch alarms
- A domain name for the CDN

## Deployment Steps

1. **Generate RSA key pair for CloudFront signed URLs:**
   ```bash
   # Generate private key
   openssl genrsa -out private_key.pem 2048

   # Generate public key
   openssl rsa -pubout -in private_key.pem -out public_key.pem

   # Convert public key to format CloudFront expects
   PUBLIC_KEY=$(cat public_key.pem)
````

2. **Create `terraform.tfvars` file:**
   ```h

   ```
